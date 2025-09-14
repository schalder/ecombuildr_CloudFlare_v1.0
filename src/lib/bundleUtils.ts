import * as fs from 'fs';
import * as path from 'path';

export interface AppBundle {
  cssFiles: string[];
  jsFiles: string[];
  preloadLinks: string;
}

export function readAppBundle(): AppBundle | null {
  try {
    const distPath = path.join(process.cwd(), 'dist');
    
    // Check if dist directory exists
    if (!fs.existsSync(distPath)) {
      console.warn('Dist directory not found. Run build first.');
      return null;
    }

    // Read the built index.html to extract asset references
    const indexPath = path.join(distPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      console.warn('Built index.html not found.');
      return null;
    }

    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    
    // Extract CSS and JS file references from index.html
    const cssMatches = indexContent.match(/<link[^>]*href="([^"]*\.css)"[^>]*>/g) || [];
    const jsMatches = indexContent.match(/<script[^>]*src="([^"]*\.js)"[^>]*>/g) || [];
    const preloadMatches = indexContent.match(/<link[^>]*rel="modulepreload"[^>]*>/g) || [];

    let cssFiles: string[] = [];
    let jsFiles: string[] = [];

    // Extract CSS file paths
    for (const cssMatch of cssMatches) {
      const hrefMatch = cssMatch.match(/href="([^"]*)"/);
      if (hrefMatch) {
        const cssFile = hrefMatch[1];
        cssFiles.push(cssFile);
      }
    }

    // Extract JS file paths (excluding page builder chunks for storefront)
    for (const jsMatch of jsMatches) {
      const srcMatch = jsMatch.match(/src="([^"]*)"/);
      if (srcMatch) {
        const jsFile = srcMatch[1];
        
        // Skip page builder chunks for storefront
        if (jsFile.includes('page-builder')) {
          continue;
        }
        
        jsFiles.push(jsFile);
      }
    }

    return {
      cssFiles,
      jsFiles,
      preloadLinks: preloadMatches.join('\n')
    };

  } catch (error) {
    console.error('Error reading app bundle:', error);
    return null;
  }
}

export function generateHydrationScript(pageData: any, contentType: string, contentId: string): string {
  return `
    <script>
      window.__HYDRATION_DATA__ = {
        pageData: ${JSON.stringify(pageData)},
        contentType: '${contentType}',
        contentId: '${contentId}',
        timestamp: ${Date.now()}
      };
      
      // Initialize React app hydration
      window.addEventListener('DOMContentLoaded', function() {
        // The React app will detect hydration data and hydrate accordingly
        if (window.__REACT_APP_LOADED__) {
          window.__REACT_APP_LOADED__();
        }
      });
    </script>
  `;
}