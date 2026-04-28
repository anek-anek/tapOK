'use client';

import { useEffect, useRef, useState } from 'react';
import { Passion_One } from 'next/font/google';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, User as IconUser } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/components/providers/auth-provider';
import { Skeleton } from '@repo/ui/components/ui/skeleton';

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

export function TapokNavbar() {
  const { dbUser, loading, isReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const initials = getInitials(dbUser?.firstName, dbUser?.lastName);

  const navItems: NavItem[] = [
    { href: '/', label: 'Home', active: pathname === '/' },
    ...(dbUser ? [
      { href: '/activity', label: 'Activity', active: pathname === '/activity' || pathname.startsWith('/activity/') },
      { href: '/drops', label: 'Drops', active: pathname === '/drops' || pathname.startsWith('/drops/') },
    ] : []),
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    function handleScroll() {
      const current = window.scrollY;
      setVisible(current < lastScrollY.current || current < 10);
      lastScrollY.current = current;
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  async function handleLogout() {
    setOpen(false);
    await signOut(auth);
    await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => undefined);
    router.push('/login');
  }

  return (
    <>
    <div className="h-[57px]" />
    <header className={`fixed inset-x-0 top-0 z-20 border-b border-[#2a2118]/12 bg-[linear-gradient(180deg,rgba(247,233,178,0.98),rgba(247,233,178,0.9))] shadow-[0_8px_26px_rgba(42,33,24,0.05)] backdrop-blur-[4px] transition-transform duration-300 ease-in-out ${visible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-10">
        <div className="flex shrink-0 items-center gap-3">
          <Link href="/" className={`${passionOne.className} inline-flex items-center text-[24px] leading-none tracking-[0.08em] text-[#2a2118] sm:text-[27px]`}>
            <span className="translate-y-[1px]">TAPOK</span>
          </Link>
        </div>

        <nav className="flex min-w-0 flex-1 items-end justify-center gap-0.5 overflow-x-auto sm:gap-2">
          {isReady && navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative shrink-0 px-2 pb-1.5 pt-1 font-syne text-[10px] font-bold uppercase tracking-[1.6px] transition-colors sm:px-3 sm:tracking-[2.4px] ${
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

        {/* Profile button + dropdown */}
        <div className="relative" ref={dropdownRef}>
          {!isReady ? (
            <Skeleton className="h-11 w-11 rounded-full bg-[#2a2118]/10" />
          ) : !dbUser ? (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-[#2a2118]/12 bg-white/75 px-3 py-2 font-syne text-[10px] font-bold uppercase tracking-[1.6px] text-[#2a2118] transition-colors hover:border-[#2a2118]/22 hover:bg-white sm:px-4 sm:tracking-[2px]"
            >
              Login
            </Link>
          ) : (
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={`${dbUser.firstName} ${dbUser.lastName} — account menu`}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#2a2118]/12 bg-white/75 font-syne text-[10px] font-bold uppercase tracking-[2px] text-[#2a2118] transition-colors hover:border-[#2a2118]/22 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006666]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7E9B2]"
            >
              {initials}
            </button>
          )}

          {open && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[180px] overflow-hidden rounded-2xl border border-[#2a2118]/10 bg-[#FAF4DC] shadow-[0_12px_32px_rgba(42,33,24,0.12)]">
              {dbUser && (
                <div className="border-b border-[#2a2118]/8 px-4 py-3">
                  <p className="font-syne text-[11px] font-bold uppercase tracking-[1.5px] text-[#2a2118]">
                    {dbUser.firstName} {dbUser.lastName}
                  </p>
                  <p className="mt-0.5 font-syne text-[10px] text-[#2a2118]/45 lowercase">
                    {dbUser.email}
                  </p>
                </div>
              )}

              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 font-syne text-[11px] font-bold uppercase tracking-[1.5px] text-[#2a2118]/70 transition-colors hover:bg-[#2a2118]/5 hover:text-[#2a2118]"
              >
                <IconUser size={13} />
                Profile
              </Link>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 border-t border-[#2a2118]/8 px-4 py-3 font-syne text-[11px] font-bold uppercase tracking-[1.5px] text-[#2a2118]/70 transition-colors hover:bg-[#2a2118]/5 hover:text-[#2a2118]"
              >
                <LogOut size={13} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
    </>
  );
}
