import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateSessionCookieDto {
  @ApiProperty({
    description: 'Firebase ID token from the authenticated client session.',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...'
  })
  @IsString()
  @MinLength(20)
  idToken: string;
}
