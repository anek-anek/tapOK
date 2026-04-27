'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';

const NAV_LINKS = [
  { href: '/home', label: 'HOME' },
  { href: '/activity', label: 'ACTIVITY' },
  { href: '/drops', label: 'DROPS' },
];

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { dbUser } = useAuth();

  const initials = dbUser ? getInitials(dbUser.firstName, dbUser.lastName) : '??';

  return (
    <div className="min-h-screen bg-[#F0E9C8] text-[#2a2118]">
      <header className="flex items-center justify-between border-b border-[#2a2118]/10 bg-[#F0E9C8] px-8 py-4">
        <Link href="/home" className="font-mono text-lg font-bold tracking-widest text-[#2a2118] uppercase">
          TAPOK
        </Link>

        <nav className="flex items-center gap-8">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`font-mono text-xs tracking-widest uppercase transition-colors ${
                  isActive
                    ? 'border-b-2 border-[#2a2118] pb-0.5 text-[#2a2118]'
                    : 'text-[#2a2118]/50 hover:text-[#2a2118]'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/profile"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2a2118]/20 bg-[#E8DFB8] font-mono text-sm font-semibold text-[#2a2118] transition-colors hover:bg-[#2a2118]/10"
        >
          {initials}
        </Link>
      </header>

      <main>{children}</main>
    </div>
  );
}
