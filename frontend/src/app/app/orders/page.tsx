'use client';
/**
 * ClickLess AI – Order History Page
 */
import { useState, useMemo } from 'react';
import { Box, Stack, Text, Group, UnstyledButton } from '@mantine/core';
import { PurchaseHistoryList } from '@/components/settings/PurchaseHistoryList';
import { MOCK_ORDERS } from '@/lib/mocks/fixtures';
import type { OrderRecord } from '@/contracts/purchase';

// ── Extra orders (extend mock data) ──────────────────────────────────────────

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

const EXTRA_ORDERS: OrderRecord[] = [
  {
    order_id: 'ord-extra-001',
    product_name: 'Sony WH-1000XM5 Headphones',
    source: 'amazon',
    price: 279.99,
    currency: 'USD',
    status: 'shipped',
    placed_at: daysAgo(3),
  },
  {
    order_id: 'ord-extra-002',
    product_name: 'Anker 10000mAh Power Bank',
    source: 'walmart',
    price: 22.99,
    currency: 'USD',
    status: 'delivered',
    placed_at: daysAgo(7),
    delivered_at: daysAgo(5),
  },
  {
    order_id: 'ord-extra-003',
    product_name: 'Lavazza Perfetto Coffee Pods 100ct',
    source: 'amazon',
    price: 28.49,
    currency: 'USD',
    status: 'delivered',
    placed_at: daysAgo(7),
    delivered_at: daysAgo(5),
  },
  {
    order_id: 'ord-extra-004',
    product_name: 'Samsung 65" 4K Smart TV',
    source: 'amazon',
    price: 697.00,
    currency: 'USD',
    status: 'cancelled',
    placed_at: daysAgo(14),
  },
  {
    order_id: 'ord-extra-005',
    product_name: 'Logitech MX Master 3S Mouse',
    source: 'amazon',
    price: 89.99,
    currency: 'USD',
    status: 'delivered',
    placed_at: daysAgo(21),
    delivered_at: daysAgo(19),
  },
  {
    order_id: 'ord-extra-006',
    product_name: 'Instant Pot Duo 7-in-1',
    source: 'walmart',
    price: 79.95,
    currency: 'USD',
    status: 'delivered',
    placed_at: daysAgo(30),
    delivered_at: daysAgo(28),
  },
];

const ALL_ORDERS: OrderRecord[] = [...MOCK_ORDERS, ...EXTRA_ORDERS].sort(
  (a, b) => new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime(),
);

// ── Filter tabs ───────────────────────────────────────────────────────────────

type FilterTab = 'All' | 'Active' | 'Delivered' | 'Cancelled';

const TABS: FilterTab[] = ['All', 'Active', 'Delivered', 'Cancelled'];

function filterOrders(orders: OrderRecord[], tab: FilterTab): OrderRecord[] {
  if (tab === 'All') return orders;
  if (tab === 'Active') return orders.filter((o) => o.status === 'placed' || o.status === 'shipped');
  if (tab === 'Delivered') return orders.filter((o) => o.status === 'delivered');
  if (tab === 'Cancelled') return orders.filter((o) => o.status === 'cancelled' || o.status === 'failed');
  return orders;
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Box
      style={{
        flex: 1,
        backgroundColor: 'var(--cl-surface)',
        border: '1px solid var(--cl-border)',
        borderRadius: 14,
        padding: '14px 18px',
        minWidth: 0,
      }}
    >
      <Text size="xs" style={{ color: 'var(--cl-text-muted)', fontWeight: 500, marginBottom: 4 }}>
        {label}
      </Text>
      <Text fw={700} size="lg" style={{ color: 'var(--cl-text-primary)', lineHeight: 1.2 }}>
        {value}
      </Text>
    </Box>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('All');

  const filteredOrders = useMemo(() => filterOrders(ALL_ORDERS, activeTab), [activeTab]);

  // Stats
  const totalOrders = ALL_ORDERS.length;
  const totalSpent = ALL_ORDERS.reduce((sum, o) => sum + o.price, 0);
  const lastOrderDate = ALL_ORDERS[0]
    ? new Date(ALL_ORDERS[0].placed_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  return (
    <Box
      style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '28px 32px',
        height: 'calc(100vh - 52px)',
        overflowY: 'auto',
      }}
    >
      <Stack gap={24}>

        {/* Header */}
        <Box>
          <Text
            component="h1"
            fw={700}
            size="xl"
            style={{ color: 'var(--cl-text-primary)', margin: 0, lineHeight: 1.2 }}
          >
            Orders
          </Text>
          <Text size="sm" style={{ color: 'var(--cl-text-muted)', marginTop: 4 }}>
            Your complete purchase history.
          </Text>
        </Box>

        {/* Stats row */}
        <Group gap={12}>
          <StatCard label="Total orders" value={String(totalOrders)} />
          <StatCard label="Total spent" value={`$${totalSpent.toFixed(2)}`} />
          <StatCard label="Last order" value={lastOrderDate} />
        </Group>

        {/* Filter tabs */}
        <Group gap={6}>
          {TABS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <UnstyledButton
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '5px 14px',
                  borderRadius: 99,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  backgroundColor: isActive ? 'var(--cl-brand)' : 'var(--cl-surface)',
                  color: isActive ? '#fff' : 'var(--cl-text-secondary)',
                  border: `1px solid ${isActive ? 'var(--cl-brand)' : 'var(--cl-border)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab}
              </UnstyledButton>
            );
          })}
        </Group>

        {/* Order list */}
        {filteredOrders.length === 0 ? (
          <Box
            style={{
              textAlign: 'center',
              padding: '3rem',
              backgroundColor: 'var(--cl-surface)',
              border: '1px solid var(--cl-border)',
              borderRadius: 14,
            }}
          >
            <Text size="sm" style={{ color: 'var(--cl-text-muted)' }}>
              No {activeTab.toLowerCase()} orders found.
            </Text>
          </Box>
        ) : (
          <PurchaseHistoryList orders={filteredOrders} />
        )}

      </Stack>
    </Box>
  );
}
