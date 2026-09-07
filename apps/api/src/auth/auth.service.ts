import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { hashPin, verifyPin } from './pin.util';
import type { AppConfig } from '../config/configuration';
import type { LoginDto } from './dto/login.dto';
import type { SetupDto } from './dto/setup.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
export interface PublicUser {
  id: string;
  name: string;
  role: 'admin' | 'staff';
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

/** Access token: short-lived (15m default), signed & verified stateless —
 * no DB/Redis lookup needed on every authenticated request.
 * Refresh token: longer-lived, its hash is stored in Redis keyed by staff
 * id and rotated on every use (old hash overwritten) — a leaked refresh
 * token can be killed instantly via revokeRefreshToken without touching
 * Postgres, and reusing an old rotated token is rejected because its hash
 * no longer matches what's in Redis. */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async staffRoster(): Promise<PublicUser[]> {
    const staff = await this.prisma.staff.findMany({ select: { id: true, name: true, role: true }, orderBy: { name: 'asc' } });
    return staff;
  }

  async setup(dto: SetupDto): Promise<{ user: PublicUser } & AuthTokens> {
    const count = await this.prisma.staff.count();
    if (count > 0) throw new ConflictException('Setup already completed — use login instead');

    const { hash, salt } = hashPin(dto.pin);
    const staff = await this.prisma.staff.create({
      data: { name: dto.name, role: 'admin', pinHash: hash, pinSalt: salt },
    });
    return this.issueSession(staff.id, staff.name, staff.role);
  }

  async login(dto: LoginDto): Promise<{ user: PublicUser } & AuthTokens> {
    const staff = await this.prisma.staff.findUnique({ where: { id: dto.staffId } });
    if (!staff || !verifyPin(dto.pin, staff.pinHash, staff.pinSalt)) {
      throw new UnauthorizedException('Incorrect PIN');
    }
    return this.issueSession(staff.id, staff.name, staff.role);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, { secret: this.config.get('jwt.refreshSecret', { infer: true }) });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedHash = await this.redis.getRefreshTokenHash(payload.sub);
    if (!storedHash || storedHash !== sha256(refreshToken)) {
      throw new UnauthorizedException('Refresh token was revoked or already rotated');
    }

    const staff = await this.prisma.staff.findUnique({ where: { id: payload.sub } });
    if (!staff) throw new UnauthorizedException('Staff member no longer exists');

    const { accessToken, refreshToken: newRefreshToken } = await this.signTokenPair(staff.id, staff.name, staff.role);
    await this.redis.storeRefreshToken(staff.id, sha256(newRefreshToken), this.config.get('jwt.refreshTtlSeconds', { infer: true }));
    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(staffId: string) {
    await this.redis.revokeRefreshToken(staffId);
  }

  private async issueSession(id: string, name: string, role: 'admin' | 'staff') {
    const tokens = await this.signTokenPair(id, name, role);
    await this.redis.storeRefreshToken(id, sha256(tokens.refreshToken), this.config.get('jwt.refreshTtlSeconds', { infer: true }));
    return { user: { id, name, role }, ...tokens };
  }

  private async signTokenPair(sub: string, name: string, role: 'admin' | 'staff'): Promise<AuthTokens> {
    const payload = { sub, name, role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get('jwt.accessSecret', { infer: true }),
      expiresIn: this.config.get('jwt.accessTtl', { infer: true }),
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get('jwt.refreshSecret', { infer: true }),
      expiresIn: this.config.get('jwt.refreshTtlSeconds', { infer: true }),
    });
    return { accessToken, refreshToken };
  }
}
