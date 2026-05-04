import { ApiProperty } from '@nestjs/swagger';

export class PhotoUploadSessionDto {
  @ApiProperty()
  photoId: string;

  @ApiProperty()
  storagePath: string;

  @ApiProperty()
  uploadToken: string;
}
