# Cloudflare Pages Deployment - Complete Setup Guide

## 🚨 IMPORTANT: Cloudflare Pages Project Configuration

The deployment failures are likely due to incorrect Cloudflare Pages project configuration. Follow these steps exactly:

### 1. **Delete Existing Cloudflare Pages Project**
If you already created a Cloudflare Pages project, delete it and start fresh:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** → **Projects**
3. Find your project and click **Settings** → **Delete Project**
4. Confirm deletion

### 2. **Create New Cloudflare Pages Project**
1. In Cloudflare Dashboard, go to **Pages** → **Create a project**
2. Click **Connect to Git**
3. Select **GitHub** and authorize Cloudflare
4. Choose repository: `schalder/ecombuildr_CloudFlare_v1.0`
5. Click **Begin setup**

### 3. **Configure Build Settings**
Set these exact values:

- **Project name**: `ecombuildr`
- **Production branch**: `main`
- **Framework preset**: `Vite`
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (leave empty)

### 4. **Set Environment Variables**
In the **Environment Variables** section, add these variables:

#### Required Variables:
```
VITE_SUPABASE_URL=https://fhqwacmokbtbspkxjixf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM
SUPABASE_URL=https://fhqwacmokbtbspkxjixf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM
VITE_APP_URL=https://ecombuildr.pages.dev
VITE_STOREFRONT_RENDERER_DEFAULT=true
NODE_ENV=production
```

#### Optional Payment Variables (if using):
```
VITE_EPS_MERCHANT_ID=your_eps_merchant_id
VITE_EPS_SECRET_KEY=your_eps_secret_key
VITE_EBPAY_MERCHANT_ID=your_ebpay_merchant_id
VITE_EBPAY_SECRET_KEY=your_ebpay_secret_key
```

### 5. **Deploy**
1. Click **Save and Deploy**
2. Wait for the build to complete
3. Check the deployment logs for any errors

## 🔧 Troubleshooting Common Issues

### Issue 1: Still Deploying Old Commits
**Problem**: Cloudflare Pages keeps deploying old commits instead of latest
**Solution**: 
1. Delete the existing project completely
2. Create a new project from scratch
3. Ensure you're connecting to the correct repository

### Issue 2: Package Manager Conflicts
**Problem**: Bun vs npm conflicts
**Solution**: 
- ✅ Removed `bun.lock` file
- ✅ Using only `package-lock.json`
- ✅ Cloudflare Pages will use npm consistently

### Issue 3: Missing Dependencies
**Problem**: `@vitejs/plugin-react-swc` not found
**Solution**:
- ✅ Regenerated `package-lock.json` with all dependencies
- ✅ Verified build works locally
- ✅ All dependencies are properly included

### Issue 4: Build Configuration
**Problem**: Wrong build settings
**Solution**:
- ✅ Framework preset: `Vite`
- ✅ Build command: `npm run build`
- ✅ Output directory: `dist`
- ✅ Root directory: `/`

## 📋 Current Repository State

### ✅ Files Ready for Deployment:
- `wrangler.toml` - Cloudflare Pages configuration
- `functions/_middleware.ts` - SEO middleware (Cloudflare Worker)
- `public/_headers` - HTTP headers configuration
- `public/_redirects` - URL redirects and SPA routing
- `package.json` - Updated with Cloudflare scripts
- `package-lock.json` - Complete dependencies
- `.gitignore` - Cloudflare-specific patterns

### ✅ Removed Files:
- `bun.lock` - Removed to prevent conflicts
- `vercel.json` - No longer needed

### ✅ Verified Working:
- Local build: `npm run build` ✅
- All dependencies installed ✅
- SEO middleware converted ✅
- Configuration files created ✅

## 🚀 Expected Deployment Process

Once configured correctly, the deployment should show:

1. ✅ **Cloning repository** (latest commit)
2. ✅ **Installing dependencies**: `npm clean-install --progress=false` (success)
3. ✅ **Building application**: `npm run build` (success)
4. ✅ **Deploying to Cloudflare Pages** (success)

## 📞 If Deployment Still Fails

If you're still seeing issues after following this guide:

1. **Check the exact error message** in Cloudflare Pages logs
2. **Verify the commit hash** being deployed matches the latest commit
3. **Ensure environment variables** are set correctly
4. **Try manual deployment** using Wrangler CLI:

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy manually
npm run build
wrangler pages deploy dist --project-name ecombuildr
```

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ Application loads at `https://ecombuildr.pages.dev`
- ✅ SEO middleware works (test with social crawler user agent)
- ✅ All functionality works as expected

## 📚 Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/platform/functions/)

---

**The application is now fully ready for Cloudflare Pages deployment!** 🎉

Follow the setup guide above to create a new Cloudflare Pages project with the correct configuration.
