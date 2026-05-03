import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthProvider, GenderEnum, UserRole } from '../../../common';

export class UserProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: AuthProvider })
  authProvider: AuthProvider;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional({ enum: GenderEnum })
  gender?: GenderEnum;

  @ApiPropertyOptional({ example: '1990-01-01' })
  birthday?: Date;

  @ApiPropertyOptional()
  userHandle?: string;

  @ApiProperty()
  isEmailVerified: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ description: 'Number of drops created by this user' })
  dropCount: number;

  @ApiProperty({ description: 'Total unique crew members reached across all drops' })
  crewReached: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
