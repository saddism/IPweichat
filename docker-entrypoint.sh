#!/bin/bash
set -e

# Wait for system to be ready
sleep 5

# Set timezone
echo "Asia/Shanghai" > /etc/timezone

# Start Python bot in background
cd /app/python_bot
python3 start.py &

# Start Node.js bot
cd /app
exec "$@"
