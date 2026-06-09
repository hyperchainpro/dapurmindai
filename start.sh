#!/bin/bash
# DapurMind Startup Script

# Start PostgreSQL if not running
export PATH=/home/z/postgresql/pg16/bin:$PATH
export LD_LIBRARY_PATH=/home/z/postgresql/pg16/lib:$LD_LIBRARY_PATH
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
  echo "Starting PostgreSQL..."
  pg_ctl -D /home/z/postgresql/pgdata -l /home/z/postgresql/pgdata/logfile start
  sleep 2
fi

# Kill any existing process on port 3000
kill -9 $(lsof -t -i:3000) 2>/dev/null
sleep 1

# Start the app
cd /home/z/my-project
export DATABASE_URL="postgresql://z@localhost:5432/dapurmind"
export NODE_ENV=production
nohup node .next/standalone/server.js > /home/z/my-project/server.log 2>&1 &
echo $! > /home/z/my-project/server.pid
echo "DapurMind started with PID $(cat /home/z/my-project/server.pid)"
