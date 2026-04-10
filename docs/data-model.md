# Data Model

Core entities used across the platform. All schemas are defined as Pydantic models in `backend/app/models/`.

---

## UserDocument

Stored in MongoDB `users` collection.

```
UserDocument
├── user_id           string           Primary identifier
├── email             string           Unique email address
├── display_name      string
├── created_at        datetime
├── last_active       datetime
├── auth              map<site, AuthSession>   Encrypted sessions per retail site
├── preferences       PreferenceObject
├── purchase_history  string[]         List of product_ids purchased
├── rejected_products string[]         List of product_ids the user dismissed
└── conversation_context  object       Arbitrary key/value context carried across turns
```

### MongoDB indexes

| Index | Fields | Purpose |
|---|---|---|
| Primary lookup | `user_id` (unique) | Fast user document retrieval |
| Email lookup | `email` (unique) | Account recovery and login |
| Recent activity | `last_active` (descending) | Session cleanup, analytics |

### AuthSession

Stored inside `UserDocument.auth`, keyed by site name (e.g. `"amazon"`).

```
AuthSession
├── site              string
├── encrypted_state   string    AES-256-GCM encrypted browser session cookies/tokens
├── created_at        datetime
└── expires_at        datetime | null   Sessions auto-expire after 24 hours
```

The system **never stores user credentials**. The user logs in themselves via a visible Playwright browser window. Only the resulting session state (cookies) is captured and encrypted.

### PreferenceObject

```
PreferenceObject
├── explicit          ExplicitPreferences
│   └── data          object    User-stated preferences
│                               e.g. { "preferred_brands": ["Sony", "Anker"],
│                                      "avoided_brands": ["Skullcandy"],
│                                      "budget_default": "mid_range",
│                                      "delivery_priority": "standard" }
├── implicit          ImplicitPreferences
│   ├── data          object    Inferred preferences from behaviour
│   │                           e.g. { "avg_purchase_price": 67.50,
│   │                                  "price_sensitivity": 0.72,
│   │                                  "rating_threshold": 4.0,
│   │                                  "sort_tendency": "price_low_to_high" }
│   └── decay_factor  float     How quickly old signals fade (default 0.9)
└── weights           PreferenceWeights
    ├── price               float   Scoring weight for price (default 0.25)
    ├── rating              float   Scoring weight for ratings (default 0.25)
    ├── delivery            float   Scoring weight for delivery speed (default 0.25)
    └── preference_match    float   Scoring weight for attribute match (default 0.25)
```

Weights must sum to 1.0.

### Preference evolution

Preferences evolve through three mechanisms:

1. **Explicit updates** — User directly states a preference ("I only buy Sony headphones"). Stored in `explicit.data`. Always takes priority over implicit.

2. **Implicit learning** — The system observes patterns across purchases and rejections. After 5+ interactions in a category, implicit weights become reliable enough to auto-fill fields. Uses exponential moving average with α = 0.1 so it changes slowly and does not overreact to a single outlier.

3. **Decay** — Implicit preferences older than 6 months are downweighted by 50%. Users' tastes change; the system should not over-anchor on stale data. This is controlled by `decay_factor`.

**Conflict resolution:** explicit always overrides implicit; more recent overrides older.

---

## NormalizedProduct

The common product shape output by the scraper and stored in Redis cache. All retail sites are normalised into this schema before being returned to the frontend.

```
NormalizedProduct
├── product_id          string    Platform-assigned ID (UUID)
├── source              string    Retail site (e.g. "amazon", "walmart")
├── source_url          string    Direct URL to the product page
├── source_product_id   string    Site's own product ID (e.g. ASIN on Amazon)
├── name                string
├── brand               string | null
├── category            string
├── pricing             ProductPricing
│   ├── current_price   float
│   ├── original_price  float | null   Set when item is on sale
│   └── currency        string (default "USD")
├── ratings             ProductRatings
│   ├── average         float | null   Star rating (0.0–5.0)
│   └── count           int | null     Number of reviews
├── delivery            ProductDelivery
│   ├── estimated_days  int | null     Days until delivery
│   ├── prime_eligible  bool
│   └── free_shipping   bool
├── attributes          object    Site-specific extra fields (color, features, weight, etc.)
├── images              string[]  Image URLs
├── scoring             ProductScoring | null   Filled by orchestration's normalize_rank node
│   ├── price_score              float (0.0–1.0)
│   ├── rating_score             float (0.0–1.0)
│   ├── delivery_score           float (0.0–1.0)
│   ├── preference_match_score   float (0.0–1.0)
│   ├── composite_score          float (0.0–1.0)
│   └── match_reasons            string[]   e.g. ["matches brand preference", "within budget"]
├── scraped_at          datetime
└── cache_ttl_seconds   int (default 3600)
```

