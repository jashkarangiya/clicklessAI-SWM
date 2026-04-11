'use client';
/**
 * ClickLess AI – SegmentedNav
 *
 * Reusable segmented control for tab-like navigation.
 * Wraps Mantine SegmentedControl with consistent styling.
 */
import { SegmentedControl, Box } from '@mantine/core';

interface SegmentedNavProps {
  value: string;
  onChange: (value: string) => void;
  data: { value: string; label: string }[];
  fullWidth?: boolean;
}

export function SegmentedNav({ value, onChange, data, fullWidth = true }: SegmentedNavProps) {
  return (
    <Box>
      <SegmentedControl
        value={value}
        onChange={onChange}
        data={data}
        fullWidth={fullWidth}
        radius={9999}
        size="sm"
        styles={{
          root: {
            backgroundColor: 'var(--cl-surface-raised)',
            border: '1px solid var(--cl-border)',
            padding: 3,
          },
          indicator: {
            backgroundColor: 'var(--cl-surface)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            borderRadius: 9999,
          },
          label: {
            color: 'var(--cl-text-secondary)',
            fontWeight: 500,
            fontSize: '0.85rem',
            padding: '6px 16px',
            '&[data-active]': {
              color: 'var(--cl-text-primary)',
              fontWeight: 600,
            },
          },
        }}
      />
    </Box>
  );
}
