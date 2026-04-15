'use client';
/**
 * ClickLess AI – useClicklessSocket
 *
 * React hook that manages WebSocket lifecycle tied to a session.
 * Used only for standalone contexts outside ClicklessSocketProvider.
 */
import { useEffect, useRef, useCallback } from 'react';
import { SocketClient, type ConnectionState } from '@/lib/ws/SocketClient';
import { adaptIncomingMessage } from '@/lib/adapters/messageAdapter';
import type { WebSocketOutgoingEvent } from '@/contracts/websocket';
import { useChatStore } from '@/stores/chatStore';
import { useAppDispatch } from '@/store/hooks';
import { setWsState, setSiteConnections } from '@/store/slices/sessionSlice';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000/ws';

export function useClicklessSocket() {
    const clientRef = useRef<SocketClient | null>(null);
    const dispatch = useAppDispatch();
    const addMessage = useChatStore((s) => s.addMessage);
    const setTyping = useChatStore((s) => s.setTyping);
    const setStatus = useChatStore((s) => s.setStatus);

    const handleMessage = useCallback((raw: string) => {
        // Peek at event type to handle session_state separately
        try {
            const parsed = JSON.parse(raw) as { event?: string; amazon?: string; walmart?: string };
            if (parsed.event === 'session_state') {
                dispatch(setSiteConnections({
                    amazon: (parsed.amazon as 'connected' | 'disconnected' | 'expired') ?? 'disconnected',
                    walmart: (parsed.walmart as 'connected' | 'disconnected' | 'expired') ?? 'disconnected',
                }));
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
    }, [addMessage, dispatch, setTyping, setStatus]);

    const handleStateChange = useCallback((state: ConnectionState) => {
        dispatch(setWsState(state));
    }, [dispatch]);

    const connect = useCallback(() => {
        if (clientRef.current) return;
        const client = new SocketClient({ url: WS_URL, onMessage: handleMessage, onStateChange: handleStateChange });
        clientRef.current = client;
        client.connect();
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
