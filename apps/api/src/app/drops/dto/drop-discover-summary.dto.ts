import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DropCategory, DropStatus } from '../../../common';
import { DropOrganiserPublicDto } from './drop-organiser-public.dto';

/** Public-safe drop payload for `/drops/discover` — no join codes, share URLs, or spark identity rows. */
export class DropDiscoverSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  scheduledAt: Date;

  @ApiProperty()
  location: string;

  @ApiPropertyOptional({ nullable: true, type: Number })
  expectedHeadcount?: number | null;

  @ApiPropertyOptional({ nullable: true })
  overview?: string | null;

  @ApiPropertyOptional({ nullable: true })
  coverPhoto?: string | null;

  @ApiProperty({ enum: DropStatus })
  status: DropStatus;

  @ApiPropertyOptional({ enum: DropCategory, nullable: true })
  category?: DropCategory | null;

  @ApiPropertyOptional({
    nullable: true,
    type: Number,
    description: 'Minimum age when category is party; null if unrestricted.',
  })
  minimumAge?: number | null;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  isLocked: boolean;

  @ApiProperty()
  organiserId: string;

  @ApiProperty({ type: DropOrganiserPublicDto })
  organiser: DropOrganiserPublicDto;

  @ApiProperty({ description: 'Total spark count (no user identifiers).' })
  sparkCount: number;

  @ApiPropertyOptional({
    description: 'Included when the request is authenticated: whether this user has sparked the drop.',
  })
  sparkedByViewer?: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
