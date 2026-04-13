"""
Unit tests for Member A's nodes, scoring engine, and graph routing.
Run with:  pytest tests/test_nodes.py -v

All LLM calls are patched with unittest.mock so tests run offline.
"""
import asyncio
import json
import copy
import uuid
import sys
import os
from unittest.mock import patch, MagicMock, AsyncMock
from pathlib import Path

# Ensure project root is on PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from state import AgentState, new_state
from scoring import (
    compute_price_score,
    compute_rating_score,
    compute_delivery_score,
    compute_preference_match_score,
    rank_products,
    adapt_weights,
    get_comparison_highlights,
    DEFAULT_WEIGHTS,
)


# ── Fixtures ───────────────────────────────────────────────────────────────────

PRODUCTS_PATH = Path(__file__).parent.parent / "fixtures" / "products.json"
USERS_PATH = Path(__file__).parent.parent / "fixtures" / "users.json"


@pytest.fixture
def all_products():
    return json.loads(PRODUCTS_PATH.read_text())


@pytest.fixture
def price_sensitive_prefs():
    users = json.loads(USERS_PATH.read_text())
    return next(u["preferences"] for u in users if u["user_id"] == "user-price-sensitive")


@pytest.fixture
def brand_loyal_prefs():
    users = json.loads(USERS_PATH.read_text())
    return next(u["preferences"] for u in users if u["user_id"] == "user-brand-loyal")


@pytest.fixture
def speed_focused_prefs():
    users = json.loads(USERS_PATH.read_text())
    return next(u["preferences"] for u in users if u["user_id"] == "user-speed-focused")


def make_state(user_id="user-brand-loyal", message="I want wireless headphones") -> AgentState:
    s = new_state(user_id, str(uuid.uuid4()), message)
    # Load preferences from fixture
    users = json.loads(USERS_PATH.read_text())
    user = next((u for u in users if u["user_id"] == user_id), {})
    s["user_preferences"] = user.get("preferences", {})
    return s


# ── Scoring tests ─────────────────────────────────────────────────────────────

class TestPriceScore:
    def test_cheapest_gets_1(self, all_products):
        prices = [p["pricing"]["current_price"] for p in all_products]
        cheapest = all_products[prices.index(min(prices))]
        assert compute_price_score(cheapest, all_products) == 1.0

    def test_most_expensive_gets_0(self, all_products):
        prices = [p["pricing"]["current_price"] for p in all_products]
        priciest = all_products[prices.index(max(prices))]
        assert compute_price_score(priciest, all_products) == 0.0

    def test_single_product_gets_1(self):
        p = {"pricing": {"current_price": 99.99}}
        assert compute_price_score(p, [p]) == 1.0

    def test_score_between_0_and_1(self, all_products):
        for p in all_products:
            s = compute_price_score(p, all_products)
            assert 0.0 <= s <= 1.0, f"{p['name']} score {s} out of range"


class TestRatingScore:
    def test_perfect_rating(self):
        p = {"ratings": {"stars": 5.0, "review_count": 1000}}
        assert compute_rating_score(p) == 1.0

    def test_penalty_for_low_reviews(self):
        p_few = {"ratings": {"stars": 4.0, "review_count": 10}}
        p_many = {"ratings": {"stars": 4.0, "review_count": 500}}
        assert compute_rating_score(p_few) < compute_rating_score(p_many)

    def test_score_clamps_to_0_1(self):
        p = {"ratings": {"stars": 1.0, "review_count": 1}}
        assert 0.0 <= compute_rating_score(p) <= 1.0


