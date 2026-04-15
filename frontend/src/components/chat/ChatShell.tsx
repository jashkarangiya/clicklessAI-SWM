'use client';
/**
 * ClickLess AI – Authenticated App Shell
 *
 * Sidebar features:
 * - Collapsible (64px icon-only ↔ 264px full) — persisted to localStorage
 * - Logo click → new session
 * - ⌘\ keyboard shortcut to toggle
 * - Session history with live search filter
 * - Notification badge on nav items
 * - Demo session loading on history click
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  AppShell, Group, Text, ActionIcon, Button, Avatar,
  Menu, Divider, Box, Stack, Tooltip, UnstyledButton, TextInput,
} from '@mantine/core';
import { useRouter, usePathname } from 'next/navigation';
import {
  IconSettings, IconLogout, IconUser, IconMenu2, IconX,
  IconPlus, IconHelpCircle, IconChevronUp,
  IconMessageCircle, IconPackage, IconBell,
  IconChevronsLeft, IconChevronsRight, IconSearch,
} from '@tabler/icons-react';
import { BrandLockup } from '@/components/branding/BrandLockup';
import { LogoMark } from '@/components/branding/LogoMark';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/sessionSlice';
import { useChatStore } from '@/stores/chatStore';
import { listChatSessions, getChatSession, type ChatSessionMeta } from '@/lib/api/chatHistoryService';
import type { FrontendChatMessage } from '@/contracts/chat';

// ── Route → page title map ────────────────────────────────────────────────────
const PAGE_TITLES: [string, string][] = [
  ['/app/account',       'Account'],
  ['/app/orders',        'Orders'],
  ['/app/notifications', 'Notifications'],
  ['/app/help',          'Help'],
  ['/app/settings',      'Settings'],
];

// ── Primary nav items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: '/app/chat',          icon: IconMessageCircle, label: 'Chat'          },
  { href: '/app/orders',        icon: IconPackage,       label: 'Orders'        },
  { href: '/app/notifications', icon: IconBell,          label: 'Notifications' },
];

// ── Layout component ──────────────────────────────────────────────────────────
interface AppShellLayoutProps { children: React.ReactNode }

export function AppShellLayout({ children }: AppShellLayoutProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const [navOpen,          setNavOpen]          = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadCount,      setUnreadCount]      = useState(0);
  const [historySearch,    setHistorySearch]    = useState('');

  const user         = useAppSelector((s) => s.session.user);
  const wsState      = useAppSelector((s) => s.session.wsState);
  const clearHistory = useChatStore((s) => s.clearHistory);
  const loadSession  = useChatStore((s) => s.loadSession);

  const [sessions,     setSessions]     = useState<ChatSessionMeta[]>([]);
  const fetchedRef = useRef(false);

  // ── Persist collapse state ──────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cl-sidebar-collapsed');
      if (saved !== null) setSidebarCollapsed(saved === 'true');
    } catch {}
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem('cl-sidebar-collapsed', String(next)); } catch {}
      return next;
    });
  }, []);

  // Clear unread badge when visiting notifications page
  useEffect(() => {
    if (pathname.startsWith('/app/notifications')) setUnreadCount(0);
  }, [pathname]);

  // ── Fetch session history from backend ─────────────────────────────────────
  useEffect(() => {
    if (!user?.id || fetchedRef.current) return;
    fetchedRef.current = true;
    listChatSessions(user.id).then(setSessions).catch(() => {});
  }, [user?.id]);

  // Re-fetch sessions after new chat (when we return to the sidebar)
  const refreshSessions = useCallback(() => {
    if (!user?.id) return;
    listChatSessions(user.id).then(setSessions).catch(() => {});
  }, [user?.id]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === '\\') { e.preventDefault(); toggleSidebar(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleSidebar]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleNewChat = useCallback(() => {
    clearHistory();
    router.push('/app/chat');
    // Refresh sidebar list after a short delay so the new session appears
    setTimeout(refreshSessions, 1500);
  }, [clearHistory, router, refreshSessions]);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const handleSessionClick = useCallback(async (sessionId: string) => {
    try {
      const messages = await getChatSession(sessionId);
      loadSession(sessionId, messages as FrontendChatMessage[]);
    } catch {
      // If load fails, just start fresh with that session ID
      clearHistory();
    }
    router.push('/app/chat');
  }, [loadSession, clearHistory, router]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const isOnChat  = pathname.startsWith('/app/chat');
  const pageTitle = PAGE_TITLES.find(([p]) => pathname.startsWith(p))?.[1] ?? 'ClickLess AI';

  const dotColour =
    wsState === 'connected'    ? 'var(--cl-success)' :
    wsState === 'connecting'   ? 'var(--cl-warning)'  :
    wsState === 'reconnecting' ? 'var(--cl-warning)'  :
    '#CBD5E1';

  // Group sessions by relative date bucket and filter by search term
  const filteredSessions = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    const list = q
      ? sessions.filter((s) => (s.title ?? '').toLowerCase().includes(q))
      : sessions;

    const now = Date.now();
    const DAY = 86_400_000;
    const result: Record<string, { id: string; label: string }[]> = {};

    for (const s of list) {
      const age = now - new Date(s.updated_at).getTime();
      const bucket =
        age < DAY       ? 'Today'
        : age < 2 * DAY ? 'Yesterday'
        : age < 7 * DAY ? 'This week'
        : age < 30 * DAY ? 'This month'
        : 'Older';
      (result[bucket] ??= []).push({ id: s.session_id, label: s.title ?? 'Untitled' });
    }
    return result;
  }, [sessions, historySearch]);

  // ── Shared user dropdown ────────────────────────────────────────────────────
  const userInitial = user?.name?.[0]?.toUpperCase() ?? 'U';

  const UserDropdown = ({ position }: { position: 'top-start' | 'right-start' }) => (
    <Menu position={position} withArrow arrowPosition="center" shadow="md" offset={8}>
      <Menu.Target>
        <UnstyledButton
          style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', cursor: 'pointer', borderRadius: 10, padding: sidebarCollapsed ? '4px' : '6px 8px', width: '100%' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--cl-surface)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
        >
          <Box style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              size={sidebarCollapsed ? 28 : 30} radius="xl" src={user?.image}
              imageProps={{ referrerPolicy: 'no-referrer' }}
              style={{ backgroundColor: 'var(--cl-brand-soft)', color: 'var(--cl-brand)', fontSize: 12, fontWeight: 600, border: '1px solid var(--cl-border)' }}
            >
              {!user?.image && userInitial}
            </Avatar>
            <Box style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', backgroundColor: dotColour, border: '2px solid var(--cl-bg-subtle)' }} />
          </Box>
          {!sidebarCollapsed && (
            <>
              <Box style={{ flex: 1, overflow: 'hidden', marginLeft: 8 }}>
                <Text size="sm" fw={600} style={{ color: 'var(--cl-text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name ?? 'User'}
                </Text>
                {user?.email && (
                  <Text size="xs" style={{ color: 'var(--cl-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email}
                  </Text>
                )}
              </Box>
              <IconChevronUp size={13} style={{ color: 'var(--cl-text-muted)', flexShrink: 0 }} />
            </>
          )}
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown style={{ backgroundColor: 'var(--cl-surface)', border: '1px solid var(--cl-border)', minWidth: 220, borderRadius: 14 }}>
        <Box style={{ padding: '10px 14px 8px' }}>
          <Text size="sm" fw={600} style={{ color: 'var(--cl-text-primary)' }}>{user?.name ?? 'User'}</Text>
          <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>{user?.email ?? 'Account'}</Text>
        </Box>
        <Divider color="var(--cl-border)" style={{ marginBottom: 4 }} />

        <Menu.Item leftSection={<IconPlus size={14} />} onClick={handleNewChat}
          style={{ color: 'var(--cl-brand)', borderRadius: 8, margin: '0 4px', fontWeight: 600 }}>
          New session
        </Menu.Item>
        <Divider color="var(--cl-border)" style={{ margin: '4px 0' }} />

        <Menu.Item leftSection={<IconUser size={14} />} onClick={() => router.push('/app/account')}
          style={{ color: 'var(--cl-text-primary)', borderRadius: 8, margin: '0 4px' }}>
          Account & Profile
        </Menu.Item>
        <Menu.Item leftSection={<IconSettings size={14} />} onClick={() => router.push('/app/settings')}
          style={{ color: 'var(--cl-text-primary)', borderRadius: 8, margin: '0 4px' }}>
          Settings
        </Menu.Item>
        <Menu.Item leftSection={<IconHelpCircle size={14} />} onClick={() => router.push('/app/help')}
          style={{ color: 'var(--cl-text-primary)', borderRadius: 8, margin: '0 4px' }}>
          Help & Docs
        </Menu.Item>
        <Divider color="var(--cl-border)" style={{ margin: '4px 0' }} />
        <Menu.Item leftSection={<IconLogout size={14} />} onClick={handleLogout}
          style={{ color: 'var(--cl-error)', borderRadius: 8, margin: '0 4px 4px' }}>
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <AppShell
      header={{ height: 52, collapsed: isOnChat }}
      navbar={{
        width: sidebarCollapsed ? 64 : 264,
        breakpoint: 'sm',
        collapsed: { mobile: !navOpen },
      }}
      padding={0}
      styles={{
        root:   { backgroundColor: 'var(--cl-bg)' },
        header: { backgroundColor: 'var(--cl-bg)', borderBottom: '1px solid var(--cl-border)' },
        navbar: {
          backgroundColor: 'var(--cl-bg-subtle)',
          borderRight: '1px solid var(--cl-border)',
          transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
        },
        main: {
          backgroundColor: 'var(--cl-bg)',
          transition: 'padding-left 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      }}
    >
      {/* ── Header (non-chat pages only) ───────────────────────────────────── */}
      <AppShell.Header>
        <Group h="100%" px="xl" justify="space-between" align="center">
          <Group gap="xs">
            <ActionIcon variant="subtle" onClick={() => setNavOpen((o) => !o)} hiddenFrom="sm"
              aria-label="Toggle navigation" style={{ color: 'var(--cl-text-secondary)' }}>
              {navOpen ? <IconX size={20} /> : <IconMenu2 size={20} />}
            </ActionIcon>
            <Text fw={600} size="sm" style={{ color: 'var(--cl-text-primary)', letterSpacing: '-0.01em' }}>
              {pageTitle}
            </Text>
          </Group>
          <ThemeToggle />
        </Group>
      </AppShell.Header>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <AppShell.Navbar p={0}>

        {/* ════ COLLAPSED (icon-only, 64px) ════ */}
        {sidebarCollapsed && (
          /* Clicking anywhere on the collapsed sidebar background expands it.
             Each interactive element calls e.stopPropagation() so their own
             actions still fire independently without triggering the expand. */
          <Box
            onClick={toggleSidebar}
            title="Click to expand sidebar"
            style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', padding: '12px 0 10px', gap: 2,
              overflow: 'hidden', cursor: 'pointer',
            }}
          >

            {/* Logo mark — expand sidebar on click (most prominent target at top) */}
            <Tooltip label="Expand sidebar" position="right" withArrow>
              <UnstyledButton
                onClick={(e) => { e.stopPropagation(); toggleSidebar(); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, cursor: 'pointer' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--cl-surface)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                <LogoMark size={26} />
              </UnstyledButton>
            </Tooltip>

            <Box style={{ width: 36, height: 1, backgroundColor: 'var(--cl-border)', margin: '4px 0 6px' }} />

            {/* New session icon */}
            <Tooltip label="New session (⌘\\)" position="right" withArrow>
              <ActionIcon variant="subtle" size="lg"
                onClick={(e) => { e.stopPropagation(); handleNewChat(); }}
                style={{ color: 'var(--cl-text-secondary)', borderRadius: 10, width: 40, height: 36 }}>
                <IconPlus size={18} />
              </ActionIcon>
            </Tooltip>

            <Box style={{ height: 4 }} />

            {/* Primary nav icons */}
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
              const active = pathname.startsWith(href);
              const badge  = href === '/app/notifications' && unreadCount > 0;
              return (
                <Tooltip key={href} label={label} position="right" withArrow>
                  <Box style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                    <ActionIcon variant="subtle" onClick={() => router.push(href)} size="lg"
                      style={{ color: active ? 'var(--cl-brand)' : 'var(--cl-text-secondary)', backgroundColor: active ? 'var(--cl-surface)' : 'transparent', borderRadius: 10, width: 40, height: 36 }}>
                      <Icon size={18} />
                    </ActionIcon>
                    {badge && (
                      <Box style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--cl-error)', border: '1.5px solid var(--cl-bg-subtle)' }} />
                    )}
                  </Box>
                </Tooltip>
              );
            })}

            {/* Spacer */}
            <Box style={{ flex: 1 }} />

            {/* Settings + Help icons */}
            {[
              { href: '/app/settings', Icon: IconSettings, label: 'Settings' },
              { href: '/app/help',     Icon: IconHelpCircle, label: 'Help & Docs' },
            ].map(({ href, Icon, label }) => (
              <Tooltip key={href} label={label} position="right" withArrow>
                <ActionIcon variant="subtle" size="lg"
                  onClick={(e) => { e.stopPropagation(); router.push(href); }}
                  style={{ color: pathname.startsWith(href) ? 'var(--cl-brand)' : 'var(--cl-text-muted)', borderRadius: 10, width: 40, height: 36 }}>
                  <Icon size={17} />
                </ActionIcon>
              </Tooltip>
            ))}

            {/* User avatar dropdown — stop propagation so menu opens, not sidebar */}
            <Box style={{ marginTop: 4, width: '100%', display: 'flex', justifyContent: 'center' }}
              onClick={(e) => e.stopPropagation()}>
              <UserDropdown position="right-start" />
            </Box>

            {/* Expand toggle — explicit button kept as a secondary affordance */}
            <Tooltip label="Expand sidebar (⌘\\)" position="right" withArrow>
              <ActionIcon variant="subtle" size="sm"
                onClick={(e) => { e.stopPropagation(); toggleSidebar(); }}
                style={{ color: 'var(--cl-text-muted)', marginTop: 4 }}>
                <IconChevronsRight size={15} />
              </ActionIcon>
            </Tooltip>
          </Box>
        )}

        {/* ════ EXPANDED (full, 264px) ════ */}
        {!sidebarCollapsed && (
          <Stack gap="sm" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '12px 14px 10px', overflow: 'hidden' }}>

            {/* Logo row + collapse toggle */}
            <Group justify="space-between" align="center" style={{ paddingBottom: 2 }}>
              <UnstyledButton onClick={handleNewChat} style={{ cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center' }}
                title="New session">
                <BrandLockup size="sm" variant="horizontal" />
              </UnstyledButton>
              <Tooltip label="Collapse sidebar (⌘\\)" position="right" withArrow>
                <ActionIcon variant="subtle" onClick={toggleSidebar} size="sm"
                  style={{ color: 'var(--cl-text-muted)', flexShrink: 0 }}>
                  <IconChevronsLeft size={15} />
                </ActionIcon>
              </Tooltip>
            </Group>

            {/* New session button — teal-tinted outline for visibility */}
            <Button leftSection={<IconPlus size={15} />} variant="default" onClick={handleNewChat} fullWidth size="sm"
              style={{ fontWeight: 600, height: 38, color: 'var(--cl-brand)', borderColor: 'rgba(12,122,138,0.30)', backgroundColor: 'rgba(12,122,138,0.05)', letterSpacing: '-0.01em' }}>
              New session
            </Button>

            {/* Primary nav */}
            <Stack gap={2}>
              {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
                const active = pathname.startsWith(href);
                const badge  = href === '/app/notifications' && unreadCount > 0 ? unreadCount : 0;
                return (
                  <CompactNavItem key={href} icon={<Icon size={16} />} label={label} active={active}
                    badge={badge} onClick={() => router.push(href)} />
                );
              })}
            </Stack>

            {/* Session history search */}
            <TextInput
              size="xs"
              placeholder="Search sessions…"
              leftSection={<IconSearch size={13} />}
              value={historySearch}
              onChange={(e) => setHistorySearch(e.currentTarget.value)}
              styles={{
                input: {
                  backgroundColor: 'var(--cl-surface)',
                  border: '1px solid var(--cl-border)',
                  borderRadius: 8,
                  fontSize: '0.78rem',
                  height: 30,
                  paddingLeft: 28,
                  color: 'var(--cl-text-primary)',
                  '&::placeholder': { color: 'var(--cl-text-muted)' },
                },
                section: { color: 'var(--cl-text-muted)' },
              }}
            />

            {/* Session history */}
            <Box style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
              <SessionHistory sessions={filteredSessions} onSelectSession={handleSessionClick} />
            </Box>

            {/* Bottom dock */}
            <Box style={{ borderTop: '1px solid var(--cl-border)', paddingTop: 10 }}>
              <Group gap={4} style={{ marginBottom: 8, paddingLeft: 2 }}>
                <Tooltip label="Settings" position="right" withArrow>
                  <ActionIcon variant="subtle" size="md" onClick={() => router.push('/app/settings')}
                    style={{ color: pathname.startsWith('/app/settings') ? 'var(--cl-brand)' : 'var(--cl-text-muted)', borderRadius: 8 }}>
                    <IconSettings size={17} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Help & Docs" position="right" withArrow>
                  <ActionIcon variant="subtle" size="md" onClick={() => router.push('/app/help')}
                    style={{ color: 'var(--cl-text-muted)', borderRadius: 8 }}>
                    <IconHelpCircle size={17} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <UserDropdown position="top-start" />
            </Box>
          </Stack>
        )}
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

