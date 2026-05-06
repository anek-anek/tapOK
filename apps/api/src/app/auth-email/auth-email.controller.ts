import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthEmailService } from './auth-email.service';
import { Public } from '../../common/decorators/public.decorator';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import type { BetterAuthUser } from '../../common/better-auth/better-auth.service';

@ApiTags('Auth Email')
@Controller('auth/email')
export class AuthEmailController {
  constructor(private readonly authEmailService: AuthEmailService) {}

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset email' })
  async sendResetEmail(@Body('email') email: string) {
    await this.authEmailService.sendPasswordResetEmail(email);
    return { success: true, message: 'If an account exists, a reset link has been sent.' };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification' })
  async sendVerification(@AuthUser() user: BetterAuthUser) {
    await this.authEmailService.sendVerificationEmail(user.id);
    return { success: true, message: 'Verification email sent.' };
  }
}
