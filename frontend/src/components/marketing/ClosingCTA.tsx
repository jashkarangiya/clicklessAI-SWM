'use client';
/**
 * ClickLess AI – Closing CTA (Pearl + Juniper)
 *
 * Animated ambient background: two soft radial blobs drift slowly (12–16s loops).
 * Buttons: most-refined on the page — bigger lift, stronger arrow nudge.
 */
import { Box, Text, Button, Group, Stack } from '@mantine/core';
import { IconArrowRight, IconShieldCheck } from '@tabler/icons-react';

export function ClosingCTA() {
  return (
    <Box
      component="section"
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '40px 2rem 88px',
      }}
    >
      <Box
        style={{
          background: 'linear-gradient(135deg, var(--cl-brand-soft) 0%, var(--cl-surface) 60%, var(--cl-accent-gold-soft) 100%)',
          borderRadius: 28,
          padding: '72px 48px',
          border: '1px solid var(--cl-border)',
          textAlign: 'center',
          maxWidth: 800,
          margin: '0 auto',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated ambient blob — warm amber drift */}
        <Box
          style={{
            position: 'absolute',
            bottom: -60,
            left: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(12,122,138,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
            animation: 'spotlight-shift 13s ease-in-out infinite',
          }}
        />
        <Box
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(184,137,68,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
            animation: 'spotlight-shift 16s ease-in-out infinite reverse',
          }}
        />

        {/* Content */}
        <Stack gap="xl" align="center" style={{ position: 'relative', zIndex: 1 }}>
          <Text
            component="h2"
            style={{
              fontSize: '2.75rem', fontWeight: 700,
              color: 'var(--cl-text-primary)',
              letterSpacing: '-0.025em', margin: 0,
              maxWidth: 520,
              lineHeight: 1.1,
            }}
          >
            The faster way from{' '}
            <span className="serif-accent" style={{ color: 'var(--cl-brand)' }}>
              request
            </span>{' '}
            to checkout.
          </Text>

          <Text
            size="lg"
            style={{
              color: 'var(--cl-text-secondary)',
              maxWidth: 420,
              lineHeight: 1.7,
            }}
          >
            Create your free account and let ClickLess handle the browsing.
            You always have the final say.
          </Text>

          <Group gap="md">
            {/* Primary CTA — most refined button on the page */}
            <Button
              component="a"
              href="/signup"
              variant="brand"
              size="lg"
              radius={9999}
              rightSection={
                <IconArrowRight
                  size={18}
                  className="cta-hero-arrow"
                  style={{ transition: 'transform 140ms ease' }}
                />
              }
              className="cl-btn-lift"
              style={{ fontWeight: 600, height: 54, paddingInline: 36 }}
              onMouseEnter={(e) => {
                const arrow = e.currentTarget.querySelector('.cta-hero-arrow') as HTMLElement;
                if (arrow) arrow.style.transform = 'translateX(3px)';
              }}
              onMouseLeave={(e) => {
                const arrow = e.currentTarget.querySelector('.cta-hero-arrow') as HTMLElement;
                if (arrow) arrow.style.transform = 'translateX(0)';
              }}
            >
              Try ClickLess free
            </Button>

            <Button
              component="a"
              href="/login"
              variant="surface"
              size="lg"
              radius={9999}
              className="cl-btn-lift"
              style={{ height: 54, paddingInline: 32 }}
            >
              Sign in
            </Button>
          </Group>

          <Group gap={6}>
            <IconShieldCheck size={14} style={{ color: 'var(--cl-text-muted)' }} />
            <Text size="sm" style={{ color: 'var(--cl-text-muted)' }}>
              Free account · No card required · Approval required for every purchase
            </Text>
          </Group>
        </Stack>
      </Box>
    </Box>
  );
}
