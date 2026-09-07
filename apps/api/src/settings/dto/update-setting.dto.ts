import { ApiProperty } from '@nestjs/swagger';
import { IsDefined } from 'class-validator';

export class UpdateSettingDto {
  @ApiProperty({ description: 'Replacement JSON value for this settings key' })
  @IsDefined()
  value!: unknown;
}
