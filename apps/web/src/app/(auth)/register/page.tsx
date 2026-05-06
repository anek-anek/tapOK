import RegisterForm from '../../../components/register/RegisterForm';

interface RegisterPageProps {
  searchParams: Promise<{ redirectTo?: string }>;
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  return <RegisterForm searchParams={searchParams} />;
}

