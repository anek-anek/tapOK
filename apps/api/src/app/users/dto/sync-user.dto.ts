import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, IsDateString } from 'class-validator';
import { GenderEnum } from '../../../common';

export enum SyncAuthMode {
  LOGIN = 'login',
  SIGNUP = 'signup',
}

export class SyncUserDto {
  @ApiPropertyOptional({ example: 'John', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;
  @ApiPropertyOptional({ enum: GenderEnum })
  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  birthday?: string;

  @ApiPropertyOptional({ example: 'jane_doe' })
  @IsOptional()
  @IsString()
  userHandle?: string;

  @ApiPropertyOptional({ enum: SyncAuthMode })
  @IsOptional()
  @IsEnum(SyncAuthMode)
  authMode?: SyncAuthMode;
}
