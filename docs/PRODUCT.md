# Cosmic Clock — Product

## One-liner

Cosmic Clock lets a user create **life-event cards** (birth, marriage, job start, project launch, …). Each card has a **start date**; from that moment its **cosmic clock** shows the year / month / day **stage** of that life-stream (Prophet Cosmic Clock theory — see [`CLOCK_MATH.md`](CLOCK_MATH.md)).

## Design reference (do not ship as production)

| Path | Role |
|------|------|
| [`CCLOCK/`](../CCLOCK/) | Figma Make (AI) prototype — **visual + UX reference only** |
| Figma | https://www.figma.com/design/OyrUnsJBNxJMONNqMXK1B3/CCLOCK |

Production app lives at the repo root (Next.js). Port look/UX from `CCLOCK`; **hand math follows `CLOCK_MATH.md`**, not the prototype’s placeholder formulas.

## Teaching / domain

Based on **Elizabeth Clare Prophet** and **Mark Prophet** — *Cosmic Clock*:

- Three hands: **year** (thick), **month** (medium), **day** (thin)
- Cycles: year hand **12 years**, month hand **1 year**, day hand **1 month**
- At the start date all hands at **12**; then they advance by elapsed time to **today**
- **No ephemeris / planetary astrology library**

Full rules and formulas: [`docs/CLOCK_MATH.md`](CLOCK_MATH.md).

## Core concepts

### User (пользователь)

Authenticated account. Can switch UI language among **en / ru / es / pt**.

### Card (карта)

A named life-event anchored to a **start date** (`day`, `month`, `year`).

Examples of intent (not hard-coded types yet): birth, marriage, job, project.

**Soft limit:** max **100 cards per user** (enforced server-side).

```ts
type Card = {
  id: string;
  name: string;
  day: number;   // 1–31  (start date)
  month: number; // 1–12
  year: number;
};
```

### Cosmic clock (hands)

| Hand | Cycle | UI |
|------|-------|-----|
| Year (hour-like) | 12 years | Blue, thick/short |
| Month (minute-like) | 1 year | Purple, medium |
| Day (second-like) | 1 month | Thin |

Computed in `src/lib/cosmic-clock-math.ts` from **start → asOf (today)**.

## Primary user flows

1. **Auth** — register / login / logout
2. **Language** — switch locale without losing the current route
3. **Cards** — guests see 2 examples; signed-in users manage their own cards in Postgres
4. **Read the stage** — year/month/day hands + legend hours

## Out of scope for v1

- Planetary natal charts, ephemerides, houses, aspects
- Sharing / public card URLs (unless added later)
- Billing / plans

## Product glossary

| Term | Meaning |
|------|---------|
| Card / карта / carta | Life-event with a start date |
| Cosmic clock | Start→now stage via year/month/day hands |
| CCLOCK | In-repo design prototype folder |
