import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from '@/hooks/useAuth'

// Initialize page builder elements registry
import './components/page-builder/elements';

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
