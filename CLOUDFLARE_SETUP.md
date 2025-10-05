# Cloudflare Worker Configuration
# This file contains the configuration for deploying the SEO routing worker

## Worker Details
- **Name**: seo-router
- **Route**: shop.ghlmax.com/*
- **Environment**: Production

## Deployment Instructions

### 1. Deploy Worker to Cloudflare
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy the worker
wrangler deploy cloudflare-worker.js --name seo-router
```

### 2. Configure Custom Domain
```bash
# Add custom domain to worker
wrangler route add "shop.ghlmax.com/*" seo-router
```

### 3. Update DNS Records
Change DNS from:
```
shop.ghlmax.com → cname.vercel-dns.com
```

To:
```
shop.ghlmax.com → CNAME → [Your Cloudflare Worker Domain]
```

## How It Works

1. **Social Crawlers** (Facebook, Twitter, etc.):
   - Detected by user agent
   - Routed to Supabase Edge Function
   - Get custom SEO meta tags

2. **Regular Users**:
   - Routed to Vercel
   - Get full React application
   - Full functionality maintained

## Benefits

✅ **Social crawlers get custom SEO**
✅ **Users keep full functionality**
✅ **No DNS changes needed for users**
✅ **Works for all custom domains**
✅ **Automatic user agent detection**
✅ **Fallback to Vercel if SEO fails**
