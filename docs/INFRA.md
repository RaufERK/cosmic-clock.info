# Cosmic Clock — Infra & access

For agents and humans. Do **not** commit real passwords or production `.env` values.

## SSH (amster VPS)

Host IP: `185.200.178.73`  
Key: `~/.ssh/id_ed25519` (from local `~/.ssh/config`)

| Alias | User | Use for |
|-------|------|---------|
| `ssh amster` | `root` | Admin: nginx, certbot, system packages, PostgreSQL roles/DBs |
| `ssh amster_app` | `appuser` | App deploys, PM2, `~/apps/*` |

**Note:** Host alias is `amster_app` (underscore), not `amster-app`.

| | |
|--|--|
| App path | `/home/appuser/apps/cosmic-clock` |
| Shared env | `.../shared/.env` (`DATABASE_URL`, `AUTH_SECRET`) |
| PM2 | root `ecosystem.config.cjs` — port **3060**, bind `127.0.0.1` |
| Site | https://cosmic-clock.info |

Deploy: `npx pm2 deploy production update` (from a machine with the deploy key). Runs migrate + `users:prune-stale` as configured in the ecosystem file.

## Umami analytics (same VPS, separate from this git repo)

| | |
|--|--|
| Code | `/home/appuser/apps/umami` (clone of umami-software/umami) |
| Env | `/home/appuser/apps/umami-shared/.env` (+ `ADMIN.txt` for login hint) |
| PM2 | `umami` → `127.0.0.1:3030` |
| Tracker (live) | first-party `https://cosmic-clock.info/ua.js` + `/api/send` (nginx → Umami) |
| Dashboard | `https://stats.cosmic-clock.info` after DNS A + `certbot --nginx -d stats.cosmic-clock.info` |
| Temp UI | `ssh -L 3030:127.0.0.1:3030 amster_app` → http://127.0.0.1:3030 |

Postgres role/DB **`umami`** (separate from `cosmic_clock`). Adding more sites in Umami does **not** erase existing stats.

Site env (cosmic-clock `shared/.env`): `NEXT_PUBLIC_UMAMI_WEBSITE_ID`, `NEXT_PUBLIC_UMAMI_SCRIPT_URL=/ua.js`.

## PostgreSQL on server (production)

- PostgreSQL **14**, listens on **`127.0.0.1:5432` only** (not public)
- Role + DB: **`cosmic_clock`** (credentials only in `shared/.env`); also **`umami`** for analytics

```text
DATABASE_URL=postgresql://cosmic_clock:SECRET@127.0.0.1:5432/cosmic_clock
```

## PostgreSQL local (dev)

Docker Compose in this repo (host **5433** — avoids clash with other DBs on 5432):

- Container: `cosmic-clock-postgres` / image `postgres:16`
- DB / user / password: `cosmic_clock` / `cosmic_clock` / `cosmic_clock` (dev only)

```bash
docker compose up -d
# DATABASE_URL=postgresql://cosmic_clock:cosmic_clock@127.0.0.1:5433/cosmic_clock

npm run db:migrate    # apply migrations
npm run db:generate   # client → src/generated/prisma
npm run db:studio     # optional GUI
docker compose down   # stop (volume `cosmic_clock_pgdata` keeps data)
```

Models: `User`, `Card` — `prisma/schema.prisma`. Helper: `src/lib/db.ts`. Auth needs `AUTH_SECRET` in `.env`.

## Environments

| Environment | Approach |
|-------------|----------|
| Local Mac | Docker Compose Postgres on **5433** |
| Server | System Postgres 14 on **127.0.0.1:5432** + `cosmic_clock` role/DB |
| Schema | Prisma — same migrations locally and on server |
| Auth | Auth.js Credentials (**login** + password) + JWT (~30d) |
