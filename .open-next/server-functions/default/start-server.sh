#!/bin/bash
# Ensure PostgreSQL is running and start the app

export PATH=/home/z/pgsql-extract/pgsql-server/usr/lib/postgresql/17/bin:/home/z/pgsql-extract/pgsql-client/usr/lib/postgresql/17/bin:$PATH
export LD_LIBRARY_PATH=/home/z/pgsql-extract/pgsql-server/usr/lib/postgresql/17/lib:$LD_LIBRARY_PATH
export DATABASE_URL="postgresql://z@127.0.0.1:5432/dapurmind"

# Start PostgreSQL if not running
if ! pg_isready -h 127.0.0.1 -q 2>/dev/null; then
  echo "Starting PostgreSQL..."
  pg_ctl -D /home/z/pgsql-data -l /home/z/pgsql-data/logfile start
  sleep 2
fi

cd /home/z/my-project
while true; do
  PORT=3000 DATABASE_URL="postgresql://z@127.0.0.1:5432/dapurmind" node .next/standalone/server.js
  echo "$(date) Server exited with code $?. Restarting in 2s..."
  sleep 2
done