'use client';
/**
 * ClickLess AI – How It Works Section (Pearl + Juniper)
 *
 * Horizontal 3-step timeline with animated connector rail.
 * Motion: rail grows L→R on scroll entry; cards stagger up; step circles fill on hover.
 */
import { useEffect, useRef } from 'react';
import { Box, Text, Stack } from '@mantine/core';
import { IconMessageCircle, IconScale, IconShieldCheck } from '@tabler/icons-react';

const STEPS = [
  {
    number: '01',
    icon: <IconMessageCircle size={22} />,
    title: 'Describe what you need',
    description: 'Tell ClickLess in plain language. Budget, brand, delivery speed — just describe it.',
  },
  {
    number: '02',
    icon: <IconScale size={22} />,
    title: 'Review the best options',
    description: 'ClickLess searches Amazon and Walmart simultaneously, scoring on price, ratings, and shipping.',
  },
  {
    number: '03',
    icon: <IconShieldCheck size={22} />,
    title: 'Approve before checkout',
    description: 'Review the full order summary. Nothing ships without your explicit confirmation.',
  },
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const cards  = Array.from(section.querySelectorAll('.hiw-card'))  as HTMLElement[];
    const rail   = section.querySelector('.hiw-rail-inner') as HTMLElement | null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Grow connector rail
          if (rail) rail.style.transform = 'scaleX(1)';
          // Stagger-reveal cards
          cards.forEach((card, i) => {
            setTimeout(() => card.classList.add('cl-revealed'), i * 80);
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
      id="how-it-works"
      ref={sectionRef}
      style={{ maxWidth: 1200, margin: '0 auto', padding: '88px 2rem' }}
    >
      {/* Section header */}
      <Stack gap="md" align="center" style={{ marginBottom: 52 }}>
        <Text
          style={{
            fontSize: '0.72rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--cl-brand)',
          }}
        >
          How it works
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
          Three steps from search to delivery.
        </Text>
        <Text ta="center" size="lg" style={{ color: 'var(--cl-text-secondary)', maxWidth: 420, lineHeight: 1.65 }}>
          You stay in control at every stage.
        </Text>
      </Stack>

      {/* Timeline grid */}
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 0,
          position: 'relative',
        }}
        className="hiw-grid"
      >
        {/* Connector rail (animated) */}
        <Box
          className="hiw-rail"
          style={{
            position: 'absolute',
            top: 32,
            left: 'calc(16.66% + 28px)',
            right: 'calc(16.66% + 28px)',
            height: 2,
            backgroundColor: 'var(--cl-border)',
            zIndex: 0,
            overflow: 'hidden',
          }}
        >
          {/* Inner fill that animates scaleX */}
          <Box
            className="hiw-rail-inner"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'var(--cl-brand)',
              transform: 'scaleX(0)',
              transformOrigin: 'left center',
              transition: 'transform 0.65s cubic-bezier(0.16,1,0.3,1) 0.1s',
              opacity: 0.6,
            }}
          />
        </Box>

        {STEPS.map((step, i) => (
          <Box
            key={step.number}
            style={{ position: 'relative', zIndex: 1, padding: '0 16px' }}
          >
            <Stack gap="lg" align="center">
              {/* Step circle — fills softly on hover */}
              <Box
                style={{
                  width: 64, height: 64, borderRadius: '50%',
                  backgroundColor: 'var(--cl-surface)',
                  border: '2px solid var(--cl-brand)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  transition: `background-color var(--motion-base) var(--ease-standard),
                               box-shadow var(--motion-base) var(--ease-standard)`,
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.backgroundColor = 'var(--cl-brand-soft)';
                  el.style.boxShadow = '0 4px 20px rgba(12,122,138,0.16)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.backgroundColor = 'var(--cl-surface)';
                  el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                }}
              >
                <Text
                  fw={800}
                  style={{
                    fontSize: '1.1rem',
                    color: 'var(--cl-brand)',
                    fontFamily: 'var(--mantine-font-family-monospace)',
                  }}
                >
                  {step.number}
                </Text>
              </Box>

              {/* Step card — lift + border on hover */}
              <Box
                className="cl-reveal hiw-card"
                style={{
                  backgroundColor: 'var(--cl-surface)',
                  borderRadius: 20,
                  padding: '24px 22px',
                  border: '1px solid var(--cl-border)',
                  textAlign: 'center',
                  width: '100%',
                  transition: `transform var(--motion-base) var(--ease-emphasis),
                               box-shadow var(--motion-base) var(--ease-emphasis),
                               border-color var(--motion-fast) var(--ease-standard)`,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'translateY(-3px)';
                  el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.07)';
                  el.style.borderColor = 'var(--cl-brand)';
                  // Icon scale
                  const icon = el.querySelector('.hiw-icon') as HTMLElement;
                  if (icon) icon.style.transform = 'scale(1.06) rotate(2deg)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = '';
                  el.style.boxShadow = '';
                  el.style.borderColor = 'var(--cl-border)';
                  const icon = el.querySelector('.hiw-icon') as HTMLElement;
                  if (icon) icon.style.transform = '';
                }}
              >
                <Box
                  className="hiw-icon"
                  style={{
                    width: 40, height: 40, borderRadius: 10,
                    backgroundColor: 'var(--cl-brand-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--cl-brand)',
                    margin: '0 auto 14px',
                    transition: 'transform var(--motion-base) var(--ease-emphasis)',
                  }}
                >
                  {step.icon}
                </Box>
                <Text fw={700} size="md" style={{ color: 'var(--cl-text-primary)', marginBottom: 8 }}>
                  {step.title}
                </Text>
                <Text size="sm" style={{ color: 'var(--cl-text-secondary)', lineHeight: 1.65 }}>
                  {step.description}
                </Text>
              </Box>
            </Stack>
          </Box>
        ))}
      </Box>

      <style>{`
        @media (max-width: 768px) {
          .hiw-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .hiw-rail { display: none !important; }
        }
      `}</style>
    </Box>
  );
}
