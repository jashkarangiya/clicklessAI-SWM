'use client';
/**
 * ClickLess AI – Chat Empty State
 */
import { useState } from 'react';
import { Stack, Text, Box, Button, SimpleGrid } from '@mantine/core';
import { IconSearch, IconShoppingCart, IconStar, IconBolt } from '@tabler/icons-react';
import { BrandLockup } from '@/components/branding/BrandLockup';

const SUGGESTIONS = [
  { icon: <IconSearch size={16} />, text: 'Find noise-canceling headphones under $300' },
  { icon: <IconShoppingCart size={16} />, text: 'Buy the best 4K TV on sale right now' },
  { icon: <IconStar size={16} />, text: 'Compare top laptops for video editing' },
  { icon: <IconBolt size={16} />, text: 'Get me the fastest delivery Amazon laptop' },
];

interface ChatEmptyStateProps {
  onSuggestion: (text: string) => void;
}

export function ChatEmptyState({ onSuggestion }: ChatEmptyStateProps) {
  return (
    <Box
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <Stack align="center" gap="xl" style={{ maxWidth: 560, textAlign: 'center' }}>
        <BrandLockup size="xl" variant="stacked" />

        <Stack gap="xs">
          <Text
            style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--cl-text-primary)', lineHeight: 1.3 }}
          >
            What can I find for you today?
          </Text>
          <Text size="sm" style={{ color: 'var(--cl-text-secondary)', lineHeight: 1.7 }}>
            Tell me what you&apos;re looking for. I&apos;ll search Amazon and Walmart,
            compare results, and only place an order after you confirm every detail.
          </Text>
        </Stack>

        <Box
          style={{
            backgroundColor: 'var(--cl-surface)',
            border: '1px solid var(--cl-border)',
            borderRadius: 12,
            padding: '4px',
            width: '100%',
          }}
        >
          <Text size="xs" style={{ color: 'var(--cl-text-muted)', padding: '8px 12px 4px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Try asking
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs" style={{ padding: '0 4px 4px' }}>
            {SUGGESTIONS.map((s) => (
              <SuggestionButton
                key={s.text}
                icon={s.icon}
                text={s.text}
                onClick={() => onSuggestion(s.text)}
              />
            ))}
          </SimpleGrid>
        </Box>
      </Stack>
    </Box>
  );
}

function SuggestionButton({ icon, text, onClick }: { icon: React.ReactNode; text: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Button
      variant="subtle"
      leftSection={icon}
      onClick={onClick}
      size="sm"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        justifyContent: 'flex-start',
        color: 'var(--cl-text-secondary)',
        textAlign: 'left',
        height: 'auto',
        padding: '8px 12px',
        lineHeight: 1.4,
        border: '1px solid',
        borderColor: hovered ? 'var(--cl-border)' : 'transparent',
        backgroundColor: hovered ? 'var(--cl-surface-alt)' : 'transparent',
        borderRadius: 8,
      }}
      styles={{ label: { whiteSpace: 'normal', textAlign: 'left', flex: 1 } }}
    >
      {text}
    </Button>
  );
}
