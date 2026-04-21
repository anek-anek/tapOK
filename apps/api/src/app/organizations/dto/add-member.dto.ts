import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { OrgRole } from '../../../common';

export class AddMemberDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ enum: OrgRole, default: OrgRole.MEMBER })
  @IsOptional()
  @IsEnum(OrgRole)
  role?: OrgRole;
}
