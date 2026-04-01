'use client';
/**
 * ClickLess AI – ErrorMessageCard
 *
 * Renders all error types with appropriate visual treatment.
 * Retryable errors show a retry action.
 */
import { Box, Text, Button, Stack } from '@mantine/core';
import {
  IconAlertTriangle, IconWifiOff, IconLock,
  IconCreditCard, IconMapPin, IconRefresh, IconShieldX,
} from '@tabler/icons-react';
import type { ErrorMessage } from '@/contracts/chat';

const ERROR_CODE_CONFIG: Record<string, { icon: React.ReactNode; title: string; isWarning?: boolean }> = {
  SESSION_EXPIRED:  { icon: <IconLock size={18} />,          title: 'Session Expired',           isWarning: true },
  CAPTCHA_REQUIRED: { icon: <IconShieldX size={18} />,       title: 'CAPTCHA Required',          isWarning: true },
  PRICE_CHANGED:    { icon: <IconAlertTriangle size={18} />, title: 'Price Changed',             isWarning: true },
  OUT_OF_STOCK:     { icon: <IconAlertTriangle size={18} />, title: 'Item Out of Stock',         isWarning: true },
  PAYMENT_MISMATCH: { icon: <IconCreditCard size={18} />,    title: 'Payment Issue' },
  ADDRESS_MISMATCH: { icon: <IconMapPin size={18} />,        title: 'Address Issue' },
  NETWORK_ERROR:    { icon: <IconWifiOff size={18} />,       title: 'Network Error' },
  CHECKOUT_FAILED:  { icon: <IconAlertTriangle size={18} />, title: 'Checkout Failed' },
};

interface ErrorMessageCardProps {
  message: ErrorMessage;
  onRetry?: () => void;
}

export function ErrorMessageCard({ message, onRetry }: ErrorMessageCardProps) {
  const { error } = message;
  const config = ERROR_CODE_CONFIG[error.code] ?? {
    icon: <IconAlertTriangle size={18} />,
    title: 'Something went wrong',
  };
  const isWarning = config.isWarning;
  const borderColor = isWarning ? 'var(--cl-warning)' : 'var(--cl-error)';
  const bgColor     = isWarning ? 'var(--cl-warning-soft)' : 'var(--cl-error-soft)';
  const iconColor   = isWarning ? 'var(--cl-warning)' : 'var(--cl-error)';

  return (
    <Box
      style={{
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}40`,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: 10,
        padding: '14px 16px',
        maxWidth: '80%',
      }}
      data-testid={`error-card-${error.code}`}
      role="alert"
    >
      <Stack gap="xs">
        <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: iconColor }}>{config.icon}</span>
          <Text fw={700} size="sm" style={{ color: iconColor }}>{config.title}</Text>
        </Box>
        <Text size="sm" style={{ color: 'var(--cl-text-secondary)', lineHeight: 1.6 }}>
          {error.message}
        </Text>
        {error.retryable && onRetry && (
          <Button
            size="xs"
            variant="subtle"
            leftSection={<IconRefresh size={13} />}
            onClick={onRetry}
            style={{
              alignSelf: 'flex-start',
              color: 'var(--cl-text-secondary)',
              border: '1px solid var(--cl-border)',
            }}
          >
            Try again
          </Button>
        )}
      </Stack>
    </Box>
  );
}
