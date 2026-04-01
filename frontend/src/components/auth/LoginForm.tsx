'use client';
/**
 * ClickLess AI – Login Form
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TextInput, PasswordInput, Button, Checkbox, Stack, Text,
  Anchor, Alert, Box, Divider
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconBrandGoogle } from '@tabler/icons-react';
import { useGoogleLogin } from '@react-oauth/google';
import { authService } from '@/lib/api/authService';
import { useSessionStore } from '@/stores/sessionStore';

export function LoginForm() {
  const router = useRouter();
  const setUser = useSessionStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: { email: '', password: '', rememberMe: false },
    validate: {
      email:    (v) => (/^\S+@\S+$/.test(v) ? null : 'Enter a valid email address'),
      password: (v) => (v.length >= 6 ? null : 'Password must be at least 6 characters'),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.login(values);
      setUser(res.user, res.token);
      router.push('/app/chat');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed. Please try again.');
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
        setError(e instanceof Error ? e.message : 'Google Login failed.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setError('Google Login was cancelled or failed.');
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
            Welcome back
          </Text>
          <Text size="sm" style={{ color: 'var(--cl-text-secondary)' }}>
            Sign in to your ClickLess AI account
          </Text>
        </Stack>

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
            radius="md"
            style={{ backgroundColor: 'var(--cl-error-soft)', borderColor: 'var(--cl-error)' }}
          >
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
          Continue with Google
        </Button>

        <Divider
          label={<Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>or continue with email</Text>}
          labelPosition="center"
          color="var(--cl-border)"
        />

        <TextInput
          label="Email address"
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          id="login-email"
          {...form.getInputProps('email')}
        />

        <PasswordInput
          label="Password"
          placeholder="Your password"
          autoComplete="current-password"
          id="login-password"
          {...form.getInputProps('password')}
        />

        <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Checkbox
            label="Remember me"
            id="login-remember"
            {...form.getInputProps('rememberMe', { type: 'checkbox' })}
            styles={{ label: { color: 'var(--cl-text-secondary)', cursor: 'pointer' } }}
          />
          <Anchor
            href="#"
            size="sm"
            style={{ color: 'var(--cl-brand)' }}
            onClick={(e) => e.preventDefault()}
          >
            Forgot password?
          </Anchor>
        </Box>

        <Button
          type="submit"
          variant="brand"
          loading={loading}
          fullWidth
          size="md"
          id="login-submit"
          style={{
            background: 'linear-gradient(135deg, var(--cl-brand) 0%, var(--cl-brand-glow) 100%)',
            border: 'none',
            fontWeight: 600,
            height: 44,
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>

        <Divider
          label={<Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>or</Text>}
          labelPosition="center"
          color="var(--cl-border)"
        />

        <Text size="sm" ta="center" style={{ color: 'var(--cl-text-secondary)' }}>
          Don&apos;t have an account?{' '}
          <Anchor href="/signup" style={{ color: 'var(--cl-brand)', fontWeight: 600 }}>
            Sign up free
          </Anchor>
        </Text>
      </Stack>
    </Box>
  );
}
