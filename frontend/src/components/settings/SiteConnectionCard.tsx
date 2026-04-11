'use client';
/**
 * ClickLess AI – Site Connection Card
 *
 * Premium integration-style card for Amazon/Walmart connections.
 * Shows status, permissions, session details in a trust-building layout.
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
  disconnected: { color: 'var(--cl-text-muted)', bg: 'var(--cl-surface-raised)', label: 'Not connected' },
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
        border: '1px solid var(--cl-border)',
        borderRadius: 20,
        padding: '24px',
      }}
      data-testid={`site-card-${site.toLowerCase()}`}
    >
      <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <Group gap="md" align="flex-start" style={{ flex: 1 }}>
          <Box
            style={{
              width: 48, height: 48, borderRadius: 14,
              backgroundColor: `${siteColor}10`,
              border: `1px solid ${siteColor}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Text fw={800} size="md" style={{ color: siteColor }}>{site[0]}</Text>
          </Box>
          <Stack gap={6} style={{ flex: 1 }}>
            <Group gap="sm">
              <Text fw={700} size="md" style={{ color: 'var(--cl-text-primary)' }}>{site}</Text>
              <Badge
                size="sm"
                radius={9999}
                style={{
                  backgroundColor: cfg.bg,
                  color: cfg.color,
                  border: 'none',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                {cfg.label}
              </Badge>
            </Group>

            {/* Session details */}
            {sessionDetails && isConnected && (
              <Stack gap={2}>
                <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>
                  Context: {sessionDetails.browser_context_id}
                </Text>
                <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>
                  Last verified: {new Date(sessionDetails.last_verified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </Stack>
            )}

            {/* Permissions info */}
            {isConnected && (
              <Text size="xs" style={{ color: 'var(--cl-text-secondary)', marginTop: 2 }}>
                Search, compare, and checkout — approval required for purchases
              </Text>
            )}
          </Stack>
        </Group>

        {/* Actions */}
        <Group gap="xs">
          {status === 'connected' ? (
            <Button
              size="xs"
              variant="subtle"
              leftSection={<IconPlugConnectedX size={13} />}
              onClick={onDisconnect}
              radius={9999}
              style={{
                color: 'var(--cl-text-muted)',
                border: '1px solid var(--cl-border)',
                backgroundColor: 'var(--cl-surface)',
              }}
            >
              Disconnect
            </Button>
          ) : (
            <Button
              size="xs"
              leftSection={status === 'expired' ? <IconRefresh size={13} /> : <IconPlugConnected size={13} />}
              onClick={onConnect}
              radius={9999}
              variant="brand"
              style={{ fontWeight: 600 }}
            >
              {status === 'expired' ? 'Reconnect' : 'Connect'}
            </Button>
          )}
        </Group>
      </Box>
    </Box>
  );
}
