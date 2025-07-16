#!/bin/bash

echo "🧹 Cleaning up development environment..."

# Kill all Vite, npm, and esbuild processes
echo "📱 Killing stuck processes..."
pkill -f "vite" 2>/dev/null || true
pkill -f "esbuild" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

# Kill processes on common dev ports
echo "🔌 Freeing up ports..."
lsof -ti:5173,5174,5175,5176,5177,5178,5179,5180,5181,5182,5183,5184,5185 | xargs kill -9 2>/dev/null || true

# Clear caches
echo "🗑️  Clearing caches..."
rm -rf node_modules/.vite dist .vite .netlify 2>/dev/null || true

# Clear npm cache
echo "🧽 Clearing npm cache..."
npm cache clean --force

echo "✅ Cleanup complete! You can now run 'npm run dev'" 