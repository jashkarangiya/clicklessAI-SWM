# WebSocket Protocol

## Endpoint

```
WS /ws/chat/{session_id}
```

`session_id` is a unique identifier for a conversation session, scoped to a single user interaction flow.

---

## Connection lifecycle

```
Client                          Server
  |                               |
  |──── WS Upgrade ──────────────►|
  |                               |  accept()
  |                               |  load existing StateEnvelope from MongoDB
  |◄─── StateEnvelope (if any) ───|  (replays last known state on reconnect)
  |                               |
  |──── StateEnvelope (turn N) ──►|  validate + persist to MongoDB
  |◄─── StateEnvelope (turn N) ───|  echo confirmed saved state
  |                               |
  |──── StateEnvelope (turn N+1)─►|
  |◄─── StateEnvelope (turn N+1)──|
  |                               |
  |──── disconnect ──────────────►|  session removed from active connections
```

---

## Message format

All messages are JSON. The canonical shape is `StateEnvelope`.

### Full envelope example

```json
{
  "session_id": "sess_abc123",
  "user_id": "user_xyz",
  "turn_id": "turn_014",
  "timestamp": "2026-04-09T12:00:00Z",

  "intent": "product_search",
  "status": "needs_clarification",
  "query": "buy me good wireless headphones",

  "missing_fields": ["budget"],
  "clarification": "What is your budget range for these headphones?",

  "products": [],
  "selected_product": null,
  "purchase_confirmation": null,

  "preference_updates": {},
  "errors": [],
  "metadata": {
    "nodes_visited": ["intent_detection", "validate_enrich"],
    "total_latency_ms": 1240,
    "scrape_results_count": { "amazon": 0, "walmart": 0 }
  }
}
```

> **Note on `clarification`:** The backend model stores `clarification` as a plain string (the question text). The orchestration layer is responsible for any structured options payload it wants to embed in `metadata`. The frontend should check `metadata` for a `clarification_options` array if it wants to render clickable choice buttons.

---

## Fields

### Required

| Field | Type | Description |
|---|---|---|
| `session_id` | string | Must match the `{session_id}` path parameter |
| `user_id` | string | Owning user |
| `turn_id` | string | Unique ID for this turn (e.g. UUID or incrementing counter) |
| `timestamp` | ISO 8601 datetime | Client-side timestamp of the turn |

### State machine fields

| Field | Type | Description |
|---|---|---|
| `status` | `Status` enum | Current status of the conversation turn |
| `intent` | `Intent` enum \| null | Detected intent for this turn |

### Content fields

| Field | Type | Description |
|---|---|---|
| `query` | string \| null | Raw user query text |
| `missing_fields` | string[] | Field names the orchestrator still needs (e.g. `["budget", "brand"]`) |
| `clarification` | string \| null | Question text to display to the user |
| `products` | `NormalizedProduct[]` | Ranked product results (filled by `normalize_rank` node) |
| `selected_product` | `NormalizedProduct` \| null | Product the user selected for purchase |
| `purchase_confirmation` | `PurchaseConfirmation` \| null | Full confirmation payload shown before purchase |
| `preference_updates` | object | Key/value preference changes extracted this turn |
| `errors` | `ErrorObject[]` | Any errors that occurred this turn |
| `metadata` | object | Arbitrary pass-through data (see conventions below) |

### `metadata` conventions

The `metadata` field is a free-form object. The orchestration layer uses these keys by convention:

| Key | Type | Description |
|---|---|---|
| `nodes_visited` | string[] | LangGraph nodes traversed this turn |
| `total_latency_ms` | int | Total processing time in milliseconds |
| `scrape_results_count` | object | `{ "amazon": N, "walmart": N }` — raw results before ranking |
| `clarification_options` | string[] | Clickable choices for the current clarification question (e.g. `["Under $50", "$50-$100", "$100-$200"]`) |
| `order_id` | string | Set by orchestration on successful purchase completion |

