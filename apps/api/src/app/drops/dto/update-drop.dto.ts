import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
}
