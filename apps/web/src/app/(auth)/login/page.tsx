import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import LoginForm from '../../../components/login/LoginForm';

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirectTo = '/' } = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FFF2BD]">
          <Loader2 className="h-6 w-6 animate-spin text-[#1a6b5e]" />
        </div>
      }
    >
      <LoginForm redirectTo={redirectTo} />
    </Suspense>
  );
}
