# ClickLess AI — Semantic Web Mining Project

AI-powered conversational shopping assistant that automates product search, comparison, and purchase across retail sites using a LangGraph orchestration pipeline, Playwright scraping, and a real-time chat frontend.

## What it does

- User types a natural language request ("Find me Sony headphones under $100")
- System detects intent, enriches missing fields from user preferences, and searches Amazon + Walmart in parallel
- Ranked results are returned in a comparison grid with LLM-generated reasoning
- User can initiate a purchase — system navigates checkout via Playwright with a hard confirmation gate before placing any order
- Preferences are learned over time to reduce friction on future turns

## Project Structure

```
clicklessAI-SWM/
├── backend/        → FastAPI API server + WebSocket handler
├── frontend/       → Next.js chat UI
├── orchestration/  → LangGraph pipeline (intent, search, ranking, purchase)
├── scraper/        → Playwright scrapers for Amazon and Walmart
├── database/       → Database layer reference
├── docs/           → Architecture, data model, protocol, deployment docs
├── README.md
├── CONTRIBUTING.md
└── RULES.md
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), Mantine UI, Redux Toolkit |
| Backend | FastAPI + Uvicorn, Python 3.11 |
| Orchestration | LangGraph, OpenAI-compatible LLM (Qwen3) |
| Scraping | Playwright (async), Chromium |
| Databases | MongoDB (users/conversations), PostgreSQL (orders), Redis (cache/sessions) |
| Real-time | WebSocket (`/ws`) |
| TTS/STT | ElevenLabs API |

## Team

| Area | Owner(s) |
|---|---|
| Frontend | Harsh Patel |
| Scraping | Nishit Patel, Jash Karangiya |
| LangGraph / Orchestration | Krish Patel, Kaushha Trivedi |
| Backend / API / Database | Khwahish Patel |
| Docs | Shared |

## Quick Start

### 1 — Clone

```bash
git clone https://github.com/jashkarangiya/clicklessAI-SWM.git
cd clicklessAI-SWM
```

### 2 — Start databases

```bash
cd backend
docker compose up mongo postgres redis -d
```

### 3 — Start the backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env          # fill in secrets
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8002
```

Backend available at `http://localhost:8002` · API docs at `http://localhost:8002/docs`

### 4 — Start the frontend

```bash
cd frontend
npm install
# .env.local is already configured for local dev (port 8002)
npm run dev
```

Frontend available at `http://localhost:3000`

## Documentation

| Doc | Description |
|---|---|
| [docs/architecture.md](docs/architecture.md) | System design, layer breakdown, request flows |
| [docs/langgraph.md](docs/langgraph.md) | LangGraph node specifications and state transitions |
| [docs/websocket-protocol.md](docs/websocket-protocol.md) | WebSocket event protocol reference |
| [docs/data-model.md](docs/data-model.md) | All data schemas (User, Product, Order, StateEnvelope) |
| [docs/deployment.md](docs/deployment.md) | Environment variables, Docker Compose, production checklist |
| [backend/README.md](backend/README.md) | Backend-specific setup and API overview |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow and [RULES.md](RULES.md) for project rules.
