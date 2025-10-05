#!/bin/bash

# Cloudflare Worker Deployment Script
# This script deploys the SEO routing worker to Cloudflare

echo "🚀 Deploying Cloudflare Worker for SEO Routing..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Login to Cloudflare (if not already logged in)
echo "🔐 Checking Cloudflare authentication..."
wrangler whoami

# Deploy the worker
echo "📦 Deploying worker..."
wrangler deploy cloudflare-worker-simple.js --name seo-router

# Add route for custom domain
echo "🛣️ Adding route for shop.ghlmax.com..."
wrangler route add "shop.ghlmax.com/*" seo-router

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update DNS: shop.ghlmax.com → [Cloudflare Worker Domain]"
echo "2. Test with: curl -H 'User-Agent: facebookexternalhit/1.1' https://shop.ghlmax.com/"
echo "3. Verify regular users still work: curl https://shop.ghlmax.com/"
