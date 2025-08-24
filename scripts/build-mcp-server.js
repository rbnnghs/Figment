#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Building MCP server...');

const outputPath = path.join(process.cwd(), 'dist', 'mcp-server.js');

// Ensure dist directory exists
if (!fs.existsSync(path.join(process.cwd(), 'dist'))) {
  fs.mkdirSync(path.join(process.cwd(), 'dist'), { recursive: true });
}

try {
  console.log('Compiling TypeScript to JavaScript...');
  
  // Use tsc to compile the MCP server to ES modules
  execSync('npx tsc src/mcp-server.ts --outDir dist --target es2022 --module esnext --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck', {
    stdio: 'inherit'
  });
  
  // Create package.json for ES module support
  const packageJson = {
    type: 'module'
  };
  fs.writeFileSync(path.join(process.cwd(), 'dist', 'package.json'), JSON.stringify(packageJson, null, 2));
  
  // Make it executable
  fs.chmodSync(outputPath, '755');
  
  console.log('✅ MCP server built successfully at:', outputPath);
} catch (error) {
  console.error('❌ Error building MCP server:', error);
  process.exit(1);
}
