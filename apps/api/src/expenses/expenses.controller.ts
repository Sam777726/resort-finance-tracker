import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('expenses')
@ApiBearerAuth()
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly service: ExpensesService) {}

  @Get()
  list(@Query('from') from?: string, @Query('to') to?: string, @Query('category') category?: string) {
    return this.service.list(from, to, category);
  }

  @Post()
  create(@Body() dto: CreateExpenseDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
