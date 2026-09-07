import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IncomeDayService } from './income-day.service';
import { CreateDayEntryDto } from './dto/create-day-entry.dto';
import { UpdateBalanceDto } from '../common/dto/update-balance.dto';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('income-day')
@ApiBearerAuth()
@Controller('income/day')
export class IncomeDayController {
  constructor(private readonly service: IncomeDayService) {}

  @Get()
  list(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.list(from, to);
  }

  @Post()
  create(@Body() dto: CreateDayEntryDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: CreateDayEntryDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/balance')
  updateBalance(@Param('id') id: string, @Body() dto: UpdateBalanceDto) {
    return this.service.updateBalance(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
