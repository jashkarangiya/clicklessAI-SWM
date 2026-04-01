/**
 * ClickLess AI – Mock Socket Transport
 *
 * Simulates WebSocket with timed event sequences.
 * Scenarios are selected based on the last user message content.
 *
 * Has the same interface as SocketClient (connect/disconnect/send)
 * so it can be swapped transparently by useClicklessSocket.
 */
import type { ConnectionState } from '@/lib/ws/SocketClient';
import type { WebSocketOutgoingEvent } from '@/contracts/websocket';
import { MOCK_PRODUCTS, MOCK_CONFIRMATION } from './fixtures';

interface MockOptions {
    onMessage: (raw: string) => void;
    onStateChange: (state: ConnectionState) => void;
}

type Scenario = 'search' | 'clarification' | 'confirmation' | 'success' | 'failure' | 'session_expired' | 'price_changed' | 'captcha';

export class MockSocketTransport {
    private timers: ReturnType<typeof setTimeout>[] = [];
    private _state: ConnectionState = 'idle';

    constructor(private readonly opts: MockOptions) { }

    connect(): void {
        this.setState('connecting');
        const t = setTimeout(() => {
            this.setState('connected');
            this.emit({ event: 'connection_status', status: 'connected', message: 'Connected to ClickLess AI' });
        }, 600);
        this.timers.push(t);
    }

    disconnect(): void {
        this.timers.forEach(clearTimeout);
        this.timers = [];
        this.setState('closed');
    }

    get connectionState(): ConnectionState { return this._state; }

    send(event: WebSocketOutgoingEvent): void {
        if (event.event === 'user_message') {
            const scenario = this.detectScenario(event.content);
            this.runScenario(scenario);
        }
        if (event.event === 'clarification_reply') {
            this.runScenario('confirmation');
        }
        if (event.event === 'purchase_confirm' && event.confirmed) {
            this.runPurchaseProgress();
        }
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private detectScenario(content: string): Scenario {
        const c = content.toLowerCase();
        if (c.includes('expire') || c.includes('session')) return 'session_expired';
        if (c.includes('captcha')) return 'captcha';
        if (c.includes('fail') || c.includes('error')) return 'failure';
        if (c.includes('confirm') || c.includes('buy now')) return 'confirmation';
        if (c.includes('clarif') || c.includes('color')) return 'clarification';
        return 'search';
    }

    private runScenario(scenario: Scenario): void {
        switch (scenario) {
            case 'search': return this.runSearch();
            case 'clarification': return this.runClarification();
            case 'confirmation': return this.runConfirmation();
            case 'failure': return this.runFailure();
            case 'session_expired': return this.runSessionExpired();
            case 'captcha': return this.runCaptcha();
            default: return this.runSearch();
        }
    }

    private runSearch(): void {
        this.delay(300, () => this.emit({ event: 'status_update', message: 'Searching Amazon...' }));
        this.delay(900, () => this.emit({ event: 'status_update', message: 'Searching Walmart...' }));
        this.delay(1600, () => this.emit({ event: 'status_update', message: 'Ranking results...' }));
        this.delay(2400, () => this.emit({ event: 'product_results', products: MOCK_PRODUCTS, summary: "Here are the best wireless noise-canceling headphones I found. The Sony XM5 is my top pick for its premium noise cancellation and fast Prime delivery." }));
    }

    private runClarification(): void {
        this.delay(800, () => this.emit({
            event: 'clarification',
            clarification: {
                question: 'What color would you prefer?',
                options: [
                    { id: 'c1', label: 'Black', value: 'black' },
                    { id: 'c2', label: 'White / Silver', value: 'white' },
                    { id: 'c3', label: 'I don\'t mind', value: 'any' },
                ],
                free_text: false,
                field: 'color',
            },
        }));
    }

    private runConfirmation(): void {
        this.delay(500, () => this.emit({ event: 'status_update', message: 'Preparing your order...' }));
        this.delay(1400, () => this.emit({ event: 'confirmation_request', confirmation: MOCK_CONFIRMATION }));
    }

    private runPurchaseProgress(): void {
        this.delay(400, () => this.emit({ event: 'purchase_progress', stage: 'cart', message: 'Adding to cart...', pct: 15 }));
        this.delay(1200, () => this.emit({ event: 'purchase_progress', stage: 'address', message: 'Verifying address...', pct: 35 }));
        this.delay(2000, () => this.emit({ event: 'purchase_progress', stage: 'payment', message: 'Verifying payment...', pct: 55 }));
        this.delay(2800, () => this.emit({ event: 'purchase_progress', stage: 'placing', message: 'Placing order...', pct: 80 }));
        this.delay(3800, () => this.emit({ event: 'success', order_id: 'AMZ-2024-XM5-001', product_name: 'Sony WH-1000XM5', delivery_label: 'Arrives tomorrow by 8pm' }));
    }

    private runFailure(): void {
        this.delay(600, () => this.emit({ event: 'status_update', message: 'Attempting checkout...' }));
        this.delay(1500, () => this.emit({ event: 'error', code: 'CHECKOUT_FAILED', message: 'Checkout failed due to a payment mismatch. Please verify your card details in Settings.', retryable: false }));
    }

    private runSessionExpired(): void {
        this.delay(400, () => this.emit({ event: 'session_state', amazon: 'expired', walmart: 'connected' }));
        this.delay(800, () => this.emit({ event: 'error', code: 'SESSION_EXPIRED', message: 'Your Amazon session has expired. Please reconnect in Settings → Connections.', retryable: false }));
    }

    private runCaptcha(): void {
        this.delay(600, () => this.emit({ event: 'status_update', message: 'Processing checkout...' }));
        this.delay(1400, () => this.emit({ event: 'error', code: 'CAPTCHA_REQUIRED', message: 'A CAPTCHA was detected during checkout. Please log into Amazon manually and try again.', retryable: true }));
    }

    private emit(data: object): void {
        this.opts.onMessage(JSON.stringify(data));
    }

    private delay(ms: number, fn: () => void): void {
        this.timers.push(setTimeout(fn, ms));
    }

    private setState(s: ConnectionState): void {
        this._state = s;
        this.opts.onStateChange(s);
    }
}
