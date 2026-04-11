'use client';
/**
 * ClickLess AI – Hero Section (Pearl + Juniper)
 *
 * 5/7 split: left copy + CTAs (staggered entrance), right layered product mockup.
 * Mockup: query bar → AI card → comparison rows (hoverable) → approval summary
 * Ambient: approval card drifts 4px vertically; spotlight shifts slowly behind mockup.
 */
import { useEffect, useRef, useState } from 'react';
import { Box, Text, Button, Group, Stack } from '@mantine/core';
import { IconArrowRight, IconShieldCheck, IconBolt, IconPlugConnected, IconTruck } from '@tabler/icons-react';
import { ProofChip } from '@/components/common/ProofChip';

const PRODUCTS = [
  { name: 'Sony WH-1000XM5', price: '$278', tag: 'Best Match', tagColor: 'var(--cl-brand)',       tagBg: 'var(--cl-brand-soft)',       delivery: 'Tomorrow' },
  { name: 'Bose QC Ultra',    price: '$299', tag: 'Premium',    tagColor: 'var(--cl-accent-iris)', tagBg: 'var(--cl-accent-iris-soft)', delivery: 'Wed' },
  { name: 'AirPods Max',      price: '$289', tag: 'Fastest',    tagColor: 'var(--cl-success)',     tagBg: 'var(--cl-success-soft)',     delivery: 'Today' },
];

function ProductRow({ product, index }: { product: typeof PRODUCTS[0]; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      key={product.name}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 12px', borderRadius: 10,
        backgroundColor: hovered ? 'var(--cl-surface-raised)' : 'var(--cl-surface)',
        border: `1px solid ${hovered ? 'var(--cl-border-strong)' : 'var(--cl-border)'}`,
        cursor: 'default',
        transition: 'background-color 160ms ease, border-color 160ms ease',
        animation: `reveal-up-sm 0.38s cubic-bezier(0.16,1,0.3,1) ${120 + index * 80}ms both`,
      }}
    >
      <Box style={{ flex: 1 }}>
        <Text size="xs" fw={600} style={{
          color: hovered ? 'var(--cl-text-primary)' : 'var(--cl-text-primary)',
          transition: 'color 160ms ease',
        }}>
          {product.name}
        </Text>
        <Box style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
          <Text style={{
            fontSize: '0.72rem',
            color: hovered ? 'var(--cl-brand)' : 'var(--cl-text-muted)',
            fontWeight: hovered ? 600 : 400,
            transition: 'color 160ms ease, font-weight 160ms ease',
          }}>
            {product.price}
          </Text>
          <Box style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <IconTruck size={9} style={{ color: 'var(--cl-success)' }} />
            <Text style={{ fontSize: '0.68rem', color: 'var(--cl-success)' }}>{product.delivery}</Text>
          </Box>
        </Box>
      </Box>
      <Box style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Box
          style={{
            fontSize: '0.62rem', fontWeight: 600,
            padding: '2px 8px', borderRadius: 9999,
            backgroundColor: product.tagBg,
            color: product.tagColor,
            opacity: hovered ? 1 : 0.85,
            transition: 'opacity 160ms ease',
          }}
        >
          {product.tag}
        </Box>
        {/* Compare affordance appears on hover */}
        <Box style={{
          fontSize: '0.6rem', fontWeight: 500, color: 'var(--cl-text-muted)',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(-4px)',
          transition: 'opacity 140ms ease, transform 140ms ease',
          whiteSpace: 'nowrap',
        }}>
          →
        </Box>
      </Box>
    </Box>
  );
}

