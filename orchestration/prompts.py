"""
LLM prompt templates for all ClickLess AI nodes.
Each template is a function that returns a list-of-messages (OpenAI format).
"""
from typing import Any


# ── Intent Detection ──────────────────────────────────────────────────────────

INTENT_EXAMPLES = """
Examples (input → JSON output):
- "I want to buy wireless headphones" → {"intent":"product_search","entities":{"category":"headphones","attributes":{"type":"wireless"},"budget":null,"brand_pref":null,"sort_by":null},"is_ambiguous":false,"ambiguity_reason":null}
- "buy the Sony one" (after product display) → {"intent":"purchase","entities":{"category":null,"attributes":{},"budget":null,"brand_pref":"Sony","sort_by":null},"is_ambiguous":false,"ambiguity_reason":null}
- "yes buy it" (after product display) → {"intent":"purchase","entities":{},"is_ambiguous":false,"ambiguity_reason":null}
- "show me cheaper ones" → {"intent":"refine_search","entities":{"sort_by":"price_low_to_high"},"is_ambiguous":false,"ambiguity_reason":null}
- "I prefer Sony" → {"intent":"pref_update","entities":{"preferred_brands":["Sony"]},"is_ambiguous":false,"ambiguity_reason":null}
- "get me something nice" → {"intent":"product_search","entities":{"category":null},"is_ambiguous":true,"ambiguity_reason":"category is unclear"}
- "hello" → {"intent":"chat","entities":{},"is_ambiguous":false,"ambiguity_reason":null}
- "compare iphone 17 and samsung galaxy s21" → {"intent":"product_search","entities":{"category":"smartphone","attributes":{"comparison":"iphone 17 vs samsung galaxy s21"},"budget":null,"brand_pref":null,"sort_by":null},"is_ambiguous":false,"ambiguity_reason":null}
- "compare sony wh-1000xm5 vs bose qc45" → {"intent":"product_search","entities":{"category":"headphones","attributes":{"comparison":"sony wh-1000xm5 vs bose qc45"},"budget":null,"brand_pref":null,"sort_by":null},"is_ambiguous":false,"ambiguity_reason":null}
- "iphone 17 pro max" → {"intent":"product_search","entities":{"category":"smartphone","attributes":{},"budget":null,"brand_pref":"Apple","sort_by":null},"is_ambiguous":false,"ambiguity_reason":null}
- "samsung galaxy s21" → {"intent":"product_search","entities":{"category":"smartphone","attributes":{},"budget":null,"brand_pref":"Samsung","sort_by":null},"is_ambiguous":false,"ambiguity_reason":null}
- "macbook pro 14 inch" → {"intent":"product_search","entities":{"category":"laptop","attributes":{"size":"14 inch"},"budget":null,"brand_pref":"Apple","sort_by":null},"is_ambiguous":false,"ambiguity_reason":null}
"""


def intent_detection_prompt(user_message: str, conversation_history: list, user_prefs: dict) -> list[dict]:
    system = f"""You are the intent detection module of ClickLess AI, a shopping assistant.

Classify the user's message into one of these intents:
  product_search, purchase, refine_search, browse, pref_update, chat

Extract any shopping entities mentioned: category, attributes (type, color, style, etc.), budget, brand_pref, sort_by.

Conversation context is critical. "yes buy it" after product results means purchase intent, not chat.

IMPORTANT rules for ambiguity:
- Well-known product model names (iPhone, Galaxy, MacBook, AirPods, Sony WH-*, Bose QC*, etc.) ALWAYS imply a clear category — never mark these as ambiguous.
- "compare X and Y" queries are NEVER ambiguous — extract category from the product names and set brand_pref to null (do not pick a side).
- Only set is_ambiguous=true when you genuinely cannot infer ANY useful category or intent, e.g. "get me something nice" or "buy it" with no prior context.

{INTENT_EXAMPLES}

Respond ONLY with a JSON object:
{{
  "intent": "<intent>",
  "entities": {{
    "category": <string or null>,
    "attributes": {{<key>: <value>}},
    "budget": <string or null>,
    "brand_pref": <string or null>,
    "sort_by": <string or null>
  }},
  "is_ambiguous": <true/false>,
  "ambiguity_reason": <string or null>
}}"""

    messages = [{"role": "system", "content": system}]
    for turn in conversation_history[-6:]:  # last 6 turns for context
        messages.append(turn)

    prefs = user_prefs if isinstance(user_prefs, dict) else {}
    user_content = f"User preferences summary: {prefs.get('explicit', {})}\n\nUser message: {user_message}"
    messages.append({"role": "user", "content": user_content})
    return messages


