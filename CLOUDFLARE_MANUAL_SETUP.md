# 🚀 Cloudflare Reverse Proxy Setup Guide

## Overview
This setup creates a smart reverse proxy that:
- **Social crawlers** → Get custom SEO from Supabase Edge Function
- **Regular users** → Get full functionality from Vercel

## Method 1: Cloudflare Dashboard (Easiest)

### 1. Create Cloudflare Worker
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages**
3. Click **Create a Worker**
4. Name it: `seo-router`
5. Copy the code from `cloudflare-worker-simple.js`
6. Click **Save and Deploy**

### 2. Configure Custom Domain
1. In your worker, go to **Settings** → **Triggers**
2. Click **Add Custom Domain**
3. Add: `shop.ghlmax.com`
4. Save

### 3. Update DNS
1. Go to **DNS** → **Records**
2. Change `shop.ghlmax.com` from:
   ```
   Type: CNAME
   Name: shop.ghlmax.com
   Target: cname.vercel-dns.com
   ```
3. To:
   ```
   Type: CNAME
   Name: shop.ghlmax.com
   Target: [Your Cloudflare Worker Domain]
   ```

## Method 2: Command Line (Advanced)

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Deploy Worker
```bash
wrangler deploy cloudflare-worker-simple.js --name seo-router
```

### 4. Add Route
```bash
wrangler route add "shop.ghlmax.com/*" seo-router
```

## Testing

### Test Social Crawler (Should get custom SEO):
```bash
curl -H "User-Agent: facebookexternalhit/1.1" "https://shop.ghlmax.com/" | grep "og:title"
```

### Test Regular User (Should get full app):
```bash
curl "https://shop.ghlmax.com/" | grep "Loading"
```

## Expected Results

✅ **Social Crawler Response:**
```html
<meta property="og:title" content="BD Ecommerce" />
<meta property="og:description" content="Create and grow your online business with BD Ecommerce..." />
```

✅ **Regular User Response:**
```html
<title>Loading...</title>
<meta property="og:title" content="Loading..." />
```

## Troubleshooting

### If social crawlers still get generic SEO:
1. Check Cloudflare Worker logs
2. Verify DNS is pointing to Cloudflare
3. Test Supabase Edge Function directly

### If regular users can't access site:
1. Check Vercel URL in worker code
2. Verify Cloudflare is proxying correctly
3. Check Cloudflare Worker logs

## Benefits

🎯 **Perfect SEO**: Social crawlers get custom meta tags
🚀 **Full Functionality**: Users get complete React app
🔄 **Automatic**: No manual intervention needed
📈 **Scalable**: Works for all custom domains
⚡ **Fast**: Cloudflare's global CDN
