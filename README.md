# EcomBuildr

A powerful e-commerce platform builder built with React, TypeScript, Tailwind CSS, and Lovable Cloud (Supabase).

## Features

### Store Management
- Multi-store support with custom domains
- Customizable store themes and branding
- Store settings and configuration

### Product Management
- Product catalog with categories
- Product variations and inventory tracking
- Image galleries and descriptions
- Featured products and flash sales

### Page Builder
- Drag-and-drop block-based page builder
- Pre-built theme blocks (hero sections, product grids, testimonials, etc.)
- Element registry system for extensibility
- Real-time preview

### E-commerce Features
- Shopping cart functionality
- Checkout process with multiple payment gateways
- Order management and tracking
- Customer accounts and authentication
- Newsletter subscriptions

### Payment Integrations
- bKash
- EBPay
- Nagad
- EPS
- Stripe support

### Backend (Edge Functions)
- Order processing and creation
- Payment verification webhooks
- Email notifications
- Shipping integration (Steadfast)
- Image transformation
- Contact form handling
- Admin impersonation

### Marketing & Analytics
- Pixel tracking (Facebook, TikTok, Google)
- FOMO notifications (recent orders)
- Top sellers tracking
- Contact form submissions

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI, shadcn/ui
- **Backend**: Lovable Cloud (Supabase)
  - PostgreSQL database
  - Edge Functions (Deno)
  - Authentication
  - Storage
- **State Management**: React Context, TanStack Query
- **Forms**: React Hook Form with Zod validation
- **Rich Text**: TipTap
- **Drag & Drop**: @hello-pangea/dnd

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── blocks/          # Page builder blocks
│   │   ├── storefront/      # Customer-facing components
│   │   ├── page-builder/    # Builder interface
│   │   └── ui/              # Reusable UI components
│   ├── contexts/            # React contexts
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and helpers
│   └── pages/               # Route components
├── supabase/
│   ├── functions/           # Edge functions
│   └── migrations/          # Database migrations
└── scripts/                 # Deployment scripts
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or bun

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Database Setup

The project uses Lovable Cloud (Supabase) for backend services.

```bash
# Sync database migrations
npx supabase db push

# Deploy edge functions
npm run sync:functions
```

### Environment Variables

The project uses Lovable Cloud's built-in secret management. No `.env` file is needed for development.

## Deployment Scripts

- `npm run sync:supabase` - Sync database and edge functions
- `npm run sync:db` - Sync database migrations only
- `npm run sync:functions` - Deploy edge functions only

## Development

### Design System

The project uses a semantic token-based design system defined in:
- `src/index.css` - CSS custom properties
- `tailwind.config.ts` - Tailwind configuration

Always use semantic tokens (e.g., `bg-primary`, `text-foreground`) instead of direct colors.

### Adding New Blocks

1. Create block component in `src/components/blocks/`
2. Register in `src/components/blocks/index.ts`
3. Define block settings (category, icon, title)

### Adding New Elements

1. Create element in `src/components/page-builder/elements/`
2. Register in element category file
3. Update `src/components/page-builder/elements/index.ts`

## Contributing

This project was built with Lovable and synced to GitHub for version control and deployment.

## License

Proprietary - All rights reserved
