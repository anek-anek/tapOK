import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateAvatarUploadDto {
  @ApiProperty({ enum: ['image/jpeg', 'image/jpg', 'image/png'] })
  @IsIn(['image/jpeg', 'image/jpg', 'image/png'])
  mimeType: string;

  @ApiProperty({ description: 'Original file size in bytes', maximum: 5 * 1024 * 1024 })
  @IsInt()
  @Min(1)
  @Max(5 * 1024 * 1024)
  sizeBytes: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number;
}
