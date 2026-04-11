'use client';
/**
 * ClickLess AI – Shortlist Panel
 *
 * Compact horizontal list of saved/shortlisted product items.
 * Used in the context panel sidebar.
 */
import { Box, Text, ActionIcon, Stack, Group, ScrollArea } from '@mantine/core';
import { IconX, IconShoppingCart } from '@tabler/icons-react';

interface ShortlistItem {
  id: string;
  name: string;
  price: number;
  retailer: string;
  imageUrl?: string;
}

interface ShortlistPanelProps {
  items: ShortlistItem[];
  onRemove: (id: string) => void;
  onBuy: (id: string) => void;
}

export function ShortlistPanel({ items, onRemove, onBuy }: ShortlistPanelProps) {
  if (items.length === 0) {
    return (
      <Box style={{ padding: '16px', textAlign: 'center' }}>
        <Text size="sm" style={{ color: 'var(--cl-text-muted)' }}>
          No items shortlisted yet.
        </Text>
        <Text size="xs" style={{ color: 'var(--cl-text-muted)', marginTop: 4 }}>
          Ask ClickLess to find products and add them here.
        </Text>
      </Box>
    );
  }

  return (
    <Stack gap="xs">
      <Group justify="space-between" px="sm">
        <Text size="xs" fw={600} style={{ color: 'var(--cl-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Shortlist
        </Text>
        <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>
          {items.length} item{items.length !== 1 ? 's' : ''}
        </Text>
      </Group>

      <ScrollArea.Autosize mah={280}>
        <Stack gap={6} px="sm">
          {items.map((item) => (
            <Box
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 12,
                backgroundColor: 'var(--cl-surface)',
                border: '1px solid var(--cl-border)',
                transition: 'border-color 0.15s ease',
              }}
            >
              {/* Product image placeholder */}
              {item.imageUrl ? (
                <Box
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    backgroundColor: 'var(--cl-surface-raised)',
                    overflow: 'hidden', flexShrink: 0,
                  }}
                >
                  <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </Box>
              ) : (
                <Box
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    backgroundColor: 'var(--cl-surface-raised)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconShoppingCart size={14} style={{ color: 'var(--cl-text-muted)' }} />
                </Box>
              )}

              {/* Info */}
              <Box style={{ flex: 1, overflow: 'hidden' }}>
                <Text size="xs" fw={600} lineClamp={1} style={{ color: 'var(--cl-text-primary)' }}>
                  {item.name}
                </Text>
                <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>
                  ${item.price.toFixed(2)} · {item.retailer}
                </Text>
              </Box>

              {/* Actions */}
              <Group gap={2}>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={() => onBuy(item.id)}
                  style={{ color: 'var(--cl-brand)' }}
                  aria-label={`Buy ${item.name}`}
                >
                  <IconShoppingCart size={13} />
                </ActionIcon>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={() => onRemove(item.id)}
                  style={{ color: 'var(--cl-text-muted)' }}
                  aria-label={`Remove ${item.name}`}
                >
                  <IconX size={13} />
                </ActionIcon>
              </Group>
            </Box>
          ))}
        </Stack>
      </ScrollArea.Autosize>
    </Stack>
  );
}
