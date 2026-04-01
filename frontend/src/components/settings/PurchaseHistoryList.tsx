'use client';
/**
 * ClickLess AI – Purchase History List
 */
import { Box, Text, Badge, Stack, Group } from '@mantine/core';
import { IconCheck, IconTruck, IconX, IconClock } from '@tabler/icons-react';
import type { OrderRecord } from '@/contracts/purchase';
import { formatPrice, formatDate } from '@/lib/utils/formatters';

interface PurchaseHistoryListProps {
  orders: OrderRecord[];
}

const STATUS_ICON = {
  placed:    <IconClock size={14} />,
  shipped:   <IconTruck size={14} />,
  delivered: <IconCheck size={14} />,
  cancelled: <IconX size={14} />,
  failed:    <IconX size={14} />,
};
const STATUS_COLOR = {
  placed:    'var(--cl-info)',
  shipped:   'var(--cl-brand)',
  delivered: 'var(--cl-success)',
  cancelled: 'var(--cl-text-muted)',
  failed:    'var(--cl-error)',
};

export function PurchaseHistoryList({ orders }: PurchaseHistoryListProps) {
  if (!orders.length) {
    return (
      <Box style={{ textAlign: 'center', padding: '2rem', color: 'var(--cl-text-muted)' }}>
        <Text size="sm">No purchase history yet.</Text>
      </Box>
    );
  }

  return (
    <Stack gap="sm">
      {orders.map((order) => (
        <Box
          key={order.order_id}
          style={{
            backgroundColor: 'var(--cl-surface)',
            border: '1px solid var(--cl-border)',
            borderRadius: 10,
            padding: '14px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <Box style={{ flex: 1, minWidth: 200 }}>
            <Text fw={600} size="sm" style={{ color: 'var(--cl-text-primary)' }} lineClamp={1}>
              {order.product_name}
            </Text>
            <Group gap="xs" style={{ marginTop: 4 }}>
              <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>
                via {order.source}
              </Text>
              <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>·</Text>
              <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>
                {formatDate(order.placed_at)}
              </Text>
            </Group>
          </Box>
          <Group gap="sm" align="center">
            <Text fw={700} size="sm" style={{ color: 'var(--cl-text-primary)' }}>
              {formatPrice(order.price, order.currency)}
            </Text>
            <Badge
              size="xs"
              leftSection={STATUS_ICON[order.status]}
              style={{
                backgroundColor: `${STATUS_COLOR[order.status]}20`,
                color: STATUS_COLOR[order.status],
                border: `1px solid ${STATUS_COLOR[order.status]}40`,
                textTransform: 'capitalize', fontWeight: 600,
              }}
            >
              {order.status}
            </Badge>
          </Group>
        </Box>
      ))}
    </Stack>
  );
}
