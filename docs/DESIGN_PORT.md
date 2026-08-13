# Cosmic Clock — Figma dump → production

When a new Make/Figma code dump lands (folder `CCLOCK/`), do **not** copy it into `src/` as a second app. Diff it against production, then port only what this guide (and the user) allow.

Dump origin: [CCLOCK in Figma](https://www.figma.com/design/OyrUnsJBNxJMONNqMXK1B3/CCLOCK). Product doctrine: [`PRODUCT.md`](PRODUCT.md). Math: [`CLOCK_MATH.md`](CLOCK_MATH.md).

## Workflow

1. Drop the new bundle into `CCLOCK/` (replace files, keep the folder name).
2. **Commit the dump** so the next drop is a git diff, not a blind rewrite. Keep `CCLOCK/` in `tsconfig.json` `exclude` so Next.js does not typecheck the Vite mock on build.
3. Compare dump vs `src/` — real screens only (see below).
4. Check **Locked production decisions** in this file. Anything listed here stays as in prod unless the user explicitly overrides it.
5. Summarize deltas (visual vs product vs leftover). Ask what to port.
6. Implement in `src/` + `messages/`. Never vendor the Vite/Make stack.

## What to compare

The dump is a Vite mock. The live screen is `CCLOCK/src/app/App.tsx` plus:

| Dump | Production |
|------|------------|
| `CCLOCK/src/app/App.tsx` | `src/components/CosmicApp.tsx` |
| `CCLOCK/src/app/components/CosmicClock.tsx` | `src/components/CosmicClock.tsx` |
| `CCLOCK/src/app/components/CardForm.tsx` | `src/components/CardForm.tsx` |
| `CCLOCK/src/app/components/AuthModal.tsx` | `src/components/AuthModal.tsx` |
| `CCLOCK/src/app/i18n.ts` | `messages/*.json` |

Ignore: `Hero`, `Navbar`, `Footer`, `Services`, `Portfolio` (agency template leftovers), `components/ui/*`, light shadcn `theme.css`, mock email auth, mock cards, hardcoded Russian strings.

Hand math in the dump (`year % 100`, calendar month/day on the dial) is **not** the product. Production uses [`CLOCK_MATH.md`](CLOCK_MATH.md). Never port dump rotations.

## Locked production decisions

Do **not** take these from a dump without a new explicit instruction.

| Topic | Keep in production | Why |
|-------|--------------------|-----|
| Clock legend | God-quality names (`messages/*/clockHours`), current type size (`text-[13px]` / `sm:text-sm`, `font-medium`) | Names are the product. Size was fitted so all four locales fit. |
| Navigation strips | Outer year/month hour-sector arcs; same look as dump (`r + 7`, glow `0.7` / `4px`) | Keep the name. See [`CLOCK_MATH.md`](CLOCK_MATH.md). |
| Card grid | Full-width `auto-fill` (`minmax(min(100%,340px),380px)`), not a fixed 3-column `max-w-7xl` grid | Cards stay a readable size on wide screens. |
| Mobile language | Custom dropdown, not a native `<select>` | Native select is a poor fit for this chrome. |
| Auth | Username login, not email; change-password when signed in | [`PRODUCT.md`](PRODUCT.md) auth doctrine. |
| Root type | `html { font-size: 18px }` + Georgia in `globals.css` | Dump is 16px; prod was bumped to match the heavier look. |

## Ported from the dump (this pass)

| Topic | Production behavior |
|-------|---------------------|
| Card order | User order: `sortIndex`, lock + drag/arrows. See [`PRODUCT.md`](PRODUCT.md). |
| Day hand | Dark ruby (`bg-rose-900`), slightly longer than the month hand. |
| Delete copy | “clock/часы/reloj/relógio”, not “card/карта/carta”. |

## Agent checklist

- [ ] Dump committed under `CCLOCK/` (`tsconfig` / eslint still exclude that folder)
- [ ] Diff limited to the four real screens + i18n
- [ ] Locked rows above left unchanged
- [ ] Clock hands still from `src/lib/cosmic-clock-math.ts`
- [ ] User-facing strings in `messages/*.json` (`en` / `ru` / `es` / `pt`)
- [ ] Domain tests still cover math / merge / start-date / **user order**
