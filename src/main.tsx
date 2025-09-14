import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize page builder elements registry
import './components/page-builder/elements';

const container = document.getElementById("root")!;

// Check if we're hydrating a pre-rendered page
const hasPreRenderedContent = container.children.length > 0 && 
  !container.innerHTML.includes('id="root"') && 
  !container.innerHTML.includes('Loading page content...');

if (hasPreRenderedContent) {
  // Hydrate existing content
  console.log('🌊 Hydrating pre-rendered content');
  hydrateRoot(container, <App />);
} else {
  // Normal client-side render
  console.log('⚛️ Client-side rendering');
  createRoot(container).render(<App />);
}
