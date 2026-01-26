import { useEffect } from 'react';
import { useHeadStyle } from '@/hooks/useHeadStyle';

interface TrackingCodeManagerProps {
  headerCode?: string;
  footerCode?: string;
  priority?: 'page' | 'funnel' | 'website' | 'store';
}

// Helper function to execute script content safely, handling DOMContentLoaded
const executeScriptContent = (scriptContent: string, targetElement: HTMLElement, priority: string, trackingId: string) => {
  const isDocumentReady = document.readyState === 'complete' || document.readyState === 'interactive';
  const usesDOMContentLoaded = /DOMContentLoaded/.test(scriptContent);
  
  // If script uses DOMContentLoaded and document is already ready, execute immediately
  if (usesDOMContentLoaded && isDocumentReady) {
    try {
      // Replace DOMContentLoaded event listeners with immediate execution
      // This handles: document.addEventListener("DOMContentLoaded", function() { ... });
      let modifiedContent = scriptContent;
      
      // Replace addEventListener('DOMContentLoaded', function() { ... }) with immediate execution
      // Match: document.addEventListener("DOMContentLoaded", function() { ... });
      modifiedContent = modifiedContent.replace(
        /document\.addEventListener\s*\(\s*["']DOMContentLoaded["']\s*,\s*function\s*\(\)\s*\{/g,
        '(function() {'
      );
      
      // Match: document.addEventListener('DOMContentLoaded', function() { ... });
      modifiedContent = modifiedContent.replace(
        /document\.addEventListener\s*\(\s*['"]DOMContentLoaded['"]\s*,\s*function\s*\(\)\s*\{/g,
        '(function() {'
      );
      
      // Match: document.addEventListener("DOMContentLoaded", () => { ... });
      modifiedContent = modifiedContent.replace(
        /document\.addEventListener\s*\(\s*["']DOMContentLoaded["']\s*,\s*\(\)\s*=>\s*\{/g,
        '(function() {'
      );
      
      // Match: document.addEventListener('DOMContentLoaded', () => { ... });
      modifiedContent = modifiedContent.replace(
        /document\.addEventListener\s*\(\s*['"]DOMContentLoaded['"]\s*,\s*\(\)\s*=>\s*\{/g,
        '(function() {'
      );
      
      // Execute the modified script
      const newScript = document.createElement('script');
      newScript.setAttribute('data-tracking-priority', priority);
      newScript.setAttribute('data-tracking-id', trackingId);
      newScript.textContent = modifiedContent;
      targetElement.appendChild(newScript);
    } catch (error) {
      console.warn('Error executing script with DOMContentLoaded handling:', error);
      // Fallback to normal execution
      const newScript = document.createElement('script');
      newScript.setAttribute('data-tracking-priority', priority);
      newScript.setAttribute('data-tracking-id', trackingId);
      newScript.textContent = scriptContent;
      targetElement.appendChild(newScript);
    }
  } else {
    // Normal execution - either no DOMContentLoaded or document not ready yet
    const newScript = document.createElement('script');
    newScript.setAttribute('data-tracking-priority', priority);
    newScript.setAttribute('data-tracking-id', trackingId);
    newScript.textContent = scriptContent;
    targetElement.appendChild(newScript);
  }
};

export const TrackingCodeManager: React.FC<TrackingCodeManagerProps> = ({ 
  headerCode, 
  footerCode, 
  priority = 'website' 
}) => {
  // Inject header tracking code
  useEffect(() => {
    if (!headerCode) return;

    try {
      // Create a unique ID based on priority and content hash
      const headerId = `tracking-header-${priority}`;
      const trackingId = `tracking-${priority}-${Date.now()}`;
      
      // Clean existing script for this priority level
      const existingScript = document.getElementById(headerId);
      if (existingScript) {
        existingScript.remove();
      }

      // Clean any previous tracking elements for this priority
      const existingElements = document.head.querySelectorAll(`[data-tracking-priority="${priority}"]`);
      existingElements.forEach((el) => el.remove());

      // Create script element
      const scriptElement = document.createElement('div');
      scriptElement.id = headerId;
      scriptElement.innerHTML = headerCode;
      
      // Extract and execute script tags
      const scripts = scriptElement.querySelectorAll('script');
      scripts.forEach((script) => {
        const newScript = document.createElement('script');
        newScript.setAttribute('data-tracking-priority', priority);
        newScript.setAttribute('data-tracking-id', trackingId);
        
        // Copy attributes
        Array.from(script.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        
        // Copy content
        if (script.src) {
          // External script - just set src
          newScript.src = script.src;
          document.head.appendChild(newScript);
        } else {
          // Inline script - handle DOMContentLoaded properly
          const scriptContent = script.textContent || '';
          executeScriptContent(scriptContent, document.head, priority, trackingId);
        }
      });

      // Handle non-script elements (meta tags, links, etc.)
      const nonScripts = Array.from(scriptElement.children).filter(el => el.tagName !== 'SCRIPT');
      nonScripts.forEach((element) => {
        const clonedElement = element.cloneNode(true) as Element;
        clonedElement.setAttribute('data-tracking-priority', priority);
        clonedElement.setAttribute('data-tracking-id', trackingId);
        document.head.appendChild(clonedElement);
      });

      // Cleanup function
      return () => {
        const headerScript = document.getElementById(headerId);
        if (headerScript) {
          headerScript.remove();
        }
        
        // Remove any elements we added to head
        const addedElements = document.head.querySelectorAll(`[data-tracking-priority="${priority}"]`);
        addedElements.forEach((el) => el.remove());
      };
    } catch (error) {
      console.warn('Error executing header tracking code:', error);
    }
  }, [headerCode, priority]);

  // Inject footer tracking code
  useEffect(() => {
    if (!footerCode) return;

    try {
      const footerId = `tracking-footer-${priority}`;
      const trackingId = `tracking-${priority}-${Date.now()}`;
      
      // Clean existing script for this priority level
      const existingScript = document.getElementById(footerId);
      if (existingScript) {
        existingScript.remove();
      }

      // Clean any previous tracking elements for this priority
      const existingElements = document.body.querySelectorAll(`[data-tracking-priority="${priority}"]`);
      existingElements.forEach((el) => el.remove());

      // Create script element
      const scriptElement = document.createElement('div');
      scriptElement.id = footerId;
      scriptElement.innerHTML = footerCode;
      
      // Extract and execute script tags
      const scripts = scriptElement.querySelectorAll('script');
      scripts.forEach((script) => {
        const newScript = document.createElement('script');
        newScript.setAttribute('data-tracking-priority', priority);
        newScript.setAttribute('data-tracking-id', trackingId);
        
        // Copy attributes
        Array.from(script.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        
        // Copy content
        if (script.src) {
          // External script - just set src
          newScript.src = script.src;
          document.body.appendChild(newScript);
        } else {
          // Inline script - handle DOMContentLoaded properly
          const scriptContent = script.textContent || '';
          executeScriptContent(scriptContent, document.body, priority, trackingId);
        }
      });

      // Handle non-script elements
      const nonScripts = Array.from(scriptElement.children).filter(el => el.tagName !== 'SCRIPT');
      nonScripts.forEach((element) => {
        const clonedElement = element.cloneNode(true) as Element;
        clonedElement.setAttribute('data-tracking-priority', priority);
        clonedElement.setAttribute('data-tracking-id', trackingId);
        document.body.appendChild(clonedElement);
      });

      // Cleanup function
      return () => {
        const footerScript = document.getElementById(footerId);
        if (footerScript) {
          footerScript.remove();
        }
        
        // Remove any elements we added to body
        const addedElements = document.body.querySelectorAll(`[data-tracking-priority="${priority}"]`);
        addedElements.forEach((el) => el.remove());
      };
    } catch (error) {
      console.warn('Error executing footer tracking code:', error);
    }
  }, [footerCode, priority]);

  return null;
};