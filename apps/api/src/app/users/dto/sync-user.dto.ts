import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AuthProvider, GenderEnum } from '../../../common';

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

  @ApiPropertyOptional({ enum: AuthProvider })
  @IsOptional()
  @IsEnum(AuthProvider)
  authProvider?: AuthProvider;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;

  @ApiPropertyOptional({ example: '2026-05-04T10:42:00.000Z' })
  @IsOptional()
  @IsDateString()
  termsAcceptedAt?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  privacyPolicyAccepted?: boolean;

  @ApiPropertyOptional({ example: '2026-05-04T10:42:00.000Z' })
  @IsOptional()
  @IsDateString()
  privacyPolicyAcceptedAt?: string;
}
