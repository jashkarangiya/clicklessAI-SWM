'use client';
/**
 * ClickLess AI – Signup Form
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TextInput, PasswordInput, Button, Stack, Text,
  Anchor, Alert, Box, Progress, Divider
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconBrandGoogle } from '@tabler/icons-react';
import { useGoogleLogin } from '@react-oauth/google';
import { authService } from '@/lib/api/authService';
import { useSessionStore } from '@/stores/sessionStore';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8)                           score += 25;
  if (password.length >= 12)                          score += 10;
  if (/[A-Z]/.test(password))                        score += 20;
  if (/[0-9]/.test(password))                        score += 20;
  if (/[^A-Za-z0-9]/.test(password))                 score += 25;

  if (score < 40)  return { score, label: 'Weak',      color: 'var(--cl-error)' };
  if (score < 65)  return { score, label: 'Fair',      color: 'var(--cl-warning)' };
  if (score < 85)  return { score, label: 'Good',      color: 'var(--cl-info)' };
  return           { score, label: 'Strong',    color: 'var(--cl-success)' };
}

export function SignupForm() {
  const router = useRouter();
  const setUser = useSessionStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const form = useForm({
    initialValues: { name: '', email: '', password: '', confirmPassword: '' },
    validate: {
      name:            (v) => (v.trim().length >= 2 ? null : 'Name must be at least 2 characters'),
      email:           (v) => (/^\S+@\S+$/.test(v) ? null : 'Enter a valid email address'),
      password:        (v) => (v.length >= 8 ? null : 'Password must be at least 8 characters'),
      confirmPassword: (v, values) => (v === values.password ? null : 'Passwords do not match'),
    },
  });

  const strength = getPasswordStrength(form.values.password);

  const handleSubmit = form.onSubmit(async (values) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.signup({ name: values.name, email: values.email, password: values.password });
      setUser(res.user, res.token);
      router.push('/app/chat');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse: any) => {
      setGoogleLoading(true);
      setError(null);
      try {
        const res = await authService.googleLogin(tokenResponse.access_token);
        setUser(res.user, res.token);
        router.push('/app/chat');
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Google Signup failed.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setError('Google Signup was cancelled or failed.');
    },
  });

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack gap="lg">
        <Stack gap="xs">
          <Text
            component="h2"
            style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--cl-text-primary)', margin: 0 }}
          >
            Create your account
          </Text>
          <Text size="sm" style={{ color: 'var(--cl-text-secondary)' }}>
            Start shopping smarter in seconds
          </Text>
        </Stack>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" radius="md"
            style={{ backgroundColor: 'var(--cl-error-soft)', borderColor: 'var(--cl-error)' }}>
            <Text size="sm" style={{ color: 'var(--cl-error)' }}>{error}</Text>
          </Alert>
        )}

        <Button
          variant="default"
          leftSection={<IconBrandGoogle size={18} />}
          fullWidth
          size="md"
          radius="md"
          loading={googleLoading}
          onClick={() => handleGoogleLogin()}
          style={{ height: 44, fontWeight: 500 }}
        >
          Sign up with Google
        </Button>

        <Divider
          label={<Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>or sign up with email</Text>}
          labelPosition="center"
          color="var(--cl-border)"
        />

        <TextInput
          label="Full name"
          placeholder="Alex Chen"
          autoComplete="name"
          id="signup-name"
          {...form.getInputProps('name')}
        />

        <TextInput
          label="Email address"
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          id="signup-email"
          {...form.getInputProps('email')}
        />

        <Stack gap="xs">
          <PasswordInput
            label="Password"
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            id="signup-password"
            {...form.getInputProps('password')}
          />
          {form.values.password.length > 0 && (
            <Box>
              <Progress
                value={strength.score}
                size="xs"
                radius="xl"
                color={strength.color}
                styles={{ section: { backgroundColor: strength.color } }}
              />
              <Text size="xs" style={{ color: strength.color, marginTop: 4 }}>
                Password strength: {strength.label}
              </Text>
            </Box>
          )}
        </Stack>

        <PasswordInput
          label="Confirm password"
          placeholder="Repeat your password"
          autoComplete="new-password"
          id="signup-confirm-password"
          {...form.getInputProps('confirmPassword')}
        />

        <Button
          type="submit"
          variant="brand"
          loading={loading}
          fullWidth
          size="md"
          id="signup-submit"
          style={{
            background: 'linear-gradient(135deg, var(--cl-brand) 0%, var(--cl-brand-glow) 100%)',
            border: 'none',
            fontWeight: 600,
            height: 44,
          }}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </Button>

        <Text size="sm" ta="center" style={{ color: 'var(--cl-text-secondary)' }}>
          Already have an account?{' '}
          <Anchor href="/login" style={{ color: 'var(--cl-brand)', fontWeight: 600 }}>
            Sign in
          </Anchor>
        </Text>
      </Stack>
    </Box>
  );
}
