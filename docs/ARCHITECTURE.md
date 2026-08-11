# Cosmic Clock — Architecture

## Decided stack

| Layer | Choice | Notes |
|-------|--------|--------|
| App | **Next.js** (App Router) + **TypeScript** + **React** | Production app at repo root |
| Styling | **Tailwind CSS** | Match Cosmic Clock look from `CCLOCK` |
| i18n | **next-intl** | Locales: `en`, `ru`, `es`, `pt` (`localePrefix: "always"`) |
| DB | **PostgreSQL** | Local: Docker Compose (`docs/INFRA.md`); server: system PG 14 |
| ORM | **Prisma 7** | Client in `src/generated/prisma`; helper `src/lib/db.ts` |
| Auth | **Auth.js** (Credentials: **login** + password) | Login = username; session ~30d; `lastSeenAt`; **no email/SMTP**. See `docs/PLAN.md` |
| Hosting | VPS **amster** | PM2 + nginx, bind `127.0.0.1:3060` |
| Domain | `cosmic-clock.info` / `www` | See `deploy/nginx/` |

## Repository layout

```
/
├── AGENTS.md              # Agent entry (Next.js notice + pointers)
├── README.md              # Human quickstart
├── docs/                  # Product / architecture / roadmap (for humans + models)
├── CCLOCK/                # Design prototype ONLY — do not typecheck as app source
├── src/                   # Next.js production app
│   ├── app/[locale]/     # Locale-scoped routes
│   ├── components/
│   ├── i18n/
│   ├── lib/
│   └── proxy.ts           # next-intl middleware entry
├── messages/              # en / ru / es / pt JSON
├── deploy/nginx/          # nginx site config
└── ecosystem.config.cjs   # PM2 app + deploy
```

## Important constraints for agents

1. **This Next.js version may differ from training data.** Read guides under `node_modules/next/dist/docs/` before inventing APIs. See root `AGENTS.md`.
2. **`CCLOCK/` is reference only.** Port UI/logic into `src/`. Exclude `CCLOCK` from Next typecheck/build (already intended).
3. **Do not treat the Vite prototype as production.** No Express+Vite dual stack for the shipped site.
4. **i18n:** all user-facing strings go through `messages/*` in the Next app (prototype keeps inline `CCLOCK/src/app/i18n.ts` — do not copy that pattern into production).
5. **Deploy:** production process listens on `127.0.0.1:$PORT` (3060); nginx terminates TLS.
6. **Auth:** no email, no password-reset mail. Identifier is `login`. Change-password UI only when signed in.
7. **Cards:** guest → localStorage; signed-in → Postgres. On register/login, migrate/merge local → DB then clear localStorage.

## Implementation status (summary)

| Area | Status |
|------|--------|
| Locale routing + header switcher | Done |
| CosmicClock + cards UI | Done |
| Prisma `User` / `Card` + local migrate | Done |
| Auth.js register / login / logout | Done (**login** + password; Stage H) |
| Card CRUD in Postgres (signed-in) | Done |
| Guest localStorage + migrate/merge | Planned Stage I |
| Login (not email) + change password | Done (Stage H) |
| Start-date doctrine (`year >= 0`, ≤ today) | Done (Stage G) |
| Server deploy | Planned Stage J |

Living detail: [`docs/PLAN.md`](PLAN.md).

## Data model (Prisma)

See `prisma/schema.prisma` (current) and Stages H/I migrations:

- **User** — `login` unique + `passwordHash` + `createdAt` + `lastSeenAt` + `updatedAt`
- **Card** — `id`, `userId`, `name`, `day`, `month`, `year`, `createdAt`, `updatedAt`; cascade delete with user
- **Unique:** `(userId, year, month, day)` — one start date per user
- Max **100 cards / user** — after date-dedupe; truncate by newest `updatedAt`

No separate “Calendar” entity — **Card** is the unit.

## Card storage flow

```
Guest (no session)
  └─ if localStorage empty → seed one card (1958-08-07) from code constant
  └─ edit/create/delete → localStorage (with updatedAt)

Register or Login
  └─ merge by date (newer updatedAt wins name)
  └─ keep ≤100 by updatedAt; drop rest
  └─ clear localStorage; show summary message

Signed-in
  └─ Postgres only (multi-device)
  └─ duplicate date on create/edit → reject with message
```

## Stale user prune

- Script (e.g. `npm run users:prune-stale`): delete users with `lastSeenAt` older than 2 years
- Run from **deploy** (monthly-ish); same command usable manually on the server

## Prototype → production mapping

| Prototype | Production target |
|-----------|-------------------|
| `CCLOCK/.../App.tsx` card grid | Home single-screen UI in `src/` |
| `CosmicClock.tsx` | `src/components/CosmicClock.tsx` |
| `CardForm.tsx` | Shared create/edit form component |
| `AuthModal.tsx` | Auth modal (login/register); change-password modal when signed in |
| `LangContext` + inline strings | `next-intl` + `messages/*.json` |
| In-memory / local cards | Guest localStorage → Postgres after auth (Stages F/I) |
