#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// MCP server expected locations
const EXPORT_DIR = path.join(os.homedir(), '.figma-exports');
const REAL_TIME_EXPORT_FILE = path.join(EXPORT_DIR, 'real-time-export.json');
const TOKENS_FILE = path.join(EXPORT_DIR, 'tokens.json');

// Ensure export directory exists
function ensureExportDirectory() {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
    console.log('✅ Created export directory:', EXPORT_DIR);
  }
}

// Manual copy function - you can call this with your export data
function copyExportData(exportData, token) {
  try {
    ensureExportDirectory();
    
    // Save real-time export data
    const realTimeExport = {
      wireframe: exportData,
      token: token,
      exportedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(REAL_TIME_EXPORT_FILE, JSON.stringify(realTimeExport, null, 2));
    console.log('✅ Saved real-time export to:', REAL_TIME_EXPORT_FILE);
    
    // Update tokens file
    let tokens = {};
    if (fs.existsSync(TOKENS_FILE)) {
      tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
    }
    
    tokens[token] = {
      component: exportData,
      created: new Date().toISOString(),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
    console.log('✅ Updated tokens file:', TOKENS_FILE);
    
    console.log('✅ Export data copied successfully!');
    console.log('📋 Component IDs:', exportData.components?.map(comp => comp.id) || []);
    console.log('🎫 Token:', token);
    
  } catch (error) {
    console.error('❌ Error copying export data:', error);
  }
}

// Example usage - replace with your actual export data
const exampleExportData = {
  metadata: {
    figmaFileId: "your-file-id",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    pluginVersion: "1.0.0"
  },
  designSystem: {
    colors: [],
    typography: [],
    spacing: [],
    shadows: []
  },
  components: [
    {
      id: "10:1953",
      name: "Dark Mode=False, Action Count=2 Actions (Vertical)",
      type: "component",
      props: {},
      styling: {},
      accessibility: {},
      codeHints: {}
    }
  ],
  context: {
    aiPrompts: [],
    implementationNotes: [],
    designIntent: ""
  }
};

const exampleToken = "figma_memz8pi6_842039";

// Uncomment the line below to copy the example data
// copyExportData(exampleExportData, exampleToken);

console.log('📋 Manual Export Copy Script');
console.log('📁 MCP Server Location:', EXPORT_DIR);
console.log('');
console.log('To use this script:');
console.log('1. Replace exampleExportData with your actual export data');
console.log('2. Replace exampleToken with your actual token');
console.log('3. Uncomment the copyExportData line below');
console.log('4. Run: node scripts/manual-export-copy.js');
console.log('');
console.log('Or call copyExportData(exportData, token) directly');

export { copyExportData };
