from fastapi import APIRouter, HTTPException, Query

from app.models.conversation import StateEnvelope
from app.services import conversation_service
from app.services import chat_service

router = APIRouter(tags=["conversations"])


# ── Chat history endpoints (MUST come before /{session_id} wildcard) ──────────

@router.get("/history/list", tags=["chat-history"])
async def list_chat_sessions(user_id: str = Query(..., description="User ID")):
    """Return recent sessions for a user — used by the sidebar."""
    return await chat_service.list_sessions(user_id)


@router.get("/history/{session_id}", tags=["chat-history"])
async def get_chat_session(session_id: str):
    """Return the full message list for a session — used to restore a conversation."""
    messages = await chat_service.get_session_messages(session_id)
    return {"session_id": session_id, "messages": messages}


@router.delete("/history/{session_id}", status_code=204, tags=["chat-history"])
async def delete_chat_session(session_id: str):
    await chat_service.delete_session(session_id)


# ── Legacy LangGraph state endpoints ─────────────────────────────────────────

@router.post("/{session_id}", response_model=StateEnvelope, status_code=201)
async def create_conversation(session_id: str, envelope: StateEnvelope):
    if envelope.session_id != session_id:
        raise HTTPException(status_code=422, detail="session_id in path and body must match")
    return await conversation_service.save_state(envelope)


@router.get("/{session_id}", response_model=StateEnvelope)
async def get_conversation(session_id: str):
    state = await conversation_service.get_state(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return state


@router.delete("/{session_id}", status_code=204)
async def delete_conversation(session_id: str):
    deleted = await conversation_service.delete_state(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
