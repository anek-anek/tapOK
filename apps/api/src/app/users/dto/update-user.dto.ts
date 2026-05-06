import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsPhoneNumber, IsString, Matches, MaxDate, MaxLength, MinLength } from 'class-validator';
import { GenderEnum } from '../../../common';
import { CreateUserDto } from './create-user.dto';

// Fields are redeclared explicitly because @nestjs/swagger's PartialType does not
// reliably forward class-transformer metadata (@Type) or class-validator decorators.
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'role', 'authProvider'] as const),
) {
  @ApiPropertyOptional({ example: 'Jane' })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'First name is required' })
  @MaxLength(100)
  declare firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Last name is required' })
  @MaxLength(100)
  declare lastName?: string;

  @ApiPropertyOptional({ example: 'jane_doe' })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'User handle must be at least 3 characters' })
  @MaxLength(30, { message: 'User handle cannot exceed 30 characters' })
  @Matches(/^[a-zA-Z0-9._]+$/, {
    message: 'User handle can only contain letters, numbers, dots, and underscores',
  })
  declare userHandle?: string;

  @ApiPropertyOptional({ example: '+639123456789' })
  @IsOptional()
  @IsPhoneNumber('PH', { message: 'Invalid phone number format' })
  declare phone?: string;

  @ApiPropertyOptional({ enum: GenderEnum })
  @IsOptional()
  @IsEnum(GenderEnum)
  declare gender?: GenderEnum;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Birthday must be a valid date' })
  @MaxDate(() => new Date(), { message: 'Birthday cannot be in the future' })
  declare birthday?: Date;
}
