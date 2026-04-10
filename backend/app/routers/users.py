from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from app.models.user import (
    CreateUserRequest,
    PreferenceObject,
    PreferenceWeights,
    UpdateUserRequest,
    UserDocument,
)
from app.services import user_service

router = APIRouter(tags=["users"])


@router.post("/", response_model=UserDocument, status_code=201)
async def create_user(data: CreateUserRequest):
    return await user_service.create_user(data)


@router.get("/{user_id}", response_model=UserDocument)
async def get_user(user_id: str):
    user = await user_service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserDocument)
async def update_user(user_id: str, data: UpdateUserRequest):
    user = await user_service.update_user(user_id, data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: str):
    deleted = await user_service.delete_user(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")


@router.get("/{user_id}/preferences", response_model=PreferenceObject)
async def get_preferences(user_id: str):
    prefs = await user_service.get_preferences(user_id)
    if prefs is None:
        raise HTTPException(status_code=404, detail="User not found")
    return prefs


@router.patch("/{user_id}/preferences", response_model=PreferenceObject)
async def update_preferences(user_id: str, prefs: PreferenceObject):
    updated = await user_service.update_preferences(user_id, prefs)
    if updated is None:
        raise HTTPException(status_code=404, detail="User not found")
    return updated


@router.post("/{user_id}/preferences/explicit", response_model=PreferenceObject)
async def add_explicit_preference(user_id: str, body: Dict[str, Any]):
    key = body.get("key")
    value = body.get("value")
    if key is None:
        raise HTTPException(status_code=422, detail="Field 'key' is required")
    result = await user_service.add_explicit_preference(user_id, key, value)
    if result is None:
        raise HTTPException(status_code=404, detail="User not found")
    return result


@router.post("/{user_id}/preferences/implicit", response_model=PreferenceObject)
async def add_implicit_preference(user_id: str, body: Dict[str, Any]):
    key = body.get("key")
    value = body.get("value")
    if key is None:
        raise HTTPException(status_code=422, detail="Field 'key' is required")
    result = await user_service.add_implicit_preference(user_id, key, value)
    if result is None:
        raise HTTPException(status_code=404, detail="User not found")
    return result


@router.get("/{user_id}/preferences/weights", response_model=PreferenceWeights)
async def get_preference_weights(user_id: str):
    weights = await user_service.get_preference_weights(user_id)
    if weights is None:
        raise HTTPException(status_code=404, detail="User not found")
    return weights


@router.patch("/{user_id}/preferences/weights", response_model=PreferenceWeights)
async def update_preference_weights(user_id: str, weights: PreferenceWeights):
    updated = await user_service.update_preference_weights(user_id, weights)
    if updated is None:
        raise HTTPException(status_code=404, detail="User not found")
    return updated
