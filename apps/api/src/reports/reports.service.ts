import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

const TTL_MS = 60_000; // reports tolerate a little staleness; unlike settings this is TTL-only, no explicit invalidation
const dateOnly = (d: Date) => d.toISOString().slice(0, 10);

export interface ReportSummary {
  range: { from: string; to: string };
  income: {
    dayTotal: number; dayCount: number;
    overnightTotal: number; overnightCount: number; roomRevenue: number; foodCostValue: number;
    storeTotal: number; storeCount: number;
    grandTotal: number;
  };
  expenses: { total: number; byCategory: Record<string, number>; kitchenTotal: number };
  paymentTotals: { cash: number; upi: number; cc: number; cheque: number };
  pending: Array<{ id: string; kind: 'day' | 'overnight'; refDate: string; amount: number }>;
  computedAt: string;
  cached: boolean;
}

/** Same cache-aside shape as SettingsService, deliberately different
 * consistency policy: a report can be up to a minute stale (TTL-only, no
 * write-triggered eviction) because "is this graph one booking behind"
 * isn't operationally significant the way "did the price list update"
 * is for SettingsService. Pick the caching strategy the actual read has,
 * not the same one everywhere out of habit. */
@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @InjectQueue('reports') private readonly reportsQueue: Queue,
  ) {}

  async getSummary(from: string, to: string): Promise<ReportSummary> {
    const cacheKey = `report:${from}:${to}`;
    try {
      const cached = await this.cache.get<ReportSummary>(cacheKey);
      if (cached) return { ...cached, cached: true };
    } catch (err) {
      this.logger.warn(`Cache read failed: ${(err as Error).message}`);
    }

    const summary = await this.computeSummary(from, to);
    try {
      await this.cache.set(cacheKey, summary, TTL_MS);
    } catch (err) {
      this.logger.warn(`Cache write failed (non-fatal): ${(err as Error).message}`);
    }
    return summary;
  }

  /** Enqueues a BullMQ job to recompute + cache this range in the
   * background and returns immediately — used by the nightly scheduler
   * (cache warming for "this month" before anyone opens the app) and
   * available on-demand via POST /reports/recompute for an admin who just
   * fixed a batch of entries and wants the dashboard caught up now. */
  async enqueueRecompute(from: string, to: string) {
    await this.reportsQueue.add('recompute', { from, to }, { removeOnComplete: 20, removeOnFail: 20 });
    return { queued: true, from, to };
  }

  /** The actual aggregation — called both on a cache miss and by the
   * BullMQ processor. Fetches rows in range and reduces in JS for the
   * income sources (modest data volume for a single resort), but uses a
   * real Prisma groupBy for the expense category breakdown to show that
   * path too. */
  async computeSummary(from: string, to: string): Promise<ReportSummary> {
    const gte = new Date(from);
    const lte = new Date(to);

    const [dayRows, overnightRows, storeRows, expenseTotal, expenseByCategory, kitchenTotal] = await Promise.all([
      this.prisma.incomeDay.findMany({ where: { date: { gte, lte } } }),
      this.prisma.incomeOvernight.findMany({ where: { checkIn: { gte, lte } } }),
      this.prisma.incomeStore.findMany({ where: { date: { gte, lte } } }),
      this.prisma.expense.aggregate({ where: { date: { gte, lte } }, _sum: { amount: true } }),
      this.prisma.expense.groupBy({ by: ['primary'], where: { date: { gte, lte } }, _sum: { amount: true } }),
      this.prisma.expense.aggregate({ where: { date: { gte, lte }, primary: 'Kitchen Expenses' }, _sum: { amount: true } }),
    ]);

    const dayTotal = dayRows.reduce((s, r) => s + r.amount, 0);
    const overnightTotal = overnightRows.reduce((s, r) => s + r.totalAmount, 0);
    const roomRevenue = overnightRows.reduce((s, r) => s + r.roomRevenue, 0);
    const foodCostValue = overnightRows.reduce((s, r) => s + r.foodCostValue, 0);
    const storeTotal = storeRows.reduce((s, r) => s + r.amount, 0);

    const paymentTotals = { cash: 0, upi: 0, cc: 0, cheque: 0 };
    const addSplit = (split: unknown) => {
      const s = split as { cash?: number; upi?: number; cc?: number; cheque?: number } | null;
      if (!s) return;
      paymentTotals.cash += s.cash ?? 0;
      paymentTotals.upi += s.upi ?? 0;
      paymentTotals.cc += s.cc ?? 0;
      paymentTotals.cheque += s.cheque ?? 0;
    };
    for (const r of dayRows) { addSplit(r.advanceSplit); if (r.balanceStatus === 'received') addSplit(r.balanceSplit); }
    for (const r of overnightRows) { addSplit(r.advanceSplit); if (r.balanceStatus === 'received') addSplit(r.balanceSplit); }
    for (const r of storeRows) {
      const m = r.method.toLowerCase();
      if (m === 'cash') paymentTotals.cash += r.amount;
      else if (m === 'upi') paymentTotals.upi += r.amount;
      else if (m.includes('card')) paymentTotals.cc += r.amount;
    }

    const pending = [
      ...dayRows.filter((r) => r.balanceStatus === 'pending').map((r) => ({ id: r.id, kind: 'day' as const, refDate: dateOnly(r.date), amount: r.balanceAmount })),
      ...overnightRows.filter((r) => r.balanceStatus === 'pending').map((r) => ({ id: r.id, kind: 'overnight' as const, refDate: dateOnly(r.checkIn), amount: r.balanceAmount })),
    ].sort((a, b) => (a.refDate < b.refDate ? -1 : 1));

    return {
      range: { from, to },
      income: {
        dayTotal, dayCount: dayRows.length,
        overnightTotal, overnightCount: overnightRows.length, roomRevenue, foodCostValue,
        storeTotal, storeCount: storeRows.length,
        grandTotal: dayTotal + overnightTotal + storeTotal,
      },
      expenses: {
        total: expenseTotal._sum.amount ?? 0,
        byCategory: Object.fromEntries(expenseByCategory.map((g) => [g.primary, g._sum.amount ?? 0])),
        kitchenTotal: kitchenTotal._sum.amount ?? 0,
      },
      paymentTotals,
      pending,
      computedAt: new Date().toISOString(),
      cached: false,
    };
  }

  /** Used by the BullMQ processor — computes and writes straight into the
   * cache without going through the HTTP request path. */
  async computeAndCache(from: string, to: string) {
    const summary = await this.computeSummary(from, to);
    await this.cache.set(`report:${from}:${to}`, summary, TTL_MS);
    return summary;
  }
}
