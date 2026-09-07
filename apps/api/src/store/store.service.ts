import { Injectable, NotFoundException } from '@nestjs/common';
import { LIVE_EVENTS } from '@camp-dilly/shared';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import type { CreateStoreSaleDto } from './dto/create-store-sale.dto';

const toDateOnly = (d: Date) => d.toISOString().slice(0, 10);
const toJson = (row: {
  id: string; date: Date; itemId: string | null; itemName: string; qty: number; unitPrice: number;
  amount: number; method: string; notes: string | null; createdAt: Date;
}) => ({
  id: row.id, date: toDateOnly(row.date), itemId: row.itemId ?? '', itemName: row.itemName, qty: row.qty,
  unitPrice: row.unitPrice, amount: row.amount, method: row.method, notes: row.notes ?? '', createdAt: row.createdAt,
});

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService, private readonly events: EventsGateway) {}

  async list(from?: string, to?: string) {
    const rows = await this.prisma.incomeStore.findMany({
      where: { date: { gte: from ? new Date(from) : new Date('0000-01-01'), lte: to ? new Date(to) : new Date('9999-12-31') } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(toJson);
  }

  async create(dto: CreateStoreSaleDto, user: AuthUser) {
    const qty = dto.qty ?? 1;
    const row = await this.prisma.incomeStore.create({
      data: {
        date: new Date(dto.date), itemId: dto.itemId ?? '', itemName: dto.itemName, qty,
        unitPrice: dto.unitPrice, amount: Math.round(qty * dto.unitPrice), method: dto.method,
        notes: dto.notes ?? '', createdById: user.id,
      },
    });
    this.events.broadcast(LIVE_EVENTS.STORE_CHANGED);
    return toJson(row);
  }

  async remove(id: string) {
    const existing = await this.prisma.incomeStore.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Sale not found');
    await this.prisma.incomeStore.delete({ where: { id } });
    this.events.broadcast(LIVE_EVENTS.STORE_CHANGED);
    return { ok: true };
  }
}
