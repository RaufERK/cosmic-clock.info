# Cosmic Clock — Architecture

## Stack

| Layer | Choice | Notes |
|-------|--------|--------|
| App | **Next.js** (App Router) + **TypeScript** + **React** | Production app at repo root |
| Styling | **Tailwind CSS** | |
| i18n | **next-intl** | Locales: `en`, `ru`, `es`, `pt` (`localePrefix: "always"`) |
| DB | **PostgreSQL** | Local: Docker Compose; server: system PG 14 — see [`INFRA.md`](INFRA.md) |
| ORM | **Prisma 7** | Client in `src/generated/prisma`; helper `src/lib/db.ts` |
| Auth | **Auth.js** (Credentials: **login** + password) | Session ~30d; `lastSeenAt`; **no email/SMTP** |
| Hosting | VPS **amster** | PM2 + nginx, bind `127.0.0.1:3060` |
| Domain | `cosmic-clock.info` / `www` | See `deploy/nginx/` |

## Repository layout

```
/
├── AGENTS.md              # Agent entry (Next.js notice + pointers)
├── README.md              # Human quickstart
├── docs/                  # Product / architecture / math / infra
├── src/                   # Next.js production app
│   ├── app/[locale]/     # Locale-scoped routes
│   ├── components/
│   ├── i18n/
│   ├── lib/
│   └── proxy.ts           # next-intl middleware entry
├── messages/              # en / ru / es / pt JSON
├── prisma/                # Schema + migrations
├── deploy/nginx/          # nginx site config
└── ecosystem.config.cjs   # PM2 app + deploy
```

## Constraints for agents

1. **This Next.js version may differ from training data.** Read guides under `node_modules/next/dist/docs/` before inventing APIs. See root `AGENTS.md`.
2. **i18n:** all user-facing strings go through `messages/*`.
3. **Deploy:** production process listens on `127.0.0.1:$PORT` (3060); nginx terminates TLS.
4. **Auth:** no email, no password-reset mail. Identifier is `login`. Change-password UI only when signed in.
5. **Cards:** guest → localStorage; signed-in → Postgres. On register/login, migrate/merge local → DB then clear localStorage to `[]`.
6. **v1 astrology** = date → year/month/day hands ([`CLOCK_MATH.md`](CLOCK_MATH.md)). No ephemeris unless product docs say so.

## Data model (Prisma)

See `prisma/schema.prisma`:

- **User** — `login` unique + `passwordHash` + `createdAt` + `lastSeenAt` + `updatedAt`
- **Card** — `id`, `userId`, `name`, `day`, `month`, `year`, `createdAt`, `updatedAt`; cascade delete with user
- **Unique:** `(userId, year, month, day)` — one start date per user
- Max **100 cards / user** — after date-dedupe; truncate by newest `updatedAt`

No separate “Calendar” entity — **Card** is the unit.

## Card storage flow

```
Guest (no session)
  └─ if localStorage key missing → seed one card (1958-08-07) from code constant
  └─ edit/create/delete → localStorage (with updatedAt)

Register or Login
  └─ merge by date (newer updatedAt wins name)
  └─ keep ≤100 by updatedAt; drop rest
  └─ write localStorage `[]` (do not remove key — avoids re-seed after logout)
  └─ show summary message (toast)

Signed-in
  └─ Postgres only (multi-device)
  └─ duplicate date on create/edit → reject with message
```

## Stale user prune

- `npm run users:prune-stale` — delete users with `lastSeenAt` older than 2 years
- Wired into PM2 deploy; same command usable manually on the server

## Key source paths

| Concern | Path |
|---------|------|
| Main UI | `src/components/CosmicApp.tsx` |
| Clock face | `src/components/CosmicClock.tsx` |
| Hand math | `src/lib/cosmic-clock-math.ts` |
| Guest storage | `src/lib/guest-cards.ts` |
| Card server actions | `src/lib/card-actions.ts` (and related) |
| Auth | `src/auth.ts`, auth UI in components |
