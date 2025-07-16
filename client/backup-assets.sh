#!/bin/bash

# Asset Backup Script for Metaverse Project
# This script backs up large assets to multiple cloud storage locations

set -e

# Configuration
PROJECT_NAME="metaverse-project"
BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
ASSETS_DIR="./assets"
BACKUP_DIR="./backups"
GOOGLE_DRIVE_DIR="$HOME/Google Drive/Backups"
DROPBOX_DIR="$HOME/Dropbox/Backups"
ICLOUD_DIR="$HOME/Library/Mobile Documents/com~apple~CloudDocs/Backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Asset Backup for $PROJECT_NAME${NC}"
echo -e "${BLUE}📅 Backup Date: $BACKUP_DATE${NC}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to check if directory exists
check_directory() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅ Found: $1${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Not found: $1${NC}"
        return 1
    fi
}

# Function to backup to location
backup_to_location() {
    local source="$1"
    local destination="$2"
    local location_name="$3"
    
    if [ -d "$destination" ]; then
        echo -e "${BLUE}📁 Backing up to $location_name...${NC}"
        cp -r "$source" "$destination/"
        echo -e "${GREEN}✅ Successfully backed up to $location_name${NC}"
    else
        echo -e "${YELLOW}⚠️  Skipping $location_name (directory not found)${NC}"
    fi
}

# Check if assets directory exists
if [ ! -d "$ASSETS_DIR" ]; then
    echo -e "${YELLOW}⚠️  Assets directory not found. Creating empty structure...${NC}"
    mkdir -p "$ASSETS_DIR"/{models,textures,audio,animations,environments}
fi

# Create timestamped backup
BACKUP_NAME="${PROJECT_NAME}_assets_${BACKUP_DATE}"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

echo -e "${BLUE}📦 Creating backup archive...${NC}"

# Create tar.gz backup
tar -czf "${BACKUP_PATH}.tar.gz" -C . assets/

# Create zip backup (for Windows compatibility)
if command -v zip &> /dev/null; then
    zip -r "${BACKUP_PATH}.zip" assets/
    echo -e "${GREEN}✅ Created ZIP backup: ${BACKUP_PATH}.zip${NC}"
fi

echo -e "${GREEN}✅ Created TAR.GZ backup: ${BACKUP_PATH}.tar.gz${NC}"

# Get backup size
BACKUP_SIZE=$(du -h "${BACKUP_PATH}.tar.gz" | cut -f1)
echo -e "${BLUE}📊 Backup size: $BACKUP_SIZE${NC}"

# Backup to cloud locations
echo -e "${BLUE}☁️  Backing up to cloud storage...${NC}"

# Google Drive
backup_to_location "${BACKUP_PATH}.tar.gz" "$GOOGLE_DRIVE_DIR" "Google Drive"

# Dropbox
backup_to_location "${BACKUP_PATH}.tar.gz" "$DROPBOX_DIR" "Dropbox"

# iCloud
backup_to_location "${BACKUP_PATH}.tar.gz" "$ICLOUD_DIR" "iCloud"

# Create asset inventory
echo -e "${BLUE}📋 Creating asset inventory...${NC}"
INVENTORY_FILE="$BACKUP_DIR/asset_inventory_${BACKUP_DATE}.txt"

cat > "$INVENTORY_FILE" << EOF
Asset Inventory for $PROJECT_NAME
Generated: $(date)
Backup Date: $BACKUP_DATE

ASSET SUMMARY:
$(find assets/ -type f 2>/dev/null | wc -l) total files
$(du -sh assets/ 2>/dev/null || echo "0B")

DETAILED LISTING:
EOF

# Add detailed file listing
if [ -d "$ASSETS_DIR" ]; then
    find assets/ -type f -exec ls -lh {} \; >> "$INVENTORY_FILE" 2>/dev/null || true
fi

echo -e "${GREEN}✅ Asset inventory created: $INVENTORY_FILE${NC}"

# Clean up old backups (keep last 10)
echo -e "${BLUE}🧹 Cleaning up old backups...${NC}"
cd "$BACKUP_DIR"
ls -t *.tar.gz | tail -n +11 | xargs -r rm -f
ls -t *.zip | tail -n +11 | xargs -r rm -f
ls -t asset_inventory_*.txt | tail -n +11 | xargs -r rm -f

echo -e "${GREEN}🎉 Asset backup completed successfully!${NC}"
echo -e "${BLUE}📁 Backup location: $BACKUP_PATH.tar.gz${NC}"
echo -e "${BLUE}📋 Inventory: $INVENTORY_FILE${NC}"

# Show backup summary
echo -e "${BLUE}📊 Backup Summary:${NC}"
echo -e "  • TAR.GZ: ${BACKUP_PATH}.tar.gz ($BACKUP_SIZE)"
if [ -f "${BACKUP_PATH}.zip" ]; then
    ZIP_SIZE=$(du -h "${BACKUP_PATH}.zip" | cut -f1)
    echo -e "  • ZIP: ${BACKUP_PATH}.zip ($ZIP_SIZE)"
fi
echo -e "  • Inventory: $INVENTORY_FILE" 