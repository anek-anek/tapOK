import { Resend } from 'resend';

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM = 'TapOK <noreply@tapok.app>';

function neubrutalistTemplate(
  title: string,
  body: string,
  buttonText: string,
  buttonUrl: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Passion+One:wght@400;700;900&family=Inter:wght@400;700;900&display=swap');
        </style>
      </head>
      <body style="margin:0;padding:0;background-color:#FDFCF7;font-family:'Inter',Helvetica,Arial,sans-serif;color:#262624;">
        <div style="padding:40px 10px;">
          <div style="max-width:500px;margin:0 auto;background-color:#ffffff;border:4px solid #262624;padding:40px;box-shadow:12px 12px 0px 0px #FFD700;">
            <div style="margin-bottom:40px;">
              <div style="display:inline-block;background-color:#008080;border:3px solid #262624;padding:8px 16px;box-shadow:4px 4px 0px 0px #262624;">
                <span style="font-family:'Passion One',sans-serif;color:#FDFCF7;font-weight:900;font-size:28px;letter-spacing:-0.04em;text-transform:uppercase;line-height:1;">TAPOK</span>
              </div>
            </div>
            <h1 style="font-family:'Passion One',sans-serif;font-size:42px;font-weight:900;text-transform:uppercase;margin:0 0 24px 0;letter-spacing:-0.04em;line-height:0.9;color:#262624;">${title}</h1>
            <div style="font-size:16px;line-height:1.5;margin:0 0 32px 0;color:#262624;font-weight:500;">${body}</div>
            <div style="margin-bottom:40px;">
              <a href="${buttonUrl}" style="display:inline-block;background-color:#008080;color:#ffffff;border:3px solid #262624;padding:18px 36px;font-family:'Passion One',sans-serif;font-size:22px;font-weight:900;text-decoration:none;text-transform:uppercase;letter-spacing:0.02em;box-shadow:6px 6px 0px 0px #262624;">
                ${buttonText}
              </a>
            </div>
            <div style="border-top:4px solid #262624;margin-bottom:24px;width:60px;"></div>
            <div style="font-family:'Inter',sans-serif;">
              <p style="font-size:12px;font-weight:800;color:#262624;opacity:0.4;margin:0 0 20px 0;text-transform:uppercase;letter-spacing:0.05em;">If you didn't request this, you can ignore this email.</p>
              <div style="font-family:'Passion One',sans-serif;font-size:20px;font-weight:900;color:#008080;text-transform:uppercase;">THANKS, THE TAPOK TEAM</div>
            </div>
          </div>
          <div style="max-width:500px;margin:24px auto 0;text-align:center;">
            <p style="font-size:11px;color:#262624;opacity:0.3;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">&copy; 2026 TAPOK APP. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendPasswordResetEmail(email: string, url: string): Promise<void> {
  const client = getResend();
  if (!client) return;

  const html = neubrutalistTemplate(
    'Reset Password.',
    `Follow the link below to reset your <strong>TapOK</strong> password for <strong>${email}</strong>.`,
    'Reset My Password',
    url,
  );

  await client.emails.send({ from: FROM, to: email, subject: 'Reset your password for TapOK', html });
}

export async function sendVerificationEmail(email: string, url: string): Promise<void> {
  const client = getResend();
  if (!client) return;

  const html = neubrutalistTemplate(
    'Verify Email.',
    `Welcome to <strong>TapOK</strong>! Please verify your email address to unlock full access to drops and photo uploads.`,
    'Verify My Email',
    url,
  );

  await client.emails.send({ from: FROM, to: email, subject: 'Verify your email for TapOK', html });
}
