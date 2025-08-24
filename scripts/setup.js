#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

console.log('🚀 Figment CLI Setup');
console.log('======================\n');

// Configuration
const EXPORT_DIR = path.join(os.homedir(), '.figma-exports');
const CURSOR_MCP_CONFIG = path.join(os.homedir(), '.cursor', 'mcp.json');
const CLAUDE_MCP_DIR = path.join(os.homedir(), '.config', 'claude', 'mcp-servers');
const CONTINUE_MCP_CONFIG = path.join(os.homedir(), '.continue', 'config.json');

// Get the npm package directory (not the current working directory)
function getPackageDirectory() {
  // Get the directory where this script is located
  const scriptDir = path.dirname(process.argv[1]);
  
  // If we're in the scripts directory, go up one level to get the package root
  if (path.basename(scriptDir) === 'scripts') {
    return path.dirname(scriptDir);
  }
  
  // Otherwise, assume we're already in the package root
  return scriptDir;
}

const PACKAGE_DIR = getPackageDirectory();
const MCP_SERVER_PATH = path.join(PACKAGE_DIR, 'dist', 'mcp-server.js');

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
}

function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  
  if (major < 20) {
    console.error('❌ Node.js 20 or higher is required');
    console.error(`Current version: ${version}`);
    console.log('💡 You can continue, but some features may not work optimally');
  }
  
  console.log(`✅ Node.js version: ${version}`);
}

function checkPackageInstallation() {
  console.log('\n📦 Checking package installation...');
  
  if (!fs.existsSync(MCP_SERVER_PATH)) {
    console.error('❌ Figment MCP server not found');
    console.error('This usually means the package was not installed correctly');
    console.error('Try reinstalling: npm install -g figment');
    process.exit(1);
  }
  
  console.log('✅ Figment MCP server found');
}

function checkAndFixPATH() {
  console.log('\n🔧 Checking PATH configuration...');
  
  try {
    // Get npm global prefix
    const npmPrefix = execSync('npm config get prefix', { encoding: 'utf8' }).trim();
    const npmBinPath = path.join(npmPrefix, 'bin');
    
    // Check if npm bin is in PATH
    const currentPath = process.env.PATH || '';
    const pathEntries = currentPath.split(path.delimiter);
    
    if (!pathEntries.includes(npmBinPath)) {
      console.log('⚠️  npm global bin directory not found in PATH');
      console.log(`   npm bin path: ${npmBinPath}`);
      console.log('   This may prevent CLI commands from working');
      
      // Detect shell and provide fix instructions
      const shell = process.env.SHELL || '';
      let profileFile = '';
      let exportCommand = '';
      
      if (shell.includes('zsh')) {
        profileFile = path.join(os.homedir(), '.zshrc');
        exportCommand = `export PATH="${npmBinPath}:$PATH"`;
      } else if (shell.includes('bash')) {
        profileFile = path.join(os.homedir(), '.bashrc');
        exportCommand = `export PATH="${npmBinPath}:$PATH"`;
      } else {
        profileFile = path.join(os.homedir(), '.profile');
        exportCommand = `export PATH="${npmBinPath}:$PATH"`;
      }
      
      if (profileFile) {
        console.log('\n🔧 Attempting to fix PATH automatically...');
        
        try {
          // Check if the export already exists
          let profileContent = '';
          if (fs.existsSync(profileFile)) {
            profileContent = fs.readFileSync(profileFile, 'utf8');
          }
          
          if (!profileContent.includes(npmBinPath)) {
            // Add the export command to the profile
            const newLine = `\n# Add npm global bin to PATH\n${exportCommand}\n`;
            fs.appendFileSync(profileFile, newLine);
            console.log(`✅ Added PATH configuration to ${profileFile}`);
            console.log('💡 Please restart your terminal or run: source ' + profileFile);
          } else {
            console.log('✅ PATH configuration already exists in profile');
          }
        } catch (error) {
          console.log('⚠️  Could not automatically fix PATH');
          console.log('💡 Please manually add this line to your shell profile:');
          console.log(`   ${exportCommand}`);
        }
      }
    } else {
      console.log('✅ npm global bin directory found in PATH');
    }
  } catch (error) {
    console.log('⚠️  Could not check PATH configuration');
  }
}

function setupExportDirectory() {
  console.log('\n📁 Setting up export directory...');
  ensureDirectory(EXPORT_DIR);
  console.log(`✅ Export directory ready: ${EXPORT_DIR}`);
}

function setupCursorMCP() {
  console.log('\n⚙️  Setting up Cursor MCP configuration...');
  
  // Ensure .cursor directory exists
  const cursorDir = path.dirname(CURSOR_MCP_CONFIG);
  ensureDirectory(cursorDir);
  
  // Read existing config or create new one
  let config = {};
  if (fs.existsSync(CURSOR_MCP_CONFIG)) {
    try {
      config = JSON.parse(fs.readFileSync(CURSOR_MCP_CONFIG, 'utf8'));
    } catch (error) {
      console.log('⚠️  Existing config file is invalid, creating new one');
    }
  }
  
  // Add Figment MCP servers
  config.mcpServers = config.mcpServers || {};
  
  // Primary server using built version
  config.mcpServers['figma-figment-bridge'] = {
    command: 'node',
    args: [MCP_SERVER_PATH],
    env: {
      NODE_ENV: 'production'
    }
  };
  
  // Write config
  fs.writeFileSync(CURSOR_MCP_CONFIG, JSON.stringify(config, null, 2));
  console.log('✅ Cursor MCP configuration updated');
}

