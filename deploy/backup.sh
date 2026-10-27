#!/usr/bin/env bash
# Daily backup of the database and uploaded images. Add to crontab:
#   30 3 * * * /var/www/mrmzone-shop/deploy/backup.sh >> /var/log/mrmzone-backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."
source .env
STAMP=$(date +%F_%H%M)
DEST=/var/backups/mrmzone
mkdir -p "$DEST"
docker compose exec -T mysql mysqldump -u root -p"$DB_ROOT_PASSWORD" --single-transaction "$DB_DATABASE" | gzip > "$DEST/db_$STAMP.sql.gz"
docker run --rm -v mrmzone-shop_uploads:/data -v "$DEST":/backup alpine tar czf "/backup/uploads_$STAMP.tgz" -C /data .
find "$DEST" -type f -mtime +14 -delete
echo "Backup done: $STAMP"
