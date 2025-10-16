import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'

// Initialize page builder elements registry
import './components/page-builder/elements';

const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
