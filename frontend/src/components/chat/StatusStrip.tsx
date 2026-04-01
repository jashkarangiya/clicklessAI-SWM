'use client';
/**
 * ClickLess AI – Status Strip
 * Shows transient status messages (e.g., "Searching Amazon...")
 */
import { Box, Text, Loader } from '@mantine/core';

interface StatusStripProps {
  text: string | null;
}

export function StatusStrip({ text }: StatusStripProps) {
  if (!text) return null;
  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 16px',
        backgroundColor: 'var(--cl-info-soft)',
        borderTop: '1px solid var(--cl-border)',
        borderBottom: '1px solid var(--cl-border)',
        minHeight: 36,
      }}
      aria-live="polite"
      role="status"
    >
      <Loader size="xs" color="var(--cl-info)" type="dots" />
      <Text size="xs" style={{ color: 'var(--cl-info)', fontWeight: 500 }}>
        {text}
      </Text>
    </Box>
  );
}
