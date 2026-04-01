'use client';
/**
 * ClickLess AI – Purchase Progress Card
 */
import { Box, Text, Progress, Stack } from '@mantine/core';
import { IconShoppingCart, IconMapPin, IconCreditCard, IconSend, IconCheck } from '@tabler/icons-react';
import type { PurchaseProgressMessage } from '@/contracts/chat';

const STAGE_CONFIG = {
  cart:       { icon: <IconShoppingCart size={16} />, label: 'Adding to cart' },
  address:    { icon: <IconMapPin size={16} />,       label: 'Verifying address' },
  payment:    { icon: <IconCreditCard size={16} />,   label: 'Verifying payment' },
  placing:    { icon: <IconSend size={16} />,         label: 'Placing order' },
  confirming: { icon: <IconCheck size={16} />,        label: 'Confirming' },
};

interface PurchaseProgressCardProps {
  message: PurchaseProgressMessage;
}

export function PurchaseProgressCard({ message }: PurchaseProgressCardProps) {
  const { progress } = message;
  const config = STAGE_CONFIG[progress.stage];

  return (
    <Box
      style={{
        backgroundColor: 'var(--cl-surface)',
        border: '1px solid var(--cl-border)',
        borderRadius: 12,
        padding: '16px',
        maxWidth: '80%',
      }}
    >
      <Stack gap="sm">
        <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--cl-brand)' }}>{config.icon}</span>
          <Text size="sm" fw={600} style={{ color: 'var(--cl-text-primary)' }}>
            {config.label}
          </Text>
        </Box>
        <Text size="xs" style={{ color: 'var(--cl-text-secondary)' }}>{progress.message}</Text>
        {progress.pct !== undefined && (
          <Progress
            value={progress.pct}
            size="xs"
            radius="xl"
            styles={{ section: { background: 'linear-gradient(90deg, var(--cl-brand) 0%, var(--cl-brand-glow) 100%)' } }}
            animated
          />
        )}
      </Stack>
    </Box>
  );
}
