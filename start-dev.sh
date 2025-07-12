#!/bin/bash

echo "🚀 Starting Metaverse Development Environment..."

# Start server in background
echo "📡 Starting server on port 3001..."
cd server && npm run dev &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Start client in background
echo "🎮 Starting client on port 5173..."
cd ../client && npm run dev &
CLIENT_PID=$!

echo "✅ Both services started!"
echo "📡 Server: http://localhost:3001"
echo "🎮 Client: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for user to stop
wait 