def intent_with_clarification_prompt(original_message: str, clarification_answer: str, conversation_history: list, user_prefs: dict) -> list[dict]:
    combined = f"{original_message} (Clarification provided: {clarification_answer})"
    return intent_detection_prompt(combined, conversation_history, user_prefs)


# ── Validate & Enrich – Clarification question generation ────────────────────

def clarification_question_prompt(field: str, context: dict) -> list[dict]:
    system = """You are a helpful shopping assistant. Generate a SHORT, specific clarification question for the missing field.
Always suggest 3-4 clickable options when applicable.
Respond ONLY with JSON:
{"question": "<short question>", "options": ["<opt1>", "<opt2>", ...]}
Options array can be empty [] for free-text fields like delivery address."""

    category = context.get("category", "product")
    user_content = f"Missing field: {field}\nProduct category: {category}\nGenerate a clarification question."
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user_content},
    ]


# ── Present Results – Natural language comparison ────────────────────────────

def comparison_generation_prompt(products: list, user_prefs: dict) -> list[dict]:
    system = """You are a shopping assistant helping a user choose a product.
Given a ranked list of products and the user's preferences, write a BRIEF natural-language comparison (2-4 sentences).
Structure:
1. Recommend the top product with a reason tied to the user's preferences.
2. Mention 1-2 trade-offs of the other top options.
3. End with a gentle nudge: "Want me to go with the [top product]?"

Keep it conversational, concise, and preference-aware. Do NOT list specs robotically."""

    top3 = products[:3]
    product_summary = []
    for i, p in enumerate(top3):
        if not isinstance(p, dict):
            continue
        product_summary.append({
            "rank": i + 1,
            "name": p.get("name", ""),
            "brand": p.get("brand", ""),
            "price": p.get("pricing", {}).get("current_price"),
            "rating": p.get("ratings", {}).get("stars"),
            "review_count": p.get("ratings", {}).get("review_count"),
            "delivery_date": p.get("delivery", {}).get("estimated_date"),
            "source": p.get("source", ""),
            "composite_score": p.get("scoring", {}).get("composite_score"),
            "match_reasons": p.get("scoring", {}).get("match_reasons", []),
        })

    prefs = user_prefs if isinstance(user_prefs, dict) else {}
    user_content = f"""User preferences: {prefs.get('explicit', {})}
Implicit patterns: {prefs.get('implicit', {})}

Ranked products:
{product_summary}

Write the comparison."""

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user_content},
    ]


# ── Update Preferences – Preference extraction ───────────────────────────────

def preference_extraction_prompt(conversation_turns: list, chosen_product: dict | None, rejected_products: list) -> list[dict]:
    system = """You are analyzing a shopping conversation to extract user preferences.
Extract:
1. Explicit preferences: things the user stated directly ("I prefer Sony", "under $100")
2. Implicit preferences: patterns inferred from choices (chose cheapest = price sensitive)
3. Rejection signals: products the user rejected and why

Respond ONLY with JSON:
{
  "explicit": [{"field": "<field>", "value": "<value>", "confidence": 0.9}],
  "implicit": [{"field": "<field>", "value": "<value>", "confidence": 0.7}],
  "rejections": [{"product": "<name>", "reason": "<reason>"}]
}

Valid fields: preferred_brands, avoided_brands, budget_default, delivery_priority,
price_sensitivity (0-1), rating_threshold (1-5), sort_tendency, eco_friendly."""

    user_content = f"""Conversation turns: {conversation_turns[-10:]}
Chosen product: {chosen_product}
Rejected products: {rejected_products}

Extract preferences."""

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user_content},
    ]


# ── General chat ─────────────────────────────────────────────────────────────

def general_chat_prompt(user_message: str, conversation_history: list) -> list[dict]:
    system = "You are ClickLess AI, a friendly shopping assistant. Answer concisely."
    messages = [{"role": "system", "content": system}]
    for turn in conversation_history[-6:]:
        messages.append(turn)
    messages.append({"role": "user", "content": user_message})
    return messages
