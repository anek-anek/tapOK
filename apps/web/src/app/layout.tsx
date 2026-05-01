import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { Passion_One, Inter, Geist } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Analytics } from '@vercel/analytics/react';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ToastProvider } from '@/components/providers/toast-provider';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const passionOne = Passion_One({
  subsets: ['latin'],
  variable: '--font-passion',
  weight: ['400', '700', '900'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: {
    default: 'TapOK — Orchestrate Your Mission',
    template: '%s | TapOK',
  },
  description: 'TapOk is where a plan becomes real. Orchestrate drops, board your crew, and keep the log in one place.',
  icons: {
    icon: '/tapok.png',
    shortcut: '/tapok.png',
    apple: '/tapok.png',
  },
};

function readInitialDbUser() {
  return cookies().then((jar) => {
    const token = jar.get('__session')?.value;
    if (!token) return null;

    const [, payload] = token.split('.');
    if (!payload) return null;

    try {
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
        sub?: string;
        role?: 'admin' | 'photographer' | 'participant';
      };
      const profileRaw = jar.get('user_profile')?.value;
      const profile = profileRaw
        ? (JSON.parse(decodeURIComponent(profileRaw)) as {
          firstName?: string;
          lastName?: string;
          email?: string;
          avatar?: string;
        })
        : null;

      if (!decoded.sub || !decoded.role) return null;

      return {
        id: decoded.sub,
        role: decoded.role,
        firstName: profile?.firstName ?? '',
        lastName: profile?.lastName ?? '',
        email: profile?.email ?? '',
        avatar: profile?.avatar,
        isEmailVerified: true,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      };
    } catch {
      return null;
    }
  });
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialDbUser = await readInitialDbUser();

  return (
    <html lang="en" className={cn(passionOne.variable, inter.variable, "font-sans", geist.variable)}>
      <body>
        <QueryProvider>
          <AuthProvider initialDbUser={initialDbUser}>
            {children}
            <ToastProvider />
          </AuthProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
