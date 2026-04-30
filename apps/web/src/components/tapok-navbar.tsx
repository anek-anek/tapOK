'use client';

import { useEffect, useRef, useState } from 'react';
import { Passion_One } from 'next/font/google';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, User as IconUser, Menu, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/components/providers/auth-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

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
  const { dbUser, isReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => { setMounted(true); }, []);

  const initials = getInitials(dbUser?.firstName, dbUser?.lastName);

  const navItems: NavItem[] = [
    { href: '/drops', label: 'Drops', active: pathname === '/drops' || pathname.startsWith('/drops/') },
    { href: '/activity', label: 'Activity', active: pathname === '/activity' },
    { href: '/discover', label: 'Discover', active: pathname === '/discover' },
  ];

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

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
      // Don't hide navbar if mobile menu is open
      if (mobileMenuOpen) {
        setVisible(true);
        return;
      }
      setVisible(current < lastScrollY.current || current < 10);
      lastScrollY.current = current;

      const winScroll = window.scrollY;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      setScrollProgress(scrolled);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  async function handleLogout() {
    setOpen(false);
    setMobileMenuOpen(false);
    await signOut(auth);
    await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => undefined);
    router.push('/login');
  }

  return (
    <>
      <div className="h-[60px]" />

      {/* Progress bar visible when navbar is hidden */}
      <div
        className={`fixed left-0 top-0 z-60 h-[3px] bg-tok-teal transition-all duration-300 ease-in-out ${!visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        style={{ width: `${scrollProgress}%` }}
      />

      <header
        className={`fixed inset-x-0 top-0 z-50 bg-tok-cream transition-transform duration-300 ease-in-out ${visible ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          {/* Logo */}
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`${passionOne.className} inline-flex shrink-0 items-center gap-1.5 text-xl leading-none tracking-tight text-black sm:text-2xl`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-tok-teal text-xl text-tok-cream">
              TAP
            </span>
            <span>OK</span>
          </Link>

          {/* Desktop Nav links */}
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex">
            {mounted && isReady && dbUser &&
              navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${passionOne.className} relative shrink-0 px-3.5 py-1.5 text-base font-normal uppercase tracking-[1.8px] transition-colors ${
                    item.active ? 'text-black' : 'text-black/50 hover:text-black'
                  }`}
                >
                  {item.label}
                  {item.active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-2 bottom-0 h-[2.5px] rounded-full bg-tok-teal"
                    />
                  )}
                </Link>
              ))}
          </nav>

          {/* Right Area: Desktop Auth + Mobile Toggle */}
          <div className="flex shrink-0 items-center gap-2" ref={dropdownRef}>
            {/* Desktop Auth */}
            <div className="hidden items-center gap-2 md:flex">
              {!isReady ? (
                <Skeleton className="h-9 w-20 rounded-full bg-black/10" />
              ) : !dbUser ? (
                <>
                  <Link
                    href="/login"
                    className={`${passionOne.className} rounded-full border-2 border-black/25 bg-transparent px-5 py-1.5 text-base uppercase tracking-[1.5px] text-black transition-all hover:scale-105 hover:border-black/50 hover:shadow-lg`}
                  >
                    Log In
                  </Link>
                  <Link
                    href="/login"
                    className={`${passionOne.className} rounded-full bg-tok-teal px-5 py-1.5 text-base uppercase tracking-[1.5px] text-white transition-all hover:scale-105 hover:bg-tok-teal-mid hover:shadow-lg`}
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

                  <AnimatePresence>
                    {open && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
                        className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[190px] overflow-hidden rounded-2xl border border-black/10 bg-tok-cream shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
                      >
                        <div className="border-b border-black/8 px-4 py-3">
                          <p className={`${passionOne.className} text-[12px] uppercase tracking-[1.5px] text-black`}>
                            {dbUser.firstName} {dbUser.lastName}
                          </p>
                          <p className="mt-0.5 font-inter text-[11px] text-black/45 lowercase">
                            {dbUser.email}
                          </p>
                        </div>

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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-black transition-colors hover:bg-black/5 md:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="fixed inset-0 z-40 flex flex-col bg-tok-cream px-6 pt-[80px]"
          >
            {/* Mobile Nav Links */}
            <nav className="flex flex-col gap-6">
              {isReady && dbUser && navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${passionOne.className} flex items-center justify-between text-4xl uppercase tracking-[2px] ${
                    item.active ? 'text-tok-teal' : 'text-black'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.active && (
                    <motion.div
                      layoutId="mobile-nav-indicator"
                      className="h-2 w-2 rounded-full bg-tok-teal"
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* Mobile Auth Area */}
            <div className="mt-auto mb-10 flex flex-col gap-4">
              {!isReady ? (
                <Skeleton className="h-14 w-full rounded-2xl bg-black/5" />
              ) : !dbUser ? (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`${passionOne.className} flex h-14 items-center justify-center rounded-2xl border-2 border-black/20 bg-transparent text-xl uppercase tracking-[1.5px] text-black`}
                  >
                    Log In
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`${passionOne.className} flex h-14 items-center justify-center rounded-2xl bg-tok-teal text-xl uppercase tracking-[1.5px] text-white shadow-lg`}
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white/50 p-4">
                    <div className={`${passionOne.className} flex h-12 w-12 items-center justify-center rounded-full bg-white border border-black/10 text-sm tracking-wider`}>
                      {initials}
                    </div>
                    <div className="flex flex-col">
                      <span className={`${passionOne.className} text-lg uppercase tracking-wide`}>
                        {dbUser.firstName} {dbUser.lastName}
                      </span>
                      <span className="font-inter text-xs text-black/50">{dbUser.email}</span>
                    </div>
                  </div>
                  
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`${passionOne.className} flex h-14 items-center gap-3 rounded-2xl bg-white/40 px-6 text-xl uppercase tracking-[1.5px] text-black`}
                  >
                    <IconUser size={20} />
                    Profile
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className={`${passionOne.className} flex h-14 items-center gap-3 rounded-2xl bg-black/5 px-6 text-xl uppercase tracking-[1.5px] text-black/60`}
                  >
                    <LogOut size={20} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
