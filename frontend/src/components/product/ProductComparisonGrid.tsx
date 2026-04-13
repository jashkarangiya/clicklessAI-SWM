'use client';
/**
 * ClickLess AI – Product Comparison Grid
 *
 * Renders all products in a side-by-side grid (desktop) / stacked (mobile).
 * Includes comparison highlights strip: cheapest, best rated, fastest delivery.
 */
import { useState, useCallback } from 'react';
import { Box, Stack, Text, SimpleGrid, Badge, Group, ActionIcon, Tooltip, Loader } from '@mantine/core';
import { IconTag, IconStar, IconTruck, IconVolume, IconPlayerStop } from '@tabler/icons-react';
import type { NormalizedProduct } from '@/contracts/product';
import { ProductCard } from './ProductCard';
import { formatPrice } from '@/lib/utils/formatters';
import { speak, stopSpeaking } from '@/lib/api/elevenLabsService';

interface ProductComparisonGridProps {
  products: NormalizedProduct[];
  summary?: string;
  onBuy: (product: NormalizedProduct) => void;
  onDetail: (product: NormalizedProduct) => void;
}

export function ProductComparisonGrid({ products, summary, onBuy, onDetail }: ProductComparisonGridProps) {
  const [speakState, setSpeakState] = useState<'idle' | 'loading' | 'playing'>('idle');

  const handleSpeak = useCallback(async () => {
    if (!summary) return;
    if (speakState === 'playing') {
      stopSpeaking();
      setSpeakState('idle');
      return;
    }
    setSpeakState('loading');
    try {
      await speak(summary, (playing) => setSpeakState(playing ? 'playing' : 'idle'));
    } catch {
      setSpeakState('idle');
    }
  }, [summary, speakState]);

  // Deduplicate by product_id — backend may return the same item more than once
  const seen = new Set<string>();
  const uniqueProducts = products.filter((p) => {
    if (seen.has(p.product_id)) return false;
    seen.add(p.product_id);
    return true;
  });

  if (!uniqueProducts.length) return null;

  const cheapest  = [...uniqueProducts].sort((a, b) => (a.pricing?.current ?? 0) - (b.pricing?.current ?? 0))[0]!;
  const bestRated = [...uniqueProducts].sort((a, b) => (b.ratings?.average ?? 0) - (a.ratings?.average ?? 0))[0]!;
  const fastest   = [...uniqueProducts].sort((a, b) => (a.delivery?.estimate_days ?? 99) - (b.delivery?.estimate_days ?? 99))[0]!;

  const highlights = [
    { icon: <IconTag size={12} />,  label: 'Cheapest',   product: cheapest,  value: formatPrice(cheapest.pricing?.current ?? 0) },
    { icon: <IconStar size={12} />, label: 'Best Rated', product: bestRated, value: (bestRated.ratings?.average != null) ? `${bestRated.ratings.average.toFixed(1)}★` : '—' },
    { icon: <IconTruck size={12} />, label: 'Fastest',   product: fastest,   value: fastest.delivery?.estimate_label ?? `${fastest.delivery?.estimate_days ?? '?'}d` },
  ];

  const cols = Math.min(uniqueProducts.length, 3);

  return (
    <Stack gap="md" style={{ width: '100%' }} data-testid="product-comparison-grid">
      {/* LLM summary */}
      {summary && (
        <Box
          style={{
            backgroundColor: 'var(--cl-surface)',
            border: '1px solid var(--cl-border)',
            borderRadius: 16,
            padding: '12px 16px',
          }}
        >
          <Text size="sm" style={{ color: 'var(--cl-text-secondary)', lineHeight: 1.6 }}>
            {summary}
          </Text>
          <Box style={{ display: 'flex', alignItems: 'center', marginTop: 6 }}>
            <Tooltip
              label={speakState === 'playing' ? 'Stop' : speakState === 'loading' ? 'Loading audio…' : 'Read aloud'}
              position="right"
              withArrow
            >
              <ActionIcon
                onClick={handleSpeak}
                disabled={speakState === 'loading'}
                size={22}
                variant="subtle"
                radius={6}
                aria-label="Read aloud"
                style={{
                  color: speakState === 'playing' ? 'var(--cl-brand)' : 'var(--cl-text-muted)',
                  opacity: speakState === 'idle' ? 0.55 : 1,
                  transition: 'opacity 0.15s ease, color 0.15s ease',
                }}
              >
                {speakState === 'loading'
                  ? <Loader size={12} color="var(--cl-brand)" />
                  : speakState === 'playing'
                    ? <IconPlayerStop size={13} />
                    : <IconVolume size={13} />
                }
              </ActionIcon>
            </Tooltip>
          </Box>
        </Box>
      )}

      {/* Highlights strip */}
      <Group gap="sm" wrap="wrap">
        {highlights.map((h) => (
          <Box
            key={h.label}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              backgroundColor: 'var(--cl-surface)',
              border: '1px solid var(--cl-border)',
              borderRadius: 9999, padding: '6px 14px',
            }}
          >
            <span style={{ color: 'var(--cl-brand)' }}>{h.icon}</span>
            <Text size="xs" style={{ color: 'var(--cl-text-muted)', fontWeight: 600 }}>{h.label}:</Text>
            <Text size="xs" style={{ color: 'var(--cl-text-primary)', fontWeight: 700 }}>{h.value}</Text>
            <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>({h.product.source})</Text>
          </Box>
        ))}
      </Group>

      {/* Product grid */}
      <SimpleGrid
        cols={{ base: 1, sm: Math.min(cols, 2), md: cols }}
        spacing="md"
      >
        {uniqueProducts.map((p) => (
          <ProductCard key={p.product_id} product={p} onBuy={onBuy} onDetail={onDetail} />
        ))}
      </SimpleGrid>
    </Stack>
  );
}
