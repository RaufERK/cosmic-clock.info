# Admin stats page

Internal operator view at `/admin`. Not a public product surface. Guest cards (localStorage) are out of scope.

## Goal

Signed-in admin sees:

1. Totals — users, cards, today’s new accounts / new cards (UTC).
2. 30-day histogram — **new accounts per day** (`User.createdAt`). This is registrations, not historical logins. `lastSeenAt` is a single timestamp and cannot rebuild DAU.
3. 30-day histogram — **new cards per day** (`Card.createdAt`).
4. Table — login | card count, sorted by count desc, then login.

No card names in v1. No chart library: CSS bars.

## Access

- URL: `https://cosmic-clock.info/admin` (same Next.js app, not a subdomain).
- Allowlist: `ADMIN_LOGINS` in env (comma-separated). Compared after `normalizeLogin` (trim + lowercase). Production login `Rauf` → `rauf`.
- Gate: `getAdminStatsAction` (same Auth.js session path as card CRUD). Fail closed if env is empty. Signed-in non-admins see 404. Signed-out visitors get a sign-in form on `/admin`.
- No link from the public UI. `robots.txt` disallows `/admin`; page is `noindex`. No Umami on this layout.
- English copy only (not in `messages/*.json`).

## Route

- `src/app/admin/` lives **outside** `[locale]`.
- `src/proxy.ts` excludes `admin` from next-intl (otherwise `/admin` becomes `/en/admin`).
- Admin layout owns `<html>` / `<body>` and imports `globals.css`.

## Days

- Bucket timezone: **UTC**, labeled on the page.
- Window: today UTC and the previous 29 days; missing days are 0.

## Files

| Path | Role |
|------|------|
| `src/lib/admin-access.ts` | Parse `ADMIN_LOGINS`, `isAdminLogin()` |
| `src/lib/admin-day-buckets.ts` | UTC day keys + fill 30-day series |
| `src/lib/admin-stats.ts` | Prisma load + assemble page data |
| `src/lib/admin-stats-actions.ts` | Session gate + load stats |
| `src/components/admin/` | Sign-in form + dashboard |
| `src/app/admin/layout.tsx` | Shell, `noindex`, no Umami |
| `src/app/admin/page.tsx` | Summary, histograms, table |
| `src/app/robots.ts` | `Disallow: /admin` |

## Env

```text
ADMIN_LOGINS=Rauf
```

Local `.env` and production `shared/.env`. Example only in `.env.example`. Restart the app after changing env.

## Out of scope (later)

- Card names on click
- Table of date / login / cards
- True DAU (needs a visit log)
- Subdomain, nginx Basic, `User.role`
- Admin i18n
