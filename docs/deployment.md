# Deployment

## Local development

See [backend/README.md](../backend/README.md) for the full local setup guide.

Quick start with Docker Compose:

```bash
cd backend
docker compose up --build
```

---

## Environment configuration

Copy `.env.example` to `.env` and fill in real values before deploying.

```bash
cp backend/.env.example backend/.env
```

### Security-critical variables

**`SESSION_ENCRYPTION_KEY`**
- Must be exactly 32 bytes (characters).
- Used to AES-encrypt browser session tokens stored per retail site.
- Changing this key invalidates all existing stored sessions.
- Generate a safe value:
  ```bash
  python -c "import secrets; print(secrets.token_hex(16))"
  ```

**`APP_SECRET_KEY`**
- General application secret for signing tokens / cookies.
- Change from the default `changeme` in any non-local environment.

**`PURCHASE_THRESHOLD_AMOUNT`**
- Orders above this USD amount trigger an additional "Are you sure?" confirmation prompt in the frontend.
- Default is `500.00`. Lower it for more conservative environments.

**`CONFIRMATION_TTL_SECONDS`**
- How long a `PurchaseConfirmation` remains valid after being presented to the user.
- Default is `900` (15 minutes). After expiry the user must restart the purchase flow and a fresh price check is performed.

---

## Docker Compose services

Defined in `backend/docker-compose.yaml`.

| Service | Image | Default port | Data volume |
|---|---|---|---|
| `mongo` | mongo:7 | 27017 | `mongo_data` |
| `postgres` | postgres:16 | 5432 | `pg_data` |
| `redis` | redis:7-alpine | 6379 | — (ephemeral) |
| `app` | Built from `backend/Dockerfile` | 8000 | — |

### Useful commands

```bash
# Start only databases (for local Python dev)
docker compose up mongo postgres redis -d

# Start full stack
docker compose up --build

# Stop everything and remove volumes (destructive — wipes all data)
docker compose down -v

# View app logs
docker compose logs -f app

# Open a Mongo shell
docker compose exec mongo mongosh clickless_ai
```

---

## Infrastructure topology

The full system runs as Docker containers:

| Container | Role |
|---|---|
| FastAPI backend | API server + WebSocket handler + LangGraph orchestration |
| React/Next.js frontend | Chat UI |
| MongoDB | User documents + conversation state |
| PostgreSQL | Order records |
| Redis | Product cache + session state + confirmation TTLs |
| Playwright workers (N) | Browser automation, scaled per concurrent users |

A message queue (Redis Streams) sits between the backend and Playwright workers to handle load spikes. Each Playwright worker gets its own isolated browser context per user per site.

---

## Database setup

Table and index creation is idempotent and runs automatically on startup via the `lifespan` hook in [app/main.py](../backend/app/main.py):

- **MongoDB**: `ensure_indexes()` creates unique indexes on `users.user_id`, `users.email`, and `conversations.session_id`.
- **PostgreSQL**: `create_tables()` runs `CREATE TABLE IF NOT EXISTS` for the `orders` table with indexes on `user_id` and `status`.

No manual migration step is required for a fresh deploy.

---

## Seeding sample data

```bash
# Make sure databases are running first
docker compose up mongo postgres redis -d

cd backend
python scripts/seed_data.py
```

---

## Health checks

| Endpoint | Expected response |
|---|---|
| `GET /health` | `{"status": "ok"}` |
| `GET /version` | `{"version": "0.1.0"}` |
| `GET /status` | `{"status": "ok", "env": "production"}` |

Use `GET /health` for load balancer / container health probes.

---

## Security considerations

| Concern | Mitigation |
|---|---|
| **User credentials** | Never stored. Users log in themselves via a visible Playwright browser window. Only the resulting encrypted session state is persisted. The system never attempts to log in on behalf of the user. |
| **Session state** | AES-256-GCM encryption at rest. Sessions auto-expire after 24 hours. Changing `SESSION_ENCRYPTION_KEY` invalidates all existing sessions. |
| **Payment data** | Never captured or stored by ClickLess AI. Only the last 4 digits are read from the retailer's checkout page for display in the confirmation modal. |
| **Conversation data** | Stored in MongoDB. Conversations older than 90 days are auto-purged. Users can request deletion at any time. |
| **Purchase authorization** | Hard confirmation gate — no automated purchasing without explicit user approval per transaction. Orders above `PURCHASE_THRESHOLD_AMOUNT` require a double-confirmation. |
| **Scraping ethics** | Rate-limited requests (random 2–5s delays), no credential scraping, no data harvesting beyond the user's own search results. |
| **CORS** | Currently set to `allow_origins=["*"]`. Must be restricted to the frontend origin in production. |

---

## Production checklist

- [ ] Set `APP_ENV=production`
- [ ] Replace all `changeme` secrets with strong random values
- [ ] Set `SESSION_ENCRYPTION_KEY` to a random 32-byte hex string
- [ ] Set `PURCHASE_THRESHOLD_AMOUNT` to an appropriate value for your risk tolerance
- [ ] Point `MONGODB_URL`, `POSTGRES_URL`, `REDIS_URL` to managed/persistent instances
- [ ] Restrict CORS origins in `app/main.py` (currently `allow_origins=["*"]`)
- [ ] Run the app behind a TLS-terminating reverse proxy (nginx, Caddy, etc.)
- [ ] Enable Redis persistence (`appendonly yes`) if session/cache data must survive restarts
- [ ] Configure conversation auto-purge (90-day TTL) in MongoDB via a TTL index on `conversations`
- [ ] Set up Playwright worker scaling based on expected concurrent users
