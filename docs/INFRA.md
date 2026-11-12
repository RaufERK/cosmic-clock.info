# Cosmic Clock — Infra & access

Do **not** commit production secrets.

## SSH (amster)

IP `185.200.178.73` · key `~/.ssh/id_ed25519`

| Alias | User | Use |
|-------|------|-----|
| `ssh amster` | `root` | nginx, certbot, system PG |
| `ssh amster_app` | `appuser` | deploys, PM2, `~/apps/*` |

Alias is **`amster_app`** (underscore).

| | |
|--|--|
| App | `/home/appuser/apps/cosmic-clock` |
| Env | `shared/.env` (`DATABASE_URL`, `AUTH_SECRET`, `ADMIN_LOGINS`, Umami public ids) |
| PM2 | port **3060**, bind `127.0.0.1` |
| Site | https://cosmic-clock.info |

Deploy: `npm run deploy` (migrate + prune stale users + `scripts/deploy-release.sh`).

`deploy-release.sh` builds into `.next-build`, swaps it into `.next`, reloads PM2 and polls `GET /api/health` (app + DB). On failure it restores `.next-prev` and exits non-zero. The previous build stays in `.next-prev`. Migrations run **before** the swap, so keep them backward compatible with the previous build.

Uptime monitor target: `https://cosmic-clock.info/api/health` (200 `{"ok":true}`, 503 when the DB does not answer).

## Backups

systemd timer `db-backup.timer` (root unit, runs as `appuser`), `03:30 Europe/Moscow` daily with `Persistent=true` (catches up after downtime; the zone is in the schedule, so DST or a changed system timezone cannot shift it): `~/bin/backup-db.sh` → `~/backups/db/cosmic_clock-<stamp>.dump` (`pg_dump -Fc`, validated with `pg_restore --list`, 30 days retention, log `~/logs/backup-db.log`). Restore check (as root, via stdin so `postgres` can read it):

```bash
createdb restore_test && cat dump | sudo -u postgres pg_restore --no-owner -d restore_test
```

Off-server copy: the Moscow VPS **pulls** them (`appuser` cron with `CRON_TZ=Europe/Moscow`, 04:15 and a retry at 10:15, `~/bin/pull-amster-backups.sh` → `~/backups/amsterdam/db`, 90 days retention, no `--delete`, log `~/logs/pull-amster-backups.log`). The script fails loudly if the newest dump is older than 30 h or `pg_restore --list` (newest installed client, 18) fails. Moscow uses a dedicated key `~/.ssh/id_ed25519_backup_pull`; on Amsterdam its `authorized_keys` line is `from="155.212.174.133",command="/usr/bin/rrsync -ro /home/appuser/backups/db",restrict` (read-only, that directory only, no shell). Amsterdam → Moscow SSH is blocked, so there is no key from this host to Moscow.

## Logs

`/etc/logrotate.d/appuser-apps` rotates `~/logs/*.log` and `~/.pm2/logs/*.log` weekly (4 kept, `copytruncate`, `maxsize 50M`).

## PostgreSQL

| Env | Where |
|-----|--------|
| Production | System PG **18** (PGDG packages, cluster `18/main`) on `127.0.0.1:5432`; DB/role `cosmic_clock`; locale `C.UTF-8`, data checksums on |
| Local | Docker Compose `postgres:18` on host **5433** |

```bash
# local
docker compose up -d
# DATABASE_URL=postgresql://cosmic_clock:cosmic_clock@127.0.0.1:5433/cosmic_clock
npm run db:migrate
```

Local volume: the compose file uses a new volume `cosmic_clock_pg18data` (the PG 18 image stores data under `/var/lib/postgresql/18/docker`, and a PG 16 volume cannot be opened by it). Old local data stays in `cosmic_clock_pgdata`; remove it with `docker volume rm cosmic-clock_cosmic_clock_pgdata` once it is not needed.

### Upgrade 14 → 18 (2026-11-12)

Dump/restore into a fresh cluster next to the old one (rehearsal on port 5433 first, then cutover; ~10 s downtime: stop PM2 app, final dump, restore, swap ports, start app). PG 14 reached end of life on 2026-11-12.

