# Netlify Setup Guide

## Environment Variables

To fix the stuck loading issue on Netlify, you need to set the following environment variable:

### Required Environment Variable

**Variable Name:** `VITE_SERVER_URL`  
**Value:** `https://metaverse-project-1.onrender.com`

### How to Set Environment Variables in Netlify

1. **Go to your Netlify dashboard**
2. **Select your site** (metaverse-project-1)
3. **Go to Site settings** → **Environment variables**
4. **Add the variable:**
   - Key: `VITE_SERVER_URL`
   - Value: `https://metaverse-project-1.onrender.com`
5. **Save and redeploy**

### Alternative: Set via Netlify CLI

```bash
# Install Netlify CLI if you haven't
npm install -g netlify-cli

# Login to Netlify
netlify login

# Set environment variable
netlify env:set VITE_SERVER_URL https://metaverse-project-1.onrender.com

# Trigger a new deployment
netlify deploy --prod
```

### Verification

After setting the environment variable:

1. **Wait for Netlify to redeploy** (usually 2-5 minutes)
2. **Visit your Netlify site:** https://metaverse-project-1.netlify.app
3. **Open browser console** (F12) and look for:
   - `🔧 Config debug:` showing `PROD: true`
   - `🌐 Production: Using environment URL: https://metaverse-project-1.onrender.com`
   - `🔌 SocketService connecting to: https://metaverse-project-1.onrender.com`

### Test Pages

- **Local test:** http://localhost:5173/test-local.html
- **Production test:** https://metaverse-project-1.netlify.app/test-production.html

### Troubleshooting

If the issue persists:

1. **Clear browser cache** completely
2. **Hard refresh** the page (Ctrl+Shift+R)
3. **Check Netlify deployment logs** for any build errors
4. **Verify the environment variable** is set correctly
5. **Wait for the deployment to complete** (check Netlify dashboard)

### Current Status

- ✅ **Localhost working** - WebSocket connection successful
- ✅ **Backend healthy** - Production server responding
- ⏳ **Netlify needs environment variable** - Set `VITE_SERVER_URL` 