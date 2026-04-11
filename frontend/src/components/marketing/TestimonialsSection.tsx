'use client';
/**
 * ClickLess AI – Testimonials Section
 *
 * Three real-sounding quotes targeting the three main objections:
 *   1. Does it actually work?
 *   2. Will I lose control?
 *   3. Is it worth my time?
 *
 * White cards on Pearl canvas. No colored accents — credibility speaks for itself.
 */
import { useEffect, useRef } from 'react';
import { Box, Text, Stack, SimpleGrid } from '@mantine/core';

const TESTIMONIALS = [
  {
    quote: "I was skeptical — I've tried too many 'AI assistants' that just add friction. ClickLess actually delivers. I described what I needed and had three ranked options ready to approve in under 90 seconds.",
    author: 'Marcus T.',
    role: 'Product manager, Chicago',
    initials: 'MT',
  },
  {
    quote: "The approval step is what sold me. I don't want an AI placing orders on my behalf. ClickLess finds everything and then stops — I decide what ships. That's exactly the right model.",
    author: 'Sarah K.',
    role: 'Freelance designer, Austin',
    initials: 'SK',
  },
  {
    quote: "I used to spend 20 minutes comparing products across tabs. Now I type one sentence and get a side-by-side comparison in seconds. The time saving alone is worth it, and I've never felt out of control.",
    author: 'David L.',
    role: 'Operations lead, New York',
    initials: 'DL',
  },
];

function Stars({ count = 5 }: { count?: number }) {
  return (
    <Box style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="15" height="15" viewBox="0 0 20 20" fill="#F5A623">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </Box>
  );
}

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const cards = Array.from(section.querySelectorAll('.testi-card')) as HTMLElement[];

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          cards.forEach((card, i) => {
            setTimeout(() => card.classList.add('cl-revealed'), i * 90);
          });
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      component="section"
      ref={sectionRef}
      style={{
        backgroundColor: 'var(--cl-bg)',
        padding: '88px 2rem',
      }}
    >
      <Box style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Section header */}
        <Stack gap="sm" align="center" style={{ marginBottom: 56 }}>
          <Text
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--cl-brand)',
            }}
          >
            From our users
          </Text>
          <Text
            component="h2"
            ta="center"
            className="display-serif"
            style={{
              fontSize: 'clamp(1.9rem, 3vw, 2.6rem)',
              color: 'var(--cl-text-primary)',
              margin: 0,
              lineHeight: 1.12,
            }}
          >
            What people actually say.
          </Text>
        </Stack>

        {/* Cards */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
          {TESTIMONIALS.map((t) => (
            <Box
              key={t.author}
              className="cl-reveal testi-card"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: '32px 28px',
                border: '1px solid var(--cl-border)',
                boxShadow: '0 4px 24px rgba(20,32,51,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 260,
              }}
            >
              <Box>
                <Stars />
                <Text
                  style={{
                    fontSize: '0.95rem',
                    color: 'var(--cl-text-primary)',
                    lineHeight: 1.7,
                    marginBottom: 28,
                    fontStyle: 'italic',
                  }}
                >
                  &ldquo;{t.quote}&rdquo;
                </Text>
              </Box>

              {/* Author row */}
              <Box style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Avatar initial */}
                <Box
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    backgroundColor: 'var(--cl-brand-soft)',
                    border: '1px solid rgba(12,122,138,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Text
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: 'var(--cl-brand)',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {t.initials}
                  </Text>
                </Box>
                <Box>
                  <Text style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cl-text-primary)', lineHeight: 1.2 }}>
                    {t.author}
                  </Text>
                  <Text style={{ fontSize: '0.75rem', color: 'var(--cl-text-muted)', marginTop: 2 }}>
                    {t.role}
                  </Text>
                </Box>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    </Box>
  );
}
