import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdatePresenceDto {
  @ApiProperty({ description: 'Whether the crew member is marking themselves as present' })
  @IsBoolean()
  isPresent: boolean;
}
