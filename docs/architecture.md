# System Architecture

## Overview

ClickLess AI is a human-in-the-loop conversational web automation platform. A user describes what they want to buy; the system searches retail sites, presents ranked results, and executes the purchase — pausing for human confirmation at every critical decision point.

The core philosophy: automate the tedious parts (browsing, comparing, checking out) while ensuring the user explicitly confirms every purchase with full visibility into what is being bought, where, and how.

**Key design principles:**
1. Never purchase without explicit hard confirmation.
2. Ask clarification questions rather than making assumptions.
3. Learn user preferences over time to reduce friction.
4. Users handle their own authentication — the system never stores credentials.

---

## Layer breakdown

| Layer | Components | Responsibility |
|---|---|---|
| **Presentation** | React/Next.js chat UI, WebSocket | User interaction, real-time status updates, product display cards, confirmation modals |
| **Orchestration** | LangGraph state machine | Intent routing, state transitions, clarification loops, node sequencing |
| **Intelligence** | LLM planner (GPT-4/Claude), recommendation engine | Natural language understanding, action planning, product ranking, preference extraction |
| **Execution** | Playwright (async), browser contexts | Web scraping, product search, cart management, checkout automation |
| **Data** | MongoDB, PostgreSQL, Redis | User profiles and preferences (Mongo), order audit trail (Postgres), session cache (Redis) |

---

## System diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser / Client                      │
│                        (Next.js frontend)                    │
└──────────────┬──────────────────────────┬───────────────────┘
               │ REST (auth, settings)     │ WebSocket
               │                          │ /ws/chat/{session_id}
               ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Backend                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Users   │  │ Sessions │  │  Orders  │  │  Cache    │  │
│  │  /users  │  │/sessions │  │ /orders  │  │  /cache   │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
│                 ┌─────────────────────────┐                 │
│                 │  Conversations + WS      │                 │
│                 │  /conversations  /ws     │                 │
│                 └─────────────────────────┘                 │
└───────┬─────────────────┬─────────────────┬─────────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
   MongoDB           PostgreSQL           Redis
 (users,           (orders table)     (product cache,
  conversations)                       session state)
        ▲
        │ read/write StateEnvelope
        │
┌───────┴──────────────────────────────────────────────────────┐
│                  LangGraph Orchestration                      │
│   (intent detection, product ranking, purchase automation)    │
└───────────────────────┬──────────────────────────────────────┘
                        │ asyncio.gather() — parallel per site
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Playwright Scraper                         │
│   Amazon and Walmart scraped simultaneously (15s timeout)    │
│   Each site runs in an isolated browser context per user     │
└─────────────────────────────────────────────────────────────┘
```

---

## Component responsibilities

### Frontend (Next.js)
- Renders the chat UI, product comparison cards, and purchase confirmation modals.
- Authenticates the user (Google OAuth, session stored in Redux).
- Communicates with the backend over **WebSocket** for the chat loop, and over **REST** for one-off operations (settings, order history).
- The confirmation modal is visually distinct from chat bubbles — it functions like a checkout summary.

### Backend (FastAPI)
- Single source of truth for persistent state: users, sessions, orders, conversation envelopes.
- Relays `StateEnvelope` messages between the frontend (via WebSocket) and the orchestration layer (via MongoDB reads/writes).
- Does **not** contain AI logic — it stores and serves state.

### LangGraph Orchestration
- Reads the current `StateEnvelope` from MongoDB.
- Routes through a stateful node graph: intent detection → validation → search → ranking → presentation → confirmation → purchase.
- Writes the updated envelope back to MongoDB; the backend WebSocket then pushes it to the frontend.
- See [langgraph.md](langgraph.md) for the full node and edge specification.

### Playwright Scraper
- Launched by the orchestration layer's `product_search` node.
- Runs Amazon and Walmart simultaneously via `asyncio.gather()`, each in its own browser context.
- Waits up to 15 seconds per site before timing out and continuing with partial results.
- Returns `NormalizedProduct` objects; results are cached in Redis via `POST /api/cache/products`.
- Reuses persistent browser contexts per user per site (user logs in once; subsequent scrapes reuse that session).

---

## Data stores

| Store | What lives there | Why |
|---|---|---|
| **MongoDB** | `users` collection, `conversations` collection | Flexible document schema fits evolving preference/context shapes |
| **PostgreSQL** | `orders` table | Relational integrity for financial records, strong query support |
| **Redis** | Product cache (`product_cache:{hash}`), session state (`session_state:{uid}:{site}`), confirmation TTL (`confirmation:{session_id}`) | TTL-based expiry, fast reads |

### MongoDB indexes

| Index | Fields | Purpose |
|---|---|---|
| Primary lookup | `user_id` (unique) | Fast user document retrieval |
| Email lookup | `email` (unique) | Account recovery and login |
| Recent activity | `last_active` (descending) | Session cleanup, analytics |
| Conversation | `session_id` (unique) | Fast envelope retrieval |

---

## Request flows

### Chat turn (happy path)

```
User types message
  → Frontend sends StateEnvelope over WS to Backend
  → Backend persists envelope to MongoDB, echoes back to client
  → Orchestration reads envelope, routes through LangGraph nodes:
      intent_detection → validate_enrich → product_search → normalize_rank → present_results
  → Scraper runs Amazon + Walmart in parallel (asyncio.gather)
  → Orchestration writes updated envelope (with ranked products) to MongoDB
  → Backend WS pushes updated envelope to Frontend
  → Frontend renders product comparison cards
```

### Clarification loop

```
User sends ambiguous query ("get me something nice")
  → intent_detection sets status=needs_clarification
  → Orchestration writes envelope with clarification question + options
  → Frontend renders question with clickable option buttons
  → User answers → new envelope sent → flow continues
  → Max 3 clarification questions per turn before proceeding with best-effort defaults
```

### Purchase confirmation

```
User selects product
  → validate_enrich → purchase_confirmation node (hard gate)
  → Confirmation payload built with ALL required fields (price, address, payment last-4, etc.)
  → Frontend shows distinct confirmation modal (not a chat bubble)
  → User must click "Confirm Purchase" (typing "yes" triggers a secondary prompt)
  → execute_purchase node runs Playwright checkout with price/address/payment verification
  → If price changed >5% → abort, notify user, re-confirm
  → On success → OrderRecord written via POST /api/orders
  → Envelope status set to completed
```

---

## Inter-team integration points

| Contract | Owned by | Consumed by |
|---|---|---|
| `StateEnvelope` schema | Backend | Orchestration, Frontend |
| `NormalizedProduct` schema | Backend | Scraper (output shape), Orchestration, Frontend |
| `POST /api/cache/products` | Backend | Orchestration (after scrape) |
| `GET /api/cache/products?query=` | Backend | Orchestration (cache check before scrape) |
| `POST /api/conversations/{session_id}` | Backend | Orchestration (write turn result) |
| `WS /ws/chat/{session_id}` | Backend | Frontend |

See [openapi.yaml](../backend/openapi.yaml) for full schema definitions and [langgraph.md](langgraph.md) for orchestration internals.
