# Netlify Prerendering Setup for Per-Page SEO

## Problem
Social media crawlers (Facebook, Twitter, LinkedIn, etc.) don't execute JavaScript, so they only see the static HTML meta tags from `index.html`. Dynamic SEO set by JavaScript (`setSEO()` calls) is invisible to these crawlers.

## Solution
Enable Netlify's prerendering to serve fully-rendered HTML snapshots to bots while serving the normal SPA to users.

## Setup Steps

### 1. Enable Prerendering in Netlify Dashboard
1. Go to your site's Netlify dashboard
2. Navigate to **Site settings** → **Build & deploy** → **Post processing**
3. Enable **Prerendering**
4. Netlify will automatically detect bots and serve prerendered HTML

### 2. Alternative: Add to netlify.toml
Create/update `netlify.toml` in your project root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[plugins]]
  package = "@netlify/plugin-prerendering"
  
[context.production]
  [context.production.processing]
    skip_processing = false
```

### 3. Verification Steps

#### Check Social Media Previews:
- **Facebook**: [Sharing Debugger](https://developers.facebook.com/tools/debug/)
- **Twitter**: [Card Validator](https://cards-dev.twitter.com/validator)  
- **LinkedIn**: [Post Inspector](https://www.linkedin.com/post-inspector/)

#### Test with curl:
```bash
# Test with bot user agent
curl -H "User-Agent: facebookexternalhit/1.1" https://your-domain.com/your-page

# Should show correct meta tags in HTML
curl -s https://your-domain.com | grep -i "og:"
curl -s https://your-domain.com | grep -i "twitter:"
```

#### Browser Developer Tools:
```javascript
// Check current SEO tags in console
document.querySelector('meta[property="og:title"]')?.getAttribute('content');
document.querySelector('meta[property="og:description"]')?.getAttribute('content');
document.querySelector('meta[property="og:image"]')?.getAttribute('content');
```

## How It Works
1. **Regular users**: Get normal SPA experience  
2. **Bots/crawlers**: Get prerendered HTML with all `setSEO()` tags applied
3. **No performance impact**: Prerendering happens in background
4. **Automatic updates**: Pages re-prerender when content changes

## Cost & Limits
- **Free tier**: 1,000 prerendered pages/month
- **Pro tier**: 10,000 prerendered pages/month
- Sufficient for most e-commerce sites

## Alternative Solutions
If Netlify prerendering can't be used:
1. **Vercel**: Built-in ISR (Incremental Static Regeneration)
2. **Third-party services**: Prerender.io, Rendertron
3. **Custom edge functions**: Generate HTML on-demand (more complex)

## Verification Success
After setup, social media share previews should show:
- ✅ Correct page title (from page builder settings)
- ✅ Proper description (from page builder settings)  
- ✅ Custom OG image (from page builder settings)
- ✅ Canonical URLs matching the actual page
- ✅ Custom robots directives if set