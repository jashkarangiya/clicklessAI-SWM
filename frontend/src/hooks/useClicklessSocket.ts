'use client';
/**
 * ClickLess AI – useClicklessSocket
 *
 * React hook that manages WebSocket lifecycle tied to a session.
 * In mock mode (NEXT_PUBLIC_USE_MOCKS=true) it uses the mock transport.
 *
 * Returns:
 *   wsState  – current ConnectionState
 *   send     – typed send function
 *   connect  – start connection
 *   disconnect – close connection
 */
import { useEffect, useRef, useCallback } from 'react';
import { SocketClient, type ConnectionState } from '@/lib/ws/SocketClient';
import { adaptIncomingMessage } from '@/lib/adapters/messageAdapter';
import type { WebSocketOutgoingEvent } from '@/contracts/websocket';
import { useChatStore } from '@/stores/chatStore';
import { useSessionStore } from '@/stores/sessionStore';
import { MockSocketTransport } from '@/lib/mocks/mockSocketTransport';

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000/ws';

export function useClicklessSocket() {
    const clientRef = useRef<SocketClient | MockSocketTransport | null>(null);
    const setWsState = useSessionStore((s) => s.setWsState);
    const setSiteConns = useSessionStore((s) => s.setSiteConnections);
    const addMessage = useChatStore((s) => s.addMessage);
    const setTyping = useChatStore((s) => s.setTyping);
    const setStatus = useChatStore((s) => s.setStatus);

    const handleMessage = useCallback((raw: string) => {
        // Peek at event type to handle session_state separately
        try {
            const parsed = JSON.parse(raw) as { event?: string; amazon?: string; walmart?: string };
            if (parsed.event === 'session_state') {
                setSiteConns({
                    amazon: (parsed.amazon as 'connected' | 'disconnected' | 'expired') ?? 'disconnected',
                    walmart: (parsed.walmart as 'connected' | 'disconnected' | 'expired') ?? 'disconnected',
                });
                return;
            }
            if (parsed.event === 'status_update') {
                setTyping(true);
                setStatus((parsed as { message: string }).message ?? null);
            } else {
                setTyping(false);
                setStatus(null);
            }
        } catch { /* ignore parse errors here; adapter handles them */ }

        const msg = adaptIncomingMessage(raw);
        if (msg) addMessage(msg);
    }, [addMessage, setSiteConns, setTyping, setStatus]);

    const handleStateChange = useCallback((state: ConnectionState) => {
        setWsState(state);
    }, [setWsState]);

    const connect = useCallback(() => {
        if (clientRef.current) return;
        if (USE_MOCKS) {
            const mock = new MockSocketTransport({ onMessage: handleMessage, onStateChange: handleStateChange });
            clientRef.current = mock;
            mock.connect();
        } else {
            const client = new SocketClient({ url: WS_URL, onMessage: handleMessage, onStateChange: handleStateChange });
            clientRef.current = client;
            client.connect();
        }
    }, [handleMessage, handleStateChange]);

    const disconnect = useCallback(() => {
        clientRef.current?.disconnect();
        clientRef.current = null;
    }, []);

    const send = useCallback((event: WebSocketOutgoingEvent) => {
        clientRef.current?.send(event);
    }, []);

    // Cleanup on unmount
    useEffect(() => { return () => { clientRef.current?.disconnect(); }; }, [disconnect]);

    return { connect, disconnect, send };
}
