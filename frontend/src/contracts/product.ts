/**
 * ClickLess AI – Normalized Product Contract
 */
import { z } from 'zod';

export const PricingSchema = z.object({
    current: z.number(),
    original: z.number().optional(),
    currency: z.string().default('USD'),
    discount_pct: z.number().optional(),
    price_label: z.string().optional(),
});
export type Pricing = z.infer<typeof PricingSchema>;

export const RatingsSchema = z.object({
    average: z.number().min(0).max(5),
    count: z.number().int().nonnegative(),
    count_label: z.string().optional(),
});
export type Ratings = z.infer<typeof RatingsSchema>;

export const DeliverySchema = z.object({
    estimate_label: z.string().optional(),
    estimate_days: z.number().optional(),
    free: z.boolean().optional(),
    prime: z.boolean().optional(),
});
export type Delivery = z.infer<typeof DeliverySchema>;

export const ProductScoringSchema = z.object({
    total: z.number().optional(),
    price_score: z.number().optional(),
    rating_score: z.number().optional(),
    delivery_score: z.number().optional(),
    pref_score: z.number().optional(),
    match_reasons: z.array(z.string()).optional(),
    recommended: z.boolean().optional(),
    rank: z.number().optional(),
});
export type ProductScoring = z.infer<typeof ProductScoringSchema>;

export const NormalizedProductSchema = z.object({
    product_id: z.string(),
    source: z.enum(['amazon', 'walmart', 'other']),
    source_url: z.string().url().optional(),
    source_product_id: z.string().optional(),
    name: z.string(),
    brand: z.string().optional(),
    category: z.string().optional(),
    pricing: PricingSchema,
    ratings: RatingsSchema.optional(),
    delivery: DeliverySchema.optional(),
    attributes: z.record(z.string(), z.string()).optional(),
    images: z.array(z.string().url()).optional(),
    description: z.string().optional(),
    in_stock: z.boolean().optional(),
    scoring: ProductScoringSchema.optional(),
    scraped_at: z.string().optional(),
    cache_ttl_seconds: z.number().optional(),
});
export type NormalizedProduct = z.infer<typeof NormalizedProductSchema>;
