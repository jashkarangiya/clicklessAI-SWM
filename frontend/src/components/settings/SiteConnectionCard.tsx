'use client';
/**
 * ClickLess AI – Site Connection Card
 * Shows Amazon or Walmart connection status with connect/disconnect actions.
 */
import { Box, Text, Button, Group, Badge, Stack } from '@mantine/core';
import { IconPlugConnected, IconPlugConnectedX, IconRefresh } from '@tabler/icons-react';

type ConnectionStatus = 'connected' | 'disconnected' | 'expired';

interface AmazonSessionDetails {
  active: boolean;
  last_verified: string;
  browser_context_id: string;
}

interface SiteConnectionCardProps {
  site: 'Amazon' | 'Walmart';
  status: ConnectionStatus;
  sessionDetails?: AmazonSessionDetails | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

const STATUS_CONFIG: Record<ConnectionStatus, { color: string; bg: string; label: string }> = {
  connected:    { color: 'var(--cl-success)', bg: 'var(--cl-success-soft)', label: 'Connected' },
  disconnected: { color: 'var(--cl-text-muted)', bg: 'var(--cl-surface-alt)', label: 'Not connected' },
  expired:      { color: 'var(--cl-warning)', bg: 'var(--cl-warning-soft)', label: 'Session expired' },
};

const SITE_COLORS: Record<string, string> = {
  Amazon:  '#FF9900',
  Walmart: '#0071CE',
};

export function SiteConnectionCard({ site, status, sessionDetails, onConnect, onDisconnect }: SiteConnectionCardProps) {
  const cfg = STATUS_CONFIG[status];
  const siteColor = SITE_COLORS[site] ?? 'var(--cl-brand)';
  const isConnected = status === 'connected';

  return (
    <Box
      style={{
        backgroundColor: 'var(--cl-surface)',
        border: `1px solid ${isConnected ? cfg.color + '60' : 'var(--cl-border)'}`,
        borderRadius: 12,
        padding: '18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
      }}
      data-testid={`site-card-${site.toLowerCase()}`}
    >
      <Group gap="md" align="center" style={{ flex: 1 }}>
        <Box
          style={{
            width: 44, height: 44, borderRadius: '50%',
            backgroundColor: `${siteColor}20`,
            border: `1px solid ${siteColor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Text fw={800} size="sm" style={{ color: siteColor }}>{site[0]}</Text>
        </Box>
        <Stack gap={2} style={{ flex: 1, overflow: 'hidden' }}>
          <Group gap="xs">
            <Text fw={700} size="sm" style={{ color: 'var(--cl-text-primary)' }}>{site}</Text>
            <Badge
              size="xs"
              style={{
                backgroundColor: cfg.bg,
                color: cfg.color,
                border: `1px solid ${cfg.color}40`,
                fontWeight: 600,
              }}
            >
              {cfg.label}
            </Badge>
          </Group>
          {sessionDetails && isConnected && (
            <Text size="xs" style={{ color: 'var(--cl-text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              Context ID: {sessionDetails.browser_context_id} • Verified: {new Date(sessionDetails.last_verified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </Stack>
      </Group>

      <Group gap="xs">
        {status === 'connected' ? (
          <Button
            size="xs"
            variant="subtle"
            leftSection={<IconPlugConnectedX size={13} />}
            onClick={onDisconnect}
            style={{ color: 'var(--cl-error)', border: '1px solid var(--cl-border)' }}
          >
            Disconnect
          </Button>
        ) : (
          <Button
            size="xs"
            leftSection={status === 'expired' ? <IconRefresh size={13} /> : <IconPlugConnected size={13} />}
            onClick={onConnect}
            style={{
              background: 'linear-gradient(135deg, var(--cl-brand) 0%, var(--cl-brand-glow) 100%)',
              border: 'none', color: '#fff', fontWeight: 600,
            }}
          >
            {status === 'expired' ? 'Reconnect' : 'Connect'}
          </Button>
        )}
      </Group>
    </Box>
  );
}
