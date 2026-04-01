'use client';
/**
 * ClickLess AI – Purchase Confirmation Modal
 *
 * NON-NEGOTIABLE BEHAVIOR:
 * - Shows full purchase details (product, price, delivery, payment)
 * - Has prominent Confirm button + Cancel
 * - For totals > $500: adds a second "Are you absolutely sure?" step
 * - Shows countdown if confirmation has an expiry
 * - Never styled like a casual chat bubble
 */
import { useEffect, useState } from 'react';
import {
  Modal, Stack, Text, Group, Button, Badge, Box,
  Divider, Alert
} from '@mantine/core';
import {
  IconAlertTriangle, IconShoppingCart, IconX,
  IconMapPin, IconCreditCard, IconTruck, IconClock,
} from '@tabler/icons-react';
import type { PurchaseConfirmation } from '@/contracts/purchase';
import { formatPrice, formatDate } from '@/lib/utils/formatters';

interface PurchaseConfirmationModalProps {
  opened: boolean;
  confirmation: PurchaseConfirmation;
  onConfirm: (confirmationId: string) => void;
  onCancel: () => void;
}

export function PurchaseConfirmationModal({
  opened, confirmation, onConfirm, onCancel,
}: PurchaseConfirmationModalProps) {
  const [stage, setStage] = useState<'review' | 'double_confirm'>('review');
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const totalPrice = confirmation.total_price ?? confirmation.product.pricing.current;
  const isHighValue = totalPrice >= 500;

  // Expiry countdown
  useEffect(() => {
    if (!confirmation.expires_at || !opened) return;
    const tick = () => {
      const diff = Math.floor((new Date(confirmation.expires_at!).getTime() - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, diff));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [confirmation.expires_at, opened]);

  const handleConfirm = () => {
    if (isHighValue && stage === 'review') {
      setStage('double_confirm');
      return;
    }
    onConfirm(confirmation.confirmation_id);
  };

  const isExpired = secondsLeft !== null && secondsLeft <= 0;

  return (
    <Modal
      opened={opened}
      onClose={onCancel}
      title="Confirm Purchase"
      size="md"
      styles={{
        header: {
          backgroundColor: 'var(--cl-surface)',
          borderBottom: '2px solid var(--cl-border-strong)',
        },
        content: {
          backgroundColor: 'var(--cl-surface)',
          border: '2px solid var(--cl-border-strong)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
        },
        title: {
          color: 'var(--cl-text-primary)',
          fontWeight: 700,
          fontSize: '1.1rem',
        },
      }}
      data-testid="purchase-confirmation-modal"
    >
      <Stack gap="md">
        {/* Warning banner */}
        {stage === 'review' && (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            color="yellow"
            style={{
              backgroundColor: 'var(--cl-warning-soft)',
              border: '1px solid var(--cl-warning)',
            }}
          >
            <Text size="sm" fw={600} style={{ color: 'var(--cl-warning)' }}>
              Review carefully — this will place a real order
            </Text>
          </Alert>
        )}

        {/* Double confirm warning */}
        {stage === 'double_confirm' && (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            color="red"
            style={{ backgroundColor: 'var(--cl-error-soft)', border: '1px solid var(--cl-error)' }}
          >
            <Text size="sm" fw={700} style={{ color: 'var(--cl-error)' }}>
              This purchase is over $500. Are you absolutely sure?
            </Text>
            <Text size="xs" style={{ color: 'var(--cl-text-secondary)', marginTop: 4 }}>
              Once confirmed, the order cannot be cancelled through ClickLess AI.
            </Text>
          </Alert>
        )}

        {/* Expiry countdown */}
        {secondsLeft !== null && (
          <Box style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconClock size={14} style={{ color: secondsLeft < 60 ? 'var(--cl-error)' : 'var(--cl-text-muted)' }} />
            <Text size="xs" style={{ color: secondsLeft < 60 ? 'var(--cl-error)' : 'var(--cl-text-muted)' }}>
              {isExpired
                ? 'This confirmation has expired'
                : `Expires in ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`
              }
            </Text>
          </Box>
        )}

        {/* Product */}
        <Box
          style={{
            backgroundColor: 'var(--cl-surface-alt)',
            border: '1px solid var(--cl-border)',
            borderRadius: 10,
            padding: '14px',
          }}
        >
          <Text size="xs" fw={700} style={{ color: 'var(--cl-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Product
          </Text>
          <Text fw={600} size="sm" style={{ color: 'var(--cl-text-primary)', marginBottom: 4 }}>
            {confirmation.product.name}
          </Text>
          <Group gap="sm" align="center">
            <Text fw={700} style={{ color: 'var(--cl-brand)', fontSize: '1.2rem' }}>
              {formatPrice(totalPrice)}
            </Text>
            {confirmation.product.pricing.original && confirmation.product.pricing.original > totalPrice && (
              <Text size="sm" style={{ textDecoration: 'line-through', color: 'var(--cl-text-muted)' }}>
                {formatPrice(confirmation.product.pricing.original)}
              </Text>
            )}
            <Badge size="sm" style={{ backgroundColor: 'rgba(255,153,0,0.15)', color: '#FF9900', textTransform: 'capitalize', border: 'none' }}>
              via {confirmation.product.source}
            </Badge>
          </Group>
        </Box>

        <Divider color="var(--cl-border)" />

        {/* Delivery */}
        <Group gap="sm" align="flex-start">
          <IconMapPin size={16} style={{ color: 'var(--cl-text-muted)', marginTop: 2, flexShrink: 0 }} />
          <Box>
            <Text size="xs" fw={700} style={{ color: 'var(--cl-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Delivery
            </Text>
            <Text size="sm" style={{ color: 'var(--cl-text-primary)' }}>
              {confirmation.delivery.address}
              {confirmation.delivery.city && `, ${confirmation.delivery.city}`}
              {confirmation.delivery.state && `, ${confirmation.delivery.state}`}
              {confirmation.delivery.zip && ` ${confirmation.delivery.zip}`}
            </Text>
            {confirmation.delivery.estimate_label && (
              <Group gap={4} align="center" style={{ marginTop: 4 }}>
                <IconTruck size={12} style={{ color: 'var(--cl-success)' }} />
                <Text size="xs" style={{ color: 'var(--cl-success)', fontWeight: 500 }}>
                  {confirmation.delivery.estimate_label}
                </Text>
              </Group>
            )}
          </Box>
        </Group>

        {/* Payment */}
        <Group gap="sm" align="flex-start">
          <IconCreditCard size={16} style={{ color: 'var(--cl-text-muted)', marginTop: 2, flexShrink: 0 }} />
          <Box>
            <Text size="xs" fw={700} style={{ color: 'var(--cl-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Payment
            </Text>
            <Text size="sm" style={{ color: 'var(--cl-text-primary)' }}>
              {confirmation.payment.method_type}
              {confirmation.payment.last_four && ` ending in ${confirmation.payment.last_four}`}
            </Text>
          </Box>
        </Group>

        {/* Return policy */}
        {confirmation.return_summary && (
          <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>
            ↩ {confirmation.return_summary}
          </Text>
        )}

        <Divider color="var(--cl-border)" />

        {/* Action buttons */}
        <Group gap="sm" justify="flex-end">
          <Button
            variant="surface"
            leftSection={<IconX size={14} />}
            onClick={onCancel}
            data-testid="confirm-cancel-btn"
            style={{
              border: '1px solid var(--cl-border)',
              color: 'var(--cl-text-secondary)',
              backgroundColor: 'var(--cl-surface-alt)',
            }}
          >
            Cancel
          </Button>
          <Button
            leftSection={<IconShoppingCart size={14} />}
            onClick={handleConfirm}
            disabled={isExpired}
            data-testid="confirm-purchase-btn"
            style={{
              background: isExpired
                ? 'var(--cl-surface-alt)'
                : stage === 'double_confirm'
                  ? `linear-gradient(135deg, var(--cl-error) 0%, #ef4444 100%)`
                  : `linear-gradient(135deg, var(--cl-brand) 0%, var(--cl-brand-glow) 100%)`,
              border: 'none',
              fontWeight: 700,
              minWidth: 140,
              color: '#fff',
            }}
          >
            {isExpired
              ? 'Expired'
              : stage === 'double_confirm'
                ? 'Yes, place order'
                : `Confirm — ${formatPrice(totalPrice)}`
            }
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
