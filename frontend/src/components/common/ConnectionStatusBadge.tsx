'use client';
/**
 * ClickLess AI – Connection Status Badge
 *
 * Contextual, not alarming. Shows connection state as a calm status pill.
 * Only uses red for actual failures needing intervention.
 */
import { Badge, Tooltip } from '@mantine/core';
import { IconWifi, IconRefresh } from '@tabler/icons-react';
import { useAppSelector } from '@/store/hooks';

export function ConnectionStatusBadge() {
  const wsState = useAppSelector((state) => state.session.wsState);

  // Don't alarm users on first load — only show when there's something actionable
  if (wsState === 'idle' || wsState === 'closed') return null;

  const config = {
    connected: {
      label: '1 store connected',
      bg: 'var(--cl-success-soft)', color: 'var(--cl-success)',
      icon: <IconWifi size={12} />, tooltip: 'Real-time connection active',
    },
    connecting: {
      label: 'Connecting…',
      bg: 'var(--cl-warning-soft)', color: 'var(--cl-warning)',
      icon: <IconRefresh size={12} />, tooltip: 'Establishing connection...',
    },
    reconnecting: {
      label: 'Reconnecting…',
      bg: 'var(--cl-warning-soft)', color: 'var(--cl-warning)',
      icon: <IconRefresh size={12} />, tooltip: 'Reconnecting to server...',
    },
  }[wsState];

  if (!config) return null;

  return (
    <Tooltip label={config.tooltip} withArrow>
      <Badge
        size="sm"
        radius={9999}
        leftSection={config.icon}
        style={{
          backgroundColor: config.bg,
          color: config.color,
          border: 'none',
          cursor: 'default',
          fontSize: '0.7rem',
          fontWeight: 500,
          textTransform: 'none',
        }}
      >
        {config.label}
      </Badge>
    </Tooltip>
  );
}
