/**
 * ClickLess AI – Chat Message Contracts
 *
 * FrontendChatMessage is a discriminated union covering all message
 * types that can appear in the chat timeline.
 */
import { z } from 'zod';
import { NormalizedProductSchema } from './product';
import { PurchaseConfirmationSchema } from './purchase';
import { ErrorObjectSchema } from './common';

// ─── Clarification ─────────────────────────────────────────────────────────
export const ClarificationOptionSchema = z.object({
    id: z.string(),
    label: z.string(),
    value: z.string(),
});
export type ClarificationOption = z.infer<typeof ClarificationOptionSchema>;

export const ClarificationSchema = z.object({
    question: z.string(),
    options: z.array(ClarificationOptionSchema).optional(),
    free_text: z.boolean().optional(),
    field: z.string().optional(),
});
export type Clarification = z.infer<typeof ClarificationSchema>;

// ─── Purchase Progress ─────────────────────────────────────────────────────
export const PurchaseProgressSchema = z.object({
    stage: z.enum(['cart', 'address', 'payment', 'placing', 'confirming']),
    message: z.string(),
    pct: z.number().min(0).max(100).optional(),
});
export type PurchaseProgress = z.infer<typeof PurchaseProgressSchema>;

// ─── Frontend Chat Message – Discriminated Union ───────────────────────────
const BaseMessage = z.object({
    id: z.string(),
    timestamp: z.string(),
    role: z.enum(['user', 'assistant', 'system']),
});

export const TextMessageSchema = BaseMessage.extend({
    type: z.literal('text'),
    content: z.string(),
    isStreaming: z.boolean().optional(),
});

export const StatusMessageSchema = BaseMessage.extend({
    type: z.literal('status'),
    content: z.string(),
    transient: z.boolean().optional(),
});

export const ClarificationMessageSchema = BaseMessage.extend({
    type: z.literal('clarification'),
    clarification: ClarificationSchema,
    selectedOption: z.string().optional(),
});

export const ProductResultsMessageSchema = BaseMessage.extend({
    type: z.literal('product_results'),
    products: z.array(NormalizedProductSchema),
    summary: z.string().optional(),
});

export const ConfirmationRequestMessageSchema = BaseMessage.extend({
    type: z.literal('confirmation_request'),
    confirmation: PurchaseConfirmationSchema,
});

export const PurchaseProgressMessageSchema = BaseMessage.extend({
    type: z.literal('purchase_progress'),
    progress: PurchaseProgressSchema,
});

export const PurchaseSuccessMessageSchema = BaseMessage.extend({
    type: z.literal('purchase_success'),
    order_id: z.string(),
    product_name: z.string(),
    delivery_label: z.string().optional(),
    image_url: z.string().optional(),
});

export const ErrorMessageSchema = BaseMessage.extend({
    type: z.literal('error'),
    error: ErrorObjectSchema,
});

export const SessionExpiredMessageSchema = BaseMessage.extend({
    type: z.literal('session_expired'),
    source: z.enum(['amazon', 'walmart', 'other']).optional(),
});

export const FrontendChatMessageSchema = z.discriminatedUnion('type', [
    TextMessageSchema,
    StatusMessageSchema,
    ClarificationMessageSchema,
    ProductResultsMessageSchema,
    ConfirmationRequestMessageSchema,
    PurchaseProgressMessageSchema,
    PurchaseSuccessMessageSchema,
    ErrorMessageSchema,
    SessionExpiredMessageSchema,
]);
export type FrontendChatMessage = z.infer<typeof FrontendChatMessageSchema>;

// Type helpers
export type TextMessage = z.infer<typeof TextMessageSchema>;
export type StatusMessage = z.infer<typeof StatusMessageSchema>;
export type ClarificationMessage = z.infer<typeof ClarificationMessageSchema>;
export type ProductResultsMessage = z.infer<typeof ProductResultsMessageSchema>;
export type ConfirmationRequest = z.infer<typeof ConfirmationRequestMessageSchema>;
export type PurchaseProgressMessage = z.infer<typeof PurchaseProgressMessageSchema>;
export type PurchaseSuccessMessage = z.infer<typeof PurchaseSuccessMessageSchema>;
export type ErrorMessage = z.infer<typeof ErrorMessageSchema>;
export type SessionExpiredMessage = z.infer<typeof SessionExpiredMessageSchema>;
