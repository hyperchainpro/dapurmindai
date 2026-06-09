#!/bin/bash
if [ -f /home/z/my-project/server.pid ]; then
  kill $(cat /home/z/my-project/server.pid) 2>/dev/null
  rm /home/z/my-project/server.pid
fi
kill -9 $(lsof -t -i:3000) 2>/dev/null
echo "DapurMind stopped"
