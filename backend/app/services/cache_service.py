import hashlib
import json
from typing import List, Optional

from app.db.cache import cache_get, cache_set, product_cache_key
from app.models.product import NormalizedProduct


def _query_hash(query: str) -> str:
    return hashlib.md5(query.strip().lower().encode()).hexdigest()


async def cache_products(query: str, products: List[NormalizedProduct], ttl: int = 3600) -> None:
    key = product_cache_key(_query_hash(query))
    payload = json.dumps([p.model_dump(mode="json") for p in products])
    await cache_set(key, payload, ttl)


async def get_cached_products(query: str) -> Optional[List[NormalizedProduct]]:
    key = product_cache_key(_query_hash(query))
    raw = await cache_get(key)
    if raw is None:
        return None
    items = json.loads(raw)
    return [NormalizedProduct(**item) for item in items]
