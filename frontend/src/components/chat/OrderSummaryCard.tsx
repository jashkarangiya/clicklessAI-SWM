'use client';
/**
 * ClickLess AI – Order Summary Card
 *
 * Inline order summary shown in chat or context panel.
 * Displays: item, retailer, price, delivery, and cobalt CTA.
 */
import { Box, Text, Button, Group, Stack, Badge } from '@mantine/core';
import { IconShoppingCart, IconTruck, IconShieldCheck } from '@tabler/icons-react';

interface OrderSummaryCardProps {
  productName: string;
  retailer: string;
  price: number;
  deliveryEstimate?: string;
  imageUrl?: string;
  onApprove: () => void;
  onCancel?: () => void;
}

export function OrderSummaryCard({
  productName, retailer, price, deliveryEstimate, imageUrl, onApprove, onCancel,
}: OrderSummaryCardProps) {
  const retailerColor = retailer.toLowerCase() === 'amazon' ? '#FF9900' : '#0071CE';

  return (
    <Box
      style={{
        backgroundColor: 'var(--cl-surface)',
        border: '2px solid var(--cl-brand)',
        borderRadius: 20,
        padding: '24px',
        maxWidth: 440,
      }}
    >
      <Stack gap="md">
        {/* Header */}
        <Group gap="xs" align="center">
          <IconShoppingCart size={16} style={{ color: 'var(--cl-brand)' }} />
          <Text size="sm" fw={600} style={{ color: 'var(--cl-brand)' }}>Order Summary</Text>
        </Group>

        {/* Product info */}
        <Box style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          {imageUrl && (
            <Box
              style={{
                width: 56, height: 56, borderRadius: 12,
                backgroundColor: 'var(--cl-surface-raised)',
                border: '1px solid var(--cl-border)',
                overflow: 'hidden', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </Box>
          )}
          <Stack gap={4} style={{ flex: 1 }}>
            <Text size="sm" fw={600} lineClamp={2} style={{ color: 'var(--cl-text-primary)', lineHeight: 1.4 }}>
              {productName}
            </Text>
            <Badge
              size="xs"
              radius={9999}
              style={{
                backgroundColor: `${retailerColor}10`,
                color: retailerColor,
                border: 'none',
                fontWeight: 600,
                textTransform: 'capitalize',
                width: 'fit-content',
              }}
            >
              via {retailer}
            </Badge>
          </Stack>
        </Box>

        {/* Price & delivery */}
        <Box
          style={{
            backgroundColor: 'var(--cl-surface-raised)',
            borderRadius: 12,
            padding: '14px 16px',
          }}
        >
          <Group justify="space-between" align="center">
            <Box>
              <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>Total</Text>
              <Text fw={700} size="lg" style={{ color: 'var(--cl-text-primary)' }}>
                ${price.toFixed(2)}
              </Text>
            </Box>
            {deliveryEstimate && (
              <Group gap={4} align="center">
                <IconTruck size={14} style={{ color: 'var(--cl-success)' }} />
                <Text size="xs" fw={500} style={{ color: 'var(--cl-success)' }}>
                  {deliveryEstimate}
                </Text>
              </Group>
            )}
          </Group>
        </Box>

        {/* Actions */}
        <Stack gap="xs">
          <Button
            fullWidth
            variant="brand"
            leftSection={<IconShoppingCart size={16} />}
            onClick={onApprove}
            style={{ height: 44, fontWeight: 600 }}
          >
            Approve purchase
          </Button>
          {onCancel && (
            <Button
              fullWidth
              variant="surface"
              onClick={onCancel}
              style={{ height: 40 }}
            >
              Cancel
            </Button>
          )}
        </Stack>

        {/* Trust line */}
        <Group gap={6} justify="center">
          <IconShieldCheck size={13} style={{ color: 'var(--cl-text-muted)' }} />
          <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>
            You confirm every purchase
          </Text>
        </Group>
      </Stack>
    </Box>
  );
}
