# Custom Domain Setup for Wix-Style Static HTML Serving

This document explains how to set up custom domains to serve static HTML directly from the server, just like Wix and Squarespace.

## Architecture Overview

```
Custom Domain → Domain Router Edge Function → Static HTML Response
     ↓
Direct SEO-optimized HTML (No React SPA loading)
```

## Step 1: DNS Configuration

### For Root Domain (example.com)

Add these DNS records at your domain registrar:

```
Type: A
Name: @
Value: 185.158.133.1
TTL: 300

Type: CNAME  
Name: www
Value: your-project-id.lovable.app
TTL: 300
```

### For Subdomain (shop.example.com)

```
Type: CNAME
Name: shop
Value: your-project-id.lovable.app  
TTL: 300
```

## Step 2: Custom Domain Verification

1. Add the domain to your project in Lovable
2. The system will automatically verify DNS configuration
3. SSL certificates will be provisioned automatically

## Step 3: Content Mapping

### Option A: Automatic Website Mapping
- System automatically finds the primary website for your store
- Root path (/) serves the homepage
- Other paths (/about, /contact) serve respective pages

### Option B: Manual Domain Connections
Use the domain connections table to map specific paths:

```sql
INSERT INTO domain_connections (domain, path_pattern, content_type, content_id)
VALUES 
  ('shop.example.com', '/', 'website_page', 'homepage-id'),
  ('shop.example.com', '/products', 'website_page', 'products-page-id');
```

## How It Works

### 1. Request Flow
```
User visits shop.example.com/about
    ↓
DNS resolves to Lovable infrastructure
    ↓
Domain Router function checks custom_domains table
    ↓
Finds associated store and content
    ↓
Calls serve-static-page function
    ↓
Returns cached HTML snapshot with SEO tags
```

### 2. SEO Benefits
- **Server-side rendering**: Search engines see complete HTML immediately
- **Fast loading**: Static HTML loads instantly
- **Perfect SEO**: Meta tags, Open Graph, structured data all present
- **No JavaScript required**: Content visible even with JS disabled

### 3. Caching Strategy
- HTML snapshots cached in database
- CDN-level caching for fast global delivery
- Automatic regeneration when content changes

## Testing Your Setup

### 1. Check DNS Resolution
```bash
dig shop.example.com
nslookup shop.example.com
```

### 2. Test Static HTML Serving
```bash
curl -H "User-Agent: Googlebot" https://shop.example.com/
```

### 3. Verify SEO Tags
Check that the response includes:
- `<title>` tag with page-specific content
- Meta description
- Open Graph tags
- Structured data

## Comparison with Traditional SPA

### Traditional SPA Approach (Current Lovable)
```
User visits example.com
    ↓
Loads index.html with basic <title>
    ↓
Downloads React bundle (~1-2MB)
    ↓
JavaScript runs and fetches content
    ↓
Updates page title and content
    ↓ 
SEO tags updated (but crawlers may miss this)
```

### Wix-Style Static Approach (New Implementation)
```
User visits shop.example.com/about
    ↓
Server immediately returns complete HTML:
    <title>About Us - Your Store</title>
    <meta description="Learn about our story...">
    <body>Full page content here</body>
    ↓
No JavaScript loading required
    ↓
Perfect for SEO crawlers
```

## Admin Access

Admin/dashboard routes automatically redirect to the React SPA:
- `shop.example.com/dashboard` → `your-project.lovable.app/dashboard`
- `shop.example.com/admin` → `your-project.lovable.app/admin`

This ensures the management interface works normally while public pages serve static HTML.

## Benefits

✅ **Perfect SEO**: Search engines see complete HTML immediately  
✅ **Fast Loading**: No JavaScript bundle download required  
✅ **Better Core Web Vitals**: Instant content rendering  
✅ **Mobile Friendly**: Lightweight pages load fast on mobile  
✅ **Reliable**: No client-side errors can break the page  
✅ **Global CDN**: Static HTML cached worldwide  

This approach gives you the best of both worlds: a powerful React admin interface for building pages, and lightning-fast static HTML for your customers and search engines.