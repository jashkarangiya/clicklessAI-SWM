'use client';
/**
 * ClickLess AI – User Message Bubble
 *
 * Compact pale-blue pill aligned right.
 */
import { Box, Text } from '@mantine/core';
import { formatTimestamp } from '@/lib/utils/formatters';

interface UserMessageBubbleProps {
  content: string;
  timestamp: string;
}

export function UserMessageBubble({ content, timestamp }: UserMessageBubbleProps) {
  return (
    <Box style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'flex-end' }}>
      <Box style={{ maxWidth: '70%' }}>
        <Box
          style={{
            backgroundColor: 'var(--cl-brand-soft)',
            color: 'var(--cl-brand)',
            borderRadius: '20px 20px 6px 20px',
            padding: '12px 18px',
            lineHeight: 1.6,
          }}
        >
          <Text size="sm" fw={500} style={{ color: 'var(--cl-text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {content}
          </Text>
        </Box>
        <Text size="xs" ta="right" style={{ color: 'var(--cl-text-muted)', marginTop: 6, marginRight: 4 }}>
          {formatTimestamp(timestamp)}
        </Text>
      </Box>
    </Box>
  );
}
