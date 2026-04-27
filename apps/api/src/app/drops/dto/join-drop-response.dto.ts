import { ApiProperty } from '@nestjs/swagger';
import { DropCrewStatus } from '../../../common';

export class JoinDropResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  dropId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: DropCrewStatus })
  status: DropCrewStatus;

  @ApiProperty()
  joinedAt: Date;
}
