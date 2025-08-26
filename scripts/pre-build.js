#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Pre-build checks...');

// Check Node.js version
const nodeVersion = process.version;
const requiredVersion = '22.0.0';
const currentVersion = nodeVersion.replace('v', '');

console.log(`📋 Current Node.js version: ${nodeVersion}`);
console.log(`📋 Required Node.js version: >=${requiredVersion}`);

if (compareVersions(currentVersion, requiredVersion) < 0) {
  console.error('❌ Node.js version check failed!');
  console.error(`   Current: ${currentVersion}`);
  console.error(`   Required: >=${requiredVersion}`);
  console.error('');
  console.error('💡 To fix this:');
  console.error('   1. Update Node.js to version 22 or higher');
  console.error('   2. Use nvm: nvm install 22 && nvm use 22');
  console.error('   3. Or download from: https://nodejs.org/');
  process.exit(1);
}

console.log('✅ Node.js version check passed');

// Check if dependencies are installed
const packageJsonPath = path.join(process.cwd(), 'package.json');
const nodeModulesPath = path.join(process.cwd(), 'node_modules');

if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

// Check for required dependencies
const requiredDeps = [
  '@create-figma-plugin/build',
  '@create-figma-plugin/utilities',
  '@create-figma-plugin/ui'
];

console.log('🔍 Checking required dependencies...');
for (const dep of requiredDeps) {
  const depPath = path.join(nodeModulesPath, dep);
  if (!fs.existsSync(depPath)) {
    console.error(`❌ Missing dependency: ${dep}`);
    console.log('📦 Reinstalling dependencies...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ Dependencies reinstalled');
    } catch (error) {
      console.error('❌ Failed to reinstall dependencies:', error.message);
      process.exit(1);
    }
    break;
  }
}

console.log('✅ All required dependencies found');

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

console.log('✅ Pre-build checks completed successfully');
