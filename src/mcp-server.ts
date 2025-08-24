#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Enhanced design data interface
interface FigmentExport {
  figment?: {
    metadata: {
      figmaFileId: string;
      timestamp: string;
      version: string;
      pluginVersion: string;
    };
    designSystem: {
      colors: any[];
      typography: any[];
      spacing: any[];
      shadows: any[];
      breakpoints?: any[];
    };
    components: Array<{
      id?: string;
      component?: string;
      cleanName?: string;
      name?: string;
      type?: string;
      props?: any;
      styling?: any;
      accessibility?: any;
      enhancedVisuals?: any;
      children?: any[];
      screenshot?: string; // Base64 encoded PNG screenshot
      codeHints?: {
        suggestedFramework: string[];
        complexity: 'simple' | 'medium' | 'complex';
        dependencies: string[];
      };
    }>;
    context: {
      aiPrompts: string[];
      implementationNotes: string[];
      designIntent: string;
    };
  };
  components?: Array<{
    id: string;
    name: string;
    type: string;
    props: any;
    styling: any;
    accessibility: any;
    screenshot?: string; // Base64 encoded PNG screenshot
    codeHints: {
      suggestedFramework: string[];
      complexity: 'simple' | 'medium' | 'complex';
      dependencies: string[];
    };
  }>;
  context?: {
    aiPrompts: string[];
    implementationNotes: string[];
    designIntent: string;
  };
  token?: string;
  exportedAt?: string;
}

const server = new Server(
  {
    name: 'figma-figment-bridge',
    version: '1.0.0',
  }
);

// Token-based communication setup
const EXPORT_DIR = path.join(os.homedir(), '.figma-exports');
const TOKENS_FILE = path.join(EXPORT_DIR, 'tokens.json');
const LATEST_EXPORT_FILE = path.join(EXPORT_DIR, 'latest-figment.json');

// Ensure export directory exists
function ensureExportDirectory() {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }
}

// Generate unique token
function generateToken(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `figma_${timestamp}_${random}`;
}

