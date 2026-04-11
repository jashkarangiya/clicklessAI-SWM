/**
 * ClickLess AI – Chat Store (Zustand)
 *
 * Manages all chat messages, typing indicator, and send-in-progress state.
 * Does NOT talk to WebSocket — that's the responsibility of useClicklessSocket.
 */
import { create } from 'zustand';
import type { FrontendChatMessage } from '@/contracts/chat';

interface ChatState {
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
    setStatus: (text: string | null) => void;
    setTyping: (typing: boolean) => void;
    setSending: (sending: boolean) => void;
    clearHistory: () => void;
    loadMessages: (msgs: FrontendChatMessage[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
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

    setStatus: (text) => set({ statusText: text }),
    setTyping: (typing) => set({ isTyping: typing }),
    setSending: (sending) => set({ isSending: sending }),
    clearHistory: () => set({ messages: [], statusText: null }),
    loadMessages: (msgs) => set({ messages: msgs, statusText: null, isTyping: false, isSending: false }),
}));
