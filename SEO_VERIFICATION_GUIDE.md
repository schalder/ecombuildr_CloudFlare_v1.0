# SEO Verification Guide

This guide will help you verify that the SEO Edge Function is working correctly after deployment.

## Architecture Overview

**New Setup (Single Vercel Edge Function):**
```
Request → Vercel → api/render.ts → Detects Bot → Queries Supabase → Returns SEO HTML
                                  → Regular User → Returns SPA (index.html)
```

**What was changed:**
- ✅ Created `api/render.ts` - Single Edge Function that handles everything
- ✅ Updated `vercel.json` - Routes now point to `/api/render`
- ✅ Deleted `api/seo.ts` - Old proxy function (no longer needed)
- ✅ Deleted `supabase/functions/seo-render/` - Unused Supabase Edge Function
- ✅ Updated `supabase/config.toml` - Removed seo-render function config

---

## Pre-Deployment Checklist

Before testing, ensure:
- [ ] Code is committed and pushed to GitHub
- [ ] Vercel has automatically deployed the latest changes
- [ ] You have your Vercel preview URL ready

---

## Testing Steps

### Step 1: Health Check
**Purpose:** Verify the Edge Function is deployed and running

```bash
curl -i https://your-preview-url.vercel.app/api/seo-health
```

**Expected Response:**
```
HTTP/2 200
content-type: application/json
cache-control: no-cache

{"ok":true,"timestamp":"2025-01-XX...","service":"seo-render"}
```

✅ **Pass Criteria:** 200 status + JSON with `ok: true`
❌ **Fail:** 404 or 500 means Edge Function not deployed

---

### Step 2: Force SEO Mode (Query Parameter)
**Purpose:** Test SEO rendering without changing user agent

```bash
curl -i "https://your-preview-url.vercel.app/?seo=1"
```

**Expected Response:**
```
HTTP/2 200
content-type: text/html; charset=utf-8
x-seo-rendered: true
x-bot-detected: true

<!DOCTYPE html>
<html lang="en">
<head>
  <title>Welcome to...</title>
  <meta property="og:title" content="...">
  <meta property="og:image" content="...">
  ...
</head>
...
```

✅ **Pass Criteria:**
- 200 status
- `Content-Type: text/html`
- `X-SEO-Rendered: true` header present
- HTML contains `<meta property="og:title">` tags

❌ **Fail:** 206 status or missing meta tags

---

### Step 3: Force SEO Mode (Header)
**Purpose:** Alternative test endpoint

```bash
curl -i -H "x-seo-test: 1" https://your-preview-url.vercel.app/
```

**Expected:** Same as Step 2

---

### Step 4: Test Bot User Agent (Facebook)
**Purpose:** Verify bot detection works

```bash
curl -i -A "facebookexternalhit/1.1" https://your-preview-url.vercel.app/
```

**Expected:** Same as Step 2

---

### Step 5: Test Bot User Agent (Twitter)
**Purpose:** Verify bot detection for different crawlers

```bash
curl -i -A "Twitterbot/1.0" https://your-preview-url.vercel.app/
```

**Expected:** Same as Step 2

---

### Step 6: Test Bot User Agent (Google)
**Purpose:** Verify Google indexing will work

```bash
curl -i -A "Googlebot/2.1" https://your-preview-url.vercel.app/
```

**Expected:** Same as Step 2

---

### Step 7: Test Regular User
**Purpose:** Verify non-bot traffic gets the SPA

```bash
curl -i -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" https://your-preview-url.vercel.app/
```

**Expected Response:**
```
HTTP/2 200
content-type: text/html

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Loading...</title>
    ...
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

✅ **Pass Criteria:**
- 200 status
- HTML contains `<div id="root"></div>`
- HTML contains `<script type="module" src="/src/main.tsx">`
- **NOT** the same HTML as bot requests

---

## Step 8: Custom Domain Testing (After DNS Setup)

Once your custom domain is pointed to Vercel:

```bash
# Test with your custom domain
curl -i -A "facebookexternalhit/1.1" https://your-custom-domain.com/