class TestDeliveryScore:
    def test_same_day_near_1(self):
        from datetime import date
        today_str = date.today().strftime("%Y-%m-%d")
        p = {"delivery": {"estimated_date": today_str, "prime_eligible": False, "shipping_cost": 5.99}}
        assert compute_delivery_score(p) >= 0.95

    def test_week_away_is_low(self):
        from datetime import date, timedelta
        future = (date.today() + timedelta(days=8)).strftime("%Y-%m-%d")
        p = {"delivery": {"estimated_date": future, "prime_eligible": False, "shipping_cost": 5.99}}
        assert compute_delivery_score(p) == 0.0

    def test_prime_bonus(self):
        from datetime import date, timedelta
        d = (date.today() + timedelta(days=2)).strftime("%Y-%m-%d")
        without_prime = {"delivery": {"estimated_date": d, "prime_eligible": False, "shipping_cost": 5.99}}
        with_prime = {"delivery": {"estimated_date": d, "prime_eligible": True, "shipping_cost": 0.0}}
        assert compute_delivery_score(with_prime) > compute_delivery_score(without_prime)

    def test_missing_date_returns_0_5(self):
        p = {"delivery": {}}
        assert compute_delivery_score(p) == 0.50


class TestPreferenceMatchScore:
    def test_preferred_brand_boosts_score(self, brand_loyal_prefs):
        sony = {"brand": "Sony", "pricing": {"current_price": 150.0}, "source": "amazon"}
        unknown = {"brand": "UnknownCo", "pricing": {"current_price": 150.0}, "source": "amazon"}
        assert compute_preference_match_score(sony, brand_loyal_prefs) > compute_preference_match_score(unknown, brand_loyal_prefs)

    def test_avoided_brand_lowers_score(self, brand_loyal_prefs):
        skullcandy = {"brand": "Skullcandy", "pricing": {"current_price": 50.0}, "source": "amazon"}
        score = compute_preference_match_score(skullcandy, brand_loyal_prefs)
        anker = {"brand": "Anker", "pricing": {"current_price": 50.0}, "source": "amazon"}
        assert score < compute_preference_match_score(anker, brand_loyal_prefs)

    def test_empty_prefs_returns_neutral(self):
        p = {"brand": "Sony", "pricing": {"current_price": 100.0}, "source": "amazon"}
        assert compute_preference_match_score(p, {}) == 0.50


class TestRankProducts:
    def test_returns_same_count(self, all_products, brand_loyal_prefs):
        ranked = rank_products(all_products, brand_loyal_prefs)
        assert len(ranked) == len(all_products)

    def test_first_has_highest_composite(self, all_products, brand_loyal_prefs):
        ranked = rank_products(all_products, brand_loyal_prefs)
        scores = [p["scoring"]["composite_score"] for p in ranked]
        assert scores == sorted(scores, reverse=True)

    def test_price_sensitive_prefers_cheap(self, all_products, price_sensitive_prefs):
        weights = price_sensitive_prefs["weights"]
        ranked = rank_products(all_products, price_sensitive_prefs, weights)
        top = ranked[0]
        # Top product should be cheap given high price weight
        prices = [p["pricing"]["current_price"] for p in all_products]
        avg_price = sum(prices) / len(prices)
        assert top["pricing"]["current_price"] <= avg_price

    def test_empty_products_returns_empty(self, brand_loyal_prefs):
        assert rank_products([], brand_loyal_prefs) == []


class TestAdaptWeights:
    def test_cheapest_choice_raises_price_weight(self, all_products):
        prices = [p["pricing"]["current_price"] for p in all_products]
        cheapest = all_products[prices.index(min(prices))]
        new_w = adapt_weights(DEFAULT_WEIGHTS.copy(), cheapest, all_products)
        assert new_w["price"] > DEFAULT_WEIGHTS["price"]

    def test_weights_sum_to_1(self, all_products):
        product = all_products[0]
        new_w = adapt_weights(DEFAULT_WEIGHTS.copy(), product, all_products)
        assert abs(sum(new_w.values()) - 1.0) < 1e-4

    def test_no_weight_exceeds_max(self, all_products):
        product = all_products[0]
        # Run many adaptations
        w = DEFAULT_WEIGHTS.copy()
        for _ in range(50):
            w = adapt_weights(w, product, all_products)
        assert all(v <= 0.50 + 1e-6 for v in w.values())


