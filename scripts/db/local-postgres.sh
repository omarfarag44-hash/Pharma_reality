#!/usr/bin/env bash
# Spins up a throwaway local PostgreSQL 16 cluster, applies the Supabase shim,
# every migration and the seed, then prints DATABASE_URL.
#   scripts/db/local-postgres.sh start   # create + migrate + seed
#   scripts/db/local-postgres.sh stop
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
DATA="${PGDATA_DIR:-$ROOT/.local-pg}"
PORT="${PGPORT:-54329}"
RUN_AS=""
if [ "$(id -u)" = "0" ]; then RUN_AS="runuser -u postgres --"; fi

case "${1:-start}" in
  stop)
    [ -d "$DATA" ] && $RUN_AS "$PGBIN/pg_ctl" -D "$DATA" stop -m fast || true
    exit 0 ;;
  start)
    if [ -d "$DATA" ]; then $RUN_AS "$PGBIN/pg_ctl" -D "$DATA" stop -m fast >/dev/null 2>&1 || true; rm -rf "$DATA"; fi
    mkdir -p "$DATA"; [ -n "$RUN_AS" ] && chown postgres "$DATA"
    $RUN_AS "$PGBIN/initdb" -D "$DATA" -U postgres --auth=trust -E UTF8 >/dev/null
    $RUN_AS "$PGBIN/pg_ctl" -D "$DATA" -o "-p $PORT -k /tmp -c listen_addresses=127.0.0.1" -l "$DATA/server.log" -w start >/dev/null
    PSQL="psql -h 127.0.0.1 -p $PORT -U postgres -v ON_ERROR_STOP=1 -q"
    $PSQL -c "create database pharma_reality" >/dev/null
    $PSQL -d pharma_reality -f "$ROOT/scripts/db/supabase-shim.sql"
    for f in "$ROOT"/supabase/migrations/*.sql; do echo "migrate: $(basename "$f")"; $PSQL -d pharma_reality -f "$f"; done
    echo "seed: supabase/seed.sql"; $PSQL -d pharma_reality -f "$ROOT/supabase/seed.sql" >/dev/null
    echo "DATABASE_URL=postgres://postgres@127.0.0.1:$PORT/pharma_reality"
    ;;
esac
