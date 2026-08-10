# Cosmic Clock — Product

## One-liner

Cosmic Clock lets a user create **life-event cards** (birth, marriage, job start, project launch, …). Each card has its own date-driven “astrology”: a cosmic clock whose hands show where that event stands on **year / month / day**.

## Design reference (do not ship as production)

| Path | Role |
|------|------|
| [`CCLOCK/`](../CCLOCK/) | Figma Make (AI) prototype — **visual + UX reference only** |
| Figma | https://www.figma.com/design/OyrUnsJBNxJMONNqMXK1B3/CCLOCK |

Production app lives at the repo root (Next.js). Port behavior and look from `CCLOCK`; do not run or deploy the Vite prototype as the site.

## Core concepts

### User (пользователь)

Authenticated account. Can switch UI language among **en / ru / es / pt**.

### Card (карта)

A named life-event anchored to a **calendar date** (`day`, `month`, `year`).

Examples of intent (not hard-coded types yet):

- Personal / natal-like (birth)
- Marriage
- Starting a job
- Starting a project
- “Transits” / year snapshot (prototype seed name)

**Soft limit (planned):** max **100 cards per user** — anti-abuse; not enforced in the prototype.

Prototype shape (source of truth for v1 domain):

```ts
type Card = {
  id: string;
  name: string;
  day: number;   // 1–31
  month: number; // 1–12
  year: number;
};
```

Future fields (not required for v1 UI parity): birth/event time, place, timezone, card type/tags, notes.

### Cosmic clock (hands)

Not a traditional ephemeris natal chart (no planets/houses engine in v1).  
Geometric mapping from the card date → clock hands:

| Hand (visual) | Meaning | Rotation (from prototype) |
|---------------|---------|---------------------------|
| Hour (blue)   | Year    | `(year % 100) * 3.6` ° |
| Minute (purple) | Month | `(month - 1) * 30` ° |
| Second (indigo) | Day  | `(day - 1) * (360 / 31)` ° |

Reference implementation: `CCLOCK/src/app/components/CosmicClock.tsx`.

## Primary user flows

1. **Auth** — register / login / logout (real backend TBD; prototype and scaffold use stubs).
2. **Language** — switch locale without losing the current route.
3. **Cards** — list, create, edit, delete; each card shows name, date, and the cosmic clock.
4. **Read the stage** — understand year/month/day position via hands + legend.

## Out of scope for v1

- Full traditional natal-chart calculation (planets, houses, aspects)
- Transit engines / ephemeris libraries
- Sharing / public card URLs (unless added later)
- Billing / plans

## Product glossary

| Term | Meaning |
|------|---------|
| Card / карта / carta | Life-event chart entry with a date |
| Cosmic clock | Date → year/month/day hands visualization |
| CCLOCK | In-repo design prototype folder |
| Scaffold | Current Next.js app at repo root |
