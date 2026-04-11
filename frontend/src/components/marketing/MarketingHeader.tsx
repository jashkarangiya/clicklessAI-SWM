'use client';
/**
 * ClickLess AI – Marketing Header
 *
 * 76px sticky header: wordmark | centered nav | sign-in + theme toggle + CTA
 * Nav links: soft pill hover bg + sliding underline.
 * CTA: lift + arrow nudge. Wordmark brightens on hover.
 */
import { Box, Group, Button, Anchor, Burger, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon, IconArrowRight } from '@tabler/icons-react';
import { LogoWordmark } from '@/components/branding/LogoWordmark';

const NAV_ITEMS = [
  { label: 'Product',       href: '#product' },
  { label: 'How it works',  href: '#how-it-works' },
  { label: 'Security',      href: '#security' },
];

function NavLink({ label, href }: { label: string; href: string }) {
  return (
    <Box style={{ position: 'relative' }}>
      <Anchor
        href={href}
        underline="never"
        className="cl-nav-link"
        style={{
          color: 'var(--cl-text-secondary)',
          fontWeight: 500,
          fontSize: '0.88rem',
          padding: '5px 12px',
          borderRadius: 9999,
          display: 'block',
          transition: `color var(--motion-fast) var(--ease-standard),
                       background-color 160ms var(--ease-standard)`,
          backgroundColor: 'transparent',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.color = 'var(--cl-text-primary)';
          el.style.backgroundColor = 'var(--cl-surface-raised)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.color = 'var(--cl-text-secondary)';
          el.style.backgroundColor = 'transparent';
        }}
      >
        {label}
      </Anchor>
    </Box>
  );
}

export function MarketingHeader() {
  const [opened, { toggle }] = useDisclosure(false);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Box
      component="header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--cl-bg)',
        borderBottom: '1px solid var(--cl-border)',
        height: 76,
        backdropFilter: 'blur(12px)',
      }}
    >
      <Box
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
        }}
      >
        {/* Left: wordmark — brightens on hover */}
        <Box
          style={{
            transition: 'filter var(--motion-fast) var(--ease-standard)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.15)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1)'; }}
        >
          <LogoWordmark size="md" />
        </Box>

        {/* Center: nav links (desktop) */}
        <Group
          gap="xs"
          visibleFrom="sm"
          style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
        >
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.label} label={item.label} href={item.href} />
          ))}
        </Group>

        {/* Right: sign in + theme toggle + CTA */}
        <Group gap="sm">
          <Button
            component="a"
            href="/login"
            variant="subtle"
            radius={9999}
            visibleFrom="sm"
            style={{
              color: 'var(--cl-text-secondary)',
              fontWeight: 500,
              transition: 'color var(--motion-fast) ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--cl-text-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--cl-text-secondary)'; }}
          >
            Sign in
          </Button>

          {/* Theme toggle */}
          <ActionIcon
            variant="subtle"
            radius={9999}
            size={36}
            onClick={() => toggleColorScheme()}
            aria-label="Toggle color scheme"
            style={{
              color: 'var(--cl-text-secondary)',
              transition: `color var(--motion-fast) ease,
                           background-color var(--motion-fast) ease,
                           transform var(--motion-fast) var(--ease-emphasis)`,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = 'var(--cl-text-primary)';
              el.style.transform = 'rotate(15deg)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = 'var(--cl-text-secondary)';
              el.style.transform = 'rotate(0deg)';
            }}
          >
            {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
          </ActionIcon>

          {/* Primary CTA — lift + arrow nudge */}
          <Button
            component="a"
            href="/signup"
            variant="brand"
            radius={9999}
            rightSection={
              <IconArrowRight
                size={15}
                style={{ transition: 'transform 140ms ease' }}
                className="cta-arrow"
              />
            }
            className="cl-btn-lift"
            style={{ fontWeight: 600 }}
            onMouseEnter={(e) => {
              const arrow = e.currentTarget.querySelector('.cta-arrow') as HTMLElement;
              if (arrow) arrow.style.transform = 'translateX(2px)';
            }}
            onMouseLeave={(e) => {
              const arrow = e.currentTarget.querySelector('.cta-arrow') as HTMLElement;
              if (arrow) arrow.style.transform = 'translateX(0)';
            }}
          >
            Try ClickLess
          </Button>

          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
          />
        </Group>
      </Box>

      {/* Mobile nav dropdown */}
      {opened && (
        <Box
          hiddenFrom="sm"
          style={{
            backgroundColor: 'var(--cl-surface)',
            borderBottom: '1px solid var(--cl-border)',
            padding: '16px 2rem',
          }}
        >
          {NAV_ITEMS.map((item) => (
            <Anchor
              key={item.label}
              href={item.href}
              underline="never"
              display="block"
              py="sm"
              style={{ color: 'var(--cl-text-primary)', fontWeight: 500 }}
            >
              {item.label}
            </Anchor>
          ))}
          <Button
            component="a"
            href="/login"
            variant="subtle"
            fullWidth
            mt="sm"
            radius={9999}
            style={{ color: 'var(--cl-text-primary)' }}
          >
            Sign in
          </Button>
        </Box>
      )}
    </Box>
  );
}
