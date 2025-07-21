#!/bin/bash

echo "🧹 Clearing all caches and rebuilding application..."

# Kill any running processes
echo "🛑 Stopping any running processes..."
pkill -f "vite" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

# Clear all caches
echo "🗑️ Clearing caches..."
rm -rf dist/ 2>/dev/null || true
rm -rf node_modules/.vite/ 2>/dev/null || true
rm -rf .vite/ 2>/dev/null || true

# Clear browser cache files if they exist
echo "🌐 Clearing browser cache files..."
find . -name "*.js" -path "*/cache/*" -delete 2>/dev/null || true
find . -name "*.html" -path "*/cache/*" -delete 2>/dev/null || true

# Reinstall dependencies to ensure clean state
echo "📦 Reinstalling dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Verify no Socket.IO references in built files
echo "🔍 Verifying no Socket.IO references..."
if grep -r "metaverse-project-2.onrender.com" dist/ 2>/dev/null; then
    echo "❌ Found Socket.IO references in built files!"
    exit 1
else
    echo "✅ No Socket.IO references found in built files"
fi

if grep -r "SocketService" dist/ 2>/dev/null; then
    echo "❌ Found SocketService references in built files!"
    exit 1
else
    echo "✅ No SocketService references found in built files"
fi

echo "🎉 Cache cleared and application rebuilt successfully!"
echo "🚀 Ready to start development server" 