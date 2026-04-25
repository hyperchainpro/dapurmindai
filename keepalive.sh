#!/bin/bash
while true; do
    echo "Starting server at $(date)" >> /tmp/keepalive.log
    cd /home/z/my-project
    NODE_ENV=production node .next/standalone/server.js >> /tmp/keepalive.log 2>&1
    EXIT_CODE=$?
    echo "Server exited with code $EXIT_CODE at $(date)" >> /tmp/keepalive.log
    sleep 2
done
