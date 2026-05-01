import { ApiProperty } from '@nestjs/swagger';
import { OrgRole } from '../../../common';

export class OrganizationMemberUserPublicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty({ required: false })
  userHandle?: string;
}

export class OrganizationMemberPublicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: OrgRole })
  role: OrgRole;

  @ApiProperty()
  joinedAt: Date;

  @ApiProperty()
  user: OrganizationMemberUserPublicDto;
}
