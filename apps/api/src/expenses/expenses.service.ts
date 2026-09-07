import { Injectable, NotFoundException } from '@nestjs/common';
import { LIVE_EVENTS } from '@camp-dilly/shared';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import type { CreateExpenseDto } from './dto/create-expense.dto';

const toDateOnly = (d: Date) => d.toISOString().slice(0, 10);
const toJson = (row: {
  id: string; date: Date; primary: string; sub: string | null; amount: number;
  method: string; vendor: string | null; description: string | null; createdAt: Date;
}) => ({
  id: row.id, date: toDateOnly(row.date), primary: row.primary, sub: row.sub ?? '', amount: row.amount,
  method: row.method, vendor: row.vendor ?? '', description: row.description ?? '', createdAt: row.createdAt,
});

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService, private readonly events: EventsGateway) {}

  async list(from?: string, to?: string, category?: string) {
    const rows = await this.prisma.expense.findMany({
      where: {
        date: { gte: from ? new Date(from) : new Date('0000-01-01'), lte: to ? new Date(to) : new Date('9999-12-31') },
        ...(category ? { primary: category } : {}),
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(toJson);
  }

  async create(dto: CreateExpenseDto, user: AuthUser) {
    const row = await this.prisma.expense.create({
      data: {
        date: new Date(dto.date), primary: dto.primary, sub: dto.sub ?? '', amount: dto.amount,
        method: dto.method, vendor: dto.vendor ?? '', description: dto.description ?? '', createdById: user.id,
      },
    });
    this.events.broadcast(LIVE_EVENTS.EXPENSE_CHANGED);
    return toJson(row);
  }

  async remove(id: string) {
    const existing = await this.prisma.expense.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Expense not found');
    await this.prisma.expense.delete({ where: { id } });
    this.events.broadcast(LIVE_EVENTS.EXPENSE_CHANGED);
    return { ok: true };
  }
}
