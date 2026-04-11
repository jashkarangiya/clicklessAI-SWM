'use client';
/**
 * ClickLess AI – Help & Support Page
 */
import { Box, Stack, Text, Group, Accordion, UnstyledButton } from '@mantine/core';
import {
  IconMessageCircle, IconMail, IconBook, IconChevronRight,
} from '@tabler/icons-react';

// ── Quick-action cards ────────────────────────────────────────────────────────

interface QuickAction {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  onClick?: () => void;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: <IconMessageCircle size={22} color="var(--cl-brand)" />,
    title: 'Chat with us',
    description: 'Start a conversation and get help in real time.',
    cta: 'Open chat',
  },
  {
    icon: <IconMail size={22} color="var(--cl-brand)" />,
    title: 'Email support',
    description: 'Send us an email and we\'ll reply within 24 hours.',
    cta: 'Send email',
    onClick: () => {
      if (typeof window !== 'undefined') window.location.href = 'mailto:support@clicklessai.com';
    },
  },
  {
    icon: <IconBook size={22} color="var(--cl-brand)" />,
    title: 'Documentation',
    description: 'Browse guides, tutorials, and API references.',
    cta: 'View docs',
  },
];

function QuickActionCard({ action }: { action: QuickAction }) {
  return (
    <UnstyledButton
      onClick={action.onClick}
      style={{
        flex: 1,
        backgroundColor: 'var(--cl-surface)',
        border: '1px solid var(--cl-border)',
        borderRadius: 14,
        padding: '18px 16px',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        minWidth: 0,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--cl-brand)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 2px rgba(12,122,138,0.10)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--cl-border)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <Box style={{ marginBottom: 10 }}>{action.icon}</Box>
      <Text fw={600} size="sm" style={{ color: 'var(--cl-text-primary)', marginBottom: 4 }}>
        {action.title}
      </Text>
      <Text size="xs" style={{ color: 'var(--cl-text-muted)', lineHeight: 1.5, marginBottom: 12 }}>
        {action.description}
      </Text>
      <Group gap={4} align="center">
        <Text size="xs" fw={600} style={{ color: 'var(--cl-brand)' }}>
          {action.cta}
        </Text>
        <IconChevronRight size={12} color="var(--cl-brand)" />
      </Group>
    </UnstyledButton>
  );
}

// ── FAQ data ──────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    value: 'how-orders',
    question: 'How does ClickLess place orders?',
    answer:
      'ClickLess uses your connected retailer session (Amazon or Walmart) to browse, add items to your cart, and prepare checkout — all automatically. It will always show you a full order summary and require your explicit confirmation before any purchase is finalized. No order is ever placed without your approval.',
  },
  {
    value: 'payment-stored',
    question: 'Is my payment information stored?',
    answer:
      'No. ClickLess never stores your payment credentials, card numbers, or billing details. We rely on your existing retailer account payment methods and session tokens. Your credentials stay on your device and are never transmitted to our servers.',
  },
  {
    value: 'retailers',
    question: 'Which retailers are supported?',
    answer:
      'Amazon and Walmart are fully supported today. We have 40+ additional retailers on our roadmap — including Target, Best Buy, eBay, and more. Stay tuned for updates in the app.',
  },
  {
    value: 'disconnect-retailer',
    question: 'How do I disconnect a retailer?',
    answer:
      'Go to Settings → Connections, then click Disconnect next to the retailer you want to remove. Your session will be cleared immediately. You can reconnect at any time.',
  },
  {
    value: 'cancel-order',
    question: 'Can I cancel an order after placing it?',
    answer:
      'Yes, within the cancellation window available at the retailer. Navigate to the Orders page in ClickLess, find the order, and select Cancel. If the window has passed, you\'ll need to contact the retailer directly.',
  },
  {
    value: 'session-expired',
    question: 'Why did my Amazon session expire?',
    answer:
      'Amazon periodically expires browser sessions for security reasons, especially after inactivity or when detected from a new context. To reconnect, go to Settings → Connections → Amazon and follow the sign-in flow.',
  },
  {
    value: 'delete-account',
    question: 'How do I delete my account?',
    answer:
      'You can delete your account from Settings → Account → Danger zone. This will permanently remove all your data, sessions, and order history. The action is irreversible.',
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HelpPage() {
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
      <Stack gap={32}>

        {/* Header */}
        <Box>
          <Text
            component="h1"
            fw={700}
            size="xl"
            style={{ color: 'var(--cl-text-primary)', margin: 0, lineHeight: 1.2 }}
          >
            Help &amp; Support
          </Text>
          <Text size="sm" style={{ color: 'var(--cl-text-muted)', marginTop: 6 }}>
            Find answers, reach our team, or browse the documentation.
          </Text>
        </Box>

        {/* Quick actions */}
        <Group gap={12} align="stretch" wrap="nowrap" style={{ flexWrap: 'wrap' }}>
          {QUICK_ACTIONS.map((action) => (
            <QuickActionCard key={action.title} action={action} />
          ))}
        </Group>

        {/* FAQ */}
        <Box>
          <Text fw={600} size="md" style={{ color: 'var(--cl-text-primary)', marginBottom: 14 }}>
            Frequently asked questions
          </Text>

          <Accordion
            variant="separated"
            radius={12}
            styles={{
              item: {
                backgroundColor: 'var(--cl-surface)',
                border: '1px solid var(--cl-border)',
                borderRadius: 12,
                marginBottom: 8,
                overflow: 'hidden',
              },
              control: {
                backgroundColor: 'transparent',
                padding: '14px 16px',
                color: 'var(--cl-text-primary)',
                fontWeight: 500,
                fontSize: 14,
              },
              panel: {
                padding: '0 16px 14px',
              },
              content: {
                padding: 0,
              },
              chevron: {
                color: 'var(--cl-text-muted)',
              },
            }}
          >
            {FAQ_ITEMS.map((item) => (
              <Accordion.Item key={item.value} value={item.value}>
                <Accordion.Control>{item.question}</Accordion.Control>
                <Accordion.Panel>
                  <Text size="sm" style={{ color: 'var(--cl-text-secondary)', lineHeight: 1.65 }}>
                    {item.answer}
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Box>

      </Stack>
    </Box>
  );
}
