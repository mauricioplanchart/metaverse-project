#!/bin/bash

echo "🧹 Comprehensive development cleanup starting..."

# Kill any running processes
echo "🛑 Stopping any running processes..."
pkill -f "vite" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "node.*dev" 2>/dev/null || true

# Wait a moment for processes to stop
sleep 2

# Clear all caches and build artifacts
echo "🗑️ Clearing all caches and build artifacts..."
rm -rf dist/ 2>/dev/null || true
rm -rf node_modules/.vite/ 2>/dev/null || true
rm -rf .vite/ 2>/dev/null || true
rm -rf .cache/ 2>/dev/null || true
rm -rf build/ 2>/dev/null || true

# Clear any service worker caches
echo "🌐 Clearing service worker caches..."
find . -name "sw.js" -delete 2>/dev/null || true
find . -name "service-worker.js" -delete 2>/dev/null || true
find . -name "*.sw.js" -delete 2>/dev/null || true

# Clear browser cache files
echo "🌐 Clearing browser cache files..."
find . -name "*.js" -path "*/cache/*" -delete 2>/dev/null || true
find . -name "*.html" -path "*/cache/*" -delete 2>/dev/null || true

# Reinstall dependencies to ensure clean state
echo "📦 Reinstalling dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

echo "✅ Cleanup complete! Starting development server..."
npm run dev 