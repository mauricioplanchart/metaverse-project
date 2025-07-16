#!/bin/bash

# Render Deployment Script for Metaverse Backend
echo "🚀 Starting Render deployment..."

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    echo "❌ render.yaml not found. Make sure you're in the project root."
    exit 1
fi

# Check if Render CLI is installed
if ! command -v render &> /dev/null; then
    echo "❌ Render CLI not found. Please install from: https://render.com/docs/cli"
    echo "Or use the Render dashboard to deploy manually."
    exit 1
fi

# Build the server
echo "📦 Building server..."
cd server
npm install
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Server build failed!"
    exit 1
fi

cd ..

echo "✅ Server build completed successfully!"

# Deploy to Render
echo "🌐 Deploying to Render..."
render deploy

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌍 Your backend is now live on Render!"
else
    echo "❌ Deployment failed!"
    echo "💡 You can also deploy manually through the Render dashboard:"
    echo "   https://dashboard.render.com"
    exit 1
fi 