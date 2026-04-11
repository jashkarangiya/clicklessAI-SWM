'use client';
/**
 * ClickLess AI – Security Section (Pearl + Juniper) — "Trust Chamber"
 *
 * Dark background (#061822) with teal glow + CSS grid texture.
 * Left: sticky trust statement. Right: 4 vertically stacked cards with animated connector.
 * GSAP: connector line grows on scroll, cards stagger in on scroll.
 */
import { useEffect, useRef } from 'react';
import { Box, Text, Stack } from '@mantine/core';
import { IconLock, IconEyeOff, IconClock, IconShieldCheck } from '@tabler/icons-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const SECURITY_CARDS = [
  {
    icon: IconEyeOff,
    title: 'Your password never leaves your device',
    body: 'ClickLess generates a one-time AES-256 session token per search. Your retailer credentials are never stored, transmitted, or accessible to our servers.',
    micro: 'AES-256 · Zero credential storage',
  },
  {
    icon: IconShieldCheck,
    title: 'Every cart action needs your go-ahead',
    body: 'ClickLess cannot add items to a cart, modify quantities, or initiate checkout without a live confirmation from you. There are no background purchases.',
    micro: 'Mandatory confirmation · Full audit log',
  },
  {
    icon: IconClock,
    title: 'Sessions close when you finish',
    body: 'Retailer sessions are transport-layer encrypted with TLS 1.3 and expire automatically once your task ends. No persistent login state is kept on our servers.',
    micro: 'TLS 1.3 · Auto-expiry · Zero persistence',
  },
  {
    icon: IconLock,
    title: 'End-to-end encrypted transport',
    body: 'All data between your device, our API, and retailers travels over HTTPS/WSS. We log session events for debugging but store zero payment or credential data.',
    micro: 'HTTPS/WSS · Zero-knowledge payments',
  },
];

export function SecuritySection() {
  const sectionRef   = useRef<HTMLElement>(null);
  const rightColRef  = useRef<HTMLDivElement>(null);
  const connectorRef = useRef<HTMLDivElement>(null);
  const secCardsRef  = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Connector line grows as right column scrolls into view
        gsap.to(connectorRef.current, {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: rightColRef.current,
            start: 'top 70%',
            end: 'bottom 60%',
            scrub: 1,
          },
        });

        // Cards stagger in
        secCardsRef.current.forEach((card) => {
          gsap.to(card, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 80%',
              once: true,
            },
          });
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <Box
      component="section"
      id="security"
      ref={sectionRef}
      style={{
        position: 'relative',
        backgroundColor: '#071C25',
        padding: '120px 2rem',
        overflow: 'hidden',
      }}
    >
      {/* Teal radial glow */}
      <Box
        style={{
          position: 'absolute',
          top: '50%',
          right: '-10%',
          transform: 'translateY(-50%)',
          width: '60vw',
          height: '60vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(12,122,138,0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* CSS grid texture */}
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Content */}
      <Box
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '5fr 7fr',
          gap: '4rem',
          alignItems: 'start',
          position: 'relative',
          zIndex: 1,
        }}
        className="security-grid"
      >
        {/* ── Left column: sticky trust statement ── */}
        <Box style={{ position: 'sticky', top: '120px', height: 'fit-content' }}>
          <Stack gap="lg">
            {/* Eyebrow */}
            <Text
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--cl-brand)',
              }}
            >
              Security &amp; Control
            </Text>

            {/* H2 */}
            <Text
              component="h2"
              className="display-serif"
              style={{
                fontSize: 'clamp(2.4rem, 3.5vw, 3.2rem)',
                color: '#EEF4F7',
                lineHeight: 1.08,
                margin: 0,
              }}
            >
              Control is built in.
            </Text>

            {/* Body */}
            <Text
              style={{
                color: '#8EA4B2',
                lineHeight: 1.7,
                maxWidth: 380,
                fontSize: '1rem',
              }}
            >
              ClickLess never places an order without your approval. Retailer credentials
              stay private. Sessions stay controlled.
            </Text>

            {/* Trust statement */}
            <Box
              style={{
                marginTop: 16,
                borderLeft: '2px solid rgba(12,122,138,0.4)',
                paddingLeft: 16,
              }}
            >
              <Text
                style={{
                  color: '#8EA4B2',
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                }}
              >
                AI is doing the work. You are still in control.
              </Text>
            </Box>
          </Stack>
        </Box>

        {/* ── Right column: stacked cards with vertical connector ── */}
        <Box
          ref={rightColRef}
          style={{ position: 'relative', paddingLeft: 32 }}
        >
          {/* Connector line */}
          <Box
            ref={connectorRef}
            style={{
              position: 'absolute',
              left: 27,
              top: 20,
              width: 2,
              height: 'calc(100% - 40px)',
              background: 'linear-gradient(to bottom, rgba(12,122,138,0.5), rgba(12,122,138,0.1))',
              transformOrigin: 'top',
              transform: 'scaleY(0)',
            }}
          />

          {/* Cards */}
          {SECURITY_CARDS.map((card, i) => {
            const IconComp = card.icon;
            return (
              <Box
                key={card.title}
                ref={(el: HTMLDivElement | null) => { if (el) secCardsRef.current[i] = el; }}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16,
                  padding: '22px 20px',
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start',
                  opacity: 0,
                  transform: 'translateY(20px)',
                  marginBottom: 24,
                }}
              >
                {/* Icon tile */}
                <Box
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: 'rgba(12,122,138,0.12)',
                    border: '1px solid rgba(12,122,138,0.18)',
                    color: 'var(--cl-brand)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconComp size={18} />
                </Box>

                {/* Content */}
                <Box style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: '#EEF4F7',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      marginBottom: 6,
                    }}
                  >
                    {card.title}
                  </Text>
                  <Text
                    style={{
                      color: '#8EA4B2',
                      fontSize: '0.83rem',
                      lineHeight: 1.65,
                      marginBottom: 0,
                    }}
                  >
                    {card.body}
                  </Text>
                  <Box
                    style={{
                      display: 'inline-block',
                      marginTop: 8,
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: 'rgba(12,122,138,0.9)',
                      backgroundColor: 'rgba(12,122,138,0.1)',
                      border: '1px solid rgba(12,122,138,0.2)',
                      borderRadius: 4,
                      padding: '2px 7px',
                    }}
                  >
                    {card.micro}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
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
