import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Identify yourself to access your mission board and crew logs.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
