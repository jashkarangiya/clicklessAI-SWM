'use client';
/**
 * ClickLess AI – Feature Card Grid
 *
 * Row 1: 3 larger "core value" cards (user benefit)
 * Row 2: 3 smaller "platform capability" cards (depth)
 *
 * Cards are always visible — no IntersectionObserver opacity gate.
 * Entrance: CSS animation triggered by the section entering the viewport via
 * a single observer on the section wrapper.
 * Hover: lift 4px, border strengthen, bg tint richer, icon tile scale 1.04.
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
    title: 'Shop in plain English',
    description: 'Say "wireless headphones under $250, fast shipping" and get a ranked comparison in seconds. No filters, no tabs, no scrolling.',
    iconColor: 'var(--cl-brand)',
    iconBg: 'var(--cl-brand-soft)',
  },
  {
    icon: <IconScale size={24} />,
    title: 'Every retailer, one search',
    description: 'ClickLess checks Amazon, Walmart, and 40+ retailers simultaneously — price, rating, and delivery date — so you make one confident decision.',
    iconColor: 'var(--cl-brand)',
    iconBg: 'var(--cl-brand-soft)',
  },
  {
    icon: <IconShieldCheck size={24} />,
    title: 'Nothing ships without you',
    description: 'See the exact product, seller, price, and delivery date before ClickLess touches your cart. One tap approves — or you walk away.',
    iconColor: 'var(--cl-brand)',
    iconBg: 'var(--cl-brand-soft)',
  },
];

const PLATFORM_FEATURES = [
  {
    icon: <IconActivity size={20} />,
    title: 'Searches that get smarter',
    description: 'ClickLess remembers your brands, price ceilings, and delivery preferences. The more you use it, the less you have to type.',
    iconColor: 'var(--cl-brand)',
    iconBg: 'var(--cl-brand-soft)',
  },
  {
    icon: <IconBrain size={20} />,
    title: 'Saved and resumable',
    description: 'Your searches and comparison results auto-save. Pick up on any device without losing context or starting over.',
    iconColor: 'var(--cl-brand)',
    iconBg: 'var(--cl-brand-soft)',
  },
  {
    icon: <IconApi size={20} />,
    title: 'Ready for teams',
    description: 'Share searches, set budget rules, and let ClickLess handle sourcing across a team — with every purchase still needing individual sign-off.',
    iconColor: 'var(--cl-brand)',
    iconBg: 'var(--cl-brand-soft)',
  },
];

function FeatureCard({
  icon, title, description, iconColor, iconBg, large, delay,
}: {
  icon: React.ReactNode; title: string; description: string;
  iconColor: string; iconBg: string; large?: boolean; delay: number;
}) {
  return (
    <Box
      className="feat-card cl-card-lift"
      style={{
        backgroundColor: 'var(--cl-surface)',
        borderRadius: large ? 24 : 20,
        padding: large ? '32px 28px' : '24px 22px',
        border: '1px solid var(--cl-border)',
        position: 'relative',
        overflow: 'hidden',
        // CSS variable drives stagger delay; reset to 0 after in-view fires
        ['--feat-delay' as string]: `${delay}ms`,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'var(--cl-border-strong)';
        el.style.backgroundColor = 'var(--cl-surface-alt)';
        const t = el.querySelector('.card-title') as HTMLElement;
        if (t) t.style.color = 'var(--cl-brand)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'var(--cl-border)';
        el.style.backgroundColor = 'var(--cl-surface)';
        const t = el.querySelector('.card-title') as HTMLElement;
        if (t) t.style.color = 'var(--cl-text-primary)';
      }}
    >
      <Stack gap="md">
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

export function FeatureCardGrid() {
  const sectionRef = useRef<HTMLElement>(null);

  /* Single observer on the section — adds .in-view to trigger CSS animations */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add('in-view');
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: '0px 0px -80px 0px' }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      component="section"
      id="product"
      ref={sectionRef}
      className="feat-section"
      style={{
        backgroundColor: 'var(--cl-bg)',
        padding: '96px 2rem',
      }}
    >
      <Box style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Section header */}
        <Stack gap="md" align="center" style={{ marginBottom: 60 }}>
          <Text
            style={{
              fontSize: '0.72rem', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--cl-brand)',
            }}
          >
            Features
          </Text>
          <Text
            component="h2"
            ta="center"
            className="display-serif"
            style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.9rem)',
              color: 'var(--cl-text-primary)',
              margin: 0,
              lineHeight: 1.12,
            }}
          >
            Built for speed, trust, and control.
          </Text>
          <Text
            ta="center"
            size="lg"
            style={{ color: 'var(--cl-text-secondary)', maxWidth: 500, lineHeight: 1.65 }}
          >
            Everything you need to shop smarter — without the browsing.
          </Text>
        </Stack>

        {/* Row 1: Core value (larger cards) */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" style={{ marginBottom: 20 }}>
          {CORE_FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} large delay={i * 60} />
          ))}
        </SimpleGrid>

        {/* Row 2: Platform depth (smaller cards) */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          {PLATFORM_FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={120 + i * 60} />
          ))}
        </SimpleGrid>
      </Box>

      <style>{`
        /* Cards hidden until section scrolls into view */
        .feat-section .feat-card {
          opacity: 0;
          transform: translateY(16px);
          transition:
            opacity   0.42s cubic-bezier(0.16,1,0.3,1) var(--feat-delay, 0ms),
            transform 0.42s cubic-bezier(0.16,1,0.3,1) var(--feat-delay, 0ms),
            border-color 160ms ease,
            background-color 160ms ease;
        }
        /* Once section is in view, reveal cards with stagger; reset delay for hover */
        .feat-section.in-view .feat-card {
          opacity: 1;
          transform: translateY(0);
        }
        .feat-section.in-view .feat-card:hover {
          transition:
            opacity   0ms,
            transform 0ms,
            border-color 160ms ease,
            background-color 160ms ease;
        }
      `}</style>
    </Box>
  );
}
