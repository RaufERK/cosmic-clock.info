# Cosmic Clock — Architecture

## Decided stack

| Layer | Choice | Notes |
|-------|--------|--------|
| App | **Next.js** (App Router) + **TypeScript** + **React** | Production app at repo root |
| Styling | **Tailwind CSS** | Match Cosmic Clock look from `CCLOCK` |
| i18n | **next-intl** | Locales: `en`, `ru`, `es`, `pt` (`localePrefix: "always"`) |
| DB | **PostgreSQL** | Local: Docker Compose (`docs/INFRA.md`); server: system PG 14 |
| ORM | **Prisma 7** | Client in `src/generated/prisma`; helper `src/lib/db.ts` |
| Auth | **Auth.js** (Credentials: email + password) | Until Stage E: demo `localStorage` only — see `docs/PLAN.md` |
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

## Current scaffold status (as of docs writing)

| Area | Status |
|------|--------|
| Locale routing + header switcher | Done |
| Home stub | Done |
| Login demo (`localStorage`) | Done |
| Cards page | Stub (“coming soon”) |
| CosmicClock port | Not started |
| PostgreSQL / Prisma | Not started |
| Real auth / sessions | Not started |
| Card limit (100) | Not started |

## Data model (Prisma — Stage D)

See `prisma/schema.prisma`:

- **User** — `id`, `email` (unique), `passwordHash`, timestamps
- **Card** — `id`, `userId`, `name`, `day`, `month`, `year`, timestamps; cascade delete with user
- Max **100 cards / user** — application rule in Stage F (not a DB constraint)

No separate “Calendar” entity — **Card** is the unit.

## Prototype → production mapping

| Prototype | Production target |
|-----------|-------------------|
| `CCLOCK/.../App.tsx` card grid | `src/app/[locale]/cards` (+ components) |
| `CosmicClock.tsx` | `src/components/CosmicClock.tsx` (or similar) |
| `CardForm.tsx` | Shared create/edit form component |
| `AuthModal.tsx` | Prefer dedicated `/login` (and later `/register`) routes |
| `LangContext` + inline strings | `next-intl` + `messages/*.json` |
| In-memory card state | Client state → then Postgres via API/Server Actions |
