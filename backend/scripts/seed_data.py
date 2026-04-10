"""Seed script — inserts test users, products, and orders into all three databases."""
import asyncio
import json
import uuid
from datetime import datetime, timedelta, timezone

import asyncpg

from app.core.config import get_settings
from app.db.mongo import get_db
from app.models.order import PurchaseConfirmation
from app.models.product import NormalizedProduct, ProductDelivery, ProductPricing, ProductRatings
from app.models.user import (
    CreateUserRequest,
    ExplicitPreferences,
    PreferenceObject,
    PreferenceWeights,
)
from app.services.user_service import create_user

settings = get_settings()


def _now() -> datetime:
    return datetime.now(timezone.utc)


PRODUCTS = [
    NormalizedProduct(
        product_id="prod_seed_001",
        source="amazon",
        source_url="https://amazon.com/dp/B0SEED001",
        source_product_id="B0SEED001",
        name="Sony WH-1000XM5 Headphones",
        brand="Sony",
        category="electronics",
        pricing=ProductPricing(current_price=279.99, original_price=399.99),
        ratings=ProductRatings(average=4.7, count=12340),
        delivery=ProductDelivery(estimated_days=2, prime_eligible=True),
        attributes={"color": "black", "noise_cancelling": True},
        images=["https://images.amazon.com/seed001.jpg"],
        scraped_at=_now(),
    ),
    NormalizedProduct(
        product_id="prod_seed_002",
        source="walmart",
        source_url="https://walmart.com/ip/seed002",
        source_product_id="WM_SEED_002",
        name='Samsung 65" 4K Smart TV',
        brand="Samsung",
        category="electronics",
        pricing=ProductPricing(current_price=697.00, original_price=899.00),
        ratings=ProductRatings(average=4.3, count=5600),
        delivery=ProductDelivery(estimated_days=5, free_shipping=True),
        attributes={"screen_size": "65 inch", "resolution": "4K"},
        images=["https://i5.walmartimages.com/seed002.jpg"],
        scraped_at=_now(),
    ),
    NormalizedProduct(
        product_id="prod_seed_003",
        source="amazon",
        source_url="https://amazon.com/dp/B0SEED003",
        source_product_id="B0SEED003",
        name="Instant Pot Duo 7-in-1",
        brand="Instant Pot",
        category="kitchen",
        pricing=ProductPricing(current_price=79.95, original_price=99.95),
        ratings=ProductRatings(average=4.6, count=89000),
        delivery=ProductDelivery(estimated_days=1, prime_eligible=True),
        attributes={"capacity": "6 quart", "functions": 7},
        images=["https://images.amazon.com/seed003.jpg"],
        scraped_at=_now(),
    ),
]


async def seed_mongo():
    print("Seeding MongoDB...")
    db = get_db()

    users_col = db["users"]
    await users_col.delete_many({"email": {"$in": ["alice@example.com", "bob@example.com"]}})

    alice = await create_user(CreateUserRequest(email="alice@example.com", display_name="Alice"))
    alice_update = {
        "preferences": PreferenceObject(
            explicit=ExplicitPreferences(data={"brand": "Sony", "max_price": 300}),
            weights=PreferenceWeights(price=0.4, rating=0.3, delivery=0.2, preference_match=0.1),
        ).model_dump()
    }
    await users_col.update_one({"user_id": alice.user_id}, {"$set": alice_update})

    bob = await create_user(CreateUserRequest(email="bob@example.com", display_name="Bob"))
    bob_update = {
        "preferences": PreferenceObject(
            explicit=ExplicitPreferences(data={"category": "electronics"}),
            weights=PreferenceWeights(price=0.2, rating=0.5, delivery=0.2, preference_match=0.1),
        ).model_dump()
    }
    await users_col.update_one({"user_id": bob.user_id}, {"$set": bob_update})

    print(f"  Created users: {alice.user_id}, {bob.user_id}")

    conversations_col = db["conversations"]
    await conversations_col.delete_many({"session_id": {"$in": ["sess_seed_001"]}})
    await conversations_col.insert_one(
        {
            "session_id": "sess_seed_001",
            "user_id": alice.user_id,
            "turn_id": "turn_001",
            "timestamp": _now().isoformat(),
            "intent": "product_search",
            "status": "completed",
            "query": "noise cancelling headphones under 300",
            "missing_fields": [],
            "products": [p.model_dump(mode="json") for p in PRODUCTS[:1]],
            "errors": [],
            "metadata": {},
        }
    )
    print("  Seeded 1 conversation state")
    return alice.user_id


async def seed_postgres(user_id: str):
    print("Seeding PostgreSQL...")
    conn = await asyncpg.connect(
        settings.postgres_url.replace("postgresql+asyncpg://", "postgresql://")
    )

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            order_id        TEXT PRIMARY KEY,
            user_id         TEXT NOT NULL,
            product_id      TEXT NOT NULL,
            source          TEXT NOT NULL,
            product_name    TEXT NOT NULL,
            price           NUMERIC(10,2) NOT NULL,
            site_order_id   TEXT,
            status          TEXT NOT NULL DEFAULT 'placed',
            payment_last_four TEXT,
            delivery_address TEXT,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)

    await conn.execute("DELETE FROM orders WHERE product_id LIKE 'prod_seed_%'")

    await conn.execute(
        """
        INSERT INTO orders
            (order_id, user_id, product_id, source, product_name, price,
             site_order_id, status, payment_last_four, delivery_address, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        """,
        str(uuid.uuid4()),
        user_id,
        "prod_seed_001",
        "amazon",
        "Sony WH-1000XM5 Headphones",
        279.99,
        "AMZ-SEED-001",
        "placed",
        "4242",
        "123 Seed St, Test City, TC 00000",
        _now(),
        _now(),
    )

    await conn.close()
    print("  Seeded 1 order")


async def main():
    from app.db.mongo import ensure_indexes
    await ensure_indexes()

    user_id = await seed_mongo()
    await seed_postgres(user_id)
    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(main())
