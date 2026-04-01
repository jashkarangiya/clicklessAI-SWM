/**
 * WebSocket event → message adapter mapping tests
 */
import { adaptIncomingMessage } from '@/lib/adapters/messageAdapter';
import { MOCK_PRODUCTS, MOCK_CONFIRMATION } from '@/lib/mocks/fixtures';

const toRaw = (data: object) => JSON.stringify(data);

describe('messageAdapter', () => {
    it('maps status_update to transient StatusMessage', () => {
        const result = adaptIncomingMessage(toRaw({ event: 'status_update', message: 'Searching Amazon...' }));
        expect(result?.type).toBe('status');
        if (result?.type === 'status') expect(result.transient).toBe(true);
    });

    it('maps product_results to ProductResultsMessage', () => {
        const result = adaptIncomingMessage(toRaw({ event: 'product_results', products: MOCK_PRODUCTS }));
        expect(result?.type).toBe('product_results');
        if (result?.type === 'product_results') expect(result.products).toHaveLength(2);
    });

    it('maps clarification event to ClarificationMessage', () => {
        const result = adaptIncomingMessage(toRaw({
            event: 'clarification',
            clarification: { question: 'Color?', options: [{ id: '1', label: 'Black', value: 'black' }] },
        }));
        expect(result?.type).toBe('clarification');
    });

    it('maps confirmation_request to ConfirmationRequest', () => {
        const result = adaptIncomingMessage(toRaw({ event: 'confirmation_request', confirmation: MOCK_CONFIRMATION }));
        expect(result?.type).toBe('confirmation_request');
    });

    it('maps error event to ErrorMessage', () => {
        const result = adaptIncomingMessage(toRaw({ event: 'error', code: 'CHECKOUT_FAILED', message: 'Something failed', retryable: false }));
        expect(result?.type).toBe('error');
        if (result?.type === 'error') expect(result.error.code).toBe('CHECKOUT_FAILED');
    });

    it('maps success event to PurchaseSuccessMessage', () => {
        const result = adaptIncomingMessage(toRaw({ event: 'success', order_id: 'ORD-001', product_name: 'Test Product' }));
        expect(result?.type).toBe('purchase_success');
        if (result?.type === 'purchase_success') expect(result.order_id).toBe('ORD-001');
    });

    it('returns null for session_state events (handled by sessionStore)', () => {
        const result = adaptIncomingMessage(toRaw({ event: 'session_state', amazon: 'expired' }));
        expect(result).toBeNull();
    });

    it('returns null for malformed JSON', () => {
        const result = adaptIncomingMessage('not valid json {{{');
        expect(result).toBeNull();
    });

    it('returns null for unknown event type', () => {
        const result = adaptIncomingMessage(toRaw({ event: 'unknown_event_xyz' }));
        expect(result).toBeNull();
    });
});
