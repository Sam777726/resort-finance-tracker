import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class SetupDto {
  @ApiProperty({ example: 'Dhaval' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: '1234', description: '4-6 digit PIN' })
  @Matches(/^\d{4,6}$/, { message: 'PIN must be 4-6 digits' })
  pin!: string;
}
