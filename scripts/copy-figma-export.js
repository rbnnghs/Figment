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

// Copy export data to MCP server location
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
    
  } catch (error) {
    console.error('❌ Error copying export data:', error);
  }
}

// If run directly, expect export data as command line argument
if (import.meta.url === `file://${process.argv[1]}`) {
  const exportDataArg = process.argv[2];
  const tokenArg = process.argv[3];
  
  if (exportDataArg && tokenArg) {
    try {
      const exportData = JSON.parse(exportDataArg);
      copyExportData(exportData, tokenArg);
    } catch (error) {
      console.error('❌ Error parsing export data:', error);
    }
  } else {
    console.log('Usage: node copy-figma-export.js <exportData> <token>');
  }
}

export { copyExportData };
