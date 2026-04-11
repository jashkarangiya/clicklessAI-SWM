'use client';
/**
 * ClickLess AI – Signup Form
 *
 * Form panel content only — no logo (logo lives in page chrome).
 * title → sign-in link → Google → divider → name / email / password →
 * live password requirements (shown when password field has content) →
 * CTA → terms → "Compare first. Connect retailers later."
 *
 * No confirm password field — live requirements replace it.
 * Same 56px / radius-18 input treatment as LoginForm.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TextInput, PasswordInput, Button, Stack, Text,
  Anchor, Alert, Box, Divider, Group,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconAlertCircle, IconBrandGoogle, IconArrowRight, IconShieldCheck,
  IconCheck, IconX,
} from '@tabler/icons-react';
import { useGoogleLogin } from '@react-oauth/google';
import { authService } from '@/lib/api/authService';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/sessionSlice';

// Input styles driven by global componentOverrides
const INPUT_PROPS = { radius: 8 } as const;

/* ── Password requirement checks ─────────────────────────────────────────── */
interface Requirement {
  label: string;
  test: (pw: string) => boolean;
}

const REQUIREMENTS: Requirement[] = [
  { label: 'At least 8 characters',    test: (pw) => pw.length >= 8 },
  { label: 'One uppercase letter',      test: (pw) => /[A-Z]/.test(pw) },
  { label: 'One number',               test: (pw) => /[0-9]/.test(pw) },
  { label: 'One special character',    test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function PasswordRequirements({ password }: { password: string }) {
  return (
    <Box style={{ marginTop: 8 }}>
      <Stack gap={4}>
        {REQUIREMENTS.map(({ label, test }) => {
          const met = test(password);
          return (
            <Box
              key={label}
              style={{ display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <Box
                style={{
                  width: 16, height: 16,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: met
                    ? 'var(--cl-success-soft)'
                    : 'var(--cl-surface-raised)',
                  flexShrink: 0,
                  transition: 'background-color var(--motion-fast) var(--ease-standard)',
                }}
              >
                {met
                  ? <IconCheck size={9}  style={{ color: 'var(--cl-success)' }} />
                  : <IconX    size={9}  style={{ color: 'var(--cl-text-muted)', opacity: 0.5 }} />
                }
              </Box>
              <Text
                size="xs"
                style={{
                  color: met ? 'var(--cl-success)' : 'var(--cl-text-muted)',
                  transition: 'color var(--motion-fast) var(--ease-standard)',
                }}
              >
                {label}
              </Text>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

/* ── Signup form ─────────────────────────────────────────────────────────── */
export function SignupForm() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading]             = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const form = useForm({
    initialValues: { name: '', email: '', password: '' },
    validate: {
      name:     (v) => (v.trim().length >= 2  ? null : 'Name must be at least 2 characters'),
      email:    (v) => (/^\S+@\S+$/.test(v)   ? null : 'Enter a valid email address'),
      password: (v) => {
        if (v.length < 8)              return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(v))         return 'Add at least one uppercase letter';
        if (!/[0-9]/.test(v))         return 'Add at least one number';
        if (!/[^A-Za-z0-9]/.test(v))  return 'Add at least one special character';
        return null;
      },
    },
  });

  const showRequirements = form.values.password.length > 0;

  const handleSubmit = form.onSubmit(async (values) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.signup({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      dispatch(setUser({ user: res.user, token: res.token }));
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
        dispatch(setUser({ user: res.user, token: res.token }));
        router.push('/app/chat');
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Google signup failed.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => setError('Google signup was cancelled or failed.'),
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
            Create account
          </Text>
          <Text size="sm" style={{ color: 'var(--cl-text-secondary)' }}>
            Already have an account?{' '}
            <Anchor
              href="/login"
              style={{
                color: 'var(--cl-brand)',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'opacity var(--motion-fast) ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            >
              Sign in
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
            style={{
              backgroundColor: 'var(--cl-error-soft)',
              border: '1px solid rgba(214,92,92,0.2)',
            }}
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
          label={<Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>or sign up with email</Text>}
          labelPosition="center"
          color="var(--cl-border)"
        />

        {/* Full name */}
        <TextInput
          label="Full name"
          placeholder="Alex Chen"
          autoComplete="name"
          id="signup-name"
          {...INPUT_PROPS}
          {...form.getInputProps('name')}
        />

        {/* Email */}
        <TextInput
          label="Email address"
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          id="signup-email"
          {...INPUT_PROPS}
          {...form.getInputProps('email')}
        />

        {/* Password + live requirements */}
        <Stack gap={0}>
          <PasswordInput
            label="Password"
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            id="signup-password"
            {...INPUT_PROPS}
            {...form.getInputProps('password')}
          />
          {showRequirements && (
            <PasswordRequirements password={form.values.password} />
          )}
        </Stack>

        {/* Primary CTA */}
        <Button
          type="submit"
          variant="brand"
          loading={loading}
          fullWidth
          radius={16}
          id="signup-submit"
          rightSection={
            !loading
              ? <IconArrowRight size={17} className="signup-arrow" style={{ transition: 'transform 140ms ease' }} />
              : null
          }
          style={{ height: 44, fontWeight: 600, fontSize: '0.875rem', marginTop: 4 }}
          className="cl-btn-lift"
          onMouseEnter={(e) => {
            const arrow = e.currentTarget.querySelector('.signup-arrow') as HTMLElement;
            if (arrow) arrow.style.transform = 'translateX(2px)';
          }}
          onMouseLeave={(e) => {
            const arrow = e.currentTarget.querySelector('.signup-arrow') as HTMLElement;
            if (arrow) arrow.style.transform = 'translateX(0)';
          }}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </Button>

        {/* Terms */}
        <Group gap={6} justify="center">
          <IconShieldCheck size={13} style={{ color: 'var(--cl-text-muted)' }} />
          <Text size="xs" style={{ color: 'var(--cl-text-muted)', textAlign: 'center' }}>
            By signing up you agree to our{' '}
            <Anchor href="#" style={{ color: 'var(--cl-text-muted)' }}>Terms</Anchor>
            {' '}and{' '}
            <Anchor href="#" style={{ color: 'var(--cl-text-muted)' }}>Privacy Policy</Anchor>.
          </Text>
        </Group>

        {/* Closing reassurance */}
        <Text
          size="xs"
          ta="center"
          style={{
            color: 'var(--cl-text-muted)',
            fontStyle: 'italic',
            borderTop: '1px solid var(--cl-border)',
            paddingTop: 12,
          }}
        >
          Compare first. Connect retailers later.
        </Text>
      </Stack>
    </Box>
  );
}
