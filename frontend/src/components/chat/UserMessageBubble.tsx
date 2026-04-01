'use client';
/**
 * ClickLess AI – User Message Bubble
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
            backgroundColor: 'var(--cl-brand)',
            background: 'linear-gradient(135deg, var(--cl-brand) 0%, var(--cl-brand-glow) 100%)',
            color: '#fff',
            borderRadius: '16px 16px 4px 16px',
            padding: '10px 16px',
            lineHeight: 1.6,
          }}
        >
          <Text size="sm" style={{ color: '#fff', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {content}
          </Text>
        </Box>
        <Text size="xs" ta="right" style={{ color: 'var(--cl-text-muted)', marginTop: 4 }}>
          {formatTimestamp(timestamp)}
        </Text>
      </Box>
    </Box>
  );
}
