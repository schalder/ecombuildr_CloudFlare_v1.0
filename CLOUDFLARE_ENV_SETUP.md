# Cloudflare Pages Environment Variables Setup

## Required Environment Variables

You need to set these environment variables in your Cloudflare Pages dashboard:

### 1. Go to Cloudflare Pages Dashboard
- Navigate to your project: `ecombuildr`
- Go to **Settings** → **Environment Variables**

### 2. Add These Variables

#### For the Frontend Application:
```
VITE_SUPABASE_URL=https://fhqwacmokbtbspkxjixf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM
VITE_EPS_MERCHANT_ID=your_eps_merchant_id
VITE_EPS_SECRET_KEY=your_eps_secret_key
VITE_EBPAY_MERCHANT_ID=your_ebpay_merchant_id
VITE_EBPAY_SECRET_KEY=your_ebpay_secret_key
VITE_APP_URL=https://app.ecombuildr.com
VITE_STOREFRONT_RENDERER_DEFAULT=true
NODE_ENV=production
```

#### For Pages Functions (SEO Middleware):
```
SUPABASE_URL=https://fhqwacmokbtbspkxjixf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM
```

### 3. Set Environment Scope
- Set all variables for **Production** environment
- Optionally set for **Preview** environment for testing

### 4. Save and Redeploy
- Click **Save** after adding all variables
- Trigger a new deployment to apply the changes

## Build Settings

Make sure your build settings are:
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (leave empty)

## Functions Detection

After deployment, check:
1. **Functions** tab should show `_middleware.ts` and `test.ts`
2. **Real-time Logs** should be available
3. Test the SEO middleware with Facebook Debugger

## Troubleshooting

If Functions still don't appear:
1. Check that the `functions/` directory is in the root of your repository
2. Verify that function files export a default object with a `fetch` method
3. Ensure environment variables are set correctly
4. Check the build logs for any errors
