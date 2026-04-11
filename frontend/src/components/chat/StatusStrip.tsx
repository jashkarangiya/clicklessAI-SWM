'use client';
/**
 * ClickLess AI – Status Strip
 * Shows transient status messages inline (e.g., "Searching Amazon...")
 * Subtle, not banner-style.
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
        padding: '8px 24px',
        backgroundColor: 'var(--cl-bg)',
      }}
      aria-live="polite"
      role="status"
    >
      <Loader size={14} color="var(--cl-info)" type="dots" />
      <Text size="xs" style={{ color: 'var(--cl-info)', fontWeight: 500 }}>
        {text}
      </Text>
    </Box>
  );
}