// Save token mapping
function saveTokenMapping(token: string, componentData: any) {
  try {
    ensureExportDirectory();
    let tokens: Record<string, any> = {};
    
    if (fs.existsSync(TOKENS_FILE)) {
      tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
    }
    
    tokens[token] = {
      component: componentData,
      created: new Date().toISOString(),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
  } catch (error) {
    console.error('Error saving token mapping:', error);
  }
}

// Get component from figment data
function getComponentFromFigment(componentId: string): any {
  try {
    console.log('🔍 Searching for component:', componentId);
    
    // Check real-time export first
    const realTimeData = readRealTimeExport();
    console.log('🔍 Real-time data structure:', {
      hasData: !!realTimeData,
              hasFigment: !!(realTimeData && realTimeData.figment),
    hasComponents: !!(realTimeData && realTimeData.figment && realTimeData.figment.components),
    figmentKeys: realTimeData?.figment ? Object.keys(realTimeData.figment) : 'no figment'
  });
  if (realTimeData && realTimeData.figment && realTimeData.figment.components) {
      console.log('🔍 Checking real-time export for component:', componentId);
          console.log('🔍 Components array length:', realTimeData.figment.components.length);
    console.log('🔍 Available components:', realTimeData.figment.components.map((c: any) => ({ component: c.component, cleanName: c.cleanName, id: c.id })));
    const component = realTimeData.figment.components.find((comp: any) => {
        const matches = comp.id === componentId || 
                       comp.component === componentId ||
                       comp.cleanName === componentId ||
                       comp.tokenId === componentId ||
                       comp.name === componentId;
        console.log(`🔍 Comparing "${componentId}" with:`, {
          id: comp.id,
          component: comp.component,
          cleanName: comp.cleanName,
          tokenId: comp.tokenId,
          name: comp.name,
          matches
        });
        return matches;
      });
      if (component) {
        console.log('✅ Found component in real-time export:', componentId);
        return component;
      } else {
        console.log('❌ Component not found in real-time export:', componentId);
      }
    }
    
    // Check latest figment
    const figmentData = readLatestFigment();
    if (figmentData && figmentData.components) {
      console.log('🔍 Checking latest figment for component:', componentId);
      const component = figmentData.components.find((comp: any) => 
        comp.id === componentId || 
        comp.component === componentId ||
        comp.cleanName === componentId ||
        comp.tokenId === componentId ||
        comp.name === componentId
      );
      if (component) {
        console.log('✅ Found component in latest figment:', componentId);
        return component;
      } else {
        console.log('❌ Component not found in latest figment:', componentId);
      }
    }
    
    console.log('❌ Component not found anywhere:', componentId);
    return null;
  } catch (error) {
    console.error('❌ Error reading figment component:', error);
    return null;
  }
}

// Get list of available components
function getAvailableComponents(): any[] {
  try {
    const components: any[] = [];
    
    // Check real-time export first
    const realTimeData = readRealTimeExport();
    if (realTimeData && realTimeData.figment && realTimeData.figment.components) {
      console.log('📋 Found components in real-time export:', realTimeData.figment.components.length);
      components.push(...realTimeData.figment.components.map((comp: any) => ({
        id: comp.id || comp.tokenId || comp.component || comp.cleanName,
        name: comp.component || comp.cleanName || comp.name,
        type: comp.suggestedComponentType || 'component',
        tokenId: comp.tokenId,
        originalId: comp.id
      })));
    }
    
    // Check latest figment if no real-time data
    if (components.length === 0) {
      const figmentData = readLatestFigment();
      if (figmentData && figmentData.components) {
        console.log('📋 Found components in latest figment:', figmentData.components.length);
        components.push(...figmentData.components.map((comp: any) => ({
          id: comp.id,
          name: comp.name,
          type: comp.type
        })));
      }
    }
    
    if (components.length === 0) {
      console.log('❌ No components found in any export data');
    } else {
      console.log('✅ Available components:', components.map(c => `${c.name} (${c.id})`));
    }
    
    return components;
  } catch (error) {
    console.error('❌ Error getting available components:', error);
    return [];
  }
}

// Get component data by token
function getComponentByToken(token: string): any {
  try {
    // Check if token exists in tokens file
    if (!fs.existsSync(TOKENS_FILE)) {
      console.log('❌ No tokens file found');
      return null;
    }
    
    const tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
    const tokenData = tokens[token];
    
    if (!tokenData) {
      console.log('❌ Token not found:', token);
      return null;
    }
    
    // Check if token is expired
    if (new Date(tokenData.expires) < new Date()) {
      console.log('❌ Token expired:', token);
      delete tokens[token];
      fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
      return null;
    }
    
    console.log('✅ Token found and valid:', token);
    return tokenData.component;
  } catch (error) {
    console.error('❌ Error reading token mapping:', error);
    return null;
  }
}

// Process a new token from Figma export
function processFigmaToken(token: string, componentData: any): boolean {
  try {
    ensureExportDirectory();
    
    const tokenData = {
      component: componentData,
      created: new Date().toISOString(),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    
    let tokens: Record<string, any> = {};
    
    if (fs.existsSync(TOKENS_FILE)) {
      tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
    }
    
    tokens[token] = tokenData;
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
    
    console.log(`Token ${token} processed and saved successfully`);
    return true;
  } catch (error) {
    console.error('Error processing token:', error);
    return false;
  }
}



// Read real-time export data
function readRealTimeExport(): FigmentExport | null {
  try {
    // Check for real-time export data in the expected location
    const realTimeFile = path.join(EXPORT_DIR, 'real-time-export.json');
    console.log('🔍 Looking for real-time export at:', realTimeFile);
    console.log('🔍 Export directory exists:', fs.existsSync(EXPORT_DIR));
    console.log('🔍 Real-time file exists:', fs.existsSync(realTimeFile));
    
    if (!fs.existsSync(realTimeFile)) {
      console.log('❌ No real-time export file found at:', realTimeFile);
      return null;
    }
    
    const data = fs.readFileSync(realTimeFile, 'utf8');
    const exportData = JSON.parse(data);
    console.log('✅ Real-time export data found:', exportData.figment ? 'Yes' : 'No');
    
    if (exportData.figment && exportData.figment.components) {
      console.log('📋 Available component IDs:', exportData.figment.components.map((comp: any) => comp.id));
    }
    
    return exportData;
  } catch (error) {
    console.error('❌ Error reading real-time export:', error);
    return null;
  }
}

// Read latest figment export
function readLatestFigment(): FigmentExport | null {
  try {
    if (fs.existsSync(LATEST_EXPORT_FILE)) {
      const data = fs.readFileSync(LATEST_EXPORT_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading figment export:', error);
  }
  return null;
}

// Tool: Enhanced Figma → Code workflow with real data
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
              name: 'import_figma_figment',
      description: 'Import the latest figment design data from Figma plugin export',
        inputSchema: {
          type: 'object',
          properties: {
            refresh: {
              type: 'boolean',
              description: 'Force refresh of the latest export file',
              default: false
            }
          }
        }
      },
      {
        name: 'extract_figma_design',
        description: 'Extract comprehensive design data from a Figma component blueprint',
        inputSchema: {
          type: 'object',
          properties: {
            component_data: {
              type: 'object',
              description: 'The Figma component data to extract design information from'
            }
          },
          required: ['component_data']
        }
      },
      {
        name: 'generate_code_from_blueprint',
        description: 'Generate code implementation from a Figma component blueprint',
        inputSchema: {
          type: 'object',
          properties: {
            blueprint: {
              type: 'object',
              description: 'The component blueprint containing design data'
            },
            framework: {
              type: 'string',
              description: 'Target framework (react, vue, svelte, html, etc.)',
              default: 'react'
            }
          },
          required: ['blueprint']
        }
      },
      {
              name: 'analyze_design_system',
      description: 'Analyze the design system from the latest figment export',
        inputSchema: {
          type: 'object',
          properties: {
            aspect: {
              type: 'string',
              description: 'Aspect to analyze (colors, typography, spacing, all)',
              enum: ['colors', 'typography', 'spacing', 'all'],
              default: 'all'
            }
          }
        }
      },
      {
              name: 'generate_component_code',
      description: 'Generate code for a specific component from the figment',
        inputSchema: {
          type: 'object',
          properties: {
            componentId: {
              type: 'string',
              description: 'ID of the component to generate code for'
            },
            framework: {
              type: 'string',
              description: 'Target framework (react, vue, svelte, html, etc.)',
              default: 'react'
            }
          },
          required: ['componentId']
        }
      },
      {
        name: 'debug_component_matching',
        description: 'Debug component matching and show all available component data',
        inputSchema: {
          type: 'object',
          properties: {
            componentId: {
              type: 'string',
              description: 'Optional component ID to debug specifically'
            }
          }
        }
      },
      {
        name: 'extract_screenshot_files',
        description: 'Extract screenshot files from a token and save them as PNG files',
        inputSchema: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'Token to extract screenshots from'
            }
          },
          required: ['token']
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error('No arguments provided');
  }

  switch (name) {
          case 'import_figma_figment':
        return await importFigmaFigment(args.refresh as boolean || false);
    
    case 'extract_figma_design':
      return await extractFigmaDesign(args.component_data as any);
    
    case 'extract_screenshot_files':
      return await extractScreenshotFilesFromToken(args.token as string);
    
    case 'generate_code_from_blueprint':
      return await generateCodeFromBlueprint(
        args.blueprint as any,
        (args.framework as string) || 'react'
      );
    
    case 'generate_component_code':
      return await generateComponentCode(
        args.componentId as string,
        (args.framework as string) || 'react'
      );
    
    case 'analyze_design_system':
      return await analyzeDesignSystem(args.aspect as string || 'all');
    
    case 'debug_component_matching':
      return await debugComponentMatching(args.componentId as string);
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function importFigmaFigment(refresh: boolean = false) {
  try {
    ensureExportDirectory();
    
    // Check for real-time export data first
    const realTimeData = readRealTimeExport();
    const figmentData = realTimeData || readLatestFigment();
    
    if (!figmentData) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ **No Figma designs found**\n\n**Setup:**\n1. Export from Figma plugin → "⚡ Real-time Export"\n2. Or save to `~/.figma-exports/latest-figment.json`\n\n**Then:** Run `import_figma_figment` again'
          }
        ]
      };
    }

    const data = figmentData.figment || figmentData;
    const { metadata, designSystem, components, context } = data as any;

    let output = `📦 **Figma Figment Imported**\n\n`;
    output += `**Project:** ${metadata?.figmaFileId || 'N/A'} | v${metadata?.version || 'N/A'}\n`;
    output += `**Components:** ${components?.length || 0} total (${components?.filter((c: any) => c.type !== 'page' && !c.name?.toLowerCase().includes('page')).length || 0} UI)\n`;
    output += `**Design System:** ${designSystem?.colors?.length || 0} colors, ${designSystem?.typography?.length || 0} fonts, ${designSystem?.spacing?.length || 0} spacing, ${designSystem?.shadows?.length || 0} shadows\n`;
    output += `**Context:** ${context?.aiPrompts?.length || 0} prompts, ${context?.implementationNotes?.length || 0} notes\n\n`;
    output += `**Available Actions:**\n`;
    output += `• \`generate_component_code\` - Generate React/Vue/HTML from any component\n`;
    output += `• \`analyze_design_system\` - View design tokens and system details\n`;
    output += `• \`extract_figma_design\` - Get detailed component data (includes screenshots)\n\n`;
    output += `*Updated: ${new Date(metadata?.timestamp || Date.now()).toLocaleString()}*`;

    return {
      content: [
        {
          type: 'text',
          text: output
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Import failed:** ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ]
    };
  }
}

