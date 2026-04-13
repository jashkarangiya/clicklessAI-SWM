/**
 * ClickLess AI – Chat Store (Zustand)
 *
 * Manages all chat messages, typing indicator, and send-in-progress state.
 * Does NOT talk to WebSocket — that's the responsibility of useClicklessSocket.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FrontendChatMessage } from '@/contracts/chat';
import { nanoid } from '@/lib/utils/formatters';

interface ChatState {
    /** Stable session ID sent as session_id on every WS message. Rotates on clearHistory. */
    conversationId: string;
    /** Full persistent message history */
    messages: FrontendChatMessage[];
    /** Current transient status text (e.g. "Searching Amazon...") */
    statusText: string | null;
    /** Whether assistant is typing / processing */
    isTyping: boolean;
    /** Whether a user-send is in flight */
    isSending: boolean;

    // Actions
    addMessage: (msg: FrontendChatMessage) => void;
    updateMessage: (id: string, patch: Partial<FrontendChatMessage>) => void;
    /** Append a streaming token to a text message (called per stream_token event). */
    appendToMessage: (id: string, token: string) => void;
    setStatus: (text: string | null) => void;
    setTyping: (typing: boolean) => void;
    setSending: (sending: boolean) => void;
    clearHistory: () => void;
    loadMessages: (msgs: FrontendChatMessage[]) => void;
    /** Load a saved session from history — sets conversationId + messages. */
    loadSession: (sessionId: string, msgs: FrontendChatMessage[]) => void;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set) => ({
            conversationId: nanoid(),
            messages: [],
            statusText: null,
            isTyping: false,
            isSending: false,

            addMessage: (msg) =>
                set((s) => ({ messages: [...s.messages, msg] })),

            updateMessage: (id, patch) =>
                set((s) => ({
                    messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } as FrontendChatMessage : m)),
                })),

            appendToMessage: (id, token) =>
                set((s) => ({
                    messages: s.messages.map((m) =>
                        m.id === id && m.type === 'text'
                            ? { ...m, content: m.content + token }
                            : m
                    ),
                })),

            setStatus: (text) => set({ statusText: text }),
            setTyping: (typing) => set({ isTyping: typing }),
            setSending: (sending) => set({ isSending: sending }),
            // New conversationId on clear so the backend starts a fresh LangGraph thread
            clearHistory: () => set({ messages: [], statusText: null, conversationId: nanoid() }),
            loadMessages: (msgs) => set({ messages: msgs, statusText: null, isTyping: false, isSending: false }),
            loadSession: (sessionId, msgs) => set({
                conversationId: sessionId,
                messages: msgs,
                statusText: null,
                isTyping: false,
                isSending: false,
            }),
        }),
        {
            name: 'clickless-chat',
            partialize: (s) => ({ conversationId: s.conversationId, messages: s.messages }),
        },
    ),
);
