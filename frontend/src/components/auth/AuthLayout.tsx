'use client';
/**
 * ClickLess AI – Auth Layout  (Sellora-inspired split shell)
 *
 * A large rounded shell (20px radius) sits centered on the page canvas.
 *
 * LEFT  (44%) — Form panel
 *   white / dark-surface bg · logo + theme toggle header ·
 *   form children centered at 380px max-width · footer row at bottom
 *
 * RIGHT (56%) — Hero panel
 *   solid brand-teal bg (light) / deep ink (dark) · gradient texture ·
 *   large headline + subtitle + floating product comparison mockup
 *
 * Identical layout for login AND signup — no column mirroring.
 * Hero headline and form title change per variant.
 *
 * Motion:
 *   Shell: translateY(16px) → 0, opacity 0→1, 480ms on mount
 *   Form header/fields/footer: stagger 60ms each, 80ms base delay
 *   Hero headline/sub/mockup: stagger 80ms each, 120ms base delay
 */
import React, { useEffect, useRef } from 'react';
import { Box, Text, Stack, Group } from '@mantine/core';
import {
  IconShieldCheck, IconBolt, IconMessageCircle, IconScale,
  IconCheck, IconTruck, IconStarFilled,
} from '@tabler/icons-react';
import { LogoMark } from '@/components/branding/LogoMark';

export type AuthVariant = 'login' | 'signup';

interface AuthLayoutProps {
  children: React.ReactNode;
  variant: AuthVariant;
}

