import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'

// Page builder elements are now lazy-loaded when needed:
// - Storefront pages use storefrontRegistry (already lazy-loads)
// - Admin page builder loads elements when PageBuilder component mounts

const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
