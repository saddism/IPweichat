#!/bin/bash

# Exit on any error
set -e

echo "Starting deployment process..."

# Navigate to project directory
cd /home/ubuntu/repos/IPweichat

# Stop running containers
echo "Stopping existing containers..."
docker-compose down

# Pull latest changes
echo "Pulling latest changes..."
git pull

# Rebuild and start containers
echo "Rebuilding and starting containers..."
docker-compose up -d --build

echo "Deployment completed successfully!"
