import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { hashPin } from '../auth/pin.util';
import type { CreateStaffDto } from './dto/create-staff.dto';
import type { ResetPinDto } from './dto/reset-pin.dto';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  list() {
    return this.prisma.staff.findMany({ select: { id: true, name: true, role: true, createdAt: true }, orderBy: { name: 'asc' } });
  }

  async create(dto: CreateStaffDto) {
    const { hash, salt } = hashPin(dto.pin);
    const staff = await this.prisma.staff.create({
      data: { name: dto.name, role: dto.role, pinHash: hash, pinSalt: salt },
    });
    return { id: staff.id, name: staff.name, role: staff.role };
  }

  async resetPin(id: string, dto: ResetPinDto) {
    const { hash, salt } = hashPin(dto.pin);
    try {
      await this.prisma.staff.update({ where: { id }, data: { pinHash: hash, pinSalt: salt } });
    } catch {
      throw new NotFoundException('Staff member not found');
    }
    // Force re-login everywhere on PIN reset — an old refresh token
    // shouldn't survive a PIN change.
    await this.redis.revokeRefreshToken(id);
    return { ok: true };
  }

  async remove(id: string) {
    const count = await this.prisma.staff.count();
    if (count <= 1) throw new BadRequestException('Cannot remove the last staff member');
    try {
      await this.prisma.staff.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Staff member not found');
    }
    await this.redis.revokeRefreshToken(id);
    return { ok: true };
  }
}
