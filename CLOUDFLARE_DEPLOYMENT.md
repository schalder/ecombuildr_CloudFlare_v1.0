# Cloudflare Pages Deployment Guide

## Environment Variables for Cloudflare Pages

### Required Environment Variables

Set these environment variables in your Cloudflare Pages dashboard:

#### Supabase Configuration
```
VITE_SUPABASE_URL=https://fhqwacmokbtbspkxjixf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM
```

#### Payment Gateway Configuration
```
VITE_EPS_MERCHANT_ID=your_eps_merchant_id
VITE_EPS_SECRET_KEY=your_eps_secret_key
VITE_EBPAY_MERCHANT_ID=your_ebpay_merchant_id
VITE_EBPAY_SECRET_KEY=your_ebpay_secret_key
```

#### Application Configuration
```
VITE_APP_URL=https://your-cloudflare-domain.pages.dev
VITE_STOREFRONT_RENDERER_DEFAULT=true
NODE_ENV=production
```

#### Worker-specific Environment Variables (for SEO middleware)
```
SUPABASE_URL=https://fhqwacmokbtbspkxjixf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM
```

## Cloudflare Pages Dashboard Setup

### 1. Create Project
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Pages
3. Click "Create a project"
4. Connect your GitHub repository

### 2. Configure Build Settings
- **Framework preset**: Vite
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`

### 3. Set Environment Variables
1. Go to Settings > Environment Variables
2. Add each variable above with the appropriate value
3. Set environment to "Production", "Preview", and "Development" as needed

## Custom Domain Configuration

### DNS Setup for Custom Domains
When users add custom domains, they should configure:

**CNAME Record:**
- Host: `@` (or root domain)
- Value: `<project-name>.pages.dev`

**CNAME Record:**
- Host: `www`
- Value: `<project-name>.pages.dev`

### Automatic SSL
Cloudflare automatically issues SSL certificates for custom domains once DNS is configured correctly.

## Deployment Commands

### Using Wrangler CLI
```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build and deploy
npm run build
wrangler pages deploy dist --project-name ecombuildr

# Or use the integrated script
npm run deploy
```

### Using GitHub Integration (Recommended)
1. Connect GitHub repository to Cloudflare Pages
2. Configure build settings as shown above
3. Set environment variables in Cloudflare dashboard
4. Automatic deployments on git push

## Local Development with Cloudflare

### Development Server
```bash
# Start Vite dev server
npm run dev

# Or test with Cloudflare Pages dev server
npm run build
npm run cf:dev
```

### Testing SEO Middleware Locally
```bash
# Test with social crawler user agent
curl -H "User-Agent: facebookexternalhit/1.1" http://localhost:8788/
```

## Performance Optimizations

### Cloudflare-specific Features
1. **Edge Caching**: Automatic caching at 300+ data centers
2. **Image Optimization**: Use Cloudflare Images for better performance
3. **KV Storage**: Optional caching for SEO data (5-10x faster)
4. **DDoS Protection**: Included in all plans
5. **Analytics**: Cloudflare Web Analytics

### Expected Performance Improvements
- **Faster Global CDN**: 300+ data centers vs Vercel's 30+
- **Better Caching**: More aggressive edge caching
- **Lower Costs**: Unlimited bandwidth on Pro plan
- **Better Analytics**: Detailed performance metrics

## Migration from Vercel

### Key Differences
| Feature | Vercel | Cloudflare Pages |
|---------|--------|------------------|
| Edge Functions | Vercel Edge | Pages Functions |
| Config File | `vercel.json` | `wrangler.toml` + `_headers` |
| Deploy CLI | `vercel` | `wrangler pages` |
| Headers | In `vercel.json` | In `_headers` file |
| Redirects | In `vercel.json` | In `_redirects` file |
| Environment | Dashboard only | Dashboard + `wrangler.toml` |

### Migration Checklist
- [x] Create `wrangler.toml` configuration
- [x] Convert SEO middleware to Cloudflare Pages Function
- [x] Create `_headers` file with HTTP headers
- [x] Create `_redirects` file for API routing
- [x] Update `package.json` with Cloudflare scripts
- [x] Update `.gitignore` with Cloudflare patterns
- [x] Set up environment variables in Cloudflare dashboard
- [x] Test deployment and functionality

## Troubleshooting

### Common Issues
1. **Build Failures**: Check Node.js version compatibility
2. **Environment Variables**: Ensure all required vars are set
3. **SEO Issues**: Test with social crawler user agents
4. **Custom Domains**: Verify DNS configuration

### Debug Commands
```bash
# Check Wrangler version
wrangler --version

# Test Pages Function locally
wrangler pages dev dist --local

# View deployment logs
wrangler pages deployment list --project-name ecombuildr
```

## Cost Comparison

### Vercel (Previous)
- Hobby: Free (limited bandwidth)
- Pro: $20/month (1TB bandwidth)

### Cloudflare Pages (Current)
- Free: Unlimited requests, 500 builds/month
- Pro: $20/month (5,000 builds/month, better support)
- Bandwidth: Always unlimited on all plans

## Post-Migration Tasks

1. Update DNS records for all custom domains
2. Monitor performance and error rates
3. Test all payment flows thoroughly
4. Update documentation and deployment guides
5. Archive Vercel project (don't delete immediately)
6. Monitor Cloudflare Analytics for traffic patterns

## Support

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Community](https://community.cloudflare.com/)
