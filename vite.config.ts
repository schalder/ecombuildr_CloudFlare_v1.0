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
          // Split node_modules into smaller chunks
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // UI libraries
            if (id.includes('@radix-ui') || id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            // Form handling
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
              return 'form-vendor';
            }
            // Charts and visualization
            if (id.includes('recharts')) {
              return 'chart-vendor';
            }
            // Date handling
            if (id.includes('date-fns') || id.includes('react-day-picker')) {
              return 'date-vendor';
            }
            // Page builder (admin only)
            if (id.includes('react-dnd') || id.includes('@hello-pangea/dnd')) {
              return 'page-builder';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            // TanStack Query
            if (id.includes('@tanstack')) {
              return 'query-vendor';
            }
            // Everything else from node_modules
            return 'vendor';
          }
          
          // Split large page builder components
          if (id.includes('src/components/page-builder')) {
            return 'page-builder-components';
          }
          
          // Split storefront components
          if (id.includes('src/components/storefront')) {
            return 'storefront-components';
          }
        },
      },
    },
    // Optimize build for performance
    target: 'es2020',
    minify: 'esbuild', // Use ESBuild for faster minification
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Increase chunk size warning limit (default is 500kb)
    chunkSizeWarningLimit: 2000, // 2MB warning limit
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
