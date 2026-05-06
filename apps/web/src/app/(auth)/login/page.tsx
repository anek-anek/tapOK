import LoginForm from '../../../components/login/LoginForm';

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return <LoginForm searchParams={searchParams} />;
}

