import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthEmailService } from './auth-email.service';
import { Public } from '../../common/decorators/public.decorator';

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

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send email verification via Resend' })
  async sendVerification(@Body('email') email: string) {
    await this.authEmailService.sendVerificationEmail(email);
    return { success: true, message: 'Verification email sent.' };
  }
}
