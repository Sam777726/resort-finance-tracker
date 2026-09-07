import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportProcessor } from './report.processor';
import { ReportScheduler } from './report.scheduler';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [ScheduleModule.forRoot(), BullModule.registerQueue({ name: 'reports' }), ReportsModule],
  providers: [ReportProcessor, ReportScheduler],
})
export class JobsModule {}
