# Cosmic Clock — Roadmap (summary)

The **detailed checkbox plan** we follow day-to-day is:

→ **[`docs/PLAN.md`](PLAN.md)**

Rules: one stage → you verify → commit → mark `[x]` → next stage. No rushing. Deploy optional until Stage J.  
Stages G–I may be reordered while we stay local-only.

High-level order:

| Stage | Name |
|-------|------|
| A | Docs & local DB |
| B | CosmicClock component |
| C | Cards UI (client-only) |
| D | Prisma schema |
| E | Real auth (Auth.js) — shipped with email; fixed in H |
| F | Persist cards + 100 limit |
| G | Date rules + hardening polish |
| H | Auth doctrine: **login** + change password + lastSeenAt |
| I | Guest localStorage + merge + unique date per user |
| J | Server DB + optional deploy + prune stale users |

Later (only on request): event types, place/time, ephemeris, OAuth, email/SMTP reset, etc.
