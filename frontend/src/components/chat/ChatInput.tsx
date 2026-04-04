'use client';
/**
 * ClickLess AI – Chat Input
 * Enter sends, Shift+Enter = newline
 */
import { useRef, useState, useCallback, KeyboardEvent } from 'react';
import { Box, Textarea, ActionIcon, Tooltip } from '@mantine/core';
import { IconSend, IconSendOff } from '@tabler/icons-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Message ClickLess AI…',
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

  return (
    <Box
      style={{
        borderTop: '1px solid var(--cl-border)',
        padding: '12px 16px',
        backgroundColor: 'var(--cl-bg-subtle)',
      }}
    >
      <Box
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
          backgroundColor: 'var(--cl-surface)',
          border: '1px solid',
          borderColor: isFocused ? 'var(--cl-border-strong)' : 'var(--cl-border)',
          borderRadius: 12,
          padding: '6px 6px 6px 12px',
          transition: 'border-color 0.2s',
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
              paddingTop: 4,
              resize: 'none',
              color: 'var(--cl-text-primary)',
              lineHeight: 1.6,
              fontSize: '0.9rem',
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
            disabled={disabled || !value.trim()}
            size="lg"
            radius="md"
            id="chat-send-btn"
            aria-label="Send message"
            style={{
              flexShrink: 0,
              backgroundColor: disabled || !value.trim() ? 'var(--cl-surface-alt)' : 'var(--cl-brand)',
              background: disabled || !value.trim()
                ? 'var(--cl-surface-alt)'
                : 'linear-gradient(135deg, var(--cl-brand) 0%, var(--cl-brand-glow) 100%)',
              border: 'none',
              transition: 'all 0.2s ease',
              color: '#fff',
            }}
          >
            {disabled ? <IconSendOff size={16} /> : <IconSend size={16} />}
          </ActionIcon>
        </Tooltip>
      </Box>
      <Box style={{ textAlign: 'center', marginTop: 6 }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--cl-text-muted)' }}>
          Enter to send · Shift+Enter for new line
        </span>
      </Box>
    </Box>
  );
}
