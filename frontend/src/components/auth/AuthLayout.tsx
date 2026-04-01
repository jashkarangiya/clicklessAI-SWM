'use client';
/**
 * ClickLess AI – Auth Layout
 *
 * Premium two-column layout:
 * - Left: brand column with gradient, logo, tagline, animated dot grid
 * - Right: form area
 * Collapses to single column on mobile (form only, with logo in header).
 */
import React from 'react';
import { Box, Text, Stack } from '@mantine/core';
import { BrandLockup } from '@/components/branding/BrandLockup';
import { ThemeToggle } from '@/components/common/ThemeToggle';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        backgroundColor: 'var(--cl-bg)',
      }}
      className="auth-grid"
    >
      {/* Brand column */}
      <Box
        className="auth-brand-col"
        style={{
          background: 'linear-gradient(135deg, var(--cl-bg) 0%, var(--cl-surface) 50%, var(--cl-bg-subtle) 100%)',
          borderRight: '1px solid var(--cl-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '4rem 3.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Dot grid decoration */}
        <DotGrid />

        {/* Brand glow */}
        <Box
          style={{
            position: 'absolute', top: '20%', left: '30%',
            width: 300, height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(155,93,255,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <Stack gap="xl" style={{ position: 'relative', zIndex: 1 }}>
          <BrandLockup size="lg" variant="horizontal" />

          <Stack gap="sm" style={{ maxWidth: 380 }}>
            <Text
              component="h1"
              style={{
                fontSize: '2rem', fontWeight: 700, lineHeight: 1.2,
                color: 'var(--cl-text-primary)', margin: 0,
              }}
            >
              {title}
            </Text>
            <Text style={{ color: 'var(--cl-text-secondary)', lineHeight: 1.6 }}>
              {subtitle}
            </Text>
          </Stack>

          {/* Feature list */}
          <Stack gap="sm">
            {FEATURES.map((f) => (
              <Box key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Box
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    backgroundColor: 'var(--cl-brand-soft)',
                    border: '1px solid var(--cl-brand)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{f.icon}</span>
                </Box>
                <Text size="sm" style={{ color: 'var(--cl-text-secondary)' }}>{f.label}</Text>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Box>

      {/* Form column */}
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--cl-bg-subtle)',
        }}
      >
        {/* Top bar with theme toggle */}
        <Box
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: '1.25rem 2rem',
            borderBottom: '1px solid var(--cl-border)',
          }}
        >
          <ThemeToggle />
        </Box>

        {/* Form area */}
        <Box
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <Box style={{ width: '100%', maxWidth: 420 }}>{children}</Box>
        </Box>
      </Box>

      {/* Mobile-only: brand logo header (hidden on desktop) */}
      <style>{`
        @media (max-width: 768px) {
          .auth-grid { grid-template-columns: 1fr !important; }
          .auth-brand-col { display: none !important; }
        }
      `}</style>
    </Box>
  );
}

const FEATURES = [
  { icon: '🛒', label: 'Smart shopping across Amazon & Walmart' },
  { icon: '🔒', label: 'You confirm every purchase — always' },
  { icon: '⚡', label: 'Real-time search & price comparison' },
  { icon: '🧠', label: 'Learns your preferences over time' },
];

function DotGrid() {
  return (
    <svg
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="var(--cl-brand)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}
