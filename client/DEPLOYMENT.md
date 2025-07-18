# Metaverse Project Deployment Guide

This guide will help you deploy your metaverse project to both Netlify (frontend) and Render (backend).

## 🏗️ Architecture Overview

- **Frontend (Client)**: React + Vite + Babylon.js → Deployed on Netlify
- **Backend (Server)**: Node.js + Express + Socket.IO → Deployed on Render

## 📋 Prerequisites

1. **GitHub Account**: Your code should be in a GitHub repository
2. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
3. **Render Account**: Sign up at [render.com](https://render.com)
4. **Node.js**: Version 18+ installed locally

## 🚀 Quick Deployment

### Option 1: Automated Scripts

```bash
# Make scripts executable
chmod +x deploy-netlify.sh deploy-render.sh

# Deploy backend to Render
./deploy-render.sh

# Deploy frontend to Netlify
./deploy-netlify.sh
```

### Option 2: Manual Deployment

## 🌐 Backend Deployment (Render)

### Step 1: Connect GitHub Repository

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository containing your metaverse project

### Step 2: Configure Backend Service

**Service Settings:**
- **Name**: `metaverse-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (root of repo)
- **Build Command**: `cd server && npm install && npm run build`
- **Start Command**: `cd server && npm start`

**Environment Variables:**
```
NODE_ENV=production
PORT=10000
# CORS_ORIGIN=* (No longer needed - Supabase handles CORS automatically)
```

### Step 3: Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy your backend
3. Note the generated URL (e.g., `https://metaverse-backend.onrender.com`)

## 🎨 Frontend Deployment (Netlify)

### Step 1: Connect GitHub Repository

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "New site from Git"
3. Connect your GitHub repository
4. Select the repository containing your metaverse project

### Step 2: Configure Build Settings

**Build Settings:**
- **Base directory**: Leave empty
- **Build command**: `npm run build`
- **Publish directory**: `dist`

**Environment Variables:**
```
VITE_SERVER_URL=https://metaverse-backend.onrender.com
VITE_APP_NAME=Metaverse
VITE_APP_VERSION=2.0.0
NODE_ENV=production
VITE_ENVIRONMENT=production
```

### Step 3: Deploy

1. Click "Deploy site"
2. Netlify will automatically build and deploy your frontend
3. Your site will be available at a generated URL

## 🔧 Configuration Files

### netlify.toml
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  VITE_SERVER_URL = "https://metaverse-backend.onrender.com"
  VITE_APP_NAME = "Metaverse"
  VITE_APP_VERSION = "2.0.0"
  NODE_ENV = "production"
  VITE_ENVIRONMENT = "production"
```

### render.yaml
```yaml
services:
  - type: web
    name: metaverse-backend
    env: node
    plan: free
    buildCommand: cd server && npm install && npm run build
    startCommand: cd server && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      # - key: CORS_ORIGIN (No longer needed - Supabase handles CORS automatically)
        value: "*"
    healthCheckPath: /
    autoDeploy: true
```

## 🔍 Testing Your Deployment

### Backend Health Check
```bash
curl https://metaverse-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```

### Frontend Connection Test
1. Open your Netlify URL
2. Check the browser console for connection status
3. Verify Socket.IO connection to backend

## 🛠️ Troubleshooting

### Common Issues

**Backend Issues:**
- **Build fails**: Check `server/package.json` dependencies
- **Port issues**: Ensure PORT environment variable is set
- **CORS errors**: No longer applicable - Supabase handles CORS automatically

**Frontend Issues:**
- **Build fails**: Check `package.json` dependencies
- **Connection errors**: Verify VITE_SERVER_URL points to correct backend
- **404 errors**: Ensure Netlify redirects are configured

### Debug Commands

```bash
# Test backend locally
cd server && npm run dev

# Test frontend locally
npm run dev

# Check build output
npm run build && ls -la dist/
```

## 🔄 Continuous Deployment

Both Netlify and Render support automatic deployments:

1. **Push to main branch** → Automatic deployment
2. **Pull requests** → Preview deployments
3. **Environment-specific** → Staging/production separation

## 📊 Monitoring

### Render Monitoring
- View logs in Render dashboard
- Set up alerts for downtime
- Monitor resource usage

### Netlify Monitoring
- View build logs in Netlify dashboard
- Set up form submissions
- Monitor performance

## 🔐 Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **CORS**: Configure appropriate origins for production
3. **HTTPS**: Both platforms provide SSL certificates
4. **Rate Limiting**: Consider implementing API rate limits

## 📈 Scaling

### Render Scaling
- Upgrade to paid plan for more resources
- Add multiple instances
- Use custom domains

### Netlify Scaling
- Upgrade to paid plan for more features
- Use edge functions
- Implement CDN optimization

## 🎯 Next Steps

1. **Custom Domain**: Set up your own domain
2. **SSL Certificate**: Verify HTTPS is working
3. **Monitoring**: Set up uptime monitoring
4. **Backup**: Implement database backups
5. **CI/CD**: Set up GitHub Actions for automated testing

## 📞 Support

- **Render Support**: [docs.render.com](https://docs.render.com)
- **Netlify Support**: [docs.netlify.com](https://docs.netlify.com)
- **Project Issues**: Check GitHub repository issues

---

**Happy Deploying! 🚀** 