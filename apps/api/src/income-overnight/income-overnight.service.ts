import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { IncomeOvernight } from '@prisma/client';
import { computeOvernight, LIVE_EVENTS, type TentType } from '@camp-dilly/shared';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { EventsGateway } from '../events/events.gateway';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import type { CreateOvernightEntryDto } from './dto/create-overnight-entry.dto';
import type { UpdateBalanceDto } from '../common/dto/update-balance.dto';

const toDateOnly = (d: Date) => d.toISOString().slice(0, 10);

function toJson(row: IncomeOvernight) {
  return {
    id: row.id,
    checkIn: toDateOnly(row.checkIn),
    nights: row.nights,
    unitId: row.unitId,
    unitName: row.unitName,
    capacity: row.capacity,
    baseRate: row.baseRate,
    paxBelow5: row.paxBelow5,
    pax5to10: row.pax5to10,
    paxAbove10: row.paxAbove10,
    totalPax: row.totalPax,
    manualExtra: row.manualExtra,
    extraBelow5: row.extraBelow5,
    extra5to10: row.extra5to10,
    extraAbove10: row.extraAbove10,
    baseAmount: row.baseAmount,
    extraCharge: row.extraCharge,
    totalAmount: row.totalAmount,
    foodCostValue: row.foodCostValue,
    roomRevenue: row.roomRevenue,
    meals: row.meals,
    discountAmount: row.discountAmount,
    grossAmount: row.totalAmount + row.discountAmount,
    advance: { amount: row.advanceAmount, date: row.advanceDate ? toDateOnly(row.advanceDate) : null, split: row.advanceSplit },
    partial: { amount: row.partialAmount, date: row.partialDate ? toDateOnly(row.partialDate) : null, split: row.partialSplit ?? {} },
    balance: {
      amount: row.balanceAmount,
      status: row.balanceStatus,
      split: row.balanceSplit,
      receivedDate: row.balanceRecvAt ? toDateOnly(row.balanceRecvAt) : null,
    },
    notes: row.notes ?? '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class IncomeOvernightService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly events: EventsGateway,
  ) {}

  async list(from?: string, to?: string) {
    const rows = await this.prisma.incomeOvernight.findMany({
      where: {
        checkIn: {
          gte: from ? new Date(from) : new Date('0000-01-01'),
          lte: to ? new Date(to) : new Date('9999-12-31'),
        },
      },
      orderBy: [{ checkIn: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(toJson);
  }

  async create(dto: CreateOvernightEntryDto, user: AuthUser) {
    const payload = await this.buildPayload(dto);
    const row = await this.prisma.incomeOvernight.create({ data: { ...payload, createdById: user.id } });
    this.events.broadcast(LIVE_EVENTS.OVERNIGHT_CHANGED);
    return toJson(row);
  }

  async update(id: string, dto: CreateOvernightEntryDto) {
    await this.assertExists(id);
    const payload = await this.buildPayload(dto);
    const row = await this.prisma.incomeOvernight.update({ where: { id }, data: payload });
    this.events.broadcast(LIVE_EVENTS.OVERNIGHT_CHANGED);
    return toJson(row);
  }

  async updateBalance(id: string, dto: UpdateBalanceDto) {
    await this.assertExists(id);
    const received = dto.status === 'received';
    const row = await this.prisma.incomeOvernight.update({
      where: { id },
      data: {
        balanceStatus: dto.status,
        balanceSplit: received ? (dto.split as object) ?? {} : {},
        balanceRecvAt: received ? new Date(dto.receivedDate ?? new Date().toISOString().slice(0, 10)) : null,
      },
    });
    this.events.broadcast(LIVE_EVENTS.OVERNIGHT_CHANGED);
    return toJson(row);
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.incomeOvernight.delete({ where: { id } });
    this.events.broadcast(LIVE_EVENTS.OVERNIGHT_CHANGED);
    return { ok: true };
  }

  private async assertExists(id: string) {
    const row = await this.prisma.incomeOvernight.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Entry not found');
    return row;
  }

  private async buildPayload(dto: CreateOvernightEntryDto) {
    const bundle = await this.settings.getBundle();
    const units = (bundle.tent_types as { items: TentType[] }).items;
    const unit = units.find((u) => u.id === dto.unitId) ?? units[0];
    if (!unit) throw new BadRequestException('No room/tent types configured');
    const extraRates = bundle.extra_person_rates as { below5: number; age5to10: number; above10: number };
    const foodCostPerHead = (bundle.general as { foodCostPerHead: number }).foodCostPerHead;

    const c = computeOvernight(dto, unit, extraRates, foodCostPerHead);
    if (c.totalPax === 0) throw new BadRequestException('Add at least 1 pax');

    const partial = dto.partial;
    const balanceAmount = Math.max(0, c.totalAmount - dto.advance.amount - (partial?.amount ?? 0));
    const received = dto.balance.status === 'received';

    return {
      checkIn: new Date(dto.checkIn),
      nights: c.nights,
      unitId: unit.id,
      unitName: unit.name,
      capacity: unit.capacity,
      baseRate: unit.rate,
      paxBelow5: dto.paxBelow5,
      pax5to10: dto.pax5to10,
      paxAbove10: dto.paxAbove10,
      totalPax: c.totalPax,
      manualExtra: dto.manualExtra,
      extraBelow5: c.extraBelow5,
      extra5to10: c.extra5to10,
      extraAbove10: c.extraAbove10,
      baseAmount: c.baseAmount,
      extraCharge: c.extraCharge,
      totalAmount: c.totalAmount,
      foodCostValue: c.foodCostValue,
      roomRevenue: c.roomRevenue,
      meals: c.meals as object,
      discountAmount: c.discountAmount,
      advanceAmount: dto.advance.amount,
      advanceDate: dto.advance.date ? new Date(dto.advance.date) : null,
      advanceSplit: dto.advance.split as object,
      partialAmount: partial?.amount ?? 0,
      partialDate: partial?.date ? new Date(partial.date) : null,
      partialSplit: (partial?.split as object) ?? {},
      balanceAmount,
      balanceStatus: dto.balance.status,
      balanceSplit: received ? ((dto.balance.split as object) ?? {}) : {},
      balanceRecvAt: received ? new Date(dto.balance.receivedDate ?? dto.checkIn) : null,
      notes: dto.notes ?? '',
    };
  }
}
