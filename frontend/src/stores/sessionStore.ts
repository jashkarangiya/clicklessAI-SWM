/**
 * ClickLess AI – Session Store (Zustand)
 *
 * Manages auth state, session ID, and site connection statuses.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SiteConnectionStatus } from '@/contracts/preferences';
import type { ConnectionState } from '@/lib/ws/SocketClient';

interface User {
    id: string;
    email: string;
    name: string;
}

interface AmazonSessionDetails {
    active: boolean;
    last_verified: string;
    browser_context_id: string;
}

interface SessionState {
    user: User | null;
    sessionId: string | null;
    token: string | null;
    wsState: ConnectionState;
    siteConnections: SiteConnectionStatus;
    amazonSessionDetails: AmazonSessionDetails | null;

    // Actions
    setUser: (user: User, token: string) => void;
    setSessionId: (id: string) => void;
    setWsState: (state: ConnectionState) => void;
    setSiteConnections: (c: SiteConnectionStatus) => void;
    setAmazonSessionDetails: (details: AmazonSessionDetails | null) => void;
    logout: () => void;
}

export const useSessionStore = create<SessionState>()(
    persist(
        (set) => ({
            user: null,
            sessionId: null,
            token: null,
            wsState: 'idle',
            siteConnections: { amazon: 'disconnected', walmart: 'disconnected' },
            amazonSessionDetails: null,

            setUser: (user, token) => set({ user, token }),
            setSessionId: (id) => set({ sessionId: id }),
            setWsState: (wsState) => set({ wsState }),
            setSiteConnections: (c) => set({ siteConnections: c }),
            setAmazonSessionDetails: (details) => set({ amazonSessionDetails: details }),
            logout: () => set({ user: null, token: null, sessionId: null, amazonSessionDetails: null }),
        }),
        { name: 'cl-session', partialize: (s) => ({ user: s.user, token: s.token, siteConnections: s.siteConnections, amazonSessionDetails: s.amazonSessionDetails }) }
    )
);
