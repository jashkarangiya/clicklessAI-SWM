'use client';
/**
 * ClickLess AI – Context Panel
 *
 * Sticky right panel (340px) for desktop that shows:
 * - Active search criteria
 * - Connected retailers
 * - Shortlisted products
 * Collapses to a drawer on mobile.
 */
import { useState } from 'react';
import {
  Box, Text, Stack, Divider, Badge, Group, ActionIcon,
  Drawer, UnstyledButton,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
  IconFilter, IconPlugConnected, IconBookmark, IconChevronLeft,
  IconLayoutSidebarRight,
} from '@tabler/icons-react';
import { ShortlistPanel } from './ShortlistPanel';
import { useAppSelector } from '@/store/hooks';

interface ContextPanelProps {
  searchCriteria?: string;
}

export function ContextPanel({ searchCriteria }: ContextPanelProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const siteConns = useAppSelector((state) => state.session.siteConnections);

  const connectedCount = Object.values(siteConns).filter(s => s === 'connected').length;

  const panelContent = (
    <Stack gap="lg" style={{ height: '100%' }}>
      {/* Active criteria */}
      <Section title="Active Criteria" icon={<IconFilter size={14} />}>
        {searchCriteria ? (
          <Box
            style={{
              backgroundColor: 'var(--cl-brand-soft)',
              borderRadius: 12,
              padding: '10px 14px',
              border: '1px solid rgba(47, 99, 245, 0.1)',
            }}
          >
            <Text size="xs" style={{ color: 'var(--cl-brand)', lineHeight: 1.5 }}>
              {searchCriteria}
            </Text>
          </Box>
        ) : (
          <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>
            Start a search to see criteria here.
          </Text>
        )}
      </Section>

      <Divider color="var(--cl-border)" />

      {/* Retailer connections */}
      <Section title="Retailers" icon={<IconPlugConnected size={14} />}>
        <Stack gap={6}>
          <RetailerRow name="Amazon" status={siteConns.amazon} color="#FF9900" />
          <RetailerRow name="Walmart" status={siteConns.walmart} color="#0071CE" />
        </Stack>
        <Text size="xs" style={{ color: 'var(--cl-text-muted)', marginTop: 8 }}>
          {connectedCount > 0
            ? `${connectedCount} store${connectedCount > 1 ? 's' : ''} connected`
            : 'Connect a store in Settings'}
        </Text>
      </Section>

      <Divider color="var(--cl-border)" />

      {/* Shortlist */}
      <Section title="Shortlist" icon={<IconBookmark size={14} />}>
        <ShortlistPanel
          items={[]}
          onRemove={() => {}}
          onBuy={() => {}}
        />
      </Section>
    </Stack>
  );

  // Mobile: render as drawer
  if (isMobile) {
    return (
      <>
        <ActionIcon
          variant="subtle"
          onClick={open}
          style={{
            position: 'fixed', right: 16, bottom: 100,
            zIndex: 100,
            backgroundColor: 'var(--cl-surface)',
            border: '1px solid var(--cl-border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            width: 40, height: 40, borderRadius: 12,
          }}
          aria-label="Open context panel"
        >
          <IconLayoutSidebarRight size={18} style={{ color: 'var(--cl-text-secondary)' }} />
        </ActionIcon>

        <Drawer
          opened={opened}
          onClose={close}
          position="right"
          size={340}
          title="Context"
          styles={{
            header: {
              backgroundColor: 'var(--cl-surface)',
              borderBottom: '1px solid var(--cl-border)',
            },
            body: {
              backgroundColor: 'var(--cl-bg-subtle)',
              padding: '20px 16px',
            },
          }}
        >
          {panelContent}
        </Drawer>
      </>
    );
  }

  // Desktop: render as sticky sidebar
  return (
    <Box
      style={{
        width: 340,
        minWidth: 340,
        height: 'calc(100vh - 64px)',
        backgroundColor: 'var(--cl-bg-subtle)',
        borderLeft: '1px solid var(--cl-border)',
        overflowY: 'auto',
        padding: '24px 20px',
        flexShrink: 0,
      }}
    >
      {panelContent}
    </Box>
  );
}

// Section wrapper
function Section({
  title, icon, children,
}: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <Box>
      <Group gap={6} style={{ marginBottom: 10 }}>
        <span style={{ color: 'var(--cl-text-muted)', display: 'flex' }}>{icon}</span>
        <Text size="xs" fw={600} style={{ color: 'var(--cl-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </Text>
      </Group>
      {children}
    </Box>
  );
}

// Retailer row
function RetailerRow({ name, status, color }: { name: string; status: string; color: string }) {
  const isConnected = status === 'connected';
  return (
    <Box
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 10,
        backgroundColor: 'var(--cl-surface)',
        border: '1px solid var(--cl-border)',
      }}
    >
      <Box
        style={{
          width: 28, height: 28, borderRadius: 8,
          backgroundColor: `${color}10`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Text fw={800} style={{ fontSize: '0.7rem', color }}>{name[0]}</Text>
      </Box>
      <Text size="xs" fw={500} style={{ color: 'var(--cl-text-primary)', flex: 1 }}>{name}</Text>
      <Badge
        size="xs"
        radius={9999}
        style={{
          backgroundColor: isConnected ? 'var(--cl-success-soft)' : 'var(--cl-surface-raised)',
          color: isConnected ? 'var(--cl-success)' : 'var(--cl-text-muted)',
          border: 'none',
          fontWeight: 600,
          textTransform: 'none',
        }}
      >
        {isConnected ? 'Active' : 'Off'}
      </Badge>
    </Box>
  );
}
