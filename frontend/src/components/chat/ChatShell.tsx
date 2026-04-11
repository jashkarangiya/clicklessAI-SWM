'use client';
/**
 * ClickLess AI – Authenticated App Shell Layout
 *
 * Light workspace shell with:
 * - Sidebar (264px): brand, new session, nav, conversation list, user
 * - Header: page title, contextual status, utilities
 * - Main content area on warm canvas
 */
import { useState } from 'react';
import {
  AppShell, Group, Text, ActionIcon, Button, Avatar,
  Menu, Divider, Box, Stack, Tooltip, UnstyledButton,
} from '@mantine/core';
import { useRouter, usePathname } from 'next/navigation';
import {
  IconMessageCircle, IconSettings, IconLogout,
  IconUser, IconMenu2, IconX, IconPlus, IconHistory,
  IconHelpCircle,
} from '@tabler/icons-react';
import { BrandLockup } from '@/components/branding/BrandLockup';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { ConnectionStatusBadge } from '@/components/common/ConnectionStatusBadge';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/sessionSlice';
import { useChatStore } from '@/stores/chatStore';

const NAV_LINKS = [
  { href: '/app/chat', label: 'Assistant', icon: <IconMessageCircle size={18} /> },
  { href: '/app/settings', label: 'Settings', icon: <IconSettings size={18} /> },
];

interface AppShellLayoutProps {
  children: React.ReactNode;
}

export function AppShellLayout({ children }: AppShellLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const [navOpen, setNavOpen] = useState(false);
  const user = useAppSelector((state) => state.session.user);
  const clearHistory = useChatStore((s) => s.clearHistory);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const handleNewChat = () => {
    clearHistory();
    router.push('/app/chat');
  };

  // Derive page title from path
  const pageTitle = pathname.includes('/settings') ? 'Settings' :
                    pathname.includes('/chat') ? 'Assistant' : 'ClickLess AI';

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 264, breakpoint: 'sm', collapsed: { mobile: !navOpen } }}
      padding={0}
      styles={{
        root: { backgroundColor: 'var(--cl-bg)' },
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
        <Group h="100%" px="lg" justify="space-between">
          <Group gap="md">
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
            <Text fw={600} size="md" style={{ color: 'var(--cl-text-primary)' }}>
              {pageTitle}
            </Text>
          </Group>

          <Group gap="sm">
            <ConnectionStatusBadge />
            <ThemeToggle />

            {/* User Menu */}
            <Menu withArrow position="bottom-end" shadow="md">
              <Menu.Target>
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
                    src={user?.image}
                    imageProps={{ referrerPolicy: 'no-referrer' }}
                    style={{ backgroundColor: 'var(--cl-brand-soft)', color: 'var(--cl-brand)' }}
                  >
                    {!user?.image && (user?.name?.[0]?.toUpperCase() ?? 'U')}
                  </Avatar>
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown
                style={{
                  backgroundColor: 'var(--cl-surface)',
                  border: '1px solid var(--cl-border)',
                  minWidth: 200,
                  borderRadius: 16,
                }}
              >
                <Menu.Label>
                  <Text size="sm" fw={600} style={{ color: 'var(--cl-text-primary)', marginBottom: 2 }}>
                    {user?.name ?? 'User'}
                  </Text>
                  <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>
                    {user?.email ?? 'Account'}
                  </Text>
                </Menu.Label>
                <Menu.Item leftSection={<IconUser size={14} />} onClick={() => router.push('/app/settings')}
                  style={{ color: 'var(--cl-text-primary)', borderRadius: 8 }}>
                  Profile & Settings
                </Menu.Item>
                <Divider color="var(--cl-border)" my="xs" />
                <Menu.Item
                  leftSection={<IconLogout size={14} />}
                  onClick={handleLogout}
                  style={{ color: 'var(--cl-error)', borderRadius: 8 }}
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
          <Stack gap="md">
            {/* Brand */}
            <Box style={{ paddingBottom: 4 }}>
              <BrandLockup size="md" variant="horizontal" />
            </Box>

            {/* New Session */}
            <Button
              leftSection={<IconPlus size={16} />}
              variant="brand"
              onClick={handleNewChat}
              fullWidth
              size="sm"
              id="new-chat-btn"
              style={{
                fontWeight: 600,
                height: 40,
              }}
            >
              New Session
            </Button>

            {/* Nav links */}
            <Stack gap={4}>
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
          </Stack>

          {/* Bottom: user info + help */}
          <Stack gap="sm">
            <UnstyledButton
              onClick={() => {}}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', borderRadius: 10,
                color: 'var(--cl-text-muted)', fontSize: '0.8rem',
              }}
            >
              <IconHelpCircle size={16} />
              <Text size="xs" style={{ color: 'inherit' }}>Help & Docs</Text>
            </UnstyledButton>

            <Box
              style={{
                borderTop: '1px solid var(--cl-border)',
                paddingTop: 12,
              }}
            >
              <Group gap="sm" wrap="nowrap">
                <Avatar
                  size={32} radius="xl"
                  src={user?.image}
                  imageProps={{ referrerPolicy: 'no-referrer' }}
                  style={{
                    backgroundColor: 'var(--cl-brand-soft)',
                    color: 'var(--cl-brand)',
                    fontSize: 13, fontWeight: 600, flexShrink: 0,
                    border: '1px solid var(--cl-border)',
                  }}
                >
                  {!user?.image && (user?.name?.[0]?.toUpperCase() ?? 'U')}
                </Avatar>
                <Box style={{ overflow: 'hidden', flex: 1 }}>
                  <Tooltip label={user?.name} position="top-start" openDelay={500}>
                    <Text size="sm" fw={600} style={{ color: 'var(--cl-text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.name ?? 'User'}
                    </Text>
                  </Tooltip>
                  {user?.email && (
                    <Tooltip label={user?.email} position="top-start" openDelay={500}>
                      <Text size="xs" style={{ color: 'var(--cl-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.email}
                      </Text>
                    </Tooltip>
                  )}
                </Box>
              </Group>
            </Box>
          </Stack>
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
  const [hovered, setHovered] = useState(false);
  return (
    <UnstyledButton
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 10,
        backgroundColor: active ? 'var(--cl-surface)' : hovered ? 'var(--cl-surface-raised)' : 'transparent',
        border: active ? '1px solid var(--cl-border)' : '1px solid transparent',
        boxShadow: active ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
        color: active ? 'var(--cl-text-primary)' : hovered ? 'var(--cl-text-primary)' : 'var(--cl-text-secondary)',
        fontWeight: active ? 600 : 500,
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
