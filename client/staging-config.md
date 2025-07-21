# Staging Site Setup Guide

## 🎯 What is Staging?
- **Testing environment** for new features
- **Safe to break** - won't affect your main site
- **Mirror of production** - same code, different URL
- **Pre-deployment testing** - catch issues before they go live

## 🚀 How to Deploy Staging Site

### Option 1: Netlify (Recommended)
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Connect your GitHub repository
4. Set build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Branch:** `staging` (not main!)
5. Deploy!

### Option 2: Alternative Platforms
If you need to switch from Netlify, consider:
- **Vercel**: Similar to Netlify, good for React apps
- **Render**: Good for static sites

## 🔄 Workflow

### Development Process:
```bash
# 1. Work on staging branch
git checkout staging

# 2. Make your changes
# 3. Test locally
npm run dev

# 4. Commit and push to staging
git add .
git commit -m "New feature: 3D objects"
git push origin staging
# Staging site auto-updates!

# 5. Test on staging site
# 6. If everything works, merge to main
git checkout main
git merge staging
git push origin main
# Main site updates!
```

### Testing Checklist:
- ✅ Site loads without errors
- ✅ 3D scene renders correctly
- ✅ All features work as expected
- ✅ Mobile responsive
- ✅ Performance is good

## 🛡️ Safety Benefits

### Before Staging:
```
Feature → Main Site → Users see bugs 😱
```

### With Staging:
```
Feature → Staging Site → Test → Main Site → Users see working features! ✅
```

## 📊 URLs Structure
- **Production:** `https://your-main-site.netlify.app`
- **Staging:** `https://your-staging-site.netlify.app`
- **Local:** `http://localhost:5173`

## 🎯 Next Steps
1. Deploy staging site to Netlify
2. Test your current features on staging
3. Use staging for all new development
4. Only merge to main when staging is perfect

## 🚨 Emergency Rollback
If staging breaks:
```bash
# Just work on main branch directly
git checkout main
# Staging stays broken, main stays safe
``` 