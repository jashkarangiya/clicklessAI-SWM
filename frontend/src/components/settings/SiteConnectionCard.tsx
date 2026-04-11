'use client';
/**
 * ClickLess AI – Site Connection Card
 *
 * Retailer connection card with real brand logos, dot-status badges,
 * and a clean connect / disconnect action.
 */
import { Box, Text, Button, Group, Stack } from '@mantine/core';
import { IconPlugConnected, IconPlugConnectedX, IconRefresh } from '@tabler/icons-react';

type ConnectionStatus = 'connected' | 'disconnected' | 'expired';

interface AmazonSessionDetails {
  active: boolean;
  last_verified: string;
  browser_context_id: string;
}

interface SiteConnectionCardProps {
  site:           'Amazon' | 'Walmart';
  status:         ConnectionStatus;
  sessionDetails?: AmazonSessionDetails | null;
  onConnect:      () => void;
  onDisconnect:   () => void;
}

// ── Status dot config ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ConnectionStatus, { dotColor: string; label: string; textColor: string; bgColor: string }> = {
  connected:    { dotColor: 'var(--cl-success)',    label: 'Connected',      textColor: 'var(--cl-success)',    bgColor: 'var(--cl-success-soft)' },
  disconnected: { dotColor: '#CBD5E1',              label: 'Not connected',  textColor: 'var(--cl-text-muted)', bgColor: 'var(--cl-surface-raised)' },
  expired:      { dotColor: 'var(--cl-warning)',    label: 'Session expired', textColor: 'var(--cl-warning)',   bgColor: 'var(--cl-warning-soft)' },
};

// ── Brand logos ──────────────────────────────────────────────────────────────

function AmazonLogo() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="13" fill="#FF9900" />
      {/* Amazon wordmark — simplified inline text path */}
      <text
        x="24" y="22"
        textAnchor="middle"
        fill="#131921"
        fontSize="9.5"
        fontWeight="800"
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="-0.2"
      >
        amazon
      </text>
      {/* Smile arrow */}
      <path
        d="M14 29 C18 34 30 34 34 29"
        stroke="#131921"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrowhead */}
      <path
        d="M31.5 27.5 L34 29 L31.5 31"
        stroke="#131921"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function WalmartLogo() {
  // Walmart's 6-petal spark, each petal is a rounded ellipse rotated around center
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="13" fill="#0071CE" />
      <g transform="translate(24,24)">
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <ellipse
            key={deg}
            cx="0"
            cy="-8.5"
            rx="2.8"
            ry="6"
            fill="white"
            transform={`rotate(${deg})`}
          />
        ))}
      </g>
    </svg>
  );
}

const SITE_LOGOS: Record<string, React.ReactNode> = {
  Amazon:  <AmazonLogo />,
  Walmart: <WalmartLogo />,
};

// ── Component ────────────────────────────────────────────────────────────────

export function SiteConnectionCard({
  site, status, sessionDetails, onConnect, onDisconnect,
}: SiteConnectionCardProps) {
  const cfg         = STATUS_CONFIG[status];
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

          {/* Brand logo */}
          <Box style={{ flexShrink: 0 }}>
            {SITE_LOGOS[site]}
          </Box>

          <Stack gap={6} style={{ flex: 1 }}>
            {/* Name + dot badge */}
            <Group gap="sm" align="center">
              <Text fw={700} size="md" style={{ color: 'var(--cl-text-primary)' }}>{site}</Text>

              {/* Dot-style status badge */}
              <Box
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: cfg.bgColor,
                  borderRadius: 9999,
                  padding: '3px 9px',
                }}
              >
                <Box
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: cfg.dotColor,
                    flexShrink: 0,
                  }}
                />
                <Text size="xs" style={{ color: cfg.textColor, fontWeight: 600, fontSize: '0.72rem' }}>
                  {cfg.label}
                </Text>
              </Box>
            </Group>

            {/* Session details */}
            {sessionDetails && isConnected && (
              <Stack gap={2}>
                <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>
                  Context: {sessionDetails.browser_context_id}
                </Text>
                <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>
                  Last verified:{' '}
                  {new Date(sessionDetails.last_verified).toLocaleTimeString([], {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </Stack>
            )}

            {/* Permissions */}
            {isConnected && (
              <Text size="xs" style={{ color: 'var(--cl-text-secondary)', marginTop: 2 }}>
                Search, compare, and checkout — approval required for purchases
              </Text>
            )}
          </Stack>
        </Group>

        {/* Action button */}
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
