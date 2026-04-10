import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.db.mongo import get_users_collection
from app.models.user import (
    AuthSession,
    CreateUserRequest,
    ExplicitPreferences,
    ImplicitPreferences,
    PreferenceObject,
    PreferenceWeights,
    UpdateUserRequest,
    UserDocument,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _to_user(doc: dict) -> UserDocument:
    doc.pop("_id", None)
    return UserDocument(**doc)


async def create_user(data: CreateUserRequest) -> UserDocument:
    col = get_users_collection()
    user = UserDocument(
        user_id=str(uuid.uuid4()),
        email=data.email,
        display_name=data.display_name,
        created_at=_now(),
        last_active=_now(),
    )
    await col.insert_one(user.model_dump())
    return user


async def get_user(user_id: str) -> Optional[UserDocument]:
    col = get_users_collection()
    doc = await col.find_one({"user_id": user_id})
    return _to_user(doc) if doc else None


async def update_user(user_id: str, data: UpdateUserRequest) -> Optional[UserDocument]:
    col = get_users_collection()
    update: Dict[str, Any] = {"last_active": _now()}
    if data.display_name is not None:
        update["display_name"] = data.display_name
    if data.conversation_context is not None:
        update["conversation_context"] = data.conversation_context
    result = await col.find_one_and_update(
        {"user_id": user_id},
        {"$set": update},
        return_document=True,
    )
    return _to_user(result) if result else None


async def delete_user(user_id: str) -> bool:
    col = get_users_collection()
    result = await col.delete_one({"user_id": user_id})
    return result.deleted_count > 0


async def get_preferences(user_id: str) -> Optional[PreferenceObject]:
    user = await get_user(user_id)
    return user.preferences if user else None


async def update_preferences(user_id: str, prefs: PreferenceObject) -> Optional[PreferenceObject]:
    col = get_users_collection()
    result = await col.find_one_and_update(
        {"user_id": user_id},
        {"$set": {"preferences": prefs.model_dump(), "last_active": _now()}},
        return_document=True,
    )
    return _to_user(result).preferences if result else None


async def add_explicit_preference(user_id: str, key: str, value: Any) -> Optional[PreferenceObject]:
    col = get_users_collection()
    result = await col.find_one_and_update(
        {"user_id": user_id},
        {"$set": {f"preferences.explicit.data.{key}": value, "last_active": _now()}},
        return_document=True,
    )
    return _to_user(result).preferences if result else None


async def add_implicit_preference(user_id: str, key: str, value: Any) -> Optional[PreferenceObject]:
    col = get_users_collection()
    result = await col.find_one_and_update(
        {"user_id": user_id},
        {"$set": {f"preferences.implicit.data.{key}": value, "last_active": _now()}},
        return_document=True,
    )
    return _to_user(result).preferences if result else None


async def get_preference_weights(user_id: str) -> Optional[PreferenceWeights]:
    prefs = await get_preferences(user_id)
    return prefs.weights if prefs else None


async def update_preference_weights(user_id: str, weights: PreferenceWeights) -> Optional[PreferenceWeights]:
    col = get_users_collection()
    result = await col.find_one_and_update(
        {"user_id": user_id},
        {"$set": {"preferences.weights": weights.model_dump(), "last_active": _now()}},
        return_document=True,
    )
    return _to_user(result).preferences.weights if result else None


async def store_session(user_id: str, site: str, encrypted_state: str) -> Optional[UserDocument]:
    col = get_users_collection()
    session = AuthSession(
        site=site,
        encrypted_state=encrypted_state,
        created_at=_now(),
    )
    result = await col.find_one_and_update(
        {"user_id": user_id},
        {"$set": {f"auth.{site}": session.model_dump(), "last_active": _now()}},
        return_document=True,
    )
    return _to_user(result) if result else None


async def get_session(user_id: str, site: str) -> Optional[AuthSession]:
    user = await get_user(user_id)
    if not user:
        return None
    return user.auth.get(site)


async def delete_session(user_id: str, site: str) -> bool:
    col = get_users_collection()
    result = await col.find_one_and_update(
        {"user_id": user_id},
        {"$unset": {f"auth.{site}": ""}, "$set": {"last_active": _now()}},
        return_document=True,
    )
    return result is not None


async def list_sessions(user_id: str) -> Dict[str, AuthSession]:
    user = await get_user(user_id)
    return user.auth if user else {}
