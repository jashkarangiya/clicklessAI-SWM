'use client';
/**
 * ClickLess AI – LogoMark
 *
 * Uses the brand icon from /public/favicon/.
 * mix-blend-mode: multiply makes the white PNG background invisible
 * on any light surface — no transparency needed.
 */
import Image from 'next/image';

interface LogoMarkProps {
  size?: number;
  className?: string;
  /** Set to true when placed on a dark/teal background — uses white filter */
  onDark?: boolean;
  animated?: boolean; // kept for backwards compat
  color?: string;     // kept for backwards compat
}

export function LogoMark({ size = 32, className, onDark = false }: LogoMarkProps) {
  return (
    <Image
      src="/favicon/web-app-manifest-192x192.png"
      alt="ClickLess AI"
      width={size}
      height={size}
      className={className}
      priority
      style={{
        objectFit: 'contain',
        width: size,
        height: size,
        flexShrink: 0,
        // On light surfaces: multiply removes the white bg entirely
        // On dark surfaces: brightness(0) invert(1) turns it white
        mixBlendMode: onDark ? 'normal' : 'multiply',
        filter: onDark ? 'brightness(0) invert(1)' : 'none',
        borderRadius: 0,
      }}
    />
  );
}
