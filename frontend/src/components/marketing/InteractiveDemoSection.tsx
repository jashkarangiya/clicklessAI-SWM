'use client';
/**
 * ClickLess AI – Interactive Demo Section
 *
 * Pinned scroll story: scroll drives a 3-state product demo.
 * State 1: Ask | State 2: Compare | State 3: Approve
 * GSAP ScrollTrigger pins the inner panel while the outer wrapper scrolls (280vh).
 * z-index: 50 on pinnedRef keeps it above any section that scrolls up beneath it.
 */
import { useEffect, useRef } from 'react';
import { Box, Text } from '@mantine/core';
import { IconTruck } from '@tabler/icons-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function InteractiveDemoSection() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pinnedRef  = useRef<HTMLDivElement>(null);

  // State panel refs
  const state1Ref = useRef<HTMLDivElement>(null);
  const state2Ref = useRef<HTMLDivElement>(null);
  const state3Ref = useRef<HTMLDivElement>(null);

  // Stage marker refs
  const stageDot1Ref  = useRef<HTMLDivElement>(null);
  const stageDot2Ref  = useRef<HTMLDivElement>(null);
  const stageDot3Ref  = useRef<HTMLDivElement>(null);
  const stageLine1Ref = useRef<HTMLDivElement>(null);
  const stageLine2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Pin the inner element while wrapper scrolls.
        // 'top top+=88' starts the pin when the wrapper top is 88px into
        // the viewport — right at the navbar bottom — so no content hides behind it.
        ScrollTrigger.create({
          trigger: wrapperRef.current,
          pin: pinnedRef.current,
          start: 'top top+=88',
          end: 'bottom bottom',
          pinSpacing: false,
        });

        // Master timeline scrubbed by scroll — same markers as the pin.
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: 'top top+=88',
            end: 'bottom bottom',
            scrub: 1.2,
          },
        });

        // Stage 1→2 transition at ~30% scroll
        tl.to(state1Ref.current, { opacity: 0, y: -20, duration: 0.15, ease: 'power1.in' }, 0.25)
          .fromTo(state2Ref.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.15, ease: 'power1.out' }, 0.30)
          // Stage 2→3 transition at ~65% scroll
          .to(state2Ref.current, { opacity: 0, y: -20, duration: 0.15, ease: 'power1.in' }, 0.60)
          .fromTo(state3Ref.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.15, ease: 'power1.out' }, 0.65);

        // Stage markers
        tl.to(stageDot1Ref.current, { opacity: 0.5, scale: 0.8, duration: 0.1 }, 0.27)
          .to(stageDot2Ref.current, { backgroundColor: 'var(--cl-brand)', scale: 1.3, duration: 0.05 }, 0.30)
          .to(stageLine1Ref.current, { scaleX: 1, duration: 0.25 }, 0.05)

          .to(stageDot2Ref.current, { opacity: 0.5, scale: 0.8, duration: 0.1 }, 0.62)
          .to(stageDot3Ref.current, { backgroundColor: 'var(--cl-brand)', scale: 1.3, duration: 0.05 }, 0.65)
          .to(stageLine2Ref.current, { scaleX: 1, duration: 0.25 }, 0.40);
      });
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <Box
      ref={wrapperRef}
      style={{ minHeight: '280vh', position: 'relative' }}
    >
      <Box
        ref={pinnedRef}
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 2rem',
          // Ensure the pinned (position:fixed) panel always renders above
          // any content that scrolls beneath it while the pin is active.
          position: 'relative',
          zIndex: 50,
          backgroundColor: 'var(--cl-bg)',
        }}
      >
        {/* Section header */}
        <Box style={{ maxWidth: 800, width: '100%', textAlign: 'center', marginBottom: 40 }}>
          <Text
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--cl-brand)',
              marginBottom: 12,
            }}
          >
            Product demo
          </Text>
          <Text
            component="h2"
            className="display-serif"
            style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              color: 'var(--cl-text-primary)',
              lineHeight: 1.08,
              margin: '0 0 12px',
            }}
          >
            From request to checkout.
          </Text>
          <Text
            size="lg"
            style={{ color: 'var(--cl-text-secondary)', lineHeight: 1.6 }}
          >
            Scroll to see how ClickLess works.
          </Text>
        </Box>

        {/* Stage markers: 3 steps */}
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            marginBottom: 32,
            maxWidth: 360,
            width: '100%',
          }}
        >
          {/* Dot 1 */}
          <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Box
              ref={stageDot1Ref}
              style={{
                width: 14, height: 14, borderRadius: '50%',
                backgroundColor: 'var(--cl-brand)',
                boxShadow: '0 0 0 3px rgba(12,122,138,0.15)',
              }}
            />
            <Text style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--cl-text-muted)', whiteSpace: 'nowrap' }}>Ask</Text>
          </Box>

          {/* Line 1 */}
          <Box style={{ flex: 1, height: 2, backgroundColor: 'rgba(12,122,138,0.15)', position: 'relative', overflow: 'hidden', marginBottom: 18 }}>
            <Box
              ref={stageLine1Ref}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'var(--cl-brand)',
                transformOrigin: 'left center',
                transform: 'scaleX(0)',
              }}
            />
          </Box>

          {/* Dot 2 */}
          <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Box
              ref={stageDot2Ref}
              style={{
                width: 14, height: 14, borderRadius: '50%',
                backgroundColor: 'rgba(12,122,138,0.25)',
              }}
            />
            <Text style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--cl-text-muted)', whiteSpace: 'nowrap' }}>Compare</Text>
          </Box>

          {/* Line 2 */}
          <Box style={{ flex: 1, height: 2, backgroundColor: 'rgba(12,122,138,0.15)', position: 'relative', overflow: 'hidden', marginBottom: 18 }}>
            <Box
              ref={stageLine2Ref}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'var(--cl-brand)',
                transformOrigin: 'left center',
                transform: 'scaleX(0)',
              }}
            />
          </Box>

          {/* Dot 3 */}
          <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Box
              ref={stageDot3Ref}
              style={{
                width: 14, height: 14, borderRadius: '50%',
                backgroundColor: 'rgba(12,122,138,0.25)',
              }}
            />
            <Text style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--cl-text-muted)', whiteSpace: 'nowrap' }}>Approve</Text>
          </Box>
        </Box>

        {/* Large demo card */}
        <Box
          style={{
            maxWidth: 680,
            width: '100%',
            backgroundColor: 'var(--cl-surface)',
            borderRadius: 20,
            border: '1px solid var(--cl-border)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.07)',
            position: 'relative',
            minHeight: 360,
            overflow: 'hidden',
          }}
        >
          {/* ── State 1: Ask ── */}
          <Box
            ref={state1Ref}
            style={{ padding: '28px 28px 24px', position: 'relative', zIndex: 1 }}
          >
            {/* Header row */}
            <Box style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--cl-brand)' }} />
              <Text style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cl-text-primary)' }}>ClickLess</Text>
              <Box style={{
                marginLeft: 'auto',
                fontSize: '0.65rem', fontWeight: 600,
                padding: '3px 10px', borderRadius: 9999,
                backgroundColor: 'var(--cl-brand-soft)',
                color: 'var(--cl-brand)',
              }}>
                Searching...
              </Box>
            </Box>

            {/* Query display */}
            <Box
              style={{
                backgroundColor: 'var(--cl-surface-alt)',
                borderRadius: 14,
                padding: '14px 18px',
                border: '1px solid var(--cl-border)',
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: '0.9rem', color: 'var(--cl-text-primary)', fontStyle: 'italic', fontWeight: 500 }}>
                &ldquo;Noise-canceling headphones under $300, arrives by Friday&rdquo;
              </Text>
            </Box>

            {/* Three retailer rows */}
            <Box style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Amazon', 'Walmart', 'BestBuy'].map((retailer, i) => (
                <Box
                  key={retailer}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 10,
                    backgroundColor: 'var(--cl-surface-raised)',
                    border: '1px solid var(--cl-border)',
                  }}
                >
                  <Box style={{
                    width: 7, height: 7, borderRadius: '50%',
                    backgroundColor: 'var(--cl-brand)',
                    opacity: 0.5 + i * 0.2,
                    animation: `drift-float ${1.0 + i * 0.4}s ease-in-out infinite`,
                  }} />
                  <Text style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--cl-text-primary)', flex: 1 }}>
                    {retailer}
                  </Text>
                  <Text style={{ fontSize: '0.68rem', color: 'var(--cl-text-muted)' }}>scanning…</Text>
                </Box>
              ))}
            </Box>

            <Text style={{ fontSize: '0.7rem', color: 'var(--cl-text-muted)', marginTop: 16, textAlign: 'center' }}>
              Scanning 3 retailers...
            </Text>
          </Box>

          {/* ── State 2: Compare ── */}
          <Box
            ref={state2Ref}
            style={{
              opacity: 0,
              position: 'absolute', top: 0, left: 0, right: 0,
              padding: '28px 28px 24px',
              zIndex: 2,
              backgroundColor: 'var(--cl-surface)',
              borderRadius: 20,
            }}
          >
            {/* Header */}
            <Box style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Text style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--cl-text-primary)', flex: 1 }}>
                3 results found
              </Text>
              <Box style={{
                fontSize: '0.65rem', fontWeight: 700,
                padding: '3px 10px', borderRadius: 9999,
                backgroundColor: 'var(--cl-brand-soft)',
                color: 'var(--cl-brand)',
              }}>
                3
              </Box>
            </Box>

            {/* Table header */}
            <Box style={{ display: 'grid', gridTemplateColumns: '1fr 64px 80px 90px', gap: 8, padding: '0 12px', marginBottom: 8 }}>
              {['Product', 'Price', 'Delivery', 'Match'].map((h) => (
                <Text key={h} style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--cl-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</Text>
              ))}
            </Box>

            {/* Product rows */}
            {[
              { name: 'Sony WH-1000XM5', price: '$278', delivery: 'Tomorrow', match: 'Best match', matchColor: 'var(--cl-brand)', matchBg: 'var(--cl-brand-soft)', highlight: true },
              { name: 'Bose QC Ultra',    price: '$299', delivery: 'Wed',      match: 'Premium',    matchColor: 'var(--cl-accent-iris)', matchBg: 'var(--cl-accent-iris-soft)', highlight: false },
              { name: 'AirPods Max',      price: '$289', delivery: 'Today',    match: 'Fastest',    matchColor: 'var(--cl-success)',     matchBg: 'var(--cl-success-soft)', highlight: false },
            ].map((p) => (
              <Box
                key={p.name}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 64px 80px 90px',
                  gap: 8, alignItems: 'center',
                  padding: '11px 12px', borderRadius: 12,
                  marginBottom: 6,
                  backgroundColor: p.highlight ? 'rgba(12,122,138,0.05)' : 'var(--cl-surface)',
                  border: `1px solid ${p.highlight ? 'rgba(12,122,138,0.18)' : 'var(--cl-border)'}`,
                }}
              >
                <Box>
                  <Text style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--cl-text-primary)' }}>{p.name}</Text>
                </Box>
                <Text style={{ fontSize: '0.78rem', fontWeight: 700, color: p.highlight ? 'var(--cl-brand)' : 'var(--cl-text-primary)' }}>
                  {p.price}
                </Text>
                <Box style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IconTruck size={10} style={{ color: 'var(--cl-success)' }} />
                  <Text style={{ fontSize: '0.72rem', color: 'var(--cl-success)' }}>{p.delivery}</Text>
                </Box>
                <Box style={{
                  display: 'inline-block',
                  fontSize: '0.63rem', fontWeight: 600,
                  padding: '2px 8px', borderRadius: 9999,
                  backgroundColor: p.matchBg,
                  color: p.matchColor,
                }}>
                  {p.match}
                </Box>
              </Box>
            ))}
          </Box>

          {/* ── State 3: Approve ── */}
          <Box
            ref={state3Ref}
            style={{
              opacity: 0,
              position: 'absolute', top: 0, left: 0, right: 0,
              padding: '28px 28px 24px',
              zIndex: 3,
              backgroundColor: 'var(--cl-surface)',
              borderRadius: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minHeight: 360,
              justifyContent: 'center',
            }}
          >
            {/* Product header with checkmark */}
            <Box style={{ textAlign: 'center', marginBottom: 24 }}>
              <Box style={{
                width: 48, height: 48, borderRadius: '50%',
                backgroundColor: 'var(--cl-brand-soft)',
                border: '2px solid var(--cl-brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: '1.3rem',
              }}>
                ✓
              </Box>
              <Text style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--cl-text-primary)' }}>
                Sony WH-1000XM5
              </Text>
            </Box>

            {/* Details grid */}
            <Box style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              gap: 16, marginBottom: 24, width: '100%', maxWidth: 400,
            }}>
              {[
                { label: 'Price', value: '$278' },
                { label: 'Delivery', value: 'Tomorrow' },
                { label: 'Retailer', value: 'Amazon' },
              ].map((d) => (
                <Box key={d.label} style={{ textAlign: 'center' }}>
                  <Text style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--cl-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    {d.label}
                  </Text>
                  <Text style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--cl-text-primary)' }}>
                    {d.value}
                  </Text>
                </Box>
              ))}
            </Box>

            {/* Approve button */}
            <Box
              style={{
                width: '100%', maxWidth: 400,
                height: 48,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 12,
                backgroundColor: 'var(--cl-brand)',
                color: '#fff',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.01em',
                marginBottom: 12,
              }}
            >
              Approve Purchase →
            </Box>

            <Text style={{ fontSize: '0.75rem', color: 'var(--cl-text-muted)', textAlign: 'center' }}>
              Nothing moves without your approval.
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
