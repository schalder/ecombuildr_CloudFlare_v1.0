import { useEffect } from 'react';
import { useHeadStyle } from '@/hooks/useHeadStyle';

interface TrackingCodeManagerProps {
  headerCode?: string;
  footerCode?: string;
  priority?: 'page' | 'funnel' | 'website' | 'store';
}

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
      
      // Clean existing script for this priority level
      const existingScript = document.getElementById(headerId);
      if (existingScript) {
        existingScript.remove();
      }

      // Create script element
      const scriptElement = document.createElement('div');
      scriptElement.id = headerId;
      scriptElement.innerHTML = headerCode;
      
      // Extract and execute script tags
      const scripts = scriptElement.querySelectorAll('script');
      scripts.forEach((script) => {
        const newScript = document.createElement('script');
        
        // Copy attributes
        Array.from(script.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        
        // Copy content
        if (script.src) {
          newScript.src = script.src;
        } else {
          newScript.textContent = script.textContent;
        }
        
        document.head.appendChild(newScript);
      });

      // Handle non-script elements (meta tags, links, etc.)
      const nonScripts = Array.from(scriptElement.children).filter(el => el.tagName !== 'SCRIPT');
      nonScripts.forEach((element) => {
        const clonedElement = element.cloneNode(true);
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
      
      // Clean existing script for this priority level
      const existingScript = document.getElementById(footerId);
      if (existingScript) {
        existingScript.remove();
      }

      // Create script element
      const scriptElement = document.createElement('div');
      scriptElement.id = footerId;
      scriptElement.innerHTML = footerCode;
      
      // Extract and execute script tags
      const scripts = scriptElement.querySelectorAll('script');
      scripts.forEach((script) => {
        const newScript = document.createElement('script');
        
        // Copy attributes
        Array.from(script.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        
        // Copy content
        if (script.src) {
          newScript.src = script.src;
        } else {
          newScript.textContent = script.textContent;
        }
        
        // Add to end of body
        document.body.appendChild(newScript);
      });

      // Handle non-script elements
      const nonScripts = Array.from(scriptElement.children).filter(el => el.tagName !== 'SCRIPT');
      nonScripts.forEach((element) => {
        const clonedElement = element.cloneNode(true);
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