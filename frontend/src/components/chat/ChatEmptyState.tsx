'use client';
/**
 * ClickLess AI – Chat Empty State
 *
 * Top-aligned, task-oriented empty state. Guides users into shopping actions
 * rather than just showing a centered logo.
 */
import { useState } from 'react';
import { Stack, Text, Box, SimpleGrid, UnstyledButton } from '@mantine/core';
import { IconSparkles, IconScale, IconRefresh, IconPackage } from '@tabler/icons-react';

const SUGGESTIONS = [
  {
    icon: <IconSparkles size={20} />,
    title: 'Find the best deal',
    text: 'Find noise-canceling headphones under $300',
  },
  {
    icon: <IconScale size={20} />,
    title: 'Compare two options',
    text: 'Compare top laptops for video editing',
  },
  {
    icon: <IconRefresh size={20} />,
    title: 'Reorder something familiar',
    text: 'Buy the best 4K TV on sale right now',
  },
  {
    icon: <IconPackage size={20} />,
    title: 'Track an order',
    text: 'Get me the fastest delivery Amazon laptop',
  },
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
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '80px 2rem 2rem',
      }}
    >
      <Stack gap="xl" style={{ maxWidth: 640, width: '100%' }}>
        {/* Heading */}
        <Stack gap="xs">
          <Text
            style={{
              fontSize: '1.75rem', fontWeight: 700,
              color: 'var(--cl-text-primary)', lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            What do you want to find today?
          </Text>
          <Text size="md" style={{ color: 'var(--cl-text-secondary)', lineHeight: 1.65, maxWidth: 520 }}>
            Describe the product, budget, delivery timing, or retailer preference.
            ClickLess will compare options and only act when you approve.
          </Text>
        </Stack>

        {/* Quick action cards */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {SUGGESTIONS.map((s) => (
            <QuickActionCard
              key={s.title}
              icon={s.icon}
              title={s.title}
              text={s.text}
              onClick={() => onSuggestion(s.text)}
            />
          ))}
        </SimpleGrid>

        {/* Trust line */}
        <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Box
            style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: 'var(--cl-success)',
              flexShrink: 0,
            }}
          />
          <Text size="sm" style={{ color: 'var(--cl-text-muted)' }}>
            Purchases always require your confirmation
          </Text>
        </Box>
      </Stack>
    </Box>
  );
}

function QuickActionCard({
  icon, title, text, onClick,
}: {
  icon: React.ReactNode; title: string; text: string; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <UnstyledButton
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '20px',
        borderRadius: 16,
        backgroundColor: hovered ? 'var(--cl-surface)' : 'var(--cl-surface)',
        border: `1px solid ${hovered ? 'var(--cl-brand)' : 'var(--cl-border)'}`,
        boxShadow: hovered ? '0 4px 12px rgba(47, 99, 245, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-1px)' : 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <Box
        style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: hovered ? 'var(--cl-brand-soft)' : 'var(--cl-surface-raised)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: hovered ? 'var(--cl-brand)' : 'var(--cl-text-muted)',
          transition: 'all 0.2s ease',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Text size="sm" fw={600} style={{ color: 'var(--cl-text-primary)', marginBottom: 2 }}>
          {title}
        </Text>
        <Text size="xs" style={{ color: 'var(--cl-text-muted)', lineHeight: 1.5 }}>
          {text}
        </Text>
      </Box>
    </UnstyledButton>
  );
}
