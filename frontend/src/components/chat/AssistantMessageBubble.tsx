'use client';
/**
 * ClickLess AI – Assistant & System Message Bubble
 */
import { Box, Text } from '@mantine/core';
import { LogoMark } from '@/components/branding/LogoMark';
import { formatTimestamp } from '@/lib/utils/formatters';

interface AssistantMessageBubbleProps {
  content: string;
  timestamp: string;
  isSystem?: boolean;
}

export function AssistantMessageBubble({ content, timestamp, isSystem = false }: AssistantMessageBubbleProps) {
  return (
    <Box style={{ display: 'flex', gap: 12, alignItems: 'flex-end', maxWidth: '80%' }}>
      {!isSystem && (
        <Box
          style={{
            flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
            backgroundColor: 'var(--cl-surface-raised)',
            border: '1px solid var(--cl-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <LogoMark size={20} animated={false} />
        </Box>
      )}
      <Box style={{ flex: 1 }}>
        <Box
          style={{
            backgroundColor: 'var(--cl-surface)',
            border: '1px solid var(--cl-border)',
            borderRadius: isSystem ? '10px' : '4px 16px 16px 16px',
            padding: '10px 16px',
            lineHeight: 1.6,
          }}
        >
          <Text size="sm" style={{ color: 'var(--cl-text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {content}
          </Text>
        </Box>
        <Text size="xs" style={{ color: 'var(--cl-text-muted)', marginTop: 4 }}>
          {formatTimestamp(timestamp)}
        </Text>
      </Box>
    </Box>
  );
}
