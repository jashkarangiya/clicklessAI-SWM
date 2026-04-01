import type { Metadata } from 'next';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { SignupForm } from '@/components/auth/SignupForm';

export const metadata: Metadata = { title: 'Create Account' };

export default function SignupPage() {
  return (
    <AuthLayout
      title="Your AI shopping assistant awaits."
      subtitle="Create an account and start letting ClickLess AI do the heavy lifting — you always have the final say."
    >
      <SignupForm />
    </AuthLayout>
  );
}
