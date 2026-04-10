from typing import Optional

from app.db.mongo import get_conversations_collection
from app.models.conversation import StateEnvelope


async def save_state(envelope: StateEnvelope) -> StateEnvelope:
    col = get_conversations_collection()
    doc = envelope.model_dump(mode="json")
    await col.update_one(
        {"session_id": envelope.session_id},
        {"$set": doc},
        upsert=True,
    )
    return envelope


async def get_state(session_id: str) -> Optional[StateEnvelope]:
    col = get_conversations_collection()
    doc = await col.find_one({"session_id": session_id})
    if not doc:
        return None
    doc.pop("_id", None)
    return StateEnvelope(**doc)


async def delete_state(session_id: str) -> bool:
    col = get_conversations_collection()
    result = await col.delete_one({"session_id": session_id})
    return result.deleted_count > 0
