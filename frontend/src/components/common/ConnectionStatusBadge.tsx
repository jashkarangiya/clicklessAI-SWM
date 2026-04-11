'use client';
/**
 * ClickLess AI – Connection Status Badge
 *
 * Contextual, not alarming. Shows connection state as a calm status pill.
 * Only uses red for actual failures needing intervention.
 */
import { Badge, Tooltip } from '@mantine/core';
import { IconWifi, IconWifiOff, IconRefresh } from '@tabler/icons-react';
import { useAppSelector } from '@/store/hooks';

export function ConnectionStatusBadge() {
  const wsState = useAppSelector((state) => state.session.wsState);

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
    idle: {
      label: 'Offline',
      bg: 'var(--cl-surface-raised)', color: 'var(--cl-text-muted)',
      icon: <IconWifiOff size={12} />, tooltip: 'Not connected',
    },
    closed: {
      label: 'Offline',
      bg: 'var(--cl-surface-raised)', color: 'var(--cl-text-muted)',
      icon: <IconWifiOff size={12} />, tooltip: 'Connection closed — will reconnect automatically',
    },
  }[wsState];

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
