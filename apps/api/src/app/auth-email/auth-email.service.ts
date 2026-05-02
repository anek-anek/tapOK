import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { EmailService } from '../../common/email/email.service';
import { UsersRepository } from '../users/users.repository';

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
    console.log(`[AuthEmail] Initialized with webOrigin: ${this.webOrigin}`);
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
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
      console.warn(`[AuthEmail] Password reset requested for non-existent user: ${email}`);
      return; 
    }

    const user = await this.usersRepository.findByEmail(email);
    if (user) {
      this.checkCooldown(user.passwordResetSentAt);
    }

    const actionCodeSettings = {
      url: `${this.webOrigin}/login`,
    };

    const firebaseLink = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);
    
    const url = new URL(firebaseLink);
    const oobCode = url.searchParams.get('oobCode');
    const customLink = `${this.webOrigin}/reset-password?oobCode=${oobCode}&email=${email}`;

    await this.emailService.sendPasswordResetEmail(email, customLink);

    // Update DB timestamp
    if (user) {
      await this.usersRepository.update(user.id, {
        passwordResetSentAt: new Date(),
      } as any);
    }
  }

  async sendVerificationEmail(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (user) {
      this.checkCooldown(user.emailVerificationSentAt);
    }

    const actionCodeSettings = {
      url: `${this.webOrigin}/profile`,
    };

    const firebaseLink = await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);
    
    const url = new URL(firebaseLink);
    const oobCode = url.searchParams.get('oobCode');
    const customLink = `${this.webOrigin}/reset-password?oobCode=${oobCode}&email=${email}`;

    await this.emailService.sendVerificationEmail(email, customLink);

    // Update DB
    if (user) {
      await this.usersRepository.update(user.id, {
        emailVerificationSentAt: new Date(),
      } as any);
    }
  }
}
