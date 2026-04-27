'use client';

import { Passion_One } from 'next/font/google';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';

const passionOne = Passion_One({
  weight: '400',
  subsets: ['latin'],
});

type NavItem = {
  href: string;
  label: string;
  active?: boolean;
};

function getInitials(firstName?: string, lastName?: string) {
  const first = firstName?.trim().charAt(0)?.toUpperCase() ?? '';
  const last = lastName?.trim().charAt(0)?.toUpperCase() ?? '';
  return `${first}${last}` || 'U';
}

export function TapokNavbar({ active = 'drops' }: { active?: 'home' | 'activity' | 'drops' }) {
  const { dbUser } = useAuth();
  const initials = getInitials(dbUser?.firstName, dbUser?.lastName);

  const navItems: NavItem[] = [
    { href: '/', label: 'Home', active: active === 'home' },
    { href: '/activity', label: 'Activity', active: active === 'activity' },
    { href: '/drops', label: 'Drops', active: active === 'drops' },
  ];

  return (
    <header className="relative z-20 border-b border-[#2a2118]/12 bg-[linear-gradient(180deg,rgba(247,233,178,0.98),rgba(247,233,178,0.9))] shadow-[0_8px_26px_rgba(42,33,24,0.05)] backdrop-blur-[4px]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 sm:px-10">
        <div className="flex items-center gap-3">
          <Link href="/" className={`${passionOne.className} inline-flex items-center text-[27px] leading-none tracking-[0.08em] text-[#2a2118]`}>
            <span className="translate-y-[1px]">TAPOK</span>
          </Link>
        </div>

        <nav className="flex items-end gap-1 sm:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative shrink-0 px-3 pb-1.5 pt-1 font-syne text-[10px] font-bold uppercase tracking-[2.4px] transition-colors ${
                item.active
                  ? 'text-[#2a2118]'
                  : 'text-[#2a2118]/55 hover:text-[#2a2118]'
              }`}
            >
              {item.label}
              <span
                className={`absolute inset-x-3 bottom-0 h-[3px] rounded-full transition-transform ${
                  item.active ? 'scale-x-100 bg-[#0A6D6D]' : 'scale-x-0 bg-transparent'
                }`}
              />
            </Link>
          ))}
        </nav>

        <Link
          href="/profile"
          aria-label={dbUser ? `Profile: ${dbUser.firstName} ${dbUser.lastName}` : 'Profile'}
          title={dbUser ? `${dbUser.firstName} ${dbUser.lastName}` : 'Profile'}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#2a2118]/12 bg-white/75 font-syne text-[10px] font-bold uppercase tracking-[2px] text-[#2a2118] transition-colors hover:border-[#2a2118]/22 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006666]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7E9B2]"
        >
          {initials}
        </Link>
      </div>
    </header>
  );
}
