/**
 * ClickLess AI – Mock Fixtures
 *
 * Typed sample data for all major entity types.
 * Used by mock transport and tests.
 */
import type { NormalizedProduct } from '@/contracts/product';
import type { PurchaseConfirmation } from '@/contracts/purchase';
import type { OrderRecord } from '@/contracts/purchase';
import type { PreferenceObject } from '@/contracts/preferences';

export const MOCK_PRODUCTS: NormalizedProduct[] = [
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
            total: 0.91, price_score: 0.85, rating_score: 0.95, delivery_score: 0.98,
            pref_score: 0.90, match_reasons: ['Top rated in category', 'Fast delivery', 'Great price'], recommended: true, rank: 1,
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
            total: 0.84, price_score: 0.92, rating_score: 0.88, delivery_score: 0.72,
            pref_score: 0.78, match_reasons: ['Cheapest option', 'Bose reliability'], recommended: false, rank: 2,
        },
    },
];

export const MOCK_CONFIRMATION: PurchaseConfirmation = {
    confirmation_id: 'conf-mock-001',
    status: 'pending',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
    product: MOCK_PRODUCTS[0]!,
    delivery: {
        address: '123 Main Street',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        estimate_days: 1,
        estimate_label: 'Tomorrow by 8pm',
    },
    payment: {
        method_type: 'Visa',
        last_four: '4242',
        billing_name: 'Alex Chen',
    },
    total_price: 279.99,
    return_summary: 'Free 30-day returns',
};

export const MOCK_ORDERS: OrderRecord[] = [
    {
        order_id: 'ord-2024-001',
        product_name: 'Apple AirPods Pro (2nd Generation)',
        source: 'amazon',
        price: 189.99,
        currency: 'USD',
        status: 'delivered',
        placed_at: '2024-11-10T14:30:00Z',
        delivered_at: '2024-11-12T16:00:00Z',
    },
    {
        order_id: 'ord-2024-002',
        product_name: 'Anker 65W USB-C Charger',
        source: 'walmart',
        price: 29.99,
        currency: 'USD',
        status: 'delivered',
        placed_at: '2024-12-01T09:00:00Z',
        delivered_at: '2024-12-04T12:00:00Z',
    },
];

export const MOCK_PREFERENCES: PreferenceObject = {
    explicit: {
        preferred_brands: ['Sony', 'Apple', 'Anker'],
        avoided_brands: ['Skullcandy'],
        budget_default: 300,
        delivery_priority: 'fast',
        preferred_sites: ['amazon', 'walmart'],
        color_preferences: ['Black', 'White'],
        eco_friendly: false,
    },
    implicit: {
        price_sensitivity: 'medium',
        rating_threshold: 4.2,
        review_count_threshold: 500,
        sort_tendency: 'best match',
        decision_speed: 'deliberate',
        comparison_depth: 'medium',
    },
    weights: { price: 0.3, rating: 0.35, delivery: 0.2, pref_match: 0.15 },
};
