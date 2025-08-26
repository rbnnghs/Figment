#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🧹 Figma Plugin Storage Cleanup Tool');
console.log('====================================');
console.log('');

const EXPORT_DIR = path.join(os.homedir(), '.figma-exports');

// Check if export directory exists
if (!fs.existsSync(EXPORT_DIR)) {
  console.log('📁 Export directory does not exist:', EXPORT_DIR);
  console.log('✅ No cleanup needed');
  process.exit(0);
}

// List files in export directory
const files = fs.readdirSync(EXPORT_DIR);
console.log(`📁 Found ${files.length} files in export directory:`);

files.forEach(file => {
  const filePath = path.join(EXPORT_DIR, file);
  const stats = fs.statSync(filePath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  console.log(`  📄 ${file} (${sizeKB} KB)`);
});

console.log('');

// Ask for confirmation
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('🗑️ Do you want to delete all files? (y/N): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('🗑️ Deleting files...');
    
    files.forEach(file => {
      const filePath = path.join(EXPORT_DIR, file);
      try {
        fs.unlinkSync(filePath);
        console.log(`  ✅ Deleted: ${file}`);
      } catch (error) {
        console.log(`  ❌ Failed to delete: ${file} - ${error.message}`);
      }
    });
    
    console.log('');
    console.log('✅ Storage cleanup completed!');
    console.log('💡 You can now restart the Figma plugin');
  } else {
    console.log('❌ Cleanup cancelled');
  }
  
  rl.close();
});
