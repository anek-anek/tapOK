import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenderEnum, UserRole } from '../../../common';

export class UserProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

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

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
