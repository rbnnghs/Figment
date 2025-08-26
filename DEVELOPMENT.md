# Development Setup Guide

This guide helps developers set up the Figment project for local development and avoid common build issues.

## Prerequisites

### Node.js Version
**Required**: Node.js 22.0.0 or higher

The `@create-figma-plugin/build` package requires Node.js >=22. If you're using an older version, you'll see this error:

```
npm WARN EBADENGINE Unsupported engine {
  package: '@create-figma-plugin/build@4.0.3',
  required: { node: '>=22' },
  current: { node: 'v20.11.1', npm: '10.2.4' }
}
```

**To update Node.js**:

```bash
# Using nvm (recommended)
nvm install 22
nvm use 22

# Or download from https://nodejs.org/
```

### Verify Installation
```bash
node --version  # Should show v22.x.x
npm --version   # Should show 10.x.x or higher
```

## Development Setup

### 1. Clone and Install
```bash
git clone https://github.com/rbnnghs/Figment.git
cd Figment
npm install
```

### 2. Pre-build Checks
Before building, run the pre-build checks:
```bash
node scripts/pre-build.js
```

This script will:
- ✅ Verify Node.js version
- ✅ Check for required dependencies
- ✅ Install missing dependencies if needed

### 3. Build the Project
```bash
npm run build
```

This runs:
1. `node scripts/pre-build.js` - Pre-build checks
2. `npm run build:figma` - Build Figma plugin
3. `npm run build:mcp` - Build MCP server

## Build Process

### Figma Plugin Build
The Figma plugin build process:
1. Uses `@create-figma-plugin/build` to compile TypeScript
2. Bundles the plugin for Figma's sandboxed environment
3. Outputs to `dist/` directory

### MCP Server Build
The MCP server build process:
1. Compiles TypeScript to ES modules
2. Creates executable MCP server
3. Outputs to `dist/mcp-server.js`

## Development Workflow

### Watch Mode
For development with auto-rebuild:
```bash
npm run dev
```

### Testing
```bash
# Test MCP server
npm run test:mcp

# Test package installation
npm run test:package

# Test bridge functionality
npm run bridge:test
```

### Debugging

#### Figma Plugin
1. Open Figma
2. Go to Plugins → Development → Import plugin from manifest
3. Select `manifest.json` from the project root
4. Use browser dev tools to debug

#### MCP Server
```bash
# Start MCP server in debug mode
DEBUG=* figment

# Test with JSON-RPC
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | figment
```

## Common Issues and Solutions

### Build Fails with Dependency Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Run pre-build checks
node scripts/pre-build.js
```

### TypeScript Compilation Errors
```bash
# Check TypeScript config
npx tsc --noEmit

# Fix type issues
npx tsc --noEmit --skipLibCheck
```

### Figma Plugin Not Loading
1. Check browser console for errors
2. Verify manifest.json is valid
3. Clear browser cache and restart Figma

### MCP Server Not Starting
```bash
# Check if executable
ls -la dist/mcp-server.js

# Make executable if needed
chmod +x dist/mcp-server.js

# Test manually
node dist/mcp-server.js
```

## Project Structure

```
Figment/
├── src/                    # Source code
│   ├── main.ts            # Figma plugin entry
│   ├── ui.tsx             # Plugin UI
│   ├── mcp-server.ts      # MCP server
│   ├── extractor.ts       # Design extraction
│   └── types.ts           # TypeScript types
├── scripts/               # Build and utility scripts
│   ├── pre-build.js       # Pre-build checks
│   ├── build-mcp-server.js # MCP build script
│   └── setup.js           # Setup script
├── dist/                  # Build output
├── docs/                  # Documentation
└── package.json           # Dependencies and scripts
```

## Contributing

### Before Submitting PR
1. ✅ Run pre-build checks: `node scripts/pre-build.js`
2. ✅ Build successfully: `npm run build`
3. ✅ All tests pass: `npm run test:package`
4. ✅ Code follows project style

### Development Commands
```bash
npm run build          # Full build
npm run dev            # Watch mode
npm run test:mcp       # Test MCP server
npm run bridge:test    # Test bridge
npm run publish-package # Publish to npm
```

## Troubleshooting

### Still Having Issues?
1. Check the [main README troubleshooting section](../README.md#troubleshooting)
2. Run diagnostics: `npm run test:package`
3. Check logs: `npm run bridge:logs`
4. Open an issue with:
   - Node.js version: `node --version`
   - OS: `uname -a`
   - Error logs
   - Steps to reproduce
