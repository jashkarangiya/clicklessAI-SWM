# ClickLess AI — Frontend

Next.js 15 chat interface for the ClickLess AI platform. Connects to the FastAPI backend over WebSocket for real-time conversation, product comparison, and purchase flow.

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI library | Mantine v7 |
| State | Redux Toolkit + Zustand |
| Real-time | WebSocket (custom `SocketClient`) |
| TTS / STT | ElevenLabs API |
| Auth | Google OAuth (PKCE flow) |

## Running locally

### Prerequisites

- Node.js 18+
- Backend running on port 8002 (see [backend/README.md](../backend/README.md))

### Setup

```bash
cd frontend
npm install
```

The `.env.local` file is already present with local dev defaults:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8002
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8002/ws
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-client-id>
NEXT_PUBLIC_ELEVENLABS_API_KEY=<your-elevenlabs-key>
```

### Start

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
frontend/src/
├── app/
│   ├── (auth)/         → Login and signup pages
│   ├── app/            → Authenticated app shell
│   │   ├── chat/       → Main chat interface
│   │   ├── orders/     → Order history
│   │   ├── settings/   → Site connections and preferences
│   │   ├── account/    → Account management
│   │   └── ...
│   └── page.tsx        → Marketing landing page
├── components/
│   ├── chat/           → Chat UI (bubbles, input, clarification cards, product grid)
│   ├── product/        → ProductCard, ProductComparisonGrid
│   ├── purchase/       → Confirmation modal, progress cards
│   ├── auth/           → Login/signup forms
│   └── marketing/      → Landing page sections
├── hooks/
│   └── useClicklessSocket.ts   → WebSocket connection hook
├── stores/
│   ├── chatStore.ts    → Zustand chat message store
│   └── orderStore.ts   → Zustand order store
├── lib/
│   ├── api/            → REST API clients (auth, chat history, ElevenLabs)
│   └── adapters/       → Message and product normalisation
└── contracts/          → TypeScript types (chat messages, WebSocket events, products)
```

## Key features

- **Real-time chat** — WebSocket connection with automatic reconnection
- **Product comparison grid** — Side-by-side cards with cheapest / best-rated / fastest delivery highlights
- **TTS speaker button** — Read aloud any assistant message or product summary via ElevenLabs
- **Clarification cards** — Clickable option buttons for ambiguous queries
- **Purchase flow** — Confirmation modal before any order is placed
- **Dark / light theme** — Toggle in the sidebar

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend REST base URL (default `http://localhost:8002`) |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL (default `ws://127.0.0.1:8002/ws`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `NEXT_PUBLIC_ELEVENLABS_API_KEY` | ElevenLabs API key for TTS/STT |
| `NEXT_PUBLIC_USE_MOCKS` | Set to `true` to use mock data without a backend |
