import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsDateString, IsOptional, Min, ValidateNested } from 'class-validator';

class SplitDto {
  @ApiProperty() @IsInt() @Min(0) cash!: number;
  @ApiProperty() @IsInt() @Min(0) upi!: number;
  @ApiProperty() @IsInt() @Min(0) cc!: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(0) cheque?: number;
}

export class UpdateBalanceDto {
  @ApiProperty({ enum: ['pending', 'received'] })
  @IsIn(['pending', 'received'])
  status!: 'pending' | 'received';

  @ApiProperty({ type: SplitDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => SplitDto)
  split?: SplitDto;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  receivedDate?: string | null;
}
