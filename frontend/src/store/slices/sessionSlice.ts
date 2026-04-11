import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SiteConnectionStatus } from '@/contracts/preferences';
import type { ConnectionState } from '@/lib/ws/SocketClient';

export interface User {
    id: string;
    email: string;
    name: string;
    image?: string | null;
}

export interface AmazonSessionDetails {
    active: boolean;
    last_verified: string;
    browser_context_id: string;
}

export interface SessionState {
    user: User | null;
    sessionId: string | null;
    token: string | null;
    wsState: ConnectionState;
    siteConnections: SiteConnectionStatus;
    amazonSessionDetails: AmazonSessionDetails | null;
}

const initialState: SessionState = {
    user: null,
    sessionId: null,
    token: null,
    wsState: 'idle',
    siteConnections: { amazon: 'disconnected', walmart: 'disconnected' },
    amazonSessionDetails: null,
};

export const sessionSlice = createSlice({
    name: 'session',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<{ user: User; token: string }>) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
        },
        setSessionId: (state, action: PayloadAction<string>) => {
            state.sessionId = action.payload;
        },
        setWsState: (state, action: PayloadAction<ConnectionState>) => {
            state.wsState = action.payload;
        },
        setSiteConnections: (state, action: PayloadAction<SiteConnectionStatus>) => {
            state.siteConnections = action.payload;
        },
        setAmazonSessionDetails: (state, action: PayloadAction<AmazonSessionDetails | null>) => {
            state.amazonSessionDetails = action.payload;
        },
        updateUser: (state, action: PayloadAction<Partial<User>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.sessionId = null;
            state.amazonSessionDetails = null;
            state.siteConnections = { amazon: 'disconnected', walmart: 'disconnected' };
        },
    },
});

export const {
    setUser,
    setSessionId,
    setWsState,
    setSiteConnections,
    setAmazonSessionDetails,
    updateUser,
    logout,
} = sessionSlice.actions;

export default sessionSlice.reducer;