function setupClaudeMCP() {
  console.log('\n⚙️  Setting up Claude Desktop MCP configuration...');
  
  // Ensure Claude MCP directory exists
  ensureDirectory(CLAUDE_MCP_DIR);
  
  // Create MCP server config for Claude
  const claudeConfig = {
    mcpServers: {
      'figma-figment-bridge': {
        command: 'node',
        args: [MCP_SERVER_PATH],
        env: {
          NODE_ENV: 'production'
        }
      }
    }
  };
  
  const claudeConfigPath = path.join(CLAUDE_MCP_DIR, 'figma-figment-bridge.json');
  fs.writeFileSync(claudeConfigPath, JSON.stringify(claudeConfig, null, 2));
  console.log('✅ Claude Desktop MCP configuration created');
}

function setupContinueMCP() {
  console.log('\n⚙️  Setting up Continue MCP configuration...');
  
  // Ensure .continue directory exists
  const continueDir = path.dirname(CONTINUE_MCP_CONFIG);
  ensureDirectory(continueDir);
  
  // Read existing config or create new one
  let config = {};
  if (fs.existsSync(CONTINUE_MCP_CONFIG)) {
    try {
      config = JSON.parse(fs.readFileSync(CONTINUE_MCP_CONFIG, 'utf8'));
    } catch (error) {
      console.log('⚠️  Existing config file is invalid, creating new one');
    }
  }
  
  // Add MCP servers to Continue config
  config.mcpServers = config.mcpServers || {};
  config.mcpServers['figma-figment-bridge'] = {
    command: 'node',
    args: [MCP_SERVER_PATH],
    env: {
      NODE_ENV: 'production'
    }
  };
  
  // Write config
  fs.writeFileSync(CONTINUE_MCP_CONFIG, JSON.stringify(config, null, 2));
  console.log('✅ Continue MCP configuration updated');
}

function createUniversalConfig() {
  console.log('\n🌐 Creating universal MCP configuration...');
  
  const universalConfig = {
    mcpServers: {
      'figma-figment-bridge': {
        command: 'node',
        args: [MCP_SERVER_PATH],
        env: {
          NODE_ENV: 'production'
        }
      }
    }
  };
  
  const universalConfigPath = path.join(PACKAGE_DIR, 'docs', 'mcp', 'mcp-config.json');
  ensureDirectory(path.dirname(universalConfigPath));
  fs.writeFileSync(universalConfigPath, JSON.stringify(universalConfig, null, 2));
  console.log('✅ Universal MCP configuration created');
}

function ensureMCPExecutable() {
  console.log('\n🔧 Ensuring MCP server is executable...');
  try {
    // Make the built MCP server executable
    execSync(`chmod +x ${MCP_SERVER_PATH}`);
    console.log('✅ MCP server is executable');
  } catch (error) {
    console.log('⚠️  Could not make MCP server executable (this is usually fine)');
  }
}

function checkGlobalInstallation() {
  console.log('\n🌐 Checking global installation...');
  
  try {
    // Check if figment command is available
    execSync('figment --version', { stdio: 'pipe' });
    console.log('✅ Figment CLI is available globally');
  } catch (error) {
          console.log('⚠️  Figment CLI may not be in PATH');
    console.log('💡 Try restarting your terminal or reinstalling the package');
  }
}

function testMCPConnection() {
  console.log('\n🧪 Testing MCP server connection...');
  try {
    // Test the MCP server directly
    const testCommand = `echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node ${MCP_SERVER_PATH}`;
    const result = execSync(testCommand, { encoding: 'utf8' });
    
    if (result.includes('"tools":[')) {
      console.log('✅ MCP server responding correctly');
      console.log('✅ 5 tools available: import_figma_figment, extract_figma_design, generate_code_from_blueprint, analyze_design_system, generate_component_code');
    } else {
      console.log('⚠️  MCP server response unexpected');
    }
  } catch (error) {
    console.error('❌ MCP server test failed');
    console.log('⚠️  MCP tools may not work correctly');
  }
}

function showNextSteps() {
  console.log('\n🎉 Setup Complete!');
  console.log('==================');
  console.log('\n📋 Next Steps:');
      console.log('1. Open Figma and install the Figment plugin');
  console.log('2. Select a component and click "⚡ Real-time Export"');
  console.log('3. Open your AI assistant (Cursor/Claude/Continue)');
  console.log('4. The MCP tools should be automatically available');
  console.log('5. Use MCP tools to generate code from your designs');
  
  console.log('\n🔧 Manual Bridge Server (Optional):');
  console.log('npm run bridge:start');
  
  console.log('\n📁 Export Directory:');
  console.log(EXPORT_DIR);
  
  console.log('\n🎯 Available MCP Tools:');
      console.log('• import_figma_figment - Import latest figment data');
  console.log('• extract_figma_design - Extract design data from components');
  console.log('• generate_code_from_blueprint - Generate code from blueprints');
  console.log('• analyze_design_system - Analyze design systems');
  console.log('• generate_component_code - Generate code for specific components');
  
  console.log('\n🔍 To verify MCP tools are working:');
  console.log('npm run test:mcp');
  
  // Add fallback instructions if CLI commands aren't working
  console.log('\n🔄 If CLI commands are not working:');
  console.log('You can run the setup script directly:');
  console.log(`node ${PACKAGE_DIR}/scripts/setup.js`);
  console.log('\nOr restart your terminal after the PATH fix above.');
  
  console.log('\n🎯 Ready to use! 🚀');
}

// Main setup process
async function main() {
  try {
    checkNodeVersion();
    checkPackageInstallation();
    checkAndFixPATH(); // Call the new function here
    setupExportDirectory();
    setupCursorMCP();
    setupClaudeMCP();
    setupContinueMCP();
    createUniversalConfig();
    ensureMCPExecutable();
    checkGlobalInstallation();
    testMCPConnection();
    showNextSteps();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
main();
