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
          // Split vendor libraries
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') && (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router'))) {
              return 'react-vendor';
            }
            
            // Split Radix UI into smaller chunks for better code splitting
            if (id.includes('@radix-ui')) {
              if (id.includes('react-dialog')) return 'radix-dialog';
              if (id.includes('react-dropdown-menu')) return 'radix-dropdown';
              if (id.includes('react-toast')) return 'radix-toast';
              if (id.includes('react-popover')) return 'radix-popover';
              if (id.includes('react-select')) return 'radix-select';
              if (id.includes('react-tabs')) return 'radix-tabs';
              // Group smaller Radix components
              return 'radix-other';
            }
            
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'form-vendor';
            }
            
            // Chart library - keep in vendor to avoid circular dependency issues
            // Recharts will be lazy loaded at component level using useLazyRecharts hook
            // Don't split it separately to avoid initialization order issues
            
            // Date libraries
            if (id.includes('date-fns') || id.includes('react-day-picker')) {
              return 'date-vendor';
            }
            
            // Page builder (admin only - heavy)
            if (id.includes('react-dnd') || id.includes('@hello-pangea/dnd')) {
              return 'page-builder';
            }
            
            // TipTap editor (heavy, lazy load)
            if (id.includes('@tiptap')) {
              return 'tiptap';
            }
            
            // Supabase client
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase';
            }
            
            // React Query
            if (id.includes('@tanstack/react-query')) {
              return 'query';
            }
            
            // UI utilities
            if (id.includes('lucide-react') || id.includes('class-variance-authority')) {
              return 'ui-libs';
            }
            
            // Heavy PDF/image libraries (lazy load)
            if (id.includes('html2canvas') || id.includes('jspdf')) {
              return 'pdf-vendor';
            }
            
            // Other vendor libraries
            return 'vendor';
          }
        },
      },
    },
    // Optimize build for performance
    target: 'es2020',
    minify: 'esbuild', // Use ESBuild for faster minification
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Reduce chunk size warnings for better performance
    chunkSizeWarningLimit: 1000,
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
