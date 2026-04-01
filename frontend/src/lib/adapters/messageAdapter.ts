/**
 * ClickLess AI – Message Adapter
 *
 * Maps raw WebSocketIncomingEvent → FrontendChatMessage (or null for transient events).
 *
 * Transient events (status_update, connection_status) return a StatusMessage
 * with transient:true so the chat store can decide whether to persist them.
 *
 * This is the isolation layer: when backend contracts change, only this file changes.
 */
import { WebSocketIncomingEventSchema, type WebSocketIncomingEvent } from '@/contracts/websocket';
import type { FrontendChatMessage } from '@/contracts/chat';
import { nanoid } from '@/lib/utils/formatters';

function now(): string {
    return new Date().toISOString();
}

/**
 * Parse raw JSON string from WebSocket and map to FrontendChatMessage.
 * Returns null if the message should be silently discarded (e.g. parse failure).
 */
export function adaptIncomingMessage(raw: string): FrontendChatMessage | null {
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        console.warn('[Adapter] Failed to parse WS message:', raw);
        return null;
    }

    const result = WebSocketIncomingEventSchema.safeParse(parsed);
    if (!result.success) {
        console.warn('[Adapter] Unknown WS event shape:', parsed, result.error.issues);
        return null;
    }

    const event: WebSocketIncomingEvent = result.data;

    switch (event.event) {
        case 'status_update':
            return {
                id: nanoid(), type: 'status', role: 'system', timestamp: now(),
                content: event.message, transient: true,
            };

        case 'product_results':
            return {
                id: nanoid(), type: 'product_results', role: 'assistant', timestamp: now(),
                products: event.products, summary: event.summary,
            };

        case 'clarification':
            return {
                id: nanoid(), type: 'clarification', role: 'assistant', timestamp: now(),
                clarification: event.clarification,
            };

        case 'confirmation_request':
            return {
                id: nanoid(), type: 'confirmation_request', role: 'assistant', timestamp: now(),
                confirmation: event.confirmation,
            };

        case 'purchase_progress':
            return {
                id: nanoid(), type: 'purchase_progress', role: 'system', timestamp: now(),
                progress: { stage: event.stage, message: event.message, pct: event.pct },
            };

        case 'error':
            return {
                id: nanoid(), type: 'error', role: 'system', timestamp: now(),
                error: { code: event.code, message: event.message, retryable: event.retryable, details: event.details },
            };

        case 'success':
            return {
                id: nanoid(), type: 'purchase_success', role: 'system', timestamp: now(),
                order_id: event.order_id,
                product_name: event.product_name,
                delivery_label: event.delivery_label,
                image_url: event.image_url,
            };

        case 'session_state':
            // Not a chat message — handled by sessionStore. Return null.
            return null;

        case 'connection_status':
            return {
                id: nanoid(), type: 'status', role: 'system', timestamp: now(),
                content: event.message ?? `Connection ${event.status}`,
                transient: event.status === 'connected',
            };

        default:
            return null;
    }
}
