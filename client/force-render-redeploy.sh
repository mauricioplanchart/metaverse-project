#!/bin/bash

echo "🔄 Force Render Redeploy Script"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -f "src/index.ts" ]; then
    echo "❌ Please run this script from the server directory"
    exit 1
fi

echo "✅ Current directory: $(pwd)"
echo "📝 Latest commit: $(git log --oneline -1)"
echo ""

# Add a timestamp to force redeploy
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
echo "# Render cache clear - $TIMESTAMP" >> README.md

echo "📝 Adding timestamp to README.md..."
git add README.md
git commit -m "Force Render redeploy - clear cache at $TIMESTAMP"

echo "🚀 Pushing to trigger Render deployment..."
git push origin main

echo ""
echo "✅ Deployment triggered!"
echo "📊 Check your Render dashboard for deployment status"
echo "🌐 Your app URL: https://metaverse-project-2.onrender.com"
echo ""
echo "⏳ Wait 2-3 minutes for deployment to complete"
echo "🔍 Then test your Netlify app: https://mverse91.netlify.app" 