import type { Metadata } from 'next';
import './globals.css';
import { Passion_One, Inter, Geist } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Analytics } from '@vercel/analytics/react';
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthProvider } from '@/components/providers/auth-provider';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
  title: 'TapOK — Find Events. Join People. Make Memories.',
  description: 'Discover and book amazing events happening near you. Connect. Participate. Enjoy.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(passionOne.variable, inter.variable, "font-sans", geist.variable)}>
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
