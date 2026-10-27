#!/usr/bin/env bash
# Pull the latest code from GitHub and redeploy with zero manual steps.
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only
docker compose build
docker compose up -d
docker compose exec -T api php artisan optimize
docker image prune -f
echo "Updated ✔"
