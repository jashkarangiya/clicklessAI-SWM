'use client';
/**
 * ClickLess AI – Chat Empty State
 *
 * Intentional hierarchy:
 *   1. Time-based serif greeting (intimate, personal)
 *   2. Tight display heading (clear CTA)
 *   3. Slightly-above-center layout (faster perceived interaction)
 *   4. Horizontal suggestion cards (icon + text on same axis)
 */
import { useState } from 'react';
import { Stack, Text, Box, SimpleGrid, UnstyledButton } from '@mantine/core';
import { IconSearch, IconArrowsRightLeft, IconRefresh, IconTruck } from '@tabler/icons-react';
import { useAppSelector } from '@/store/hooks';

// ── Time-based greeting ───────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Card definitions — unified brand teal palette ─────────────────────────────
const SUGGESTIONS = [
  {
    icon: <IconSearch          size={17} strokeWidth={2} />,
    title: 'Find the best deal',
    text:  'Find noise-canceling headphones under $300',
  },
  {
    icon: <IconArrowsRightLeft size={17} strokeWidth={2} />,
    title: 'Compare two options',
    text:  'Compare top laptops for video editing under $1,500',
  },
  {
    icon: <IconRefresh         size={17} strokeWidth={2} />,
    title: 'Reorder something familiar',
    text:  'Reorder my last coffee pods from Amazon',
  },
  {
    icon: <IconTruck           size={17} strokeWidth={2} />,
    title: 'Track an order',
    text:  'Where is my Sony headphones order?',
  },
] as const;

interface ChatEmptyStateProps {
  onSuggestion: (text: string) => void;
}

export function ChatEmptyState({ onSuggestion }: ChatEmptyStateProps) {
  const user      = useAppSelector((s) => s.session.user);
  const firstName = user?.name?.split(' ')[0] ?? null;
  const greeting  = getGreeting();

  return (
    <Box
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Bias slightly above centre — matches ChatGPT / Notion feel
        paddingBottom: 'clamp(64px, 11vh, 112px)',
        padding: '0 1.5rem',
        paddingBottom: 'clamp(64px, 11vh, 112px)',
      }}
    >
      <Stack
        gap={0}
        style={{ maxWidth: 680, width: '100%' }}
      >
        {/* ── Greeting + heading ── */}
        <Box style={{ marginBottom: 6 }}>
          {firstName && (
            <Text
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(1rem, 1.6vw, 1.15rem)',
                color: 'var(--cl-brand)',
                letterSpacing: '0.01em',
                lineHeight: 1.4,
                marginBottom: 8,
              }}
            >
              {greeting}, {firstName}.
            </Text>
          )}

          <Text
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontWeight: 400,
              fontSize: 'clamp(1.9rem, 3.2vw, 2.4rem)',
              color: 'var(--cl-text-primary)',
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
              maxWidth: 560,
            }}
          >
            {firstName ? 'What are you shopping for?' : 'What are you shopping for today?'}
          </Text>
        </Box>

        {/* ── Subtitle ── */}
        <Text
          style={{
            fontSize: '0.95rem',
            color: '#3D4B5E',         // deliberately darker than --cl-text-secondary
            lineHeight: 1.7,
            maxWidth: 480,
            marginBottom: 28,
          }}
        >
          Describe the product, budget, or delivery deadline —
          ClickLess finds it across every retailer and only checks out when you say so.
        </Text>

        {/* ── Suggestion cards ── */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={10}>
          {SUGGESTIONS.map((s) => (
            <QuickActionCard key={s.title} suggestion={s} onClick={() => onSuggestion(s.text)} />
          ))}
        </SimpleGrid>
      </Stack>
    </Box>
  );
}

// ── Card component ────────────────────────────────────────────────────────────

type Suggestion = typeof SUGGESTIONS[number];

function QuickActionCard({
  suggestion: s,
  onClick,
}: {
  suggestion: Suggestion;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <UnstyledButton
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '14px 16px',
        borderRadius: 14,
        backgroundColor: hovered ? 'var(--cl-surface)' : 'var(--cl-surface)',
        border: `1px solid ${hovered ? 'rgba(12,122,138,0.25)' : 'var(--cl-border)'}`,
        boxShadow: hovered
          ? '0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)'
          : '0 1px 3px rgba(0,0,0,0.03)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.16s ease',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 13,
        textAlign: 'left',
      }}
    >
      {/* Icon pill — always brand teal */}
      <Box
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          backgroundColor: hovered ? 'rgba(12,122,138,0.12)' : 'var(--cl-brand-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--cl-brand)',
          transition: 'background-color 0.16s ease',
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {s.icon}
      </Box>

      {/* Text */}
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Text
          size="sm"
          fw={600}
          style={{
            color: 'var(--cl-text-primary)',
            lineHeight: 1.3,
            marginBottom: 3,
          }}
        >
          {s.title}
        </Text>
        <Text
          size="xs"
          style={{
            color: 'var(--cl-text-muted)',
            lineHeight: 1.45,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {s.text}
        </Text>
      </Box>
    </UnstyledButton>
  );
}
