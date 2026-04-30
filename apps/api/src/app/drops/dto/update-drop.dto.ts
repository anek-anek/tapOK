import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { DropCategory, DropStatus } from '../../../common';

export class UpdateDropDto {
  @ApiPropertyOptional({ example: 'Golden Hour Shoot' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ example: '2026-05-15T18:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ example: 'Rizal Park, Manila' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  location?: string;

  @ApiPropertyOptional({ example: 20, nullable: true, type: Number })
  @IsOptional()
  @IsInt()
  @Min(1)
  expectedHeadcount?: number | null;

  @ApiPropertyOptional({ description: 'Lock the drop so new joiners require approval' })
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @ApiPropertyOptional({ description: 'Set visibility to public or private' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ enum: DropStatus, description: 'Manually override the drop status' })
  @IsOptional()
  @IsEnum(DropStatus)
  status?: DropStatus;

  @ApiPropertyOptional({ enum: DropCategory, example: DropCategory.HANGOUT })
  @IsOptional()
  @IsEnum(DropCategory)
  category?: DropCategory;
}
