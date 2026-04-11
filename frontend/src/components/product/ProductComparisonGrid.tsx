'use client';
/**
 * ClickLess AI – Product Comparison Grid
 *
 * Renders all products in a side-by-side grid (desktop) / stacked (mobile).
 * Includes comparison highlights strip: cheapest, best rated, fastest delivery.
 */
import { Box, Stack, Text, SimpleGrid, Badge, Group } from '@mantine/core';
import { IconTag, IconStar, IconTruck } from '@tabler/icons-react';
import type { NormalizedProduct } from '@/contracts/product';
import { ProductCard } from './ProductCard';
import { formatPrice } from '@/lib/utils/formatters';

interface ProductComparisonGridProps {
  products: NormalizedProduct[];
  summary?: string;
  onBuy: (product: NormalizedProduct) => void;
  onDetail: (product: NormalizedProduct) => void;
}

export function ProductComparisonGrid({ products, summary, onBuy, onDetail }: ProductComparisonGridProps) {
  if (!products.length) return null;

  const cheapest  = [...products].sort((a, b) => a.pricing.current - b.pricing.current)[0]!;
  const bestRated = [...products].sort((a, b) => (b.ratings?.average ?? 0) - (a.ratings?.average ?? 0))[0]!;
  const fastest   = [...products].sort((a, b) => (a.delivery?.estimate_days ?? 99) - (b.delivery?.estimate_days ?? 99))[0]!;

  const highlights = [
    { icon: <IconTag size={12} />,  label: 'Cheapest',       product: cheapest,  value: formatPrice(cheapest.pricing.current) },
    { icon: <IconStar size={12} />, label: 'Best Rated',     product: bestRated, value: bestRated.ratings ? `${bestRated.ratings.average.toFixed(1)}★` : '—' },
    { icon: <IconTruck size={12} />, label: 'Fastest',       product: fastest,   value: fastest.delivery?.estimate_label ?? `${fastest.delivery?.estimate_days ?? '?'}d` },
  ];

  const cols = Math.min(products.length, 3);

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
        {products.map((p) => (
          <ProductCard key={p.product_id} product={p} onBuy={onBuy} onDetail={onDetail} />
        ))}
      </SimpleGrid>
    </Stack>
  );
}
