# 🚀 Deployment Checklist

## Pre-Deployment
- [ ] Code is committed to GitHub
- [ ] All tests pass locally
- [ ] Builds work locally (`npm run build`)
- [ ] Environment variables are ready

## Backend Deployment (Render)
- [ ] Create Render account
- [ ] Connect GitHub repository
- [ ] Create new Web Service
- [ ] Configure build settings:
  - [ ] Build Command: `cd server && npm install && npm run build`
  - [ ] Start Command: `cd server && npm start`
  - [ ] Environment: Node.js
- [ ] Set environment variables:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=10000`
  - [x] `CORS_ORIGIN=*` (No longer needed - Supabase handles CORS automatically)
- [ ] Deploy and wait for success
- [ ] Test health endpoint: `https://your-backend.onrender.com/health`
- [ ] Note the backend URL for frontend configuration

## Frontend Deployment (Netlify)
- [ ] Create Netlify account
- [ ] Connect GitHub repository
- [ ] Create new site from Git
- [ ] Configure build settings:
  - [ ] Build Command: `npm run build`
  - [ ] Publish Directory: `dist`
- [ ] Set environment variables:
  - [ ] `VITE_SERVER_URL=https://your-backend.onrender.com`
  - [ ] `VITE_APP_NAME=Metaverse`
  - [ ] `VITE_APP_VERSION=2.0.0`
  - [ ] `NODE_ENV=production`
  - [ ] `VITE_ENVIRONMENT=production`
- [ ] Deploy and wait for success
- [ ] Test the frontend application

## Post-Deployment Testing
- [ ] Backend health check passes
- [ ] Frontend loads without errors
- [ ] Socket.IO connection works
- [ ] 3D scene renders correctly
- [ ] User interactions work
- [ ] Chat functionality works
- [ ] Avatar movement works

## Monitoring Setup
- [ ] Set up Render monitoring
- [ ] Set up Netlify monitoring
- [ ] Configure alerts for downtime
- [ ] Test the deployment status checker

## Optional Enhancements
- [ ] Add custom domain
- [ ] Set up SSL certificate
- [ ] Configure CDN
- [ ] Set up CI/CD pipeline
- [ ] Add analytics
- [ ] Set up error tracking

## Documentation
- [ ] Update README with deployment URLs
- [ ] Document environment variables
- [ ] Create troubleshooting guide
- [ ] Set up support channels

---

**Status**: ⏳ Ready to deploy
**Last Updated**: $(date)
**Next Action**: Start backend deployment on Render 