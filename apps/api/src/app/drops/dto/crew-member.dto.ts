import { ApiProperty } from '@nestjs/swagger';
import { DropCrewMemberRole, DropCrewStatus } from '../../../common';

export class CrewMemberUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ required: false })
  avatar?: string;
}

export class CrewMemberDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  dropId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: DropCrewMemberRole })
  memberRole: DropCrewMemberRole;

  @ApiProperty({ enum: DropCrewStatus })
  status: DropCrewStatus;

  @ApiProperty({ default: false })
  isPresent: boolean;

  @ApiProperty()
  joinedAt: Date;

  @ApiProperty({ type: CrewMemberUserDto })
  user: CrewMemberUserDto;
}
