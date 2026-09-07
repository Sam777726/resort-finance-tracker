import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class ResetPinDto {
  @ApiProperty({ example: '1234' })
  @Matches(/^\d{4,6}$/, { message: 'PIN must be 4-6 digits' })
  pin!: string;
}
