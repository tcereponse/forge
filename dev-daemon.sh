#!/bin/bash
cd /home/z/my-project
for i in 1 2 3 4 5 6 7 8 9 10; do
  echo "[$(date)] Attempt $i starting next dev (Turbopack)..." > /home/z/my-project/dev.log
  node ./node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1
  echo "[$(date)] Server exited, restarting in 2s..." >> /home/z/my-project/dev.log 2>&1
  sleep 2
done
