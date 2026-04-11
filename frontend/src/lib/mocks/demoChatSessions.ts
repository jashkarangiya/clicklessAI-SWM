/**
 * ClickLess AI – Demo Chat Sessions
 *
 * Pre-built chat sessions used to populate the chat timeline
 * when a user clicks a session entry in the sidebar history.
 */
import type { FrontendChatMessage } from '@/contracts/chat';

export interface DemoSession {
  id: string;
  label: string;
  messages: FrontendChatMessage[];
}

// ── Session 1: Noise-canceling headphones search with product results ─────────
const s1Messages: FrontendChatMessage[] = [
  {
    id: 'demo-s1-m1',
    timestamp: '2026-04-11T09:00:00.000Z',
    role: 'user',
    type: 'text',
    content: 'Find me the best noise-canceling headphones under $300',
  },
  {
    id: 'demo-s1-m2',
    timestamp: '2026-04-11T09:00:04.000Z',
    role: 'assistant',
    type: 'text',
    content: "I found 2 great options for you. Here's the comparison:",
  },
  {
    id: 'demo-s1-m3',
    timestamp: '2026-04-11T09:00:05.000Z',
    role: 'assistant',
    type: 'product_results',
    products: [
      {
        product_id: 'amz-001',
        source: 'amazon',
        source_url: 'https://amazon.com/dp/B08N5KWB9H',
        source_product_id: 'B08N5KWB9H',
        name: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
        brand: 'Sony',
        category: 'Electronics > Headphones',
        pricing: { current: 279.99, original: 399.99, currency: 'USD', discount_pct: 30 },
        ratings: { average: 4.7, count: 18432, count_label: '18.4k' },
        delivery: { estimate_label: 'Tomorrow', estimate_days: 1, free: true, prime: true },
        attributes: { color: 'Black', connectivity: 'Bluetooth 5.2', battery: '30 Hours' },
        images: ['https://placehold.co/400x400/120A1F/9B5DFF?text=Sony+XM5'],
        description: 'Industry-leading noise cancellation with exceptional sound quality.',
        in_stock: true,
        scoring: {
          total: 0.91,
          price_score: 0.85,
          rating_score: 0.95,
          delivery_score: 0.98,
          pref_score: 0.90,
          match_reasons: ['Top rated in category', 'Fast delivery', 'Great price'],
          recommended: true,
          rank: 1,
        },
      },
      {
        product_id: 'wmt-002',
        source: 'walmart',
        source_url: 'https://walmart.com/ip/123456',
        source_product_id: '123456',
        name: 'Bose QuietComfort 45 Bluetooth Wireless Noise Canceling Headphones',
        brand: 'Bose',
        category: 'Electronics > Headphones',
        pricing: { current: 249.00, original: 329.00, currency: 'USD', discount_pct: 24 },
        ratings: { average: 4.5, count: 9821, count_label: '9.8k' },
        delivery: { estimate_label: '2–3 days', estimate_days: 3, free: true, prime: false },
        attributes: { color: 'White Smoke', connectivity: 'Bluetooth 5.1', battery: '24 Hours' },
        images: ['https://placehold.co/400x400/181126/C084FC?text=Bose+QC45'],
        description: 'Legendary Bose audio with world-class noise cancellation.',
        in_stock: true,
        scoring: {
          total: 0.84,
          price_score: 0.92,
          rating_score: 0.88,
          delivery_score: 0.72,
          pref_score: 0.78,
          match_reasons: ['Cheapest option', 'Bose reliability'],
          recommended: false,
          rank: 2,
        },
      },
    ],
  },
  {
    id: 'demo-s1-m4',
    timestamp: '2026-04-11T09:00:06.000Z',
    role: 'assistant',
    type: 'text',
    content:
      'The Sony WH-1000XM5 is our top pick — 30% off and arrives tomorrow. The Bose is cheaper but takes 2–3 days. Both are excellent. Want me to order the Sony?',
  },
];

