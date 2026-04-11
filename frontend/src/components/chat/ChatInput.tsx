'use client';
/**
 * ClickLess AI – Chat Input
 *
 * Premium composer dock with instructive placeholder and trust microcopy.
 * Enter sends, Shift+Enter = newline
 */
import { useRef, useState, useCallback, KeyboardEvent } from 'react';
import { Box, Textarea, ActionIcon, Tooltip, Text } from '@mantine/core';
import { IconSend, IconSendOff } from '@tabler/icons-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Find a 4K TV under $900 that arrives by Friday',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = !disabled && value.trim().length > 0;

  return (
    <Box
      style={{
        padding: '16px 24px 12px',
        backgroundColor: 'var(--cl-bg)',
      }}
    >
      <Box
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
          backgroundColor: 'var(--cl-surface)',
          border: '1px solid',
          borderColor: isFocused ? 'var(--cl-brand)' : 'var(--cl-border)',
          borderRadius: 20,
          padding: '8px 8px 8px 20px',
          transition: 'border-color 0.2s ease',
          boxShadow: isFocused ? '0 0 0 3px rgba(47, 99, 245, 0.08)' : '0 1px 3px rgba(0,0,0,0.03)',
          minHeight: 56,
        }}
      >
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autosize
          minRows={1}
          maxRows={6}
          id="chat-input"
          aria-label="Chat message input"
          style={{ flex: 1 }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          styles={{
            input: {
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              backgroundColor: 'transparent',
              padding: 0,
              paddingTop: 6,
              resize: 'none',
              color: 'var(--cl-text-primary)',
              lineHeight: 1.6,
              fontSize: '0.95rem',
            },
          }}
        />
        <Tooltip
          label={disabled ? 'Please wait…' : 'Send message (Enter)'}
          withArrow
          position="top-end"
        >
          <ActionIcon
            onClick={handleSend}
            disabled={!canSend}
            size={40}
            radius={9999}
            id="chat-send-btn"
            aria-label="Send message"
            style={{
              flexShrink: 0,
              backgroundColor: canSend ? 'var(--cl-brand)' : 'var(--cl-surface-raised)',
              border: 'none',
              transition: 'all 0.15s ease',
              color: canSend ? '#fff' : 'var(--cl-text-muted)',
            }}
          >
            {disabled ? <IconSendOff size={17} /> : <IconSend size={17} />}
          </ActionIcon>
        </Tooltip>
      </Box>

      {/* Trust microcopy */}
      <Text
        size="xs"
        ta="center"
        style={{ color: 'var(--cl-text-muted)', marginTop: 8, fontSize: '0.72rem' }}
      >
        ClickLess will not place an order without your approval
      </Text>
    </Box>
  );
}
