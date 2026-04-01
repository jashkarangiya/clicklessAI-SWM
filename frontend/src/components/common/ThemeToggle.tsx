'use client';
/**
 * ClickLess AI – ThemeToggle
 */
import { ActionIcon, Tooltip } from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoonStars } from '@tabler/icons-react';

interface ThemeToggleProps {
  size?: number;
}

export function ThemeToggle({ size = 20 }: ThemeToggleProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tooltip label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} withArrow>
      <ActionIcon
        onClick={toggleColorScheme}
        variant="subtle"
        color="gray"
        size="lg"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          color: 'var(--cl-text-secondary)',
          border: '1px solid var(--cl-border)',
          borderRadius: 'var(--mantine-radius-md)',
          backgroundColor: 'var(--cl-surface)',
          transition: 'all 0.2s ease',
        }}
      >
        {isDark
          ? <IconSun size={size} />
          : <IconMoonStars size={size} />
        }
      </ActionIcon>
    </Tooltip>
  );
}
