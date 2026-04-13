'use client';
/**
 * ClickLess AI – Marketing Header
 *
 * Floating glass-lite capsule: position fixed, centered, 56px height, 18px radius.
 * Section-aware contrast: light glass over Pearl canvas, dark glass over trust section.
 * Shrinks 4px on scroll for polish.
 */
import { useEffect, useState } from 'react';
import { Box, Group, Button, Anchor, Burger } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconArrowRight } from '@tabler/icons-react';
import { LogoWordmark } from '@/components/branding/LogoWordmark';
import { LogoMark } from '@/components/branding/LogoMark';

const NAV_ITEMS = [
  { label: 'Product',      href: '#product' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Security',     href: '#security' },
];

export function MarketingHeader() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const [scrolled,  setScrolled]  = useState(false);
  const [overDark,  setOverDark]  = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 60);
      // Detect when navbar is over the dark trust section
      const sec = document.getElementById('security');
      if (sec) {
        const r = sec.getBoundingClientRect();
        setOverDark(r.top <= 60 && r.bottom >= 60);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const textColor    = overDark ? 'rgba(238,244,247,0.85)' : 'var(--cl-text-secondary)';
  const textHover    = overDark ? '#EEF4F7'                : 'var(--cl-text-primary)';
  const pillHoverBg  = overDark ? 'rgba(255,255,255,0.08)' : 'var(--cl-surface-raised)';
  const h            = scrolled ? 50 : 56;

  return (
    <>
      {/* ── Floating capsule ─────────────────────────────────────────────── */}
      <Box
        component="header"
        style={{
          position:   'fixed',
          top:        scrolled ? 10 : 16,
          left:       '50%',
          transform:  'translateX(-50%)',
          width:      'min(1060px, calc(100vw - 32px))',
          height:     h,
          zIndex:     200,
          borderRadius: 18,
          backgroundColor: overDark
            ? 'rgba(7,28,37,0.62)'
            : 'rgba(247,246,243,0.78)',
          backdropFilter: 'blur(18px) saturate(150%)',
          WebkitBackdropFilter: 'blur(18px) saturate(150%)',
          border: overDark
            ? '1px solid rgba(255,255,255,0.09)'
            : '1px solid rgba(255,255,255,0.60)',
          boxShadow: overDark
            ? '0 8px 28px rgba(0,0,0,0.28)'
            : '0 8px 28px rgba(20,32,51,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          transition: 'all 280ms cubic-bezier(0.2,0.8,0.2,1)',
        }}
      >
        {/* Left: logo */}
        <Box
          component="a"
          href="/"
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            textDecoration: 'none', flexShrink: 0,
            transition: 'opacity 160ms ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.75'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          <LogoMark size={26} />
          <Box
            style={{
              fontSize: '0.95rem', fontWeight: 700,
              color: overDark ? '#EEF4F7' : 'var(--cl-text-primary)',
              letterSpacing: '-0.01em',
              transition: 'color 280ms ease',
            }}
          >
            ClickLess
          </Box>
        </Box>

        {/* Center: nav */}
        <Group
          gap={2}
          visibleFrom="sm"
          style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
        >
          {NAV_ITEMS.map(({ label, href }) => (
            <Anchor
              key={label}
              href={href}
              underline="never"
              style={{
                color: textColor,
                fontWeight: 500,
                fontSize: '0.875rem',
                padding: '5px 13px',
                borderRadius: 9999,
                display: 'block',
                transition: 'color 160ms ease, background-color 160ms ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = textHover;
                el.style.backgroundColor = pillHoverBg;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = textColor;
                el.style.backgroundColor = 'transparent';
              }}
            >
              {label}
            </Anchor>
          ))}
        </Group>

        {/* Right: sign in + CTA */}
        <Group gap={8} style={{ flexShrink: 0 }}>
          <Anchor
            href="/login"
            underline="never"
            visibleFrom="sm"
            style={{
              color: textColor,
              fontWeight: 500,
              fontSize: '0.875rem',
              padding: '5px 13px',
              borderRadius: 9999,
              transition: 'color 160ms ease, background-color 160ms ease',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = textHover;
              el.style.backgroundColor = pillHoverBg;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = textColor;
              el.style.backgroundColor = 'transparent';
            }}
          >
            Sign in
          </Anchor>

          <Button
            component="a"
            href="/signup"
            variant="brand"
            radius={9999}
            size="sm"
            visibleFrom="sm"
            rightSection={
              <IconArrowRight
                size={14}
                className="nav-cta-arrow"
                style={{ transition: 'transform 140ms ease' }}
              />
            }
            style={{ fontWeight: 600, height: 36 }}
            onMouseEnter={(e) => {
              const a = e.currentTarget.querySelector('.nav-cta-arrow') as HTMLElement;
              if (a) a.style.transform = 'translateX(2px)';
            }}
            onMouseLeave={(e) => {
              const a = e.currentTarget.querySelector('.nav-cta-arrow') as HTMLElement;
              if (a) a.style.transform = 'translateX(0)';
            }}
          >
            Try ClickLess
          </Button>

          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
            color={overDark ? '#EEF4F7' : 'var(--cl-text-primary)'}
          />
        </Group>
      </Box>

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      {opened && (
        <Box
          hiddenFrom="sm"
          style={{
            position: 'fixed',
            top: 80,
            left: 16,
            right: 16,
            zIndex: 199,
            backgroundColor: 'rgba(247,246,243,0.96)',
            backdropFilter: 'blur(18px)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 12px 40px rgba(20,32,51,0.12)',
            padding: '16px 20px',
          }}
        >
          {NAV_ITEMS.map(({ label, href }) => (
            <Anchor
              key={label}
              href={href}
              underline="never"
              display="block"
              onClick={close}
              style={{
                color: 'var(--cl-text-primary)',
                fontWeight: 500,
                fontSize: '0.95rem',
                padding: '10px 0',
                borderBottom: '1px solid var(--cl-border)',
              }}
            >
              {label}
            </Anchor>
          ))}
          <Group mt="md" gap="sm">
            <Button
              component="a" href="/login" variant="surface"
              radius={9999} fullWidth onClick={close}
              style={{ height: 44 }}
            >
              Sign in
            </Button>
            <Button
              component="a" href="/signup" variant="brand"
              radius={9999} fullWidth onClick={close}
              style={{ height: 44 }}
            >
              Try ClickLess
            </Button>
          </Group>
        </Box>
      )}
    </>
  );
}
