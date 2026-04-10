from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class AuthSession(BaseModel):
    site: str
    encrypted_state: str
    created_at: datetime
    expires_at: Optional[datetime] = None


class ExplicitPreferences(BaseModel):
    data: Dict[str, Any] = {}


class ImplicitPreferences(BaseModel):
    data: Dict[str, Any] = {}
    decay_factor: float = 0.9


class PreferenceWeights(BaseModel):
    price: float = 0.25
    rating: float = 0.25
    delivery: float = 0.25
    preference_match: float = 0.25


class PreferenceObject(BaseModel):
    explicit: ExplicitPreferences = ExplicitPreferences()
    implicit: ImplicitPreferences = ImplicitPreferences()
    weights: PreferenceWeights = PreferenceWeights()


class UserDocument(BaseModel):
    user_id: str
    email: str
    display_name: str
    created_at: datetime
    last_active: datetime
    auth: Dict[str, AuthSession] = {}
    preferences: PreferenceObject = PreferenceObject()
    purchase_history: List[str] = []
    rejected_products: List[str] = []
    conversation_context: Dict[str, Any] = {}


class CreateUserRequest(BaseModel):
    email: str
    display_name: str


class UpdateUserRequest(BaseModel):
    display_name: Optional[str] = None
    conversation_context: Optional[Dict[str, Any]] = None
