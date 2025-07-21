# 🚀 Render Deployment Guide

## ✅ **Current Status**
- ✅ **Server Code**: Available in `server/` directory
- ✅ **Socket.IO**: Configured and ready
- ✅ **Client**: Ready to connect to Socket.IO server
- ✅ **Render Config**: Created `render.yaml`

## 🎯 **Render Deployment Settings**

### **Option 1: Using render.yaml (Recommended)**
1. **Push the `render.yaml` file to your repository**
2. **Go to [Render Dashboard](https://dashboard.render.com)**
3. **Create New Web Service**
4. **Connect your GitHub repository**
5. **Render will automatically detect the `render.yaml` configuration**

### **Option 2: Manual Configuration**
If you prefer manual setup:

**Service Settings:**
- **Name**: `metaverse-server`
- **Environment**: `Node`
- **Region**: `Oregon (US West)` (or your preferred region)
- **Branch**: `main`
- **Root Directory**: `server`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Environment Variables:**
- `NODE_ENV`: `production`
- `PORT`: `10000`

## 🔧 **Pre-Deployment Checklist**

### **1. Test Server Locally**
```bash
cd server
npm install
npm run build
npm start
```

### **2. Test Client Connection**
```bash
cd client
npm run dev
# Open http://localhost:5173
# Check console for connection logs
```

### **3. Update Client Environment**
Once deployed, update your client's environment:
```bash
# In client directory
echo "VITE_SERVER_URL=https://your-app-name.onrender.com" > .env.local
```

## 🚀 **Deployment Steps**

1. **Commit and push your changes:**
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Deploy on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Create new Web Service
   - Connect your repository
   - Deploy

3. **Get your server URL:**
   - Render will provide a URL like: `https://your-app-name.onrender.com`

4. **Update client environment:**
   ```bash
   cd client
   echo "VITE_SERVER_URL=https://your-app-name.onrender.com" > .env.local
   ```

5. **Deploy client:**
   - Deploy the client to Netlify, Vercel, or your preferred platform

## 🔍 **Troubleshooting**

### **If Render can't find server directory:**
- Ensure `render.yaml` is in the repository root
- Check that the `server/` directory exists
- Verify `server/package.json` exists

### **If build fails:**
- Check that all dependencies are in `server/package.json`
- Ensure TypeScript is properly configured
- Check the build logs in Render dashboard

### **If connection fails:**
- Verify the server URL in client environment
- Check CORS settings in server
- Ensure Socket.IO is properly configured

## 📋 **Current Configuration**

### **Server (server/package.json):**
- ✅ Socket.IO: `^4.7.4`
- ✅ Express: `^4.18.2`
- ✅ TypeScript: `^5.2.2`
- ✅ Build script: `tsc`
- ✅ Start script: `node dist/index.js`

### **Client (client/package.json):**
- ✅ Socket.IO Client: `^4.7.4`
- ✅ React + Vite
- ✅ Environment: Ready for Socket.IO server URL

## 🎉 **Success Indicators**

After deployment, you should see:
- ✅ Server running on Render
- ✅ Client connecting to Socket.IO server
- ✅ Real-time multiplayer functionality working
- ✅ No more connection errors in browser console 