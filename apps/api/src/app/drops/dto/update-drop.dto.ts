import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  Max,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DropCategory, DropStatus } from '../../../common';

export class UpdateDropItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isAssignable?: boolean;
}

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

  @ApiPropertyOptional({ example: 'Updated overview' })
  @IsOptional()
  @IsString()
  overview?: string;

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

  @ApiPropertyOptional({
    nullable: true,
    type: Number,
    description: 'Minimum attendee age for party drops; null clears the restriction.',
  })
  @IsOptional()
  @ValidateIf((o) => o.minimumAge != null)
  @IsInt()
  @Min(1)
  @Max(99)
  minimumAge?: number | null;

  @ApiPropertyOptional({
    type: 'array',
    items: {
      oneOf: [
        { type: 'string' },
        { $ref: '#/components/schemas/UpdateDropItemDto' },
      ],
    },
    example: ['New Item', { id: 'uuid', name: 'Existing Item', isAssignable: false }],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Object, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: '__type',
      subTypes: [
        { value: String, name: 'string' },
        { value: UpdateDropItemDto, name: 'object' },
      ],
    },
  })
  neededItems?: (string | UpdateDropItemDto)[];
}
