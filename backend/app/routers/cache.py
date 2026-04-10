from typing import List

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.models.product import NormalizedProduct
from app.services import cache_service

router = APIRouter(tags=["cache"])


class CacheProductsRequest(BaseModel):
    query: str
    products: List[NormalizedProduct]
    ttl: int = 3600


@router.post("/products", status_code=200)
async def cache_products(body: CacheProductsRequest):
    await cache_service.cache_products(body.query, body.products, body.ttl)
    return {"cached": len(body.products), "query": body.query}


@router.get("/products", response_model=List[NormalizedProduct])
async def get_cached_products(query: str = Query(..., description="Search query to look up in cache")):
    products = await cache_service.get_cached_products(query)
    if products is None:
        raise HTTPException(status_code=404, detail="No cached results for query")
    return products
