# Cosmic Clock — Working plan (checklist)

**How we work (calm pace)**

1. Do **one stage** at a time. Do not start the next stage early.
2. You **verify** the stage (checklist under each stage).
3. We **commit** that stage (you ask for the commit).
4. We mark the stage `[x]` here.
5. Deploy is **optional** until we deliberately want production. Local Docker + `npm run dev` is enough.
6. Stages **G–I** may be reordered for developer convenience (nothing on prod yet). Prefer the order below.

Living checklist — edit this file as we go.  
Stack / i18n / auth / guest storage: also [`ARCHITECTURE.md`](ARCHITECTURE.md), product rules: [`PRODUCT.md`](PRODUCT.md).

---

## Stack (locked)

| Layer | Choice |
|-------|--------|
| App | **Next.js** (App Router) + **TypeScript** + **React** |
| CSS | **Tailwind CSS** |
| i18n | **next-intl** — `en` / `ru` / `es` / `pt`, URL prefix always (`/en/...`) |
| DB | **PostgreSQL** — local Docker port **5433**; server PG later |
| ORM | **Prisma** |
| Auth | **Auth.js (NextAuth)** — **login + password** (Credentials), session cookies. Login is **any username string**, not email |
| Host | amster + PM2 + nginx (when we choose to deploy) |
| Design ref | `CCLOCK/` only — implement in `src/` |

### Multilingual (i18n)

- Library: **next-intl**
- Locales: English, Russian, Spanish, Portuguese
- Routes: `/[locale]/…` (e.g. `/ru/cards`)
- Strings: only in `messages/en.json`, `ru.json`, `es.json`, `pt.json` (same keys in all four)
- Language switcher in the header; keep the current path when switching

### Authorization (auth) — doctrine

| Rule | Detail |
|------|--------|
| Identifier | **Login** = any non-empty username string (not required to be an email) |
| Password | Hashed in Postgres; session via httpOnly cookie (Auth.js JWT) |
| Session | Explicit **`maxAge` ≈ 30 days**; logout or expiry → sign in again |
| No email | No mailbox, no SMTP, no email verification |
| No password reset | If the user forgets the password → create a **new** account and re-enter cards |
| Change password | When signed in, click own login → modal: current / new / confirm new |
| Activity | `User.lastSeenAt` — set on register/login; refresh at most **once per day** on authenticated visit (e.g. loading cards) |
| Stale accounts | Delete users with `lastSeenAt` older than **2 years** via `npm` script run from **deploy** (same command usable by hand on server). Keep `User.createdAt` for ops |
| Card limit | Max **100** cards per user (after date-dedupe; excess truncated — see below) |

No OAuth (Google etc.) in v1 unless we add it later on purpose.

### Cards storage — doctrine

| Who | Where | Behavior |
|-----|--------|----------|
| First visit (guest) | **localStorage** | Seed **one** example if storage empty (code constant, not env). Guest may edit/delete/create — all in localStorage |
| Example card | Hardcoded | Start date **1958-08-07** (The Summit Lighthouse founded); localized name in `messages/*` |
| Signed-in | **Postgres** | Source of truth; multi-device |
| Register / login | migrate + merge | Import local → DB (merge with existing on login) → **clear** localStorage → show summary message |
| After migrate/merge | DB only | UI reads/writes Postgres only |

### One start date = one card (per user)

| Situation | Behavior |
|-----------|----------|
| Create or edit to a date that already exists | **Block**; message e.g. “A calendar with this date already exists” |
| Merge local ↔ DB, same date | Keep **one** card; take **name** from the row with newer `updatedAt`; inform user (counts) |
| After dedupe still **> 100** | Keep **100** newest by `updatedAt`; **drop the rest** (no undo). Extremely rare |
| Same name, different dates | Allowed (different events) |

DB: **`UNIQUE (userId, year, month, day)`**. Cards keep `createdAt` + `updatedAt` (freshness = `updatedAt`). Guest localStorage cards store `updatedAt` too.

i18n: agent writes **en / ru / es / pt** for these short messages at implementation time (no need for the user to translate).

### Start date — doctrine

- Valid calendar day for month/year
- `year >= 0` (no negative years)
- Start date must be **≤ today** (year / month / day) — future start dates are invalid (clock math assumes past→now)

