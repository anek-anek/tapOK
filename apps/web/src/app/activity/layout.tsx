import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Drop Log',
  description: 'Mission log and live activity across your drops.',
};

export default function ActivityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