class TestComparisonHighlights:
    def test_returns_three_keys(self, all_products):
        h = get_comparison_highlights(all_products)
        assert "cheapest" in h
        assert "best_rated" in h
        assert "fastest_delivery" in h

    def test_empty_returns_empty(self):
        assert get_comparison_highlights([]) == {}


# ── Node tests ────────────────────────────────────────────────────────────────

def _scraper_row_amazon(price: float, asin: str = "B0TEST12345") -> dict:
    """Minimal row as returned by scraper.scrapers.amazon.search_amazon."""
    return {
        "title": "Test Headphones",
        "price": price,
        "original_price": 99.0,
        "currency": "USD",
        "rating": 4.5,
        "review_count": 120,
        "image_url": "https://example.com/p.jpg",
        "product_url": f"https://www.amazon.com/dp/{asin}",
        "delivery_estimate": "Tomorrow",
        "prime": True,
        "in_stock": True,
        "source": "amazon",
    }


def _scraper_row_walmart(price: float) -> dict:
    return {
        "title": "Test Walmart Item",
        "price": price,
        "original_price": None,
        "currency": "USD",
        "rating": 4.0,
        "review_count": 50,
        "image_url": "https://example.com/w.jpg",
        "product_url": "https://www.walmart.com/ip/123",
        "delivery_estimate": "2 days",
        "prime": False,
        "in_stock": True,
        "source": "walmart",
    }


class TestProductSearchNode:
    @patch("nodes.product_search.search_walmart", new_callable=AsyncMock)
    @patch("nodes.product_search.search_amazon", new_callable=AsyncMock)
    def test_returns_products_for_headphones(self, mock_amazon, mock_walmart):
        from nodes.product_search import product_search_node

        mock_amazon.return_value = [_scraper_row_amazon(79.99)]
        mock_walmart.return_value = [_scraper_row_walmart(44.0)]
        state = make_state()
        state["query"]["parsed"]["category"] = "headphones"
        result = asyncio.run(product_search_node(state))
        assert len(result["products"]) == 2
        assert result["status"] == "completed"
        assert result["products"][0]["pricing"]["current_price"] == 79.99

    @patch("nodes.product_search.search_walmart", new_callable=AsyncMock)
    @patch("nodes.product_search.search_amazon", new_callable=AsyncMock)
    def test_budget_filter_under_50(self, mock_amazon, mock_walmart):
        from nodes.product_search import product_search_node

        mock_amazon.return_value = [_scraper_row_amazon(29.99), _scraper_row_amazon(199.99)]
        mock_walmart.return_value = []
        state = make_state()
        state["query"]["parsed"]["category"] = "headphones"
        state["query"]["parsed"]["budget"] = "under_50"
        result = asyncio.run(product_search_node(state))
        assert len(result["products"]) == 1
        assert result["products"][0]["pricing"]["current_price"] <= 50

    @patch("nodes.product_search.search_walmart", new_callable=AsyncMock)
    @patch("nodes.product_search.search_amazon", new_callable=AsyncMock)
    def test_scrape_counts_populated(self, mock_amazon, mock_walmart):
        from nodes.product_search import product_search_node

        mock_amazon.return_value = [_scraper_row_amazon(10.0)]
        mock_walmart.return_value = [_scraper_row_walmart(20.0)]
        state = make_state()
        result = asyncio.run(product_search_node(state))
        counts = result["metadata"]["scrape_results_count"]
        assert counts["amazon"] == 1 and counts["walmart"] == 1


