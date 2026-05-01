import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join the Crew',
  description: 'Create your TapOK account and start orchestrating your own drops.',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
