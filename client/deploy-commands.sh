#!/bin/bash

echo "🚀 Render Deployment Commands"
echo "=============================="

echo ""
echo "1. Clean up processes:"
echo "pkill -f 'vite' 2>/dev/null || true"
echo "pkill -f 'npm run dev' 2>/dev/null || true"

echo ""
echo "2. Test client build:"
echo "npm run build"

echo ""
echo "3. Test server build:"
echo "cd ../server && npm run build"

echo ""
echo "4. Start development server:"
echo "npm run dev"

echo ""
echo "5. Test connection:"
echo "Open http://localhost:5173/test-render-setup.html"

echo ""
echo "6. Deploy to Render:"
echo "- Go to https://dashboard.render.com"
echo "- Create new Web Service"
echo "- Set root directory: server"
echo "- Set build command: npm install && npm run build"
echo "- Set start command: npm start"

echo ""
echo "7. Update environment after deployment:"
echo "echo 'VITE_SERVER_URL=https://your-app.onrender.com' > .env.local"

echo ""
echo "✅ Ready for Render deployment!" 