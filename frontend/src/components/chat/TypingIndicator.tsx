'use client';
/**
 * ClickLess AI – Typing Indicator
 *
 * Soft animated dots within a white assistant card frame.
 */
import { Box } from '@mantine/core';
import { LogoMark } from '@/components/branding/LogoMark';

export function TypingIndicator() {
  return (
    <Box style={{ display: 'flex', gap: 12, alignItems: 'flex-start', maxWidth: '80%' }}>
      <Box
        style={{
          flexShrink: 0, width: 32, height: 32, borderRadius: 10,
          backgroundColor: 'var(--cl-brand-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: 2,
        }}
      >
        <LogoMark size={18} animated={false} />
      </Box>
      <Box
        style={{
          backgroundColor: 'var(--cl-surface)',
          border: '1px solid var(--cl-border)',
          borderRadius: 20,
          padding: '16px 22px',
          display: 'flex', gap: 6, alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            style={{
              width: 7, height: 7, borderRadius: '50%',
              backgroundColor: 'var(--cl-text-muted)',
              opacity: 0.5,
              animation: `cl-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
        <style>{`
          @keyframes cl-bounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
            40% { transform: translateY(-5px); opacity: 0.8; }
          }
          @media (prefers-reduced-motion: reduce) {
            .cl-typing-dot { animation: none !important; }
          }
        `}</style>
      </Box>
    </Box>
  );
}