**Scraper responsibility:** populate all fields except `scoring`.
**Orchestration responsibility:** compute and attach `scoring` before writing to `StateEnvelope.products`.

### Scoring model

Each product receives a composite score between 0.0 and 1.0:

```
composite_score = (price_weight    × price_score)
                + (rating_weight   × rating_score)
                + (delivery_weight × delivery_score)
                + (pref_weight     × preference_match_score)
```

Default weights: `price=0.30`, `rating=0.25`, `delivery=0.20`, `preference_match=0.25`

| Dimension | How it is scored |
|---|---|
| `price_score` | Normalized inverse across the result set: cheapest = 1.0, most expensive = 0.0. Products below the user's `avg_purchase_price` get a bonus. |
| `rating_score` | `rating / 5.0`, with a penalty if `review_count` is below the user's `rating_threshold`. |
| `delivery_score` | Days until delivery normalized: same-day = 1.0, 7+ days = 0.0. Prime/free shipping adds a 0.1 bonus. |
| `preference_match_score` | Number of matching attributes (brand, color, features) ÷ total attributes checked. Explicit preferences count double. |

**Weight adaptation:** After each completed interaction (purchase or rejection), weights adjust based on what the user actually chose. If the user consistently picks the cheapest option, `price_weight` gradually increases (capped at 0.5). Adaptation uses exponential moving average with α = 0.1.

---

## StateEnvelope

Stored in MongoDB `conversations` collection (one document per `session_id`). Also the message format for the WebSocket protocol — see [websocket-protocol.md](websocket-protocol.md).

```
StateEnvelope
├── session_id            string
├── user_id               string
├── turn_id               string      New value each turn
├── timestamp             datetime
├── intent                Intent | null
├── status                Status
├── query                 string | null    Raw user query text
├── missing_fields        string[]         Fields still needed by validate_enrich
├── clarification         string | null    Question text to display to user
├── products              NormalizedProduct[]
├── selected_product      NormalizedProduct | null
├── purchase_confirmation PurchaseConfirmation | null
├── preference_updates    object           Preferences extracted this turn
├── errors                ErrorObject[]
└── metadata              object           Pass-through (nodes_visited, latency, etc.)
```

### Intent values
`product_search` · `purchase` · `refine_search` · `browse` · `preference_update` · `general_chat`

### Status values
`ready` · `needs_clarification` · `executing` · `completed` · `failed`

---

## OrderRecord

Stored in PostgreSQL `orders` table.

```
OrderRecord
├── order_id          string    PRIMARY KEY
├── user_id           string    Indexed
├── product           NormalizedProduct
├── confirmation      PurchaseConfirmation
│   ├── product_name             string     Full product title (not abbreviated)
│   ├── current_price            float      Price at time of confirmation
│   ├── delivery_address         string     Full address
│   ├── payment_last_four        string     Last 4 digits only — payment data is never stored
│   ├── retail_site              string
│   ├── estimated_delivery_date  string | null
│   ├── return_policy_summary    string | null
│   ├── expires_at               datetime   15-minute confirmation window
│   └── confirmed                bool
├── site_order_id     string | null   Order ID captured from the retailer's confirmation page
├── status            string    "placed" | "shipped" | "delivered" | "cancelled"
├── created_at        datetime
└── updated_at        datetime
```

### PostgreSQL indexes

| Index | Purpose |
|---|---|
| `orders_user_id_idx` | Look up all orders for a user |
| `orders_status_idx` | Filter by order status |

---

## Redis key schema

| Key pattern | Stored value | TTL | Purpose |
|---|---|---|---|
| `product_cache:{query_hash}` | JSON array of `NormalizedProduct` | Configurable (default 3600 s) | Avoids re-scraping the same query |
| `session_state:{user_id}:{site}` | Encrypted session state string | Set by caller | Fast session lookup without Mongo round-trip |
| `confirmation:{session_id}` | `PurchaseConfirmation` JSON | `CONFIRMATION_TTL_SECONDS` (default 900 s) | Purchase confirmation window enforcement |

---

## ErrorObject

Attached to `StateEnvelope.errors` when something goes wrong mid-turn.

```
ErrorObject
├── category    ErrorCategory   retryable | session_expired | data_mismatch | site_blocked | fatal
├── message     string
├── retryable   bool
└── context     object | null   Extra debugging info (expected vs actual values, URLs, etc.)
```

See [langgraph.md](langgraph.md#error-handling) for recovery strategies per category.
