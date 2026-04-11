'use client';
/**
 * ClickLess AI – Closing CTA
 *
 * Clean white card — no gradients, no floating ornaments.
 * Subtle teal accent line at top as the only brand hint.
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
          backgroundColor: '#FFFFFF',
          borderRadius: 28,
          padding: '72px 48px',
          border: '1px solid #E6ECEF',
          boxShadow: '0 20px 60px rgba(20,32,51,0.06)',
          textAlign: 'center',
          maxWidth: 800,
          margin: '0 auto',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle teal top-accent line */}
        <Box
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 64,
            height: 3,
            borderRadius: '0 0 3px 3px',
            backgroundColor: 'var(--cl-brand)',
            opacity: 0.7,
          }}
        />

        {/* Content */}
        <Stack gap="xl" align="center" style={{ position: 'relative', zIndex: 1 }}>
          <Text
            component="h2"
            className="display-serif"
            style={{
              fontSize: 'clamp(2.2rem, 4vw, 3rem)',
              color: 'var(--cl-text-primary)',
              margin: 0,
              maxWidth: 540,
              lineHeight: 1.08,
            }}
          >
            The faster way from{' '}
            <em style={{ color: 'var(--cl-brand)' }}>request</em>{' '}
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
