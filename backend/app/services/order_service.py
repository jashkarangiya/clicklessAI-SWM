import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import text

from app.db.postgres import get_session_factory
from app.models.order import CreateOrderRequest, OrderRecord, UpdateOrderRequest


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def create_order(data: CreateOrderRequest) -> OrderRecord:
    order_id = str(uuid.uuid4())
    now = _now()

    async with get_session_factory()() as session:
        await session.execute(
            text("""
                INSERT INTO orders
                    (order_id, user_id, product_id, source, product_name, price,
                     site_order_id, status, payment_last_four, delivery_address,
                     created_at, updated_at)
                VALUES
                    (:order_id, :user_id, :product_id, :source, :product_name, :price,
                     NULL, 'placed', :payment_last_four, :delivery_address,
                     :created_at, :updated_at)
            """),
            {
                "order_id": order_id,
                "user_id": data.user_id,
                "product_id": data.product.product_id,
                "source": data.product.source,
                "product_name": data.product.name,
                "price": data.confirmation.current_price,
                "payment_last_four": data.confirmation.payment_last_four,
                "delivery_address": data.confirmation.delivery_address,
                "created_at": now,
                "updated_at": now,
            },
        )
        await session.commit()

    return OrderRecord(
        order_id=order_id,
        user_id=data.user_id,
        product=data.product,
        confirmation=data.confirmation,
        status="placed",
        created_at=now,
        updated_at=now,
    )


async def get_order(order_id: str) -> Optional[OrderRecord]:
    async with get_session_factory()() as session:
        result = await session.execute(
            text("SELECT * FROM orders WHERE order_id = :order_id"),
            {"order_id": order_id},
        )
        row = result.mappings().first()

    if not row:
        return None

    from app.models.order import PurchaseConfirmation
    from app.models.product import NormalizedProduct, ProductPricing

    return OrderRecord(
        order_id=row["order_id"],
        user_id=row["user_id"],
        product=NormalizedProduct(
            product_id=row["product_id"],
            source=row["source"],
            source_url="",
            source_product_id=row["product_id"],
            name=row["product_name"],
            category="",
            pricing=ProductPricing(current_price=float(row["price"])),
            scraped_at=row["created_at"],
        ),
        confirmation=PurchaseConfirmation(
            product_name=row["product_name"],
            current_price=float(row["price"]),
            delivery_address=row["delivery_address"] or "",
            payment_last_four=row["payment_last_four"] or "",
            retail_site=row["source"],
            expires_at=row["created_at"],
        ),
        site_order_id=row["site_order_id"],
        status=row["status"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


async def get_user_orders(user_id: str) -> List[OrderRecord]:
    async with get_session_factory()() as session:
        result = await session.execute(
            text("SELECT * FROM orders WHERE user_id = :user_id ORDER BY created_at DESC"),
            {"user_id": user_id},
        )
        rows = result.mappings().all()

    from app.models.order import PurchaseConfirmation
    from app.models.product import NormalizedProduct, ProductPricing

    return [
        OrderRecord(
            order_id=r["order_id"],
            user_id=r["user_id"],
            product=NormalizedProduct(
                product_id=r["product_id"],
                source=r["source"],
                source_url="",
                source_product_id=r["product_id"],
                name=r["product_name"],
                category="",
                pricing=ProductPricing(current_price=float(r["price"])),
                scraped_at=r["created_at"],
            ),
            confirmation=PurchaseConfirmation(
                product_name=r["product_name"],
                current_price=float(r["price"]),
                delivery_address=r["delivery_address"] or "",
                payment_last_four=r["payment_last_four"] or "",
                retail_site=r["source"],
                expires_at=r["created_at"],
            ),
            site_order_id=r["site_order_id"],
            status=r["status"],
            created_at=r["created_at"],
            updated_at=r["updated_at"],
        )
        for r in rows
    ]


async def update_order(order_id: str, data: UpdateOrderRequest) -> Optional[OrderRecord]:
    now = _now()
    params: dict = {"order_id": order_id, "updated_at": now}
    set_parts = ["updated_at = :updated_at"]

    if data.status is not None:
        params["status"] = data.status
        set_parts.append("status = :status")
    if data.site_order_id is not None:
        params["site_order_id"] = data.site_order_id
        set_parts.append("site_order_id = :site_order_id")

    async with get_session_factory()() as session:
        await session.execute(
            text(f"UPDATE orders SET {', '.join(set_parts)} WHERE order_id = :order_id"),
            params,
        )
        await session.commit()

    return await get_order(order_id)
