import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail = 'TapOK <noreply@tapok.app>'; // Update this when domain is verified

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY is missing. Email features will be disabled.');
      return;
    }

    this.resend = new Resend(apiKey);
  }

  private isEnabled(): boolean {
    return !!this.resend;
  }

  private getNeubrutalistTemplate(title: string, body: string, buttonText: string, buttonUrl: string) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Passion+One:wght@400;700;900&family=Inter:wght@400;700;900&display=swap');
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #FDFCF7; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #262624;">
          <div style="padding: 40px 10px;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 4px solid #262624; padding: 40px; box-shadow: 12px 12px 0px 0px #FFD700;">
              
              <!-- Header / Logo -->
              <div style="margin-bottom: 40px;">
                <div style="display: inline-block; background-color: #008080; border: 3px solid #262624; padding: 8px 16px; box-shadow: 4px 4px 0px 0px #262624;">
                  <span style="font-family: 'Passion One', sans-serif; color: #FDFCF7; font-weight: 900; font-size: 28px; letter-spacing: -0.04em; text-transform: uppercase; line-height: 1;">
                    TAPOK
                  </span>
                </div>
              </div>

              <!-- Content Area -->
              <h1 style="font-family: 'Passion One', sans-serif; font-size: 42px; font-weight: 900; text-transform: uppercase; margin: 0 0 24px 0; letter-spacing: -0.04em; line-height: 0.9; color: #262624;">
                ${title}
              </h1>
              
              <div style="font-size: 16px; line-height: 1.5; margin: 0 0 32px 0; color: #262624; font-weight: 500;">
                ${body}
              </div>

              <!-- Action Button -->
              <div style="margin-bottom: 40px;">
                <a href="${buttonUrl}" style="display: inline-block; background-color: #008080; color: #ffffff; border: 3px solid #262624; padding: 18px 36px; font-family: 'Passion One', sans-serif; font-size: 22px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 0.02em; box-shadow: 6px 6px 0px 0px #262624; transition: all 0.2s ease;">
                  ${buttonText}
                </a>
              </div>

              <!-- Decorative Line -->
              <div style="border-top: 4px solid #262624; margin-bottom: 24px; width: 60px;"></div>

              <!-- Footer -->
              <div style="font-family: 'Inter', sans-serif;">
                <p style="font-size: 12px; font-weight: 800; color: #262624; opacity: 0.4; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 0.05em;">
                  If you didn’t request this, you can ignore this email.
                </p>
                <div style="font-family: 'Passion One', sans-serif; font-size: 20px; font-weight: 900; color: #008080; text-transform: uppercase;">
                  THANKS, THE TAPOK TEAM
                </div>
              </div>
            </div>

            <!-- Meta Footer -->
            <div style="max-width: 500px; margin: 24px auto 0; text-align: center;">
               <p style="font-size: 11px; color: #262624; opacity: 0.3; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">
                 &copy; 2026 TAPOK APP. ALL RIGHTS RESERVED.
               </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async sendPasswordResetEmail(email: string, link: string) {
    if (!this.isEnabled()) {
      this.logger.error(`Cannot send password reset to ${email}: Resend not initialized`);
      return;
    }

    const html = this.getNeubrutalistTemplate(
      'Reset Password.',
      `Follow the link below to reset your <strong>TapOK</strong> password for your <strong>${email}</strong> account.`,
      'Reset My Password',
      link,
    );

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Reset your password for TapOK',
        html,
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
      throw error;
    }
  }

  async sendJoinRequestEmail(email: string, title: string, body: string, dropUrl?: string) {
    if (!this.isEnabled()) return;
    const html = this.getNeubrutalistTemplate(
      'New Join Request.',
      body,
      'View Drop',
      dropUrl ?? '#',
    );
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: title,
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send join request email to ${email}`, error);
    }
  }

  async sendJoinApprovedEmail(email: string, title: string, body: string, dropUrl?: string) {
    if (!this.isEnabled()) return;
    const html = this.getNeubrutalistTemplate(
      "You're In!",
      body,
      'View Drop',
      dropUrl ?? '#',
    );
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: title,
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send join approved email to ${email}`, error);
    }
  }

  async sendJoinRejectedEmail(email: string, title: string, body: string) {
    if (!this.isEnabled()) return;
    const html = this.getNeubrutalistTemplate(
      'Request Not Approved.',
      body,
      'Discover Drops',
      '#',
    );
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: title,
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send join rejected email to ${email}`, error);
    }
  }

  async sendDropEditedEmail(email: string, title: string, body: string, dropUrl?: string) {
    if (!this.isEnabled()) return;
    const html = this.getNeubrutalistTemplate(
      'Drop Updated.',
      body,
      'View Drop',
      dropUrl ?? '#',
    );
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: title,
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send drop edited email to ${email}`, error);
    }
  }

  async sendDropStartingSoonEmail(
    email: string,
    title: string,
    body: string,
    dropUrl?: string,
    _scheduledAt?: Date,
  ) {
    if (!this.isEnabled()) return;
    const html = this.getNeubrutalistTemplate(
      'Starting Soon!',
      body,
      'View Drop',
      dropUrl ?? '#',
    );
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: title,
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send drop starting soon email to ${email}`, error);
    }
  }

  async sendVerificationEmail(email: string, link: string) {
    if (!this.isEnabled()) {
      this.logger.error(`Cannot send verification to ${email}: Resend not initialized`);
      return;
    }

    const html = this.getNeubrutalistTemplate(
      'Verify Email.',
      `Welcome to <strong>TapOK</strong>! Please verify your email address to unlock full access to drops and photo uploads.`,
      'Verify My Email',
      link,
    );

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Verify your email for TapOK',
        html,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      throw error;
    }
  }
}
