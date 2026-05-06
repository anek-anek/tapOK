import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AuthProvider, GenderEnum, UserRole } from '../../../common';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: AuthProvider, default: AuthProvider.PASSWORD })
  @IsOptional()
  @IsEnum(AuthProvider)
  authProvider?: AuthProvider;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @MinLength(1, { message: 'First name is required' })
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1, { message: 'Last name is required' })
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.PARTICIPANT })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: GenderEnum })
  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  @IsDateString({}, { message: 'Birthday must be a valid date' })
  birthday?: string;

  @ApiPropertyOptional({ example: 'jane_doe' })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'User handle must be at least 3 characters' })
  @MaxLength(30, { message: 'User handle cannot exceed 30 characters' })
  @Matches(/^[a-zA-Z0-9._]+$/, { 
    message: 'User handle can only contain letters, numbers, dots, and underscores' 
  })
  userHandle?: string;

  @ApiPropertyOptional({ example: '+639123456789' })
  @IsOptional()
  @IsPhoneNumber('PH', { message: 'Invalid phone number format' })
  phone?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  termsAccepted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  termsAcceptedAt?: Date;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  privacyPolicyAccepted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  privacyPolicyAcceptedAt?: Date;
}
