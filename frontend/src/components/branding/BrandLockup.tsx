'use client';
/**
 * ClickLess AI – BrandLockup
 *
 * Combines LogoMark + LogoWordmark.
 *
 * Variants:
 *   horizontal (default) – icon left, wordmark right
 *   stacked              – icon above, wordmark below
 *   icon-only            – just the mark
 */

import { LogoMark } from './LogoMark';

type LockupVariant = 'horizontal' | 'stacked' | 'icon-only';
type LockupSize    = 'sm' | 'md' | 'lg' | 'xl';

interface BrandLockupProps {
  variant?: LockupVariant;
  size?:    LockupSize;
  className?: string;
  animated?: boolean;
}

const iconSizeMap: Record<LockupSize, number> = { sm: 32, md: 48, lg: 64, xl: 260 };

export function BrandLockup({
  variant = 'horizontal',
  size = 'md',
  className,
  animated = true,
}: BrandLockupProps) {
  const iconSize = iconSizeMap[size];

  if (variant === 'icon-only') {
    return <LogoMark size={iconSize} animated={animated} className={className} />;
  }

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        userSelect: 'none',
        textDecoration: 'none',
      }}
    >
      <LogoMark size={iconSize} animated={animated} />
    </span>
  );
}
