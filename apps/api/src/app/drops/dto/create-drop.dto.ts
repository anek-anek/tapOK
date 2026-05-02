import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  Max,
  IsEnum,
  ValidateIf,
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

  @ApiPropertyOptional({
    nullable: true,
    type: Number,
    description: 'Minimum attendee age (≥). Only stored when category is party.',
  })
  @IsOptional()
  @ValidateIf((o) => o.category === DropCategory.PARTY && o.minimumAge != null)
  @IsInt()
  @Min(1)
  @Max(99)
  minimumAge?: number | null;

  @ApiPropertyOptional({ example: 'uuid-string' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiPropertyOptional({
    description: 'Optional JPG/PNG cover as data URL; max 5MB decoded size.',
  })
  @IsOptional()
  @IsString()
  coverPhotoBase64?: string;
}
