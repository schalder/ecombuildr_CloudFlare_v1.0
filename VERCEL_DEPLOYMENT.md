# Environment Variables for Vercel Deployment

## Required Environment Variables

Set these environment variables in your Vercel dashboard:

### Supabase Configuration
```
VITE_SUPABASE_URL=https://fhqwacmokbtbspkxjixf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM
```

### Payment Gateway Configuration
```
VITE_EPS_MERCHANT_ID=your_eps_merchant_id
VITE_EPS_SECRET_KEY=your_eps_secret_key
VITE_EBPAY_MERCHANT_ID=your_ebpay_merchant_id
VITE_EBPAY_SECRET_KEY=your_ebpay_secret_key
```

### Application Configuration
```
VITE_APP_URL=https://ecombuildr.com
VITE_STOREFRONT_RENDERER_DEFAULT=true
NODE_ENV=production
```

## Vercel Dashboard Setup

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add each variable above with the appropriate value
4. Set environment to "Production", "Preview", and "Development" as needed

## Custom Domain Configuration

### DNS Setup for Custom Domains
When users add custom domains, they should configure:

**A Record:**
- Host: `@`
- Value: `76.76.19.61` (Vercel IP)

**CNAME Record:**
- Host: `www`
- Value: `cname.vercel-dns.com`

### Automatic SSL
Vercel automatically issues SSL certificates for custom domains once DNS is configured correctly.

## Deployment Notes

- Vercel will automatically build and deploy on git push
- Edge Functions are located in `/api/` directory
- Custom domains are unlimited (no platform limits)
- SSL certificates are automatically managed by Vercel
