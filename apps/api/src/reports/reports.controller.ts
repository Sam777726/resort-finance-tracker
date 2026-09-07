import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { SummaryQueryDto } from './dto/summary-query.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('summary')
  summary(@Query() query: SummaryQueryDto) {
    return this.reports.getSummary(query.from, query.to);
  }

  @Post('recompute')
  @Roles('admin')
  recompute(@Query() query: SummaryQueryDto) {
    return this.reports.enqueueRecompute(query.from, query.to);
  }
}
