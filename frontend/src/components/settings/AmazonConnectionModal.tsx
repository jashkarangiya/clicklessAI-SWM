'use client';
/**
 * ClickLess AI – Amazon Connection Modal
 *
 * Flow:
 * 1. User clicks "Continue" → backend launches a headed Playwright browser to Amazon sign-in
 * 2. User logs in to Amazon in that browser window
 * 3. User clicks "I'm signed in" → backend captures cookies and stores in MongoDB
 */
import { useState } from 'react';
import { Modal, Text, Button, Stack, Loader, ThemeIcon, Group, Alert, Anchor } from '@mantine/core';
import { IconShieldCheck, IconBrowserCheck, IconLockSquareRounded, IconCircleCheck, IconAlertCircle } from '@tabler/icons-react';
import { useAppSelector } from '@/store/hooks';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

type ConnectionStep = 'idle' | 'opening_browser' | 'awaiting_login' | 'capturing_session' | 'success' | 'error';

interface AmazonConnectionContentProps {
  onSuccess: (sessionDetails: any) => void;
}

export function AmazonConnectionContent({ onSuccess }: AmazonConnectionContentProps) {
  const userId = useAppSelector((s) => s.session.user?.id ?? 'anonymous');
  const [step, setStep] = useState<ConnectionStep>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleContinue = async () => {
    setStep('opening_browser');
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/amazon/launch/${encodeURIComponent(userId)}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any).detail ?? `Server error ${res.status}`);
      }
      setStep('awaiting_login');
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to open browser. Is the backend running?');
      setStep('error');
    }
  };

  const handleCaptureSession = async () => {
    setStep('capturing_session');
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/amazon/capture/${encodeURIComponent(userId)}`, {
        method: 'POST',
      });
      const body = await res.json();

      if (!res.ok) {
        throw new Error((body as any).detail ?? `Server error ${res.status}`);
      }
      if (!(body as any).success) {
        // Not logged in yet — go back to awaiting
        setErrorMsg((body as any).message ?? 'Not signed in yet.');
        setStep('awaiting_login');
        return;
      }

      setStep('success');
      setTimeout(() => {
        onSuccess({
          active: true,
          browser_context_id: (body as any).browser_context_id,
          last_verified: (body as any).last_verified,
        });
      }, 1500);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to capture session.');
      setStep('error');
    }
  };

  const retry = () => { setStep('idle'); setErrorMsg(null); };

  return (
    <Stack gap="md" mt="md">
      {step === 'idle' && (
        <>
          <Alert icon={<IconShieldCheck size={16} />} color="blue" variant="light">
            ClickLess AI never stores your Amazon password.
            We open a browser so you sign in directly — only the session cookies are saved.
          </Alert>
          <Text size="sm" style={{ color: 'var(--cl-text-secondary)' }}>
            A browser window will open to the Amazon sign-in page. Once you&apos;re logged in,
            come back here and click the confirmation button.
          </Text>
          <Button
            fullWidth
            onClick={handleContinue}
            style={{ background: 'linear-gradient(135deg, var(--cl-brand) 0%, var(--cl-brand-glow) 100%)', border: 'none' }}
          >
            Continue to Secure Login
          </Button>
        </>
      )}

      {step === 'opening_browser' && (
        <Group align="center" justify="center" p="xl">
          <Loader size="sm" color="brand" type="dots" />
          <Text size="sm" fw={500} style={{ color: 'var(--cl-text-primary)' }}>
            Opening Amazon sign-in…
          </Text>
        </Group>
      )}

      {step === 'awaiting_login' && (
        <Stack align="center" gap="md" py="xl">
          <ThemeIcon size={64} radius="xl" variant="light" color="orange">
            <IconBrowserCheck size={32} />
          </ThemeIcon>
          <Text size="sm" ta="center" style={{ color: 'var(--cl-text-secondary)' }}>
            A browser window has opened to Amazon. Complete your sign-in there (including 2FA if required), then click below.
          </Text>
          {errorMsg && (
            <Alert icon={<IconAlertCircle size={14} />} color="yellow" variant="light" maw={380}>
              {errorMsg}
            </Alert>
          )}
          <Button fullWidth size="md" color="orange" onClick={handleCaptureSession}>
            I&apos;m signed in on Amazon — continue
          </Button>
        </Stack>
      )}

      {step === 'capturing_session' && (
        <Group align="center" p="md" gap="sm">
          <Loader size="xs" color="blue" />
          <Stack gap={2}>
            <Text size="sm" style={{ color: 'var(--cl-text-primary)' }}>
              Capturing session…
            </Text>
            <Group gap={4}>
              <ThemeIcon size={14} radius="xl" color="green" variant="light">
                <IconLockSquareRounded size={8} />
              </ThemeIcon>
              <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>Encrypting with AES-256</Text>
            </Group>
          </Stack>
        </Group>
      )}

      {step === 'success' && (
        <Stack align="center" gap="xs" py="xl">
          <ThemeIcon size={48} radius="xl" color="green">
            <IconCircleCheck size={28} />
          </ThemeIcon>
          <Text fw={600} size="lg" style={{ color: 'var(--cl-success)' }}>
            Amazon Connected
          </Text>
          <Text size="sm" ta="center" style={{ color: 'var(--cl-text-secondary)' }}>
            ClickLess AI can now add products to your Amazon cart.
          </Text>
        </Stack>
      )}

      {step === 'error' && (
        <Stack gap="sm">
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {errorMsg}
          </Alert>
          <Button variant="light" onClick={retry}>Try again</Button>
        </Stack>
      )}
    </Stack>
  );
}

/** Legacy standalone modal wrapper — kept for backwards compatibility. */
interface AmazonConnectionModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: (sessionDetails: any) => void;
}

export function AmazonConnectionModal({ opened, onClose, onSuccess }: AmazonConnectionModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700}>Connect Amazon Account</Text>}
      centered
      size="md"
      zIndex={500}
      overlayProps={{ blur: 3 }}
    >
      <AmazonConnectionContent onSuccess={(d) => { onSuccess(d); onClose(); }} />
    </Modal>
  );
}
