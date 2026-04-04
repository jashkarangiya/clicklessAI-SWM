'use client';
/**
 * ClickLess AI – Connection Status Badge
 */
import { Badge, Tooltip } from '@mantine/core';
import { IconWifi, IconWifiOff, IconRefresh } from '@tabler/icons-react';
import { useAppSelector } from '@/store/hooks';

export function ConnectionStatusBadge() {
  const wsState = useAppSelector((state) => state.session.wsState);

  const config = {
    connected: { label: 'Connected', color: 'var(--cl-success)', icon: <IconWifi size={12} />, tooltip: 'Real-time connection active' },
    connecting: { label: 'Connecting', color: 'var(--cl-warning)', icon: <IconRefresh size={12} />, tooltip: 'Establishing connection...' },
    reconnecting: { label: 'Reconnecting', color: 'var(--cl-warning)', icon: <IconRefresh size={12} />, tooltip: 'Reconnecting to server...' },
    idle: { label: 'Offline', color: 'var(--cl-text-muted)', icon: <IconWifiOff size={12} />, tooltip: 'Not connected' },
    closed: { label: 'Disconnected', color: 'var(--cl-error)', icon: <IconWifiOff size={12} />, tooltip: 'Connection closed' },
  }[wsState];

  return (
    <Tooltip label={config.tooltip} withArrow>
      <Badge
        size="sm"
        radius="xl"
        leftSection={config.icon}
        style={{
          backgroundColor: `${config.color}20`,
          color: config.color,
          border: `1px solid ${config.color}40`,
          cursor: 'default',
          fontSize: '0.7rem',
          fontWeight: 600,
        }}
      >
        {config.label}
      </Badge>
    </Tooltip>
  );
}
