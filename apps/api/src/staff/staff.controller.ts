import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { ResetPinDto } from './dto/reset-pin.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('staff')
@ApiBearerAuth()
@Controller('staff')
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  list() {
    return this.staff.list();
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateStaffDto) {
    return this.staff.create(dto);
  }

  @Patch(':id/pin')
  @Roles('admin')
  resetPin(@Param('id') id: string, @Body() dto: ResetPinDto) {
    return this.staff.resetPin(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.staff.remove(id);
  }
}
