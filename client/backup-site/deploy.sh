#!/bin/bash

# Backup Site Deployment Script
echo "🚀 Deploying Backup Site..."

# Update the main site URL in the HTML file
# Replace 'your-main-site.netlify.app' with your actual main site URL
MAIN_SITE_URL="your-actual-main-site.netlify.app"

# Update the HTML file with the correct URL
sed -i '' "s/your-main-site\.netlify\.app/$MAIN_SITE_URL/g" index.html

echo "✅ Backup site ready for deployment!"
echo ""
echo "📋 Deployment Options:"
echo "1. Netlify: Drag the backup-site folder to netlify.com"
echo "2. Vercel: Run 'vercel' in the backup-site folder"
echo "3. GitHub Pages: Push to a separate repository"
echo "4. Surge: Run 'surge' in the backup-site folder"
echo ""
echo "🔗 Your backup site will be available at the deployed URL"
echo "📱 Update the MAIN_SITE_URL variable above with your actual main site URL" 