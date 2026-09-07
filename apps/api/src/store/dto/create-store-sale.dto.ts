import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateStoreSaleDto {
  @ApiProperty({ example: '2026-09-06' }) @IsDateString() date!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() itemId?: string;
  @ApiProperty() @IsString() itemName!: string;
  @ApiProperty({ required: false, default: 1 }) @IsOptional() @IsInt() @Min(1) qty?: number;
  @ApiProperty() @IsInt() @Min(0) unitPrice!: number;
  @ApiProperty({ enum: ['Cash', 'UPI', 'Credit Card'] }) @IsIn(['Cash', 'UPI', 'Credit Card']) method!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
}
