# Cosmic Clock — Infra & access

Do **not** commit production secrets.

## SSH (amster)

IP `185.200.178.73` · key `~/.ssh/id_ed25519`

| Alias | User | Use |
|-------|------|-----|
| `ssh amster` | `root` | nginx, certbot, system PG |
| `ssh amster_app` | `appuser` | deploys, PM2, `~/apps/*` |

Alias is **`amster_app`** (underscore).

| | |
|--|--|
| App | `/home/appuser/apps/cosmic-clock` |
| Env | `shared/.env` (`DATABASE_URL`, `AUTH_SECRET`, Umami public ids) |
| PM2 | port **3060**, bind `127.0.0.1` |
| Site | https://cosmic-clock.info |

Deploy: `npx pm2 deploy production update` (migrate + prune stale users).

## PostgreSQL

| Env | Where |
|-----|--------|
| Production | System PG **14** on `127.0.0.1:5432`; DB/role `cosmic_clock` |
| Local | Docker Compose `postgres:16` on host **5433** |

```bash
# local
docker compose up -d
# DATABASE_URL=postgresql://cosmic_clock:cosmic_clock@127.0.0.1:5433/cosmic_clock
npm run db:migrate
```

## Umami (same VPS, separate repo)

| | |
|--|--|
| App | `/home/appuser/apps/umami` · env in `umami-shared/` |
| PM2 | `umami` → `127.0.0.1:3030` |
| Tracker | first-party `/ua.js` + `/api/send` on cosmic-clock.info |
| Dashboard | `https://stats.cosmic-clock.info` |

Separate PG DB/role **`umami`**. Site needs `NEXT_PUBLIC_UMAMI_WEBSITE_ID` + `NEXT_PUBLIC_UMAMI_SCRIPT_URL=/ua.js`.

## Sentry (errors + tracing)

In `shared/.env` (and local `.env`):

```text
NEXT_PUBLIC_SENTRY_DSN=https://…@….ingest.de.sentry.io/…
SENTRY_DSN=https://…@….ingest.de.sentry.io/…
```

Optional source maps on build: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.  
Tunnel: `/monitoring` (excluded from locale proxy). Local verify: `ALLOW_SENTRY_TEST=1` then `GET /api/sentry-test`.
