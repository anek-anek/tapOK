import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DropStatus } from '../../../common';

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

  @ApiPropertyOptional({ description: 'Lock the drop so new joiners require approval' })
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @ApiPropertyOptional({ enum: DropStatus, description: 'Manually override the drop status' })
  @IsOptional()
  @IsEnum(DropStatus)
  status?: DropStatus;
}
