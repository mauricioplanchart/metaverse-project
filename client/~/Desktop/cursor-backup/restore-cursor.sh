#!/bin/bash

# Cursor Restore Script
echo "🔄 Restoring Cursor settings..."

CURSOR_DIR="$HOME/Library/Application Support/Cursor"
BACKUP_DIR="$(dirname "$0")"

# Stop Cursor if running
echo "🛑 Stopping Cursor..."
pkill -f "Cursor" 2>/dev/null
sleep 2

# Restore User settings
if [ -d "$BACKUP_DIR/User" ]; then
    echo "📝 Restoring User settings..."
    rm -rf "$CURSOR_DIR/User"
    cp -r "$BACKUP_DIR/User" "$CURSOR_DIR/"
    echo "✅ User settings restored"
fi

# Restore Workspaces
if [ -d "$BACKUP_DIR/Workspaces" ]; then
    echo "🏢 Restoring Workspaces..."
    rm -rf "$CURSOR_DIR/Workspaces"
    cp -r "$BACKUP_DIR/Workspaces" "$CURSOR_DIR/"
    echo "✅ Workspaces restored"
fi

echo "🎉 Cursor settings restored!"
echo "🚀 Restart Cursor to apply changes" 