---

## Stage A — Docs & local DB ready

**Goal:** everyone (and agents) know the plan; local Postgres runs.

- [x] Product / architecture / infra docs
- [x] `docker-compose.yml` + Postgres on **5433**
- [x] `.env.example` with `DATABASE_URL`
- [x] Copy `.env.example` → `.env` locally (if not done)
- [x] Confirm container healthy: `docker compose ps`

**You check**

- [x] `docs/PLAN.md` readable and agreed
- [x] `docker compose up -d` → healthy on 5433
- [ ] Can open http://localhost:3060/en (dev server) — smoke when convenient

**Commit when:** docs + compose + plan agreed.  
**Status:** done (committed).

---

## Stage B — CosmicClock component (no cards page yet)

**Goal:** pure clock UI + hand math, ported from `CCLOCK`.

- [x] Port `CosmicClock` into `src/components/`
- [x] Year / month / day hand math matches prototype (`src/lib/cosmic-clock-math.ts`)
- [x] Preview existed briefly; replaced by full UI in Stage C
- [x] No DB, no auth changes
- [x] Committed

---

## Stage C — Full CCLOCK UI port (replace stub)

**Goal:** the Next app looks and behaves like `CCLOCK/` (single screen). Stub marketing/header/login pages removed.

- [x] Port main shell (nav + arched title + starfield + footer)
- [x] Port cards grid: view / create / edit / delete
- [x] Port `CardForm` + `AuthModal` (demo session still)
- [x] Strings from prototype in all four `messages/*`
- [x] `/cards` and `/login` redirect to home (single-screen prototype)
- [x] Local `npm run dev` on port **3000** (prod stays 3060)
- [x] Visual check OK vs `CCLOCK`
- [x] Committed

**You check**

- [x] http://localhost:3000/ru matches prototype layout
- [x] Language switcher RU/EN/ES/PT works
- [x] Add / edit / delete cards; clocks on cards
- [x] Login / register modal works (demo)

**Commit when:** you say the UI matches the prototype well enough.  
**Status:** done.

---

## Stage D — Prisma + schema (no real auth yet)

**Goal:** DB models ready; UI still on client until Stage E/F.

- [x] Add Prisma 7 + connect to local `DATABASE_URL`
- [x] Models: `User`, `Card` (fields aligned with UI)
- [x] First migration applied locally (`init_user_card`)
- [x] Document commands in README / INFRA
- [x] Client helper `src/lib/db.ts` (unused by UI yet)
- [x] Do **not** delete client cards UI yet — wire in Stage F
- [x] Committed

**You check**

- [x] Tables exist; app UI still works (unchanged)
- [x] `npm run build` OK

**Status:** done.

---

## Stage E — Real auth

**Goal:** replace demo `localStorage` auth.

- [x] Auth.js (Credentials): register, login, logout
- [x] Passwords hashed (bcryptjs)
- [x] Session cookie (httpOnly JWT via Auth.js)
- [x] Home stays public for now (cards still localStorage until Stage F)
- [x] Remove demo-auth helpers
- [x] Auth strings in all 4 locales
- [x] `.env.example`: `AUTH_SECRET`
- [x] Committed

**You check**

- [x] Register → login → logout round-trip
- [x] Wrong password fails cleanly
- [x] Session survives refresh

**Status:** done.  
**Note:** shipped with **email** as identifier — replaced by **login** in Stage H.

---

## Stage F — Persist cards in Postgres

**Goal:** cards belong to the user in the DB.

- [x] Server Actions for card CRUD
- [x] List/create/edit/delete only own cards
- [x] Enforce **max 100 cards / user** (server-side)
- [x] Guest sees **2 example cards** (not in DB); logged-in sees **only own** cards (no examples)
- [x] Remove localStorage card storage (interim — guest localStorage returns in Stage I)
- [x] Loading / error states for network
- [x] Committed

**You check**

- [x] Guest: 2 examples; Add/Settings ask to sign in
- [x] Login with empty account → no examples, only Add
- [x] Create card → refresh → still there
- [x] Second user cannot see first user’s cards
- [x] Logout → examples again
- [x] Delete works permanently

