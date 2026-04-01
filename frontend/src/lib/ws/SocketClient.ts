/**
 * ClickLess AI – WebSocket Client
 *
 * Robust WebSocket wrapper with:
 * - Typed message sending (WebSocketOutgoingEvent)
 * - Reconnection with exponential backoff + jitter (max 30s)
 * - Connection state machine: idle | connecting | connected | reconnecting | closed
 * - Clean event subscription and teardown
 *
 * This class is transport-only — it does NOT parse messages or manage chat state.
 * Use the messageAdapter to convert raw events to FrontendChatMessage.
 */
import type { WebSocketOutgoingEvent } from '@/contracts/websocket';

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'closed';

export interface SocketClientOptions {
    url: string;
    maxReconnectAttempts?: number;
    baseDelayMs?: number;
    onMessage: (raw: string) => void;
    onStateChange: (state: ConnectionState) => void;
    onError?: (event: Event) => void;
}

export class SocketClient {
    private ws: WebSocket | null = null;
    private state: ConnectionState = 'idle';
    private attempts = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private shouldClose = false;

    constructor(private readonly options: SocketClientOptions) { }

    get connectionState(): ConnectionState {
        return this.state;
    }

    connect(): void {
        if (this.state === 'connected' || this.state === 'connecting') return;
        this.shouldClose = false;
        this.setState('connecting');
        this.createSocket();
    }

    disconnect(): void {
        this.shouldClose = true;
        this.clearReconnectTimer();
        this.setState('closed');
        this.ws?.close(1000, 'client_close');
        this.ws = null;
    }

    send(event: WebSocketOutgoingEvent): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(event));
        }
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private createSocket(): void {
        this.ws = new WebSocket(this.options.url);

        this.ws.onopen = () => {
            this.attempts = 0;
            this.setState('connected');
        };

        this.ws.onmessage = (e: MessageEvent) => {
            if (typeof e.data === 'string') this.options.onMessage(e.data);
        };

        this.ws.onerror = (e) => {
            this.options.onError?.(e);
        };

        this.ws.onclose = (e) => {
            if (this.shouldClose) return;
            const max = this.options.maxReconnectAttempts ?? 10;
            if (this.attempts >= max) {
                this.setState('closed');
                return;
            }
            this.scheduleReconnect();
        };
    }

    private scheduleReconnect(): void {
        this.setState('reconnecting');
        this.attempts++;
        const base = this.options.baseDelayMs ?? 1000;
        const backoff = Math.min(base * 2 ** (this.attempts - 1), 30_000);
        const jitter = Math.random() * 0.3 * backoff;
        this.reconnectTimer = setTimeout(() => {
            this.setState('connecting');
            this.createSocket();
        }, backoff + jitter);
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimer !== null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    private setState(next: ConnectionState): void {
        this.state = next;
        this.options.onStateChange(next);
    }
}