# Test a specific funnel step
curl -i -A "Twitterbot/1.0" https://your-custom-domain.com/your-funnel-step

# Test a website page
curl -i -A "LinkedInBot/1.0" https://your-custom-domain.com/products
```

**Expected:**
- Different SEO titles/descriptions based on the content
- `X-Content-Type` header shows `website` or `funnel`

---

## Social Media Debuggers

After curl tests pass, use these tools:

### Facebook Debugger
1. Go to: https://developers.facebook.com/tools/debug/
2. Enter your URL: `https://your-custom-domain.com/`
3. Click "Scrape Again"

**Expected:**
- ✅ Preview image loads
- ✅ Title and description appear
- ✅ No errors

---

### Twitter Card Validator
1. Go to: https://cards-dev.twitter.com/validator
2. Enter your URL: `https://your-custom-domain.com/`
3. Click "Preview Card"

**Expected:**
- ✅ Card preview renders
- ✅ Image, title, description correct

---

### LinkedIn Post Inspector
1. Go to: https://www.linkedin.com/post-inspector/
2. Enter your URL: `https://your-custom-domain.com/`
3. Click "Inspect"

**Expected:**
- ✅ Post preview displays
- ✅ Metadata is correct

---

## Vercel Function Logs

To see what's happening in production:

1. Go to Vercel Dashboard → Your Project → Functions
2. Click on `render` function
3. View real-time logs

**What to look for:**
```
SEO Render: {
  hostname: 'your-domain.com',
  pathname: '/',
  userAgent: 'facebookexternalhit/1.1',
  isBot: true,
  forceMode: false
}
Bot detected, generating SEO HTML
Domain found: abc123...
Connections found: 2
Selected connection: website xyz456...
Generated SEO data: { title: '...', hasImage: true, hasFavicon: true }
```

---

## Troubleshooting

### Issue: Health check returns 404
**Cause:** Edge Function not deployed
**Fix:** Check Vercel deployment logs, ensure `api/render.ts` exists

### Issue: Bot gets SPA HTML instead of SEO HTML
**Cause:** User agent not detected
**Fix:** Check `BOT_USER_AGENTS` array in `api/render.ts`

### Issue: SEO HTML missing meta tags
**Cause:** Data not fetched from Supabase
**Fix:** Check Vercel Function logs for errors

### Issue: Custom domain returns 404
**Cause:** Domain not in `custom_domains` table or not verified
**Fix:** 
1. Check domain is in `custom_domains` table
2. Ensure `is_verified = true` and `dns_configured = true`
3. Check `domain_connections` exist for the domain

### Issue: Wrong content showing
**Cause:** Routing logic not matching
**Fix:** Add logging to see which connection is selected

---

## Success Criteria

✅ **Your SEO is working when:**
1. Health check returns 200 + JSON
2. `?seo=1` returns SEO HTML with meta tags
3. Facebook/Twitter/Google bots get SEO HTML
4. Regular users get SPA HTML
5. Vercel logs show bot detection working
6. Social debuggers show proper previews
7. Custom domain works with all tests

---

## Next Steps

After verification:
1. Point your production domain to Vercel
2. Re-run all tests on production domain
3. Submit URLs to Google Search Console
4. Test social sharing on Facebook/Twitter
5. Monitor Vercel Function logs for any errors

---

## Quick Reference

**Test endpoints:**
- Health: `https://your-domain.com/api/seo-health`
- Force SEO: `https://your-domain.com/?seo=1`
- Force SEO (header): `curl -H "x-seo-test: 1" https://your-domain.com/`

**Bot user agents:**
- Facebook: `facebookexternalhit/1.1`
- Twitter: `Twitterbot/1.0`
- Google: `Googlebot/2.1`
- LinkedIn: `LinkedInBot/1.0`

**Important headers to check:**
- `X-SEO-Rendered: true` - SEO HTML was generated
- `X-Bot-Detected: true` - Bot was detected
- `X-Content-Type: website|funnel` - Content type served
