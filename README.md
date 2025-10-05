# EcomBuildr

## 🚀 E-commerce Website Builder

Build Your E-commerce Empire In Minutes, Not Months.

Create conversion-driven online stores without coding. From landing pages to full e-commerce - everything you need to turn traffic into sales.

## ✨ Features

- **Unlimited Custom Domains** - Connect unlimited custom domains with automatic SSL
- **Multi-Tenant Architecture** - Built for scalability and performance
- **Page Builder** - Drag-and-drop website builder with pre-built templates
- **Funnel Builder** - Create high-converting sales funnels
- **E-commerce Integration** - Full e-commerce functionality with payment processing
- **Course Platform** - Built-in course creation and management
- **SEO Optimized** - Built-in SEO tools and optimization

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **Hosting**: Vercel (unlimited custom domains)
- **Payments**: EPS, EB Pay, Cash on Delivery
- **Deployment**: Automatic deployments with Vercel

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/schalder/ecombuildr.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

## 🌐 Custom Domain Setup

### Unlimited Custom Domains with Vercel

1. **Add your custom domain** in the dashboard
2. **Configure DNS records**:
   - **A Record**: `@` → `76.76.19.61` (Vercel IP)
   - **CNAME**: `www` → `cname.vercel-dns.com`
3. **Automatic SSL certificate** will be issued by Vercel
4. **Your domain is ready to use!**

### Vercel Deployment Benefits

- ✅ **Unlimited custom domains** (no platform limits)
- ✅ **Automatic SSL** (Let's Encrypt integration)
- ✅ **Global CDN** (better performance)
- ✅ **Edge Functions** (faster execution)
- ✅ **Professional setup** (industry standard)

## 🚀 Deployment

### Vercel Deployment

1. **Connect your GitHub repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on git push
4. **Add custom domains** through Vercel dashboard

### Environment Variables

See `VERCEL_DEPLOYMENT.md` for complete environment variable setup.

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support, email support@ecombuildr.com or join our Discord community.