/* ── Floating product comparison mockup ─────────────────────────────────── */
function ComparisonMockup() {
  const products = [
    {
      name: 'Sony WH-1000XM5',
      price: '$278',
      rating: '4.7',
      delivery: 'Tomorrow',
      tag: 'Best match',
      tagColor: 'var(--cl-brand)',
    },
    {
      name: 'Bose QuietComfort Ultra',
      price: '$299',
      rating: '4.8',
      delivery: 'Wed',
      tag: null,
      tagColor: '',
    },
  ];

  return (
    <Box
      style={{
        backgroundColor: 'var(--cl-auth-hero-card)',
        border: '1px solid var(--cl-auth-hero-rim)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.12)',
        width: '100%',
        maxWidth: 400,
      }}
    >
      {/* Mockup title bar */}
      <Box
        style={{
          padding: '11px 16px',
          borderBottom: '1px solid var(--cl-auth-hero-rim)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backgroundColor: 'var(--cl-auth-hero-glow)',
        }}
      >
        <Box style={{ display: 'flex', gap: 5 }}>
          {['#FF5F57', '#FFBD2E', '#28CA41'].map((c) => (
            <Box key={c} style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c, opacity: 0.8 }} />
          ))}
        </Box>
        <Box style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Box
            style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: 'var(--cl-brand)', flexShrink: 0,
              opacity: 0.9,
            }}
          />
          <Text
            style={{
              fontSize: '0.7rem',
              color: 'var(--cl-auth-muted)',
              fontStyle: 'italic',
            }}
          >
            Headphones under $300, arrives before Friday
          </Text>
        </Box>
      </Box>

      {/* Column headers */}
      <Box
        style={{
          padding: '8px 16px 6px',
          display: 'grid',
          gridTemplateColumns: '1fr auto auto auto',
          gap: 8,
          borderBottom: '1px solid var(--cl-auth-hero-rim)',
        }}
      >
        {['Product', 'Price', 'Rating', 'Delivery'].map((h) => (
          <Text
            key={h}
            style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              color: 'var(--cl-auth-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              textAlign: h !== 'Product' ? 'center' : 'left',
            }}
          >
            {h}
          </Text>
        ))}
      </Box>

      {/* Product rows */}
      <Box style={{ padding: '6px 8px' }}>
        <Stack gap={4}>
          {products.map((p, i) => (
            <Box
              key={p.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto auto',
                gap: 8,
                alignItems: 'center',
                padding: '9px 10px',
                borderRadius: 10,
                backgroundColor: i === 0
                  ? 'rgba(12,122,138,0.07)'
                  : 'transparent',
                border: i === 0
                  ? '1px solid rgba(12,122,138,0.12)'
                  : '1px solid transparent',
              }}
            >
              {/* Name + tag */}
              <Box>
                <Box style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--cl-auth-text)' }}>
                    {p.name}
                  </Text>
                  {p.tag && (
                    <Text
                      style={{
                        fontSize: '0.57rem',
                        fontWeight: 700,
                        color: p.tagColor,
                        backgroundColor: 'rgba(12,122,138,0.1)',
                        borderRadius: 9999,
                        padding: '1px 6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.tag}
                    </Text>
                  )}
                </Box>
              </Box>

              {/* Price */}
              <Text
                style={{
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  color: i === 0 ? 'var(--cl-brand)' : 'var(--cl-auth-text)',
                  textAlign: 'center',
                }}
              >
                {p.price}
              </Text>

              {/* Rating */}
              <Box style={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
                <IconStarFilled size={9} style={{ color: '#F5A623' }} />
                <Text style={{ fontSize: '0.67rem', fontWeight: 600, color: 'var(--cl-auth-text)' }}>
                  {p.rating}
                </Text>
              </Box>

              {/* Delivery */}
              <Box style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center' }}>
                <IconTruck size={9} style={{ color: 'var(--cl-success)' }} />
                <Text style={{ fontSize: '0.65rem', color: 'var(--cl-success)', fontWeight: 500 }}>
                  {p.delivery}
                </Text>
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Approval footer */}
      <Box
        style={{
          padding: '10px 16px 12px',
          borderTop: '1px solid var(--cl-auth-hero-rim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <IconShieldCheck size={11} style={{ color: 'var(--cl-success)' }} />
          <Text style={{ fontSize: '0.65rem', color: 'var(--cl-auth-muted)' }}>
            Approval required before checkout
          </Text>
        </Box>
        <Box
          style={{
            padding: '4px 12px',
            borderRadius: 9999,
            backgroundColor: 'var(--cl-brand)',
            fontSize: '0.65rem',
            fontWeight: 700,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'default',
          }}
        >
          <IconCheck size={9} />
          Approve
        </Box>
      </Box>
    </Box>
  );
}

/* ── Hero panel (teal editorial) ────────────────────────────────────────── */
interface HeroPanelProps {
  variant: AuthVariant;
}

function HeroPanel({ variant }: HeroPanelProps) {
  const isLogin = variant === 'login';

  return (
    <Box
      style={{
        background: `linear-gradient(150deg, var(--cl-auth-hero-bg) 0%, var(--cl-auth-hero-deep) 100%)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '52px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="auth-hero-panel"
    >
      {/* Ambient top-right glow */}
      <Box
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -120,
          right: -80,
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--cl-auth-hero-glow) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      {/* Bottom-left arc */}
      <Box
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: -100,
          left: -60,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--cl-auth-hero-glow) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Centered content frame — 540px max, left-aligned text */}
      <Stack gap={0} style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 540 }}>
        {/* Mockup — rendered above the headline for visual layering */}
        <Box
          className="auth-hero-mockup"
          style={{ marginBottom: 36 }}
        >
          <ComparisonMockup />
        </Box>

        {/* Headline */}
        <Box className="auth-hero-headline">
          <Text
            component="h2"
            style={{
              fontSize: 'clamp(1.75rem, 2.6vw, 2.4rem)',
              fontWeight: 700,
              color: 'var(--cl-auth-hero-text)',
              lineHeight: 1.12,
              letterSpacing: '-0.025em',
              margin: 0,
              marginBottom: 12,
            }}
          >
            {isLogin
              ? <>The smarter way to shop.<br />Pick up where you left off.</>
              : <>From request to checkout,<br />with approval built in.</>
            }
          </Text>
          <Text
            style={{
              fontSize: '0.9rem',
              color: 'var(--cl-auth-hero-sub)',
              lineHeight: 1.65,
              maxWidth: 340,
            }}
          >
            {isLogin
              ? 'Resume saved comparisons and pending approvals. Your preferences, exactly as you left them.'
              : 'Tell ClickLess what you need. It searches Amazon and Walmart, scores every option, and waits for your go-ahead.'
            }
          </Text>
        </Box>

        {/* Feature chips */}
        <Box className="auth-hero-chips" style={{ marginTop: 28 }}>
          <Group gap={8} wrap="wrap">
            {[
              { icon: <IconMessageCircle size={11} />, label: 'Ask in plain language' },
              { icon: <IconScale size={11} />,         label: 'Compare retailers'     },
              { icon: <IconShieldCheck size={11} />,   label: 'Approve before buying' },
              { icon: <IconBolt size={11} />,          label: 'No card required'      },
            ].map(({ icon, label }) => (
              <Box
                key={label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 9999,
                  border: '1px solid var(--cl-auth-hero-rim)',
                  backgroundColor: 'var(--cl-auth-hero-glow)',
                  fontSize: '0.68rem',
                  fontWeight: 500,
                  color: 'var(--cl-auth-hero-sub)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: 'var(--cl-auth-hero-text)', opacity: 0.8 }}>{icon}</span>
                {label}
              </Box>
            ))}
          </Group>
        </Box>
      </Stack>
    </Box>
  );
}

/* ── Main layout ────────────────────────────────────────────────────────── */
export function AuthLayout({ children, variant }: AuthLayoutProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const isLogin  = variant === 'login';

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    // Shell entrance
    requestAnimationFrame(() => {
      shell.style.opacity   = '1';
      shell.style.transform = 'translateY(0)';
    });

    // Form panel elements
    ['.auth-form-header', '.auth-form-body', '.auth-form-footer'].forEach((sel, i) => {
      const el = shell.querySelector(sel) as HTMLElement | null;
      if (el) {
        setTimeout(() => {
          el.style.opacity   = '1';
          el.style.transform = 'translateY(0)';
        }, 80 + i * 70);
      }
    });

    // Hero panel elements
    ['.auth-hero-mockup', '.auth-hero-headline', '.auth-hero-chips'].forEach((sel, i) => {
      const el = shell.querySelector(sel) as HTMLElement | null;
      if (el) {
        setTimeout(() => {
          el.style.opacity   = '1';
          el.style.transform = 'translateY(0)';
        }, 120 + i * 90);
      }
    });
  }, []);

  return (
    <Box
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--cl-auth-page-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Shell */}
      <Box
        ref={shellRef}
        style={{
          width: '100%',
          maxWidth: 1100,
          minHeight: 'calc(100vh - 48px)',
          display: 'grid',
          // Login: hero LEFT 52% + form RIGHT 48%
          // Signup: form LEFT 48% + hero RIGHT 52%
          gridTemplateColumns: isLogin ? '52fr 48fr' : '48fr 52fr',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.14), 0 4px 20px rgba(0,0,0,0.08)',
          opacity: 0,
          transform: 'translateY(16px)',
          transition: 'opacity 0.5s var(--ease-emphasis), transform 0.5s var(--ease-emphasis)',
        }}
        className="auth-shell"
      >
        {/* ── Login: hero LEFT first; Signup: form LEFT first ─────────── */}
        {isLogin && <HeroPanel variant={variant} />}

        {/* ── Form panel ───────────────────────────────────────────────── */}
        <Box
          style={{
            backgroundColor: 'var(--cl-auth-form-bg)',
            display: 'flex',
            flexDirection: 'column',
            borderLeft:  isLogin ? '1px solid var(--cl-auth-divider)' : undefined,
            borderRight: isLogin ? undefined : '1px solid var(--cl-auth-divider)',
          }}
        >
          {/* Form header — logo */}
          <Box
            className="auth-form-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '28px 36px 0',
              flexShrink: 0,
            }}
          >
            <Box
              component="a"
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
                opacity: 1,
                transition: 'opacity var(--motion-fast) ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.7'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            >
              <LogoMark size={26} />
              <Text
                fw={700}
                style={{
                  fontSize: '0.97rem',
                  color: 'var(--cl-auth-text)',
                  letterSpacing: '-0.01em',
                }}
              >
                ClickLess
              </Text>
            </Box>
          </Box>

          {/* Form body — centered, scrollable on short screens */}
          <Box
            className="auth-form-body"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '36px 36px',
              overflowY: 'auto',
            }}
          >
            <Box style={{ width: '100%', maxWidth: 380 }}>
              {children}
            </Box>
          </Box>

          {/* Form footer */}
          <Box
            className="auth-form-footer"
            style={{
              padding: '0 36px 28px',
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--cl-auth-divider)',
              paddingTop: 16,
            }}
          >
            <Text size="xs" style={{ color: 'var(--cl-auth-muted)' }}>
              © 2025 ClickLess AI
            </Text>
            <Group gap={16}>
              <Box
                component="a"
                href="#"
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--cl-auth-muted)',
                  textDecoration: 'none',
                  transition: 'color var(--motion-fast) ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--cl-auth-text)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--cl-auth-muted)'; }}
              >
                Privacy Policy
              </Box>
              <Box
                component="a"
                href="#"
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--cl-auth-muted)',
                  textDecoration: 'none',
                  transition: 'color var(--motion-fast) ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--cl-auth-text)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--cl-auth-muted)'; }}
              >
                Terms
              </Box>
            </Group>
          </Box>
        </Box>

        {/* ── Signup: hero RIGHT last ──────────────────────────────────── */}
        {!isLogin && <HeroPanel variant={variant} />}
      </Box>

      {/* ── Animation + responsive styles ─────────────────────────────── */}
      <style>{`
        .auth-form-header,
        .auth-form-body,
        .auth-form-footer,
        .auth-hero-mockup,
        .auth-hero-headline,
        .auth-hero-chips {
          opacity: 0;
          transform: translateY(12px);
          transition:
            opacity   0.38s var(--ease-emphasis),
            transform 0.38s var(--ease-emphasis);
        }

        @media (max-width: 900px) {
          .auth-shell {
            grid-template-columns: 1fr !important;
            min-height: unset !important;
            border-radius: 16px !important;
          }
          /* On mobile the teal hero panel stacks — give it a fixed height */
          .auth-hero-panel {
            min-height: 340px;
            justify-content: center !important;
          }
        }

        @media (max-width: 480px) {
          .auth-shell > :first-child {
            padding: 20px !important;
          }
        }
      `}</style>
    </Box>
  );
}
