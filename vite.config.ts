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
          
          // Split element categories for lazy loading
          'elements-basic': ['src/components/page-builder/elements/BasicElements'],
          'elements-ecommerce': ['src/components/page-builder/elements/EcommerceElements'],
          'elements-form': ['src/components/page-builder/elements/FormElements'],
          'elements-content': ['src/components/page-builder/elements/ContentElements'],
          'elements-media': ['src/components/page-builder/elements/MediaElements'],
          'elements-advanced': ['src/components/page-builder/elements/AdvancedElements'],
          'elements-marketing': ['src/components/page-builder/elements/MarketingElements'],
          'elements-navigation': ['src/components/page-builder/elements/NavigationElements']
        },
      },
    },
    // Optimize build for performance
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Reduce chunk size warnings for better performance
    chunkSizeWarningLimit: 1000,
  },
  // Environment variable defaults
  define: {
    'process.env.VITE_STOREFRONT_RENDERER_DEFAULT': JSON.stringify(
      process.env.VITE_STOREFRONT_RENDERER_DEFAULT || 'true'
    ),
  },
}));
