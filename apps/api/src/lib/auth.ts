import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  user: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'tapok',
  ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
});

export const auth = betterAuth({
  database: pool,

  baseURL: `${process.env.API_BASE_URL ?? 'http://localhost:3000'}/api/auth`,

  secret: process.env.BETTER_AUTH_SECRET,

  trustedOrigins: (process.env.WEB_ORIGIN ?? 'http://localhost:4200')
    .split(',')
    .map((o) => o.trim()),

  onAPIError: {
    errorURL: `${(process.env.WEB_ORIGIN ?? 'http://localhost:4200').split(',')[0]?.trim() ?? 'http://localhost:4200'}/login`,
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      const { sendPasswordResetEmail } = await import('./auth-email-sender');
      await sendPasswordResetEmail(user.email, url);
    },
  },

  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const { sendVerificationEmail } = await import('./auth-email-sender');

      const baseUrl = (process.env.WEB_ORIGIN ?? 'http://localhost:4200').split(',')[0]?.trim() ?? 'http://localhost:4200';
      const parsed = new URL(url);
      parsed.searchParams.set('callbackURL', `${baseUrl}/verify-email?verified=true`);

      await sendVerificationEmail(user.email, parsed.toString());
    },
    afterEmailVerification: async (user) => {
      await pool.query(
        `UPDATE "users" SET "isEmailVerified" = true, "emailVerifiedAt" = NOW() WHERE id = $1`,
        [user.id],
      );
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      disableImplicitSignUp: true,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  plugins: [bearer()],

  account: {
    storeStateStrategy: 'cookie',
  },

  advanced: {
    database: {
      generateId: 'uuid',
    },
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
    },
  },

  user: {
    modelName: 'users',
    fields: {
      name: 'firstName',
      image: 'avatar',
      emailVerified: 'isEmailVerified',
    },
    additionalFields: {
      lastName: { type: 'string', defaultValue: '' },
      role: { type: 'string', defaultValue: 'participant', input: false },
      authProvider: { type: 'string', defaultValue: 'password' },
      avatarStoragePath: { type: 'string', required: false },
      gender: { type: 'string', required: false },
      birthday: { type: 'date', required: false },
      userHandle: { type: 'string', required: false },
      phone: { type: 'string', required: false },
      termsAccepted: { type: 'boolean', defaultValue: false },
      termsAcceptedAt: { type: 'date', required: false },
      privacyPolicyAccepted: { type: 'boolean', defaultValue: false },
      privacyPolicyAcceptedAt: { type: 'date', required: false },
      isActive: { type: 'boolean', defaultValue: true },
      onboardingCompleted: { type: 'boolean', defaultValue: false },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const nameValue = user.name || '';
          const parts = nameValue.trim().split(/\s+/);
          const firstName = parts[0] || '';
          const lastName = parts.slice(1).join(' ') || '';
          return {
            data: {
              ...user,
              name: firstName,
              lastName: user.lastName || lastName,
            },
          };
        },
      },
    },
    account: {
      create: {
        after: async (account) => {
          if (account.providerId === 'google') {
            await pool.query(
              `UPDATE "users" SET "isEmailVerified" = true, "authProvider" = 'google' WHERE id = $1`,
              [account.userId]
            );
          }
        },
      },
    },
  },
});

export type Auth = typeof auth;
