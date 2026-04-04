'use client';
/**
 * ClickLess AI – Settings Page
 *
 * Tabs: Connections | Preferences | History | Danger Zone
 */
import {
  Box, Tabs, Text, Stack, Divider, Button, Group,
  Badge, Slider, Switch, TagsInput, NumberInput, Select,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  IconPlugConnected, IconAdjustments, IconHistory, IconAlertTriangle,
} from '@tabler/icons-react';
import { SiteConnectionCard } from '@/components/settings/SiteConnectionCard';
import { PurchaseHistoryList } from '@/components/settings/PurchaseHistoryList';
import { AmazonConnectionModal } from '@/components/settings/AmazonConnectionModal';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSiteConnections, setAmazonSessionDetails } from '@/store/slices/sessionSlice';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useChatStore } from '@/stores/chatStore';
import { MOCK_ORDERS, MOCK_PREFERENCES } from '@/lib/mocks/fixtures';
import { useState } from 'react';

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const siteConns = useAppSelector((state) => state.session.siteConnections);
  const amazonSessionDetails = useAppSelector((state) => state.session.amazonSessionDetails);

  const [amazonModalOpen, setAmazonModalOpen] = useState(false);
  const preferences = usePreferencesStore((s) => s.preferences);
  const setExplicit = usePreferencesStore((s) => s.setExplicit);
  const resetPrefs = usePreferencesStore((s) => s.reset);
  const clearHistory = useChatStore((s) => s.clearHistory);

  // Use mock preferences as display fallback
  const displayPrefs = preferences.explicit?.preferred_brands?.length
    ? preferences
    : MOCK_PREFERENCES;
  const exp = displayPrefs.explicit!;
  const imp = displayPrefs.implicit!;
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
        height: 'calc(100vh - 80px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        maxWidth: 720,
        margin: '0 auto',
        overflow: 'hidden',
      }}
    >
      <Stack gap="sm" style={{ marginBottom: 24 }}>
        <Text component="h1" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--cl-text-primary)', margin: 0 }}>
          Settings
        </Text>
        <Text size="sm" style={{ color: 'var(--cl-text-secondary)' }}>
          Manage your connections, preferences, and account.
        </Text>
      </Stack>

      <Tabs defaultValue="connections"
        color="brand"
        style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
        styles={{
          list: { borderBottomColor: 'var(--cl-border)', flexShrink: 0, marginBottom: 24 },
          panel: { overflowY: 'auto', flex: 1, paddingBottom: 40, paddingRight: 8 }
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="connections" leftSection={<IconPlugConnected size={15} />}>Connections</Tabs.Tab>
          <Tabs.Tab value="preferences" leftSection={<IconAdjustments size={15} />}>Preferences</Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<IconHistory size={15} />}>History</Tabs.Tab>
          <Tabs.Tab value="danger" leftSection={<IconAlertTriangle size={15} />}>Danger Zone</Tabs.Tab>
        </Tabs.List>

        {/* ── Connections ── */}
        <Tabs.Panel value="connections" pt="md">
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
            <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>
              Connecting your accounts allows ClickLess AI to search and checkout on your behalf.
              Your credentials are never stored — only session tokens are used.
            </Text>
          </Stack>
        </Tabs.Panel>

        {/* ── Preferences ── */}
        <Tabs.Panel value="preferences" pt="lg">
          <Stack gap={40}>
            {/* Explicit preferences */}
            <Box>
              <Text fw={600} size="sm" style={{ color: 'var(--cl-text-primary)', marginBottom: 20 }}>Explicit Preferences</Text>
              <Stack gap="lg">
                <TagsInput
                  label="Preferred brands"
                  placeholder="Type and press Enter…"
                  data={exp.preferred_brands}
                  value={exp.preferred_brands}
                  onChange={(v) => setExplicit({ preferred_brands: v })}
                  styles={{ input: { backgroundColor: 'var(--cl-surface)', borderColor: 'var(--cl-border)' } }}
                />
                <TagsInput
                  label="Avoided brands"
                  placeholder="Type and press Enter…"
                  data={exp.avoided_brands}
                  value={exp.avoided_brands}
                  onChange={(v) => setExplicit({ avoided_brands: v })}
                  styles={{ input: { backgroundColor: 'var(--cl-surface)', borderColor: 'var(--cl-border)' } }}
                />
                <NumberInput
                  label="Default budget ($)"
                  placeholder="e.g. 300"
                  value={exp.budget_default ?? ''}
                  onChange={(v) => setExplicit({ budget_default: typeof v === 'number' ? v : undefined })}
                  min={0}
                  prefix="$"
                  styles={{ input: { backgroundColor: 'var(--cl-surface)', borderColor: 'var(--cl-border)' } }}
                />
                <Select
                  label="Delivery priority"
                  data={[
                    { value: 'standard', label: 'Standard' },
                    { value: 'fast', label: 'Fast (2-day)' },
                    { value: 'fastest', label: 'Fastest available' },
                  ]}
                  value={exp.delivery_priority ?? null}
                  onChange={(v) => setExplicit({ delivery_priority: v as 'standard' | 'fast' | 'fastest' })}
                  styles={{ input: { backgroundColor: 'var(--cl-surface)', borderColor: 'var(--cl-border)' } }}
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

            {/* Implicit insights (read-only) */}
            <Box>
              <Text fw={600} size="sm" style={{ color: 'var(--cl-text-primary)', marginBottom: 4 }}>Learned Insights</Text>
              <Text size="xs" style={{ color: 'var(--cl-text-muted)', marginBottom: 12 }}>
                Read-only — updated automatically based on your patterns.
              </Text>
              <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { label: 'Price sensitivity', value: imp.price_sensitivity },
                  { label: 'Min rating', value: imp.rating_threshold ? `${imp.rating_threshold}★` : undefined },
                  { label: 'Decision speed', value: imp.decision_speed },
                  { label: 'Comparison depth', value: imp.comparison_depth },
                ].filter((i) => i.value).map((i) => (
                  <Box key={i.label} style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'var(--cl-surface-alt)', border: '1px solid var(--cl-border)', borderRadius: 20, padding: '4px 12px' }}>
                    <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>{i.label}:</Text>
                    <Text size="xs" fw={600} style={{ color: 'var(--cl-text-primary)' }}>{i.value}</Text>
                  </Box>
                ))}
              </Box>
            </Box>

            <Divider color="var(--cl-border)" />

            {/* Scoring weights */}
            <Box>
              <Text fw={600} size="sm" style={{ color: 'var(--cl-text-primary)', marginBottom: 20 }}>Scoring Weights</Text>
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
                    <Slider
                      value={weights[key] * 100}
                      min={0} max={100} step={5}
                      disabled
                      size="xs"
                      color="brand"
                      styles={{ track: { backgroundColor: 'var(--cl-border)' } }}
                    />
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Tabs.Panel>

        {/* ── History ── */}
        <Tabs.Panel value="history" pt="md">
          <PurchaseHistoryList orders={MOCK_ORDERS} />
        </Tabs.Panel>

        {/* ── Danger Zone ── */}
        <Tabs.Panel value="danger" pt="md">
          <Stack gap="md">
            <Box
              style={{
                backgroundColor: 'var(--cl-error-soft)',
                border: '1px solid var(--cl-error)',
                borderRadius: 12,
                padding: '20px',
              }}
            >
              <Text fw={700} size="sm" style={{ color: 'var(--cl-error)', marginBottom: 16 }}>
                ⚠ Destructive Actions
              </Text>
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <Box>
                    <Text size="sm" fw={600} style={{ color: 'var(--cl-text-primary)' }}>Clear chat history</Text>
                    <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>Removes all messages from your current session.</Text>
                  </Box>
                  <Button size="xs" onClick={handleClearHistory} style={{ backgroundColor: 'var(--cl-error-soft)', color: 'var(--cl-error)', border: '1px solid var(--cl-error)', flexShrink: 0 }}>
                    Clear history
                  </Button>
                </Group>
                <Divider color="var(--cl-border)" />
                <Group justify="space-between" align="flex-start">
                  <Box>
                    <Text size="sm" fw={600} style={{ color: 'var(--cl-text-primary)' }}>Reset preferences</Text>
                    <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>Resets all your learned and explicit preferences to defaults.</Text>
                  </Box>
                  <Button size="xs" onClick={handleResetPrefs} style={{ backgroundColor: 'var(--cl-error-soft)', color: 'var(--cl-error)', border: '1px solid var(--cl-error)', flexShrink: 0 }}>
                    Reset preferences
                  </Button>
                </Group>
              </Stack>
            </Box>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <AmazonConnectionModal
        opened={amazonModalOpen}
        onClose={() => setAmazonModalOpen(false)}
        onSuccess={handleAmazonSuccess}
      />
    </Box>
  );
}
