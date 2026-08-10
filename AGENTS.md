<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Cosmic Clock — agent instructions

Read these before changing product behavior or structure:

| Doc | Purpose |
|-----|---------|
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | Vision, Card domain, clock hand mapping |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, folders, constraints, data sketch |
| [`docs/PLAN.md`](docs/PLAN.md) | **Living checkbox plan** — one stage at a time |
| [`docs/CLOCK_MATH.md`](docs/CLOCK_MATH.md) | Prophet Cosmic Clock hand theory & formulas |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Short stage map |
| [`docs/INFRA.md`](docs/INFRA.md) | SSH hosts, server Postgres, local Docker DB |

## Hard rules

1. **`CCLOCK/` is design/UX reference only.** Implement in `src/` (+ `messages/`). Do not ship or typecheck the Vite prototype as the production app.
2. **Locales:** `en`, `ru`, `es`, `pt` via `next-intl`. User-facing copy belongs in `messages/*.json`.
3. **v1 “astrology”** = date → year/month/day clock hands (see Product). No ephemeris engine unless the roadmap phase explicitly says so.
4. **Card limit (planned):** 100 per user — enforce when persistence exists.
5. Prefer small, focused changes aligned with the **current stage in `docs/PLAN.md`**. Do not start the next stage until the user verifies and commits the current one.

## Default working language

- Code, identifiers, comments, and **agent docs:** English.
- Commit messages for this repo: follow the user’s language preference when they ask to commit.
