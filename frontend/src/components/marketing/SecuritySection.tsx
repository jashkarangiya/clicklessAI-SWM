'use client';
/**
 * ClickLess AI – Security Section (Pearl + Juniper)
 *
 * Dark contrast band. Split layout: Left large trust statement, Right 4 security cards.
 * Motion: restrained — cards stagger on scroll entry.
 * Hover: icon tile brightens, surface contrast increases, tiny status pulse appears.
 * Security motion is more grounded than marketing motion — no lifts.
 */
import { useEffect, useRef } from 'react';
import { Box, Text, Stack, SimpleGrid } from '@mantine/core';
import { IconLock, IconEyeOff, IconClock, IconShieldCheck } from '@tabler/icons-react';

const SECURITY_ITEMS = [
  {
    icon: <IconEyeOff size={18} />,
    title: 'Secure session tokens',
    description: 'We never see, save, or transmit your retailer passwords.',
  },
  {
    icon: <IconShieldCheck size={18} />,
    title: 'Human-in-the-loop',
    description: 'Every purchase requires your explicit confirmation.',
  },
  {
    icon: <IconClock size={18} />,
    title: 'Auto-expiring sessions',
    description: 'Retailer sessions expire automatically. Disconnect any time.',
  },
  {
    icon: <IconLock size={18} />,
    title: 'Encrypted transport',
    description: 'All data flows over HTTPS/WSS with TLS encryption.',
  },
];

function SecurityCard({ item, delay }: { item: typeof SECURITY_ITEMS[0]; delay: number }) {
  return (
    <Box
      className="sec-card"
      style={{
        backgroundColor: 'var(--cl-inverse-surface)',
        borderRadius: 16,
        padding: '20px 18px',
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        opacity: 0,
        transform: 'translateY(10px)',
        transition: `opacity var(--motion-base) var(--ease-emphasis) ${delay}ms,
                     transform var(--motion-base) var(--ease-emphasis) ${delay}ms,
                     background-color var(--motion-fast) var(--ease-standard),
                     border-color var(--motion-fast) var(--ease-standard)`,
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = 'rgba(31,200,220,0.06)';
        el.style.borderColor = 'rgba(31,200,220,0.16)';
        const tile = el.querySelector('.sec-icon') as HTMLElement;
        if (tile) tile.style.backgroundColor = 'rgba(31,200,220,0.16)';
        const pulse = el.querySelector('.sec-pulse') as HTMLElement;
        if (pulse) pulse.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.backgroundColor = 'var(--cl-inverse-surface)';
        el.style.borderColor = 'rgba(255,255,255,0.06)';
        const tile = el.querySelector('.sec-icon') as HTMLElement;
        if (tile) tile.style.backgroundColor = 'rgba(31,200,220,0.1)';
        const pulse = el.querySelector('.sec-pulse') as HTMLElement;
        if (pulse) pulse.style.opacity = '0';
      }}
    >
      <Box
        className="sec-icon"
        style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: 'rgba(31,200,220,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          color: 'var(--cl-brand)',
          transition: 'background-color var(--motion-fast) var(--ease-standard)',
          position: 'relative',
        }}
      >
        {item.icon}
        {/* Tiny status pulse — revealed on hover */}
        <Box
          className="sec-pulse"
          style={{
            position: 'absolute',
            top: -2, right: -2,
            width: 7, height: 7,
            borderRadius: '50%',
            backgroundColor: 'var(--cl-brand)',
            opacity: 0,
            transition: 'opacity var(--motion-fast) ease',
          }}
        />
      </Box>
      <Stack gap={2}>
        <Text fw={600} size="sm" style={{ color: 'var(--cl-inverse-text)' }}>
          {item.title}
        </Text>
        <Text size="xs" style={{ color: 'var(--cl-inverse-muted)', lineHeight: 1.6 }}>
          {item.description}
        </Text>
      </Stack>
    </Box>
  );
}

export function SecuritySection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const cards = Array.from(section.querySelectorAll('.sec-card')) as HTMLElement[];

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          cards.forEach((card) => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      component="section"
      id="security"
      ref={sectionRef}
      style={{
        backgroundColor: 'var(--cl-inverse-bg)',
        padding: '88px 2rem',
      }}
    >
      <Box
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '5fr 7fr',
          gap: '4rem',
          alignItems: 'center',
        }}
        className="security-grid"
      >
        {/* Left: large trust statement */}
        <Stack gap="lg">
          <Text
            component="h2"
            style={{
              fontSize: '2.75rem', fontWeight: 700,
              color: 'var(--cl-inverse-text)',
              letterSpacing: '-0.02em', margin: 0,
              lineHeight: 1.12,
            }}
          >
            Control is{' '}
            <span className="serif-accent" style={{ color: 'var(--cl-brand)' }}>
              built in.
            </span>
          </Text>
          <Text
            size="lg"
            style={{
              color: 'var(--cl-inverse-muted)',
              lineHeight: 1.7,
              maxWidth: 380,
            }}
          >
            ClickLess never places an order without your approval.
            Your credentials stay private. Your sessions stay controlled.
          </Text>
        </Stack>

        {/* Right: 4 security cards (stagger on scroll) */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {SECURITY_ITEMS.map((item, i) => (
            <SecurityCard key={item.title} item={item} delay={i * 60} />
          ))}
        </SimpleGrid>
      </Box>

      <style>{`
        @media (max-width: 768px) {
          .security-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </Box>
  );
}
