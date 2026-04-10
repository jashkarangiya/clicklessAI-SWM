from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel


class Intent(str, Enum):
    product_search = "product_search"
    purchase = "purchase"
    refine_search = "refine_search"
    browse = "browse"
    preference_update = "preference_update"
    general_chat = "general_chat"


class Status(str, Enum):
    needs_clarification = "needs_clarification"
    ready = "ready"
    executing = "executing"
    completed = "completed"
    failed = "failed"


class ErrorCategory(str, Enum):
    retryable = "retryable"
    session_expired = "session_expired"
    data_mismatch = "data_mismatch"
    site_blocked = "site_blocked"
    fatal = "fatal"


class ErrorObject(BaseModel):
    category: ErrorCategory
    message: str
    retryable: bool
    context: Optional[Dict[str, Any]] = None
