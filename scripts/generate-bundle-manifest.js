#!/usr/bin/env node

/**
 * Generate bundle manifest from built assets
 * This script reads the dist/index.html and extracts asset references
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readAppBundle } from '../src/lib/bundleUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateBundleManifest() {
  console.log('📋 Generating bundle manifest...');

  try {
    const bundle = readAppBundle();
    
    if (!bundle) {
      throw new Error('Failed to read app bundle from dist folder');
    }

    const manifest = {
      cssFiles: bundle.cssFiles,
      jsFiles: bundle.jsFiles,
      preloadLinks: bundle.preloadLinks,
      generatedAt: new Date().toISOString()
    };

    // Write manifest to dist folder
    const manifestPath = path.join(__dirname, '..', 'dist', 'bundle-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log('✅ Bundle manifest generated successfully');
    console.log(`   CSS files: ${manifest.cssFiles.length}`);
    console.log(`   JS files: ${manifest.jsFiles.length}`);
    
    return manifest;
  } catch (error) {
    console.error('❌ Failed to generate bundle manifest:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateBundleManifest();
}

export { generateBundleManifest };