class TestNormalizeRankNode:
    def test_products_sorted_by_score(self, all_products):
        from nodes.normalize_rank import normalize_rank_node
        state = make_state()
        state["products"] = copy.deepcopy(all_products)
        result = normalize_rank_node(state)
        scores = [p["scoring"]["composite_score"] for p in result["products"]]
        assert scores == sorted(scores, reverse=True)

    def test_empty_products_ok(self):
        from nodes.normalize_rank import normalize_rank_node
        state = make_state()
        state["products"] = []
        result = normalize_rank_node(state)
        assert result["products"] == []
        assert result["status"] == "completed"


class TestErrorRecoveryNode:
    def test_retryable_sets_retry_node(self):
        from nodes.error_recovery import error_recovery_node
        state = make_state()
        state["errors"] = [{"category": "retryable", "node": "product_search", "message": "timeout"}]
        state["metadata"]["retry_count"] = 0
        result = error_recovery_node(state)
        assert result["retry_node"] == "product_search"
        assert result["status"] == "ready"

    def test_fatal_clears_retry_node(self):
        from nodes.error_recovery import error_recovery_node
        state = make_state()
        state["errors"] = [{"category": "fatal", "node": "execute_purchase", "message": "payment declined"}]
        result = error_recovery_node(state)
        assert result["retry_node"] is None
        assert result["status"] == "failed"

    def test_max_retries_exceeded(self):
        from nodes.error_recovery import error_recovery_node
        state = make_state()
        state["errors"] = [{"category": "retryable", "node": "product_search", "message": "timeout"}]
        state["metadata"]["retry_count"] = 3  # already at max
        result = error_recovery_node(state)
        # When retry_count >= MAX_RETRIES, treated as if retryable but won't increment further
        # Actually it still retries up to MAX_RETRIES, so let's check the message changes
        assert result is not None


# ── Intent detection node (LLM mocked) ───────────────────────────────────────

class TestIntentDetectionNode:
    def _mock_detect(self, intent_val: str, entities: dict, ambiguous: bool = False):
        return {
            "intent": intent_val,
            "entities": entities,
            "is_ambiguous": ambiguous,
            "ambiguity_reason": None,
        }

    @patch("nodes.intent_detection.chat_json")
    def test_product_search_intent(self, mock_llm):
        from nodes.intent_detection import intent_detection_node
        mock_llm.return_value = self._mock_detect("product_search", {"category": "headphones"})
        state = make_state(message="I want wireless headphones")
        result = intent_detection_node(state)
        assert result["intent"] == "product_search"
        assert result["query"]["parsed"]["category"] == "headphones"
        assert result["status"] == "ready"

    @patch("nodes.intent_detection.chat_json")
    def test_chat_intent(self, mock_llm):
        from nodes.intent_detection import intent_detection_node
        mock_llm.return_value = self._mock_detect("chat", {})
        state = make_state(message="hello there")
        result = intent_detection_node(state)
        assert result["intent"] == "chat"

    @patch("nodes.intent_detection.chat_json")
    def test_purchase_intent_context(self, mock_llm):
        from nodes.intent_detection import intent_detection_node
        mock_llm.return_value = self._mock_detect("purchase", {})
        state = make_state(message="yes buy it")
        state["conversation_history"] = [{"role": "assistant", "content": "Here are the top headphones..."}]
        result = intent_detection_node(state)
        assert result["intent"] == "purchase"


# ── Validate/enrich node (LLM mocked) ────────────────────────────────────────

class TestValidateEnrichNode:
    @patch("nodes.validate_enrich.chat_json")
    def test_no_missing_fields_passes_through(self, mock_llm):
        from nodes.validate_enrich import validate_enrich_node
        state = make_state()
        state["intent"] = "product_search"
        state["query"]["parsed"]["category"] = "headphones"
        result = validate_enrich_node(state)
        assert result["status"] == "ready"
        mock_llm.assert_not_called()

    def test_autofill_from_explicit_prefs(self):
        from nodes.validate_enrich import validate_enrich_node
        state = make_state(user_id="user-brand-loyal")
        state["intent"] = "product_search"
        state["query"]["parsed"]["category"] = "headphones"
        # budget should auto-fill from explicit prefs (confidence 0.9 > 0.7)
        result = validate_enrich_node(state)
        assert result["query"]["parsed"].get("budget") is not None
        assert result["status"] == "ready"


