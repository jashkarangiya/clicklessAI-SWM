import type { Metadata } from 'next';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { SignupForm } from '@/components/auth/SignupForm';

export const metadata: Metadata = { title: 'Create Account – ClickLess AI' };

export default function SignupPage() {
  return (
    <AuthLayout variant="signup">
      <SignupForm />
    </AuthLayout>
  );
}
