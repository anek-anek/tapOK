import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mission Board',
  description: 'Manage your active drops, board your crew, and track mission status.',
};

export default function DropsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
