import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DropDiscoverSummaryDto } from './drop-discover-summary.dto';

export class DiscoverDropsPaginatedDto {
  @ApiProperty({ type: [DropDiscoverSummaryDto] })
  data: DropDiscoverSummaryDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  totalPages: number;
}

export class DiscoverDropsResponseDto {
  @ApiPropertyOptional({
    nullable: true,
    type: DropDiscoverSummaryDto,
    description: 'Featured drop when available.',
  })
  featured: DropDiscoverSummaryDto | null;

  @ApiProperty({ type: [DropDiscoverSummaryDto] })
  recentChiefsDrops: DropDiscoverSummaryDto[];

  @ApiProperty({ type: DiscoverDropsPaginatedDto })
  allPublic: DiscoverDropsPaginatedDto;
}
