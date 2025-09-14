#!/usr/bin/env node

/**
 * Complete build and asset upload process
 * This runs the full build pipeline including asset upload
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { uploadAssetsFromDist } from './upload-assets.js';

const execAsync = promisify(exec);

async function buildAndUpload() {
  console.log('🏗️  Starting build process...');

  try {
    // Run the build
    console.log('📦 Building React app...');
    await execAsync('npm run build', { cwd: process.cwd() });
    console.log('✅ Build completed successfully');

    // Upload assets to Supabase
    console.log('☁️  Uploading assets to Supabase...');
    await uploadAssetsFromDist();
    console.log('✅ Assets uploaded successfully');

    console.log('🎉 Build and upload completed!');

  } catch (error) {
    console.error('❌ Build and upload failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildAndUpload();
}

export { buildAndUpload };