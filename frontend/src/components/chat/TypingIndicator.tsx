'use client';
/**
 * ClickLess AI – Typing Indicator
 */
import { Box } from '@mantine/core';

export function TypingIndicator() {
  return (
    <Box style={{ display: 'flex', gap: 12, alignItems: 'flex-end', maxWidth: '80%' }}>
      <Box
        style={{
          flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
          backgroundColor: 'var(--cl-surface-raised)',
          border: '1px solid var(--cl-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="6" fill="var(--cl-brand)" opacity="0.6" />
        </svg>
      </Box>
      <Box
        style={{
          backgroundColor: 'var(--cl-surface)',
          border: '1px solid var(--cl-border)',
          borderRadius: '4px 16px 16px 16px',
          padding: '12px 16px',
          display: 'flex', gap: 5, alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: 'var(--cl-brand)',
              opacity: 0.6,
              animation: `cl-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
        <style>{`
          @keyframes cl-bounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
            40% { transform: translateY(-6px); opacity: 1; }
          }
          @media (prefers-reduced-motion: reduce) {
            .cl-typing-dot { animation: none !important; }
          }
        `}</style>
      </Box>
    </Box>
  );
}
