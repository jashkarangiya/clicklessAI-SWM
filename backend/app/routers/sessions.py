from typing import Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.user import AuthSession
from app.services import user_service

router = APIRouter(tags=["sessions"])


class StoreSessionRequest(BaseModel):
    encrypted_state: str


@router.post("/{user_id}/{site}", response_model=AuthSession, status_code=201)
async def store_session(user_id: str, site: str, body: StoreSessionRequest):
    user = await user_service.store_session(user_id, site, body.encrypted_state)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    session = user.auth.get(site)
    if not session:
        raise HTTPException(status_code=500, detail="Failed to store session")
    return session


@router.get("/{user_id}/{site}", response_model=AuthSession)
async def get_session(user_id: str, site: str):
    session = await user_service.get_session(user_id, site)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/{user_id}/{site}", status_code=204)
async def delete_session(user_id: str, site: str):
    deleted = await user_service.delete_session(user_id, site)
    if not deleted:
        raise HTTPException(status_code=404, detail="User or session not found")


@router.get("/{user_id}", response_model=Dict[str, AuthSession])
async def list_sessions(user_id: str):
    sessions = await user_service.list_sessions(user_id)
    if sessions is None:
        raise HTTPException(status_code=404, detail="User not found")
    return sessions
