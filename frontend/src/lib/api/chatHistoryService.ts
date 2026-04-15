/**
 * ClickLess AI – Chat History API Service
 *
 * Thin wrapper around the /api/conversations/history endpoints.
 */
import type { FrontendChatMessage } from '@/contracts/chat';

const getApiBase = () => process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export interface ChatSessionMeta {
    session_id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

export async function listChatSessions(userId: string): Promise<ChatSessionMeta[]> {
    const res = await fetch(
        `${getApiBase()}/api/conversations/history/list?user_id=${encodeURIComponent(userId)}`,
    );
    if (!res.ok) return [];
    return res.json() as Promise<ChatSessionMeta[]>;
}

export async function getChatSession(sessionId: string): Promise<FrontendChatMessage[]> {
    const res = await fetch(
        `${getApiBase()}/api/conversations/history/${encodeURIComponent(sessionId)}`,
    );
    if (!res.ok) return [];
    const data = await res.json() as { session_id: string; messages: FrontendChatMessage[] };
    return data.messages ?? [];
}

export async function deleteChatSession(sessionId: string): Promise<void> {
    await fetch(
        `${getApiBase()}/api/conversations/history/${encodeURIComponent(sessionId)}`,
        { method: 'DELETE' },
    );
}
