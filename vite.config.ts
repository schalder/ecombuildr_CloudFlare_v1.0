import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
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
          // Separate admin/builder from storefront for optimal loading
          if (id.includes('page-builder') || id.includes('react-dnd') || id.includes('@hello-pangea/dnd')) {
            return 'admin-builder';
          }
          
          // Core React - highest priority
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-core';
          }
          
          // Router - page navigation
          if (id.includes('react-router')) {
            return 'react-router';
          }
          
          // UI framework - critical for rendering
          if (id.includes('@radix-ui') || id.includes('class-variance-authority')) {
            return 'ui-framework';
          }
          
          // Form handling - only when needed
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
            return 'form-libs';
          }
          
          // Charts - heavy, lazy load
          if (id.includes('recharts')) {
            return 'charts';
          }
          
          // Date handling - specific pages only
          if (id.includes('date-fns') || id.includes('react-day-picker')) {
            return 'date-libs';
          }
          
          // Icons - frequently used but cacheable
          if (id.includes('lucide-react') || id.includes('@heroicons')) {
            return 'icons';
          }
          
          // Supabase - backend communication
          if (id.includes('@supabase') || id.includes('@tanstack/react-query')) {
            return 'backend-libs';
          }
          
          // Utility libraries
          if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('cmdk')) {
            return 'utilities';
          }
          
          // Node modules fallback
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Optimize chunk naming for better caching
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name || 'chunk';
          return `assets/${name}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name?.split('.').at(1);
          if (extType === 'css') {
            return 'assets/styles/[name]-[hash].css';
          }
          if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'avif'].includes(extType || '')) {
            return 'assets/images/[name]-[hash].[ext]';
          }
          if (['woff', 'woff2', 'ttf'].includes(extType || '')) {
            return 'assets/fonts/[name]-[hash].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
    // Optimize build for performance
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 500, // More strict limit
    // Advanced optimizations
    cssMinify: 'esbuild',
    assetsInlineLimit: 4096, // Inline small assets
    sourcemap: false, // Disable sourcemaps in production for smaller bundles
  },
  // Environment variable defaults
  define: {
    'process.env.VITE_STOREFRONT_RENDERER_DEFAULT': JSON.stringify('true'),
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  // Advanced optimizations
  esbuild: {
    target: 'es2020',
    keepNames: false,
    minifyIdentifiers: mode === 'production',
    minifySyntax: true,
    minifyWhitespace: true,
    treeShaking: true,
    // Remove console logs in production
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      '@radix-ui/react-slot',
      'class-variance-authority',
      'clsx',
      'tailwind-merge'
    ],
    exclude: [
      // Heavy libraries that should be loaded on demand
      'recharts',
      'html2canvas', 
      'jspdf',
      'react-dnd',
      '@hello-pangea/dnd'
    ],
  },
}));
