import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsString()
  staffId!: string;

  @ApiProperty({ example: '1234' })
  @Matches(/^\d{4,6}$/, { message: 'PIN must be 4-6 digits' })
  pin!: string;
}
