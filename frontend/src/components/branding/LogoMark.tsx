'use client';
/**
 * ClickLess AI – LogoMark (Raster Image)
 *
 * Uses the user-provided 3D rendered logos.
 */
import Image from 'next/image';
import { useMantineColorScheme } from '@mantine/core';
import { useEffect, useState } from 'react';

interface LogoMarkProps {
  size?: number;
  color?: string; // Kept for backwards compatibility, but not used by raster images
  className?: string;
  animated?: boolean; // Kept for backwards compatibility
}

export function LogoMark({ size = 32, className, animated = true }: LogoMarkProps) {
  const { colorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Default to light theme logo to match light-first design, then switch once mounted if needed
  const isDark = mounted && colorScheme === 'dark';
  
  // logo_black.png for dark backgrounds, logo_white.png for light backgrounds
  const logoSrc = isDark ? '/logo_black.png' : '/logo_white.png';

  return (
    <Image
      src={logoSrc}
      alt="ClickLess AI Logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', borderRadius: '8px' }}
      priority
    />
  );
}
