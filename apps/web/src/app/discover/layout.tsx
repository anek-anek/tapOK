import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discover Drops',
  description: 'Find public missions, join new crews, and see what the community is orchestrating.',
};

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
