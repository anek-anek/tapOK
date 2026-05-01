import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import LoginForm from '../../../components/login/LoginForm';

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirectTo = '/drops' } = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-tok-cream">
          <Loader2 className="h-6 w-6 animate-spin text-tok-teal" />
        </div>
      }
    >
      <LoginForm redirectTo={redirectTo} />
    </Suspense>
  );
}
