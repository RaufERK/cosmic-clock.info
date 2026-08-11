# Cosmic Clock — Product

## One-liner

Cosmic Clock lets a user create **life-event cards** (birth, marriage, job start, project launch, …). Each card has a **start date**; from that moment its **cosmic clock** shows the year / month / day **stage** of that life-stream (Prophet Cosmic Clock theory — see [`CLOCK_MATH.md`](CLOCK_MATH.md)).

Production site: [cosmic-clock.info](https://cosmic-clock.info).  
Design history (optional): [Figma CCLOCK](https://www.figma.com/design/OyrUnsJBNxJMONNqMXK1B3/CCLOCK).

## Teaching / domain

Based on **Elizabeth Clare Prophet** and **Mark Prophet** — *Cosmic Clock*:

- Three hands: **year** (thick), **month** (medium), **day** (thin)
- Cycles: year hand **12 years**, month hand **1 year**, day hand **1 month**
- At the start date all hands at **12**; then they advance by elapsed time to **today**
- **No ephemeris / planetary astrology library**

Full rules and formulas: [`CLOCK_MATH.md`](CLOCK_MATH.md).

## Core concepts

### User

Authenticated account identified by a **login** (any username string — **not** an email) + password.

- Session ~**30 days** (Auth.js JWT)
- No email verification, no SMTP, no password-reset by mail
- Forgotten password → register a **new** account and re-enter cards
- Signed-in: click own login → **change password** (current / new / confirm)
- `lastSeenAt` — register/login + at most once per day while using the app; accounts idle **2+ years** are pruned on deploy
- UI languages: **en / ru / es / pt**

### Card

A named life-event anchored to a **start date** (`day`, `month`, `year`).

**One start date = one card per user** (DB unique + UI block on create/edit). Same name on different dates is allowed.

**Soft limit:** max **100** cards per user. On migrate/merge: dedupe by date first (newer `updatedAt` wins the name), then keep 100 newest by `updatedAt`, drop the rest.

```ts
type Card = {
  id: string;
  name: string;
  day: number;   // 1–31  (start date)
  month: number; // 1–12
  year: number;  // >= 0; start date must be <= today
  // createdAt + updatedAt in storage (freshness for merge = updatedAt)
};
```

### Guest example

First visit with **no** localStorage key yet seeds **one** card:

- Date: **7 August 1958** (The Summit Lighthouse founded)
- Name: from i18n (`messages/*`)
- Template lives in **code** (constant), not env; then guest edits live in localStorage
- After sign-in sync (or deleting all guest cards), storage becomes `[]` — Summit is **not** shown again on logout on that browser

### Start date rules

- Valid calendar day for the given month/year
- `year >= 0` (no negative years)
- Start date must be **on or before today** — future dates break clock math (elapsed time to “now”)

### Cosmic clock (hands)

| Hand | Cycle | UI |
|------|-------|-----|
| Year (hour-like) | 12 years | Blue, thick/short |
| Month (minute-like) | 1 year | Purple, medium |
| Day (second-like) | 1 month | Thin |

Computed in `src/lib/cosmic-clock-math.ts` from **start → asOf (today)**.  
Legend hours use God-quality names (`messages/*/clockHours`), not bare numbers.

## Primary user flows

1. **Guest** — one seeded example; edit/delete/create in **localStorage**
2. **Auth** — register / login / logout with **login + password**; change password when signed in
3. **Sync on account** — on register or login: merge local → Postgres (by date) → clear localStorage → show summary; then multi-device via DB
4. **Language** — switch locale without losing the current route
5. **Read the stage** — year/month/day hands + legend

## Out of scope (v1) / Later

Not planned unless requested:

- Event types, place/time of day
- Planetary natal charts, ephemerides, houses, aspects
- Sharing / public card URLs
- Billing / plans
- OAuth; email / SMTP / password recovery by mail

## Glossary

| Term | Meaning |
|------|---------|
| Card / карта | Life-event with a start date |
| Cosmic clock | Start→now stage via year/month/day hands |
| Login | Username for the account (not email) |
