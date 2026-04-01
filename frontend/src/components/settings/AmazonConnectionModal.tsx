'use client';
/**
 * ClickLess AI – Amazon Connection Modal
 *
 * Simulates the secure Playwright authentication boundary described in the
 * System Design Document (Section 11.2).
 */
import { useState, useEffect } from 'react';
import { Modal, Text, Button, Stack, Loader, ThemeIcon, Group, Code, Alert } from '@mantine/core';
import { IconShieldCheck, IconBrowserCheck, IconLockSquareRounded, IconCircleCheck, IconAlertCircle } from '@tabler/icons-react';

interface AmazonConnectionModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: (sessionDetails: any) => void;
}

type ConnectionStep = 'idle' | 'opening_browser' | 'awaiting_login' | 'capturing_session' | 'encrypting' | 'success';

export function AmazonConnectionModal({ opened, onClose, onSuccess }: AmazonConnectionModalProps) {
  const [step, setStep] = useState<ConnectionStep>('idle');

  // Reset state when opened
  useEffect(() => {
    if (opened) setStep('idle');
  }, [opened]);

  const startSimulation = () => {
    setStep('opening_browser');
    
    // Simulate Playwright browser launching
    setTimeout(() => {
      setStep('awaiting_login');
    }, 1500);
  };

  const simulateUserLogin = () => {
    setStep('capturing_session');
    
    // Simulate capturing cookies and translating to storage state
    setTimeout(() => {
      setStep('encrypting');
      
      // Simulate AES-256-GCM encryption step
      setTimeout(() => {
        setStep('success');
        
        // Final success callback after a brief celebration
        setTimeout(() => {
          onSuccess({
            browser_context_id: `ctx_${Math.random().toString(36).substr(2, 9)}`,
            last_verified: new Date().toISOString(),
          });
        }, 1500);
      }, 1500);
    }, 2000);
  };

  return (
    <Modal
      opened={opened}
      onClose={step !== 'success' ? onClose : () => {}}
      title={<Text fw={700}>Connect Amazon Account</Text>}
      centered
      size="md"
      closeOnClickOutside={step === 'idle' || step === 'awaiting_login'}
      withCloseButton={step === 'idle' || step === 'awaiting_login'}
      overlayProps={{ blur: 3, color: 'var(--cl-bg-subtle)' }}
    >
      <Stack gap="md" mt="md">
        
        {step === 'idle' && (
          <>
            <Alert icon={<IconShieldCheck size={16} />} color="blue" variant="light">
              ClickLess AI never stores your Amazon password. 
              We use a secure, isolated container to maintain an authenticated session on your behalf.
            </Alert>
            <Text size="sm" style={{ color: 'var(--cl-text-secondary)' }}>
              When you click continue, a secure browser window will open. You will log in directly to Amazon.com. Once authenticated, we will encrypt and save your session token.
            </Text>
            <Button 
              fullWidth 
              onClick={startSimulation}
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
              Booting isolated Playwright context...
            </Text>
          </Group>
        )}

        {step === 'awaiting_login' && (
          <Stack align="center" gap="md" py="xl">
            <ThemeIcon size={64} radius="xl" variant="light" color="orange">
              <IconBrowserCheck size={32} />
            </ThemeIcon>
            <Text size="sm" ta="center" style={{ color: 'var(--cl-text-secondary)' }}>
              A secure browser window has opened.<br/>Please log in to Amazon (including any 2FA prompts).
            </Text>
            {/* This button mocks the user actually typing their password in the Playwright window */}
            <Button variant="outline" color="orange" onClick={simulateUserLogin} mt="md">
              [Mock] I have logged in successfully
            </Button>
          </Stack>
        )}

        {step === 'capturing_session' && (
          <Group align="center" p="md">
            <Loader size="xs" color="blue" />
            <Text size="sm" style={{ color: 'var(--cl-text-primary)' }}>
              Capturing session cookies and storage state...
            </Text>
          </Group>
        )}

        {step === 'encrypting' && (
          <Group align="center" p="md">
            <ThemeIcon size={24} radius="xl" color="green" variant="light">
              <IconLockSquareRounded size={14} />
            </ThemeIcon>
            <Text size="sm" style={{ color: 'var(--cl-text-primary)' }}>
              Encrypting session state with AES-256-GCM...
            </Text>
          </Group>
        )}

        {step === 'success' && (
          <Stack align="center" gap="xs" py="xl">
            <ThemeIcon size={48} radius="xl" color="green">
              <IconCircleCheck size={28} />
            </ThemeIcon>
            <Text fw={600} size="lg" style={{ color: 'var(--cl-success)' }}>
              Connection Established
            </Text>
            <Text size="sm" style={{ color: 'var(--cl-text-secondary)' }}>
              Your Amazon session is now active and secure.
            </Text>
          </Stack>
        )}
      </Stack>
    </Modal>
  );
}
