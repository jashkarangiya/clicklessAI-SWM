'use client';
/**
 * ClickLess AI – Login Form
 *
 * Form panel content: logo mark → title → amber signup link →
 * Google button → divider → email → password → remember/forgot → CTA → trust line.
 *
 * Inputs: 56px height, 18px radius.
 * Google button: 56px, full-width, premium border treatment.
 * Primary CTA: 56px, juniper fill, arrow nudge on hover.
 * Trust line: one sentence below CTA.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TextInput, PasswordInput, Button, Checkbox, Stack, Text,
  Anchor, Alert, Box, Divider, Group,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconAlertCircle, IconBrandGoogle, IconArrowRight, IconShieldCheck,
} from '@tabler/icons-react';
import { useGoogleLogin } from '@react-oauth/google';
import { authService } from '@/lib/api/authService';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/sessionSlice';

// Input styles now driven by global componentOverrides — just pass radius override
const INPUT_PROPS = { radius: 8 } as const;

export function LoginForm() {
  const router       = useRouter();
  const dispatch     = useAppDispatch();
  const [loading, setLoading]           = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const form = useForm({
    initialValues: { email: '', password: '', rememberMe: false },
    validate: {
      email:    (v) => (/^\S+@\S+$/.test(v)  ? null : 'Enter a valid email address'),
      password: (v) => (v.length >= 6         ? null : 'Password must be at least 6 characters'),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.login(values);
      dispatch(setUser({ user: res.user, token: res.token }));
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
        dispatch(setUser({ user: res.user, token: res.token }));
        router.push('/app/chat');
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Google login failed.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => setError('Google login was cancelled or failed.'),
  });

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack gap="lg">
        {/* Title */}
        <Stack gap="xs" align="center" style={{ textAlign: 'center', marginBottom: 4 }}>
          <Text
            component="h2"
            style={{
              fontSize: '2rem', fontWeight: 700,
              color: 'var(--cl-text-primary)', margin: 0,
              letterSpacing: '-0.025em',
            }}
          >
            Welcome back.
          </Text>
          <Text size="sm" style={{ color: 'var(--cl-text-secondary)' }}>
            Enter your credentials to continue.{' '}
            <Anchor
              href="/signup"
              style={{
                color: 'var(--cl-brand)',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'opacity var(--motion-fast) ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            >
              Create account
            </Anchor>
          </Text>
        </Stack>

        {/* Error */}
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
            radius="lg"
            style={{ backgroundColor: 'var(--cl-error-soft)', border: '1px solid rgba(214,92,92,0.2)' }}
          >
            <Text size="sm" style={{ color: 'var(--cl-error)' }}>{error}</Text>
          </Alert>
        )}

        {/* Google button */}
        <Button
          variant="default"
          leftSection={<IconBrandGoogle size={17} />}
          fullWidth
          radius={8}
          loading={googleLoading}
          onClick={() => handleGoogleLogin()}
          style={{
            height: 44,
            fontWeight: 500,
            fontSize: '0.875rem',
            backgroundColor: '#FFFFFF',
            borderColor: '#D9DEE6',
            color: '#142033',
            transition: 'border-color 140ms ease, background-color 140ms ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = '#B8C0CC';
            el.style.backgroundColor = '#F8F9FB';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = '#D9DEE6';
            el.style.backgroundColor = '#FFFFFF';
          }}
        >
          Continue with Google
        </Button>

        <Divider
          label={<Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>or continue with email</Text>}
          labelPosition="center"
          color="var(--cl-border)"
        />

        {/* Email */}
        <TextInput
          label="Email address"
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          id="login-email"
          {...INPUT_PROPS}
          {...form.getInputProps('email')}
        />

        {/* Password */}
        <PasswordInput
          label="Password"
          placeholder="Your password"
          autoComplete="current-password"
          id="login-password"
          {...INPUT_PROPS}
          {...form.getInputProps('password')}
        />

        {/* Remember / Forgot */}
        <Group justify="space-between">
          <Checkbox
            label="Remember me"
            id="login-remember"
            size="sm"
            styles={{ label: { color: 'var(--cl-text-secondary)', cursor: 'pointer' } }}
            {...form.getInputProps('rememberMe', { type: 'checkbox' })}
          />
          <Anchor
            href="#"
            size="sm"
            style={{
              color: 'var(--cl-text-muted)',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'color var(--motion-fast) ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--cl-text-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--cl-text-muted)'; }}
            onClick={(e) => e.preventDefault()}
          >
            Forgot password?
          </Anchor>
        </Group>

        {/* Primary CTA */}
        <Button
          type="submit"
          variant="brand"
          loading={loading}
          fullWidth
          radius={16}
          id="login-submit"
          rightSection={
            !loading
              ? <IconArrowRight size={17} className="login-arrow" style={{ transition: 'transform 140ms ease' }} />
              : null
          }
          style={{ height: 44, fontWeight: 600, fontSize: '0.875rem' }}
          className="cl-btn-lift"
          onMouseEnter={(e) => {
            const arrow = e.currentTarget.querySelector('.login-arrow') as HTMLElement;
            if (arrow) arrow.style.transform = 'translateX(2px)';
          }}
          onMouseLeave={(e) => {
            const arrow = e.currentTarget.querySelector('.login-arrow') as HTMLElement;
            if (arrow) arrow.style.transform = 'translateX(0)';
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>

        {/* Trust line */}
        <Group gap={6} justify="center">
          <IconShieldCheck size={13} style={{ color: 'var(--cl-text-muted)' }} />
          <Text size="xs" style={{ color: 'var(--cl-text-muted)', textAlign: 'center' }}>
            Retailer credentials are never stored. Sessions expire automatically.
          </Text>
        </Group>
      </Stack>
    </Box>
  );
}
