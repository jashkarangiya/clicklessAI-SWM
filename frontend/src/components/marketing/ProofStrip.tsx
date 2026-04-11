'use client';
/**
 * ClickLess AI – Social Proof Strip
 *
 * Credibility anchors immediately below the hero:
 * star rating · SOC 2 · avg checkout time · retailer count
 * Plain separator-divided row — no colored badges.
 */
import { Box, Text, Group } from '@mantine/core';

const PROOFS = [
  {
    headline: '4.9 / 5',
    detail: '2,400+ users',
    stars: true,
  },
  {
    headline: 'SOC 2 Type II',
    detail: 'Security certified',
    stars: false,
  },
  {
    headline: '47 seconds',
    detail: 'Average checkout',
    stars: false,
  },
  {
    headline: '40+ retailers',
    detail: 'Connected & growing',
    stars: false,
  },
];

function Stars() {
  return (
    <Box style={{ display: 'flex', gap: 2, marginBottom: 3 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 20 20" fill="#F5A623">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </Box>
  );
}

export function ProofStrip() {
  return (
    <Box
      style={{
        borderTop: '1px solid var(--cl-border)',
        borderBottom: '1px solid var(--cl-border)',
        backgroundColor: 'var(--cl-surface)',
        padding: '20px 2rem',
      }}
    >
      <Box
        style={{
          maxWidth: 900,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 0,
        }}
        className="proof-strip-row"
      >
        {PROOFS.map((p, i) => (
          <Box key={p.headline} style={{ display: 'flex', alignItems: 'center' }}>
            {/* Separator */}
            {i > 0 && (
              <Box
                style={{
                  width: 1,
                  height: 32,
                  backgroundColor: 'var(--cl-border)',
                  marginInline: 36,
                  flexShrink: 0,
                }}
              />
            )}
            <Box style={{ textAlign: 'center' }}>
              {p.stars && <Stars />}
              <Text
                style={{
                  fontSize: '0.97rem',
                  fontWeight: 700,
                  color: 'var(--cl-text-primary)',
                  lineHeight: 1.2,
                }}
              >
                {p.headline}
              </Text>
              <Text
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--cl-text-muted)',
                  marginTop: 2,
                }}
              >
                {p.detail}
              </Text>
            </Box>
          </Box>
        ))}
      </Box>

      <style>{`
        @media (max-width: 640px) {
          .proof-strip-row {
            flex-wrap: wrap !important;
            gap: 1.5rem !important;
            justify-content: center !important;
          }
        }
      `}</style>
    </Box>
  );
}
