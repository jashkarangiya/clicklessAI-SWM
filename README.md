# ClickLess AI

> **Shop by describing what you want. ClickLess finds it, compares it, and checks out — pausing for your confirmation before every purchase.**

ClickLess AI is a human-in-the-loop conversational shopping platform. A user types what they want to buy; the system detects intent, enriches missing fields from user preferences, and searches Amazon + Walmart simultaneously. Ranked results are returned in a comparison grid with LLM-generated reasoning. The user can initiate a purchase — system navigates checkout via Playwright with a hard confirmation gate before placing any order. Preferences are learned over time to reduce friction on future turns.

---

## How it works

```
User message
  └─► FastAPI (WebSocket)
        └─► LangGraph orchestration
              ├─► Intent detection + validation
              ├─► Playwright scraper (Amazon + Walmart in parallel)
              ├─► Preference-weighted ranking  (Qwen3 LLM reasoning)
              └─► Purchase confirmation gate ──► Playwright checkout
                        ↑
              No purchase without explicit user confirmation
```

Full architecture detail: [`docs/architecture.md`](docs/architecture.md)

---

## Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), React, Mantine UI, Redux Toolkit, Zustand |
| **Backend** | FastAPI + Uvicorn, Python 3.11 |
| **Orchestration** | LangGraph, OpenAI-compatible LLM (Qwen3) |
| **Scraping** | Playwright (async, parallel per site), Chromium |
| **Databases** | MongoDB (users + conversations), PostgreSQL (orders), Redis (cache + sessions) |
| **Real-time** | WebSocket (`/ws/chat/{session_id}`) |
| **TTS / STT** | ElevenLabs API |
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
├── orchestration/      LangGraph pipeline (intent, search, ranking, purchase)
│   ├── graph.py        Node + edge definitions
│   ├── nodes/          One file per LangGraph node
│   ├── state.py        StateEnvelope definition
│   └── scoring.py      Preference-weighted product scoring
├── scraper/            Playwright scrapers for Amazon and Walmart
├── database/           Database schema / migration helpers
├── docs/               Shared technical documentation (see below)
├── CONTRIBUTING.md     Branch and PR workflow
├── RULES.md            Project rules
└── README.md           ← you are here
```

---

## Quick start (macOS, end to end)

Every command below is copy-pasteable on a clean Mac. Follow them in order — the
result is a working chat UI at `http://localhost:3000` talking to a live LangGraph
pipeline.

You will need **three terminal tabs** by the end: one for the databases (detached,
so it frees up), one for the backend, one for the frontend.

### 0 — Install prerequisites

```bash
# Homebrew, if you don't already have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install python@3.11 node git
brew install --cask docker
```

Then **launch Docker Desktop from Applications and wait for the whale icon in the
menu bar to stop animating.** The `docker` CLI fails with a socket error until the
engine is actually running — this is the single most common setup problem.

Verify:

```bash
python3.11 --version   # 3.11.x  (3.12 / 3.13 also work)
node --version         # v20.x or newer
docker info            # must succeed, not error
```

### 1 — Clone

```bash
git clone https://github.com/jashkarangiya/clicklessAI-SWM.git
cd clicklessAI-SWM
```

### 2 — Start the databases

```bash
cd backend
docker compose up mongo postgres redis -d
```

Starts MongoDB (27017), PostgreSQL (5432), and Redis (6379) with persistent volumes.
Confirm all three are mapped to host ports:

```bash
docker compose ps
```

Each row must show a mapping like `0.0.0.0:27017->27017/tcp`. If the `PORTS` column
shows only `27017/tcp` with no `0.0.0.0` prefix, the container is stale — recreate it
with `docker compose up mongo postgres redis -d --force-recreate`.

### 3 — Backend + orchestration

From the repo root:

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Create the environment file:

```bash
cp .env.example .env
```

Now open `backend/.env` and set the two values that are **not** pre-filled:

| Variable | What to set it to |
|---|---|
| `OPENAI_API_KEY` | Your ASU RC API key. The endpoint is already set to `https://openai.rc.asu.edu/v1`. |
| `SESSION_ENCRYPTION_KEY` | Exactly 32 bytes. Generate one with `python -c "import secrets; print(secrets.token_urlsafe(24))"` |

`APP_SECRET_KEY` ships as `changeme` and signs the login JWTs. Fine for a local demo,
but change it for anything shared — and note that **changing it later invalidates
every issued token**, which surfaces in the UI as a repeating `Invalid or expired
token` banner until users sign in again.

