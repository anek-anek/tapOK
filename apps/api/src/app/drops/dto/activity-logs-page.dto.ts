import { ApiProperty } from '@nestjs/swagger';
import { DropActivityLogPublicDto } from './drop-activity-log-public.dto';

export class ActivityLogsPageDto {
  @ApiProperty({ type: [DropActivityLogPublicDto] })
  data: DropActivityLogPublicDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  totalPages: number;
}
