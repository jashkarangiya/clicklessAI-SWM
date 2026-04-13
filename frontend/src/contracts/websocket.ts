/**
 * ClickLess AI – WebSocket Event Contracts
 *
 * Typed discriminated unions for all incoming/outgoing WebSocket messages.
 */
import { z } from 'zod';
import { NormalizedProductSchema, type NormalizedProduct } from './product';
import { PurchaseConfirmationSchema } from './purchase';
import { ClarificationSchema } from './chat';

// ─── Incoming Events (server → client) ────────────────────────────────────
const BaseIncoming = z.object({ session_id: z.string().optional() });

export const StatusUpdateEventSchema = BaseIncoming.extend({
    event: z.literal('status_update'),
    message: z.string(),
    stage: z.string().optional(),
});

export const ProductResultsEventSchema = BaseIncoming.extend({
    event: z.literal('product_results'),
    products: z.array(NormalizedProductSchema),
    summary: z.string().optional(),
});

export const ClarificationEventSchema = BaseIncoming.extend({
    event: z.literal('clarification'),
    clarification: ClarificationSchema,
});

export const ConfirmationRequestEventSchema = BaseIncoming.extend({
    event: z.literal('confirmation_request'),
    confirmation: PurchaseConfirmationSchema,
});

export const PurchaseProgressEventSchema = BaseIncoming.extend({
    event: z.literal('purchase_progress'),
    stage: z.enum(['cart', 'address', 'payment', 'placing', 'confirming']),
    message: z.string(),
    pct: z.number().optional(),
});

export const ErrorEventSchema = BaseIncoming.extend({
    event: z.literal('error'),
    code: z.string(),
    message: z.string(),
    retryable: z.boolean().optional(),
    details: z.record(z.string(), z.unknown()).optional(),
});

export const SuccessEventSchema = BaseIncoming.extend({
    event: z.literal('success'),
    order_id: z.string(),
    product_name: z.string(),
    delivery_label: z.string().optional(),
    image_url: z.string().optional(),
});

export const SessionStateEventSchema = BaseIncoming.extend({
    event: z.literal('session_state'),
    amazon: z.enum(['connected', 'disconnected', 'expired']).optional(),
    walmart: z.enum(['connected', 'disconnected', 'expired']).optional(),
});

export const ConnectionStatusEventSchema = BaseIncoming.extend({
    event: z.literal('connection_status'),
    status: z.enum(['connected', 'reconnecting', 'disconnected']),
    message: z.string().optional(),
});

// Backend sends plain LLM text responses (e.g. cart confirmation, direct-buy result)
export const AssistantMessageEventSchema = BaseIncoming.extend({
    event: z.literal('assistant_message'),
    content: z.string(),
});

// Streaming LLM responses — three-phase protocol
export const StreamStartEventSchema = BaseIncoming.extend({
    event: z.literal('stream_start'),
    message_id: z.string(),
});

export const StreamTokenEventSchema = BaseIncoming.extend({
    event: z.literal('stream_token'),
    message_id: z.string(),
    token: z.string(),
});

export const StreamEndEventSchema = BaseIncoming.extend({
    event: z.literal('stream_end'),
    message_id: z.string(),
});

export const WebSocketIncomingEventSchema = z.discriminatedUnion('event', [
    StatusUpdateEventSchema,
    ProductResultsEventSchema,
    ClarificationEventSchema,
    ConfirmationRequestEventSchema,
    PurchaseProgressEventSchema,
    ErrorEventSchema,
    SuccessEventSchema,
    SessionStateEventSchema,
    ConnectionStatusEventSchema,
    AssistantMessageEventSchema,
    StreamStartEventSchema,
    StreamTokenEventSchema,
    StreamEndEventSchema,
]);
export type WebSocketIncomingEvent = z.infer<typeof WebSocketIncomingEventSchema>;

// ─── Outgoing Events (client → server) ────────────────────────────────────
export type WebSocketOutgoingEvent =
    | { event: 'user_message'; session_id: string; content: string; user_id?: string }
    | { event: 'clarification_reply'; session_id: string; option_id?: string; free_text?: string }
    | { event: 'purchase_confirm'; session_id: string; confirmation_id: string; confirmed: boolean }
    | { event: 'direct_buy'; session_id: string; user_id: string; product: NormalizedProduct; confirmation_id: string }
    | { event: 'ping' };
