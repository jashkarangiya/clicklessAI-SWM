'use client';
/**
 * ClickLess AI – ProofChip
 *
 * Small rounded pill for trust statements and micro-labels.
 * Variants: default (neutral), brand (juniper), success (green), gold, iris
 */
import { Box } from '@mantine/core';

type ProofChipVariant = 'default' | 'brand' | 'success' | 'gold' | 'iris';

interface ProofChipProps {
  children: React.ReactNode;
  variant?: ProofChipVariant;
  icon?: React.ReactNode;
}

const VARIANT_STYLES: Record<ProofChipVariant, { bg: string; color: string; border: string }> = {
  default: { bg: 'var(--cl-surface-raised)', color: 'var(--cl-text-secondary)', border: 'var(--cl-border)' },
  brand:   { bg: 'var(--cl-brand-soft)', color: 'var(--cl-brand)', border: 'transparent' },
  success: { bg: 'var(--cl-success-soft)', color: 'var(--cl-success)', border: 'transparent' },
  gold:    { bg: 'var(--cl-accent-gold-soft)', color: 'var(--cl-accent-gold)', border: 'transparent' },
  iris:    { bg: 'var(--cl-accent-iris-soft)', color: 'var(--cl-accent-iris)', border: 'transparent' },
};

export function ProofChip({ children, variant = 'default', icon }: ProofChipProps) {
  const style = VARIANT_STYLES[variant];
  return (
    <Box
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        borderRadius: 9999,
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        fontSize: '0.78rem',
        fontWeight: 500,
        color: style.color,
        whiteSpace: 'nowrap',
      }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </Box>
  );
}
