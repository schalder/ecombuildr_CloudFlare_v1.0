import { useEffect } from 'react';

interface ScriptManagerProps {
  customScripts?: string;
  defer?: boolean;
}

export const ScriptManager: React.FC<ScriptManagerProps> = ({ 
  customScripts, 
  defer = true 
}) => {
  useEffect(() => {
    if (!customScripts) return;

    const executeScripts = () => {
      try {
        // Create a script element to safely execute custom scripts
        const scriptElement = document.createElement('script');
        scriptElement.textContent = customScripts;
        
        // Append to head temporarily to execute, then remove
        document.head.appendChild(scriptElement);
        
        // Clean up after execution
        setTimeout(() => {
          if (scriptElement.parentNode) {
            scriptElement.parentNode.removeChild(scriptElement);
          }
        }, 100);
      } catch (error) {
        console.warn('Error executing custom scripts:', error);
      }
    };

    if (defer && 'requestIdleCallback' in window) {
      // Defer script execution to idle time
      requestIdleCallback(executeScripts, { timeout: 1000 });
    } else if (defer) {
      // Fallback for browsers without requestIdleCallback
      setTimeout(executeScripts, 0);
    } else {
      // Execute immediately
      executeScripts();
    }
  }, [customScripts, defer]);

  return null;
};