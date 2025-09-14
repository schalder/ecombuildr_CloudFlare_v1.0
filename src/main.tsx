import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize page builder elements registry
import './components/page-builder/elements';

// Check if we have hydration data (from server-rendered HTML)
declare global {
  interface Window {
    __HYDRATION_DATA__?: {
      pageData: any;
      contentType: string;
      contentId: string;
      customDomain?: string;
      timestamp: number;
    };
    __REACT_APP_LOADED__?: () => void;
  }
}

const rootElement = document.getElementById("root")!;

// If we have hydration data, use hydrateRoot, otherwise use createRoot
if (window.__HYDRATION_DATA__) {
  console.log('🔄 Hydrating React app with server data...');
  hydrateRoot(rootElement, <App />);
  console.log('✅ React app hydrated successfully');
} else {
  console.log('🚀 Starting React app in client mode...');
  createRoot(rootElement).render(<App />);
}

// Mark that React app has loaded
window.__REACT_APP_LOADED__ = () => {
  console.log('🎉 React app fully loaded and ready');
};
