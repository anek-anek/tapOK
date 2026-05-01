import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Profile',
  description: 'Your identity on the mission board. Manage your credentials, stats, and frequent crew.',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
