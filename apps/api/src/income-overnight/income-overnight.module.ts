import { Module } from '@nestjs/common';
import { IncomeOvernightController } from './income-overnight.controller';
import { IncomeOvernightService } from './income-overnight.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [IncomeOvernightController],
  providers: [IncomeOvernightService],
})
export class IncomeOvernightModule {}
