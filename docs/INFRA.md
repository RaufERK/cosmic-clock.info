# Cosmic Clock — Infra & access

For agents and humans. Do **not** commit real passwords or production `.env` values.

## SSH (amster VPS)

Host IP: `185.200.178.73`  
Key: `~/.ssh/id_ed25519` (from local `~/.ssh/config`)

| Alias | User | Use for |
|-------|------|---------|
| `ssh amster` | `root` | Admin: nginx, certbot, system packages, PostgreSQL roles/DBs |
| `ssh amster_app` | `appuser` | App deploys, PM2, `~/apps/*` |

**Note:** the correct Host alias is `amster_app` (underscore), not `amster-app`.

App path on server: `/home/appuser/apps/cosmic-clock`  
Shared env: `/home/appuser/apps/cosmic-clock/shared/.env`  
PM2: see root `ecosystem.config.cjs` (port **3060**, bind `127.0.0.1`)

Neighbor apps under `appuser`: `openai-proxy`, `smart_bot`, `spoken-bot`, `triplex-mcp`, …

## PostgreSQL on server (production)

Checked via `ssh amster`:

- PostgreSQL **14.22**, service **active**
- Listens on **`127.0.0.1:5432` only** (not public) — Next.js on the same host connects locally
- Existing DB/role example: `spokenword` / `spokenword`
- **No `cosmic_clock` DB yet** — create when Phase 2 starts (as root/`postgres`)

Typical production URL shape (values live only in `shared/.env`):

```text
DATABASE_URL=postgresql://cosmic_clock:SECRET@127.0.0.1:5432/cosmic_clock
```

Deploy is optional while the product is in early development; local Docker is enough until we intentionally ship persistence.

## PostgreSQL on this laptop (local dev)

Use **Docker Compose** in this repo — do not share the existing container that already binds host **5432** (`pearls-migrator-postgres`).

Cosmic Clock local DB:

- Container name: `cosmic-clock-postgres`
- Image: `postgres:16`
- Host port: **5433** → container `5432` (avoids clash with 5432)
- DB / user / password: `cosmic_clock` / `cosmic_clock` / `cosmic_clock` (dev only)

```bash
docker compose up -d
# DATABASE_URL=postgresql://cosmic_clock:cosmic_clock@127.0.0.1:5433/cosmic_clock
```

### Prisma (schema + migrations)

```bash
npm run db:migrate    # create/apply migrations (dev)
npm run db:generate   # regenerate client → src/generated/prisma
npm run db:studio     # browse tables
```

Models (Stage D): `User`, `Card` — see `prisma/schema.prisma`.  
Client helper: `src/lib/db.ts`. Auth.js uses `AUTH_SECRET` (Stage E).

Stop:

```bash
docker compose down
```

Data persists in the named Docker volume `cosmic_clock_pgdata`.

## Recommendation

| Environment | Approach |
|-------------|----------|
| Local Mac | Docker Compose Postgres on **5433** |
| Server | System Postgres 14 on **127.0.0.1:5432** + dedicated role/DB when ready |
| Schema | Prisma — same migrations locally and on server |
| Auth | Auth.js Credentials (**login** + password) + JWT (~30d); set `AUTH_SECRET`; `npm run users:prune-stale` |

No rush to create the server DB until Phase 2 (real auth + persistence). Until then, optional: run local Postgres early so Prisma schema/migrations can be developed without blocking UI work.
