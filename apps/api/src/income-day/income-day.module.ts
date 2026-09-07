import { Module } from '@nestjs/common';
import { IncomeDayController } from './income-day.controller';
import { IncomeDayService } from './income-day.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [IncomeDayController],
  providers: [IncomeDayService],
})
export class IncomeDayModule {}