// ── Session 2: Dell XPS vs MacBook Pro comparison ─────────────────────────────
const s2Messages: FrontendChatMessage[] = [
  {
    id: 'demo-s2-m1',
    timestamp: '2026-04-10T14:00:00.000Z',
    role: 'user',
    type: 'text',
    content: 'Compare Dell XPS 15 vs MacBook Pro 14 for software development',
  },
  {
    id: 'demo-s2-m2',
    timestamp: '2026-04-10T14:00:05.000Z',
    role: 'assistant',
    type: 'text',
    content: `Great comparison! Here's what you need to know:

**Dell XPS 15** (~$1,599)
- 12th Gen Intel Core i7, 16GB RAM, 512GB SSD
- OLED 15.6" display, excellent for visuals
- Better GPU options, runs Windows/Linux natively
- Heavier at 4.2 lbs

**MacBook Pro 14** (~$1,999)
- Apple M3 chip — dominates on battery life (18h) and performance per watt
- Seamless iOS/macOS dev ecosystem
- Best-in-class trackpad and build quality
- Lighter at 3.5 lbs

For software development, the **MacBook Pro 14** is the stronger long-term choice — especially if you're in the Apple ecosystem or value battery life. The XPS 15 wins on display size and Windows flexibility.

Should I search for the best current prices?`,
  },
  {
    id: 'demo-s2-m3',
    timestamp: '2026-04-10T14:02:10.000Z',
    role: 'user',
    type: 'text',
    content: 'Yes, find the best price for the MacBook Pro 14',
  },
  {
    id: 'demo-s2-m4',
    timestamp: '2026-04-10T14:02:14.000Z',
    role: 'assistant',
    type: 'text',
    content: 'Searching Amazon and Best Buy for MacBook Pro 14 M3...',
  },
];

// ── Session 3: Best robot vacuum under $400 ───────────────────────────────────
const s3Messages: FrontendChatMessage[] = [
  {
    id: 'demo-s3-m1',
    timestamp: '2026-04-09T11:30:00.000Z',
    role: 'user',
    type: 'text',
    content: "What's the best robot vacuum under $400?",
  },
  {
    id: 'demo-s3-m2',
    timestamp: '2026-04-09T11:30:02.000Z',
    role: 'assistant',
    type: 'text',
    content: "I'll search across retailers for top-rated robot vacuums under $400...",
  },
  {
    id: 'demo-s3-m3',
    timestamp: '2026-04-09T11:30:08.000Z',
    role: 'assistant',
    type: 'text',
    content: `Found 3 strong options:

**1. iRobot Roomba 694** — $274.99 on Amazon ⭐ 4.4 (22k reviews)
Best entry-level pick. WiFi connected, works with Alexa. Ships tomorrow.

**2. Eufy RoboVac 11S** — $149.99 on Walmart ⭐ 4.3 (15k reviews)
Ultra-thin, very quiet. Best value.

**3. Shark IQ Robot Vacuum** — $349.99 on Amazon ⭐ 4.5 (8k reviews)
Self-emptying base — biggest convenience win. Ships in 2 days.

For under $400, the **Shark IQ** is the best all-round choice if you want hands-off operation. The iRobot is the safest brand-name bet. Want me to order the Shark IQ?`,
  },
  {
    id: 'demo-s3-m4',
    timestamp: '2026-04-09T11:32:00.000Z',
    role: 'user',
    type: 'text',
    content: 'Order the iRobot Roomba',
  },
  {
    id: 'demo-s3-m5',
    timestamp: '2026-04-09T11:32:05.000Z',
    role: 'assistant',
    type: 'text',
    content:
      'Ready to order the iRobot Roomba 694 for $274.99 with free Prime delivery tomorrow. I\'ll need your confirmation before placing the order — review the details and approve.',
  },
];

// ── Exported map keyed by session id ─────────────────────────────────────────

export const DEMO_SESSIONS: Record<string, DemoSession> = {
  s1: { id: 's1', label: 'Noise-canceling headphones under $300', messages: s1Messages },
  s2: { id: 's2', label: 'Compare Dell XPS vs MacBook Pro 14', messages: s2Messages },
  s3: { id: 's3', label: 'Best robot vacuum under $400', messages: s3Messages },
};

export const DEMO_SESSION_LIST: DemoSession[] = Object.values(DEMO_SESSIONS);
