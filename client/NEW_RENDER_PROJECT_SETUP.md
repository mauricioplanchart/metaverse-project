# 🚀 New Render Project Setup Guide

## 📋 **What You Have Ready**

✅ **Client Application** - React + Vite + Socket.IO client  
✅ **Server Application** - Node.js + Socket.IO server  
✅ **Environment Configuration** - Ready for production  
✅ **Build System** - Working and tested  
✅ **Deployment Scripts** - Automated deployment ready  

## 🎯 **Step-by-Step Setup**

### **Step 1: Create New Render Project**

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - **Name**: `your-new-metaverse-app`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid if needed)

### **Step 2: Configure Environment Variables**

In your Render project settings, add these environment variables:

```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=your_postgresql_url (optional)
SUPABASE_URL=https://jnvbqcaweufmfswpnacv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpudmJxY2F3ZXVmbWZzd3BuYWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0ODk0MDMsImV4cCI6MjA2NzA2NTQwM30.8ayePMQr6ISfYWqkrjHDY7d1CKroVOQONCl6Ge2ApE4
```

### **Step 3: Deploy Server**

1. **Deploy the server** - Render will automatically build and deploy
2. **Get your URL** - e.g., `https://your-new-app.onrender.com`
3. **Test the server** - Visit the URL to see if it's running

### **Step 4: Update Client Configuration**

Once you have your Render URL, update the client:

```bash
# Update environment file
echo "VITE_SERVER_URL=https://your-actual-app.onrender.com" > .env.local

# Test the build
npm run build

# Start development server
npm run dev
```

### **Step 5: Deploy Client**

Deploy the client to Netlify, Vercel, or another platform:

**Netlify:**
- Connect your GitHub repo
- Set build command: `npm run build`
- Set publish directory: `dist`
- Deploy

**Vercel:**
- Connect your GitHub repo
- Set framework preset: `Vite`
- Deploy

## 🔧 **Testing Your Setup**

### **Test Server Connection**
```bash
# Test server health
curl https://your-app.onrender.com/health

# Test Socket.IO connection
open http://localhost:5173/test-socket-connection.html
```

### **Test Client Build**
```bash
# Build the client
npm run build

# Test locally
npm run dev
```

## 📁 **Project Structure**

```
metaverse-project/
├── client/                 # Your React app
│   ├── src/
│   ├── package.json
│   └── .env.local
├── server/                 # Your Node.js server
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Port Conflicts**: Use the cleanup script
   ```bash
   ./clear-cache-and-rebuild.sh
   ```

2. **Build Errors**: Check dependencies
   ```bash
   npm install
   npm run build
   ```

3. **Connection Issues**: Test with the test pages
   ```bash
   open http://localhost:5173/test-render-setup.html
   ```

## 🎉 **Success Checklist**

- [ ] Server deployed to Render
- [ ] Server URL obtained
- [ ] Client environment updated
- [ ] Client builds successfully
- [ ] Client deployed to hosting platform
- [ ] Connection tested and working
- [ ] Multiplayer features working

## 📞 **Support**

If you encounter issues:
1. Check the test pages in your client
2. Review Render deployment logs
3. Test locally first
4. Use the cleanup scripts if needed

---

**Ready to deploy! 🚀** 