async function extractFigmaDesign(componentData: any) {
  try {
    // Check if we have a token in the component data
    if (componentData.token) {
      // Try to get the actual component data from the token
      const actualData = getComponentByToken(componentData.token);
      if (actualData) {
        componentData = actualData;
      }
    }
    
    // If componentData is still a token string, try to resolve it
    if (typeof componentData === 'string' && componentData.startsWith('figma_')) {
      const actualData = getComponentByToken(componentData);
      if (actualData) {
        componentData = actualData;
      }
    }
    
    // Ensure we have valid component data
    if (!componentData || !componentData.component) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Invalid component data provided**\n\n` +
                   `Please ensure you're passing valid Figma component data or a valid token.`
          }
        ]
      };
    }
    
    const component = componentData.component;
    const name = component.component || component.name || 'Unknown Component';
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ **Successfully extracted design data for "${name}"**

**Component Details:**
- **Type:** ${component.type || 'component'}
- **Size:** ${component.size?.width || 'auto'} × ${component.size?.height || 'auto'}
- **Layout System:** ${component.layout?.autoLayout?.enabled ? 'auto-layout' : 'standard'}
- **Colors:** ${component.enhancedVisuals?.fills?.length || 0} defined
- **Typography:** ${component.preciseTypography ? 'Advanced' : 'Basic'} styles
- **Accessibility:** ${component.semantic?.role ? 'Configured' : 'Not configured'}
- **Responsive:** ${component.responsive ? 'Yes' : 'No'}
- **Screenshot:** ${component.screenshot ? 'Available (PNG)' : 'Not available'}

**Raw Data:**
\`\`\`json
${JSON.stringify(componentData, null, 2)}
\`\`\`

**Extracted at:** ${new Date().toISOString()}
**Source:** Figma Figment Plugin`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error extracting Figma design: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ]
    };
  }
}

async function generateCodeFromBlueprint(blueprint: any, framework: string = 'react') {
  try {
    // Ensure we have valid blueprint data
    if (!blueprint || !blueprint.component) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Invalid blueprint data provided**\n\n` +
                   `Please ensure you're passing valid Figma component blueprint data.`
          }
        ]
      };
    }
    
    const component = blueprint.component;
    const name = component.component || component.name || 'Component';
    const className = name.replace(/[^a-zA-Z0-9]/g, '');
    
    let code = '';
    const fileExtension = framework === 'html' ? 'html' : 'jsx';
    
    switch (framework.toLowerCase()) {
      case 'react':
        code = generateReactComponentCode(component, className);
        break;
      case 'vue':
        code = generateVueComponentCode(component, className);
        break;
      case 'html':
        code = generateHTMLComponentCode(component, className);
        break;
      default:
        code = generateReactComponentCode(component, className);
    }

    return {
      content: [
        {
          type: 'text',
          text: `✅ **Generated ${framework} component from blueprint**

**Component:** ${name}
**File:** \`${className}.${fileExtension}\`

\`\`\`${framework === 'html' ? 'html' : 'jsx'}
${code}
\`\`\`

**Component Details:**
- **Type:** ${component.type || 'component'}
- **Size:** ${component.size?.width || 'auto'} × ${component.size?.height || 'auto'}
- **Styling:** ${Object.keys(component.enhancedVisuals || {}).length} style properties
- **Framework:** ${framework}

**Next Steps:**
1. Save this code to your project
2. Install any required dependencies
3. Import and use the component

*Blueprint-based code generation provides the most accurate component implementation!*`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error generating code from blueprint: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ]
    };
  }
}

