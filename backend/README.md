# ClickLess AI — Backend

FastAPI backend for the ClickLess AI platform. Handles users, sessions, orders, product cache, and conversation state. Exposes a REST API and a WebSocket endpoint for real-time chat.

## Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI + Uvicorn |
| Users / Conversations | MongoDB (Motor async driver) |
| Orders | PostgreSQL (SQLAlchemy async + asyncpg) |
| Product cache | Redis |
| Runtime | Python 3.11 |

## Prerequisites

- Python 3.11+
- Docker & Docker Compose (for running databases locally)

---

## Running locally

### 1 — Start the databases

```bash
cd backend
docker compose up mongo postgres redis -d
```

### 2 — Create and activate a virtual environment

```bash
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
```

### 3 — Install dependencies

```bash
pip install -r requirements.txt
```

### 4 — Configure environment

```bash
cp .env.example .env
```

Edit `.env` if your database ports differ. See [Environment variables](#environment-variables) below.

### 5 — Start the server

```bash
uvicorn app.main:app --reload
```

API is available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

Once running, open:

- **`http://localhost:8000/docs`** — Swagger UI (interactive, try out requests)
- **`http://localhost:8000/redoc`** — ReDoc (read-only, cleaner layout)

---

## Running with Docker Compose (full stack)

Builds and starts the app together with all databases:

```bash
cd backend
docker compose up --build
```

---

## Running tests

Tests use real database connections. Start the databases first:

```bash
docker compose up mongo postgres redis -d
pytest
```

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URL` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGODB_DB_NAME` | `clickless_ai` | MongoDB database name |
| `POSTGRES_URL` | `postgresql+asyncpg://user:password@localhost:5432/clickless_orders` | PostgreSQL async URL |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection URL |
| `APP_ENV` | `development` | Environment name (`development` / `production`) |
| `APP_SECRET_KEY` | `changeme` | General app secret — change in production |
| `SESSION_ENCRYPTION_KEY` | `changeme_32_bytes_key_padded_here` | Must be exactly 32 bytes. Used to encrypt stored auth sessions |
| `PURCHASE_THRESHOLD_AMOUNT` | `500.00` | Orders above this amount require explicit user confirmation |
| `CONFIRMATION_TTL_SECONDS` | `900` | How long a purchase confirmation stays valid (seconds) |
| `APP_VERSION` | `0.1.0` | Reported by `GET /version` |

> **Never commit a `.env` file with real secrets.** Only `.env.example` should be in version control.

---

## Project layout

```
backend/
├── app/
│   ├── core/
│   │   └── config.py          # Settings loaded from environment
│   ├── db/
│   │   ├── mongo.py           # Motor client + collection helpers
│   │   ├── postgres.py        # SQLAlchemy engine + orders table DDL
│   │   └── cache.py           # Redis client + key helpers
│   ├── models/                # Pydantic request/response schemas
│   ├── routers/               # One file per API tag
│   ├── services/              # Business logic (called by routers)
│   └── ws/
│       └── handler.py         # WebSocket chat endpoint
├── tests/
├── scripts/
│   └── seed_data.py           # Populate databases with sample data
├── Dockerfile
├── docker-compose.yaml
├── openapi.yaml               # Full OpenAPI 3.0 spec
└── requirements.txt
```

---

## API overview

Full spec: [openapi.yaml](openapi.yaml) or `http://localhost:8000/docs` when running.

| Tag | Base path | Summary |
|---|---|---|
| system | `/health`, `/version`, `/status` | Health and version |
| users | `/api/users` | CRUD + preferences |
| sessions | `/api/sessions` | Encrypted per-site auth tokens |
| orders | `/api/orders` | Order creation and tracking |
| cache | `/api/cache` | Product search result cache |
| conversations | `/api/conversations` | Conversation state (REST) |
| websocket | `/ws/chat/{session_id}` | Real-time bidirectional chat |

---

## Seeding sample data

```bash
python scripts/seed_data.py
```
