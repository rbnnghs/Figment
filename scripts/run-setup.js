#!/usr/bin/env node

/**
 * Wireframe MCP Setup Wrapper
 * 
 * This script can be run directly if the CLI commands aren't available:
 * node $(npm root -g)/wireframe-mcp/scripts/run-setup.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Wireframe MCP Setup Wrapper');
console.log('==============================\n');

// Find the setup script
const packageDir = path.dirname(__dirname);
const setupScript = path.join(packageDir, 'scripts', 'setup.js');

console.log('📦 Package directory:', packageDir);
console.log('🔧 Setup script:', setupScript);

// Run the setup script
const setupProcess = spawn('node', [setupScript], {
  stdio: 'inherit',
  cwd: packageDir
});

setupProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Setup completed successfully!');
  } else {
    console.log(`\n❌ Setup failed with code ${code}`);
    process.exit(code);
  }
});

setupProcess.on('error', (error) => {
  console.error('❌ Failed to run setup script:', error.message);
  process.exit(1);
});
