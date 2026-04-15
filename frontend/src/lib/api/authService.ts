/**
 * ClickLess AI – Auth Service
 */

const getApiBase = () => process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

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
        image?: string;
    };
}

// ── Implementations ────────────────────────────────────────────────────────

async function login(req: LoginRequest): Promise<AuthResponse> {
    const base = getApiBase();
    const res = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error((await res.json() as { message: string }).message ?? 'Login failed');
    return res.json() as Promise<AuthResponse>;
}

async function signup(req: SignupRequest): Promise<AuthResponse> {
    const base = getApiBase();
    const res = await fetch(`${base}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error((await res.json() as { message: string }).message ?? 'Signup failed');
    return res.json() as Promise<AuthResponse>;
}

async function googleLogin(token: string): Promise<AuthResponse> {
    const base = getApiBase();
    // Let the backend verify the token, create/find the user, and return the
    // canonical user_id (UUID). Using the backend UUID everywhere ensures
    // Amazon sessions stored in MongoDB can be retrieved later.
    try {
        const res = await fetch(`${base}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });
        if (res.ok) {
            return res.json() as Promise<AuthResponse>;
        }
    } catch { /* backend unavailable — fall through to Google-direct path */ }

    // Fallback: backend unreachable — verify directly with Google and use sub as ID.
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!userInfoRes.ok) throw new Error('Failed to verify Google token');
    const userInfo = await userInfoRes.json() as { sub?: string; email?: string; name?: string; picture?: string };
    const email = userInfo.email ?? '';
    const name = userInfo.name ?? email.split('@')[0];
    if (!email) throw new Error('Google account has no email');

    return {
        token: 'g-' + btoa(email).replace(/=/g, ''),
        user: {
            id: userInfo.sub ?? 'g-' + btoa(email).replace(/=/g, ''),
            email,
            name,
            image: userInfo.picture,
        },
    };
}

// ── Exported API ───────────────────────────────────────────────────────────

export const authService = { login, signup, googleLogin };