// ── Session history component ─────────────────────────────────────────────────

function SessionHistory({
  sessions,
  onSelectSession,
}: {
  sessions: Record<string, { id: string; label: string }[]>;
  onSelectSession: (id: string) => void;
}) {
  const entries = Object.entries(sessions);
  if (!entries.length) {
    return (
      <Box style={{ padding: '16px 10px', textAlign: 'center' }}>
        <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>No sessions found</Text>
      </Box>
    );
  }

  return (
    <Box style={{ height: '100%', overflowY: 'auto', paddingRight: 2 }}>
      {entries.map(([group, items]) => (
        <Box key={group} style={{ marginBottom: 14 }}>
          <Text size="xs" style={{
            color: 'var(--cl-text-muted)', fontWeight: 600, letterSpacing: '0.06em',
            textTransform: 'uppercase', fontSize: '0.62rem', padding: '0 10px', marginBottom: 4,
          }}>
            {group}
          </Text>
          <Stack gap={1}>
            {items.map((s) => (
              <SessionItem key={s.id} label={s.label}
                onClick={() => onSelectSession(s.id)} />
            ))}
          </Stack>
        </Box>
      ))}
    </Box>
  );
}

function SessionItem({
  label, onClick,
}: {
  label: string; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Tooltip label={label} position="right" withArrow openDelay={700}>
      <UnstyledButton
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%', padding: '6px 10px', borderRadius: 8,
          backgroundColor: hovered ? 'var(--cl-surface)' : 'transparent',
          transition: 'background-color 0.12s ease', cursor: 'pointer',
        }}
      >
        <Text size="xs" style={{
          color: hovered ? 'var(--cl-text-primary)' : 'var(--cl-text-secondary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          lineHeight: 1.4, transition: 'color 0.12s ease',
        }}>
          {label}
        </Text>
      </UnstyledButton>
    </Tooltip>
  );
}

