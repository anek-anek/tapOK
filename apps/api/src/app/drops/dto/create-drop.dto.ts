import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  IsEnum,
} from 'class-validator';
import { DropCategory } from '../../../common';

export class CreateDropDto {
  @ApiProperty({ example: 'Beach Sunset Shoot' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '2026-05-10T18:00:00.000Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiProperty({ example: 'Sunset Beach, Manila' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  expectedHeadcount?: number;

  @ApiPropertyOptional({ example: 'This is a fun beach shoot' })
  @IsOptional()
  @IsString()
  overview?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ enum: DropCategory, example: DropCategory.HANGOUT })
  @IsOptional()
  @IsEnum(DropCategory)
  category?: DropCategory;

  @ApiPropertyOptional({ example: 'uuid-string' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
