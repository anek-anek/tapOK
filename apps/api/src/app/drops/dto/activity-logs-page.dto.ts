import { ApiProperty } from '@nestjs/swagger';
import { DropActivityLog } from '../entities/drop-activity-log.entity';

export class ActivityLogsPageDto {
  @ApiProperty({ type: [DropActivityLog] })
  data: DropActivityLog[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  totalPages: number;
}
