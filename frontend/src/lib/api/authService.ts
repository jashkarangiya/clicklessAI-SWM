/**
 * ClickLess AI – Auth Service
 *
 * Thin service layer with mock stubs.
 * TODO: Replace mock implementations with real API calls when backend is ready.
 * Swap NEXT_PUBLIC_USE_MOCKS=false and implement the real* functions below.
 */

const getUseMocks = () => process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
const getApiBase = () => process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api';

export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface SignupRequest {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        name: string;
    };
}

// ── Mock implementations ───────────────────────────────────────────────────

async function mockLogin(req: LoginRequest): Promise<AuthResponse> {
    await delay(800);
    if (req.email === 'fail@test.com') throw new Error('Invalid credentials');
    return {
        token: 'mock-token-' + Math.random().toString(36).slice(2),
        user: { id: 'user-001', email: req.email, name: 'Alex Chen' },
    };
}

async function mockSignup(req: SignupRequest): Promise<AuthResponse> {
    await delay(1000);
    if (req.email === 'taken@test.com') throw new Error('Email already in use');
    return {
        token: 'mock-token-' + Math.random().toString(36).slice(2),
        user: { id: 'user-' + Math.random().toString(36).slice(2), email: req.email, name: req.name },
    };
}

async function mockGoogleLogin(token: string): Promise<AuthResponse> {
    await delay(800);
    if (!token) throw new Error('Invalid Google credential');
    return {
        token: 'mock-google-token-' + Math.random().toString(36).slice(2),
        user: { id: 'google-user-001', email: 'test.google@example.com', name: 'Google User' },
    };
}

// ── Real implementations (TODO) ────────────────────────────────────────────

async function realLogin(req: LoginRequest): Promise<AuthResponse> {
    const base = getApiBase();
    const res = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error((await res.json() as { message: string }).message ?? 'Login failed');
    return res.json() as Promise<AuthResponse>;
}

async function realSignup(req: SignupRequest): Promise<AuthResponse> {
    const base = getApiBase();
    const res = await fetch(`${base}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error((await res.json() as { message: string }).message ?? 'Signup failed');
    return res.json() as Promise<AuthResponse>;
}

async function realGoogleLogin(token: string): Promise<AuthResponse> {
    const base = getApiBase();
    const res = await fetch(`${base}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });
    if (!res.ok) throw new Error((await res.json() as { message: string }).message ?? 'Google Login failed');
    return res.json() as Promise<AuthResponse>;
}

// ── Exported API ───────────────────────────────────────────────────────────

export const authService = {
    login: (req: LoginRequest) => getUseMocks() ? mockLogin(req) : realLogin(req),
    signup: (req: SignupRequest) => getUseMocks() ? mockSignup(req) : realSignup(req),
    googleLogin: (token: string) => getUseMocks() ? mockGoogleLogin(token) : realGoogleLogin(token),
};

function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
