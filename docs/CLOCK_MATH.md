# Cosmic Clock — Hand theory & math

Teaching: **Elizabeth Clare Prophet** / **Mark Prophet** — *The Cosmic Clock*.  
Not planetary astrology; **no ephemeris**. Hands = stage from **start date** → **asOf** (usually today).

## Hands & cycles

| Hand | Cycle (full dial) | UI |
|------|-------------------|-----|
| Year | **12 years** (1 year → next hour) | Blue, thick/short |
| Month | **1 year** (1 month → next hour) | Purple, medium |
| Day | **1 month** (continuous in month-segment) | Thin indigo |

Dial: **12 × 30°**. At start date all hands at **12** (0°), then advance with elapsed time.

## Formulas

```text
yearRotation  = (yearsElapsed  % 12) * 30
monthRotation = (monthsElapsed % 12) * 30
dayRotation   = monthFraction * 360   # [0,1) within current month-segment
```

- `yearsElapsed` / `monthsElapsed` — fractional, anniversary-based (before start → `0`; short months clamp day).
- Legend sector: tip’s 30° wedge (0 → label **12**, else 1–11). UI names: `messages/*/clockHours` (God-qualities).
- Do **not** map calendar digits (`year % 100`, calendar month, DOM) onto hands — that is not this theory.

## Code

- `src/lib/cosmic-clock-math.ts` — formulas  
- `src/components/CosmicClock.tsx` — face + hands  
