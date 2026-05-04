import type { Metadata } from 'next';
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

import { getBaseUrl } from '@/lib/config';
import { getServerUser } from '@/lib/auth/get-server-user';

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'TapOK',
    title: 'TapOK — Orchestrate Your Mission',
    description: 'TapOk is where a plan becomes real. Orchestrate drops, board your crew, and keep the log in one place.',
    images: [
      {
        url: '/tapok-brand.png',
        width: 1200,
        height: 630,
        alt: 'TapOK',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TapOK — Orchestrate Your Mission',
    description: 'TapOk is where a plan becomes real. Orchestrate drops, board your crew, and keep the log in one place.',
    images: ['/tapok-brand.png'],
    creator: '@tapok_app',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialDbUser = await getServerUser();

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
