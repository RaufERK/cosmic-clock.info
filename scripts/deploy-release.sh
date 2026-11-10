#!/usr/bin/env bash
# Build into .next-build, swap into .next, reload PM2, verify /api/health, roll back on failure.
# Usage: scripts/deploy-release.sh <pm2-bin>
set -euo pipefail

PM2_BIN="${1:?usage: deploy-release.sh <pm2-bin>}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3060/api/health}"
HEALTH_TIMEOUT_SEC=45

wait_healthy() {
  local waited=0
  while [ "$waited" -lt "$HEALTH_TIMEOUT_SEC" ]; do
    if curl -fsS --max-time 3 "$HEALTH_URL" > /dev/null 2>&1; then
      return 0
    fi
    sleep 2
    waited=$((waited + 2))
  done
  return 1
}

reload_app() {
  "$PM2_BIN" startOrReload ecosystem.config.cjs --env production
}

# Generated route types of the previous build are matched by tsconfig and break the type check
# when a route was removed. They are not used at runtime.
rm -rf .next/types .next/dev/types .next-build
NEXT_DIST_DIR=.next-build npm run build

rm -rf .next-prev
if [ -d .next ]; then
  mv .next .next-prev
fi
mv .next-build .next

reload_app
if wait_healthy; then
  "$PM2_BIN" save
  echo "[deploy] healthy: $HEALTH_URL"
  exit 0
fi

echo "[deploy] health check failed, rolling back to previous build" >&2
if [ -d .next-prev ]; then
  rm -rf .next
  mv .next-prev .next
  reload_app
  if wait_healthy; then
    echo "[deploy] rollback OK, previous build is serving" >&2
  else
    echo "[deploy] rollback FAILED, app is still unhealthy" >&2
  fi
else
  echo "[deploy] no previous build to roll back to" >&2
fi
exit 1
