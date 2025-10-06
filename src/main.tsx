import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize page builder elements registry
import './components/page-builder/elements';

// Client-side SEO injection fallback
function injectClientSEO() {
  // Only run if we're on a custom domain and SEO hasn't been set by Edge Function
  const isCustomDomain = !window.location.hostname.includes('ecombuildr.com') && 
                        !window.location.hostname.includes('localhost') && 
                        !window.location.hostname.includes('lovable.dev') &&
                        !window.location.hostname.includes('lovable.app') &&
                        !window.location.hostname.includes('lovableproject.com');
  
  if (isCustomDomain && document.title === 'Loading...') {
    // This means Edge Function didn't work, so we'll let React handle SEO
    console.log('🔄 Edge Function SEO not detected, React will handle SEO');
  }
}

// Run immediately
injectClientSEO();

createRoot(document.getElementById("root")!).render(<App />);
