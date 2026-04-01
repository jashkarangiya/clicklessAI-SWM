'use client';
/**
 * ClickLess AI – Authenticated App Shell Layout
 *
 * Mantine AppShell with:
 * - Collapsible sidebar (desktop) / bottom nav (mobile TBD)
 * - Header with brand lockup, connection status, theme toggle, user menu
 * - Sidebar with nav links and new-chat action
 * - Session-aware user menu with logout
 */
import { useState } from 'react';
import {
  AppShell, Group, Text, ActionIcon, Button, Avatar,
  Menu, Divider, Box, Stack, Tooltip, UnstyledButton,
} from '@mantine/core';
import { useRouter, usePathname } from 'next/navigation';
import {
  IconMessageCircle, IconSettings, IconLogout,
  IconUser, IconMenu2, IconX, IconPlus,
} from '@tabler/icons-react';
import { BrandLockup } from '@/components/branding/BrandLockup';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { ConnectionStatusBadge } from '@/components/common/ConnectionStatusBadge';
import { useSessionStore } from '@/stores/sessionStore';
import { useChatStore } from '@/stores/chatStore';

const NAV_LINKS = [
  { href: '/app/chat',     label: 'Chat',     icon: <IconMessageCircle size={18} /> },
  { href: '/app/settings', label: 'Settings', icon: <IconSettings size={18} /> },
];

interface AppShellLayoutProps {
  children: React.ReactNode;
}

export function AppShellLayout({ children }: AppShellLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const user = useSessionStore((s) => s.user);
  const logout = useSessionStore((s) => s.logout);
  const clearHistory = useChatStore((s) => s.clearHistory);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleNewChat = () => {
    clearHistory();
    router.push('/app/chat');
  };

  return (
    <AppShell
      header={{ height: 80 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !navOpen } }}
      padding={0}
      styles={{
        root:   { backgroundColor: 'var(--cl-bg)' },
        header: {
          backgroundColor: 'var(--cl-surface)',
          borderBottom: '1px solid var(--cl-border)',
        },
        navbar: {
          backgroundColor: 'var(--cl-bg-subtle)',
          borderRight: '1px solid var(--cl-border)',
        },
        main: {
          backgroundColor: 'var(--cl-bg)',
        },
      }}
    >
      {/* ── Header ── */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            {/* Mobile menu toggle */}
            <ActionIcon
              variant="subtle"
              onClick={() => setNavOpen((o) => !o)}
              hiddenFrom="sm"
              aria-label="Toggle navigation"
              style={{ color: 'var(--cl-text-secondary)' }}
            >
              {navOpen ? <IconX size={20} /> : <IconMenu2 size={20} />}
            </ActionIcon>
            <BrandLockup size="lg" variant="horizontal" />
          </Group>

          <Group gap="sm">
            <ConnectionStatusBadge />
            <ThemeToggle />

            {/* User Menu */}
            <Menu withArrow position="bottom-end" shadow="lg">
              <Menu.Target>
                <Tooltip label={user?.name ?? 'Account'} withArrow>
                  <ActionIcon
                    variant="subtle"
                    size="lg"
                    aria-label="User menu"
                    style={{
                      border: '1px solid var(--cl-border)',
                      borderRadius: '50%',
                      backgroundColor: 'var(--cl-surface)',
                    }}
                  >
                    <Avatar
                      size={28}
                      radius="xl"
                      color="brand"
                      style={{ backgroundColor: 'var(--cl-brand-soft)', color: 'var(--cl-brand)' }}
                    >
                      {user?.name?.[0]?.toUpperCase() ?? 'U'}
                    </Avatar>
                  </ActionIcon>
                </Tooltip>
              </Menu.Target>

              <Menu.Dropdown
                style={{
                  backgroundColor: 'var(--cl-surface-raised)',
                  border: '1px solid var(--cl-border)',
                  minWidth: 200,
                }}
              >
                <Menu.Label style={{ color: 'var(--cl-text-muted)' }}>
                  {user?.email ?? 'Account'}
                </Menu.Label>
                <Menu.Item leftSection={<IconUser size={14} />} onClick={() => router.push('/app/settings')}
                  style={{ color: 'var(--cl-text-primary)' }}>
                  Profile & Settings
                </Menu.Item>
                <Divider color="var(--cl-border)" my="xs" />
                <Menu.Item
                  leftSection={<IconLogout size={14} />}
                  onClick={handleLogout}
                  style={{ color: 'var(--cl-error)' }}
                >
                  Sign out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      {/* ── Sidebar ── */}
      <AppShell.Navbar p="md">
        <Stack gap="xs" justify="space-between" style={{ height: '100%' }}>
          <Stack gap="xs">
            <Button
              leftSection={<IconPlus size={16} />}
              variant="brand"
              onClick={handleNewChat}
              fullWidth
              size="sm"
              id="new-chat-btn"
              style={{
                background: 'linear-gradient(135deg, var(--cl-brand) 0%, var(--cl-brand-glow) 100%)',
                border: 'none',
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              New Chat
            </Button>

            {NAV_LINKS.map((link) => (
              <NavItem
                key={link.href}
                href={link.href}
                label={link.label}
                icon={link.icon}
                active={pathname.startsWith(link.href)}
                onClick={() => router.push(link.href)}
              />
            ))}
          </Stack>

          {/* Bottom: user info */}
          <Box
            style={{
              borderTop: '1px solid var(--cl-border)',
              paddingTop: 12,
            }}
          >
            <Group gap="sm">
              <Avatar
                size={32} radius="xl"
                style={{ backgroundColor: 'var(--cl-brand-soft)', color: 'var(--cl-brand)', fontSize: 14, fontWeight: 600 }}
              >
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </Avatar>
              <Box style={{ overflow: 'hidden' }}>
                <Text size="sm" fw={600} style={{ color: 'var(--cl-text-primary)', lineHeight: 1.2 }}>
                  {user?.name ?? 'User'}
                </Text>
                <Text size="xs" style={{ color: 'var(--cl-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email}
                </Text>
              </Box>
            </Group>
          </Box>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

interface NavItemProps {
  href: string; label: string; icon: React.ReactNode; active: boolean; onClick: () => void;
}

function NavItem({ label, icon, active, onClick }: NavItemProps) {
  return (
    <UnstyledButton
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 8,
        backgroundColor: active ? 'var(--cl-brand-soft)' : 'transparent',
        border: active ? '1px solid var(--cl-border-strong)' : '1px solid transparent',
        color: active ? 'var(--cl-brand)' : 'var(--cl-text-secondary)',
        fontWeight: active ? 600 : 400,
        transition: 'all 0.15s ease',
        cursor: 'pointer',
      }}
      aria-current={active ? 'page' : undefined}
    >
      {icon}
      <Text size="sm" style={{ color: 'inherit', fontWeight: 'inherit' }}>{label}</Text>
    </UnstyledButton>
  );
}
