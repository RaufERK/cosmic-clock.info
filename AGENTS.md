<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Cosmic Clock — agent instructions

Read before changing product behavior or structure:

| Doc | Purpose |
|-----|---------|
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | Vision, Card domain, auth/cards doctrine |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, folders, data flow |
| [`docs/CLOCK_MATH.md`](docs/CLOCK_MATH.md) | Hand theory & formulas |
| [`docs/DESIGN_PORT.md`](docs/DESIGN_PORT.md) | Figma/`CCLOCK` dump → prod: what to port vs keep |
| [`docs/INFRA.md`](docs/INFRA.md) | SSH, server Postgres, local Docker DB |
| [`docs/ADMIN.md`](docs/ADMIN.md) | Internal `/admin` stats (allowlist, not public) |

## Hard rules

1. Implement in `src/` (+ `messages/`). Do not invent a second app stack.
2. **Locales:** `en`, `ru`, `es`, `pt` via `next-intl`. User-facing copy in `messages/*.json`.
3. **v1 “astrology”** = date → year/month/day clock hands (see Product / CLOCK_MATH). No ephemeris unless product docs say so.
4. **Card limit:** 100 per user — enforce server-side (including migrate/merge).
5. Prefer small, focused changes. Do not expand into “Later” backlog items unless the user asks.
6. **Auth doctrine:** login = username (not email); no SMTP / password-reset mail; change-password when signed in; session ~30d; `lastSeenAt`.
7. **Cards doctrine:** one start date per user; guest → localStorage (seed 1958-08-07, never merged into accounts); on register/login → merge by date then clear localStorage to `[]`; signed-in → DB only. **UI list order** = `sortIndex` (user order; new cards at end). Lock mode = drag/arrows only. Edits must not change `sortIndex`. Figma dump porting: [`docs/DESIGN_PORT.md`](docs/DESIGN_PORT.md).
8. **Tests:** domain unit tests via Vitest (`npm test`) — keep math / merge / start-date covered when changing those libs.

## Default working language

- Code, identifiers, comments, and **agent docs:** English.
- Commit messages for this repo: follow the user’s language preference when they ask to commit.
