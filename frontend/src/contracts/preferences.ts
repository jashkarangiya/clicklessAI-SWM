/**
 * ClickLess AI – Preferences Contract
 */
import { z } from 'zod';

export const ExplicitPreferencesSchema = z.object({
    preferred_brands: z.array(z.string()).default([]),
    avoided_brands: z.array(z.string()).default([]),
    budget_default: z.number().optional(),
    delivery_priority: z.enum(['standard', 'fast', 'fastest']).optional(),
    preferred_sites: z.array(z.enum(['amazon', 'walmart'])).default([]),
    color_preferences: z.array(z.string()).default([]),
    eco_friendly: z.boolean().optional(),
});
export type ExplicitPreferences = z.infer<typeof ExplicitPreferencesSchema>;

export const ImplicitPreferencesSchema = z.object({
    price_sensitivity: z.enum(['low', 'medium', 'high']).optional(),
    rating_threshold: z.number().min(0).max(5).optional(),
    review_count_threshold: z.number().optional(),
    sort_tendency: z.string().optional(),
    decision_speed: z.enum(['quick', 'deliberate']).optional(),
    comparison_depth: z.enum(['shallow', 'medium', 'deep']).optional(),
});
export type ImplicitPreferences = z.infer<typeof ImplicitPreferencesSchema>;

export const ScoringWeightsSchema = z.object({
    price: z.number().min(0).max(1).default(0.3),
    rating: z.number().min(0).max(1).default(0.3),
    delivery: z.number().min(0).max(1).default(0.2),
    pref_match: z.number().min(0).max(1).default(0.2),
});
export type ScoringWeights = z.infer<typeof ScoringWeightsSchema>;

export const PreferenceObjectSchema = z.object({
    explicit: ExplicitPreferencesSchema.optional(),
    implicit: ImplicitPreferencesSchema.optional(),
    weights: ScoringWeightsSchema.optional(),
});
export type PreferenceObject = z.infer<typeof PreferenceObjectSchema>;

export const SiteConnectionStatusSchema = z.object({
    amazon: z.enum(['connected', 'disconnected', 'expired']).default('disconnected'),
    walmart: z.enum(['connected', 'disconnected', 'expired']).default('disconnected'),
});
export type SiteConnectionStatus = z.infer<typeof SiteConnectionStatusSchema>;
