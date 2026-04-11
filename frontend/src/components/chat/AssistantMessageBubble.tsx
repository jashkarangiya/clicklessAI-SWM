'use client';
/**
 * ClickLess AI – Assistant & System Message Bubble
 *
 * White card style with clear internal hierarchy.
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
    <Box style={{ display: 'flex', gap: 12, alignItems: 'flex-start', maxWidth: '80%' }}>
      {!isSystem && (
        <Box
          style={{
            flexShrink: 0, width: 32, height: 32, borderRadius: 10,
            backgroundColor: 'var(--cl-brand-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: 2,
          }}
        >
          <LogoMark size={18} animated={false} />
        </Box>
      )}
      <Box style={{ flex: 1 }}>
        <Box
          style={{
            backgroundColor: 'var(--cl-surface)',
            border: '1px solid var(--cl-border)',
            borderRadius: 20,
            padding: '14px 20px',
            lineHeight: 1.65,
          }}
        >
          <Text size="sm" style={{ color: 'var(--cl-text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {content}
          </Text>
        </Box>
        <Text size="xs" style={{ color: 'var(--cl-text-muted)', marginTop: 6, marginLeft: 4 }}>
          {formatTimestamp(timestamp)}
        </Text>
      </Box>
    </Box>
  );
}
