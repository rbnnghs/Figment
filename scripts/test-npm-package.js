#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

console.log('🧪 Testing NPM Package Setup');
console.log('============================\n');

// Test configuration
const PACKAGE_DIR = __dirname.replace('/scripts', '');
const MCP_SERVER_PATH = path.join(PACKAGE_DIR, 'dist', 'mcp-server.js');
const EXPORT_DIR = path.join(os.homedir(), '.figma-exports');
const CURSOR_MCP_CONFIG = path.join(os.homedir(), '.cursor', 'mcp.json');

function testFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    console.log(`❌ ${description}: ${filePath}`);
    return false;
  }
}

function testMCPConnection() {
  try {
    const result = execSync(`echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node ${MCP_SERVER_PATH}`, { encoding: 'utf8' });
    if (result.includes('"tools":[')) {
      console.log('✅ MCP server responding correctly');
      return true;
    } else {
      console.log('❌ MCP server response unexpected');
      return false;
    }
  } catch (error) {
    console.log('❌ MCP server test failed');
    return false;
  }
}

function testSetupScript() {
  try {
    execSync('node scripts/setup.js', { stdio: 'pipe' });
    console.log('✅ Setup script runs without errors');
    return true;
  } catch (error) {
    console.log('❌ Setup script failed');
    return false;
  }
}

function testMCPConfig() {
  if (!fs.existsSync(CURSOR_MCP_CONFIG)) {
    console.log('❌ MCP config file not found');
    return false;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(CURSOR_MCP_CONFIG, 'utf8'));
    const server = config.mcpServers?.['figma-figment-bridge'];
    
    if (server && server.command === 'node' && server.args?.[0] === MCP_SERVER_PATH) {
      console.log('✅ MCP configuration is correct');
      return true;
    } else {
      console.log('❌ MCP configuration is incorrect');
      return false;
    }
  } catch (error) {
    console.log('❌ MCP config file is invalid JSON');
    return false;
  }
}

// Run tests
console.log('📦 Package Structure Tests:');
testFileExists(MCP_SERVER_PATH, 'MCP server file');
testFileExists(path.join(PACKAGE_DIR, 'dist', 'package.json'), 'ES module package.json');
testFileExists(path.join(PACKAGE_DIR, 'scripts', 'setup.js'), 'Setup script');

console.log('\n🔧 Functionality Tests:');
const mcpWorks = testMCPConnection();
const setupWorks = testSetupScript();
const configWorks = testMCPConfig();

console.log('\n📁 Directory Tests:');
testFileExists(EXPORT_DIR, 'Export directory');

console.log('\n🎯 Summary:');
if (mcpWorks && setupWorks && configWorks) {
  console.log('✅ All tests passed! The npm package is ready for distribution.');
  console.log('\n📋 For end users:');
  console.log('1. npm install -g figment');
  console.log('2. figment-setup');
  console.log('3. Use Figma plugin + MCP tools');
} else {
  console.log('❌ Some tests failed. Please fix the issues before publishing.');
}
