import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Queue } from 'bullmq';

function monthRange(date: Date) {
  const from = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const to = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  return { from, to };
}

/** Cache warming: recompute "this month"'s report at 2am every night so
 * the first person opening Reports in the morning gets a cache hit
 * instead of paying for the aggregation query. A cron job whose only
 * effect is queuing work (not running it inline) so a slow Postgres
 * aggregation never blocks — or gets tied to — the scheduler tick itself. */
@Injectable()
export class ReportScheduler {
  private readonly logger = new Logger(ReportScheduler.name);

  constructor(@InjectQueue('reports') private readonly reportsQueue: Queue) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async warmMonthlyReportCache() {
    const { from, to } = monthRange(new Date());
    this.logger.log(`Scheduling nightly report cache warm for ${from}..${to}`);
    await this.reportsQueue.add('recompute', { from, to }, { removeOnComplete: 20, removeOnFail: 20 });
  }
}
