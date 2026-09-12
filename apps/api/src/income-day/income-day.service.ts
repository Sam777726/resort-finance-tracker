import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { IncomeDay } from '@prisma/client';
import { computeDayPicnic, LIVE_EVENTS, type DayPackage } from '@camp-dilly/shared';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { EventsGateway } from '../events/events.gateway';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import type { CreateDayEntryDto } from './dto/create-day-entry.dto';
import type { UpdateBalanceDto } from '../common/dto/update-balance.dto';

const toDateOnly = (d: Date) => d.toISOString().slice(0, 10);

function toJson(row: IncomeDay) {
  return {
    id: row.id,
    date: toDateOnly(row.date),
    packageId: row.packageId,
    packageLabel: row.packageLabel,
    rate: row.rate,
    walkIn: row.walkIn,
    tentId: row.tentId ?? '',
    tentName: row.tentName ?? '',
    paxBelow5: row.paxBelow5,
    pax5to10: row.pax5to10,
    paxAbove10: row.paxAbove10,
    totalPax: row.totalPax,
    meals: row.meals,
    amount: row.amount,
    discountAmount: row.discountAmount,
    grossAmount: row.amount + row.discountAmount,
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
export class IncomeDayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly events: EventsGateway,
  ) {}

  async list(from?: string, to?: string) {
    const rows = await this.prisma.incomeDay.findMany({
      where: {
        date: {
          gte: from ? new Date(from) : new Date('0000-01-01'),
          lte: to ? new Date(to) : new Date('9999-12-31'),
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(toJson);
  }

  async create(dto: CreateDayEntryDto, user: AuthUser) {
    const payload = await this.buildPayload(dto);
    const row = await this.prisma.incomeDay.create({
      data: { ...payload, createdById: user.id },
    });
    this.events.broadcast(LIVE_EVENTS.DAY_CHANGED);
    return toJson(row);
  }

  async update(id: string, dto: CreateDayEntryDto) {
    await this.assertExists(id);
    const payload = await this.buildPayload(dto);
    const row = await this.prisma.incomeDay.update({ where: { id }, data: payload });
    this.events.broadcast(LIVE_EVENTS.DAY_CHANGED);
    return toJson(row);
  }

  async updateBalance(id: string, dto: UpdateBalanceDto) {
    await this.assertExists(id);
    const received = dto.status === 'received';
    const row = await this.prisma.incomeDay.update({
      where: { id },
      data: {
        balanceStatus: dto.status,
        balanceSplit: received ? (dto.split as object) ?? {} : {},
        balanceRecvAt: received ? new Date(dto.receivedDate ?? new Date().toISOString().slice(0, 10)) : null,
      },
    });
    this.events.broadcast(LIVE_EVENTS.DAY_CHANGED);
    return toJson(row);
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.incomeDay.delete({ where: { id } });
    this.events.broadcast(LIVE_EVENTS.DAY_CHANGED);
    return { ok: true };
  }

  private async assertExists(id: string) {
    const row = await this.prisma.incomeDay.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Entry not found');
    return row;
  }

  /** Server-side recompute is the authoritative one — the client sends raw
   * pax counts and a package id, never the amount; this is what stops a
   * tampered client request from writing an arbitrary price. */
  private async buildPayload(dto: CreateDayEntryDto) {
    const bundle = await this.settings.getBundle();
    const packages = (bundle.day_packages as { items: DayPackage[] }).items;
    const pkg = packages.find((p) => p.id === dto.packageId) ?? packages[0];
    if (!pkg) throw new BadRequestException('No day packages configured');
    const walkInSurcharge = (bundle.general as { walkInSurcharge: number }).walkInSurcharge;

    const { totalPax, amount, discountAmount, meals } = computeDayPicnic(dto, pkg, walkInSurcharge);
    if (totalPax === 0) throw new BadRequestException('Add at least 1 pax');

    const partial = dto.partial;
    const balanceAmount = Math.max(0, amount - dto.advance.amount - (partial?.amount ?? 0));
    const received = dto.balance.status === 'received';

    return {
      date: new Date(dto.date),
      packageId: pkg.id,
      packageLabel: pkg.label,
      rate: pkg.rate,
      walkIn: dto.walkIn,
      tentId: dto.tentId ?? '',
      tentName: dto.tentName ?? '',
      paxBelow5: dto.paxBelow5,
      pax5to10: dto.pax5to10,
      paxAbove10: dto.paxAbove10,
      totalPax,
      meals: meals as object,
      amount,
      discountAmount,
      advanceAmount: dto.advance.amount,
      advanceDate: dto.advance.date ? new Date(dto.advance.date) : null,
      advanceSplit: dto.advance.split as object,
      partialAmount: partial?.amount ?? 0,
      partialDate: partial?.date ? new Date(partial.date) : null,
      partialSplit: (partial?.split as object) ?? {},
      balanceAmount,
      balanceStatus: dto.balance.status,
      balanceSplit: received ? ((dto.balance.split as object) ?? {}) : {},
      balanceRecvAt: received ? new Date(dto.balance.receivedDate ?? dto.date) : null,
      notes: dto.notes ?? '',
    };
  }
}
