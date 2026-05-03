import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthEmailService } from './auth-email.service';
import { Public } from '../../common/decorators/public.decorator';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import type { DecodedIdToken } from 'firebase-admin/auth';

@ApiTags('Auth Email')
@Controller('auth/email')
export class AuthEmailController {
  constructor(private readonly authEmailService: AuthEmailService) {}

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset email via Resend' })
  async sendResetEmail(@Body('email') email: string) {
    await this.authEmailService.sendPasswordResetEmail(email);
    return { success: true, message: 'If an account exists, a reset link has been sent.' };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send email verification via Resend' })
  async sendVerification(
    @AuthUser() user: DecodedIdToken,
    @Body('email') email: string
  ) {
    await this.authEmailService.sendVerificationEmail(email, user.uid);
    return { success: true, message: 'Verification email sent.' };
  }
}
