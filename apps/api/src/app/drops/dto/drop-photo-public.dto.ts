import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CrewMemberUserDto } from './crew-member.dto';

/**
 * Payload for listing drop roll photos — no full User entity or internal-only fields exposed.
 */
export class DropPhotoPublicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  dropId: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional({ nullable: true })
  url?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Embedded image data only until the photo is featured and stored at url.',
  })
  base64?: string | null;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: CrewMemberUserDto })
  user: CrewMemberUserDto;
}
