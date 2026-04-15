# LangGraph Orchestration

The LangGraph state machine is the backbone of the orchestration layer. It defines every node, the transitions between them, and the conditions that trigger each transition. Every node reads and writes a `StateEnvelope` — the single source of truth for the conversation.

---

## Node inventory

| Node | Type | Description |
|---|---|---|
| `intent_detection` | Router | Classifies user message into one of the six intent types. Uses conversation history and user preferences as context, so "yes, buy it" after a product presentation is correctly classified as `purchase`, not `general_chat`. |
| `validate_enrich` | Gate | Checks the parsed query against required fields for the given intent. Fills gaps from the preference store if confidence > 0.7. Loops back to the user if critical info is still missing. |
| `product_search` | Executor | Dispatches parallel Playwright tasks to Amazon and Walmart via `asyncio.gather()`. Each task runs in its own browser context. Timeout: 15 seconds per site. |
| `normalize_rank` | Processor | Maps raw scraped products into `NormalizedProduct` schema. Scores each product against user preferences using the weighted scoring model. Returns a ranked list. |
| `present_results` | Output | Selects top 3–5 products. Generates comparison highlights (cheapest, best-rated, fastest delivery). LLM writes a "why this pick" reasoning grounded in the user's preferences. |
| `purchase_confirmation` | Gate (Hard) | Builds the confirmation payload with ALL required fields. Blocks until the user explicitly approves. **No auto-purchase ever.** |
| `execute_purchase` | Executor | Playwright navigates the full checkout flow. Verifies price, address, and payment at each step before proceeding. |
| `update_preferences` | Processor | Extracts explicit and implicit preferences from the completed turn. Merges into the MongoDB user document. |
| `error_recovery` | Handler | Categorizes failures and routes to the appropriate recovery action (retry, re-login prompt, or fatal notify). |

---

## State transitions (edge definitions)

| From | Condition | To |
|---|---|---|
| `intent_detection` | `status = needs_clarification` | user message (loop back) |
| `intent_detection` | `status = ready`, `intent = product_search` | `validate_enrich` |
| `intent_detection` | `status = ready`, `intent = purchase` | `validate_enrich` |
| `intent_detection` | `status = ready`, `intent = chat` | LLM direct response |
| `intent_detection` | `status = ready`, `intent = pref_update` | `update_preferences` |
| `validate_enrich` | `status = needs_clarification` | user message (loop back) |
| `validate_enrich` | `status = ready`, `intent = product_search` | `product_search` |
| `validate_enrich` | `status = ready`, `intent = purchase` | `purchase_confirmation` |
| `product_search` | `status = completed` | `normalize_rank` |
| `product_search` | `status = failed` | `error_recovery` |
| `normalize_rank` | `status = completed` | `present_results` |
| `present_results` | user selects product | `purchase_confirmation` |
| `present_results` | user refines query | `validate_enrich` |
| `present_results` | user exits | `update_preferences` |
| `purchase_confirmation` | `user_confirmed = true` | `execute_purchase` |
| `purchase_confirmation` | user cancelled | `present_results` |
| `purchase_confirmation` | session expired | `error_recovery` |
| `execute_purchase` | `status = completed` | `update_preferences` |
| `execute_purchase` | `status = failed` | `error_recovery` |
| `error_recovery` | retryable | previous node (retry) |
| `error_recovery` | session expired | prompt re-login |
| `error_recovery` | fatal | `update_preferences` + notify user |

---

## Clarification loop design

Rather than guessing or making bad assumptions, the system asks targeted questions when confidence is low.

### Confidence threshold
The `validate_enrich` node computes a confidence score for each required field against the user's preference history. Above **0.7** → auto-fill. Below 0.7 → ask the user. Early conversations ask more questions; over time the system gets quieter.

### Required fields by intent

| Intent | Required | Nice-to-have |
|---|---|---|
| `product_search` | *(none)* — category is inferred from message keywords or defaults to `electronics` | `budget`, `brand_pref`, `sort_by` |
| `purchase` | `product_id`, `delivery_address`, `payment_method` | — |
| `refine_search` | *(none)* — refinement is inferred from message | `budget`, `sort_by` |
| `browse` | *(none)* | — |
| `pref_update` | *(none)* | — |
| `chat` | *(none)* | — |

> **Note:** `intent_detection` handles category ambiguity with one targeted clarification question. `validate_enrich` does not ask for category again — it infers from message keywords using a fast lookup table, falling back to `"electronics"` if nothing matches.

### Question format
Questions are specific and offer clickable options where possible. Instead of "What kind of headphones do you want?", the system asks "Are you looking for over-ear, on-ear, or earbuds?" This reduces friction and provides structured data.

