import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  getAll() {
    return this.settings.getBundle();
  }

  @Put(':key')
  @Roles('admin')
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settings.updateKey(key, dto.value);
  }
}