// ── Compact nav item (expanded sidebar) ───────────────────────────────────────

function CompactNavItem({
  icon, label, active, badge, onClick,
}: {
  icon: React.ReactNode; label: string; active: boolean; badge?: number; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <UnstyledButton
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 9,
        padding: '7px 10px', borderRadius: 9,
        // Active: white card with stronger shadow + teal accent
        backgroundColor: active ? '#FFFFFF' : hovered ? 'rgba(0,0,0,0.035)' : 'transparent',
        boxShadow: active ? '0 1px 5px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.05)' : 'none',
        border: 'none',
        color: active ? 'var(--cl-brand)' : hovered ? 'var(--cl-text-primary)' : 'var(--cl-text-secondary)',
        transition: 'all 0.14s ease', cursor: 'pointer',
      }}
    >
      {icon}
      <Text size="sm" style={{ color: 'inherit', fontWeight: active ? 700 : 400, flex: 1, letterSpacing: active ? '-0.01em' : 'normal' }}>
        {label}
      </Text>
      {!!badge && (
        <Box style={{
          backgroundColor: 'var(--cl-error)', color: '#fff',
          borderRadius: 9999, minWidth: 18, height: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.63rem', fontWeight: 700, padding: '0 5px',
          letterSpacing: '0.01em',
        }}>
          {badge}
        </Box>
      )}
    </UnstyledButton>
  );
}
