# SEO Testing Guide

This guide helps you verify that the SEO rendering is working correctly for social media crawlers and bots.

## Architecture Overview

```
Bot Request → Vercel Routes → /api/seo (Proxy) → Supabase Edge Function → SEO HTML
User Request → Vercel Routes → index.html → React SPA
```

## Step 1: Deploy to Vercel

1. Push your code to GitHub
2. Vercel will automatically deploy
3. Wait for deployment to complete
4. Note your preview URL: `https://your-app-xxxx.vercel.app`

## Step 2: Verification Tests

### Test 1: Health Check
```bash
curl -i https://your-app.vercel.app/api/seo-health
```

**Expected Response:**
```
HTTP/2 200
content-type: application/json
x-seo-handler: vercel-proxy

{"ok":true,"timestamp":1234567890,"service":"seo-render"}
```

### Test 2: Force SEO Mode (Query Parameter)
```bash
curl -i "https://your-app.vercel.app/?seo=1"
```

**Expected Response:**
```
HTTP/2 200
content-type: text/html; charset=utf-8
x-seo-handler: vercel-proxy
x-seo-source: supabase-edge

<!DOCTYPE html>
<html lang="en">
<head>
  <title>Your Site Title</title>
  <meta name="description" content="Your site description">
  ...
```

### Test 3: Force SEO Mode (Header)
```bash
curl -i -H "x-seo-test: 1" https://your-app.vercel.app/
```

**Expected Response:** Same as Test 2

### Test 4: Bot User Agent - Facebook
```bash
curl -i -A "facebookexternalhit/1.1" https://your-app.vercel.app/
```

**Expected Response:**
- Status: 200
- Content-Type: text/html
- X-SEO-Handler header present
- Full HTML with Open Graph meta tags

### Test 5: Bot User Agent - Twitter
```bash
curl -i -A "Twitterbot/1.0" https://your-app.vercel.app/
```

**Expected Response:** Same as Test 4

### Test 6: Bot User Agent - Google
```bash
curl -i -A "Googlebot/2.1" https://your-app.vercel.app/
```

**Expected Response:** Same as Test 4

### Test 7: Regular User (No Bot)
```bash
curl -i -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" https://your-app.vercel.app/
```

**Expected Response:**
- Status: 200
- Content-Type: text/html
- No X-SEO-Handler header (or empty)
- React SPA HTML from index.html

## Step 3: Check Logs

### Supabase Edge Function Logs
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/fhqwacmokbtbspkxjixf/functions)
2. Click on `seo-render` function
3. Click "Logs" tab
4. You should see entries like:
   ```
   📥 [SEO] Request: example.com/ | Bot: true | UA: facebookexternalhit/1.1
   🔍 [SEO] Resolving: custom_domain | example.com/
   ✅ [SEO] Found custom domain: example.com -> store abc-123
   ✅ [SEO] Generated HTML for: Your Page Title
   ```

### Vercel Function Logs
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Click "Functions" tab
4. Click on `/api/seo`
5. View logs - you should see:
   ```
   [Vercel Proxy] example.com/ | UA: facebookexternalhit/1.1
   ```

## Step 4: Social Debugger Testing

### Facebook Debugger
1. Go to https://developers.facebook.com/tools/debug/
2. Enter your URL: `https://your-app.vercel.app/`
3. Click "Debug"
4. **Expected:** Preview image loads, title and description appear, no errors

### Twitter Card Validator
1. Go to https://cards-dev.twitter.com/validator
2. Enter your URL: `https://your-app.vercel.app/`
3. Click "Preview card"
4. **Expected:** Card preview renders with correct metadata

### LinkedIn Post Inspector
1. Go to https://www.linkedin.com/post-inspector/
2. Enter your URL: `https://your-app.vercel.app/`
3. Click "Inspect"
4. **Expected:** Post preview displays correctly

## Step 5: Custom Domain Setup

**Only proceed after all tests pass on preview URL!**

1. Go to Vercel → Settings → Domains
2. Add your custom domain (e.g., `example.com`)
3. Update DNS records at your registrar:

**For A Record:**
```
Type: A
Host: @
Value: 76.76.19.61
TTL: 300
```

**For CNAME (www):**
```
Type: CNAME
Host: www
Value: cname.vercel-dns.com
TTL: 300
```

4. Wait for DNS propagation (5-30 minutes)
5. Vercel will automatically provision SSL
6. Re-run all curl tests on your custom domain
7. Re-test social debuggers on your custom domain

## Troubleshooting

### Test 1 Fails (Health Check)
- **Issue:** Vercel proxy or Supabase Edge Function not deployed
- **Fix:** Check Vercel deployment logs, verify Supabase function is deployed
- **Command:** `supabase functions list`

### Tests 2-6 Fail (SEO Not Working)
- **Issue:** Supabase Edge Function has errors
- **Fix:** Check Supabase Edge Function logs for errors
- **Check:** Verify database has `custom_domains` entry
- **Check:** Verify `domain_connections` table has records
- **Check:** Verify `websites`/`funnels` are published

### Test 7 Fails (SPA Broken)
- **Issue:** index.html not found or React app has errors
- **Fix:** Check Vite build output, verify index.html exists
- **Check:** Open browser console for JavaScript errors

### Still Getting 206 Responses
- **Issue:** CDN caching or range request handling
- **Fix:** Clear CDN cache if using CloudFlare
- **Check:** Verify `Accept-Ranges: none` header on /index.html
- **Try:** Different paths to isolate the issue

### Social Debuggers Show Errors
- **Issue:** Image URLs are relative or meta tags missing
- **Fix:** Check generated HTML has proper meta tags
- **Check:** Verify og:image URL is absolute (starts with https://)
- **Clear:** Social debugger cache and re-test

### Logs Not Appearing
- **Issue:** Function not being called or logging disabled
- **Fix:** Add more console.log statements
- **Check:** Verify function is receiving requests
- **Test:** Use `?seo=1` parameter to force execution

## Success Criteria

✅ **All Tests Pass:**
- Health check returns 200
- Force modes (`?seo=1` and `x-seo-test: 1`) return SEO HTML
- Bot user agents return SEO HTML
- Regular users get React SPA
- Supabase logs show activity
- Vercel logs show proxy calls
- Social debuggers display previews

✅ **Performance:**
- SEO responses < 500ms
- SPA responses < 200ms (cached)
- No 206 Partial Content responses

✅ **Observability:**
- Logs visible in Supabase dashboard
- Logs visible in Vercel dashboard
- Debug headers present in responses

## Maintenance

### Update SEO Data
1. Update website settings in Supabase
2. Update page-level SEO in website_pages table
3. Changes are reflected immediately (no rebuild needed)

### Monitor Usage
1. Check Supabase Edge Function invocations
2. Monitor Vercel Function executions
3. Set up alerts for errors

### Cache Strategy
- SEO HTML cached for 5 minutes (300s)
- Consider implementing html_snapshots table for longer caching
- Clear cache on content updates

## Additional Resources

- [Vercel Edge Functions Docs](https://vercel.com/docs/functions/edge-functions)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
