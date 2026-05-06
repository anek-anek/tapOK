import { Injectable, BadRequestException } from '@nestjs/common';
import { auth } from '../../lib/auth';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class AuthEmailService {
  constructor(private readonly usersRepository: UsersRepository) {}

  private checkCooldown(lastSentAt: Date | undefined, cooldownMs: number = 600000) {
    if (!lastSentAt) return;

    const now = new Date().getTime();
    const lastSent = new Date(lastSentAt).getTime();
    const diff = now - lastSent;

    if (diff < cooldownMs) {
      const remainingSeconds = Math.ceil((cooldownMs - diff) / 1000);
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

      throw new BadRequestException({
        message: `Please wait ${timeStr} before requesting another link. Check your inbox (and spam folder) in the meantime!`,
        code: 'COOLDOWN_ACTIVE',
      });
    }
  }

  async sendPasswordResetEmail(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (user) {
      this.checkCooldown(user.passwordResetSentAt);
    }

    // BetterAuth triggers our sendResetPassword callback in auth.ts
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: '/reset-password' },
    });

    if (user) {
      await this.usersRepository.update(user.id, { passwordResetSentAt: new Date() } as any);
    }
  }

  async sendVerificationEmail(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (user) {
      this.checkCooldown(user.emailVerificationSentAt);
    }

    const baseUrl = (process.env.WEB_ORIGIN ?? 'http://localhost:4200').split(',')[0]?.trim() ?? 'http://localhost:4200';
    
    // BetterAuth triggers our sendVerificationEmail callback in auth.ts
    await auth.api.sendVerificationEmail({
      body: {
        email: user?.email ?? '',
        callbackURL: `${baseUrl}/verify-email?verified=true`,
      },
    });

    if (user) {
      await this.usersRepository.update(user.id, { emailVerificationSentAt: new Date() } as any);
    }
  }
}