---

## Status enum

| Value | Meaning | Frontend action |
|---|---|---|
| `ready` | Waiting for user input | Render response, enable input |
| `needs_clarification` | Orchestrator needs more info | Show `clarification` text; render `metadata.clarification_options` as buttons if present |
| `executing` | Orchestrator is running (scraping, purchasing) | Show loading / progress indicator |
| `completed` | Turn finished successfully | Render final state |
| `failed` | Turn failed | Show error message from `errors[0].message` |

---

## Intent enum

| Value | Meaning |
|---|---|
| `product_search` | User wants to find a product |
| `purchase` | User wants to buy the selected product |
| `refine_search` | User is adjusting the current search |
| `browse` | User is exploring without a specific goal |
| `preference_update` | User stated a preference explicitly |
| `general_chat` | Off-topic or casual message |

---

## Error format

When `status` is `failed`, the `errors` array contains one or more `ErrorObject`s:

```json
{
  "category": "data_mismatch",
  "message": "Price changed from $298.00 to $329.00 during checkout",
  "retryable": false,
  "context": {
    "expected_price": 298.00,
    "actual_price": 329.00,
    "product_url": "https://..."
  }
}
```

Error categories: `retryable` · `session_expired` · `data_mismatch` · `site_blocked` · `fatal`

---

## Parse error response

If the server cannot parse an incoming message, it responds with:

```json
{
  "error": "invalid_message",
  "detail": "<exception message>"
}
```

The connection stays open — the client should fix and resend.

---

## Typical turn sequences

### Product search

```
Client → { intent: "product_search", status: "ready", query: "wireless headphones under $100" }
Server → { status: "executing", metadata: { nodes_visited: ["intent_detection", "validate_enrich", "product_search"] } }
Server → { status: "ready", products: [...], metadata: { scrape_results_count: { amazon: 8, walmart: 5 } } }
```

### Clarification needed

```
Client → { intent: "product_search", query: "headphones" }
Server → {
  status: "needs_clarification",
  missing_fields: ["budget"],
  clarification: "What is your budget range for these headphones?",
  metadata: { clarification_options: ["Under $50", "$50-$100", "$100-$200", "No limit"] }
}
Client → { query: "under $100" }
Server → { status: "ready", products: [...] }
```

### Purchase flow

```
Client → { intent: "purchase", selected_product: { product_id: "prod_001", ... } }
Server → {
  status: "needs_clarification",
  purchase_confirmation: {
    product_name: "Sony WH-1000XM5...",
    current_price: 298.00,
    delivery_address: "742 Evergreen Terrace, Phoenix AZ",
    payment_last_four: "4242",
    retail_site: "amazon",
    confirmed: false,
    expires_at: "2026-04-09T12:15:00Z"
  }
}
Client → { intent: "purchase", purchase_confirmation: { ...same fields..., confirmed: true } }
Server → { status: "executing" }
Server → { status: "completed", metadata: { order_id: "114-1234567-8901234" } }
```

### Price changed during checkout (abort)

```
Server → { status: "failed", errors: [{ category: "data_mismatch", message: "Price changed from $298.00 to $329.00", retryable: false }] }
```
User must re-confirm with the new price before the system retries.

---

## Purchase confirmation rules

- All fields in `purchase_confirmation` must be non-null before presenting to the user.
- Confirmation expires after **15 minutes** (`expires_at` field). After expiry, a fresh price check is required.
- If the price increased by more than **5%** between confirmation and execution, the purchase is aborted and the user must re-confirm.
- For orders above **$500**, a second confirmation prompt is shown (set by `PURCHASE_THRESHOLD_AMOUNT` env var).
- Users can cancel at any time by sending `purchase_confirmation.confirmed = false`.

---

## Reconnection

On reconnect with an existing `session_id`, the server immediately sends the last persisted `StateEnvelope`. The client should use this to restore UI state without re-sending the last turn.
