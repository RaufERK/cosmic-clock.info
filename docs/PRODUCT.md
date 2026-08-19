# Cosmic Clock — Product

Users create **life-event cards**. Each has a **start date**; from that moment its **cosmic clock** shows year / month / day **stage** (Prophet Cosmic Clock — [`CLOCK_MATH.md`](CLOCK_MATH.md)).

Live: [cosmic-clock.info](https://cosmic-clock.info). Figma: [CCLOCK](https://www.figma.com/design/OyrUnsJBNxJMONNqMXK1B3/CCLOCK).

## Domain (v1)

- Three hands: **year** (12y cycle), **month** (1y), **day** (1 month). All start at **12** on the start date.
- **Navigation strips** — outer rim arcs marking the year/month hour so the two hands cannot be confused: [`CLOCK_MATH.md`](CLOCK_MATH.md).
- **No** ephemeris / planetary astrology.
- Legend uses God-quality names (`messages/*/clockHours`), not bare hour numbers.

## User

- Identifier: **login** (username, not email) + password.
- Session ~30d (Auth.js JWT). No SMTP / email verification / password-reset mail.
- Login/register: ~**10 attempts / 10 min per client IP** (in-memory; resets on process restart). IP from nginx `X-Real-IP` (`$remote_addr`), not the first `X-Forwarded-For` hop. Limit runs in Credentials `authorize` (UI actions and `/api/auth`).
- Forgotten password → new account + re-enter cards.
- Signed-in: click own login → change password. That sets `passwordChangedAt` and re-issues **this** JWT; other devices with older tokens are signed out.
- `lastSeenAt` on auth + ≤1×/day while using; idle **2+ years** pruned on deploy.
- Locales: **en / ru / es / pt**.

## Card

```ts
type Card = {
  id: string;
  name: string;
  day: number;    // 1–31
  month: number;  // 1–12
  year: number;   // >= 0; start <= today
  sortIndex: number; // display order (0 = first); user-controlled
  createdAt: string; // audit only — not UI order
  updatedAt: string; // merge freshness
};
```

- **One start date = one card** per user (DB unique + UI).
- Max **100** / user. Merge: dedupe by date (`updatedAt` wins name) → keep 100 newest by `updatedAt`.
- **UI order = user order** (`sortIndex`). Not `createdAt`. New cards go to the **end** (`max(sortIndex) + 1`). Edits must **not** change `sortIndex` or reshuffle the list.
- **Reorder mode:** lock control on the divider — the lock appears only when the user has **2+** clocks. While open: drag-and-drop or arrow buttons only — no edit, no create. Exit: lock again, Escape, or reload (order already saved). Guests: localStorage. Signed-in: DB.
- **Auth merge:** existing account cards keep their `sortIndex`. Guest cards (except seed 1958-08-07) that are **new dates** append at the end with higher indices. Same date → name/freshness merge, card does not move.
- **Migration (once):** existing rows are numbered left-to-right as the user saw them (default newest-first; `oldest` preference respected). After that, “new at end” applies only to new creates/merges.
- Start date: valid civil day; not in the future.

## Guest

- First visit (no localStorage key): seed **1958-08-07** (Summit Lighthouse); name from i18n.
- Guest edits in localStorage (`sortIndex` + `createdAt` + `updatedAt`). Legacy rows without `sortIndex` are numbered once from the old newest/oldest preference.
- After sign-in sync (or clear): storage `[]` — key kept so Summit does not re-seed on logout.
- Seed date **1958-08-07** is **never** merged into an account.
- Guest activity is not stored as cards in Postgres. Guest **creates** append `StatEvent` rows (no payload): [`ADMIN.md`](ADMIN.md).

## Flows

1. Guest → localStorage  
2. Register / login / logout; change password when signed in  
3. On auth: merge local → Postgres → clear to `[]` → toast summary  
4. Switch locale; read hands + legend  

## Out of scope (v1)

Event types, place/time-of-day, natal charts, sharing URLs, billing, OAuth, SMTP recovery.
