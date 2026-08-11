# Cosmic Clock — Product

Users create **life-event cards**. Each has a **start date**; from that moment its **cosmic clock** shows year / month / day **stage** (Prophet Cosmic Clock — [`CLOCK_MATH.md`](CLOCK_MATH.md)).

Live: [cosmic-clock.info](https://cosmic-clock.info). Figma: [CCLOCK](https://www.figma.com/design/OyrUnsJBNxJMONNqMXK1B3/CCLOCK).

## Domain (v1)

- Three hands: **year** (12y cycle), **month** (1y), **day** (1 month). All start at **12** on the start date.
- **No** ephemeris / planetary astrology.
- Legend uses God-quality names (`messages/*/clockHours`), not bare hour numbers.

## User

- Identifier: **login** (username, not email) + password.
- Session ~30d (Auth.js JWT). No SMTP / email verification / password-reset mail.
- Forgotten password → new account + re-enter cards.
- Signed-in: click own login → change password.
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
  createdAt: string; // display sort only
  updatedAt: string; // merge freshness
};
```

- **One start date = one card** per user (DB unique + UI).
- Max **100** / user. Merge: dedupe by date (`updatedAt` wins name) → keep 100 newest by `updatedAt`.
- **UI order:** by **`createdAt`** (newest ↔ oldest). Edits must **not** change `createdAt` or reshuffle the list.
- Start date: valid civil day; not in the future.

## Guest

- First visit (no localStorage key): seed **1958-08-07** (Summit Lighthouse); name from i18n.
- Guest edits in localStorage (`createdAt` + `updatedAt`).
- After sign-in sync (or clear): storage `[]` — key kept so Summit does not re-seed on logout.
- Seed date **1958-08-07** is **never** merged into an account.

## Flows

1. Guest → localStorage  
2. Register / login / logout; change password when signed in  
3. On auth: merge local → Postgres → clear to `[]` → toast summary  
4. Switch locale; read hands + legend  

## Out of scope (v1)

Event types, place/time-of-day, natal charts, sharing URLs, billing, OAuth, SMTP recovery.
