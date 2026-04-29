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
  weight: ['400', '700'],
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
  const [scrollProgress, setScrollProgress] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const initials = getInitials(dbUser?.firstName, dbUser?.lastName);

  const navItems: NavItem[] = [
    { href: '/drops', label: 'Events', active: pathname === '/drops' || pathname.startsWith('/drops/') },
    { href: '/drops/create', label: 'Create Event', active: pathname === '/drops/create' },
    { href: '/about', label: 'About Us', active: pathname === '/about' },
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

      // Calculate scroll progress
      const winScroll = window.scrollY;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);
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
      <div className="h-[60px]" />
      
      {/* Progress Bar (Visible only when navbar is hidden) */}
      <div 
        className={`fixed left-0 top-0 z-60 h-[3px] bg-tok-teal transition-all duration-300 ease-in-out ${!visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        style={{ width: `${scrollProgress}%` }}
      />

      <header
        className={`fixed inset-x-0 top-0 z-50 bg-[#FFF4BD] transition-transform duration-300 ease-in-out ${visible ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-8">
          {/* Logo */}
          <Link
            href="/"
            className={`${passionOne.className} inline-flex shrink-0 items-center gap-1.5 text-xl leading-none tracking-tight text-black sm:text-2xl`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-tok-teal text-xl text-[#FFF4BD]">
              TAP
            </span>
            <span>OK</span>
          </Link>

          {/* Nav links */}
          <nav className="flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto sm:gap-1">
            {isReady && dbUser &&
              navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${passionOne.className} relative shrink-0 px-2.5 py-1.5 text-sm font-normal uppercase tracking-[1.8px] transition-colors sm:px-3.5 sm:text-base ${item.active
                    ? 'text-black'
                    : 'text-black/50 hover:text-black'
                    }`}
                >
                  {item.label}
                  {item.active && (
                    <span className="absolute inset-x-2 bottom-0 h-[2.5px] rounded-full bg-tok-teal" />
                  )}
                </Link>
              ))}
          </nav>

          {/* Auth area */}
          <div className="flex shrink-0 items-center gap-2" ref={dropdownRef}>
            {!isReady ? (
              <Skeleton className="h-9 w-20 rounded-full bg-black/10" />
            ) : !dbUser ? (
              <>
                <Link
                  href="/login"
                  className={`${passionOne.className} hidden rounded-full border-2 border-black/25 bg-transparent px-5 py-1.5 text-base uppercase tracking-[1.5px] text-black sm:inline-flex sm:items-center`}
                  style={{ transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, border-color 0.18s ease' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px) scale(1.04)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 18px rgba(0,0,0,0.13)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = '';
                    (e.currentTarget as HTMLElement).style.boxShadow = '';
                    (e.currentTarget as HTMLElement).style.borderColor = '';
                  }}
                >
                  Log In
                </Link>
                <Link
                  href="/login"
                  className={`${passionOne.className} inline-flex items-center rounded-full bg-tok-teal px-5 py-1.5 text-base uppercase tracking-[1.5px] text-white`}
                  style={{ transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, background-color 0.18s ease' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px) scale(1.04)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 22px rgba(0,102,102,0.35)';
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#005555';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = '';
                    (e.currentTarget as HTMLElement).style.boxShadow = '';
                    (e.currentTarget as HTMLElement).style.backgroundColor = '';
                  }}
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setOpen((v) => !v)}
                  aria-label={`${dbUser.firstName} ${dbUser.lastName} — account menu`}
                  className={`${passionOne.className} inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/15 bg-white text-[11px] uppercase tracking-[1.5px] text-black transition-colors hover:border-black/30 hover:bg-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-tok-teal/30`}
                >
                  {initials}
                </button>

                {open && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[190px] overflow-hidden rounded-2xl border border-black/10 bg-[#FFF4BD] shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
                    {dbUser && (
                      <div className="border-b border-black/8 px-4 py-3">
                        <p className={`${passionOne.className} text-[12px] uppercase tracking-[1.5px] text-black`}>
                          {dbUser.firstName} {dbUser.lastName}
                        </p>
                        <p className="mt-0.5 font-inter text-[11px] text-black/45 lowercase">
                          {dbUser.email}
                        </p>
                      </div>
                    )}

                    <Link
                      href="/profile"
                      onClick={() => setOpen(false)}
                      className={`${passionOne.className} flex items-center gap-3 px-4 py-3 text-[11px] uppercase tracking-[1.5px] text-black/70 transition-colors hover:bg-black/5 hover:text-black`}
                    >
                      <IconUser size={13} />
                      Profile
                    </Link>

                    <button
                      onClick={handleLogout}
                      className={`${passionOne.className} flex w-full items-center gap-3 border-t border-black/8 px-4 py-3 text-[11px] uppercase tracking-[1.5px] text-black/70 transition-colors hover:bg-black/5 hover:text-black`}
                    >
                      <LogOut size={13} />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
