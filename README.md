# Figment

**Universal Figma to Code Bridge with AI Integration**

Transform your Figma designs into production-ready code with the power of AI. Figment bridges the gap between design and development by providing a comprehensive design-to-code workflow that works with any IDE or development environment.

"Figment is not affiliated with, endorsed by, or sponsored by Figma, Inc."

[![Figma Plugin](https://img.shields.io/badge/Figma-Plugin-blue?logo=figma)](https://www.figma.com/community/plugin/1542156801194310914/figment)
[![npm version](https://img.shields.io/npm/v/figment-mcp.svg)](https://www.npmjs.com/package/figment-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://img.shields.io/badge/Node.js-22+-green.svg)](https://nodejs.org/)
[![MCP Integration](https://img.shields.io/badge/MCP-Integration-purple.svg)](https://modelcontextprotocol.io/)

## Quick Install

```bash
npx figment-mcp
```

## What is Figment?

Figment is a complete design-to-code solution that:

- **🎨 Extracts Design Systems** - Colors, typography, spacing, and components from Figma
- **🤖 AI-Powered Code Generation** - Generate React, Vue, and HTML with AI assistance
- **🔗 Universal IDE Integration** - Works with Cursor, Claude Desktop, Continue, and VS Code
- **⚡ Real-time Bridge** - Live connection between Figma and your development environment
- **♿ Accessibility First** - Generate accessible, semantic markup automatically

## One-Command Setup

```bash
# Install and configure everything
npx figment-mcp
```

This automatically:
- ✅ Installs the MCP server globally
- ✅ Configures all supported IDEs (Cursor, Claude, Continue)
- ✅ Sets up export directories
- ✅ Tests the connection

## Usage

1. **Install the Figma Plugin** from the Community
2. **Select components** in Figma
3. **Export with "⚡ Real-time Export"**
4. **Use AI tools** in your IDE to generate code

## Supported IDEs

- **Cursor** - Native MCP integration
- **Claude Desktop** - Full AI-powered workflow
- **Continue** - Seamless design-to-code pipeline
- **VS Code** - With MCP extension

## CLI Commands

```bash
figment              # Start MCP server
figment-setup        # Automated setup
figment-bridge       # Real-time bridge server
figment-setup-direct # Direct setup alternative
```

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## Installation

### Prerequisites

- **Node.js**: 22.0.0 or higher (required for @create-figma-plugin/build)
- **Figma**: Desktop app or web browser
- **Supported IDEs**: Cursor, Claude Desktop, Continue, VS Code with MCP extension

### Install Figment MCP

```bash
npx figment-mcp
```

### Install Figma Plugin

1. Open Figma
2. Go to **Plugins → Browse plugins in Community**
3. Search for **"Figment"** and install

### Alternative: Global Install

```bash
# If you prefer global installation
npm install -g figment-mcp
figment-setup
```

This will:
- ✅ Configure MCP for all supported IDEs
- ✅ Set up export directories (`~/.figma-exports/`)
- ✅ Test the connection
- ✅ Fix PATH issues if needed

## Troubleshooting

### Common Build Issues

#### Node.js Version Error
```
npm WARN EBADENGINE Unsupported engine {
  package: '@create-figma-plugin/build@4.0.3',
  required: { node: '>=22' },
  current: { node: 'v20.11.1', npm: '10.2.4' }
}
```

**Solution**: Update Node.js to version 22 or higher
```bash
# Using nvm (recommended)
nvm install 22
nvm use 22

# Or download from https://nodejs.org/
```

#### Missing Dependencies Error
```
error esbuild error
    Build failed with 1 error:
    src/main.ts:1:39: ERROR: Could not resolve "@create-figma-plugin/utilities"
```

**Solution**: Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

#### Build Process Fails
If the build process fails, try these steps in order:

1. **Check Node.js version**:
   ```bash
   node --version  # Should be >=22.0.0
   ```

2. **Clean and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Run pre-build checks**:
   ```bash
   node scripts/pre-build.js
   ```

4. **Build step by step**:
   ```bash
   npm run build:figma    # Build Figma plugin first
   npm run build:mcp      # Then build MCP server
   ```

### IDE Integration Issues

#### MCP Server Not Found
If your IDE can't find the MCP server:

1. **Check installation**:
   ```bash
   which figment
   figment --version
   ```

2. **Reinstall globally**:
   ```bash
   npm uninstall -g figment-mcp
   npm install -g figment-mcp
   ```

3. **Manual setup**:
   ```bash
   figment-setup-direct
   ```

#### Cursor Integration Issues
If Cursor doesn't recognize Figment:

1. **Check MCP config**:
   ```bash
   cat ~/.cursor/mcp.json
   ```

2. **Restart Cursor** after installation

3. **Manual config**:
   ```json
   {
     "mcpServers": {
       "figment": {
         "command": "figment",
         "args": []
       }
     }
   }
   ```

### Figma Plugin Issues

#### Plugin Not Loading
1. **Clear browser cache** and restart Figma
2. **Reinstall plugin** from the Community
3. **Check console** for error messages

#### Export Fails
1. **Select valid components** (Frames, Components, Groups)
2. **Check storage quota** in Figma
3. **Try simple export** first, then real-time export

### Getting Help

If you're still experiencing issues:

1. **Check the logs**:
   ```bash
   figment-bridge:logs
   ```

2. **Run diagnostics**:
   ```bash
   npm run test:package
   ```

3. **Open an issue** on GitHub with:
   - Node.js version: `node --version`
   - OS: `uname -a`
   - Error logs
   - Steps to reproduce

## Quick Start

### Basic Export (No Setup Required)

1. **Select a component** in Figma
2. **Run the Figment plugin**
3. **Click "Export Figment"** for immediate file download
4. **Use the exported JSON** in your development workflow

### AI-Powered Code Generation

1. **Install and setup**: `npx figment-mcp`
2. **Select components** in Figma
3. **Export with "⚡ Real-time Export"** in the plugin
4. **Use AI tools** in your IDE to generate production code

## Configuration

### MCP Server Configuration

Figment automatically configures MCP for supported IDEs:

- **Cursor**: `~/.cursor/mcp.json`
- **Claude Desktop**: `~/.config/claude/mcp-servers/`
- **Continue**: `~/.continue/config.json`

### Export Directory Structure

```
~/.figma-exports/
├── tokens.json              # Token mappings
├── latest-figment.json      # Latest export
└── real-time-export.json    # Real-time bridge data
```

### Environment Variables

```bash
# Bridge server port (default: 8473)
FIGMA_BRIDGE_PORT=8473

# Export directory (default: ~/.figma-exports)
FIGMA_EXPORT_DIR=/path/to/exports
```

## Usage

### CLI Commands

```bash
# Main MCP server
figment

# Automated setup
figment-setup

# Real-time bridge server
figment-bridge

# Direct setup (alternative)
figment-setup-direct
```

### Figma Plugin Interface

The plugin provides two main export modes:

1. **Simple Export**: Direct file download for immediate use
2. **Real-time Export**: Live connection for AI-powered code generation

### Design System Extraction

Figment automatically extracts:

- **Colors**: Hex values, RGB, HSL with semantic naming
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: Consistent spacing scale and values
- **Shadows**: Box shadows, drop shadows, and effects
- **Components**: Reusable components with variants and properties

### Code Generation

Generate production-ready code for:

- **React**: Functional components with hooks
- **Vue**: Single-file components with Composition API
- **HTML**: Semantic markup with accessibility features
- **CSS**: Modern CSS with custom properties

## API Reference

### MCP Tools

#### `figma_export_design`

Exports the latest Figma design data.

**Parameters:**
- `token` (string): Export token for authentication

**Returns:**
```json
{
  "designSystem": {
    "colors": [...],
    "typography": [...],
    "spacing": [...],
    "shadows": [...]
  },
  "components": [...],
  "metadata": {...}
}
```

#### `figma_generate_code`

Generates code from Figma design data.

**Parameters:**
- `component` (string): Component name or ID
- `framework` (string): Target framework (react, vue, html)
- `options` (object): Generation options

**Returns:**
```json
{
  "code": "string",
  "dependencies": [...],
  "metadata": {...}
}
```

### File Structure

```
figment-mcp/
├── dist/
│   ├── mcp-server.js        # MCP server
│   └── package.json         # ES module config
├── scripts/
│   ├── setup.js            # Automated setup
│   ├── figma-bridge.js     # Real-time bridge
│   └── build-mcp-server.js # Build script
├── src/
│   ├── main.ts             # Figma plugin entry
│   ├── ui.tsx              # React UI interface
│   ├── extractor.ts        # Design extraction engine
│   ├── mcp-server.ts       # MCP server implementation
│   └── types.ts            # TypeScript definitions
└── docs/
    └── mcp/
        └── mcp-config.json # MCP configuration examples
```

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/rbnnghs/Figment.git
cd Figment

# Install dependencies
npm install

# Build the project
npm run build

# Start development mode
npm run dev
```

### Project Structure

- **`src/main.ts`**: Figma plugin entry point
- **`src/ui.tsx`**: React-based user interface
- **`src/extractor.ts`**: Design system extraction engine
- **`src/mcp-server.ts`**: Model Context Protocol server
- **`scripts/`**: Build and utility scripts

### Testing

```bash
# Test MCP server
npm run test:mcp

# Test package installation
npm run test:package

# Test bridge functionality
npm run bridge:test
```

### Building

```bash
# Build everything
npm run build

# Build MCP server only
npm run build:mcp

# Watch mode for development
npm run dev
```

## Support

### Getting Help

- **Documentation**: [INSTALL.md](INSTALL.md) for detailed setup instructions
- **Issues**: [GitHub Issues](https://github.com/rbnnghs/Figment/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rbnnghs/Figment/discussions)

### Troubleshooting

**Common Issues:**

1. **"Command not found"**: Run `figment-setup` and restart your terminal
2. **MCP connection failed**: Check IDE configuration in `~/.cursor/mcp.json`
3. **Export directory missing**: Run `figment-setup` to create directories
4. **Plugin not working**: Ensure you're using the latest version from Figma Community

**Debug Mode:**

```bash
# Enable debug logging
DEBUG=figment:* figment

# Check export directory
ls ~/.figma-exports/

# Verify MCP configuration
cat ~/.cursor/mcp.json
```

### System Requirements

- **Node.js**: 20.0.0 or higher
- **Operating Systems**: macOS, Linux, Windows
- **Figma**: Desktop app or web browser
- **Memory**: 512MB RAM minimum
- **Disk Space**: 100MB for installation

## License

MIT License - see [LICENSE](LICENSE) for details.

Copyright (c) 2025 Robin Naghshbandi

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Acknowledgments

- **Created by**: [Robin Naghshbandi](https://github.com/rbnnghs)
- **Built with**: [@create-figma-plugin/build](https://github.com/yuanqing/create-figma-plugin)
- **Powered by**: [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- **Inspired by**: The Figma community and design system best practices
