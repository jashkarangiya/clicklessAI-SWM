'use client';
/**
 * ClickLess AI – ProductCard
 *
 * Rich product card showing: image, title, brand, source badge,
 * pricing with discount, ratings, delivery, attributes, scoring/match reasons.
 * Has "Buy this" and "Tell me more" CTAs.
 * Highlighted treatment for recommended products.
 */
import { Box, Text, Badge, Button, Group, Stack, Rating, Image, HoverCard } from '@mantine/core';
import { IconTruck, IconStar, IconShoppingCart, IconInfoCircle, IconBolt } from '@tabler/icons-react';
import type { NormalizedProduct } from '@/contracts/product';
import { formatPrice, formatDiscount, formatReviewCount, formatDelivery } from '@/lib/utils/formatters';

interface ProductCardProps {
  product: NormalizedProduct;
  onBuy: (product: NormalizedProduct) => void;
  onDetail: (product: NormalizedProduct) => void;
}

const SOURCE_COLORS: Record<string, { bg: string; color: string }> = {
  amazon:  { bg: 'rgba(255,153,0,0.15)', color: '#FF9900' },
  walmart: { bg: 'rgba(0,76,145,0.2)',   color: '#0071CE' },
  other:   { bg: 'var(--cl-surface-alt)', color: 'var(--cl-text-muted)' },
};

export function ProductCard({ product, onBuy, onDetail }: ProductCardProps) {
  const isRecommended = product.scoring?.recommended;
  const sourceStyle = SOURCE_COLORS[product.source] ?? SOURCE_COLORS['other']!;
  const hasDiscount = product.pricing.original && product.pricing.original > product.pricing.current;

  return (
    <Box
      style={{
        backgroundColor: 'var(--cl-surface)',
        border: isRecommended
          ? '2px solid var(--cl-brand)'
          : '1px solid var(--cl-border)',
        borderRadius: 20,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        boxShadow: isRecommended
          ? '0 4px 16px rgba(47, 99, 245, 0.1)'
          : '0 1px 3px rgba(0,0,0,0.04)',
        position: 'relative',
      }}
      data-testid={`product-card-${product.product_id}`}
    >
      {/* Recommended ribbon */}
      {isRecommended && (
        <Box
          style={{
            position: 'absolute', top: 12, left: -1, zIndex: 2,
            backgroundColor: 'var(--cl-brand)',
            padding: '3px 12px 3px 8px',
            borderRadius: '0 20px 20px 0',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <IconBolt size={12} color="#fff" />
          <Text size="xs" fw={700} style={{ color: '#fff' }}>Top Pick</Text>
        </Box>
      )}

      {/* Product image */}
      {product.images?.[0] && (
        <Box style={{ height: 160, backgroundColor: 'var(--cl-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <Image
            src={product.images[0]}
            alt={product.name}
            fit="contain"
            h={140}
            style={{ objectFit: 'contain', maxWidth: '100%' }}
          />
        </Box>
      )}

      <Box style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Source badge + brand */}
        <Group justify="space-between" align="center">
          <Badge
            size="xs"
            style={{ ...sourceStyle, border: 'none', fontWeight: 700, textTransform: 'capitalize' }}
          >
            {product.source}
          </Badge>
          {product.brand && (
            <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>{product.brand}</Text>
          )}
        </Group>

        {/* Product name */}
        <Text
          fw={600}
          size="sm"
          lineClamp={2}
          style={{ color: 'var(--cl-text-primary)', lineHeight: 1.4 }}
        >
          {product.name}
        </Text>

        {/* Pricing */}
        <Group gap="xs" align="baseline">
          <Text fw={700} size="lg" style={{ color: isRecommended ? 'var(--cl-brand)' : 'var(--cl-text-primary)' }}>
            {formatPrice(product.pricing.current)}
          </Text>
          {hasDiscount && (
            <>
              <Text
                size="sm"
                style={{ color: 'var(--cl-text-muted)', textDecoration: 'line-through' }}
              >
                {formatPrice(product.pricing.original!)}
              </Text>
              <Badge size="xs" variant="success" style={{ backgroundColor: 'var(--cl-success-soft)', color: 'var(--cl-success)', border: 'none' }}>
                {formatDiscount(product.pricing.discount_pct ?? 0)}
              </Badge>
            </>
          )}
        </Group>

        {/* Rating */}
        {product.ratings && (
          <Group gap="xs" align="center">
            <Rating value={product.ratings.average} fractions={2} readOnly size="xs" color="yellow" />
            <Text size="xs" style={{ color: 'var(--cl-text-secondary)' }}>
              {product.ratings.average.toFixed(1)}
            </Text>
            <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>
              {formatReviewCount(product.ratings.count)}
            </Text>
          </Group>
        )}

        {/* Delivery */}
        {product.delivery && (
          <Group gap="xs" align="center">
            <IconTruck size={13} style={{ color: 'var(--cl-success)', flexShrink: 0 }} />
            <Text size="xs" style={{ color: 'var(--cl-success)', fontWeight: 500 }}>
              {formatDelivery(product.delivery.estimate_days, product.delivery.estimate_label)}
              {product.delivery.free && ' · Free'}
              {product.delivery.prime && ' · Prime'}
            </Text>
          </Group>
        )}

        {/* Attributes */}
        {product.attributes && Object.keys(product.attributes).length > 0 && (
          <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {Object.entries(product.attributes).slice(0, 3).map(([k, v]) => (
              <Badge key={k} size="xs" variant="default"
                style={{ backgroundColor: 'var(--cl-surface-alt)', color: 'var(--cl-text-secondary)', border: '1px solid var(--cl-border)', fontWeight: 400, textTransform: 'none' }}>
                {k}: {v}
              </Badge>
            ))}
          </Box>
        )}

        {/* Match reasons */}
        {isRecommended && product.scoring?.match_reasons && (
          <Stack gap={2}>
            {product.scoring.match_reasons.slice(0, 2).map((r) => (
              <Group gap={4} key={r} align="center">
                <IconStar size={10} style={{ color: 'var(--cl-brand)', flexShrink: 0 }} />
                <Text size="xs" style={{ color: 'var(--cl-text-secondary)' }}>{r}</Text>
              </Group>
            ))}
          </Stack>
        )}

        {/* CTAs */}
        <Group gap="xs" style={{ marginTop: 'auto', paddingTop: 4 }}>
          <Button
            flex={1}
            size="xs"
            leftSection={<IconShoppingCart size={13} />}
            onClick={() => onBuy(product)}
            data-testid={`buy-btn-${product.product_id}`}
            style={{
              backgroundColor: isRecommended ? 'var(--cl-brand)' : 'var(--cl-surface)',
              border: isRecommended ? 'none' : '1px solid var(--cl-border)',
              color: isRecommended ? '#fff' : 'var(--cl-text-primary)',
              fontWeight: 600,
              borderRadius: 9999,
            }}
          >
            Buy this
          </Button>
          <Button
            size="xs"
            variant="subtle"
            leftSection={<IconInfoCircle size={13} />}
            onClick={() => onDetail(product)}
            data-testid={`detail-btn-${product.product_id}`}
            style={{ color: 'var(--cl-text-secondary)', border: '1px solid var(--cl-border)' }}
          >
            More
          </Button>
        </Group>
      </Box>
    </Box>
  );
}
