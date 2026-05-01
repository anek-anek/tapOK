import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CrewMemberUserDto } from './crew-member.dto';

export class DropActivityLogPublicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  dropId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: CrewMemberUserDto })
  user: CrewMemberUserDto;

  @ApiProperty()
  action: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'boolean' },
    description: 'Whitelisted changed field names only; values are always true.',
  })
  changedFields?: Record<string, true>;

  @ApiProperty()
  createdAt: Date;
}
