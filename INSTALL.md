# Figment MCP Plugin Installation

## Quick Start

1. **Install the npm package globally**
   ```bash
   npm install -g figment
   ```

2. **Run the automatic setup**
   ```bash
   figment-setup
   ```

This will automatically:
- ✅ Set up MCP server for Cursor, Claude Desktop, and Continue
- ✅ Create export directories
- ✅ Test the MCP connection
- ✅ Configure all necessary files

## Manual Installation

If you prefer manual setup:

1. **Install the npm package**
   ```bash
   npm install -g figment
   ```

2. **Set up MCP server manually**

   **For Cursor:**
   - Copy `docs/mcp/mcp-config.json` to `~/.cursor/mcp.json`
   - Or add the MCP server through Cursor's UI

   **For Claude Desktop:**
   - Copy `docs/mcp/mcp-config.json` to `~/.config/claude/mcp-servers/figma-figment-bridge.json`

   **For Continue:**
   - Copy `docs/mcp/mcp-config.json` to `~/.continue/config.json`

## Figma Plugin Setup

1. **Install the Figma plugin**
   - Open Figma
   - Go to Plugins > Browse plugins in Community
   - Search for "Figment MCP" and install

2. **Use the plugin**
   - Select a component in Figma
   - Run the Figment plugin
   - Click "⚡ Real-time Export"

## Verify Installation

After setup, you should see 5 MCP tools available in your AI assistant:
- `import_figma_wireframe`
- `extract_figma_design`
- `generate_code_from_blueprint`
- `analyze_design_system`
- `generate_component_code`

## Troubleshooting

**MCP tools not showing up?**
1. Restart your AI assistant
2. Check that the setup script ran successfully
3. Verify the MCP server is working: `figment --version`

**Need to reinstall?**
```bash
npm uninstall -g figment
npm install -g figment
figment-setup
```

## Support

If you encounter issues, check the troubleshooting section or open an issue on GitHub.
