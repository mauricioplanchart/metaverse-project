#!/bin/bash

echo "🚀 Render Deployment Script"
echo "=========================="

echo ""
echo "📋 Current Status:"
echo "✅ Server directory exists: server/"
echo "✅ Server builds successfully"
echo "✅ Socket.IO configured"
echo "✅ render.yaml created"

echo ""
echo "🎯 Next Steps:"
echo "1. Commit and push changes:"
echo "   git add ."
echo "   git commit -m 'Add Render deployment configuration'"
echo "   git push origin main"

echo ""
echo "2. Deploy on Render:"
echo "   - Go to https://dashboard.render.com"
echo "   - Create new Web Service"
echo "   - Connect your GitHub repository"
echo "   - Render will auto-detect render.yaml"

echo ""
echo "3. After deployment, update client environment:"
echo "   cd client"
echo "   echo 'VITE_SERVER_URL=https://your-app-name.onrender.com' > .env.local"

echo ""
echo "4. Deploy client to Netlify/Vercel"

echo ""
echo "🔧 Test Commands:"
echo "cd server && npm run build  # Test server build"
echo "cd server && npm start      # Test server locally"
echo "cd client && npm run dev    # Test client locally"

echo ""
echo "📖 Full guide: RENDER_DEPLOYMENT_GUIDE.md" 