- **Packages:** PGDG apt repo (`/etc/apt/sources.list.d/pgdg.sources`). `/etc/apt/preferences.d/pgdg-low-priority` keeps everything from PGDG at priority 100 and allows only `postgresql-18`, `postgresql-client-18`, `postgresql-common`, `postgresql-client-common`, `libpq5` (priority 600), so a routine `apt upgrade` cannot swap Ubuntu's `postgresql-14` for a PGDG build.
- **Old cluster:** `14/main` is kept **stopped** on port **5433** with `start.conf` = `manual` (does not start on boot). Remove after **2026-12-12** if nothing went wrong: `pg_dropcluster 14 main --stop`, `apt purge postgresql-14 postgresql-client-14`. The pre-cutover dumps (custom + plain PG14 SQL) are in `/root/pg-migrate-20261112/` (mode 600); delete them together with the old cluster.
- **Dropped on 2026-11-12:** DB/role `umami` (last dump kept in `~/backups/umami-final/`) and DB/role `spokenword` (project lives on Moscow; last dump `~/backups/spokenword-final/spokenword-final-20261112-155916.dump` + `.sha256`, outside rotation).
- **Clients:** `pg_wrapper` follows the cluster on port 5432, so `appuser` now gets `pg_dump`/`pg_restore` 18. Dumps are archive format 1.16 and contain optimizer statistics (PG 18 default): restore them into PG 18 only. Moscow has the PG 18 client for this reason (its `pull-amster-backups.sh` validates with the newest installed `pg_restore`); Moscow's own dumps still use client 16.
- **Rollback (only while `14/main` exists):** stop the app, `systemctl stop postgresql@18-main`, swap the `port =` lines in `/etc/postgresql/{14,18}/main/postgresql.conf` (14 → 5432, 18 → 5433), set `start.conf` of 14 back to `auto`, `systemctl start postgresql@14-main`, start the app. Anything written after the cutover exists only in 18: dump it first (`pg_dump -Fp` from 18) and re-apply on 14.

## Umami (hosted on Moscow)

| | |
|--|--|
| Instance | `https://analytics.amasters.ru` (Moscow, not part of this VPS) |
| Tracker | first-party `/ua.js` + `/api/send` on cosmic-clock.info; nginx proxies both to `analytics.amasters.ru` (variable upstream + `resolver`, see `deploy/nginx/cosmic-clock.info.conf`) |
| Dashboard | `https://analytics.amasters.ru` |

Site needs `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (the website id from the Moscow instance) + `NEXT_PUBLIC_UMAMI_SCRIPT_URL=/ua.js`; both are baked in at build time, so a change needs a rebuild.

**Old Amsterdam Umami (retired 2026-11-11).** The statistics moved to Moscow on 2026-11-11. The old instance (PM2 `umami`, `:3030`, `stats.cosmic-clock.info`, DB/role `umami`) is stopped, removed from nginx and from `backup-db.sh`. The DB/role `umami` were dropped on 2026-11-12 (during the PG 18 upgrade). Still on disk: `/home/appuser/apps/umami` (1.9 GB, PM2 entry stopped), the last dump `~/backups/umami-final/umami-final-20261111-210840.dump` (+ `.sha256`, outside rotation). Planned cleanup after 2-4 weeks: `pm2 delete umami` + `pm2 save`, delete `apps/umami` and `umami-shared`, DNS record `stats`.

## Error tracking

Sentry was removed (Nov 2026). Liveness is `GET /api/health`.

Server errors: `src/instrumentation.ts` → `onRequestError` → `src/lib/error-alert.ts`.
- One JSON line per error in `~/logs/cosmic-clock-error.log` (`"source":"request"`): no headers, bodies, query strings, or local variables.
- Telegram alert (plain text) via a dedicated bot: `TELEGRAM_ALERT_BOT_TOKEN` + `TELEGRAM_ALERT_CHAT_ID` in `shared/.env` (the private chat with the owner). If either is missing, only the log line is written.
- Dedupe 15 min per error, max 10 alerts/hour per process. Stale Server Action errors are log-only.
- Outgoing `sendMessage` only. Never call `getUpdates` / `setWebhook` with this token.

## Admin stats (`/admin`)

Allowlist `ADMIN_LOGINS` in `.env` / `shared/.env`. Behavior and guest-create events: [`ADMIN.md`](ADMIN.md).
