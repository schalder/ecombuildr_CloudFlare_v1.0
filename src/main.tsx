import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize element registry
import './components/page-builder/elements';

createRoot(document.getElementById("root")!).render(<App />);
