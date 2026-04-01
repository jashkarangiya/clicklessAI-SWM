'use client';
/**
 * ClickLess AI – LogoWordmark
 *
 * Text-based brand name: "ClickLess AI"
 * "ClickLess" in textPrimary weight bold, "AI" in brand color.
 */

interface LogoWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = { sm: '1rem', md: '1.25rem', lg: '1.6rem', xl: '2rem' };

export function LogoWordmark({ size = 'md', className }: LogoWordmarkProps) {
  const fs = sizeMap[size];
  return (
    <span
      className={className}
      style={{
        fontSize: fs,
        fontFamily: 'Inter, -apple-system, sans-serif',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '0.2em',
        userSelect: 'none',
      }}
      aria-label="ClickLess AI"
    >
      <span style={{ color: 'var(--cl-text-primary)' }}>ClickLess</span>
      <span
        style={{
          color: 'var(--cl-brand)',
          fontWeight: 800,
          letterSpacing: '-0.01em',
        }}
      >
        AI
      </span>
    </span>
  );
}
