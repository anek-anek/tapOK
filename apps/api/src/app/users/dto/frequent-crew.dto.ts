import { ApiProperty } from '@nestjs/swagger';

export class FrequentCrewDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty({ required: false })
  userHandle?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  frequencyCount: number;
}

