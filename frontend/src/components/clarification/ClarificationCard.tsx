'use client';
/**
 * ClickLess AI – ClarificationCard
 *
 * Renders a clarification question with selectable option pills.
 * Options become disabled once one is selected.
 * Supports both option-based and free-text clarification.
 */
import { Box, Text, Button, Stack, Textarea } from '@mantine/core';
import { useState } from 'react';
import type { ClarificationMessage } from '@/contracts/chat';
import { LogoMark } from '@/components/branding/LogoMark';

interface ClarificationCardProps {
  message: ClarificationMessage;
  onSelect: (optionId: string, value: string) => void;
  onFreeText?: (text: string) => void;
}

export function ClarificationCard({ message, onSelect, onFreeText }: ClarificationCardProps) {
  const { clarification, selectedOption, timestamp: _ts } = message;
  const [selected, setSelected] = useState<string | null>(selectedOption ?? null);
  const [freeText, setFreeText] = useState('');
  const isAnswered = selected !== null;

  const handleOption = (id: string, value: string) => {
    if (isAnswered) return;
    setSelected(id);
    onSelect(id, value);
  };

  const handleFreeTextSubmit = () => {
    if (!freeText.trim() || isAnswered) return;
    setSelected('__free_text__');
    onFreeText?.(freeText.trim());
  };

  return (
    <Box
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        maxWidth: '85%',
      }}
      data-testid="clarification-card"
    >
      <Box
        style={{
          flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
          backgroundColor: 'var(--cl-brand-soft)',
          border: '1px solid var(--cl-border-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: 4,
        }}
      >
        <LogoMark size={18} animated={false} />
      </Box>

      <Box
        style={{
          backgroundColor: 'var(--cl-surface-alt)',
          border: '1px solid var(--cl-border-strong)',
          borderRadius: '4px 16px 16px 16px',
          padding: '16px',
          flex: 1,
        }}
      >
        <Text size="sm" fw={600} style={{ color: 'var(--cl-text-primary)', marginBottom: 12 }}>
          {clarification.question}
        </Text>

        {clarification.options && clarification.options.length > 0 && (
          <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: clarification.free_text ? 12 : 0 }}>
            {clarification.options.map((opt) => {
              const isSelected = selected === opt.id;
              return (
                <Button
                  key={opt.id}
                  size="xs"
                  variant={isSelected ? 'brand' : 'surface'}
                  onClick={() => handleOption(opt.id, opt.value)}
                  disabled={isAnswered && !isSelected}
                  data-testid={`clarification-option-${opt.id}`}
                  aria-pressed={isSelected}
                  style={{
                    borderRadius: 20,
                    fontWeight: 500,
                    opacity: isAnswered && !isSelected ? 0.4 : 1,
                    cursor: isAnswered ? 'default' : 'pointer',
                    ...(isSelected ? {
                      background: 'linear-gradient(135deg, var(--cl-brand) 0%, var(--cl-brand-glow) 100%)',
                      border: 'none', color: '#fff',
                    } : {}),
                  }}
                >
                  {opt.label}
                  {isSelected && ' ✓'}
                </Button>
              );
            })}
          </Box>
        )}

        {clarification.free_text && !isAnswered && (
          <Stack gap="xs">
            <Textarea
              placeholder="Type your answer…"
              value={freeText}
              onChange={(e) => setFreeText(e.currentTarget.value)}
              minRows={2}
              maxRows={4}
              disabled={isAnswered}
              styles={{
                input: {
                  backgroundColor: 'var(--cl-surface)',
                  borderColor: 'var(--cl-border)',
                  color: 'var(--cl-text-primary)',
                },
              }}
            />
            <Button
              size="xs"
              onClick={handleFreeTextSubmit}
              disabled={!freeText.trim() || isAnswered}
              style={{
                alignSelf: 'flex-end',
                background: 'linear-gradient(135deg, var(--cl-brand) 0%, var(--cl-brand-glow) 100%)',
                border: 'none',
              }}
            >
              Submit
            </Button>
          </Stack>
        )}

        {isAnswered && (
          <Text size="xs" style={{ color: 'var(--cl-text-muted)', marginTop: 8 }}>
            ✓ Answered
          </Text>
        )}
      </Box>
    </Box>
  );
}
