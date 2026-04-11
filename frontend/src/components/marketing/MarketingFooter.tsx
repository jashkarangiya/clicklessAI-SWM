'use client';
/**
 * ClickLess AI – Marketing Footer (Pearl + Juniper)
 *
 * Footer links use .cl-footer-link for underline-grow animation (defined in globals.css).
 * Text shifts from muted → primary on hover.
 */
import { Box, Text, Group, Anchor, Stack, Divider } from '@mantine/core';
import { LogoWordmark } from '@/components/branding/LogoWordmark';

const LINKS = {
  Product: [
    { label: 'Features',      href: '#product' },
    { label: 'How it works',  href: '#how-it-works' },
    { label: 'Pricing',       href: '#' },
  ],
  Company: [
    { label: 'About',    href: '#' },
    { label: 'Blog',     href: '#' },
    { label: 'Careers',  href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy',    href: '#' },
    { label: 'Terms of Service',  href: '#' },
    { label: 'Security',          href: '#security' },
  ],
};

export function MarketingFooter() {
  return (
    <Box
      component="footer"
      style={{
        backgroundColor: 'var(--cl-bg-subtle)',
        borderTop: '1px solid var(--cl-border)',
      }}
    >
      <Box
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '56px 2rem 36px',
        }}
      >
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: '2.5fr 1fr 1fr 1fr',
            gap: '2.5rem',
          }}
          className="footer-grid"
        >
          {/* Brand column */}
          <Stack gap="md">
            <LogoWordmark size="md" />
            <Text size="sm" style={{ color: 'var(--cl-text-secondary)', maxWidth: 260, lineHeight: 1.65 }}>
              AI-powered shopping with human-in-the-loop control.
              Shop smarter across Amazon and Walmart.
            </Text>
          </Stack>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, links]) => (
            <Stack key={title} gap="sm">
              <Text
                size="xs"
                fw={600}
                style={{
                  color: 'var(--cl-text-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 4,
                }}
              >
                {title}
              </Text>
              {links.map((link) => (
                <Anchor
                  key={link.label}
                  href={link.href}
                  underline="never"
                  className="cl-footer-link"
                  style={{
                    color: 'var(--cl-text-muted)',
                    fontWeight: 400,
                    fontSize: '0.85rem',
                    transition: 'color var(--motion-fast) var(--ease-standard)',
                    display: 'inline-block',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--cl-text-primary)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--cl-text-muted)'; }}
                >
                  {link.label}
                </Anchor>
              ))}
            </Stack>
          ))}
        </Box>

        <Divider color="var(--cl-border)" mt="xl" mb="lg" />

        <Group justify="space-between">
          <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>
            © {new Date().getFullYear()} ClickLess AI. All rights reserved.
          </Text>
          <Text size="xs" style={{ color: 'var(--cl-text-muted)' }}>
            A Semantic Web Mining Project
          </Text>
        </Group>
      </Box>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </Box>
  );
}
