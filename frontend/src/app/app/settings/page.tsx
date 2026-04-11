'use client';
/**
 * ClickLess AI – Settings Page
 *
 * Vertical tab layout: Connections | Preferences | Activity | Security
 * Active tab: white pill + teal left-border accent (VS Code / Notion style)
 */
import { useState } from 'react';
import {
  Box, Text, Stack, Divider, Button, Group,
  Badge, Slider, Switch, TagsInput, NumberInput, Select, UnstyledButton,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  IconPlugConnected, IconAdjustments, IconHistory, IconShieldLock,
} from '@tabler/icons-react';
import { SiteConnectionCard } from '@/components/settings/SiteConnectionCard';
import { PurchaseHistoryList } from '@/components/settings/PurchaseHistoryList';
import { AmazonConnectionModal } from '@/components/settings/AmazonConnectionModal';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSiteConnections, setAmazonSessionDetails } from '@/store/slices/sessionSlice';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useChatStore } from '@/stores/chatStore';
import { MOCK_ORDERS, MOCK_PREFERENCES } from '@/lib/mocks/fixtures';

const TABS = [
  { value: 'connections', label: 'Connections', icon: <IconPlugConnected size={16} /> },
  { value: 'preferences', label: 'Preferences', icon: <IconAdjustments size={16} /> },
  { value: 'activity',    label: 'Activity',    icon: <IconHistory size={16} /> },
  { value: 'security',    label: 'Security',    icon: <IconShieldLock size={16} /> },
];

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const siteConns = useAppSelector((state) => state.session.siteConnections);
  const amazonSessionDetails = useAppSelector((state) => state.session.amazonSessionDetails);

  const [activeTab, setActiveTab] = useState('connections');
  const [amazonModalOpen, setAmazonModalOpen] = useState(false);
  const preferences = usePreferencesStore((s) => s.preferences);
  const setExplicit = usePreferencesStore((s) => s.setExplicit);
  const resetPrefs  = usePreferencesStore((s) => s.reset);
  const clearHistory = useChatStore((s) => s.clearHistory);

  const displayPrefs = preferences.explicit?.preferred_brands?.length
    ? preferences : MOCK_PREFERENCES;
  const exp     = displayPrefs.explicit!;
  const imp     = displayPrefs.implicit!;
  const weights = displayPrefs.weights!;

  const handleConnect = (site: 'amazon' | 'walmart') => {
    if (site === 'amazon') {
      setAmazonModalOpen(true);
    } else {
      notifications.show({ title: 'TODO', message: `Connect to ${site} — implement OAuth flow here.`, color: 'yellow' });
    }
  };

  const handleDisconnect = (site: 'amazon' | 'walmart') => {
    dispatch(setSiteConnections({ ...siteConns, [site]: 'disconnected' }));
    if (site === 'amazon') dispatch(setAmazonSessionDetails(null));
    notifications.show({ title: 'Disconnected', message: `${site} session removed.` });
  };

  const handleAmazonSuccess = (details: any) => {
    dispatch(setAmazonSessionDetails(details));
    dispatch(setSiteConnections({ ...siteConns, amazon: 'connected' }));
    setAmazonModalOpen(false);
    notifications.show({ title: 'Amazon Connected', message: 'Your secure session is active.', color: 'green' });
  };

  const handleClearHistory = () => {
    modals.openConfirmModal({
      title: 'Clear chat history?',
      children: <Text size="sm" mt="md">This will remove all messages from your current session. This cannot be undone.</Text>,
      labels: { confirm: 'Clear history', cancel: 'Cancel' },
      confirmProps: { color: 'red', style: { background: 'var(--cl-error)' } },
      onConfirm: () => { clearHistory(); notifications.show({ title: 'Cleared', message: 'Chat history removed.' }); },
    });
  };

  const handleResetPrefs = () => {
    modals.openConfirmModal({
      title: 'Reset preferences?',
      children: <Text size="sm" mt="md">This will reset all your preferences and learned insights to defaults.</Text>,
      labels: { confirm: 'Reset', cancel: 'Cancel' },
      confirmProps: { color: 'red', style: { background: 'var(--cl-error)' } },
      onConfirm: () => { resetPrefs(); notifications.show({ title: 'Reset', message: 'Preferences reset to defaults.' }); },
    });
  };

  return (
    <Box
      style={{
        height: 'calc(100vh - 52px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 36px',
        maxWidth: 900,
        margin: '0 auto',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {/* Page header */}
      <Stack gap={4} style={{ marginBottom: 28 }}>
        <Text
          component="h1"
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--cl-text-primary)',
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Settings
        </Text>
        <Text size="sm" style={{ color: 'var(--cl-text-secondary)' }}>
          Manage your connections, preferences, and account.
        </Text>
      </Stack>

      {/* Two-column layout: vertical tabs + content */}
      <Box style={{ display: 'flex', flex: 1, gap: 0, overflow: 'hidden' }}>

        {/* Vertical tab list */}
        <Box style={{ width: 172, flexShrink: 0, paddingRight: 8, paddingTop: 2 }}>
          <Stack gap={2}>
            {TABS.map((tab) => (
              <VerticalTabItem
                key={tab.value}
                label={tab.label}
                icon={tab.icon}
                active={activeTab === tab.value}
                onClick={() => setActiveTab(tab.value)}
              />
            ))}
          </Stack>
        </Box>

        {/* Vertical divider */}
        <Box
          style={{
            width: 1,
            backgroundColor: 'var(--cl-border)',
            flexShrink: 0,
            marginRight: 32,
            borderRadius: 1,
          }}
        />

        {/* Tab content panel */}
        <Box style={{ flex: 1, overflowY: 'auto', paddingBottom: 40 }}>

          {/* ── Connections ── */}
          {activeTab === 'connections' && (
            <Stack gap="md">
              <SiteConnectionCard
                site="Amazon"
                status={siteConns.amazon}
                sessionDetails={amazonSessionDetails}
                onConnect={() => handleConnect('amazon')}
                onDisconnect={() => handleDisconnect('amazon')}
              />
              <SiteConnectionCard
                site="Walmart"
                status={siteConns.walmart}
                onConnect={() => handleConnect('walmart')}
                onDisconnect={() => handleDisconnect('walmart')}
              />

              {/* Info box — light grey background + teal left border */}
              <Box
                style={{
                  backgroundColor: '#F8F9FA',
                  borderRadius: 14,
                  padding: '14px 18px',
                  borderLeft: '3px solid var(--cl-brand)',
                }}
              >
                <Text size="sm" fw={600} style={{ color: 'var(--cl-text-primary)', marginBottom: 4 }}>
                  How connections work
                </Text>
                <Text size="xs" style={{ color: 'var(--cl-text-secondary)', lineHeight: 1.65 }}>
                  Connecting your accounts allows ClickLess AI to search and checkout on your behalf.
                  Your credentials are never stored — only secure session tokens are used.
                  Sessions expire automatically for your security.
                </Text>
              </Box>
            </Stack>
          )}

          {/* ── Preferences ── */}
          {activeTab === 'preferences' && (
            <Stack gap={40}>
              <Box>
                <Text fw={600} size="sm" style={{ color: 'var(--cl-text-primary)', marginBottom: 20 }}>
                  Your Preferences
                </Text>
                <Stack gap="lg">
                  <TagsInput
                    label="Preferred brands"
                    placeholder="Type and press Enter…"
                    data={exp.preferred_brands}
                    value={exp.preferred_brands}
                    onChange={(v) => setExplicit({ preferred_brands: v })}
                  />
                  <TagsInput
                    label="Avoided brands"
                    placeholder="Type and press Enter…"
                    data={exp.avoided_brands}
                    value={exp.avoided_brands}
                    onChange={(v) => setExplicit({ avoided_brands: v })}
                  />
                  <NumberInput
                    label="Default budget ($)"
                    placeholder="e.g. 300"
                    value={exp.budget_default ?? ''}
                    onChange={(v) => setExplicit({ budget_default: typeof v === 'number' ? v : undefined })}
                    min={0}
                    prefix="$"
                  />
                  <Select
                    label="Delivery priority"
                    data={[
                      { value: 'standard', label: 'Standard' },
                      { value: 'fast',     label: 'Fast (2-day)' },
                      { value: 'fastest',  label: 'Fastest available' },
                    ]}
                    value={exp.delivery_priority ?? null}
                    onChange={(v) => setExplicit({ delivery_priority: v as 'standard' | 'fast' | 'fastest' })}
                  />
                  <Switch
                    label="Prefer eco-friendly products"
                    checked={exp.eco_friendly ?? false}
                    onChange={(e) => setExplicit({ eco_friendly: e.currentTarget.checked })}
                    color="brand"
                  />
                </Stack>
              </Box>

              <Divider color="var(--cl-border)" />

              <Box>
                <Text fw={600} size="sm" style={{ color: 'var(--cl-text-primary)', marginBottom: 4 }}>
                  Learned Insights
                </Text>
                <Text size="xs" style={{ color: 'var(--cl-text-muted)', marginBottom: 12 }}>
                  Automatically updated based on your shopping patterns.
                </Text>
                <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { label: 'Price sensitivity', value: imp.price_sensitivity },
                    { label: 'Min rating',        value: imp.rating_threshold ? `${imp.rating_threshold}★` : undefined },
                    { label: 'Decision speed',    value: imp.decision_speed },
                    { label: 'Comparison depth',  value: imp.comparison_depth },
                  ].filter((i) => i.value).map((i) => (
                    <Box
                      key={i.label}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        backgroundColor: 'var(--cl-surface)',
                        border: '1px solid var(--cl-border)',
                        borderRadius: 9999, padding: '6px 14px',
                      }}
                    >
                      <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>{i.label}:</Text>
                      <Text size="xs" fw={600} style={{ color: 'var(--cl-text-primary)' }}>{i.value}</Text>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Divider color="var(--cl-border)" />

              <Box>
                <Text fw={600} size="sm" style={{ color: 'var(--cl-text-primary)', marginBottom: 20 }}>
                  Scoring Weights
                </Text>
                <Stack gap="xl">
                  {(['price', 'rating', 'delivery', 'pref_match'] as const).map((key) => (
                    <Box key={key}>
                      <Group justify="space-between" style={{ marginBottom: 4 }}>
                        <Text size="xs" style={{ color: 'var(--cl-text-secondary)', textTransform: 'capitalize' }}>
                          {key === 'pref_match' ? 'Preference match' : key}
                        </Text>
                        <Text size="xs" fw={600} style={{ color: 'var(--cl-brand)' }}>
                          {(weights[key] * 100).toFixed(0)}%
                        </Text>
                      </Group>
                      <Slider value={weights[key] * 100} min={0} max={100} step={5} disabled size="xs" color="brand" />
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Stack>
          )}

          {/* ── Activity ── */}
          {activeTab === 'activity' && (
            <PurchaseHistoryList orders={MOCK_ORDERS} />
          )}

          {/* ── Security ── */}
          {activeTab === 'security' && (
            <Stack gap="lg">
              <Box
                style={{
                  backgroundColor: 'var(--cl-surface)',
                  border: '1px solid var(--cl-border)',
                  borderRadius: 20,
                  padding: '24px',
                }}
              >
                <Text fw={600} size="sm" style={{ color: 'var(--cl-text-primary)', marginBottom: 12 }}>
                  Security & Privacy
                </Text>
                <Stack gap="sm">
                  {[
                    'Your credentials are never stored by ClickLess',
                    'Session tokens expire automatically',
                    'Purchases always require your explicit confirmation',
                    'Real-time connection and order visibility',
                  ].map((item) => (
                    <Box key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Box style={{
                        width: 6, height: 6, borderRadius: '50%',
                        backgroundColor: 'var(--cl-success)', flexShrink: 0,
                      }} />
                      <Text size="sm" style={{ color: 'var(--cl-text-secondary)' }}>{item}</Text>
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Box
                style={{
                  backgroundColor: 'var(--cl-surface)',
                  border: '1px solid var(--cl-border)',
                  borderRadius: 20,
                  padding: '24px',
                }}
              >
                <Text fw={600} size="sm" style={{ color: 'var(--cl-text-primary)', marginBottom: 20 }}>
                  Account Actions
                </Text>
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start">
                    <Box>
                      <Text size="sm" fw={600} style={{ color: 'var(--cl-text-primary)' }}>Clear chat history</Text>
                      <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>Removes all messages from your current session.</Text>
                    </Box>
                    <Button size="xs" variant="outline" onClick={handleClearHistory} radius={9999}
                      style={{ flexShrink: 0, color: 'var(--cl-error)', borderColor: 'rgba(201,77,77,0.4)' }}>
                      Clear history
                    </Button>
                  </Group>
                  <Divider color="var(--cl-border)" />
                  <Group justify="space-between" align="flex-start">
                    <Box>
                      <Text size="sm" fw={600} style={{ color: 'var(--cl-text-primary)' }}>Reset preferences</Text>
                      <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>Resets all your learned and explicit preferences to defaults.</Text>
                    </Box>
                    <Button size="xs" variant="outline" onClick={handleResetPrefs} radius={9999}
                      style={{ flexShrink: 0, color: 'var(--cl-error)', borderColor: 'rgba(201,77,77,0.4)' }}>
                      Reset preferences
                    </Button>
                  </Group>
                </Stack>
              </Box>
            </Stack>
          )}
        </Box>
      </Box>

      <AmazonConnectionModal
        opened={amazonModalOpen}
        onClose={() => setAmazonModalOpen(false)}
        onSuccess={handleAmazonSuccess}
      />
    </Box>
  );
}

// ── Vertical Tab Item ─────────────────────────────────────────────────────────

function VerticalTabItem({
  label, icon, active, onClick,
}: {
  label: string; icon: React.ReactNode; active: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <UnstyledButton
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        padding: '9px 12px',
        borderRadius: 10,
        backgroundColor: active ? '#FFFFFF' : hovered ? 'var(--cl-surface)' : 'transparent',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)' : 'none',
        borderLeft: `3px solid ${active ? 'var(--cl-brand)' : 'transparent'}`,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color: active ? 'var(--cl-text-primary)' : hovered ? 'var(--cl-text-primary)' : 'var(--cl-text-secondary)',
        transition: 'all 0.14s ease',
        cursor: 'pointer',
      }}
    >
      <Box style={{ opacity: active ? 1 : 0.7, color: active ? 'var(--cl-brand)' : 'inherit', flexShrink: 0 }}>
        {icon}
      </Box>
      <Text size="sm" style={{ color: 'inherit', fontWeight: active ? 600 : 400 }}>
        {label}
      </Text>
    </UnstyledButton>
  );
}
