# Cosmic Clock

Production app for [cosmic-clock.info](https://cosmic-clock.info).

Users create **life-event cards** (birth, marriage, job, project, …). Each card drives a cosmic clock whose hands show **year / month / day** for that event.

## Docs

| Doc | Contents |
|-----|----------|
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | Product idea & domain |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack & layout |
| [`docs/CLOCK_MATH.md`](docs/CLOCK_MATH.md) | Hand theory & formulas |
| [`docs/INFRA.md`](docs/INFRA.md) | SSH, server DB, local Docker Postgres |
| [`AGENTS.md`](AGENTS.md) | Instructions for coding agents |

## Stack

- Next.js App Router + TypeScript + Tailwind
- `next-intl` — `en` / `ru` / `es` / `pt`
- Auth.js — login + password (username, not email); Postgres + Prisma
- Guest cards → localStorage; signed-in → DB (merge on auth)
- PM2 + nginx on amster (`127.0.0.1:3060`)

## Local

```bash
npm i
npm run dev
```

Open http://localhost:3000/en (or `/ru`)

Local Next port **3000**. Production on amster binds **3060** (PM2 / nginx) — see `ecosystem.config.cjs`.

Local Postgres (port **5433**):

```bash
docker compose up -d
cp .env.example .env   # if needed
npm run db:migrate
npm run db:studio      # optional
```

See `docs/INFRA.md` and `prisma/schema.prisma`.

## Deploy

1. DNS `cosmic-clock.info` + `www` → server
2. On server (as `appuser`): dirs `~/apps/cosmic-clock/{source,shared}`, `~/logs`
3. `pm2 deploy production setup` then `pm2 deploy production` (or `update`)
4. As root: nginx conf + certbot for the domain

See `ecosystem.config.cjs` and `deploy/nginx/`.
