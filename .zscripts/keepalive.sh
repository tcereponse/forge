#!/bin/bash
# Keep-alive script: restarts the dev server if it dies
cd /home/z/my-project
while true; do
  # Check if server is responding
  if ! curl -s -o /dev/null --connect-timeout 3 http://localhost:3000/ 2>/dev/null; then
    echo "[$(date)] Server down, restarting..."
    pkill -f "next dev" 2>/dev/null
    pkill -f "bun run dev" 2>/dev/null
    sleep 2
    rm -rf .next
    nohup bun run dev > dev.log 2>&1 &
    disown
    # Wait for server to be ready
    for i in $(seq 1 20); do
      sleep 3
      if curl -s -o /dev/null --connect-timeout 3 http://localhost:3000/ 2>/dev/null; then
        echo "[$(date)] Server ready after ${i}x3s"
        # Give it extra time to stabilize
        sleep 10
        break
      fi
    done
  fi
  sleep 10
done
