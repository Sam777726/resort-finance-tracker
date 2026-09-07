import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches, MinLength } from 'class-validator';

export class CreateStaffDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ enum: ['admin', 'staff'] })
  @IsIn(['admin', 'staff'])
  role!: 'admin' | 'staff';

  @ApiProperty({ example: '1234' })
  @Matches(/^\d{4,6}$/, { message: 'PIN must be 4-6 digits' })
  pin!: string;
}
