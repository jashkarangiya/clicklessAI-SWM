'use client';
/**
 * ClickLess AI – Interactive Demo Section
 *
 * Signature product moment: tabbed Ask / Compare / Approve demo.
 * Clicking each tab transitions the central mockup to show that stage of the flow.
 * Pure CSS transitions — no external animation library needed.
 */
import { useState, useRef, useEffect } from 'react';
import { Box, Text, Stack, Group } from '@mantine/core';
import {
  IconMessageCircle, IconScale, IconShieldCheck,
  IconTruck, IconArrowRight,
} from '@tabler/icons-react';

/* ── Tab definitions ───────────────────────────────────────────────────── */
type TabId = 'ask' | 'compare' | 'approve';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'ask',     label: 'Ask',     icon: <IconMessageCircle size={16} /> },
  { id: 'compare', label: 'Compare', icon: <IconScale         size={16} /> },
  { id: 'approve', label: 'Approve', icon: <IconShieldCheck   size={16} /> },
];

/* ── Tab panel content ─────────────────────────────────────────────────── */
function AskPanel() {
  return (
    <Stack gap="md">
      <Text size="sm" fw={600} style={{ color: 'var(--cl-text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.68rem' }}>
        Natural-language request
      </Text>

      {/* Query pill */}
      <Box
        style={{
          backgroundColor: 'var(--cl-surface-alt)',
          borderRadius: 14,
          padding: '14px 18px',
          border: '1px solid var(--cl-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--cl-brand)', flexShrink: 0 }} />
        <Text size="sm" style={{ color: 'var(--cl-text-primary)', fontWeight: 500 }}>
          Noise-canceling headphones under $300, fast delivery
        </Text>
        <Box style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', backgroundColor: 'var(--cl-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconArrowRight size={10} style={{ color: '#fff' }} />
        </Box>
      </Box>

      {/* Thinking state */}
      <Box
        style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}
      >
        <Box style={{
          width: 28, height: 28, borderRadius: 8,
          backgroundColor: 'var(--cl-brand-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Text fw={700} style={{ fontSize: '0.6rem', color: 'var(--cl-brand)' }}>AI</Text>
        </Box>
        <Box style={{
          backgroundColor: 'var(--cl-surface-raised)',
          borderRadius: 14, padding: '14px 18px', flex: 1,
        }}>
          <Text size="sm" style={{ color: 'var(--cl-text-secondary)', marginBottom: 8 }}>
            Searching Amazon and Walmart for noise-canceling headphones…
          </Text>
          <Box style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {['Amazon', 'Walmart'].map((r) => (
              <Box key={r} style={{
                padding: '3px 10px', borderRadius: 9999,
                backgroundColor: 'var(--cl-surface)',
                border: '1px solid var(--cl-border)',
                fontSize: '0.7rem', fontWeight: 500,
                color: 'var(--cl-text-secondary)',
              }}>
                {r}
              </Box>
            ))}
            <Box style={{ display: 'flex', gap: 3 }}>
              {[0, 1, 2].map((i) => (
                <Box key={i} style={{
                  width: 5, height: 5, borderRadius: '50%',
                  backgroundColor: 'var(--cl-brand)',
                  opacity: 0.4 + i * 0.3,
                  animation: `drift-float ${1.2 + i * 0.3}s ease-in-out infinite`,
                }} />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      <Text size="xs" style={{ color: 'var(--cl-text-muted)', textAlign: 'center' }}>
        Connected retailers are searched simultaneously in real time
      </Text>
    </Stack>
  );
}

const COMPARE_PRODUCTS = [
  { name: 'Sony WH-1000XM5', price: '$278', tag: 'Best Match', tagColor: 'var(--cl-brand)',       tagBg: 'var(--cl-brand-soft)',       delivery: 'Tomorrow', rating: '4.8' },
  { name: 'Bose QC Ultra',    price: '$299', tag: 'Premium',    tagColor: 'var(--cl-accent-iris)', tagBg: 'var(--cl-accent-iris-soft)', delivery: 'Wed',      rating: '4.7' },
  { name: 'AirPods Max',      price: '$289', tag: 'Fastest',    tagColor: 'var(--cl-success)',     tagBg: 'var(--cl-success-soft)',     delivery: 'Today',    rating: '4.6' },
];

function ComparePanel() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <Stack gap="md">
      <Text size="sm" fw={600} style={{ color: 'var(--cl-text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.68rem' }}>
        Cross-retailer results
      </Text>

      {/* Column headers */}
      <Box style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px 80px', gap: 8, padding: '0 12px' }}>
        {['Product', 'Price', 'Delivery', 'Score'].map((h) => (
          <Text key={h} size="xs" fw={600} style={{ color: 'var(--cl-text-muted)', fontSize: '0.68rem' }}>{h}</Text>
        ))}
      </Box>

      {COMPARE_PRODUCTS.map((p, i) => (
        <Box
          key={p.name}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          style={{
            display: 'grid', gridTemplateColumns: '1fr 60px 70px 80px',
            gap: 8, alignItems: 'center',
            padding: '11px 12px', borderRadius: 12,
            backgroundColor: hovered === i ? 'var(--cl-surface-raised)' : 'var(--cl-surface)',
            border: `1px solid ${hovered === i ? 'var(--cl-border-strong)' : 'var(--cl-border)'}`,
            transition: 'background-color 160ms ease, border-color 160ms ease',
            cursor: 'default',
          }}
        >
          <Box>
            <Text size="xs" fw={600} style={{ color: 'var(--cl-text-primary)' }}>{p.name}</Text>
            <Box style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
              <Box style={{ padding: '1px 7px', borderRadius: 9999, backgroundColor: p.tagBg, fontSize: '0.6rem', fontWeight: 600, color: p.tagColor }}>
                {p.tag}
              </Box>
            </Box>
          </Box>
          <Text size="xs" fw={700} style={{ color: hovered === i ? 'var(--cl-brand)' : 'var(--cl-text-primary)', transition: 'color 160ms ease' }}>
            {p.price}
          </Text>
          <Box style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconTruck size={10} style={{ color: 'var(--cl-success)' }} />
            <Text style={{ fontSize: '0.7rem', color: 'var(--cl-success)' }}>{p.delivery}</Text>
          </Box>
          <Box style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: '0.7rem', color: 'var(--cl-text-secondary)', fontWeight: 600 }}>★ {p.rating}</Text>
          </Box>
        </Box>
      ))}

      <Text size="xs" style={{ color: 'var(--cl-text-muted)', textAlign: 'center' }}>
        Scored by price, ratings, and delivery speed
      </Text>
    </Stack>
  );
}

function ApprovePanel() {
  return (
    <Stack gap="md">
      <Text size="sm" fw={600} style={{ color: 'var(--cl-text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.68rem' }}>
        Order review
      </Text>

      {/* Order card */}
      <Box style={{
        backgroundColor: 'var(--cl-surface)',
        borderRadius: 16, border: '2px solid var(--cl-brand)',
        padding: '20px 20px',
        boxShadow: '0 4px 20px rgba(12,122,138,0.08)',
      }}>
        <Stack gap="sm">
          {/* Item */}
          <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Stack gap={2}>
              <Text fw={700} size="sm" style={{ color: 'var(--cl-text-primary)' }}>Sony WH-1000XM5</Text>
              <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>Noise-canceling headphones · Black</Text>
              <Box style={{ padding: '2px 8px', borderRadius: 9999, backgroundColor: 'var(--cl-brand-soft)', display: 'inline-block', width: 'fit-content' }}>
                <Text style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--cl-brand)' }}>Best Match</Text>
              </Box>
            </Stack>
            <Text fw={800} size="lg" style={{ color: 'var(--cl-brand)' }}>$278</Text>
          </Box>

          {/* Divider */}
          <Box style={{ height: 1, backgroundColor: 'var(--cl-border)' }} />

          {/* Delivery */}
          <Box style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconTruck size={14} style={{ color: 'var(--cl-success)' }} />
              <Text size="xs" style={{ color: 'var(--cl-text-secondary)' }}>Delivery</Text>
            </Box>
            <Text size="xs" fw={600} style={{ color: 'var(--cl-success)' }}>Tomorrow · Free shipping</Text>
          </Box>
          <Box style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text size="xs" style={{ color: 'var(--cl-text-secondary)' }}>Retailer</Text>
            <Text size="xs" fw={500} style={{ color: 'var(--cl-text-primary)' }}>Amazon</Text>
          </Box>

          {/* Divider */}
          <Box style={{ height: 1, backgroundColor: 'var(--cl-border)' }} />

          {/* Total */}
          <Box style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text fw={700} size="sm" style={{ color: 'var(--cl-text-primary)' }}>Total</Text>
            <Text fw={800} size="sm" style={{ color: 'var(--cl-text-primary)' }}>$278.00</Text>
          </Box>
        </Stack>
      </Box>

      {/* Approve button */}
      <Box
        style={{
          padding: '13px',
          borderRadius: 14,
          backgroundColor: 'var(--cl-brand)',
          color: '#fff',
          fontSize: '0.88rem',
          fontWeight: 700,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'transform var(--motion-fast) var(--ease-emphasis), box-shadow var(--motion-fast) var(--ease-emphasis)',
          letterSpacing: '0.01em',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(31,200,220,0.24)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = '';
          (e.currentTarget as HTMLElement).style.boxShadow = '';
        }}
      >
        Approve Purchase →
      </Box>

      <Text size="xs" style={{ color: 'var(--cl-text-muted)', textAlign: 'center' }}>
        Nothing ships until you confirm
      </Text>
    </Stack>
  );
}

