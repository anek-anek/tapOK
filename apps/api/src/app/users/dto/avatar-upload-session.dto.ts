import { ApiProperty } from '@nestjs/swagger';

export class AvatarUploadSessionDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  storagePath: string;

  @ApiProperty()
  uploadToken: string;
}
