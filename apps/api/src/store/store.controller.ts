import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StoreService } from './store.service';
import { CreateStoreSaleDto } from './dto/create-store-sale.dto';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('store')
@ApiBearerAuth()
@Controller('income/store')
export class StoreController {
  constructor(private readonly service: StoreService) {}

  @Get()
  list(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.list(from, to);
  }

  @Post()
  create(@Body() dto: CreateStoreSaleDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
