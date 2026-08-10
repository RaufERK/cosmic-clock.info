# Cosmic Clock — Hand theory & math

Source teaching: **Elizabeth Clare Prophet** and **Mark Prophet** — *The Cosmic Clock*.

This is **not** planetary astrology and needs **no ephemeris library**.  
Hands show the **stage** of a life-event (person, marriage, job, project, …) measured from its **start date** to a reference moment (usually **today**).

## Hands (visual → meaning)

| Visual (clock analogy) | Role | Color (UI) | Thickness |
|------------------------|------|------------|-----------|
| Hour hand | **Year** hand | Blue | Short, thick |
| Minute hand | **Month** hand | Purple / pink | Medium |
| Second hand | **Day** hand | Indigo / thin | Thinnest |

## Cycles (full lap around the dial = 12 “hours” of 30°)

| Hand | Full circle | One step to next hour |
|------|-------------|------------------------|
| Year | **12 years** | **1 year** (anniversary → next hour) |
| Month | **1 year** | **1 month** (monthly anniversary → next hour) |
| Day | **1 month** | Moves continuously through the current month period |

## Meaning in plain language

1. User sets a **start date** on a card (birth, project launch, …).
2. At that instant the cosmic clock **starts**. All hands begin at **12** (top).
3. Hands then show **where the being/project is on its path**:
   - **Year hand** — which year-stage of the 12-year cycle.
   - **Month hand** — which month-stage of the yearly cycle.
   - **Day hand** — progress through the current month toward the next month-hour (how much of this month-segment remains / has passed).

### Year hand

- On the start date: at **12**.
- Over the following year it **gradually** moves toward the next hour (**1**).
- On the **same calendar anniversary** one year later it reaches that next hour, then continues toward **2**, and so on.
- After **12 years** it has completed one full circle and returns to **12**.

### Month hand

- Same idea, faster: one **month** moves it one hour around the dial.
- Full circle in **12 months** (one year).
- Moves **gradually** within each month toward the next hour.

### Day hand

- Makes a **full circle every month** (the same month-period that advances the month hand by one hour).
- Shows fine progress inside the current month-segment (analogous to a seconds hand within that period).

## Math (degrees on the dial)

Dial: **12 sectors × 30°**. Rotation **0° = 12** (top), **30° = 1**, … clockwise.

Given:

- `start` = card date (civil `year-month-day`)
- `asOf` = reference date (default: today, local civil date)

Compute continuous elapsed time:

- `yearsElapsed` — fractional years since `start` (anniversary-based; before `start` → `0`)
- `monthsElapsed` — fractional months since `start` (monthly anniversary-based; day-of-month clamped for short months)
- Within the current month-segment, `monthFraction ∈ [0, 1)` from last month-anniversary to the next

Then:

```text
yearRotation  = (yearsElapsed  % 12) * 30
monthRotation = (monthsElapsed % 12) * 30
dayRotation   = monthFraction * 360
```

**Legend “hour”** for a hand = which 30° sector the tip is in (sector 0 → display **12**, else 1–11). That is a coarse stage label; the hand angle itself is continuous.

## What we do *not* use

- Ephemeris / Swiss Ephemeris / natal planet positions
- Houses, aspects, signs as planetary astrology
- The old Figma-prototype formula that mapped absolute calendar digits  
  (`year % 100`, calendar month, day-of-month) — that was a **placeholder**, not Prophet theory

## Code

- Spec + formulas: this file
- Implementation: `src/lib/cosmic-clock-math.ts`
- UI: `src/components/CosmicClock.tsx` (hands from start → asOf)
