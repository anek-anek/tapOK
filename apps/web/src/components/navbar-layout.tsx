'use client';

import { usePathname } from 'next/navigation';
import { TapokNavbar } from '@/components/tapok-navbar';

const NO_NAVBAR_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth/google/callback',
  '/onboarding',
];

export function NavbarLayout() {
  const pathname = usePathname();
  const hidden = NO_NAVBAR_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  if (hidden) return null;
  return <TapokNavbar />;
}
