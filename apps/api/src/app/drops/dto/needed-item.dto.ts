import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExistingNeededItemDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'Existing Item' })
  name: string;

  @ApiPropertyOptional({ default: true })
  isAssignable?: boolean;
}
