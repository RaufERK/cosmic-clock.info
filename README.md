# Cosmic Clock

[cosmic-clock.info](https://cosmic-clock.info) — life-event **cards** with a cosmic clock (year / month / day hands).

## Docs

| Doc | |
|-----|--|
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | Domain, auth, cards |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, data flow |
| [`docs/CLOCK_MATH.md`](docs/CLOCK_MATH.md) | Hand formulas |
| [`docs/INFRA.md`](docs/INFRA.md) | SSH, DB, deploy, Umami |
| [`AGENTS.md`](AGENTS.md) | Agent hard rules |

## Local

```bash
npm i
docker compose up -d          # Postgres on :5433
cp .env.example .env          # if needed
npm run db:migrate
npm run dev                   # http://localhost:3000/en
```

Production binds **3060** behind nginx — see `ecosystem.config.cjs` / `docs/INFRA.md`.

## Deploy

```bash
npx pm2 deploy production update
```