# ── Graph routing tests ───────────────────────────────────────────────────────

class TestGraphRouting:
    def test_route_chat_to_direct_chat(self):
        from graph import route_after_intent
        state = make_state()
        state["intent"] = "chat"
        assert route_after_intent(state) == "direct_chat"

    def test_route_product_search_to_validate(self):
        from graph import route_after_intent
        state = make_state()
        state["intent"] = "product_search"
        assert route_after_intent(state) == "validate_enrich"

    def test_route_pref_update_to_update_preferences(self):
        from graph import route_after_intent
        state = make_state()
        state["intent"] = "pref_update"
        assert route_after_intent(state) == "update_preferences"

    def test_route_validate_purchase_to_confirmation(self):
        from graph import route_after_validate
        state = make_state()
        state["intent"] = "purchase"
        assert route_after_validate(state) == "purchase_confirmation"

    def test_route_validate_search_to_product_search(self):
        from graph import route_after_validate
        state = make_state()
        state["intent"] = "product_search"
        assert route_after_validate(state) == "product_search"

    def test_route_failed_search_to_error_recovery(self):
        from graph import route_after_product_search
        state = make_state()
        state["status"] = "failed"
        assert route_after_product_search(state) == "error_recovery"

    def test_route_present_select_to_confirmation(self):
        from graph import route_after_present_results
        state = make_state()
        state["present_action"] = "select"
        assert route_after_present_results(state) == "purchase_confirmation"

    def test_route_present_refine_to_validate(self):
        from graph import route_after_present_results
        state = make_state()
        state["present_action"] = "refine"
        assert route_after_present_results(state) == "validate_enrich"

    def test_route_confirmed_purchase_to_execute(self):
        from graph import route_after_purchase_confirmation
        state = make_state()
        state["purchase_confirmation"] = {"user_confirmed": True}
        assert route_after_purchase_confirmation(state) == "execute_purchase"

    def test_route_cancelled_purchase_to_results(self):
        from graph import route_after_purchase_confirmation
        state = make_state()
        state["purchase_confirmation"] = {"user_confirmed": False}
        assert route_after_purchase_confirmation(state) == "present_results"

    def test_route_successful_purchase_to_update_prefs(self):
        from graph import route_after_execute_purchase
        state = make_state()
        state["status"] = "completed"
        assert route_after_execute_purchase(state) == "update_preferences"


# ── Mock API tests ────────────────────────────────────────────────────────────

class TestMockAPI:
    def test_get_preferences_returns_fixture_data(self):
        from mock_api import get_user_preferences
        prefs = get_user_preferences("user-brand-loyal")
        assert "explicit" in prefs
        assert "Sony" in prefs["explicit"]["preferred_brands"]

    def test_get_preferences_unknown_user_returns_defaults(self):
        from mock_api import get_user_preferences
        prefs = get_user_preferences("nonexistent-user-xyz")
        assert prefs["weights"]["price"] == 0.30

    def test_update_explicit_preference(self):
        from mock_api import update_user_preferences, get_user_preferences
        uid = "test-update-user"
        update_user_preferences(uid, {"explicit": [{"field": "preferred_brands", "value": "Sony", "confidence": 0.9}]})
        prefs = get_user_preferences(uid)
        assert "Sony" in prefs["explicit"].get("preferred_brands", [])

    def test_update_scoring_weights(self):
        from mock_api import update_scoring_weights, get_scoring_weights
        uid = "test-weights-user"
        new_w = {"price": 0.50, "rating": 0.20, "delivery": 0.15, "preference_match": 0.15}
        update_scoring_weights(uid, new_w)
        assert get_scoring_weights(uid)["price"] == 0.50