**Status:** done.  
**Note:** guest was “examples only, no local edit persist” — superseded by Stage I doctrine.

---

## Stage G — Date rules + hardening polish

**Goal:** start-date doctrine + calm UX polish.

- [x] Start date: valid day-for-month; `year >= 0`; date **≤ today** (`src/lib/start-date.ts` + CardForm + server actions)
- [x] Confirm before delete
- [x] Empty / error / success copy polish (4 languages) — date/delete messages
- [x] Accessibility basics (focus, labels on form fields)
- [x] Quick pass on mobile layout (form/calendar usable; no layout rewrite)

**You check**

- [ ] Future / negative / invalid dates blocked
- [ ] Delete asks for confirm
- [ ] Mobile usable
- [ ] No obvious console errors on happy path

**Commit when:** polish OK.  
**Status:** implemented — awaiting your verify + commit.

---

## Stage H — Auth doctrine (login, not email)

**Goal:** align shipped auth with product doctrine (no email / no reset).

- [ ] Schema: `User.email` → `User.login` (unique); add `lastSeenAt`; wipe/migrate local DB (dev test account OK to drop)
- [ ] Session `maxAge` ≈ **30 days**
- [ ] Register / login forms use **login** field (any username string)
- [ ] Touch `lastSeenAt` on register/login; throttle refresh **≤ once per day** when signed-in
- [ ] Copy in all 4 locales (no “email” wording; no-recovery hint)
- [ ] Change-password modal when clicking own login (current / new / confirm)
- [ ] Script `users:prune-stale` (delete `lastSeenAt` older than 2 years) — wire into deploy later in J

**You check**

- [ ] Register with non-email login works
- [ ] Change password works; wrong current password fails
- [ ] No SMTP / mail code anywhere

**Commit when:** auth doctrine matches docs.

---

## Stage I — Guest localStorage + migrate/merge + unique dates

**Goal:** guests use cards in localStorage; account syncs; one date = one card.

- [ ] Seed **one** example into localStorage when empty: **1958-08-07** + i18n name; allow edit/delete/create
- [ ] Guest CRUD persists in localStorage (`updatedAt` on each card)
- [ ] DB: `UNIQUE (userId, year, month, day)`
- [ ] Create/edit: block duplicate dates with clear message (4 locales)
- [ ] On **register** / **login**: merge by date (newer `updatedAt` wins name) → truncate to 100 by `updatedAt` → clear localStorage → summary message
- [ ] Signed-in path: Postgres only
- [ ] Loading / error states for migrate

**You check**

- [ ] Guest: one Summit example; edits survive refresh
- [ ] Cannot create second card with same date (guest + signed-in)
- [ ] Register/login merge + messages; localStorage cleared
- [ ] Second device (logged in) sees DB cards only

**Commit when:** guest→account flow verified.

---

## Stage J — Server DB + optional deploy (only when you want)

- [ ] On `amster`: create role + DB `cosmic_clock`
- [ ] Put `DATABASE_URL` + `AUTH_SECRET` in `shared/.env`
- [ ] Run migrations on server
- [ ] Deploy via PM2 when you ask; run **`users:prune-stale`** as a deploy step
- [ ] Smoke-test https://cosmic-clock.info

**You check**

- [ ] Login + one card on production
- [ ] Logs clean enough

**Commit when:** deploy config / docs updated (if needed).

---

## Later (not now — do not pull into current stages)

- Card types/tags (birth, marriage, job, project)
- Time / place / timezone
- Real ephemeris / natal engine
- OAuth, billing, public share links
- Email / SMTP / password-reset by mail (explicitly deferred — not planned for v1)

---

## Current position

**Done:** Stage A–F (interim: email auth + guest examples only, no local persist).  
**In progress:** **Stage G** — implemented; verify then commit.

**Next after G:**

1. **H** — login (not email) + change password + lastSeenAt  
2. **I** — guest localStorage + merge + UNIQUE date  
3. **J** — server deploy + prune script on deploy  

**Why this order:** G is independent validation; H changes the User schema (needed before I’s register/login merge); I builds on both. Order of G vs H could swap, but I should stay after H.

Say when G is OK to commit / when to start H.
