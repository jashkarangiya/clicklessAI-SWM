/**
 * ClickLess AI – State Envelope Contract
 *
 * This is the top-level message envelope shared between frontend and backend.
 * All WebSocket messages and REST responses are wrapped in this shape.
 */
import { z } from 'zod';
import { NormalizedProductSchema } from './product';
import { ClarificationSchema } from './chat';
import { PurchaseConfirmationSchema } from './purchase';
import { ErrorObjectSchema, QuerySchema } from './common';

export type { ErrorObject, Query } from './common';

// ─── State Envelope ────────────────────────────────────────────────────────
export const StateEnvelopeSchema = z.object({
    session_id: z.string(),
    user_id: z.string(),
    turn_id: z.string(),
    timestamp: z.string(), // ISO 8601
    intent: z.string().optional(),
    status: z.string(),
    query: QuerySchema.optional(),
    missing_fields: z.array(z.string()).optional(),
    clarification: ClarificationSchema.optional(),
    products: z.array(NormalizedProductSchema).optional(),
    selected_product: NormalizedProductSchema.optional(),
    purchase_confirmation: PurchaseConfirmationSchema.optional(),
    preference_updates: z.record(z.string(), z.unknown()).optional(),
    errors: z.array(ErrorObjectSchema).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});
export type StateEnvelope = z.infer<typeof StateEnvelopeSchema>;
