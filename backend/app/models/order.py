from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.product import NormalizedProduct


class PurchaseConfirmation(BaseModel):
    product_name: str
    current_price: float
    delivery_address: str
    payment_last_four: str
    retail_site: str
    estimated_delivery_date: Optional[str] = None
    return_policy_summary: Optional[str] = None
    expires_at: datetime
    confirmed: bool = False


class OrderRecord(BaseModel):
    order_id: str
    user_id: str
    product: NormalizedProduct
    confirmation: PurchaseConfirmation
    site_order_id: Optional[str] = None
    status: str = "placed"
    created_at: datetime
    updated_at: datetime


class CreateOrderRequest(BaseModel):
    user_id: str
    product: NormalizedProduct
    confirmation: PurchaseConfirmation


class UpdateOrderRequest(BaseModel):
    status: Optional[str] = None
    site_order_id: Optional[str] = None
