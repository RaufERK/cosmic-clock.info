# Cosmic Clock — Architecture

Product doctrine: [`PRODUCT.md`](PRODUCT.md). Math: [`CLOCK_MATH.md`](CLOCK_MATH.md). Host: [`INFRA.md`](INFRA.md).

## Stack

| Layer | Choice |
|-------|--------|
| App | Next.js App Router + TypeScript + React |
| UI | Tailwind; main shell `src/components/CosmicApp.tsx` |
| i18n | next-intl — `en` / `ru` / `es` / `pt` (`localePrefix: always`) |
| DB | PostgreSQL + Prisma 7 (`src/generated/prisma`, `src/lib/db.ts`) |
| Auth | Auth.js Credentials (**login** + password), JWT ~30d |
| Host | VPS amster — PM2 `127.0.0.1:3060`, nginx TLS |

## Layout

```
src/app/[locale]/   routes
src/components/     CosmicApp, CosmicClock, CardForm, auth UI
src/lib/            math, cards, guest-cards, card-actions, auth
src/proxy.ts        next-intl middleware entry
messages/           locale JSON
prisma/             schema + migrations
deploy/nginx/       site configs
ecosystem.config.cjs
```

Do not add a second app stack under the repo (e.g. design dumps stay out of `src/`). Figma Make dumps go in `CCLOCK/`; port rules: [`DESIGN_PORT.md`](DESIGN_PORT.md).

## Data model

- **User** — `login`, `passwordHash`, `lastSeenAt`, timestamps  
- **Card** — `name`, `day`/`month`/`year`, `sortIndex`, `createdAt`, `updatedAt`; `@@unique([userId, year, month, day])`  
- Soft cap **100** cards / user (app + merge)

## Card flow

```
Guest
  └─ no localStorage key → seed 1958-08-07
  └─ CRUD → localStorage (sortIndex: new at end; createdAt fixed on create)

Register / Login
  └─ skip seed date 1958-08-07
  └─ merge by start date (newer updatedAt wins name; existing sortIndex kept)
  └─ new guest dates append at end
  └─ keep ≤100 by updatedAt
  └─ localStorage → []
  └─ toast summary

Signed-in
  └─ Postgres only
  └─ UI list by Card.sortIndex; lock mode rewrites indices
```

## Key paths

| Concern | Path |
|---------|------|
| Shell / reorder UI | `src/components/CosmicApp.tsx` |
| Create/edit form | `src/components/CardForm.tsx` |
| Clock face | `src/components/CosmicClock.tsx` |
| Hand math | `src/lib/cosmic-clock-math.ts` |
| Guest storage | `src/lib/guest-cards.ts` |
| Card actions | `src/lib/card-actions.ts` |
| Auth | `src/auth.ts` + auth components |
| Admin stats | `src/app/admin/` — [`ADMIN.md`](ADMIN.md) |

## Ops

- Deploy: `npx pm2 deploy production update` (migrate + `users:prune-stale`)  
- Prune: users with `lastSeenAt` older than 2 years  
