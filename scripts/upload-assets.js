#!/usr/bin/env node

/**
 * Upload built assets to Supabase asset-storage function
 * This script runs after the build process to upload CSS/JS files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://fhqwacmokbtbspkxjixf.supabase.co';
const ASSET_STORAGE_URL = `${SUPABASE_URL}/functions/v1/asset-storage`;

async function uploadAsset(fileName, content, contentType) {
  console.log(`📦 Uploading ${fileName} (${content.length} bytes)`);
  
  try {
    const response = await fetch(ASSET_STORAGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        content,
        contentType
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    console.log(`✅ Uploaded ${fileName} successfully`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to upload ${fileName}:`, error.message);
    throw error;
  }
}

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case '.css': return 'text/css';
    case '.js': return 'application/javascript';
    case '.json': return 'application/json';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.svg': return 'image/svg+xml';
    case '.woff': return 'font/woff';
    case '.woff2': return 'font/woff2';
    case '.ttf': return 'font/ttf';
    default: return 'application/octet-stream';
  }
}

async function uploadAssetsFromDist() {
  const distPath = path.join(__dirname, '..', 'dist');
  const assetsPath = path.join(distPath, 'assets');

  if (!fs.existsSync(distPath)) {
    console.error('❌ Dist directory not found. Run build first.');
    process.exit(1);
  }

  if (!fs.existsSync(assetsPath)) {
    console.error('❌ Assets directory not found in dist.');
    process.exit(1);
  }

  console.log('🚀 Starting asset upload to Supabase...');

  try {
    const uploadPromises = [];
    
    // Upload bundle manifest first
    const manifestPath = path.join(distPath, 'bundle-manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      uploadPromises.push(uploadAsset('bundle-manifest.json', manifestContent, 'application/json'));
    }

    // Upload all asset files
    const assetFiles = fs.readdirSync(assetsPath);
    for (const fileName of assetFiles) {
      const filePath = path.join(assetsPath, fileName);
      const stats = fs.statSync(filePath);

      if (stats.isFile()) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const contentType = getContentType(fileName);
        
        // Upload with assets/ prefix to match expected paths
        uploadPromises.push(uploadAsset(`assets/${fileName}`, content, contentType));
      }
    }

    await Promise.all(uploadPromises);
    console.log(`✅ Successfully uploaded ${uploadPromises.length} assets!`);

  } catch (error) {
    console.error('❌ Asset upload failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  uploadAssetsFromDist();
}

export { uploadAssetsFromDist };