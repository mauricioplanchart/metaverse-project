#!/bin/bash

# Automated Backup Script for Metaverse Project
# Run this daily: crontab -e and add: 0 2 * * * /path/to/this/script.sh

PROJECT_DIR="/Users/mauricio2/metaverse-project"
BACKUP_DIR="/Users/mauricio2/backups/metaverse"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🛡️ Starting automated backup at $(date)"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# 1. Git backup
echo "📝 Creating Git backup..."
cd "$PROJECT_DIR"
git branch backup-auto-$DATE
git push origin backup-auto-$DATE

# 2. File system backup
echo "📁 Creating file backup..."
tar -czf "$BACKUP_DIR/metaverse-backup-$DATE.tar.gz" \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.git' \
    .

# 3. Database backup (if you have one)
echo "🗄️ Creating database backup..."
# pg_dump your-database > "$BACKUP_DIR/db-backup-$DATE.sql"

# 4. Environment backup
echo "⚙️ Creating environment backup..."
cp .env* "$BACKUP_DIR/" 2>/dev/null || echo "No .env files found"

# 5. Clean old backups (keep last 7 days)
echo "🧹 Cleaning old backups..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete

# 6. Health check
echo "🏥 Running health check..."
if [ -f "$BACKUP_DIR/metaverse-backup-$DATE.tar.gz" ]; then
    echo "✅ Backup completed successfully"
    echo "📊 Backup size: $(du -h "$BACKUP_DIR/metaverse-backup-$DATE.tar.gz" | cut -f1)"
else
    echo "❌ Backup failed"
    exit 1
fi

echo "🎉 Backup completed at $(date)" 