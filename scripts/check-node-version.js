#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Node.js Version Check for Figment');
console.log('=====================================');

const nodeVersion = process.version;
const requiredVersion = '22.0.0';
const currentVersion = nodeVersion.replace('v', '');

console.log(`📋 Current Node.js version: ${nodeVersion}`);
console.log(`📋 Required Node.js version: >=${requiredVersion}`);

if (compareVersions(currentVersion, requiredVersion) >= 0) {
  console.log('✅ Node.js version is compatible!');
  console.log('   You can now run: npm run build');
  process.exit(0);
}

console.log('❌ Node.js version is too old for Figment');
console.log('');

// Check if nvm is available
let nvmAvailable = false;
try {
  execSync('nvm --version', { stdio: 'ignore' });
  nvmAvailable = true;
} catch (error) {
  // nvm not available
}

if (nvmAvailable) {
  console.log('💡 Quick fix with nvm:');
  console.log('');
  console.log('   1. Install Node.js 22:');
  console.log('      nvm install 22');
  console.log('');
  console.log('   2. Use Node.js 22:');
  console.log('      nvm use 22');
  console.log('');
  console.log('   3. Set as default (optional):');
  console.log('      nvm alias default 22');
  console.log('');
  console.log('   4. Verify installation:');
  console.log('      node --version');
  console.log('');
  console.log('   5. Then run:');
  console.log('      npm run build');
} else {
  console.log('💡 To upgrade Node.js:');
  console.log('');
  console.log('   1. Download from https://nodejs.org/');
  console.log('      (Choose LTS version 22.x.x)');
  console.log('');
  console.log('   2. Or install nvm first:');
  console.log('      curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash');
  console.log('');
  console.log('   3. Then follow the nvm instructions above');
}

console.log('');
console.log('📚 For more help, see:');
console.log('   - README.md#troubleshooting');
console.log('   - DEVELOPMENT.md');

// Helper function to compare versions
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}
