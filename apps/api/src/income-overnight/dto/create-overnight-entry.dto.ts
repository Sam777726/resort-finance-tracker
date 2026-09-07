import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class SplitDto {
  @ApiProperty() @IsInt() @Min(0) cash!: number;
  @ApiProperty() @IsInt() @Min(0) upi!: number;
  @ApiProperty() @IsInt() @Min(0) cc!: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(0) cheque?: number;
}

class AdvanceDto {
  @ApiProperty() @IsInt() @Min(0) amount!: number;
  @ApiProperty({ required: false, nullable: true }) @IsOptional() @IsDateString() date?: string | null;
  @ApiProperty({ type: SplitDto }) @ValidateNested() @Type(() => SplitDto) split!: SplitDto;
}

class BalanceDto {
  @ApiProperty({ enum: ['pending', 'received'] }) @IsIn(['pending', 'received']) status!: 'pending' | 'received';
  @ApiProperty({ type: SplitDto, required: false }) @IsOptional() @ValidateNested() @Type(() => SplitDto) split?: SplitDto;
  @ApiProperty({ required: false, nullable: true }) @IsOptional() @IsDateString() receivedDate?: string | null;
}

export class CreateOvernightEntryDto {
  @ApiProperty({ example: '2026-09-06' }) @IsDateString() checkIn!: string;
  @ApiProperty() @IsInt() @Min(1) nights!: number;
  @ApiProperty() @IsString() unitId!: string;

  @ApiProperty() @IsBoolean() manualExtra!: boolean;
  @ApiProperty() @IsInt() @Min(0) paxBelow5!: number;
  @ApiProperty() @IsInt() @Min(0) pax5to10!: number;
  @ApiProperty() @IsInt() @Min(0) paxAbove10!: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(0) extraBelow5?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(0) extra5to10?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(0) extraAbove10?: number;

  @ApiProperty({ type: AdvanceDto }) @ValidateNested() @Type(() => AdvanceDto) advance!: AdvanceDto;
  @ApiProperty({ type: BalanceDto }) @ValidateNested() @Type(() => BalanceDto) balance!: BalanceDto;

  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
}
