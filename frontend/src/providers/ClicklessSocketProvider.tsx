'use client';
/**
 * Single WebSocket for the whole authenticated app shell.
 *
 * Keeps the chat API connection alive when navigating Chat → Settings so the
 * header badge stays accurate. Handles the three-phase streaming protocol:
 *   stream_start  → creates an empty assistant message with isStreaming:true
 *   stream_token  → appends each token to that message
 *   stream_end    → marks the message as done (isStreaming:false)
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { SocketClient, type ConnectionState } from '@/lib/ws/SocketClient';
import { adaptIncomingMessage } from '@/lib/adapters/messageAdapter';
import type { WebSocketOutgoingEvent } from '@/contracts/websocket';
import { useChatStore } from '@/stores/chatStore';
import { useOrderStore } from '@/stores/orderStore';
import { useAppDispatch } from '@/store/hooks';
import { setWsState, setSiteConnections } from '@/store/slices/sessionSlice';
import { nanoid } from '@/lib/utils/formatters';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000/ws';

type ClicklessSocketContextValue = {
  send: (event: WebSocketOutgoingEvent) => void;
  disconnect: () => void;
};

const ClicklessSocketContext = createContext<ClicklessSocketContextValue | null>(null);

export function ClicklessSocketProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef<SocketClient | null>(null);
  const dispatch = useAppDispatch();
  const addMessage    = useChatStore((s) => s.addMessage);
  const appendToMessage = useChatStore((s) => s.appendToMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const setTyping     = useChatStore((s) => s.setTyping);
  const setStatus     = useChatStore((s) => s.setStatus);
  const addOrder      = useOrderStore((s) => s.addOrder);

  // Track active streaming message so stream_token knows which message to update
  const streamingMsgIdRef = useRef<string | null>(null);

  const handleMessage = useCallback(
    (raw: string) => {
      try {
        const parsed = JSON.parse(raw) as {
          event?: string;
          amazon?: string;
          walmart?: string;
          order_id?: string;
          product_name?: string;
          image_url?: string;
          message_id?: string;
          token?: string;
        };

        // ── Session state (not a chat message) ───────────────────────────────
        if (parsed.event === 'session_state') {
          dispatch(
            setSiteConnections({
              amazon: (parsed.amazon as 'connected' | 'disconnected' | 'expired') ?? 'disconnected',
              walmart: (parsed.walmart as 'connected' | 'disconnected' | 'expired') ?? 'disconnected',
            }),
          );
          return;
        }

        // ── Typing / status indicator ─────────────────────────────────────────
        if (parsed.event === 'status_update') {
          setTyping(true);
          setStatus((parsed as { message: string }).message ?? null);
        } else if (parsed.event !== 'stream_token') {
          // stream_token events don't clear typing (streaming IS the typing state)
          setTyping(false);
          setStatus(null);
        }

        // ── Persist successful orders ─────────────────────────────────────────
        if (parsed.event === 'success' && parsed.order_id && parsed.product_name) {
          addOrder({
            order_id: parsed.order_id,
            product_name: parsed.product_name,
            source: 'amazon',
            price: 0,
            currency: 'USD',
            status: 'placed',
            placed_at: new Date().toISOString(),
            image_url: parsed.image_url,
          });
        }

        // ── Streaming protocol ────────────────────────────────────────────────
        if (parsed.event === 'stream_start') {
          const msgId = parsed.message_id ?? nanoid();
          streamingMsgIdRef.current = msgId;
          addMessage({
            id: msgId,
            type: 'text',
            role: 'assistant',
            timestamp: new Date().toISOString(),
            content: '',
            isStreaming: true,
          });
          return;
        }

        if (parsed.event === 'stream_token') {
          const id = streamingMsgIdRef.current ?? parsed.message_id;
          if (id && parsed.token) {
            appendToMessage(id, parsed.token);
          }
          return;
        }

        if (parsed.event === 'stream_end') {
          const id = streamingMsgIdRef.current ?? parsed.message_id;
          if (id) {
            updateMessage(id, { isStreaming: false } as never);
            streamingMsgIdRef.current = null;
          }
          return;
        }
      } catch {
        /* ignore parse errors — adapter handles them below */
      }

      // ── All other events go through the adapter ───────────────────────────
      const msg = adaptIncomingMessage(raw);
      if (msg) addMessage(msg);
    },
    [addMessage, appendToMessage, updateMessage, addOrder, dispatch, setTyping, setStatus],
  );

  const handleStateChange = useCallback(
    (state: ConnectionState) => {
      dispatch(setWsState(state));
    },
    [dispatch],
  );

  const connect = useCallback(() => {
    if (clientRef.current) return;
    const client = new SocketClient({
      url: WS_URL,
      onMessage: handleMessage,
      onStateChange: handleStateChange,
    });
    clientRef.current = client;
    client.connect();
  }, [handleMessage, handleStateChange]);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
    clientRef.current = null;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const send = useCallback((event: WebSocketOutgoingEvent) => {
    clientRef.current?.send(event);
  }, []);

  const value = useMemo(() => ({ send, disconnect }), [send, disconnect]);

  return (
    <ClicklessSocketContext.Provider value={value}>{children}</ClicklessSocketContext.Provider>
  );
}

export function useClicklessSocket(): ClicklessSocketContextValue {
  const ctx = useContext(ClicklessSocketContext);
  if (!ctx) {
    throw new Error('useClicklessSocket must be used within ClicklessSocketProvider');
  }
  return ctx;
}
