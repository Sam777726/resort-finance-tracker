import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { ReportsService } from '../reports/reports.service';

interface RecomputeJobData {
  from: string;
  to: string;
}

/** Consumes the 'reports' queue. Two producers feed it: ReportsService's
 * on-demand /reports/recompute endpoint, and ReportScheduler's nightly
 * cron — same job, same worker, whether a human or the clock asked for it. */
@Processor('reports')
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(private readonly reports: ReportsService) {
    super();
  }

  async process(job: Job<RecomputeJobData>): Promise<void> {
    const { from, to } = job.data;
    this.logger.log(`Recomputing report cache for ${from}..${to} (job ${job.id})`);
    await this.reports.computeAndCache(from, to);
  }
}
