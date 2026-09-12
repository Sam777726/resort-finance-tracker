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
    const target = await this.prisma.staff.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Staff member not found');

    const count = await this.prisma.staff.count();
    if (count <= 1) throw new BadRequestException('Cannot remove the last staff member');

    // Settings, staff management, and report recompute are all
    // admin-only — removing the last admin while staff accounts remain
    // would permanently lock the resort out of all three with no way
    // back in short of a direct database edit.
    if (target.role === 'admin') {
      const adminCount = await this.prisma.staff.count({ where: { role: 'admin' } });
      if (adminCount <= 1) throw new BadRequestException('Cannot remove the last admin — add another admin account first');
    }

    await this.prisma.staff.delete({ where: { id } });
    await this.redis.revokeRefreshToken(id);
    return { ok: true };
  }
}
