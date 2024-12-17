#!/bin/bash
set -e

# Wait for system to be ready
sleep 5

# Set timezone
echo "Asia/Shanghai" > /etc/timezone

# Start the application
exec "$@"
