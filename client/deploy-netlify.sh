#!/bin/bash

# Netlify Deployment Script for Metaverse Client
echo "🚀 Starting Netlify deployment..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

# Deploy to Netlify
echo "🌐 Deploying to Netlify..."
netlify deploy --prod --dir=dist

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌍 Your app is now live on Netlify!"
else
    echo "❌ Deployment failed!"
    exit 1
fi 