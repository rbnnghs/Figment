#!/usr/bin/env node

/**
 * Quick Setup for Figment MCP
 * 
 * Run with: npx figment@latest
 * 
 * This script automatically:
 * 1. Downloads and installs the latest version
 * 2. Runs the setup
 * 3. Configures everything
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🚀 Figment MCP Quick Setup');
console.log('============================\n');

async function quickSetup() {
  try {
    // Check if package is already installed globally
    let isInstalled = false;
    try {
      execSync('npm list -g figment', { stdio: 'pipe' });
      isInstalled = true;
    } catch (error) {
      // Package not installed
    }

    if (!isInstalled) {
      console.log('📦 Installing Figment MCP...');
      execSync('npm install -g figment@latest', { stdio: 'inherit' });
      console.log('✅ Installation complete!\n');
    } else {
      console.log('✅ Figment MCP already installed\n');
    }

    // Run the setup script
    console.log('🔧 Running setup...');
    const setupScript = path.join(__dirname, 'setup.js');
    execSync(`node "${setupScript}"`, { stdio: 'inherit' });

    console.log('\n🎉 Quick setup complete!');
    console.log('💡 You can now use: figment-setup');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n💡 Try running manually:');
    console.log('npm install -g figment@latest');
          console.log('figment-setup');
    process.exit(1);
  }
}

quickSetup();
