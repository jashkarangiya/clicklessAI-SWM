'use client';
/**
 * ClickLess AI – Feature Card Grid (Pearl + Juniper)
 *
 * Row 1: 3 larger "core value" cards (user benefit)
 * Row 2: 3 smaller "platform capability" cards (depth)
 *
 * Motion: IntersectionObserver-triggered stagger reveal (cl-reveal / cl-revealed).
 * Hover: lift 4px, border strengthen, bg tint richer, icon tile scale 1.04, title brighten.
 */
import { useEffect, useRef } from 'react';
import { Box, Text, Stack, SimpleGrid } from '@mantine/core';
import {
  IconMessageLanguage, IconScale, IconShieldCheck,
  IconActivity, IconBrain, IconApi,
} from '@tabler/icons-react';

const CORE_FEATURES = [
  {
    icon: <IconMessageLanguage size={24} />,
    title: 'Natural-language shopping',
    description: 'Describe what you want in plain language. No menus, no filters, no browsing fatigue.',
    iconColor: 'var(--cl-brand)',
    iconBg: 'var(--cl-brand-soft)',
  },
  {
    icon: <IconScale size={24} />,
    title: 'Cross-retailer comparison',
    description: 'Search Amazon and Walmart simultaneously. Compare price, ratings, and delivery side by side.',
    iconColor: 'var(--cl-accent-iris)',
    iconBg: 'var(--cl-accent-iris-soft)',
  },
  {
    icon: <IconShieldCheck size={24} />,
    title: 'Approval-based checkout',
    description: 'Every purchase requires your explicit confirmation. Review the full order before anything ships.',
    iconColor: 'var(--cl-success)',
    iconBg: 'var(--cl-success-soft)',
  },
];

const PLATFORM_FEATURES = [
  {
    icon: <IconActivity size={20} />,
    title: 'Live connection state',
    description: 'Real-time retailer session status. Know when you\'re connected and what\'s active.',
    iconColor: 'var(--cl-accent-gold)',
    iconBg: 'var(--cl-accent-gold-soft)',
  },
  {
    icon: <IconBrain size={20} />,
    title: 'Preference memory',
    description: 'Learns your brands, budgets, and patterns. Every search gets smarter.',
    iconColor: 'var(--cl-accent-iris)',
    iconBg: 'var(--cl-accent-iris-soft)',
  },
  {
    icon: <IconApi size={20} />,
    title: 'API-ready architecture',
    description: 'Built on FastAPI + WebSocket for real-time bidirectional communication.',
    iconColor: 'var(--cl-brand)',
    iconBg: 'var(--cl-brand-soft)',
  },
];

function FeatureCard({ icon, title, description, iconColor, iconBg, large }: {
  icon: React.ReactNode; title: string; description: string;
  iconColor: string; iconBg: string; large?: boolean;
}) {
  return (
    <Box
      className="cl-reveal cl-card-lift"
      style={{
        backgroundColor: 'var(--cl-surface)',
        borderRadius: large ? 24 : 20,
        padding: large ? '32px 28px' : '24px 22px',
        border: '1px solid var(--cl-border)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'var(--cl-border-strong)';
        el.style.backgroundColor = 'var(--cl-surface-alt)';
        const title = el.querySelector('.card-title') as HTMLElement;
        if (title) title.style.color = 'var(--cl-brand)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'var(--cl-border)';
        el.style.backgroundColor = 'var(--cl-surface)';
        const title = el.querySelector('.card-title') as HTMLElement;
        if (title) title.style.color = 'var(--cl-text-primary)';
      }}
    >
      <Stack gap="md">
        {/* Icon tile — scales on card hover via CSS */}
        <Box
          className="cl-icon-tile"
          style={{
            width: large ? 48 : 40,
            height: large ? 48 : 40,
            borderRadius: 12,
            backgroundColor: iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: iconColor,
          }}
        >
          {icon}
        </Box>

        <Text
          fw={700}
          size={large ? 'lg' : 'md'}
          className="card-title"
          style={{
            color: 'var(--cl-text-primary)',
            transition: 'color var(--motion-fast) var(--ease-standard)',
          }}
        >
          {title}
        </Text>

        <Text size="sm" style={{ color: 'var(--cl-text-secondary)', lineHeight: 1.7 }}>
          {description}
        </Text>
      </Stack>
    </Box>
  );
}

/** Attach IntersectionObserver to a grid container and reveal children */
function useGridReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const cards = Array.from(container.querySelectorAll('.cl-reveal')) as HTMLElement[];

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          cards.forEach((card) => card.classList.add('cl-revealed'));
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  return ref;
}

export function FeatureCardGrid() {
  const row1Ref = useGridReveal();
  const row2Ref = useGridReveal();

  return (
    <Box
      component="section"
      id="product"
      style={{
        backgroundColor: 'var(--cl-bg-subtle)',
        padding: '88px 2rem',
      }}
    >
      <Box style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Section header */}
        <Stack gap="md" align="center" style={{ marginBottom: 56 }}>
          <Text
            component="h2"
            ta="center"
            style={{
              fontSize: '2.25rem', fontWeight: 700,
              color: 'var(--cl-text-primary)',
              letterSpacing: '-0.02em', margin: 0,
            }}
          >
            Everything you need to shop smarter
          </Text>
          <Text
            ta="center"
            size="lg"
            style={{ color: 'var(--cl-text-secondary)', maxWidth: 540 }}
          >
            Built for speed, trust, and control.
          </Text>
        </Stack>

        {/* Row 1: Core value (larger cards) */}
        <div ref={row1Ref}>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" style={{ marginBottom: 20 }}>
            {CORE_FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} large />
            ))}
          </SimpleGrid>
        </div>

        {/* Row 2: Platform depth (smaller cards) */}
        <div ref={row2Ref}>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            {PLATFORM_FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </SimpleGrid>
        </div>
      </Box>
    </Box>
  );
}