### Max clarification depth
The system asks a maximum of **3 clarification questions per turn**. If more information is still needed, it proceeds with best-effort defaults and surfaces its assumptions to the user: *"I'm assuming standard delivery since you didn't specify. Want me to change that?"*

---

## Node specifications

### `intent_detection`
- **Input:** Raw user message string + conversation history + user preferences
- **Output:** `StateEnvelope` with `intent` set and `query` populated with extracted entities
- **Clarification trigger:** Ambiguous message (e.g. "get me something nice") → `status = needs_clarification`

### `validate_enrich`
- **Input:** Envelope with intent and parsed query
- **Processing:** For each required field, check if user provided it explicitly. If not, query MongoDB preference store. Use confidence score to decide whether to auto-fill or ask.

### `product_search`
- **Input:** Validated, enriched query with all required fields
- **Processing:** `asyncio.gather(scrape_amazon(...), scrape_walmart(...))` — both sites run simultaneously. Partial results returned if one site times out.
- **Output:** `products` array in envelope, each with `source` field set

### `normalize_rank`
- **Input:** Raw `products` array from both sites
- **Processing:** Map to `NormalizedProduct` schema → compute `ProductScoring` → sort by `composite_score` descending
- **Scoring formula:**
  ```
  composite_score = (price_weight    × price_score)
                  + (rating_weight   × rating_score)
                  + (delivery_weight × delivery_score)
                  + (pref_weight     × preference_match_score)
  ```
  See [data-model.md](data-model.md#scoring-model) for scoring dimension details.

### `present_results`
- **Input:** Ranked products list
- **Output:** Top 3–5 products with LLM-generated comparison: *"The Sony WH-1000XM5 is your best match: it's from a brand you like, has excellent reviews, and is within your usual budget. The Anker Q45 is $100 cheaper but has fewer reviews..."*

### `purchase_confirmation` (hard gate)
The most critical node. **No purchase can proceed without passing this gate.**

Confirmation payload must include ALL of the following before presenting to the user:
- Exact product name (full title, not abbreviated)
- Exact current price (including tax if available)
- Delivery address (full address, not just city)
- Payment method (card type + last 4 digits)
- Retail site (amazon.com or walmart.com)
- Estimated delivery date
- Return policy summary

Additional rules:
- Confirmation expires after **15 minutes** (enforced via Redis TTL)
- If the price changed between confirmation creation and execution → re-prompt user
- Orders above **$500** trigger a double-confirmation: an additional "Are you sure?" prompt with the total highlighted
- Users can cancel at any time before execution

### `execute_purchase`
Playwright checkout validation steps (aborts and triggers `error_recovery` if any check fails):

| Step | Validation | Abort if |
|---|---|---|
| Navigate to product | Title matches confirmed product | Title mismatch |
| Check price | Current price vs confirmed price | Price increased >5% |
| Add to cart | Cart contains exactly the confirmed item | Unexpected cart items |
| Checkout: address | Selected address matches confirmed | Address mismatch |
| Checkout: payment | Selected payment last-4 matches confirmed | Payment method mismatch |
| Place order | Final pre-click verification of all above | Any discrepancy |
| Confirmation | Capture order ID from confirmation page | No order ID found |

### `update_preferences`
- **Input:** Completed interaction context
- **Processing:** LLM extracts explicit preferences ("I prefer Sony") and implicit patterns (consistently picked cheapest). Merged into MongoDB with conflict resolution: explicit always overrides implicit; more recent overrides older.

---

## Error handling

| Category | Examples | Recovery |
|---|---|---|
| `retryable` | Network timeout, page load failure, 503 | Retry same node up to 3 times with exponential backoff (2s, 4s, 8s) |
| `session_expired` | Login page detected during checkout, 401 | Notify user, prompt re-login, save progress, resume after re-auth |
| `data_mismatch` | Price changed, item out of stock, address not found | Abort, notify user with specifics, offer alternatives |
| `site_blocked` | CAPTCHA detected, IP blocked, rate limited | Pause, notify user. CAPTCHA: user solves manually. Block: rotate proxy |
| `fatal` | Payment declined, order rejected, unknown page state | Log full context, notify user clearly, save to error audit |

---

## Playwright anti-bot resilience

| Strategy | Implementation |
|---|---|
| Real browser | Playwright + Chromium with full JS rendering (not headless requests) |
| Request pacing | Random 2–5 second delays between page loads |
| User-agent rotation | Pool of 20+ real browser user-agents, rotated per session |
| Session reuse | Persistent browser contexts per user per site (looks like a returning customer) |
| CAPTCHA handling | Detect CAPTCHA → pause flow → user solves manually → system resumes |
| Proxy rotation | Residential proxy pool, used only if direct connection is blocked |
