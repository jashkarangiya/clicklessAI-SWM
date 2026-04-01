'use client';
/**
 * ClickLess AI – Purchase Success Card
 */
import { Box, Text, Stack, Group } from '@mantine/core';
import { IconCheck, IconTruck } from '@tabler/icons-react';
import type { PurchaseSuccessMessage } from '@/contracts/chat';

interface PurchaseSuccessCardProps {
  message: PurchaseSuccessMessage;
}

export function PurchaseSuccessCard({ message }: PurchaseSuccessCardProps) {
  return (
    <Box
      style={{
        backgroundColor: 'var(--cl-success-soft)',
        border: '1px solid var(--cl-success)',
        borderLeft: '4px solid var(--cl-success)',
        borderRadius: 12,
        padding: '18px',
        maxWidth: '80%',
      }}
      role="status"
    >
      <Stack gap="sm">
        <Group gap="sm" align="center">
          <Box
            style={{
              width: 32, height: 32, borderRadius: '50%',
              backgroundColor: 'var(--cl-success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconCheck size={18} color="#fff" />
          </Box>
          <Text fw={700} style={{ color: 'var(--cl-success)' }}>Order Placed!</Text>
        </Group>
        <Text size="sm" fw={600} style={{ color: 'var(--cl-text-primary)', lineHeight: 1.4 }}>
          {message.product_name}
        </Text>
        <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>
          Order ID: {message.order_id}
        </Text>
        {message.delivery_label && (
          <Group gap={6} align="center">
            <IconTruck size={13} style={{ color: 'var(--cl-success)' }} />
            <Text size="sm" style={{ color: 'var(--cl-success)', fontWeight: 500 }}>
              {message.delivery_label}
            </Text>
          </Group>
        )}
      </Stack>
    </Box>
  );
}
