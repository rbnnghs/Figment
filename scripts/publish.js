#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Publishing Wireframe CLI Package');
console.log('===================================\n');

function runCommand(command) {
  console.log(`📦 Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log('✅ Success');
  } catch (error) {
    console.error('❌ Failed');
    process.exit(1);
  }
}

function checkIfLoggedIn() {
  try {
    execSync('npm whoami', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Main publish process
async function main() {
  // Check if logged in to NPM
  if (!checkIfLoggedIn()) {
    console.error('❌ Not logged in to NPM');
    console.log('Please run: npm login');
    process.exit(1);
  }
  
  console.log('✅ Logged in to NPM');
  
  // Build the package
  console.log('\n🔨 Building package...');
  runCommand('npm run build');
  
  // Publish the package
  console.log('\n📤 Publishing to NPM...');
  runCommand('npm publish --access public');
  
  console.log('\n🎉 Package published successfully!');
  console.log('\n📋 Next Steps:');
  console.log('1. Test the published package: npm install -g wireframe-cli');
  console.log('2. Update documentation if needed');
  console.log('3. Share with users!');
}

// Run publish
main().catch(error => {
  console.error('❌ Publish failed:', error.message);
  process.exit(1);
});
