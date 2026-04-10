"""HTTP endpoint tests for ClickLess AI FastAPI backend."""
import uuid

import pytest
from httpx import AsyncClient


def _unique_email(prefix: str = "test") -> str:
    return f"{prefix}+{uuid.uuid4().hex[:8]}@example.com"


# ── System ────────────────────────────────────────────────────────────────────

class TestSystem:
    async def test_health(self, test_client: AsyncClient):
        r = await test_client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    async def test_version(self, test_client: AsyncClient):
        r = await test_client.get("/version")
        assert r.status_code == 200
        assert "version" in r.json()

    async def test_status(self, test_client: AsyncClient):
        r = await test_client.get("/status")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert "env" in data


# ── Users ─────────────────────────────────────────────────────────────────────

class TestUsers:
    async def _create(self, client: AsyncClient, email: str = None) -> dict:
        payload = {"email": email or _unique_email(), "display_name": "Test User"}
        r = await client.post("/api/users/", json=payload)
        assert r.status_code == 201, r.text
        return r.json()

    async def test_create_user(self, test_client: AsyncClient):
        data = await self._create(test_client)
        assert "user_id" in data
        assert data["display_name"] == "Test User"

    async def test_create_user_invalid(self, test_client: AsyncClient):
        r = await test_client.post("/api/users/", json={})
        assert r.status_code == 422

    async def test_get_user(self, test_client: AsyncClient):
        created = await self._create(test_client)
        r = await test_client.get(f"/api/users/{created['user_id']}")
        assert r.status_code == 200
        assert r.json()["user_id"] == created["user_id"]

    async def test_get_user_not_found(self, test_client: AsyncClient):
        r = await test_client.get("/api/users/nonexistent-user-id-xyz")
        assert r.status_code == 404

    async def test_update_user(self, test_client: AsyncClient):
        created = await self._create(test_client)
        r = await test_client.patch(
            f"/api/users/{created['user_id']}",
            json={"display_name": "Updated Name"},
        )
        assert r.status_code == 200
        assert r.json()["display_name"] == "Updated Name"

    async def test_delete_user(self, test_client: AsyncClient):
        created = await self._create(test_client)
        r = await test_client.delete(f"/api/users/{created['user_id']}")
        assert r.status_code == 204
        r2 = await test_client.get(f"/api/users/{created['user_id']}")
        assert r2.status_code == 404

    async def test_get_preferences(self, test_client: AsyncClient):
        created = await self._create(test_client)
        r = await test_client.get(f"/api/users/{created['user_id']}/preferences")
        assert r.status_code == 200
        data = r.json()
        assert "explicit" in data and "implicit" in data and "weights" in data

    async def test_patch_preferences(self, test_client: AsyncClient):
        created = await self._create(test_client)
        new_prefs = {
            "explicit": {"data": {"brand": "Sony"}},
            "implicit": {"data": {}, "decay_factor": 0.9},
            "weights": {"price": 0.4, "rating": 0.3, "delivery": 0.2, "preference_match": 0.1},
        }
        r = await test_client.patch(
            f"/api/users/{created['user_id']}/preferences", json=new_prefs
        )
        assert r.status_code == 200
        assert r.json()["weights"]["price"] == 0.4

    async def test_add_explicit_preference(self, test_client: AsyncClient):
        created = await self._create(test_client)
        r = await test_client.post(
            f"/api/users/{created['user_id']}/preferences/explicit",
            json={"key": "max_price", "value": 500},
        )
        assert r.status_code == 200
        assert r.json()["explicit"]["data"]["max_price"] == 500

    async def test_add_implicit_preference(self, test_client: AsyncClient):
        created = await self._create(test_client)
        r = await test_client.post(
            f"/api/users/{created['user_id']}/preferences/implicit",
            json={"key": "category_affinity", "value": "electronics"},
        )
        assert r.status_code == 200
        assert r.json()["implicit"]["data"]["category_affinity"] == "electronics"

    async def test_get_weights(self, test_client: AsyncClient):
        created = await self._create(test_client)
        r = await test_client.get(f"/api/users/{created['user_id']}/preferences/weights")
        assert r.status_code == 200
        assert "price" in r.json() and "rating" in r.json()

    async def test_patch_weights(self, test_client: AsyncClient):
        created = await self._create(test_client)
        r = await test_client.patch(
            f"/api/users/{created['user_id']}/preferences/weights",
            json={"price": 0.5, "rating": 0.2, "delivery": 0.2, "preference_match": 0.1},
        )
        assert r.status_code == 200
        assert r.json()["price"] == 0.5


# ── Sessions ──────────────────────────────────────────────────────────────────

