import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Minimal organiser profile for anonymous discovery surfaces. */
export class DropOrganiserPublicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional({ nullable: true })
  avatar?: string | null;

  @ApiPropertyOptional({ nullable: true })
  userHandle?: string | null;
}
