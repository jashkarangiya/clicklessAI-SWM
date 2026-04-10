from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel

from app.models.order import PurchaseConfirmation
from app.models.product import NormalizedProduct
from app.models.shared import ErrorObject, Intent, Status


class StateEnvelope(BaseModel):
    session_id: str
    user_id: str
    turn_id: str
    timestamp: datetime
    intent: Optional[Intent] = None
    status: Status = Status.ready
    query: Optional[str] = None
    missing_fields: List[str] = []
    clarification: Optional[str] = None
    products: List[NormalizedProduct] = []
    selected_product: Optional[NormalizedProduct] = None
    purchase_confirmation: Optional[PurchaseConfirmation] = None
    preference_updates: Dict[str, Any] = {}
    errors: List[ErrorObject] = []
    metadata: Dict[str, Any] = {}
