#!/bin/bash

echo "🚀 Starting Metaverse Development Environment (Supabase Only)"

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "vite\|tsx\|node.*dev" 2>/dev/null || true
lsof -ti:5173,5174,5175,5176,5177,5178,5179,5180,5181,3001 | xargs kill -9 2>/dev/null || true

# Wait a moment for processes to fully terminate
sleep 2

# Clean Vite cache
echo "🧹 Cleaning Vite cache..."
rm -rf node_modules/.vite dist 2>/dev/null || true

# Install dependencies if needed
echo "📦 Checking dependencies..."
npm install

# Start the development server
echo "🎮 Starting Vite development server..."
echo "🌐 Client will be available at: http://localhost:5173"
echo "🔧 Supabase Only Mode - No additional server needed"
echo ""
echo "📋 Development Commands:"
echo "  • F1: Toggle debug mode"
echo "  • F2: Toggle avatar customizer"
echo "  • Ctrl+C: Stop server"
echo ""

npm run dev 