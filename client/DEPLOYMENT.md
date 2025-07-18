# 🚀 Deployment Guide - Supabase Metaverse

This guide will help you deploy your metaverse application using Supabase for backend services and Netlify for frontend hosting.

## Prerequisites

1. **GitHub Account**: Your code must be in a GitHub repository
2. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
3. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)

## Architecture Overview

- **Frontend**: React + Vite + Babylon.js → Deployed on Netlify
- **Backend**: Supabase (Database, Auth, Real-time) → Managed by Supabase
- **Real-time**: Supabase Realtime → No separate server needed

## Step 1: Supabase Setup

### 1. Create Supabase Project
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `metaverse-project`
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users
5. Click "Create new project"

### 2. Configure Database
1. Go to SQL Editor in your Supabase dashboard
2. Run the following SQL to create necessary tables:

```sql
-- Create users table for avatars
CREATE TABLE IF NOT EXISTS avatars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  username TEXT NOT NULL,
  position JSONB DEFAULT '{"x": 0, "y": 0, "z": 0}',
  rotation JSONB DEFAULT '{"x": 0, "y": 0, "z": 0}',
  appearance JSONB DEFAULT '{}',
  world_id TEXT DEFAULT 'main-world',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  world_id TEXT DEFAULT 'main-world',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all avatars" ON avatars FOR SELECT USING (true);
CREATE POLICY "Users can update their own avatar" ON avatars FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own avatar" ON avatars FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all chat messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Users can insert their own messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 3. Get API Keys
1. Go to Settings → API in your Supabase dashboard
2. Copy the following values:
   - Project URL
   - Anon (public) key

## Step 2: Frontend Deployment (Netlify)

### 1. Connect Repository
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "New site from Git"
3. Choose GitHub and select your repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

### 2. Set Environment Variables
In Netlify dashboard, go to Site settings → Environment variables and add:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_NAME=Metaverse
VITE_APP_VERSION=2.0.0
VITE_ENVIRONMENT=production
```

### 3. Deploy
1. Click "Deploy site"
2. Wait for build to complete
3. Note your site URL (e.g., `https://your-site.netlify.app`)

## Step 3: Configure CORS

### 1. Supabase CORS Settings
1. Go to Supabase Dashboard → Settings → API
2. Add your Netlify domain to "Additional allowed origins":
   - `https://your-site.netlify.app`
   - `http://localhost:5173` (for development)

## Step 4: Testing

### 1. Health Check
Visit your deployed site and check:
- [ ] Site loads without errors
- [ ] Supabase connection works
- [ ] Real-time features function
- [ ] Avatar movement works
- [ ] Chat system works

### 2. Performance Check
Run Lighthouse audit:
- [ ] Performance score > 80
- [ ] Accessibility score > 90
- [ ] Best practices score > 90
- [ ] SEO score > 90

## Troubleshooting

### Common Issues

#### 1. CORS Errors
**Problem**: Browser blocks requests to Supabase
**Solution**: 
- Verify CORS settings in Supabase dashboard
- Check that your domain is in allowed origins

#### 2. Environment Variables
**Problem**: App can't connect to Supabase
**Solution**:
- Verify environment variables are set in Netlify
- Check that values match your Supabase project

#### 3. Build Errors
**Problem**: Netlify build fails
**Solution**:
- Check build logs in Netlify dashboard
- Ensure all dependencies are in package.json
- Verify TypeScript errors are resolved

#### 4. Real-time Issues
**Problem**: Real-time features don't work
**Solution**:
- Verify Supabase Realtime is enabled
- Check database policies allow necessary operations
- Ensure client is properly subscribed to channels

## Monitoring

### 1. Netlify Analytics
- Monitor site performance
- Track user engagement
- Check for errors

### 2. Supabase Dashboard
- Monitor database performance
- Check real-time connections
- Review API usage

### 3. Error Tracking
Consider adding error tracking:
- Sentry for error monitoring
- LogRocket for session replay
- Google Analytics for user behavior

## Security Best Practices

### 1. Environment Variables
- Never commit API keys to Git
- Use Netlify's environment variable system
- Rotate keys regularly

### 2. Database Security
- Use Row Level Security (RLS) policies
- Limit API access with proper policies
- Monitor for suspicious activity

### 3. CORS Configuration
- Only allow necessary domains
- Avoid using wildcards in production
- Regularly review allowed origins

## Cost Optimization

### 1. Supabase Pricing
- Free tier: 500MB database, 2GB bandwidth
- Pro tier: $25/month for more resources
- Monitor usage in Supabase dashboard

### 2. Netlify Pricing
- Free tier: 100GB bandwidth, 300 build minutes
- Pro tier: $19/month for more features
- Monitor usage in Netlify dashboard

## Support Resources

- **Supabase Docs**: [docs.supabase.com](https://docs.supabase.com)
- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)
- **Supabase Support**: [supabase.com/support](https://supabase.com/support)
- **Netlify Support**: [netlify.com/support](https://netlify.com/support)

---

**Status**: ✅ Ready for deployment
**Last Updated**: $(date)
**Next Action**: Start with Supabase setup 