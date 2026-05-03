import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import * as admin from 'firebase-admin';
import { EmailService } from '../../common/email/email.service';
import { UsersRepository } from '../users/users.repository';

const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

@Injectable()
export class AuthEmailService {
  private readonly webOrigin: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly usersRepository: UsersRepository,
  ) {
    const rawOrigin = this.configService.get<string>('WEB_ORIGIN') || 'http://localhost:4200';
    const firstOrigin = rawOrigin.split(',')[0] || 'http://localhost:4200';
    this.webOrigin = firstOrigin.trim();
  }

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
    let userRecord: admin.auth.UserRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch {
      return;
    }

    const user = await this.usersRepository.findByEmail(email);
    if (user) {
      this.checkCooldown(user.passwordResetSentAt);
    }

    const actionCodeSettings = { url: `${this.webOrigin}/login` };
    const firebaseLink = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);

    const url = new URL(firebaseLink);
    const oobCode = url.searchParams.get('oobCode');
    const customLink = `${this.webOrigin}/reset-password?oobCode=${oobCode}&email=${email}`;

    await this.emailService.sendPasswordResetEmail(email, customLink);

    if (user) {
      await this.usersRepository.update(user.id, { passwordResetSentAt: new Date() } as any);
    }

    // suppress unused-variable warning; userRecord is fetched only to validate existence
    void userRecord;
  }

  async sendVerificationEmail(email: string, firebaseUid?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.usersRepository.findByEmail(normalizedEmail);
    if (user) {
      this.checkCooldown(user.emailVerificationSentAt);
    }

    let targetEmail = normalizedEmail;

    // Resolve the authoritative email and check if already verified
    if (firebaseUid) {
      const userRecord = await admin.auth().getUser(firebaseUid);

      if (userRecord.emailVerified) {
        if (user && !user.isEmailVerified) {
          await this.usersRepository.update(user.id, {
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
          } as any);
        }
        return;
      }

      if (userRecord.email) {
        targetEmail = userRecord.email;
      }
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    if (user) {
      await this.usersRepository.update(user.id, {
        emailVerificationToken: token,
        emailVerificationTokenExpiresAt: expiresAt,
        emailVerificationSentAt: new Date(),
      } as any);
    }

    const link = `${this.webOrigin}/verify-email?token=${token}&email=${encodeURIComponent(targetEmail)}`;
    await this.emailService.sendVerificationEmail(targetEmail, link);
  }

  async confirmEmailToken(token: string) {
    const user = await this.usersRepository.findByEmailVerificationToken(token);

    if (!user) {
      throw new BadRequestException({ message: 'Invalid or expired verification link.', code: 'INVALID_TOKEN' });
    }

    if (!user.emailVerificationTokenExpiresAt || user.emailVerificationTokenExpiresAt < new Date()) {
      throw new BadRequestException({ message: 'This verification link has expired. Please request a new one.', code: 'TOKEN_EXPIRED' });
    }

    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpiresAt = undefined;
    await this.usersRepository.save(user);

    // Keep Firebase in sync
    if (user.firebaseUid) {
      try {
        await admin.auth().updateUser(user.firebaseUid, { emailVerified: true });
      } catch {
        // non-fatal — DB is source of truth
      }
    }
  }
}
