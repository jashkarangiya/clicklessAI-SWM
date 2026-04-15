# ClickLess AI

> **Shop by describing what you want. ClickLess finds it, compares it, and checks out — pausing for your confirmation before every purchase.**

ClickLess AI is a human-in-the-loop conversational shopping platform. A user types what they want to buy; the system searches Amazon and Walmart simultaneously, ranks results against the user's preferences, and executes the purchase through Playwright browser automation — with a hard confirmation gate that requires explicit user approval before any order is placed.

---

## How it works

```
User message
  └─► FastAPI (WebSocket)
        └─► LangGraph orchestration
              ├─► Intent detection + validation
              ├─► Playwright scraper (Amazon + Walmart in parallel)
              ├─► Preference-weighted ranking
              └─► Purchase confirmation gate ──► Playwright checkout
                        ↑
              No purchase without explicit user confirmation
```

Full architecture detail: [`docs/architecture.md`](docs/architecture.md)

---

## Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Mantine 8, Redux Toolkit, Zustand |
| **Backend** | FastAPI + Uvicorn, Python 3.11 |
| **Orchestration** | LangGraph state machine, GPT-4 / Claude |
| **Scraping** | Playwright (async, parallel per site) |
| **Databases** | MongoDB (users + conversations), PostgreSQL (orders), Redis (cache + sessions) |
| **Containerisation** | Docker + Docker Compose |

---

## Repository structure

```
clicklessAI-SWM/
├── frontend/           Next.js chat UI
│   └── README.md       → Frontend setup guide
├── backend/            FastAPI API server + WebSocket handler
│   ├── app/            Routers, models, services, DB clients
│   ├── openapi.yaml    Full OpenAPI 3.0 spec
│   ├── docker-compose.yaml
│   └── README.md       → Backend setup guide
├── orchestration/      LangGraph state machine
│   ├── graph.py        Node + edge definitions
│   ├── nodes/          One file per LangGraph node
│   ├── state.py        StateEnvelope definition
│   └── scoring.py      Preference-weighted product scoring
├── scraper/            Playwright scraper (Amazon + Walmart)
├── database/           Database schema / migration helpers
├── docs/               Shared technical documentation (see below)
├── CONTRIBUTING.md     Branch and PR workflow
├── RULES.md            Project rules
└── README.md           ← you are here
```

---

## Quick start

### Prerequisites

- **Node.js 20+** and npm (for frontend)
- **Python 3.11+** (for backend + orchestration)
- **Docker + Docker Compose** (for databases)

---

### 1 — Start the databases

```bash
cd backend
docker compose up mongo postgres redis -d
```

This starts MongoDB (27017), PostgreSQL (5432), and Redis (6379) with persistent volumes.

### 2 — Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # edit if your ports differ
uvicorn app.main:app --reload
```

API available at `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

> **Critical env vars:** `SESSION_ENCRYPTION_KEY` (must be exactly 32 bytes) and `APP_SECRET_KEY`. Change both from their `changeme` defaults in any non-local environment. See [`docs/deployment.md`](docs/deployment.md) for the full variable reference.

### 3 — Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm run dev
```

App available at `http://localhost:3000`

### 4 — Seed sample data (optional)

```bash
# Databases must be running first
cd backend
python scripts/seed_data.py
```

### Full stack with Docker Compose

```bash
cd backend
docker compose up --build
```

---

## Documentation

| Document | What it covers |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | System diagram, layer breakdown, request flows (chat turn, clarification loop, purchase confirmation), inter-team integration contracts |
| [`docs/langgraph.md`](docs/langgraph.md) | Every LangGraph node and edge, clarification loop design, node I/O specs, error recovery strategy, Playwright anti-bot resilience |
| [`docs/data-model.md`](docs/data-model.md) | `UserDocument`, `NormalizedProduct`, `StateEnvelope`, `OrderRecord`, Redis key schema, preference scoring model |
| [`docs/websocket-protocol.md`](docs/websocket-protocol.md) | WebSocket endpoint, message format, all fields, status/intent enums, typical turn sequences (search, clarification, purchase, price-change abort) |
| [`docs/deployment.md`](docs/deployment.md) | Docker Compose services, all environment variables, DB setup, health check endpoints, security considerations, production checklist |
| [`backend/README.md`](backend/README.md) | Backend-specific local setup, project layout, API route summary |
| [`backend/openapi.yaml`](backend/openapi.yaml) | Full OpenAPI 3.0 spec for all REST endpoints |

---

## Key design principles

1. **No purchase without explicit confirmation.** Every order goes through a hard confirmation gate that requires the user to actively approve the exact product, price, address, and payment method before Playwright touches checkout.

2. **Clarification over assumption.** When a query is ambiguous, the system asks a targeted question (up to 3 per turn) rather than guessing. Over time it learns enough about the user to need fewer questions.

3. **Credentials are never stored.** The user logs in to Amazon/Walmart themselves via a visible browser window. Only the resulting encrypted session cookies are stored — never usernames or passwords.

4. **Parallel scraping.** Amazon and Walmart are scraped simultaneously via `asyncio.gather()`. Results are ranked by a preference-weighted composite score (price × 0.30, rating × 0.25, delivery × 0.20, preference match × 0.25). Weights adapt after every completed interaction.

---

## Team

| Area | Owner(s) |
|---|---|
| Frontend | Harsh Patel |
| Scraping | Nishit Patel, Jash Karangiya |
| LangGraph / Orchestration | Krish Patel, Kaushha Trivedi |
| Backend / API / Database | Khwahish Patel |
| Docs | Shared |

---

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the branch naming convention and PR workflow.  
See [`RULES.md`](RULES.md) for project-wide rules.

Short version:

```bash
git checkout -b feature/your-change   # branch from main
# ... make changes ...
git push origin feature/your-change
# open a Pull Request — 1 approval required to merge
```
