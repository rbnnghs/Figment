#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Post-build: Ensuring manifest.json is up to date...');

// Copy manifest to build directory
const buildDir = path.join(process.cwd(), 'build');
const manifestSrc = path.join(process.cwd(), 'manifest.json');
const manifestDest = path.join(buildDir, 'manifest.json');

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

if (fs.existsSync(manifestSrc)) {
  console.log('📋 Copying manifest.json to build directory...');
  fs.copyFileSync(manifestSrc, manifestDest);
  console.log('✅ Manifest copied to build directory');
  
  // Verify the copy was successful
  if (fs.existsSync(manifestDest)) {
    const manifestContent = fs.readFileSync(manifestDest, 'utf8');
    if (manifestContent.includes('"localhost:8473"')) {
      console.log('✅ Manifest verification passed - correct allowedDomains found');
    } else {
      console.warn('⚠️  Manifest verification failed - allowedDomains may be incorrect');
    }
  }
} else {
  console.error('❌ manifest.json not found in root directory');
  process.exit(1);
}

console.log('✅ Post-build completed successfully');
