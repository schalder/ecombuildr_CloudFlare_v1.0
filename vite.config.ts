import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Explicitly set the root and entry point
  root: '.',
  publicDir: 'public',
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
        manualChunks: {
          // Split vendor libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'chart-vendor': ['recharts'],
          'date-vendor': ['date-fns', 'react-day-picker'],
          
          // Split page builder (admin only)
          'page-builder': [
            'react-dnd',
            'react-dnd-html5-backend',
            '@hello-pangea/dnd'
          ],
          
          // Split major libraries that are actually used
          'ui-libs': ['lucide-react', '@radix-ui/react-slot', 'class-variance-authority']
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
