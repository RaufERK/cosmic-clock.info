# Admin stats (`/admin`)

Internal operator page. Not a product surface. English UI only (not `messages/*.json`). No public links. No Umami on this layout.

**Live:** `https://cosmic-clock.info/admin` (local: `http://localhost:3000/admin`). Same Next.js app, not a subdomain (`stats.` is Umami).

## Access

`ADMIN_LOGINS` — comma-separated logins in `.env` / production `shared/.env`. Compared after `normalizeLogin` (trim + lowercase). Empty/missing env → nobody. Production operator `Rauf` → stored login `rauf`.

Gate: `getAdminStatsAction` (Auth.js session, same path as card CRUD). Signed-out → sign-in form on `/admin`. Signed-in but not allowlisted → 404. Fail closed.

`src/app/admin/` is **outside** `[locale]`. `src/proxy.ts` excludes `admin` from next-intl. Layout owns `<html>`/`<body>`. `robots.txt` disallows `/admin`; metadata `noindex`.

## What it shows

Days: **UTC**, last 30 calendar days (today + 29), missing days = 0. Histograms: CSS bars, Y-axis with grid, X-axis date ticks, hover shows `15 Jul · 3`.

| Widget | Source | Meaning |
|--------|--------|---------|
| Users / account cards | `User` / `Card` counts | All-time Postgres rows |
| Guest creates | `StatEvent` count (`kind=guest_card_create`) | All-time create events |
| Today | `createdAt` on UTC today | New accounts / account-cards / guest creates |
| Histogram: new accounts | `User.createdAt` | Registrations — **not** DAU |
| Histogram: new account cards | `Card.createdAt` | Account cards inserted that UTC day (includes login merge) |
| Histogram: guest card creates | `StatEvent.createdAt` | Guest **creates** only |
| Table | `User.login` + `_count.cards` | Count desc, then login. No names, no hashes |

**Do not add guest-create counts to account-card counts.** Register merge writes guest cards into `Card` — summing double-counts.

Guest **cards** stay in `localStorage`. A `StatEvent` is only `{ id, kind, createdAt }` — server time of the POST, no card payload.

### Guest create rules

- Record **create** after a successful guest add. Ignore edit, reorder, delete, storage wipe.
- Skip Summit seed **1958-08-07** (`loadOrSeedGuestCards` and any card with that date).
- Skip signed-in creates (`Card.createdAt`).
- Client: fire-and-forget `POST /api/stats/guest-card-create` (empty body). Failures ignored.
- Public POST, no auth. Rate-limit 30 / 10 min per IP (`src/lib/stat-rate-limit.ts`).

### Files

| Path | Role |
|------|------|
| `src/lib/admin-access.ts` | Parse allowlist, `isAdminLogin()` |
| `src/lib/admin-day-buckets.ts` | UTC buckets, axis ticks, Y scale |
| `src/lib/admin-stats.ts` | Prisma assemble |
| `src/lib/admin-stats-actions.ts` | Session gate + load |
| `src/lib/guest-card-stats.ts` | Skip seed + `reportGuestCardCreate()` |
| `src/lib/stat-event.ts` | `kind` constant |
| `src/lib/login.ts` | `normalizeLogin` (no Prisma import) |
| `src/app/api/stats/guest-card-create/` | Public POST |
| `src/components/admin/` | Sign-in + dashboard |
| `src/app/admin/` | Route |
| `src/app/robots.ts` | `Disallow: /admin` |

Env: `ADMIN_LOGINS=Rauf` (example in `.env.example`). Restart the process after changing env.

## Later (not scheduled)

Card names on click; date/login/cards table; true DAU (visit log); guest unique visitors; linking events to a later account; subtracting deletes; nginx Basic; admin i18n.