Start the server (keep this tab open):

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8002
```

API at `http://localhost:8002` · interactive docs at `http://localhost:8002/docs`

> A `MongoDB unavailable — skipping index creation: index not found with name [email_1]`
> warning on first boot is expected and harmless: startup tries to drop an index that
> does not exist yet on an empty database. As long as you see
> `Application startup complete.`, the backend is healthy.

Verify in a separate tab:

```bash
curl http://localhost:8002/health   # {"status":"ok"}
```

### 4 — Frontend

In a new tab, from the repo root:

```bash
cd frontend
npm install
```

`.env.local` is **git-ignored, so a fresh clone does not have one.** You must create
it — without it the app silently falls back to port **8000** and every request fails
against the backend on **8002**:

```bash
cat > .env.local <<'EOF'
NEXT_PUBLIC_API_BASE_URL=http://localhost:8002
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8002/ws
NEXT_PUBLIC_USE_MOCKS=false
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google-oauth-client-id>
NEXT_PUBLIC_ELEVENLABS_API_KEY=<elevenlabs-api-key>
EOF
```

Ask a teammate for the two placeholder values — the Google client ID enables sign-in,
and the ElevenLabs key enables voice. **The app runs without the ElevenLabs key**;
only text-to-speech is disabled.

Start it:

```bash
npm run dev
```

App at `http://localhost:3000`.

### 5 — Verify the whole stack

```bash
curl http://localhost:8002/health                              # {"status":"ok"}
curl -o /dev/null -w "%{http_code}\n" http://localhost:3000    # 200
docker compose -f backend/docker-compose.yaml ps               # 3 containers Up
```

Then open `http://localhost:3000`, sign in with Google, and send:

```
Find me Sony headphones under $100
```

That exercises the full path — intent detection → validation → live Amazon scrape →
preference-weighted ranking → LLM comparison → the interrupt that renders the product
cards.

### 6 — Connect Amazon (only needed for add-to-cart)

Search, ranking, comparison, and the confirmation gate all work without this. Only the
final add-to-cart step needs real session cookies: go to **Settings → Connections** in
the UI and connect your Amazon account. Credentials are never stored — you log in
yourself and only the resulting encrypted cookies are kept.

### Shutting down

```bash
# Ctrl-C the backend and frontend tabs, then:
cd backend
docker compose down          # add -v to also delete all database data
```

---

### Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop is not running. Launch it from Applications and wait for the menu-bar icon to settle. |
| Repeating `Invalid or expired token` banners in chat | The JWT in browser storage is expired (7-day TTL) or was signed with a different `APP_SECRET_KEY`. Fix: open DevTools console on `localhost:3000` and run `localStorage.clear(); location.reload();` then sign in again. |
| `ModuleNotFoundError: No module named 'curl_cffi'` | The venv is not activated, or `pip install -r requirements.txt` was run against system Python. Re-run `source .venv/bin/activate` first. |
| Frontend loads but chat never connects | `frontend/.env.local` is missing or has the wrong port — it must point at **8002**, not the 8000 default. |
| Product search returns nothing | Amazon is rate-limiting the scraper. Wait a minute and retry; the scraper already rotates browser profiles and backs off across 3 attempts. |
| `port is already allocated` on `docker compose up` | A previous stack is still running. `docker compose down` first, or find the process with `lsof -i :27017`. |

---

### Full stack with Docker Compose

```bash
cd backend
docker compose up --build
```

### Seed sample data (optional)

```bash
# Databases must be running first
cd backend
python scripts/seed_data.py
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

1. **No purchase without explicit confirmation.** Every order goes through a hard confirmation gate — the user must approve the exact product, price, address, and payment method before Playwright touches checkout.

2. **Clarification over assumption.** When a query is ambiguous, the system asks a targeted question (up to 3 per turn) rather than guessing. Over time it learns enough about the user to need fewer questions.

3. **Credentials are never stored.** The user logs in to Amazon/Walmart themselves via a visible browser window. Only the resulting encrypted session cookies are stored — never usernames or passwords.

4. **Parallel scraping with adaptive ranking.** Amazon and Walmart are scraped simultaneously via `asyncio.gather()`. Results are ranked by a preference-weighted composite score (price × 0.30, rating × 0.25, delivery × 0.20, preference match × 0.25). Weights adapt after every completed interaction.

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
