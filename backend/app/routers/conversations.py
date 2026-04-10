from fastapi import APIRouter, HTTPException

from app.models.conversation import StateEnvelope
from app.services import conversation_service

router = APIRouter(tags=["conversations"])


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