class TestSessions:
    async def _user(self, client: AsyncClient) -> str:
        r = await client.post(
            "/api/users/", json={"email": _unique_email("sess"), "display_name": "Session User"}
        )
        assert r.status_code == 201, r.text
        return r.json()["user_id"]

    async def test_store_session(self, test_client: AsyncClient):
        uid = await self._user(test_client)
        r = await test_client.post(
            f"/api/sessions/{uid}/amazon",
            json={"encrypted_state": "enc_state_abc123"},
        )
        assert r.status_code == 201
        assert r.json()["site"] == "amazon"

    async def test_get_session(self, test_client: AsyncClient):
        uid = await self._user(test_client)
        await test_client.post(
            f"/api/sessions/{uid}/amazon",
            json={"encrypted_state": "enc_state_xyz"},
        )
        r = await test_client.get(f"/api/sessions/{uid}/amazon")
        assert r.status_code == 200
        assert r.json()["encrypted_state"] == "enc_state_xyz"

    async def test_delete_session(self, test_client: AsyncClient):
        uid = await self._user(test_client)
        await test_client.post(
            f"/api/sessions/{uid}/walmart",
            json={"encrypted_state": "enc_wm_state"},
        )
        r = await test_client.delete(f"/api/sessions/{uid}/walmart")
        assert r.status_code == 204

    async def test_list_sessions(self, test_client: AsyncClient):
        uid = await self._user(test_client)
        await test_client.post(
            f"/api/sessions/{uid}/amazon",
            json={"encrypted_state": "enc_amz"},
        )
        r = await test_client.get(f"/api/sessions/{uid}")
        assert r.status_code == 200
        assert "amazon" in r.json()


# ── Orders ────────────────────────────────────────────────────────────────────

class TestOrders:
    async def _user(self, client: AsyncClient) -> str:
        r = await client.post(
            "/api/users/", json={"email": _unique_email("order"), "display_name": "Order User"}
        )
        assert r.status_code == 201, r.text
        return r.json()["user_id"]

    async def _create_order(self, client, user_id, product, confirmation) -> dict:
        payload = {"user_id": user_id, "product": product, "confirmation": confirmation}
        r = await client.post("/api/orders/", json=payload)
        assert r.status_code == 201, r.text
        return r.json()

    async def test_create_order(self, test_client, sample_product, sample_confirmation):
        uid = await self._user(test_client)
        order = await self._create_order(test_client, uid, sample_product, sample_confirmation)
        assert order["user_id"] == uid
        assert "order_id" in order

    async def test_get_order(self, test_client, sample_product, sample_confirmation):
        uid = await self._user(test_client)
        order = await self._create_order(test_client, uid, sample_product, sample_confirmation)
        r = await test_client.get(f"/api/orders/{order['order_id']}")
        assert r.status_code == 200
        assert r.json()["order_id"] == order["order_id"]

    async def test_get_order_not_found(self, test_client):
        r = await test_client.get("/api/orders/nonexistent-order-id-xyz")
        assert r.status_code == 404

    async def test_update_order(self, test_client, sample_product, sample_confirmation):
        uid = await self._user(test_client)
        order = await self._create_order(test_client, uid, sample_product, sample_confirmation)
        r = await test_client.patch(
            f"/api/orders/{order['order_id']}",
            json={"status": "cancelled"},
        )
        assert r.status_code == 200
        assert r.json()["status"] == "cancelled"

    async def test_get_user_orders(self, test_client, sample_product, sample_confirmation):
        uid = await self._user(test_client)
        await self._create_order(test_client, uid, sample_product, sample_confirmation)
        r = await test_client.get(f"/api/orders/user/{uid}")
        assert r.status_code == 200
        assert len(r.json()) >= 1


# ── Cache ─────────────────────────────────────────────────────────────────────

class TestCache:
    async def test_cache_products(self, test_client, sample_product):
        r = await test_client.post(
            "/api/cache/products",
            json={"query": "noise cancelling headphones", "products": [sample_product], "ttl": 60},
        )
        assert r.status_code == 200
        assert r.json()["cached"] == 1

    async def test_get_cached_products(self, test_client, sample_product):
        query = f"smart tv 65 inch {uuid.uuid4().hex[:6]}"
        await test_client.post(
            "/api/cache/products",
            json={"query": query, "products": [sample_product], "ttl": 60},
        )
        r = await test_client.get(f"/api/cache/products?query={query}")
        assert r.status_code == 200
        assert len(r.json()) == 1

    async def test_get_cache_miss(self, test_client):
        r = await test_client.get(
            f"/api/cache/products?query=totally_unknown_{uuid.uuid4().hex}"
        )
        assert r.status_code == 404


# ── Conversations ─────────────────────────────────────────────────────────────

class TestConversations:
    def _envelope(self, user_id: str, session_id: str) -> dict:
        return {
            "session_id": session_id,
            "user_id": user_id,
            "turn_id": "turn_001",
            "timestamp": "2026-01-01T00:00:00Z",
            "status": "ready",
            "query": "find me wireless headphones",
        }

    async def test_create_conversation(self, test_client):
        sid = f"sess_{uuid.uuid4().hex[:8]}"
        r = await test_client.post(
            f"/api/conversations/{sid}",
            json=self._envelope("user_conv_001", sid),
        )
        assert r.status_code == 201
        assert r.json()["session_id"] == sid

    async def test_get_conversation(self, test_client):
        sid = f"sess_{uuid.uuid4().hex[:8]}"
        await test_client.post(
            f"/api/conversations/{sid}",
            json=self._envelope("user_conv_002", sid),
        )
        r = await test_client.get(f"/api/conversations/{sid}")
        assert r.status_code == 200
        assert r.json()["session_id"] == sid

    async def test_delete_conversation(self, test_client):
        sid = f"sess_{uuid.uuid4().hex[:8]}"
        await test_client.post(
            f"/api/conversations/{sid}",
            json=self._envelope("user_conv_003", sid),
        )
        r = await test_client.delete(f"/api/conversations/{sid}")
        assert r.status_code == 204

    async def test_get_conversation_not_found(self, test_client):
        r = await test_client.get(f"/api/conversations/nonexistent-{uuid.uuid4().hex}")
        assert r.status_code == 404
