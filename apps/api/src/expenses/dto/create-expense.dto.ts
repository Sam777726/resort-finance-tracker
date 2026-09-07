import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({ example: '2026-09-06' }) @IsDateString() date!: string;
  @ApiProperty() @IsString() primary!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() sub?: string;
  @ApiProperty() @IsPositive() amount!: number;
  @ApiProperty({ enum: ['Cash', 'UPI', 'Credit Card', 'Cheque'] }) @IsIn(['Cash', 'UPI', 'Credit Card', 'Cheque']) method!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() vendor?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
}