/* ── Panel map ─────────────────────────────────────────────────────────── */
const PANELS: Record<TabId, React.ReactNode> = {
  ask:     <AskPanel />,
  compare: <ComparePanel />,
  approve: <ApprovePanel />,
};

const TAB_SUBTITLES: Record<TabId, string> = {
  ask:     'Describe what you need in plain language — no forms, no filters.',
  compare: 'ClickLess ranks results by price, delivery, and ratings.',
  approve: 'Review the full order summary before anything moves.',
};

/* ── Main section ──────────────────────────────────────────────────────── */
export function InteractiveDemoSection() {
  const [active, setActive] = useState<TabId>('ask');
  const [animating, setAnimating] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef  = useRef<HTMLDivElement>(null);

  // Scroll-reveal for the section header
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function switchTab(id: TabId) {
    if (id === active) return;
    setAnimating(true);
    setTimeout(() => {
      setActive(id);
      setAnimating(false);
    }, 160);
  }

  return (
    <Box
      component="section"
      ref={sectionRef}
      style={{
        padding: '88px 2rem',
        backgroundColor: 'var(--cl-bg)',
      }}
    >
      <Box style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div
          ref={headerRef}
          style={{
            opacity: 0,
            transform: 'translateY(14px)',
            transition: 'opacity 0.42s var(--ease-emphasis), transform 0.42s var(--ease-emphasis)',
            textAlign: 'center',
            marginBottom: 48,
          }}
        >
          <Text
            component="h2"
            style={{
              fontSize: '2.25rem', fontWeight: 700,
              color: 'var(--cl-text-primary)',
              letterSpacing: '-0.02em', margin: '0 0 12px',
            }}
          >
            From request to checkout
          </Text>
          <Text size="lg" style={{ color: 'var(--cl-text-secondary)', maxWidth: 480, margin: '0 auto' }}>
            {TAB_SUBTITLES[active]}
          </Text>
        </div>

        {/* Segmented tab bar */}
        <Group justify="center" style={{ marginBottom: 40 }}>
          <Box
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--cl-surface-raised)',
              border: '1px solid var(--cl-border)',
              borderRadius: 9999,
              padding: 4,
              gap: 2,
            }}
          >
            {TABS.map((tab) => {
              const isActive = tab.id === active;
              return (
                <Box
                  key={tab.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => switchTab(tab.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') switchTab(tab.id); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '9px 22px',
                    borderRadius: 9999,
                    cursor: 'pointer',
                    userSelect: 'none',
                    backgroundColor: isActive ? 'var(--cl-surface)' : 'transparent',
                    color: isActive ? 'var(--cl-brand)' : 'var(--cl-text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.9rem',
                    boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    transition: `
                      background-color var(--motion-base) var(--ease-emphasis),
                      color var(--motion-base) var(--ease-emphasis),
                      box-shadow var(--motion-base) var(--ease-emphasis)
                    `,
                  }}
                >
                  <span style={{ opacity: isActive ? 1 : 0.6, transition: 'opacity var(--motion-base) ease' }}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </Box>
              );
            })}
          </Box>
        </Group>

        {/* Demo panel */}
        <Box
          style={{
            backgroundColor: 'var(--cl-surface)',
            borderRadius: 24,
            border: '1px solid var(--cl-border)',
            padding: '32px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
            minHeight: 320,
            opacity: animating ? 0 : 1,
            transform: animating ? 'translateY(6px)' : 'translateY(0)',
            transition: 'opacity 160ms ease, transform 160ms ease',
          }}
        >
          {PANELS[active]}
        </Box>

        {/* Step indicator dots */}
        <Group justify="center" gap="sm" style={{ marginTop: 24 }}>
          {TABS.map((tab) => (
            <Box
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              style={{
                width: active === tab.id ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: active === tab.id ? 'var(--cl-brand)' : 'var(--cl-border-strong)',
                cursor: 'pointer',
                transition: 'width var(--motion-base) var(--ease-emphasis), background-color var(--motion-base) ease',
              }}
            />
          ))}
        </Group>
      </Box>
    </Box>
  );
}
