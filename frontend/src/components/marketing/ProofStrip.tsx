'use client';
/**
 * ClickLess AI – Proof Strip
 *
 * Thin row under the hero with 4 compact trust micro-panels.
 * Clean, not badge-template-y. Feels like inline engineering proof.
 */
import { Box, Text, Group } from '@mantine/core';
import { IconEyeOff, IconShieldCheck, IconActivity, IconPlugConnected } from '@tabler/icons-react';

const PROOFS = [
  { icon: <IconEyeOff size={14} />, label: 'No stored passwords' },
  { icon: <IconShieldCheck size={14} />, label: 'Approval before purchase' },
  { icon: <IconActivity size={14} />, label: 'Live connection state' },
  { icon: <IconPlugConnected size={14} />, label: 'Amazon + Walmart' },
];

export function ProofStrip() {
  return (
    <Box
      style={{
        borderTop: '1px solid var(--cl-border)',
        borderBottom: '1px solid var(--cl-border)',
        backgroundColor: 'var(--cl-surface-alt)',
        padding: '14px 2rem',
      }}
    >
      <Box
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          flexWrap: 'wrap',
        }}
        className="proof-strip-row"
      >
        {PROOFS.map((p) => (
          <Group key={p.label} gap={8} wrap="nowrap">
            <span style={{ color: 'var(--cl-text-muted)', display: 'flex' }}>{p.icon}</span>
            <Text size="xs" fw={500} style={{ color: 'var(--cl-text-secondary)', whiteSpace: 'nowrap' }}>
              {p.label}
            </Text>
          </Group>
        ))}
      </Box>

      <style>{`
        @media (max-width: 640px) {
          .proof-strip-row { gap: 1rem !important; justify-content: flex-start !important; }
        }
      `}</style>
    </Box>
  );
}
