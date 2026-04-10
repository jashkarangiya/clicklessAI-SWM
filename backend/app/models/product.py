from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class ProductPricing(BaseModel):
    current_price: float
    original_price: Optional[float] = None
    currency: str = "USD"


class ProductRatings(BaseModel):
    average: Optional[float] = None
    count: Optional[int] = None


class ProductDelivery(BaseModel):
    estimated_days: Optional[int] = None
    prime_eligible: bool = False
    free_shipping: bool = False


class ProductScoring(BaseModel):
    price_score: float
    rating_score: float
    delivery_score: float
    preference_match_score: float
    composite_score: float
    match_reasons: List[str] = []


class NormalizedProduct(BaseModel):
    product_id: str
    source: str
    source_url: str
    source_product_id: str
    name: str
    brand: Optional[str] = None
    category: str
    pricing: ProductPricing
    ratings: ProductRatings = ProductRatings()
    delivery: ProductDelivery = ProductDelivery()
    attributes: Dict[str, Any] = {}
    images: List[str] = []
    scoring: Optional[ProductScoring] = None
    scraped_at: datetime
    cache_ttl_seconds: int = 3600
