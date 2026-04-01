/**
 * ClickLess AI – Common Data Contracts
 */
import { z } from 'zod';

// ─── Error Object ──────────────────────────────────────────────────────────
export const ErrorObjectSchema = z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
    retryable: z.boolean().optional(),
});
export type ErrorObject = z.infer<typeof ErrorObjectSchema>;

// ─── Query ─────────────────────────────────────────────────────────────────
export const QuerySchema = z.object({
    raw: z.string(),
    normalized: z.string().optional(),
    intent_type: z.string().optional(),
    constraints: z.record(z.string(), z.unknown()).optional(),
});
export type Query = z.infer<typeof QuerySchema>;
