'use client';
/**
 * ClickLess AI – Notifications / Activity Feed Page
 */
import { useState } from 'react';
import { Box, Stack, Text, Group, Button } from '@mantine/core';

// ── Types & data ──────────────────────────────────────────────────────────────

interface NotificationItem {
  id: string;
  emoji: string;
  title: string;
  body: string;
  timestamp: string;
  unread: boolean;
}

interface NotificationGroup {
  label: string;
  items: NotificationItem[];
}

const INITIAL_GROUPS: NotificationGroup[] = [
  {
    label: 'Today',
    items: [
      {
        id: 'n1',
        emoji: '🟢',
        title: 'Order delivered: Sony WH-1000XM5',
        body: 'Your order arrived today. Leave a review?',
        timestamp: '2 hours ago',
        unread: true,
      },
      {
        id: 'n2',
        emoji: '🔵',
        title: 'ClickLess saved you $120',
        body: 'We found the Sony XM5 30% off vs retail price.',
        timestamp: '3 hours ago',
        unread: true,
      },
    ],
  },
  {
    label: 'Yesterday',
    items: [
      {
        id: 'n3',
        emoji: '📦',
        title: 'Order shipped: Anker Power Bank',
        body: 'Estimated delivery tomorrow.',
        timestamp: '1 day ago',
        unread: true,
      },
      {
        id: 'n4',
        emoji: '🔗',
        title: 'Amazon connected',
        body: 'Your Amazon session is active and ready.',
        timestamp: '1 day ago',
        unread: false,
      },
    ],
  },
  {
    label: 'This week',
    items: [
      {
        id: 'n5',
        emoji: '🤖',
        title: 'New comparison ready',
        body: 'We ran a fresh comparison for robot vacuums. Prices have dropped.',
        timestamp: '3 days ago',
        unread: false,
      },
      {
        id: 'n6',
        emoji: '💡',
        title: "Tip: You can say 'reorder my last purchase'",
        body: "Try saying 'Reorder my last purchase from Amazon' and we'll handle it in seconds.",
        timestamp: '4 days ago',
        unread: false,
      },
    ],
  },
];

// ── Notification item component ───────────────────────────────────────────────

function NotifItem({ item }: { item: NotificationItem & { unread: boolean } }) {
  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 12,
        backgroundColor: item.unread ? 'var(--cl-brand-soft)' : 'var(--cl-surface)',
        border: `1px solid ${item.unread ? 'rgba(12,122,138,0.18)' : 'var(--cl-border)'}`,
        borderLeft: item.unread ? '3px solid var(--cl-brand)' : '1px solid var(--cl-border)',
        transition: 'background-color 0.15s ease',
      }}
    >
      <Text style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>
        {item.emoji}
      </Text>

      <Box style={{ flex: 1, minWidth: 0 }}>
        <Text fw={600} size="sm" style={{ color: 'var(--cl-text-primary)', lineHeight: 1.4 }}>
          {item.title}
        </Text>
        <Text size="xs" style={{ color: 'var(--cl-text-secondary)', marginTop: 2, lineHeight: 1.5 }}>
          {item.body}
        </Text>
      </Box>

      <Text
        size="xs"
        style={{ color: 'var(--cl-text-muted)', flexShrink: 0, whiteSpace: 'nowrap', marginTop: 2 }}
      >
        {item.timestamp}
      </Text>
    </Box>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [groups, setGroups] = useState<NotificationGroup[]>(INITIAL_GROUPS);

  function markAllRead() {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        items: g.items.map((item) => ({ ...item, unread: false })),
      })),
    );
  }

  const unreadCount = groups.reduce(
    (sum, g) => sum + g.items.filter((i) => i.unread).length,
    0,
  );

  return (
    <Box
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '28px 32px',
        height: 'calc(100vh - 52px)',
        overflowY: 'auto',
      }}
    >
      <Stack gap={24}>

        {/* Header row */}
        <Group justify="space-between" align="flex-start">
          <Box>
            <Text
              component="h1"
              fw={700}
              size="xl"
              style={{ color: 'var(--cl-text-primary)', margin: 0, lineHeight: 1.2 }}
            >
              Notifications
            </Text>
            <Text size="sm" style={{ color: 'var(--cl-text-muted)', marginTop: 4 }}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </Text>
          </Box>

          {unreadCount > 0 && (
            <Button
              variant="subtle"
              size="sm"
              onClick={markAllRead}
              style={{ color: 'var(--cl-brand)', fontWeight: 500 }}
            >
              Mark all read
            </Button>
          )}
        </Group>

        {/* Notification groups */}
        {groups.map((group) => (
          <Box key={group.label}>
            <Text
              size="xs"
              style={{
                color: 'var(--cl-text-muted)',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontSize: '0.62rem',
                marginBottom: 8,
              }}
            >
              {group.label}
            </Text>
            <Stack gap={8}>
              {group.items.map((item) => (
                <NotifItem key={item.id} item={item} />
              ))}
            </Stack>
          </Box>
        ))}

      </Stack>
    </Box>
  );
}