export function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small frame delay so CSS animations fire after paint
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <Box
      component="section"
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '80px 2rem 64px',
        display: 'grid',
        gridTemplateColumns: '5fr 7fr',
        gap: '3.5rem',
        alignItems: 'center',
      }}
      className="hero-grid"
    >
      {/* ── Left column: copy + CTAs (staggered entrance) ── */}
      <Stack gap="xl">
        <Stack gap="md">
          {/* Headline – reveal-up, first */}
          <Text
            component="h1"
            style={{
              fontSize: '3.5rem',
              fontWeight: 700,
              lineHeight: 1.06,
              color: 'var(--cl-text-primary)',
              letterSpacing: '-0.03em',
              margin: 0,
              animation: mounted ? 'reveal-up 0.42s cubic-bezier(0.16,1,0.3,1) 0ms both' : 'none',
              opacity: mounted ? undefined : 0,
            }}
          >
            Shopping should feel like{' '}
            <span className="serif-accent" style={{ color: 'var(--cl-brand)' }}>
              asking,
            </span>{' '}
            not browsing.
          </Text>

          {/* Body – stagger 100ms */}
          <Text
            size="lg"
            style={{
              color: 'var(--cl-text-secondary)',
              lineHeight: 1.7,
              maxWidth: 440,
              animation: mounted ? 'reveal-up 0.42s cubic-bezier(0.16,1,0.3,1) 100ms both' : 'none',
              opacity: mounted ? undefined : 0,
            }}
          >
            ClickLess finds, compares, and prepares checkout across your connected
            retailers. Every purchase still waits for your approval.
          </Text>
        </Stack>

        {/* CTAs – stagger 180ms */}
        <Group
          gap="md"
          style={{
            animation: mounted ? 'reveal-up 0.42s cubic-bezier(0.16,1,0.3,1) 180ms both' : 'none',
            opacity: mounted ? undefined : 0,
          }}
        >
          <Button
            component="a"
            href="/signup"
            variant="brand"
            size="lg"
            radius={9999}
            rightSection={<IconArrowRight size={18} style={{ transition: 'transform 140ms ease' }} />}
            className="cl-btn-lift"
            style={{ fontWeight: 600, height: 52, paddingInline: 28 }}
            onMouseEnter={(e) => {
              const icon = e.currentTarget.querySelector('svg');
              if (icon) (icon as unknown as HTMLElement).style.transform = 'translateX(2px)';
            }}
            onMouseLeave={(e) => {
              const icon = e.currentTarget.querySelector('svg');
              if (icon) (icon as unknown as HTMLElement).style.transform = 'translateX(0)';
            }}
          >
            Try ClickLess free
          </Button>
          <Button
            component="a"
            href="#how-it-works"
            variant="surface"
            size="lg"
            radius={9999}
            className="cl-btn-lift"
            style={{ height: 52, paddingInline: 28 }}
          >
            See how it works
          </Button>
        </Group>

        {/* Proof chips – staggered 50ms apart */}
        <Group
          gap="sm"
          wrap="wrap"
          style={{
            animation: mounted ? 'reveal-fade 0.5s ease 280ms both' : 'none',
            opacity: mounted ? undefined : 0,
          }}
        >
          <ProofChip variant="brand" icon={<IconShieldCheck size={13} />}>
            Approval required
          </ProofChip>
          <ProofChip variant="gold" icon={<IconBolt size={13} />}>
            Real-time comparison
          </ProofChip>
          <ProofChip variant="default" icon={<IconPlugConnected size={13} />}>
            Amazon · Walmart
          </ProofChip>
        </Group>
      </Stack>

      {/* ── Right column: layered product mockup ── */}
      <Box
        style={{
          position: 'relative',
          animation: mounted ? 'reveal-up 0.52s cubic-bezier(0.16,1,0.3,1) 80ms both' : 'none',
          opacity: mounted ? undefined : 0,
        }}
      >
        {/* Spotlight glow behind card */}
        <Box
          style={{
            position: 'absolute',
            inset: -40,
            borderRadius: 40,
            background: 'radial-gradient(ellipse 70% 50% at 60% 50%, color-mix(in srgb, var(--cl-brand) 8%, transparent) 0%, transparent 70%)',
            pointerEvents: 'none',
            animation: 'spotlight-shift 14s ease-in-out infinite',
            zIndex: 0,
          }}
        />

        {/* Main product card */}
        <Box
          style={{
            backgroundColor: 'var(--cl-surface)',
            borderRadius: 24,
            border: '1px solid var(--cl-border)',
            padding: '28px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.06)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Stack gap="md">
            {/* Search query pill */}
            <Box
              style={{
                backgroundColor: 'var(--cl-surface-alt)',
                borderRadius: 14,
                padding: '11px 16px',
                border: '1px solid var(--cl-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                animation: mounted ? 'reveal-up-sm 0.35s cubic-bezier(0.16,1,0.3,1) 200ms both' : 'none',
              }}
            >
              <Box style={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: 'var(--cl-brand)', flexShrink: 0,
              }} />
              <Text size="sm" style={{ color: 'var(--cl-text-primary)', flex: 1, fontWeight: 500 }}>
                Noise-canceling headphones under $300, fast delivery
              </Text>
            </Box>

            {/* AI response card */}
            <Box
              style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                animation: mounted ? 'reveal-up-sm 0.38s cubic-bezier(0.16,1,0.3,1) 280ms both' : 'none',
              }}
            >
              <Box
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  backgroundColor: 'var(--cl-brand-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 2,
                }}
              >
                <Text fw={700} style={{ fontSize: '0.6rem', color: 'var(--cl-brand)' }}>AI</Text>
              </Box>
              <Box
                style={{
                  backgroundColor: 'var(--cl-surface-raised)',
                  borderRadius: 14,
                  padding: '12px 16px',
                  flex: 1,
                }}
              >
                <Text size="sm" style={{ color: 'var(--cl-text-primary)', marginBottom: 10 }}>
                  Found 3 options across Amazon and Walmart:
                </Text>

                {/* Interactive comparison rows */}
                <Stack gap={5}>
                  {PRODUCTS.map((p, i) => (
                    <ProductRow key={p.name} product={p} index={i} />
                  ))}
                </Stack>
              </Box>
            </Box>
          </Stack>
        </Box>

        {/* Floating approval summary card — ambient drift */}
        <Box
          className="cl-drift"
          style={{
            position: 'absolute',
            bottom: -20,
            right: -16,
            backgroundColor: 'var(--cl-surface)',
            borderRadius: 16,
            padding: '14px 18px',
            border: '2px solid var(--cl-brand)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.1)',
            minWidth: 200,
            zIndex: 2,
            animation: 'drift-float 9s ease-in-out infinite, reveal-up-sm 0.42s cubic-bezier(0.16,1,0.3,1) 520ms both',
          }}
        >
          <Text size="xs" fw={700} style={{ color: 'var(--cl-brand)', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.62rem' }}>
            Order Summary
          </Text>
          <Text style={{ fontSize: '0.78rem', color: 'var(--cl-text-primary)', fontWeight: 600, marginBottom: 2 }}>
            Sony WH-1000XM5
          </Text>
          <Box style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: '0.72rem', color: 'var(--cl-brand)', fontWeight: 700 }}>$278</Text>
            <Text style={{ fontSize: '0.68rem', color: 'var(--cl-text-muted)' }}>· Tomorrow · Amazon</Text>
          </Box>
          <Box
            style={{
              padding: '6px 14px',
              borderRadius: 9999,
              backgroundColor: 'var(--cl-brand)',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 700,
              textAlign: 'center',
              letterSpacing: '0.01em',
            }}
          >
            Approve Purchase
          </Box>
        </Box>

        {/* Floating retailer chip (top-left) */}
        <Box
          style={{
            position: 'absolute',
            top: -12,
            left: -12,
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            backgroundColor: 'var(--cl-surface)',
            borderRadius: 9999,
            padding: '5px 12px',
            border: '1px solid var(--cl-border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            zIndex: 2,
            animation: mounted ? 'reveal-fade 0.4s ease 360ms both' : 'none',
          }}
        >
          <IconPlugConnected size={12} style={{ color: 'var(--cl-success)' }} />
          <Text style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--cl-text-primary)' }}>
            Amazon · Walmart
          </Text>
          <Box style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--cl-success)', flexShrink: 0 }} />
        </Box>

        {/* Floating proof label (top-right) */}
        <Box
          style={{
            position: 'absolute',
            top: 14,
            right: -20,
            backgroundColor: 'var(--cl-accent-gold-soft)',
            borderRadius: 9999,
            padding: '3px 10px',
            fontSize: '0.62rem',
            fontWeight: 600,
            color: 'var(--cl-accent-gold)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            zIndex: 2,
            animation: mounted ? 'reveal-fade 0.4s ease 440ms both' : 'none',
          }}
        >
          Approval required
        </Box>
      </Box>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            padding-top: 40px !important;
            gap: 2rem !important;
          }
          .hero-grid h1 { font-size: 2.25rem !important; }
        }
      `}</style>
    </Box>
  );
}
