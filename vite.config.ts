import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import sitemap from 'vite-plugin-sitemap';
import { createHtmlPlugin } from 'vite-plugin-html';

// Define routes for sitemap generation
// const routes = [
//   { path: '/', name: 'Home' },
//   { path: '/about', name: 'About' },
//   { path: '/pricing', name: 'Pricing' },
//   { path: '/features', name: 'Features' },
//   { path: '/contact', name: 'Contact' },
//   // Add more static routes as needed
// ];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Sitemap generation for static pages - temporarily disabled due to build timing issue
    // sitemap({
    //   hostname: 'https://ecombuildr.com', // Update with your domain
    //   routes,
    //   generateRobotsTxt: true,
    //   robots: [
    //     {
    //       userAgent: '*',
    //       allow: '/',
    //       disallow: ['/admin', '/dashboard', '/api/'],
    //     },
    //   ],
    // }),
    // HTML plugin for meta injection
    createHtmlPlugin({
      minify: true,
      inject: {
        data: {
          title: 'EcomBuildr - Build Your E-commerce Empire',
          description: 'Create stunning e-commerce websites and sales funnels with our drag-and-drop builder. No coding required.',
        },
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // ✅ PERFORMANCE: Storefront-specific bundle splitting
          // Split storefront renderer components (only loaded on public pages)
          if (id.includes('/components/storefront/renderer/') || 
              id.includes('/components/storefront/PageBuilderRenderer')) {
            return 'storefront-renderer';
          }
          
          // Split storefront pages (lazy-loaded)
          if (id.includes('/pages/storefront/')) {
            return 'storefront-pages';
          }
          
          // Split storefront components (cart, product cards, etc.)
          if (id.includes('/components/storefront/') && 
              !id.includes('/components/storefront/renderer/') &&
              !id.includes('/components/storefront/PageBuilderRenderer')) {
            return 'storefront-components';
          }
          
          // Split page builder (admin only - separate from storefront)
          if (id.includes('/components/page-builder/') && 
              !id.includes('/components/page-builder/types') &&
              !id.includes('/components/page-builder/utils')) {
            return 'page-builder';
          }
          
          // Split vendor libraries
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            
            // Radix UI - split into smaller chunks for storefront
            if (id.includes('@radix-ui')) {
              // Only common UI components used in storefront
              if (id.includes('react-dialog') || id.includes('react-dropdown-menu') || id.includes('react-toast')) {
                return 'ui-vendor-core';
              }
              // Other Radix components (admin-heavy)
              return 'ui-vendor-extended';
            }
            
            // Form libraries (used in checkout/storefront)
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'form-vendor';
            }
            
            // Chart library (admin only)
            if (id.includes('recharts')) {
              return 'chart-vendor';
            }
            
            // Date libraries
            if (id.includes('date-fns') || id.includes('react-day-picker')) {
              return 'date-vendor';
            }
            
            // Page builder drag-drop (admin only)
            if (id.includes('react-dnd') || id.includes('@hello-pangea/dnd')) {
              return 'page-builder-dnd';
            }
            
            // Supabase client (used everywhere but can be split)
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase-client';
            }
            
            // React Query (used everywhere)
            if (id.includes('@tanstack/react-query')) {
              return 'react-query';
            }
            
            // UI utilities (small, common)
            if (id.includes('lucide-react') || id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'ui-utils';
            }
            
            // TipTap editor (admin only)
            if (id.includes('@tiptap')) {
              return 'tiptap-editor';
            }
            
            // Other node_modules
            return 'vendor-misc';
          }
        },
      },
    },
    // Optimize build for performance
    target: 'es2020',
    minify: 'esbuild', // Use ESBuild for faster minification
    // Enable CSS code splitting
    cssCodeSplit: true,
    // ✅ PERFORMANCE: Lower chunk size warning limit to catch large chunks early
    chunkSizeWarningLimit: 600,
  },
  // Environment variable defaults
  define: {
    'process.env.VITE_STOREFRONT_RENDERER_DEFAULT': JSON.stringify('true'),
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  // Enable experimental features for better performance
  esbuild: {
    target: 'es2020',
    keepNames: false,
    minifyIdentifiers: mode === 'production',
    minifySyntax: true,
    minifyWhitespace: true,
  },
}));
