# Cosmic Clock — Working plan (checklist)

**How we work (calm pace)**

1. Do **one stage** at a time. Do not start the next stage early.
2. You **verify** the stage (checklist under each stage).
3. We **commit** that stage (you ask for the commit).
4. We mark the stage `[x]` here.
5. Deploy is **optional** until we deliberately want production. Local Docker + `npm run dev` is enough.

Living checklist — edit this file as we go.  
Stack / i18n / auth details: also in [`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## Stack (locked)

| Layer | Choice |
|-------|--------|
| App | **Next.js** (App Router) + **TypeScript** + **React** |
| CSS | **Tailwind CSS** |
| i18n | **next-intl** — `en` / `ru` / `es` / `pt`, URL prefix always (`/en/...`) |
| DB | **PostgreSQL** — local Docker port **5433**; server PG later |
| ORM | **Prisma** |
| Auth | **Auth.js (NextAuth)** — email + password (Credentials), session cookies |
| Host | amster + PM2 + nginx (when we choose to deploy) |
| Design ref | `CCLOCK/` only — implement in `src/` |

### Multilingual (i18n)

- Library: **next-intl**
- Locales: English, Russian, Spanish, Portuguese
- Routes: `/[locale]/…` (e.g. `/ru/cards`)
- Strings: only in `messages/en.json`, `ru.json`, `es.json`, `pt.json` (same keys in all four)
- Language switcher in the header; keep the current path when switching

### Authorization (auth)

| Phase | What |
|-------|------|
| Now (until Stage E) | Demo session in `localStorage` — enough to build UI |
| Stage E | Real **register / login / logout** with Auth.js + password hash in Postgres + httpOnly cookie session |
| Cards | After Stage E: only the logged-in user’s cards; max **100** cards per user |

No OAuth (Google etc.) in v1 unless we add it later on purpose.

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

**Goal:** pure clock UI + hand math, ported from `CCLOCK`, with i18n-ready legend later.

- [x] Port `CosmicClock` into `src/components/`
- [x] Year / month / day hand math matches prototype (`src/lib/cosmic-clock-math.ts`)
- [x] Small preview on home (`ClockPreview` + sample dates)
- [x] No DB, no auth changes
- [ ] Waiting for your visual check + commit

**You check**

- [ ] Hands move correctly for known dates (e.g. 15.05.1995, 12.02.2026)
- [ ] Looks close to `CCLOCK` clock
- [ ] `npm run build` (or at least `npm run lint`) OK
- [ ] Preview copy OK in en / ru / es / pt

**Commit when:** you say the clock looks good.

---

## Stage C — Cards UI (client-only)

**Goal:** main product surface like the prototype, still without Postgres.

- [ ] Cards grid on `/[locale]/cards`
- [ ] Create / edit / delete card (name + day/month/year)
- [ ] Each card shows `CosmicClock`
- [ ] Client state or `localStorage` (temporary OK)
- [ ] Soft UX: empty state, add tile
- [ ] All new strings in **all four** `messages/*` files
- [ ] Visual pass vs `CCLOCK` (layout, not pixel-perfect stress)

**You check**

- [ ] Full CRUD without reload bugs (or documented localStorage restore)
- [ ] Switch `en` ↔ `ru` ↔ `es` ↔ `pt` — no missing keys
- [ ] Demo login still works with header
- [ ] Limit **not** required yet (mention in UI later)

**Commit when:** you are happy with the cards UX.

---

## Stage D — Prisma + schema (no real auth yet)

**Goal:** DB models ready; optional seed; still can keep UI on client until Stage E/F.

- [ ] Add Prisma + connect to local `DATABASE_URL`
- [ ] Models: `User`, `Card` (fields aligned with UI)
- [ ] First migration applied locally
- [ ] Document commands in README / INFRA
- [ ] Do **not** delete client cards UI yet — wire in Stage F

**You check**

- [ ] `npx prisma migrate dev` works
- [ ] Tables visible (Prisma Studio or `psql`)
- [ ] App still runs

**Commit when:** schema + migration in git.

---

## Stage E — Real auth

**Goal:** replace demo `localStorage` auth.

- [ ] Auth.js (Credentials): register, login, logout
- [ ] Passwords hashed (e.g. bcrypt/argon2)
- [ ] Session cookie (httpOnly)
- [ ] Protect `/cards` (redirect to login if anonymous) — decide together if home stays public
- [ ] Remove or gate demo-auth helpers
- [ ] Auth strings in all 4 locales
- [ ] `.env.example`: `AUTH_SECRET` (etc.)

**You check**

- [ ] Register → login → logout round-trip
- [ ] Wrong password fails cleanly
- [ ] Session survives refresh
- [ ] Another browser/profile does not see the session

**Commit when:** auth feels solid locally.

---

## Stage F — Persist cards in Postgres

**Goal:** cards belong to the user in the DB.

- [ ] Server Actions or route handlers for card CRUD
- [ ] List/create/edit/delete only own cards
- [ ] Enforce **max 100 cards / user** (server-side)
- [ ] Remove temporary client-only card storage
- [ ] Loading / error states for network

**You check**

- [ ] Create card → refresh → still there
- [ ] Second user cannot see first user’s cards
- [ ] 101st card rejected with clear message
- [ ] Delete works permanently

**Commit when:** persistence verified.

---

## Stage G — Hardening (calm polish)

- [ ] Date validation (valid day for month/year)
- [ ] Confirm before delete
- [ ] Empty / error / success copy polish (4 languages)
- [ ] Accessibility basics (focus, labels)
- [ ] Quick pass on mobile layout

**You check**

- [ ] Bad dates blocked
- [ ] Mobile usable
- [ ] No obvious console errors on happy path

**Commit when:** polish OK.

---

## Stage H — Server DB + optional deploy (only when you want)

- [ ] On `amster`: create role + DB `cosmic_clock`
- [ ] Put `DATABASE_URL` + `AUTH_SECRET` in `shared/.env`
- [ ] Run migrations on server
- [ ] Deploy via PM2 when you ask
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

---

## Current position

**Done:** Stage A (committed `c0e8ba2`).  
**Waiting on you:** **Stage B** — CosmicClock on home preview. Check visually, then ask for the Stage B commit.

When Stage B is verified and committed, next is **Stage C** (cards UI).
