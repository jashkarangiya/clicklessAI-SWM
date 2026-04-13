'use client';
/**
 * ClickLess AI – Hero Section (Pearl + Juniper)
 *
 * Centered editorial layout: announcement pill → serif headline → subtitle
 * → CTA row → proof chips → large floating product stage.
 * GSAP ScrollTrigger: parallax float on scroll.
 */
import { useEffect, useRef, useState } from 'react';
import { Box, Text, Button, Group, Stack } from '@mantine/core';
import { IconArrowRight, IconPlugConnected, IconTruck } from '@tabler/icons-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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

  const heroRef     = useRef<HTMLElement>(null);
  const stageRef    = useRef<HTMLDivElement>(null);
  const approvalRef = useRef<HTMLDivElement>(null);
  const chipRef     = useRef<HTMLDivElement>(null);
  const copyRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const triggerDefaults = {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          ease: 'none' as const,
        };

        gsap.to(stageRef.current, {
          y: -28,
          scale: 0.98,
          ease: 'none',
          scrollTrigger: { ...triggerDefaults, scrub: 1.5 },
        });

        gsap.to(approvalRef.current, {
          y: -40,
          x: 8,
          ease: 'none',
          scrollTrigger: { ...triggerDefaults, scrub: 2 },
        });

        gsap.to(chipRef.current, {
          y: -14,
          ease: 'none',
          scrollTrigger: { ...triggerDefaults, scrub: 1 },
        });

        gsap.to(copyRef.current, {
          y: -16,
          opacity: 0.8,
          ease: 'none',
          scrollTrigger: { ...triggerDefaults, scrub: 1 },
        });
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <Box
      component="section"
      ref={heroRef}
      style={{
        padding: '72px 2rem 80px',
        textAlign: 'center',
      }}
    >
      {/* ── Copy block (pill → h1 → subtitle → CTAs → chips) ── */}
      <div ref={copyRef}>
        <Stack gap="xl" align="center">

          {/* Announcement pill */}
          <Box
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 14px',
              borderRadius: 9999,
              backgroundColor: 'var(--cl-brand-soft)',
              border: '1px solid rgba(12,122,138,0.22)',
              animation: mounted ? 'reveal-fade 0.4s ease 0ms both' : 'none',
              opacity: mounted ? undefined : 0,
            }}
          >
            <Box style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: 'var(--cl-brand)',
              flexShrink: 0,
            }} />
            <Text style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--cl-brand)',
            }}>
              Now live — Amazon &amp; Walmart
            </Text>
          </Box>

          {/* H1 headline */}
          <Text
            component="h1"
            className="hero-editorial-title"
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontWeight: 400,
              fontSize: 'clamp(2.8rem, 5.5vw, 4.75rem)',
              lineHeight: 1.08,
              letterSpacing: '-0.025em',
              color: 'var(--cl-text-primary)',
              margin: 0,
              animation: mounted ? 'reveal-up 0.48s cubic-bezier(0.16,1,0.3,1) 60ms both' : 'none',
              opacity: mounted ? undefined : 0,
            }}
          >
            Shopping should feel like{' '}
            <em style={{ color: 'var(--cl-brand)', fontStyle: 'italic' }}>asking,</em>{' '}
            not browsing.
          </Text>

          {/* Subtitle */}
          <Text
            size="lg"
            style={{
              color: 'var(--cl-text-secondary)',
              lineHeight: 1.7,
              maxWidth: 520,
              textAlign: 'center',
              animation: mounted ? 'reveal-up 0.42s cubic-bezier(0.16,1,0.3,1) 140ms both' : 'none',
              opacity: mounted ? undefined : 0,
            }}
          >
            Describe what you want in plain English. ClickLess finds it across
            dozens of retailers, compares prices, and checks out — with your approval.
          </Text>

          {/* CTA row */}
          <Box
            style={{
              animation: mounted ? 'reveal-up 0.42s cubic-bezier(0.16,1,0.3,1) 200ms both' : 'none',
              opacity: mounted ? undefined : 0,
            }}
          >
            <Group gap="md" justify="center" style={{ marginBottom: 14 }}>
              <Button
                component="a"
                href="/signup"
                variant="brand"
                size="lg"
                radius={9999}
                rightSection={<IconArrowRight size={18} style={{ transition: 'transform 140ms ease' }} />}
                className="cl-btn-lift"
                style={{ fontWeight: 600, height: 52, paddingInline: 32 }}
                onMouseEnter={(e) => {
                  const icon = e.currentTarget.querySelector('svg');
                  if (icon) (icon as unknown as HTMLElement).style.transform = 'translateX(3px)';
                }}
                onMouseLeave={(e) => {
                  const icon = e.currentTarget.querySelector('svg');
                  if (icon) (icon as unknown as HTMLElement).style.transform = 'translateX(0)';
                }}
              >
                Try ClickLess free
              </Button>
              <Box
                component="a"
                href="#how-it-works"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  height: 52,
                  paddingInline: 20,
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: 'var(--cl-text-secondary)',
                  textDecoration: 'none',
                  borderRadius: 9999,
                  transition: 'color 140ms ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--cl-text-primary)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--cl-text-secondary)'; }}
              >
                See how it works →
              </Box>
            </Group>
            {/* Pre-empt the two main objections */}
            <Text
              ta="center"
              style={{
                fontSize: '0.8rem',
                color: 'var(--cl-text-muted)',
                letterSpacing: '0.01em',
              }}
            >
              No credit card required · Works with Amazon, Walmart &amp; 40+ stores
            </Text>
          </Box>

        </Stack>
      </div>

      {/* ── Product stage ── */}
      <div
        ref={stageRef}
        style={{
          position: 'relative',
          marginTop: 56,
          maxWidth: 760,
          marginLeft: 'auto',
          marginRight: 'auto',
          animation: mounted ? 'reveal-up 0.56s cubic-bezier(0.16,1,0.3,1) 100ms both' : 'none',
          opacity: mounted ? undefined : 0,
        }}
      >
        {/* Ambient spotlight glow */}
        <Box
          style={{
            position: 'absolute',
            inset: -40,
            borderRadius: 40,
            background: 'radial-gradient(ellipse 70% 50% at 50% 50%, color-mix(in srgb, var(--cl-brand) 8%, transparent) 0%, transparent 70%)',
            pointerEvents: 'none',
            animation: 'spotlight-shift 14s ease-in-out infinite',
            zIndex: 0,
          }}
        />

        {/* Main product card */}
        <Box
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            padding: '0',
            border: '1px solid var(--cl-border)',
            boxShadow: '0 40px 100px rgba(6,18,34,0.09), 0 4px 20px rgba(12,122,138,0.05)',
            position: 'relative',
            zIndex: 1,
            overflow: 'hidden',
          }}
        >
          {/* Chrome bar */}
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 18px',
              borderBottom: '1px solid var(--cl-border)',
              backgroundColor: 'var(--cl-surface-alt)',
            }}
          >
            {/* macOS traffic dots */}
            <Box style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <Box style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#FF5F57' }} />
              <Box style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
              <Box style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#28CA41' }} />
            </Box>
            {/* Fake address bar */}
            <Box
              style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderRadius: 7,
                border: '1px solid var(--cl-border)',
                padding: '4px 12px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--cl-text-muted)',
                  fontStyle: 'italic',
                  fontFamily: 'Inter, sans-serif',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                Noise-canceling headphones under $300, fast delivery
              </Text>
            </Box>
          </Box>

          {/* AI response block */}
          <Box style={{ padding: '24px 28px 28px' }}>
            <Box
              style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}
            >
              {/* AI avatar tile */}
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

              {/* Bubble with product rows */}
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
                <Stack gap={5}>
                  {PRODUCTS.map((p, i) => (
                    <ProductRow key={p.name} product={p} index={i} />
                  ))}
                </Stack>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Floating approval card */}
        <div ref={approvalRef} style={{ position: 'absolute', bottom: -20, right: -16, zIndex: 2 }}>
          <Box
            className="cl-drift"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: '14px 18px',
              border: '2px solid var(--cl-brand)',
              boxShadow: '0 12px 40px rgba(6,18,34,0.12), 0 2px 8px rgba(12,122,138,0.08)',
              minWidth: 200,
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
        </div>

        {/* Floating retailer chip */}
        <div ref={chipRef} style={{ position: 'absolute', top: -14, left: -12, zIndex: 2 }}>
          <Box
            style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: 9999,
              padding: '5px 12px',
              border: '1px solid var(--cl-border)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              animation: mounted ? 'reveal-fade 0.4s ease 360ms both' : 'none',
            }}
          >
            <IconPlugConnected size={12} style={{ color: 'var(--cl-success)' }} />
            <Text style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--cl-text-primary)' }}>
              Amazon · Walmart
            </Text>
            <Box style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--cl-success)', flexShrink: 0 }} />
          </Box>
        </div>
      </div>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 640px) {
          .hero-editorial-title { font-size: 2.4rem !important; }
        }
      `}</style>
    </Box>
  );
}
