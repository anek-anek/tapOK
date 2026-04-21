import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GenderEnum, UserRole } from '../../../common';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: 'firebase-uid-123' })
  @IsOptional()
  @IsString()
  firebaseUid?: string;

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
  @IsDate()
  @MaxDate(new Date(), { message: 'Birthday cannot be in the future' })
  @Type(() => Date)
  birthday?: Date;

  @ApiPropertyOptional({ example: 'jane_doe' })
  @IsOptional()
  @IsString()
  userHandle?: string;
}
