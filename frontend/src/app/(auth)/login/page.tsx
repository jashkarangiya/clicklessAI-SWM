import type { Metadata } from 'next';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = { title: 'Sign In' };

export default function LoginPage() {
  return (
    <AuthLayout
      title="Shop smarter, click less."
      subtitle="ClickLess AI finds, compares, and purchases products for you — you stay in full control."
    >
      <LoginForm />
    </AuthLayout>
  );
}