async function generateComponentCode(componentId: string, framework: string = 'react') {
  try {
    console.log('🎯 Generating code for component ID:', componentId);
    
    // First try to get component from figment data
    let componentData = getComponentFromFigment(componentId);
    
    // If not found in figment, try token-based lookup
    if (!componentData) {
      console.log('🔍 Trying token-based lookup for:', componentId);
      componentData = getComponentByToken(componentId);
    }
    
    if (componentData) {
      console.log('✅ Found component data:', {
        name: componentData.name,
        type: componentData.type,
        hasEnhancedVisuals: !!componentData.enhancedVisuals,
        hasChildren: componentData.children?.length || 0,
        stylingKeys: Object.keys(componentData.styling || {}).length
      });
    }
    
    if (!componentData) {
      // Get list of available components for error message
      const availableComponents = getAvailableComponents();
      const availableList = availableComponents.length > 0 
        ? availableComponents.map(comp => `- ${comp.name} (${comp.id})`).join('\n')
        : '- No components available';
        
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Component not found:** \`${componentId}\`\n\n**Available:**\n${availableList}\n\n**Tip:** Use token from Figma export or check available components above`
          }
        ]
      };
    }

    const name = componentData.name || componentData.component || componentData.cleanName || 'Component';
    let className = name.replace(/[^a-zA-Z0-9]/g, '') || 'Component';
    
    // Ensure component name starts with a capital letter and doesn't start with a number
    if (/^\d/.test(className)) {
      className = 'Component' + className;
    }
    if (!/^[A-Z]/.test(className)) {
      className = className.charAt(0).toUpperCase() + className.slice(1);
    }
    
    let code = '';
    const fileExtension = 'jsx'; // Always generate JSX for now
    
    switch (framework.toLowerCase()) {
      case 'react':
        code = generateReactComponentCode(componentData, className);
        break;
      case 'vue':
        code = generateVueComponentCode(componentData, className);
        break;
      case 'html':
        code = generateHTMLComponentCode(componentData, className);
        break;
      default:
        code = generateReactComponentCode(componentData, className);
    }

    // Enhanced component information
    const semanticInfo = componentData.semantic ? {
      role: componentData.semantic.role || 'div',
      isInteractive: componentData.semantic.isInteractive || false,
      isContainer: componentData.semantic.isContainer || false,
      hasHoverState: componentData.semantic.hasHoverState || false
    } : null;
    
    const figmaInfo = componentData.componentRelationships?.mainComponent ? {
      isInstance: true,
      mainComponent: componentData.componentRelationships.mainComponent.name
    } : null;
    
    const designSystemInfo = componentData.designTokens ? {
      hasTokens: true,
      tokenCount: Object.keys(componentData.designTokens).length
    } : null;

    return {
      content: [
        {
          type: 'text',
          text: `⚡ **${framework.toUpperCase()} Component Generated**

**Component:** \`${className}\` (${name})
**Token:** \`${componentId}\` (24h expiry)
${semanticInfo ? `**Semantic:** ${semanticInfo.role}${semanticInfo.isInteractive ? ' (interactive)' : ''}${semanticInfo.hasHoverState ? ' (hover states)' : ''}` : ''}
${figmaInfo ? `**Figma:** Instance of "${figmaInfo.mainComponent}"` : ''}
${designSystemInfo ? `**Design System:** ${designSystemInfo.tokenCount} tokens` : ''}
**Screenshot:** ${componentData.screenshot ? 'Available (PNG)' : 'Not available'}

\`\`\`${framework === 'html' ? 'html' : 'jsx'}
${code}
\`\`\`

**Specs:** ${componentData.type || 'component'} | ${componentData.props?.width || 'auto'}×${componentData.props?.height || 'auto'} | ${Object.keys(componentData.styling || {}).length} styles
${componentData.children?.length ? `**Children:** ${componentData.children.length} nested components` : ''}

**Usage:** Save as \`${className}.${fileExtension}\` and import into your project.
${componentData.screenshot ? '\n**📸 Visual Reference:** Screenshot included in component data for design comparison.' : ''}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Generation failed:** ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ]
    };
  }
}

async function analyzeDesignSystem(aspect: string = 'all') {
  try {
    const figmentData = readLatestFigment();
    
    if (!figmentData) {
      return {
        content: [
          {
            type: 'text',
            text: '📋 **No Figma designs available**\n\nPlease use `import_figma_figment` first to load your designs from Figma.'
          }
        ]
      };
    }

    const data = figmentData.figment || figmentData;
    const { designSystem } = data as any;

    let output = `🎨 **Design System**\n\n`;

    if (aspect === 'all' || aspect === 'colors') {
      output += `**Colors (${designSystem?.colors?.length || 0}):**\n`;
      if (designSystem?.colors?.length) {
        designSystem.colors.forEach((color: any) => {
          output += `- **${color.name}** (${color.value})\n`;
        });
      } else {
        output += '- No colors defined\n';
      }
      output += '\n';
    }

    if (aspect === 'all' || aspect === 'typography') {
      output += `**Typography (${designSystem?.typography?.length || 0}):**\n`;
      if (designSystem?.typography?.length) {
        designSystem.typography.forEach((typography: any) => {
          output += `- **${typography.name}** (${typography.value})\n`;
        });
      } else {
        output += '- No typography defined\n';
      }
      output += '\n';
    }

    if (aspect === 'all' || aspect === 'spacing') {
      output += `**Spacing (${designSystem?.spacing?.length || 0}):**\n`;
      if (designSystem?.spacing?.length) {
        designSystem.spacing.forEach((spacing: any) => {
          output += `- **${spacing.name}** (${spacing.value})\n`;
        });
      } else {
        output += '- No spacing defined\n';
      }
      output += '\n';
    }

    output += `**Update Flow:**\n`;
    output += `1. Modify in Figma → Export → \`import_figma_figment\` → \`generate_component_code\`\n\n`;
    output += `**Commands:** \`generate_component_code\` | \`import_figma_figment\``;

    return {
      content: [
        {
          type: 'text',
          text: output
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Analysis failed:** ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ]
    };
  }
}

async function debugComponentMatching(componentId?: string) {
  try {
    let output = `🔧 **Debug: Component Matching**\n\n`;
    
    // Check real-time export
    const realTimeData = readRealTimeExport();
    if (realTimeData && realTimeData.figment && realTimeData.figment.components) {
      output += `**Real-time Export Data:**\n`;
      output += `- Components found: ${realTimeData.figment.components.length}\n`;
      output += `- Token: ${realTimeData.token || 'None'}\n\n`;
      
      output += `**Available Components:**\n`;
      realTimeData.figment.components.forEach((comp: any, index: number) => {
        output += `${index + 1}. **${comp.component || comp.name || 'Unnamed'}**\n`;
        output += `   - ID: ${comp.id || 'None'}\n`;
        output += `   - Component: ${comp.component || 'None'}\n`;
        output += `   - Clean Name: ${comp.cleanName || 'None'}\n`;
        output += `   - Token ID: ${comp.tokenId || 'None'}\n`;
        output += `   - Has Enhanced Visuals: ${!!comp.enhancedVisuals}\n`;
        output += `   - Screenshot: ${comp.screenshot ? 'Available (PNG)' : 'Not available'}\n`;
        output += `   - Type: ${comp.suggestedComponentType || 'Unknown'}\n`;
        if (comp.size) {
          output += `   - Size: ${comp.size.width}x${comp.size.height}\n`;
        }
        output += `\n`;
      });
    } else {
      output += `**Real-time Export Data:** None found\n\n`;
    }
    
    // Check tokens
    if (fs.existsSync(TOKENS_FILE)) {
      const tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
      const tokenKeys = Object.keys(tokens);
      output += `**Token Storage:**\n`;
      output += `- Total tokens: ${tokenKeys.length}\n`;
      output += `- Recent tokens: ${tokenKeys.slice(-5).join(', ')}\n\n`;
      
      if (componentId && tokens[componentId]) {
        output += `**Token "${componentId}" Data:**\n`;
        const tokenData = tokens[componentId];
        output += `- Created: ${tokenData.created}\n`;
        output += `- Expires: ${tokenData.expires}\n`;
        output += `- Component Name: ${tokenData.component?.component || tokenData.component?.name || 'Unknown'}\n`;
        output += `- Has Enhanced Visuals: ${!!tokenData.component?.enhancedVisuals}\n`;
        output += `- Screenshot: ${tokenData.component?.screenshot ? 'Available (PNG)' : 'Not available'}\n\n`;
      }
    } else {
      output += `**Token Storage:** No tokens file found\n\n`;
    }
    
    if (componentId) {
      output += `**Matching Test for "${componentId}":**\n`;
      const foundComponent = getComponentFromFigment(componentId);
      if (foundComponent) {
        output += `✅ Component found!\n`;
        output += `- Name: ${foundComponent.component || foundComponent.name}\n`;
        output += `- Type: ${foundComponent.suggestedComponentType}\n`;
        output += `- Has Enhanced Visuals: ${!!foundComponent.enhancedVisuals}\n`;
        output += `- Screenshot: ${foundComponent.screenshot ? 'Available (PNG)' : 'Not available'}\n`;
      } else {
        output += `❌ Component not found\n`;
        
        // Try token lookup
        const tokenComponent = getComponentByToken(componentId);
        if (tokenComponent) {
          output += `✅ Found via token lookup!\n`;
          output += `- Name: ${tokenComponent.component || tokenComponent.name}\n`;
        } else {
          output += `❌ Not found via token lookup either\n`;
        }
      }
    }
    
    return {
      content: [
        {
          type: 'text',
          text: output
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ Debug error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ]
    };
  }
}

// Code generation functions
function generateReactComponentCode(component: any, className: string): string {
  // Handle both direct component data and nested component structures
  const actualComponent = component;
  const { name, styling, props, codeHints, enhancedVisuals, designTokens, size, position, children, precisePosition, layout, semantic, figmaMetadata } = actualComponent;
  
  console.log('🎨 Generating code for component:', {
    name: actualComponent.component || actualComponent.name,
    hasEnhancedVisuals: !!enhancedVisuals,
    enhancedVisualsKeys: enhancedVisuals ? Object.keys(enhancedVisuals) : [],
    hasSize: !!size,
    hasPrecisePosition: !!precisePosition,
    isInteractive: semantic?.isInteractive,
    role: semantic?.role
  });
  
  // Extract styling from enhancedVisuals if available
  const visualStyles = enhancedVisuals ? extractStylesFromEnhancedVisuals(enhancedVisuals) : {};
  const combinedStyles = { ...visualStyles, ...styling };
  
  // Get dimensions from multiple possible sources to handle various data structures
  const width = size?.width || 
                enhancedVisuals?.renderBounds?.width || 
                precisePosition?.visualBounds?.width ||
                layout?.size?.width || 
                actualComponent.size?.width ||
                'auto';
  const height = size?.height || 
                 enhancedVisuals?.renderBounds?.height || 
                 precisePosition?.visualBounds?.height ||
                 layout?.size?.height ||
                 actualComponent.size?.height ||
                 'auto';
  
  // Generate child components if they exist
  const childComponents = children && children.length > 0 ? generateChildComponents(children, className) : '';
  const childElements = children && children.length > 0 ? generateChildElements(children) : '{children}';
  
  // Determine the appropriate HTML element based on semantic role
  const semanticRole = semantic?.role || 'div';
  const isInteractive = semantic?.isInteractive || false;
  const isContainer = semantic?.isContainer || false;
  
  // Generate appropriate props based on component type
  const componentProps = [];
  if (isInteractive) {
    componentProps.push('onClick?: () => void;');
    componentProps.push('onMouseEnter?: () => void;');
    componentProps.push('onMouseLeave?: () => void;');
  }
  if (semanticRole === 'button') {
    componentProps.push('type?: "button" | "submit" | "reset";');
    componentProps.push('disabled?: boolean;');
  }
  
  // Generate accessibility attributes
  const accessibilityProps = [];
  if (semanticRole === 'button') {
    accessibilityProps.push('role="button"');
    accessibilityProps.push('tabIndex={0}');
  }
  if (isInteractive) {
    accessibilityProps.push('onKeyDown={(e) => e.key === "Enter" && onClick?.()}');
  }
  
  return `import React from 'react';
import './${className}.css';

${childComponents}

interface ${className}Props {
  ${Object.keys(props || {}).map(prop => `${prop}?: ${getTypeForProp(prop, props[prop])};`).join('\n  ')}
  ${componentProps.join('\n  ')}
  children?: React.ReactNode;
  className?: string;
}

export const ${className}: React.FC<${className}Props> = ({ 
  ${Object.keys(props || {}).join(',\n  ')},
  ${isInteractive ? 'onClick, onMouseEnter, onMouseLeave,' : ''}
  children, 
  className = '' 
}) => {
  return (
    <${semanticRole === 'button' ? 'button' : 'div'} 
      className={\`${className.toLowerCase()}-component \${className}\`}
      ${accessibilityProps.join('\n      ')}
      ${isInteractive ? 'onClick={onClick}' : ''}
      ${isInteractive ? 'onMouseEnter={onMouseEnter}' : ''}
      ${isInteractive ? 'onMouseLeave={onMouseLeave}' : ''}
      style={{
        width: ${typeof width === 'number' ? `'${width}px'` : width === 'auto' ? "'auto'" : `'${width}'`},
        height: ${typeof height === 'number' ? `'${height}px'` : height === 'auto' ? "'auto'" : `'${height}'`},
        position: 'relative',
        ${Object.entries(combinedStyles).map(([key, value]) => `${key}: '${value}'`).join(',\n        ')}
      }}
    >
      ${childElements}
    </${semanticRole === 'button' ? 'button' : 'div'}>
  );
};

export default ${className};`;
}

function generateVueComponentCode(component: any, className: string): string {
  const { name, styling, props, codeHints, enhancedVisuals, size } = component;
  
  // Extract styling from enhancedVisuals if available
  const visualStyles = enhancedVisuals ? extractStylesFromEnhancedVisuals(enhancedVisuals) : {};
  const combinedStyles = { ...visualStyles, ...styling };
  
  // Get dimensions from size or enhancedVisuals
  const width = size?.width || enhancedVisuals?.renderBounds?.width || 'auto';
  const height = size?.height || enhancedVisuals?.renderBounds?.height || 'auto';
  
  return `<template>
  <div 
    class="${className.toLowerCase()}-component"
    :style="componentStyles"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  ${Object.keys(props || {}).map(prop => `${prop}?: ${typeof props[prop]};`).join('\n  ')}
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  ${Object.keys(props || {}).map(prop => `${prop}: undefined`).join(',\n  ')},
  className: ''
});

const componentStyles = computed(() => ({
  width: '${width}px',
  height: '${height}px',
  ${Object.entries(combinedStyles).map(([key, value]) => `${key}: '${value}'`).join(',\n  ')}
}));
</script>

<style scoped>
.${className.toLowerCase()}-component {
  /* Component styles will be applied via inline styles */
}
</style>`;
}

function generateHTMLComponentCode(component: any, className: string): string {
  const { name, styling, props, codeHints, enhancedVisuals, size } = component;
  
  // Extract styling from enhancedVisuals if available
  const visualStyles = enhancedVisuals ? extractStylesFromEnhancedVisuals(enhancedVisuals) : {};
  const combinedStyles = { ...visualStyles, ...styling };
  
  // Get dimensions from size or enhancedVisuals
  const width = size?.width || enhancedVisuals?.renderBounds?.width || 'auto';
  const height = size?.height || enhancedVisuals?.renderBounds?.height || 'auto';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <style>
    .${className.toLowerCase()}-component {
      width: ${width}px;
      height: ${height}px;
      ${Object.entries(combinedStyles).map(([key, value]) => `${key}: ${value};`).join('\n      ')}
    }
  </style>
</head>
<body>
  <div class="${className.toLowerCase()}-component">
    <!-- Component content goes here -->
  </div>
</body>
</html>`;
}

function generateChildComponents(children: any[], parentClassName: string): string {
  return children.map((child, index) => {
    const childName = child.name || child.component || `Child${index + 1}`;
    const childClassName = `${parentClassName}${childName.replace(/[^a-zA-Z0-9]/g, '')}`;
    const childStyles = child.enhancedVisuals ? extractStylesFromEnhancedVisuals(child.enhancedVisuals) : {};
    
    return `const ${childClassName}: React.FC = () => {
  return (
    <div 
      style={{
        position: 'absolute',
        left: '${child.position?.x || 0}px',
        top: '${child.position?.y || 0}px',
        width: '${child.size?.width || 'auto'}px',
        height: '${child.size?.height || 'auto'}px',
        ${Object.entries(childStyles).map(([key, value]) => `${key}: '${value}'`).join(',\n        ')}
      }}
    />
  );
};`;
  }).join('\n\n');
}

function generateChildElements(children: any[]): string {
  return children.map((child, index) => {
    const childName = child.name || child.component || `Child${index + 1}`;
    const childClassName = `${childName.replace(/[^a-zA-Z0-9]/g, '')}`;
    return `<${childClassName} />`;
  }).join('\n      ');
}

function extractStylesFromEnhancedVisuals(enhancedVisuals: any): any {
  const styles: any = {};
  
  console.log('🎨 Extracting styles from enhancedVisuals:', {
    hasFills: !!(enhancedVisuals.fills && enhancedVisuals.fills.length > 0),
    hasStrokes: !!(enhancedVisuals.strokes && enhancedVisuals.strokes.length > 0),
    hasEffects: !!(enhancedVisuals.effects && enhancedVisuals.effects.length > 0),
    hasBorderRadius: !!enhancedVisuals.borderRadius,
    opacity: enhancedVisuals.opacity
  });
  
  // Extract fills (backgrounds)
  if (enhancedVisuals.fills && enhancedVisuals.fills.length > 0) {
    const fill = enhancedVisuals.fills[0];
    if (fill.visible) {
      if (fill.type === 'SOLID') {
        styles.backgroundColor = fill.color;
        if (fill.opacity !== 1) {
          styles.backgroundColor = fill.color.replace('1)', `${fill.opacity})`);
        }
      } else if (fill.type === 'GRADIENT_LINEAR') {
        styles.background = `linear-gradient(${fill.gradientTransform || 'to bottom'}, ${fill.gradientStops?.map(stop => `${stop.color} ${stop.position}%`).join(', ')})`;
      }
    }
  }
  
  // Extract border radius
  if (enhancedVisuals.borderRadius) {
    if (enhancedVisuals.borderRadius.uniform) {
      styles.borderRadius = `${enhancedVisuals.borderRadius.uniform}px`;
    } else if (enhancedVisuals.borderRadius.topLeft || enhancedVisuals.borderRadius.topRight || enhancedVisuals.borderRadius.bottomLeft || enhancedVisuals.borderRadius.bottomRight) {
      styles.borderRadius = `${enhancedVisuals.borderRadius.topLeft || 0}px ${enhancedVisuals.borderRadius.topRight || 0}px ${enhancedVisuals.borderRadius.bottomRight || 0}px ${enhancedVisuals.borderRadius.bottomLeft || 0}px`;
    }
  }
  
  // Extract strokes
  if (enhancedVisuals.strokes && enhancedVisuals.strokes.length > 0) {
    const stroke = enhancedVisuals.strokes[0];
    if (stroke.visible) {
      const strokeColor = stroke.opacity !== 1 ? stroke.color.replace('1)', `${stroke.opacity})`) : stroke.color;
      styles.border = `${enhancedVisuals.strokeWeight || 1}px solid ${strokeColor}`;
    }
  }
  
  // Extract effects (shadows, glows)
  if (enhancedVisuals.effects && enhancedVisuals.effects.length > 0) {
    const shadows = enhancedVisuals.effects
      .filter((effect: any) => effect.visible)
      .map((effect: any) => {
        if (effect.type === 'DROP_SHADOW') {
          return `${effect.offset?.x || 0}px ${effect.offset?.y || 0}px ${effect.radius || 0}px ${effect.color}`;
        } else if (effect.type === 'INNER_SHADOW') {
          return `inset ${effect.offset?.x || 0}px ${effect.offset?.y || 0}px ${effect.radius || 0}px ${effect.color}`;
        }
        return '';
      })
      .filter(Boolean);
    
    if (shadows.length > 0) {
      styles.boxShadow = shadows.join(', ');
    }
  }
  
  // Extract opacity
  if (enhancedVisuals.opacity !== undefined && enhancedVisuals.opacity !== 1) {
    styles.opacity = enhancedVisuals.opacity;
  }
  
  // Extract blend mode
  if (enhancedVisuals.blendMode && enhancedVisuals.blendMode !== 'PASS_THROUGH') {
    styles.mixBlendMode = enhancedVisuals.blendMode.toLowerCase().replace('_', '-');
  }
  
  // Extract backdrop blur
  if (enhancedVisuals.backdropBlur && enhancedVisuals.backdropBlur > 0) {
    styles.backdropFilter = `blur(${enhancedVisuals.backdropBlur}px)`;
  }
  
  // Extract typography if available
  if (enhancedVisuals.typography) {
    if (enhancedVisuals.typography.fontFamily) {
      styles.fontFamily = enhancedVisuals.typography.fontFamily;
    }
    if (enhancedVisuals.typography.fontSize) {
      styles.fontSize = `${enhancedVisuals.typography.fontSize}px`;
    }
    if (enhancedVisuals.typography.fontWeight) {
      styles.fontWeight = enhancedVisuals.typography.fontWeight;
    }
    if (enhancedVisuals.typography.lineHeight) {
      styles.lineHeight = enhancedVisuals.typography.lineHeight;
    }
  }
  
  return styles;
}

function getTypeForProp(propName: string, propValue: any): string {
  if (typeof propValue === 'string') return 'string';
  if (typeof propValue === 'number') return 'number';
  if (typeof propValue === 'boolean') return 'boolean';
  if (Array.isArray(propValue)) return 'any[]';
  if (typeof propValue === 'object') return 'object';
  
  // Smart type inference based on prop name
  if (propName.includes('onClick') || propName.includes('onPress')) return '() => void';
  if (propName.includes('onChange')) return '(value: any) => void';
  if (propName.includes('disabled') || propName.includes('visible') || propName.includes('active')) return 'boolean';
  if (propName.includes('width') || propName.includes('height') || propName.includes('size')) return 'number';
  if (propName.includes('color') || propName.includes('text') || propName.includes('title')) return 'string';
  
  return 'any';
}

// Function to extract screenshot files from a token
async function extractScreenshotFilesFromToken(token: string) {
  try {
    console.log('📸 Extracting screenshot files for token:', token);
    
    // Get component data from token
    const componentData = getComponentByToken(token);
    
    if (!componentData) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Token not found:** ${token}\n\nUse \`debug_component_matching\` to see available tokens.`
          }
        ]
      };
    }
    
    // Extract screenshot files
    const screenshotPath = await extractScreenshotFiles(componentData);
    
    if (screenshotPath) {
      const filename = componentData.screenshot;
      const filepath = path.join(EXPORT_DIR, filename);
      
      let result = `📸 **Screenshot Files Extracted**\n\n`;
      result += `**Token:** ${token}\n`;
      result += `**Component:** ${componentData.component || componentData.name || 'Unknown'}\n`;
      result += `**Screenshot File:** \`${filepath}\`\n`;
      result += `**Status:** ${fs.existsSync(filepath) ? 'PNG file created' : 'Placeholder created'}\n\n`;
      
      result += `**Usage:**\n`;
      result += `• View the screenshot file directly: \`${filepath}\`\n`;
      result += `• Reference in documentation or design systems\n`;
      result += `• Share with team members for design review\n`;
      result += `• Use as visual context for AI assistants\n\n`;
      
      result += `**Next Steps:**\n`;
      result += `• Open the PNG file to see the component screenshot\n`;
      result += `• Use \`extract_figma_design\` for detailed component data\n`;
      result += `• Compare the visual reference with generated code\n`;
      
      return {
        content: [
          {
            type: 'text',
            text: result
          }
        ]
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `❌ **No screenshot found** for token: ${token}\n\nThis component was exported without screenshot capture.`
          }
        ]
      };
    }
    
  } catch (error) {
    console.error('❌ Error extracting screenshot files:', error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error extracting screenshot files:** ${error}\n\nPlease try again or check the token validity.`
        }
      ]
    };
  }
}

// Function to extract and save screenshot files from token data
async function extractScreenshotFiles(componentData: any) {
  try {
    if (!componentData.screenshot) {
      return null;
    }

    const filename = componentData.screenshot;
    const filepath = path.join(EXPORT_DIR, filename);
    
    // Check if the screenshot file already exists
    if (fs.existsSync(filepath)) {
      console.log('📸 Screenshot file already exists:', filepath);
      return filepath;
    }
    
    // Try to get the screenshot data from the token storage
    const tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
    let screenshotData = null;
    
    // Look for the screenshot data in any token
    for (const [tokenKey, tokenValue] of Object.entries(tokens)) {
      const token = tokenValue as any;
      if (token.component && token.component.screenshot === filename) {
        // Found the token that contains this screenshot
        console.log('📸 Found screenshot in token:', tokenKey);
        
        // Check if the token has the screenshot data stored
        if (token.screenshotData) {
          screenshotData = token.screenshotData;
          break;
        }
      }
    }
    
    if (screenshotData) {
      // Convert base64 to binary and save as PNG
      const binaryData = Buffer.from(screenshotData, 'base64');
      fs.writeFileSync(filepath, binaryData);
      console.log('📸 Screenshot saved as PNG file:', filepath);
      return filepath;
    } else {
      // Create a placeholder file indicating the screenshot should be extracted
      const placeholderContent = `# Screenshot: ${filename}
# This is a placeholder for the actual screenshot
# The screenshot data needs to be extracted from Figma client storage

Component: ${componentData.component || componentData.name || 'Unknown'}
Timestamp: ${new Date().toISOString()}
Status: Screenshot captured, needs extraction from Figma client storage

To get the actual screenshot:
1. The screenshot is stored in Figma client storage with key: screenshot_${filename}
2. Extract the base64 data and convert to PNG
3. Save to: ${filepath}
`;
      
      fs.writeFileSync(filepath, placeholderContent);
      console.log('📸 Created placeholder screenshot file:', filepath);
      return filepath;
    }
  } catch (error) {
    console.error('❌ Error extracting screenshot file:', error);
    return null;
  }
}


// Start the MCP server
const transport = new StdioServerTransport();
server.connect(transport);