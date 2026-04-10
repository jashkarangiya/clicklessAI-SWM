from typing import List

from fastapi import APIRouter, HTTPException

from app.models.order import CreateOrderRequest, OrderRecord, UpdateOrderRequest
from app.services import order_service

router = APIRouter(tags=["orders"])


@router.post("/", response_model=OrderRecord, status_code=201)
async def create_order(data: CreateOrderRequest):
    return await order_service.create_order(data)


@router.get("/user/{user_id}", response_model=List[OrderRecord])
async def get_user_orders(user_id: str):
    return await order_service.get_user_orders(user_id)


@router.get("/{order_id}", response_model=OrderRecord)
async def get_order(order_id: str):
    order = await order_service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/{order_id}", response_model=OrderRecord)
async def update_order(order_id: str, data: UpdateOrderRequest):
    order = await order_service.update_order(order_id, data)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
