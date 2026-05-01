import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Activity Ledger',
  description: 'The pulse of your crew. Real-time updates from your orchestrated drops and shared missions.',
};

export default function ActivityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
