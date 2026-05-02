'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { useMounted } from '@/hooks/use-mounted';

export function HeroActions() {
  const mounted = useMounted();
  const { dbUser, loading } = useAuth();

  if (!mounted) return <div className="mt-8 h-[52px] w-[180px] rounded-lg bg-tok-teal/10" />;
  if (loading) return <div className="mt-8 h-[52px] w-[180px] animate-pulse rounded-lg bg-tok-teal/30" />;

  return (
    <Link
      href={dbUser ? '/drops' : '/login'}
      className="mt-8 inline-block rounded-lg border-2 border-tok-black bg-tok-teal px-8 py-3.5 font-passion text-2xl uppercase tracking-wider text-white shadow-[6px_6px_0px_0px_#262624] active:translate-y-0 active:shadow-none"
      style={{ transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, background-color 0.18s ease' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '8px 8px 0px 0px #262624';
        (e.currentTarget as HTMLElement).style.backgroundColor = '#005555';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0px 0px #262624';
        (e.currentTarget as HTMLElement).style.backgroundColor = '';
      }}
    >
      EXPLORE EVENTS
    </Link>
  );
}
