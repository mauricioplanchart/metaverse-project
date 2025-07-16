#!/bin/bash

echo "🚀 Setting up GitHub Repository for Render Deployment"
echo "====================================================="
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "📥 Install it from: https://cli.github.com/"
    echo ""
    echo "🔧 Manual Setup Instructions:"
    echo "1. Go to https://github.com/new"
    echo "2. Create repository named 'metaverse-server'"
    echo "3. Run: git remote set-url origin https://github.com/YOUR_USERNAME/metaverse-server.git"
    echo "4. Run: git push -u origin main"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "🔐 Please authenticate with GitHub first:"
    echo "   gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

# Create the repository
echo "📦 Creating GitHub repository 'metaverse-server'..."
gh repo create metaverse-server --public --source=. --remote=origin --push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Repository created and code pushed successfully!"
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Go to https://dashboard.render.com"
    echo "2. Click 'New +' → 'Web Service'"
    echo "3. Connect to your GitHub repository: metaverse-server"
    echo "4. Set these settings:"
    echo "   • Name: metaverse-project-2"
    echo "   • Build Command: npm install && npm run build"
    echo "   • Start Command: npm start"
    echo "   • Environment: Node"
    echo ""
    echo "5. Click 'Create Web Service'"
    echo "6. Wait for deployment to complete"
    echo "7. Test your Netlify app: https://mverse91.netlify.app"
else
    echo "❌ Failed to create repository. Please try manually:"
    echo "1. Go to https://github.com/new"
    echo "2. Create repository named 'metaverse-server'"
    echo "3. Run: git remote set-url origin https://github.com/YOUR_USERNAME/metaverse-server.git"
    echo "4. Run: git push -u origin main"
fi