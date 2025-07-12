# 🚀 Metaverse Deployment Guide

## Quick Deploy Options

### Option 1: Vercel (Recommended - Free & Easy)

#### Prerequisites:
- GitHub account
- Vercel account (free at vercel.com)

#### Steps:

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/metaverse-project.git
   git push -u origin main
   ```

2. **Deploy Client:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Set root directory to `client`
   - Deploy

3. **Deploy Server:**
   - Create another Vercel project
   - Set root directory to `server`
   - Add environment variable: `NODE_ENV=production`
   - Deploy

4. **Connect Client to Server:**
   - In client project settings, add environment variable:
     - `VITE_SERVER_URL=https://your-server-url.vercel.app`

### Option 2: Netlify (Client Only)

1. **Build the client:**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy:**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `client/dist` folder
   - Set environment variables in site settings

### Option 3: Railway (Full Stack)

1. **Deploy to Railway:**
   - Go to [railway.app](https://railway.app)
   - Connect GitHub repository
   - Deploy both client and server services

## Environment Variables

### Client (.env.production):
```
VITE_SERVER_URL=https://your-server-url.vercel.app
VITE_APP_NAME=Metaverse
VITE_APP_VERSION=1.0.0
```

### Server:
```
NODE_ENV=production
PORT=3001
```

## Build Commands

### Client:
```bash
cd client
npm install
npm run build
```

### Server:
```bash
cd server
npm install
npm run build
npm start
```

## Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Ensure server allows your client domain
   - Check environment variables

2. **Socket Connection Failed:**
   - Verify server URL in client config
   - Check server is running and accessible

3. **Build Errors:**
   - Clear node_modules and reinstall
   - Check TypeScript errors

## Performance Optimization

1. **Client:**
   - Enable gzip compression
   - Use CDN for static assets
   - Optimize images

2. **Server:**
   - Enable caching
   - Use connection pooling
   - Monitor memory usage

## Security Checklist

- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Environment variables set
- [ ] No sensitive data in client code
- [ ] Rate limiting enabled
- [ ] Input validation

## Monitoring

- Set up error tracking (Sentry)
- Monitor server performance
- Track user analytics
- Set up uptime monitoring

## Support

For deployment issues, check:
1. Build logs
2. Environment variables
3. Network connectivity
4. Server logs 