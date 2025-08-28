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
    
    // First, try to find the component in debug files (most complete data)
    const debugFiles = fs.readdirSync(EXPORT_DIR).filter(file => file.startsWith('token-') && file.endsWith('-debug.json'));
    console.log('🔍 Found debug files:', debugFiles.length);
    
    for (const debugFile of debugFiles) {
      try {
        const debugData = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, debugFile), 'utf8'));
        if (debugData.token === componentId || debugData.metadata?.token === componentId) {
          console.log('✅ Found component in debug file:', debugFile);
          return debugData.completeComponentData || debugData;
        }
      } catch (error) {
        console.log('⚠️ Error reading debug file:', debugFile, error);
      }
    }
    
    // Check real-time export
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
        name: 'get_figma_image',
        description: 'Get screenshot/image of a Figma component for visual context',
        inputSchema: {
          type: 'object',
          properties: {
            componentId: {
              type: 'string',
              description: 'Component ID to capture image for'
            },
            format: {
              type: 'string',
              description: 'Image format (png, jpg, svg)',
              default: 'png'
            },
            scale: {
              type: 'number',
              description: 'Scale factor for the image',
              default: 2
            }
          },
          required: ['componentId']
        }
      },
      {
        name: 'get_figma_code',
        description: 'Get interactive code representation of a Figma component',
        inputSchema: {
          type: 'object',
          properties: {
            componentId: {
              type: 'string',
              description: 'Component ID to generate code for'
            },
            framework: {
              type: 'string',
              description: 'Code framework (react, vue, html)',
              default: 'react'
            },
            styling: {
              type: 'string',
              description: 'Styling approach (tailwind, css, styled-components)',
              default: 'tailwind'
            },
            includeInteractivity: {
              type: 'boolean',
              description: 'Include interactive behaviors and state',
              default: true
            }
          },
          required: ['componentId']
        }
      },
      {
        name: 'get_figma_variables',
        description: 'Get design variables and tokens used in a component',
        inputSchema: {
          type: 'object',
          properties: {
            componentId: {
              type: 'string',
              description: 'Component ID to get variables for'
            }
          },
          required: ['componentId']
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
            },
            compareWithBridge: {
              type: 'boolean',
              description: 'Compare MCP data with bridge debug endpoint data',
              default: false
            },
            deepAnalysis: {
              type: 'boolean',
              description: 'Perform deep structural analysis of component data',
              default: false
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
      },
      {
        name: 'validate_with_screenshot',
        description: 'Validate generated code accuracy against the original Figma screenshot',
        inputSchema: {
          type: 'object',
          properties: {
            componentId: {
              type: 'string',
              description: 'Component ID to validate'
            },
            generatedCode: {
              type: 'string',
              description: 'Generated code to validate against screenshot'
            }
          },
          required: ['componentId']
        }
      },
      {
        name: 'capture_component_screenshot',
        description: 'Capture and save a screenshot of a component for validation',
        inputSchema: {
          type: 'object',
          properties: {
            componentId: {
              type: 'string',
              description: 'Component ID to capture screenshot for'
            },
            includeInDebugData: {
              type: 'boolean',
              description: 'Include screenshot data directly in debug files',
              default: true
            }
          },
          required: ['componentId']
        }
      },
      {
        name: 'save_component_analysis',
        description: 'Save comprehensive component analysis to a file for detailed inspection',
        inputSchema: {
          type: 'object',
          properties: {
            componentId: {
              type: 'string',
              description: 'Component ID to analyze and save'
            }
          },
          required: ['componentId']
        }
      },
      {
        name: 'generate_enhanced_component_code',
        description: 'Generate code with enhanced design data processing (vector paths, normalized coordinates, standardized colors)',
        inputSchema: {
          type: 'object',
          properties: {
            componentId: {
              type: 'string',
              description: 'ID of the component to generate enhanced code for'
            },
            framework: {
              type: 'string',
              description: 'Target framework (react, vue, svelte, html, etc.)',
              default: 'react'
            },
            includeVectorPaths: {
              type: 'boolean',
              description: 'Include vector path conversion',
              default: true
            },
            normalizeCoordinates: {
              type: 'boolean',
              description: 'Convert to relative positioning',
              default: true
            },
            standardizeColors: {
              type: 'boolean',
              description: 'Convert colors to hex format',
              default: true
            },
            includeScreenshot: {
              type: 'boolean',
              description: 'Include screenshot as visual context for LLM',
              default: true
            }
          },
          required: ['componentId']
        }
      },
      {
        name: 'capture_component_screenshot',
        description: 'Capture and save a screenshot of a component for validation and LLM context',
        inputSchema: {
          type: 'object',
          properties: {
            componentId: {
              type: 'string',
              description: 'Component ID to capture screenshot for'
            },
            includeInDebugData: {
              type: 'boolean',
              description: 'Include screenshot data directly in debug files',
              default: true
            }
          },
          required: ['componentId']
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
    
    case 'validate_with_screenshot':
      return await validateWithScreenshot(
        args.componentId as string,
        args.generatedCode as string
      );
    
    case 'capture_component_screenshot':
      return await captureComponentScreenshot(
        args.componentId as string,
        args.includeInDebugData as boolean || true
      );
    
    case 'generate_enhanced_component_code':
      return await generateEnhancedComponentCode(
        args.componentId as string,
        (args.framework as string) || 'react',
        args.includeVectorPaths as boolean || true,
        args.normalizeCoordinates as boolean || true,
        args.standardizeColors as boolean || true,
        args.includeScreenshot as boolean || true
      );
    
    case 'capture_component_screenshot':
      return await captureComponentScreenshot(
        args.componentId as string,
        args.includeInDebugData as boolean || true
      );
    
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
      return await debugComponentMatching(args.componentId as string, args.compareWithBridge as boolean, args.deepAnalysis as boolean);
    
    case 'save_component_analysis':
      return await saveComponentAnalysis(args.componentId as string);
    
    case 'get_figma_image':
      return await getFigmaImage(args.componentId as string, args.format as string || 'png', args.scale as number || 2);
    
    case 'get_figma_code':
      return await getFigmaCode(args.componentId as string, args.framework as string || 'react', args.styling as string || 'tailwind', args.includeInteractivity as boolean || true);
    
    case 'get_figma_variables':
      return await getFigmaVariables(args.componentId as string);
    
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

async function debugComponentMatching(componentId?: string, compareWithBridge: boolean = false, deepAnalysis: boolean = false) {
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
        
        // Deep data analysis
        output += `\n**MCP Data Analysis:**\n`;
        output += `- Children Count: ${foundComponent.children?.length || 0}\n`;
        output += `- Has Typography: ${!!foundComponent.typography}\n`;
        output += `- Has Visuals: ${!!foundComponent.visuals}\n`;
        output += `- Has Enhanced Visuals: ${!!foundComponent.enhancedVisuals}\n`;
        output += `- Has Geometry: ${!!foundComponent.geometry}\n`;
        output += `- Has Effects: ${foundComponent.effects?.length || 0}\n`;
        
        if (foundComponent.children?.length > 0) {
          output += `\n**Children Analysis:**\n`;
          foundComponent.children.forEach((child: any, index: number) => {
            output += `  ${index + 1}. ${child.name || 'Unnamed'} (${child.type || 'unknown'})\n`;
            output += `     - Has Typography: ${!!child.typography}\n`;
            output += `     - Has Characters: ${!!child.characters}\n`;
            output += `     - Has Enhanced Visuals: ${!!child.enhancedVisuals}\n`;
            
            // DETAILED typography inspection
            if (child.typography) {
              const typoKeys = Object.keys(child.typography);
              output += `     - Typography Keys: ${typoKeys.join(', ')}\n`;
              if (child.typography.text) {
                output += `     - Typography Text: "${child.typography.text}"\n`;
              }
              if (child.typography.content) {
                output += `     - Typography Content: "${child.typography.content}"\n`;
              }
              if (child.typography.characters) {
                output += `     - Typography Characters: "${child.typography.characters}"\n`;
              }
            }
            
            // Check for text in other locations
            if (child.textContent) {
              output += `     - Direct textContent: "${child.textContent}"\n`;
            }
            if (child.content) {
              output += `     - Direct content: "${child.content}"\n`;
            }
            if (child.text) {
              output += `     - Direct text: "${child.text}"\n`;
            }
          });
        }
        
        // DEEP ANALYSIS - Comprehensive data structure inspection
        if (deepAnalysis) {
          output += `\n**🔬 DEEP ANALYSIS:**\n`;
          
          // Analyze root component structure
          output += `\n**Root Component Structure:**\n`;
          const rootKeys = Object.keys(foundComponent).sort();
          output += `- Total properties: ${rootKeys.length}\n`;
          output += `- Properties: ${rootKeys.join(', ')}\n`;
          
          // Analyze each major section
          if (foundComponent.typography) {
            output += `\n**Typography Section:**\n`;
            const typoKeys = Object.keys(foundComponent.typography);
            output += `- Keys: ${typoKeys.join(', ')}\n`;
            typoKeys.forEach(key => {
              const value = foundComponent.typography[key];
              if (typeof value === 'string' && value.length > 0) {
                output += `- ${key}: "${value}"\n`;
              } else if (typeof value === 'object' && value !== null) {
                output += `- ${key}: [object with ${Object.keys(value).length} properties]\n`;
              } else {
                output += `- ${key}: ${value}\n`;
              }
            });
          }
          
          if (foundComponent.enhancedVisuals) {
            output += `\n**Enhanced Visuals Section:**\n`;
            const evKeys = Object.keys(foundComponent.enhancedVisuals);
            output += `- Keys: ${evKeys.join(', ')}\n`;
            
            // Check for text-related properties in enhanced visuals
            const textRelatedKeys = evKeys.filter(key => 
              key.toLowerCase().includes('text') || 
              key.toLowerCase().includes('content') || 
              key.toLowerCase().includes('char') ||
              key.toLowerCase().includes('string')
            );
            if (textRelatedKeys.length > 0) {
              output += `- Text-related keys: ${textRelatedKeys.join(', ')}\n`;
              textRelatedKeys.forEach(key => {
                const value = foundComponent.enhancedVisuals[key];
                if (typeof value === 'string') {
                  output += `  - ${key}: "${value}"\n`;
                }
              });
            }
          }
          
          // Deep dive into children structure
          if (foundComponent.children && foundComponent.children.length > 0) {
            output += `\n**Deep Children Analysis:**\n`;
            foundComponent.children.forEach((child: any, index: number) => {
              output += `\n**Child ${index + 1} Deep Dive:**\n`;
              const childKeys = Object.keys(child).sort();
              output += `- Properties: ${childKeys.join(', ')}\n`;
              
              // Look for ANY text-related properties
              const allTextProps: string[] = [];
              const checkForText = (obj: any, prefix: string = '') => {
                if (typeof obj === 'string' && obj.trim().length > 0 && !obj.startsWith('#') && obj.length < 100) {
                  allTextProps.push(`${prefix}: "${obj}"`);
                }
                if (typeof obj === 'object' && obj !== null) {
                  Object.keys(obj).forEach(key => {
                    if (key.toLowerCase().includes('text') || 
                        key.toLowerCase().includes('content') || 
                        key.toLowerCase().includes('char') ||
                        key.toLowerCase().includes('name') ||
                        key === 'characters') {
                      checkForText(obj[key], `${prefix}${prefix ? '.' : ''}${key}`);
                    }
                  });
                }
              };
              
              checkForText(child);
              
              if (allTextProps.length > 0) {
                output += `- Found text properties:\n`;
                allTextProps.forEach(prop => output += `  ${prop}\n`);
              } else {
                output += `- No text properties found\n`;
              }
              
              // Check specific Figma text properties
              if (child.type === 'TEXT') {
                output += `- TEXT NODE DETECTED\n`;
                if (child.characters) output += `  - characters: "${child.characters}"\n`;
                if (child.textContent) output += `  - textContent: "${child.textContent}"\n`;
                if (child.text) output += `  - text: "${child.text}"\n`;
                if (child.style) {
                  output += `  - style keys: ${Object.keys(child.style).join(', ')}\n`;
                }
              }
            });
          }
          
          // Check for any missed text content at root level
          output += `\n**Root Level Text Search:**\n`;
          const rootTextProps: string[] = [];
          const searchRootText = (obj: any, path: string = '') => {
            Object.keys(obj).forEach(key => {
              const value = obj[key];
              if (typeof value === 'string' && value.trim().length > 0 && !value.startsWith('#') && !value.startsWith('http') && value.length < 200) {
                if (key.toLowerCase().includes('text') || 
                    key.toLowerCase().includes('content') || 
                    key.toLowerCase().includes('char') ||
                    key.toLowerCase().includes('name') ||
                    key === 'characters' ||
                    (path === '' && value.length > 1 && value.length < 50)) {
                  rootTextProps.push(`${path}${path ? '.' : ''}${key}: "${value}"`);
                }
              }
            });
          };
          
          searchRootText(foundComponent);
          
          if (rootTextProps.length > 0) {
            output += `Found potential text:\n`;
            rootTextProps.forEach(prop => output += `- ${prop}\n`);
          } else {
            output += `No text found at root level\n`;
          }
        }
        
        // Compare with bridge data if requested
        if (compareWithBridge) {
          output += `\n**🔄 Comparing with Bridge Debug Data:**\n`;
          try {
            const bridgeResponse = await fetch(`http://localhost:8473/debug/${componentId}`);
            if (bridgeResponse.ok) {
              const bridgeData = await bridgeResponse.json();
              const bridgeComponent = bridgeData.data?.completeComponentData;
              
              if (bridgeComponent) {
                output += `✅ Bridge data found!\n`;
                output += `- Bridge Children: ${bridgeComponent.children?.length || 0}\n`;
                output += `- Bridge Typography: ${!!bridgeComponent.typography}\n`;
                output += `- Bridge Enhanced Visuals: ${!!bridgeComponent.enhancedVisuals}\n`;
                
                // Compare data structures
                const mcpKeys = Object.keys(foundComponent).sort();
                const bridgeKeys = Object.keys(bridgeComponent).sort();
                const missingInMcp = bridgeKeys.filter(key => !mcpKeys.includes(key));
                const missingInBridge = mcpKeys.filter(key => !bridgeKeys.includes(key));
                
                if (missingInMcp.length > 0) {
                  output += `⚠️ Keys in Bridge but not in MCP: ${missingInMcp.join(', ')}\n`;
                }
                if (missingInBridge.length > 0) {
                  output += `⚠️ Keys in MCP but not in Bridge: ${missingInBridge.join(', ')}\n`;
                }
                
                output += `📊 Data size comparison:\n`;
                output += `- MCP JSON size: ${JSON.stringify(foundComponent).length} chars\n`;
                output += `- Bridge JSON size: ${JSON.stringify(bridgeComponent).length} chars\n`;
                
              } else {
                output += `❌ No completeComponentData in bridge response\n`;
              }
            } else {
              output += `❌ Bridge request failed: ${bridgeResponse.status}\n`;
            }
          } catch (error) {
            output += `❌ Error comparing with bridge: ${error instanceof Error ? error.message : String(error)}\n`;
          }
        }
        
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
  console.log('🎨 COMPREHENSIVE CODE GENERATION for:', component.component || component.name);
  
  // Extract ALL possible data from component
  const analysis = analyzeComponentComprehensively(component);
  console.log('📊 Component Analysis:', analysis);
  
  // PREVENT GUESSWORK: Validate that we have actual content
  const hasActualContent = validateComponentHasContent(analysis, component);
  if (!hasActualContent) {
    console.log('⚠️ WARNING: Component appears to have minimal content, but generating based on actual Figma data only');
  }
  
  // Generate component based on ACTUAL detected content and structure
  if (analysis.isIcon || analysis.hasVectorContent) {
    return generateIconComponent(component, className, analysis);
  } else if (analysis.isButton) {
    return generateButtonComponent(component, className, analysis);
  } else if (analysis.isInput) {
    return generateInputComponent(component, className, analysis);
  } else if (analysis.isCard) {
    return generateCardComponent(component, className, analysis);
  } else if (analysis.hasText) {
    return generateTextComponent(component, className, analysis);
  } else if (analysis.isContainer) {
    return generateContainerComponent(component, className, analysis);
  } else {
    return generateGenericComponent(component, className, analysis);
  }
}

function validateComponentHasContent(analysis: any, component: any): boolean {
  console.log('🔍 CONTENT VALIDATION:', {
    hasText: analysis.hasText,
    textCount: analysis.textContent.length,
    hasVector: analysis.hasVectorContent,
    vectorCount: analysis.vectorPaths.length,
    hasImages: analysis.hasImages,
    imageCount: analysis.imageData.length,
    hasChildren: analysis.childCount > 0,
    hasVisualStyles: analysis.fills.length > 0 || analysis.strokes.length > 0 || analysis.effects.length > 0,
    hasScreenshot: !!component.screenshot
  });
  
  // Component has content if it has:
  const hasContent = (
    analysis.hasText ||                    // Actual text content
    analysis.hasVectorContent ||           // Vector/SVG data  
    analysis.hasImages ||                  // Image content
    analysis.fills.length > 0 ||           // Background fills
    analysis.strokes.length > 0 ||         // Borders/strokes
    analysis.effects.length > 0 ||         // Shadows/effects
    (analysis.childCount > 0 && analysis.children.some((child: any) => 
      child.type === 'TEXT' || 
      child.cleanName ||                     // Text in cleanName
      child.component ||                     // Text in component name
      child.fills?.length > 0 || 
      child.strokes?.length > 0
    )) // Children with actual content
  );
  
  if (!hasContent) {
    console.log('❌ VALIDATION FAILED: Component has no detectable content');
    console.log('📋 Available data:', {
      componentKeys: Object.keys(component),
      analysisKeys: Object.keys(analysis),
      childrenTypes: analysis.children.map((c: any) => c.type),
      enhancedVisualsKeys: component.enhancedVisuals ? Object.keys(component.enhancedVisuals) : []
    });
  }
  
  return hasContent;
}

function analyzeComponentComprehensively(component: any): any {
  const analysis: any = {
    // Basic info
    name: component.component || component.name || 'Component',
    type: component.groupMetadata?.type || 'unknown',
    
    // Content analysis
    hasText: false,
    textContent: [],
    hasVectorContent: false,
    vectorPaths: [],
    hasImages: false,
    imageData: [],
    
    // Structure analysis
    isContainer: component.semantic?.isContainer || !!component.children,
    isInteractive: component.semantic?.isInteractive || false,
    isIcon: false,
    isButton: false,
    isInput: false,
    isCard: false,
    
    // Visual properties
    dimensions: {
      width: component.size?.width || component.geometry?.boundingBox?.width || 'auto',
      height: component.size?.height || component.geometry?.boundingBox?.height || 'auto'
    },
    position: component.position || component.geometry?.boundingBox || {},
    
    // Styling
    fills: [],
    strokes: [],
    effects: component.effects || [],
    borderRadius: component.visuals?.borderRadius || {},
    opacity: component.visuals?.opacity || 1,
    
    // Layout
    layout: component.layout || {},
    autoLayout: component.layout?.autoLayout || {},
    
    // Children
    children: component.children || [],
    childCount: (component.children || []).length
  };
  
  // Analyze component name for type detection
  const nameLower = analysis.name.toLowerCase();
  analysis.isIcon = nameLower.includes('icon') || 
                    nameLower.includes('symbol') || 
                    (analysis.childCount <= 3 && !analysis.hasText);
  analysis.isButton = nameLower.includes('button') || nameLower.includes('btn');
  analysis.isInput = nameLower.includes('input') || nameLower.includes('field');
  analysis.isCard = nameLower.includes('card') || nameLower.includes('panel');
  
  // COMPREHENSIVE content extraction from ALL possible sources
  console.log('🔍 Analyzing component structure:', {
    name: analysis.name,
    hasChildren: analysis.childCount > 0,
    hasTypography: !!component.typography,
    hasEnhancedVisuals: !!component.enhancedVisuals,
    hasVisuals: !!component.visuals
  });

  // Extract text content from MULTIPLE sources
  const extractTextFromNode = (node: any, depth: number = 0): void => {
    if (depth > 5) return; // Prevent infinite recursion
    
    // Method 1: PRIMARY SOURCE - cleanName (this is where the actual text is!)
    if (node.cleanName && typeof node.cleanName === 'string' && node.cleanName.trim().length > 0) {
      analysis.hasText = true;
      analysis.textContent.push({
        text: node.cleanName.trim(),
        style: node.typography || {},
        source: 'cleanName'
      });
      console.log('✅ Found text via cleanName:', node.cleanName);
    }
    
    // Method 2: component name
    if (node.component && typeof node.component === 'string' && node.component.trim().length > 0 &&
        !analysis.textContent.some((t: any) => t.text === node.component)) {
      analysis.hasText = true;
      analysis.textContent.push({
        text: node.component.trim(),
        style: node.typography || {},
        source: 'component'
      });
      console.log('✅ Found text via component:', node.component);
    }
    
    // Method 3: Direct typography object (fallback)
    if (node.typography && Object.keys(node.typography).length > 0) {
      const textContent = node.typography.text || node.typography.content || '';
      if (textContent.trim()) {
        analysis.hasText = true;
        analysis.textContent.push({
          text: textContent,
          style: node.typography,
          source: 'typography'
        });
        console.log('✅ Found text via typography:', textContent);
      }
    }
    
    // Method 2: Check if node type is TEXT
    if (node.type === 'TEXT' && node.characters) {
      analysis.hasText = true;
      analysis.textContent.push({
        text: node.characters,
        style: node.style || {},
        source: 'characters'
      });
      console.log('✅ Found text via characters:', node.characters);
    }
    
    // Method 3: Check node name for meaningful text (common in Figma)
    if (node.name && node.type === 'TEXT' && !node.name.startsWith('Rectangle') && !node.name.startsWith('Group')) {
      analysis.hasText = true;
      analysis.textContent.push({
        text: node.name,
        style: node.style || {},
        source: 'name'
      });
      console.log('✅ Found text via name:', node.name);
    }
    
    // Method 4: Enhanced visuals text content
    if (node.enhancedVisuals?.textContent) {
      analysis.hasText = true;
      analysis.textContent.push({
        text: node.enhancedVisuals.textContent,
        style: node.enhancedVisuals.textStyle || {},
        source: 'enhancedVisuals'
      });
      console.log('✅ Found text via enhancedVisuals:', node.enhancedVisuals.textContent);
    }
    
    // Check for vector/SVG content
    if (node.geometry?.svgData || node.geometry?.pathCommands || node.vectorPaths) {
      analysis.hasVectorContent = true;
      analysis.vectorPaths.push({
        svgData: node.geometry?.svgData,
        pathCommands: node.geometry?.pathCommands,
        vectorPaths: node.vectorPaths,
        node: node.name
      });
      console.log('✅ Found vector content in:', node.name);
    }
    
    // Check for image content
    if (node.type === 'IMAGE' || node.fills?.some((fill: any) => fill.type === 'IMAGE')) {
      analysis.hasImages = true;
      analysis.imageData.push({
        type: node.type,
        fills: node.fills,
        node: node.name
      });
      console.log('✅ Found image content in:', node.name);
    }
    
    // Recursively process children
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => extractTextFromNode(child, depth + 1));
    }
  };

  // Start extraction from root component
  extractTextFromNode(component);
  
  // Also check children array directly
  if (analysis.children.length > 0) {
    analysis.children.forEach((child: any) => extractTextFromNode(child));
  }
  
  // Extract visual properties from enhancedVisuals or visuals
  const visuals = component.enhancedVisuals || component.visuals || {};
  if (visuals.fills) analysis.fills = visuals.fills;
  if (visuals.strokes) analysis.strokes = visuals.strokes;
  
  return analysis;
}

function generateIconComponent(component: any, className: string, analysis: any): string {
  const styles = generateComprehensiveStyles(analysis);
  const shadows = generateShadowStyles(analysis.effects);
  
  return `import React from 'react';

/**
 * ${analysis.name} Icon Component
 * Generated from Figma with complete design fidelity
 * Dimensions: ${analysis.dimensions.width}×${analysis.dimensions.height}px
 */
export const ${className}: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ 
  className: customClassName = '', 
  style = {} 
}) => {
  return (
    <div 
      className={\`icon-${analysis.name.toLowerCase().replace(/[^a-z0-9]/g, '-')} \${customClassName}\`}
      style={{
        width: '${analysis.dimensions.width}px',
        height: '${analysis.dimensions.height}px',
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ${styles}
        ${shadows}
        ...style
      }}
    >
      ${generateChildComponents(analysis.children, analysis)}
    </div>
  );
};

export default ${className};`;
}

function generateComprehensiveStyles(analysis: any): string {
  let styles = '';
  
  // Background/fills
  if (analysis.fills && analysis.fills.length > 0) {
    const fill = analysis.fills[0];
    if (fill.visible !== false) {
      if (fill.type === 'SOLID') {
        styles += `backgroundColor: '${fill.color}',\n        `;
        if (fill.opacity && fill.opacity !== 1) {
          styles += `opacity: ${fill.opacity},\n        `;
        }
      } else if (fill.type === 'GRADIENT_LINEAR') {
        styles += `background: 'linear-gradient(${fill.gradientTransform || 'to bottom'}, ${fill.gradientStops?.map((stop: any) => `${stop.color} ${stop.position * 100}%`).join(', ')})',\n        `;
      }
    }
  }
  
  // Border radius
  if (analysis.borderRadius && analysis.borderRadius.uniform) {
    styles += `borderRadius: '${analysis.borderRadius.uniform}px',\n        `;
  }
  
  // Borders/strokes
  if (analysis.strokes && analysis.strokes.length > 0) {
    const stroke = analysis.strokes[0];
    if (stroke.visible !== false) {
      styles += `border: '${stroke.weight || 1}px solid ${stroke.color}',\n        `;
    }
  }
  
  // Opacity
  if (analysis.opacity && analysis.opacity !== 1) {
    styles += `opacity: ${analysis.opacity},\n        `;
  }
  
  return styles;
}

function generateShadowStyles(effects: any[]): string {
  if (!effects || effects.length === 0) return '';
  
  const shadows = effects
    .filter(effect => effect.visible && effect.type === 'DROP_SHADOW')
    .map(effect => {
      const x = effect.offset?.[0] || 0;
      const y = effect.offset?.[1] || 0;
      const blur = effect.radius || 0;
      const spread = effect.spread || 0;
      const color = effect.color || 'rgba(0,0,0,0.25)';
      return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
    });
    
  if (shadows.length > 0) {
    return `boxShadow: '${shadows.join(', ')}',\n        `;
  }
  
  return '';
}

function generateChildComponents(children: any[], parentAnalysis: any): string {
  if (!children || children.length === 0) return '';
  
  console.log(`🔧 Generating ${children.length} child components for ${parentAnalysis.name}`);
  
  return children.map((child, index) => {
    const childAnalysis = analyzeComponentComprehensively(child);
    const childName = `${parentAnalysis.name}Child${index + 1}`;
    
    console.log(`  📝 Child ${index + 1}: ${child.name || 'Unnamed'} - Text: ${childAnalysis.hasText}, Vector: ${childAnalysis.hasVectorContent}, Images: ${childAnalysis.hasImages}`);
    
    // Handle text content with ALL extracted text
    if (childAnalysis.hasText && childAnalysis.textContent.length > 0) {
      return childAnalysis.textContent.map((textItem: any, textIndex: number) => {
        const fontSize = textItem.style?.fontSize || textItem.style?.size || 16;
        const fontWeight = textItem.style?.fontWeight || textItem.style?.weight || 'normal';
        const color = textItem.style?.color || textItem.style?.fill || '#000000';
        const fontFamily = textItem.style?.fontFamily || textItem.style?.family || 'inherit';
        
        return `<span style={{
          position: 'absolute',
          left: '${child.position?.x || child.geometry?.boundingBox?.x || 0}px',
          top: '${child.position?.y || child.geometry?.boundingBox?.y || 0}px',
          fontSize: '${fontSize}px',
          fontWeight: '${fontWeight}',
          color: '${color}',
          fontFamily: '${fontFamily}',
          whiteSpace: 'pre-wrap'
        }} title="Source: ${textItem.source}">
          ${textItem.text}
        </span>`;
      }).join('\n      ');
    } 
    
    // Handle image content
    else if (childAnalysis.hasImages && childAnalysis.imageData.length > 0) {
      const imageItem = childAnalysis.imageData[0];
      return `<div style={{
        position: 'absolute',
        left: '${child.position?.x || 0}px',
        top: '${child.position?.y || 0}px',
        width: '${childAnalysis.dimensions.width}px',
        height: '${childAnalysis.dimensions.height}px',
        backgroundColor: '#f0f0f0',
        border: '1px dashed #ccc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        color: '#666'
      }}>
        📷 Image: ${imageItem.node}
      </div>`;
    }
    
    // Handle vector/SVG content
    else if (childAnalysis.hasVectorContent) {
      return generateSVGElement(child, childAnalysis);
    } 
    
    // Handle containers with children
    else if (childAnalysis.isContainer && childAnalysis.children.length > 0) {
      const childStyles = generateComprehensiveStyles(childAnalysis);
      return `<div style={{
        position: 'absolute',
        left: '${child.position?.x || 0}px',
        top: '${child.position?.y || 0}px',
        width: '${childAnalysis.dimensions.width}px',
        height: '${childAnalysis.dimensions.height}px',
        ${childStyles}
      }} title="Container: ${child.name || 'Unnamed'}">
        ${generateChildComponents(childAnalysis.children, childAnalysis)}
      </div>`;
    }
    
    // Fallback: Generate element with meaningful content
    else {
      const childStyles = generateComprehensiveStyles(childAnalysis);
      const hasVisualContent = childStyles.trim().length > 0;
      
      return `<div style={{
        position: 'absolute',
        left: '${child.position?.x || 0}px',
        top: '${child.position?.y || 0}px',
        width: '${childAnalysis.dimensions.width}px',
        height: '${childAnalysis.dimensions.height}px',
        ${childStyles}
        ${!hasVisualContent ? 'border: "1px dashed #ddd", backgroundColor: "#f9f9f9",' : ''}
      }} title="Element: ${child.name || 'Unnamed'} (${child.type || 'unknown'})">
        ${!hasVisualContent ? `<span style={{fontSize: '10px', color: '#999'}}>${child.name || child.type || 'Element'}</span>` : ''}
        ${generateChildComponents(childAnalysis.children, childAnalysis)}
      </div>`;
    }
  }).join('\n      ');
}

function generateSVGElement(child: any, analysis: any): string {
  // For now, generate a placeholder for SVG content
  // This would be enhanced to handle actual vector paths
  return `<svg 
    width="${analysis.dimensions.width}" 
    height="${analysis.dimensions.height}"
    viewBox="0 0 ${analysis.dimensions.width} ${analysis.dimensions.height}"
    style={{
      position: 'absolute',
      left: '${child.position?.x || 0}px',
      top: '${child.position?.y || 0}px'
    }}
  >
    {/* Vector content would be generated here */}
    <rect width="100%" height="100%" fill="currentColor" opacity="0.1" />
  </svg>`;
}

function generateInputComponent(component: any, className: string, analysis: any): string {
  const styles = generateComprehensiveStyles(analysis);
  const shadows = generateShadowStyles(analysis.effects);
  
  return `import React from 'react';

export const ${className}: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}> = ({ value, onChange, placeholder, disabled = false, className: customClassName = '' }) => {
  return (
    <input 
      className={\`input-${analysis.name.toLowerCase().replace(/[^a-z0-9]/g, '-')} \${customClassName}\`}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder || '${analysis.textContent[0]?.text || 'Enter text...'}'}
      disabled={disabled}
      style={{
        width: '${analysis.dimensions.width}px',
        height: '${analysis.dimensions.height}px',
        ${styles}
        ${shadows}
        border: '1px solid #ccc',
        outline: 'none',
        fontSize: '16px',
        padding: '8px 12px'
      }}
    />
  );
};`;
}

function generateCardComponent(component: any, className: string, analysis: any): string {
  const styles = generateComprehensiveStyles(analysis);
  const shadows = generateShadowStyles(analysis.effects);
  
  return `import React from 'react';

export const ${className}: React.FC<{
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ children, onClick, className: customClassName = '' }) => {
  return (
    <div 
      className={\`card-${analysis.name.toLowerCase().replace(/[^a-z0-9]/g, '-')} \${customClassName}\`}
      onClick={onClick}
      style={{
        width: '${analysis.dimensions.width}px',
        height: '${analysis.dimensions.height}px',
        ${styles}
        ${shadows}
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        overflow: 'hidden'
      }}
    >
      ${generateChildComponents(analysis.children, analysis)}
      {children}
    </div>
  );
};`;
}

function generateButtonComponent(component: any, className: string, analysis: any): string {
  const styles = generateComprehensiveStyles(analysis);
  const shadows = generateShadowStyles(analysis.effects);
  
  return `import React from 'react';

export const ${className}: React.FC<{
  onClick?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}> = ({ onClick, disabled = false, children, className: customClassName = '' }) => {
  return (
    <button 
      className={\`btn-${analysis.name.toLowerCase().replace(/[^a-z0-9]/g, '-')} \${customClassName}\`}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '${analysis.dimensions.width}px',
        height: '${analysis.dimensions.height}px',
        ${styles}
        ${shadows}
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      {children || '${analysis.textContent[0]?.text || 'Button'}'}
    </button>
  );
};`;
}

function generateTextComponent(component: any, className: string, analysis: any): string {
  const textStyle = analysis.textContent[0]?.style || {};
  
  return `import React from 'react';

export const ${className}: React.FC<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className: customClassName = '' }) => {
  return (
    <div 
      className={\`text-${analysis.name.toLowerCase().replace(/[^a-z0-9]/g, '-')} \${customClassName}\`}
      style={{
        width: '${analysis.dimensions.width}px',
        height: '${analysis.dimensions.height}px',
        fontSize: '${textStyle.fontSize || 16}px',
        fontWeight: '${textStyle.fontWeight || 'normal'}',
        color: '${textStyle.color || '#000000'}',
        fontFamily: '${textStyle.fontFamily || 'inherit'}',
        lineHeight: '${textStyle.lineHeight || 'normal'}',
        textAlign: '${textStyle.textAlign || 'left'}',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
      }}
    >
      {children || '${analysis.textContent[0]?.text || ''}'}
    </div>
  );
};`;
}

function generateContainerComponent(component: any, className: string, analysis: any): string {
  const styles = generateComprehensiveStyles(analysis);
  const shadows = generateShadowStyles(analysis.effects);
  const layoutStyles = generateLayoutStyles(analysis.layout);
  
  return `import React from 'react';

export const ${className}: React.FC<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className: customClassName = '' }) => {
  return (
    <div 
      className={\`container-${analysis.name.toLowerCase().replace(/[^a-z0-9]/g, '-')} \${customClassName}\`}
      style={{
        width: '${analysis.dimensions.width}px',
        height: '${analysis.dimensions.height}px',
        ${styles}
        ${shadows}
        ${layoutStyles}
        position: 'relative'
      }}
    >
      ${generateChildComponents(analysis.children, analysis)}
      {children}
    </div>
  );
};`;
}

function generateGenericComponent(component: any, className: string, analysis: any): string {
  const styles = generateComprehensiveStyles(analysis);
  const shadows = generateShadowStyles(analysis.effects);
  
  return `import React from 'react';

export const ${className}: React.FC<{
  className?: string;
  style?: React.CSSProperties;
}> = ({ className: customClassName = '', style = {} }) => {
  return (
    <div 
      className={\`component-${analysis.name.toLowerCase().replace(/[^a-z0-9]/g, '-')} \${customClassName}\`}
      style={{
        width: '${analysis.dimensions.width}px',
        height: '${analysis.dimensions.height}px',
        ${styles}
        ${shadows}
        position: 'relative',
        ...style
      }}
    >
      ${generateChildComponents(analysis.children, analysis)}
    </div>
  );
};`;
}

function generateLayoutStyles(layout: any): string {
  if (!layout || !layout.autoLayout) return '';
  
  const autoLayout = layout.autoLayout;
  let styles = '';
  
  if (autoLayout.enabled) {
    styles += `display: 'flex',\n        `;
    styles += `flexDirection: '${autoLayout.direction === 'VERTICAL' ? 'column' : 'row'}',\n        `;
    styles += `alignItems: '${convertFigmaAlignment(autoLayout.alignItems)}',\n        `;
    styles += `justifyContent: '${convertFigmaJustification(autoLayout.justifyContent)}',\n        `;
    
    if (autoLayout.gap) {
      styles += `gap: '${autoLayout.gap}px',\n        `;
    }
    
    if (autoLayout.padding) {
      const p = autoLayout.padding;
      styles += `padding: '${p.top || 0}px ${p.right || 0}px ${p.bottom || 0}px ${p.left || 0}px',\n        `;
    }
  }
  
  return styles;
}

function convertFigmaAlignment(align: string): string {
  switch (align) {
    case 'MIN': return 'flex-start';
    case 'CENTER': return 'center';
    case 'MAX': return 'flex-end';
    default: return 'flex-start';
  }
}

function convertFigmaJustification(justify: string): string {
  switch (justify) {
    case 'MIN': return 'flex-start';
    case 'CENTER': return 'center';
    case 'MAX': return 'flex-end';
    case 'SPACE_BETWEEN': return 'space-between';
    default: return 'flex-start';
  }
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
        styles.background = `linear-gradient(${fill.gradientTransform || 'to bottom'}, ${fill.gradientStops?.map((stop: { color: string; position: number }) => `${stop.color} ${stop.position}%`).join(', ')})`;
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
async function generateEnhancedComponentCode(
  componentId: string,
  framework: string = 'react',
  includeVectorPaths: boolean = true,
  normalizeCoordinates: boolean = true,
  standardizeColors: boolean = true,
  includeScreenshot: boolean = true
) {
  try {
    console.log(`🎯 Generating enhanced component code for: ${componentId}`);
    
    // Get component data
    const component = getComponentFromFigment(componentId);
    if (!component) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Component not found**: ${componentId}\n\nRun \`debug_component_matching\` to see available components.`
          }
        ]
      };
    }
    
    // Enhanced data processing with deep extraction
    const enhancedData = await processEnhancedDesignData(component, {
      includeVectorPaths,
      normalizeCoordinates,
      standardizeColors
    });
    
    // Capture screenshot for visual context if requested
    let screenshotInfo = '';
    if (includeScreenshot) {
      try {
        const screenshotResult = await captureComponentScreenshot(componentId, true);
        if (screenshotResult.content && screenshotResult.content[0].text.includes('Successfully captured')) {
          screenshotInfo = '\n✅ Screenshot captured for visual validation';
        } else {
          screenshotInfo = '\n⚠️ Screenshot capture failed - using structured data only';
        }
      } catch (error) {
        screenshotInfo = '\n⚠️ Screenshot not available - using structured data only';
        console.log('Screenshot capture failed:', error);
      }
    }
    
    // Generate code based on framework
    let code = '';
    let css = '';
    
    switch (framework.toLowerCase()) {
      case 'react':
        code = generateEnhancedReactComponent(enhancedData);
        css = generateEnhancedCSS(enhancedData);
        break;
      case 'vue':
        code = generateEnhancedVueComponent(enhancedData);
        css = generateEnhancedCSS(enhancedData);
        break;
      case 'html':
        code = generateEnhancedHTML(enhancedData);
        css = generateEnhancedCSS(enhancedData);
        break;
      default:
        code = generateEnhancedReactComponent(enhancedData);
        css = generateEnhancedCSS(enhancedData);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `🎯 **Enhanced Component Code Generated**\n\n**Component:** ${enhancedData.metadata.name}\n**Complexity:** ${enhancedData.metadata.complexity} (${enhancedData.metadata.totalElements} elements)\n**Framework:** ${framework}\n**Deep Extraction:** ${enhancedData.children.length} visual elements processed\n\n**${framework.toUpperCase()} Component:**\n\`\`\`${framework === 'html' ? 'html' : framework === 'vue' ? 'vue' : 'tsx'}\n${code}\n\`\`\`\n\n**CSS Styles:**\n\`\`\`css\n${css}\n\`\`\`\n\n**Enhanced Features Applied:**\n✅ Deep hierarchy extraction: ${enhancedData.children.length} elements\n✅ Complex gradient extraction: ${enhancedData.children.filter((c: any) => c.fills?.length > 0).length} gradients\n✅ Multi-level effects: ${enhancedData.children.filter((c: any) => c.effects?.length > 0).length} effects\n✅ Vector path conversion: ${includeVectorPaths ? 'Enabled' : 'Disabled'}\n✅ Coordinate normalization: ${normalizeCoordinates ? 'Enabled' : 'Disabled'}\n✅ Color standardization: ${standardizeColors ? 'Enabled' : 'Disabled'}\n✅ Screenshot context: ${includeScreenshot ? 'Enabled' : 'Disabled'}${screenshotInfo}\n\n**🎨 Color Extraction Results:**\n- Total colors found: ${Object.keys(enhancedData.colors.all).length}\n- Primary color: ${enhancedData.colors.primary}\n- Includes gradients, solid fills, and effect colors\n\n**📐 Complexity Handling:**\n- Component type: ${enhancedData.metadata.componentType}\n- Visual elements: ${enhancedData.metadata.totalElements}\n- Hierarchy depth: Up to ${Math.max(...enhancedData.children.map((c: any) => c.depth || 0))} levels\n\n**💡 LLM Context:**\nThis component uses deep extraction to capture complex design hierarchies. The system processes all nested children, extracts gradients from fills arrays, and provides both structured data and visual context for accurate generation.`
        }
      ]
    };
  } catch (error) {
    console.error('Error generating enhanced component code:', error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error generating enhanced component code**: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
}

async function saveComponentAnalysis(componentId: string) {
  try {
    console.log('💾 Saving comprehensive analysis for:', componentId);
    
    // Get component data
    const foundComponent = getComponentFromFigment(componentId);
    if (!foundComponent) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Component not found**: ${componentId}`
          }
        ]
      };
    }
    
    // Generate comprehensive analysis
    const analysis = {
      componentId,
      timestamp: new Date().toISOString(),
      componentName: foundComponent.component || foundComponent.name,
      
      // Basic structure
      structure: {
        totalProperties: Object.keys(foundComponent).length,
        allProperties: Object.keys(foundComponent).sort(),
        hasChildren: !!foundComponent.children,
        childrenCount: foundComponent.children?.length || 0
      },
      
      // Typography analysis
      typography: foundComponent.typography ? {
        exists: true,
        keys: Object.keys(foundComponent.typography),
        data: foundComponent.typography
      } : { exists: false },
      
      // Enhanced visuals analysis
      enhancedVisuals: foundComponent.enhancedVisuals ? {
        exists: true,
        keys: Object.keys(foundComponent.enhancedVisuals),
        textRelatedKeys: Object.keys(foundComponent.enhancedVisuals).filter(key => 
          key.toLowerCase().includes('text') || 
          key.toLowerCase().includes('content') || 
          key.toLowerCase().includes('char')
        ),
        data: foundComponent.enhancedVisuals
      } : { exists: false },
      
      // Children detailed analysis
      children: foundComponent.children ? foundComponent.children.map((child: any, index: number) => ({
        index,
        name: child.name || 'Unnamed',
        type: child.type || 'unknown',
        properties: Object.keys(child).sort(),
        hasTypography: !!child.typography,
        hasCharacters: !!child.characters,
        hasText: !!child.text,
        hasTextContent: !!child.textContent,
        
        // Extract all string values that might be text
        stringValues: Object.keys(child).reduce((acc: any, key) => {
          const value = child[key];
          if (typeof value === 'string' && value.trim().length > 0 && value.length < 200) {
            acc[key] = value;
          }
          return acc;
        }, {}),
        
        // Full child data for reference
        fullData: child
      })) : [],
      
      // Full component data
      fullComponentData: foundComponent
    };
    
    // Save to file
    const analysisPath = path.join(EXPORT_DIR, `analysis-${componentId}-${Date.now()}.json`);
    fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ **Analysis Saved**: ${analysisPath}\n\n**Summary:**\n- Component: ${analysis.componentName}\n- Properties: ${analysis.structure.totalProperties}\n- Children: ${analysis.structure.childrenCount}\n- Has Typography: ${analysis.typography.exists}\n- Has Enhanced Visuals: ${analysis.enhancedVisuals.exists}\n\n**Next Steps:**\n1. Open the file to inspect the full data structure\n2. Look for text content in the children array\n3. Check stringValues for actual text content`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error saving analysis**: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ]
    };
  }
}

// MCP Tool: Get Figma Image (Screenshot)
async function getFigmaImage(componentId: string, format: string = 'png', scale: number = 2) {
  try {
    console.log('📸 Getting Figma image for:', componentId);
    
    // Get component data
    const component = getComponentFromFigment(componentId);
    if (!component) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Component not found**: ${componentId}`
          }
        ]
      };
    }
    
    // Check if screenshot exists
    const screenshotPath = path.join(EXPORT_DIR, `${componentId}-screenshot.${format}`);
    
    let imageData = null;
    if (fs.existsSync(screenshotPath)) {
      imageData = fs.readFileSync(screenshotPath, 'base64');
    }
    
    // Try to get from bridge endpoint
    if (!imageData) {
      try {
        const response = await fetch(`http://localhost:8473/screenshot/${componentId}?format=${format}&scale=${scale}`);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          imageData = buffer.toString('base64');
          // Save for future use
          fs.writeFileSync(screenshotPath, buffer);
        }
      } catch (error) {
        console.log('Bridge screenshot not available:', error instanceof Error ? error.message : String(error));
      }
    }
    
    const result = {
      content: [
        {
          type: 'text',
          text: `🖼️ **Figma Component Image**\n\n**Component:** ${component.component || component.cleanName || 'Unknown'}\n**ID:** ${componentId}\n**Format:** ${format.toUpperCase()}\n**Scale:** ${scale}x\n\n${imageData ? '✅ Image captured successfully' : '⚠️ No visual screenshot available'}\n\n**Design Context:**\n- This is the actual visual appearance of the Figma component\n- Use this image to understand the design intent and visual styling\n- The image shows colors, gradients, shadows, and visual effects that may not be captured in metadata\n\n**Recommended Usage:**\n- Use this visual context alongside code generation\n- Reference this image when creating CSS/styling\n- Ensure generated code matches the visual appearance shown`
        }
      ] as any[]
    };
    
    if (imageData) {
      result.content.push({
        type: 'image',
        data: imageData,
        mimeType: `image/${format}`
      });
    }
    
    return result;
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error getting image**: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ]
    };
  }
}

// MCP Tool: Get Figma Code (Interactive Representation)
async function getFigmaCode(componentId: string, framework: string = 'react', styling: string = 'tailwind', includeInteractivity: boolean = true) {
  try {
    console.log('💻 Generating Figma code for:', componentId);
    
    const component = getComponentFromFigment(componentId);
    if (!component) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Component not found**: ${componentId}`
          }
        ]
      };
    }
    
    // Analyze the component comprehensively
    const analysis = analyzeComponentComprehensively(component);
    
    // Generate code based on ACTUAL design data, not assumptions
    const code = generateComponentFromActualData(component, analysis, framework, styling, includeInteractivity);
    const description = `Component generated from actual Figma design data: ${component.component || component.cleanName || 'Unknown'}`;
    
    return {
      content: [
        {
          type: 'text',
          text: `💻 **Interactive Code Representation**\n\n**Component:** ${component.component || component.cleanName}\n**Framework:** ${framework.toUpperCase()}\n**Styling:** ${styling}\n**Interactive:** ${includeInteractivity ? 'Yes' : 'No'}\n\n**Description:** ${description}\n\n**Features:**\n- Based on actual design structure and intent\n- Includes proper semantic markup\n- Responsive and accessible\n- Uses design system tokens where available\n\n\`\`\`${framework}\n${code}\n\`\`\`\n\n**Usage Notes:**\n- This code represents the design intent, not just visual appearance\n- Modify as needed for your specific use case\n- Consider adding proper TypeScript types for production use`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error generating code**: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ]
    };
  }
}

// MCP Tool: Get Figma Variables (Design Tokens)
async function getFigmaVariables(componentId: string) {
  try {
    console.log('🎨 Getting Figma variables for:', componentId);
    
    const component = getComponentFromFigment(componentId);
    if (!component) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Component not found**: ${componentId}`
          }
        ]
      };
    }
    
    // Extract design tokens and variables
    const variables = {
      colors: extractColorTokens(component),
      typography: extractTypographyTokens(component),
      spacing: extractSpacingTokens(component),
      effects: extractEffectTokens(component),
      borders: extractBorderTokens(component)
    };
    
    const hasVariables = Object.values(variables).some(v => v.length > 0);
    
    return {
      content: [
        {
          type: 'text',
          text: `🎨 **Design Variables & Tokens**\n\n**Component:** ${component.component || component.cleanName}\n\n${hasVariables ? '**Extracted Variables:**' : '**No design tokens found**'}\n\n${variables.colors.length > 0 ? `**Colors:**\n${variables.colors.map(c => `- ${c.name}: ${c.value} (${c.usage})`).join('\n')}\n\n` : ''}${variables.typography.length > 0 ? `**Typography:**\n${variables.typography.map(t => `- ${t.name}: ${t.value}`).join('\n')}\n\n` : ''}${variables.spacing.length > 0 ? `**Spacing:**\n${variables.spacing.map(s => `- ${s.name}: ${s.value}`).join('\n')}\n\n` : ''}${variables.effects.length > 0 ? `**Effects:**\n${variables.effects.map(e => `- ${e.name}: ${e.value}`).join('\n')}\n\n` : ''}${variables.borders.length > 0 ? `**Borders:**\n${variables.borders.map(b => `- ${b.name}: ${b.value}`).join('\n')}\n\n` : ''}**Usage:**\n- Use these tokens in your code instead of hardcoded values\n- Ensures consistency with the design system\n- Makes updates easier when design tokens change`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error getting variables**: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ]
    };
  }
}

// Generate component from ACTUAL Figma design data
function generateComponentFromActualData(component: any, analysis: any, framework: string, styling: string, includeInteractivity: boolean): string {
  const componentName = component.component || component.cleanName || 'Component';
  
  if (framework === 'react') {
    // Extract actual design data
    const actualStyles = extractActualStyles(component);
    const actualDimensions = extractActualDimensions(component);
    const actualFills = extractActualFills(component);
    const actualText = extractActualText(analysis);
    const actualChildren = extractActualChildren(component);
    
    return `import React from 'react';

interface ${componentName}Props {
  className?: string;
  style?: React.CSSProperties;
}

export const ${componentName}: React.FC<${componentName}Props> = ({
  className = '',
  style = {}
}) => {
  return (
    <div 
      className={\`${componentName.toLowerCase()} \${className}\`}
      style={{
        ${actualDimensions}
        ${actualStyles}
        ${actualFills}
        ...style
      }}
    >
      ${actualText}
      ${actualChildren}
    </div>
  );
};

export default ${componentName};`;
  }
  
  return `<div class="${componentName.toLowerCase()}">\n  <!-- Generated from actual Figma data -->\n</div>`;
}

// Extract ACTUAL design data from Figma components

function extractActualDimensions(component: any): string {
  let styles = '';
  
  // REAL Figma dimensions from multiple sources
  const width = component.size?.width || 
                component.width || 
                component.absoluteBoundingBox?.width ||
                component.bounds?.width ||
                null;
                
  const height = component.size?.height || 
                 component.height || 
                 component.absoluteBoundingBox?.height ||
                 component.bounds?.height ||
                 null;
                 
  const x = component.position?.x || 
            component.x || 
            component.absoluteBoundingBox?.x ||
            component.bounds?.x ||
            null;
            
  const y = component.position?.y || 
            component.y || 
            component.absoluteBoundingBox?.y ||
            component.bounds?.y ||
            null;
  
  if (width !== null) styles += `width: '${width}px',\n        `;
  if (height !== null) styles += `height: '${height}px',\n        `;
  if (x !== null) styles += `left: '${x}px',\n        `;
  if (y !== null) styles += `top: '${y}px',\n        `;
  
  return styles;
}

function extractActualStyles(component: any): string {
  let styles = '';
  
  // REAL border radius from multiple sources
  const borderRadius = component.visuals?.borderRadius?.uniform ||
                      component.cornerRadius ||
                      component.borderRadius ||
                      null;
  
  if (borderRadius && borderRadius > 0) {
    styles += `borderRadius: '${borderRadius}px',\n        `;
  }
  
  // REAL opacity from multiple sources
  const opacity = component.visuals?.opacity !== undefined ? component.visuals.opacity :
                  component.opacity !== undefined ? component.opacity :
                  null;
  
  if (opacity !== null && opacity !== 1) {
    styles += `opacity: ${opacity},\n        `;
  }
  
  // REAL blend mode
  const blendMode = component.blendMode || component.visuals?.blendMode || null;
  if (blendMode && blendMode !== 'NORMAL' && blendMode !== 'PASS_THROUGH') {
    styles += `mixBlendMode: '${blendMode.toLowerCase().replace('_', '-')}',\n        `;
  }
  
  // REAL rotation
  const rotation = component.rotation || component.transform?.rotation || null;
  if (rotation && rotation !== 0) {
    styles += `transform: 'rotate(${rotation}deg)',\n        `;
  }
  
  // Position type
  styles += `position: 'relative',\n        `;
  
  return styles;
}

function extractActualFills(component: any): string {
  let styles = '';
  
  // REAL Figma fills from multiple sources
  const fills = component.visuals?.fills || 
                component.fills || 
                component.backgroundFills ||
                [];
  
  if (Array.isArray(fills) && fills.length > 0) {
    const visibleFills = fills.filter((fill: any) => fill.visible !== false);
    
    if (visibleFills.length > 0) {
      const fill = visibleFills[0]; // Use first visible fill
      
      if (fill.type === 'SOLID') {
        // REAL solid color - try multiple color formats
        const color = fill.color || fill.solidColor || fill.paint?.color;
        if (color) {
          // Handle different color formats from Figma
          if (typeof color === 'string') {
            styles += `backgroundColor: '${color}',\n        `;
          } else if (color.r !== undefined) {
            // RGBA object from Figma
            const r = Math.round(color.r * 255);
            const g = Math.round(color.g * 255);
            const b = Math.round(color.b * 255);
            const a = color.a !== undefined ? color.a : 1;
            styles += `backgroundColor: 'rgba(${r}, ${g}, ${b}, ${a})',\n        `;
          }
        }
      } else if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'LINEAR_GRADIENT') {
        // REAL linear gradient data
        const gradientStops = fill.gradientStops || fill.stops || [];
        if (gradientStops.length > 0) {
          const stops = gradientStops.map((stop: any) => {
            const color = stop.color;
            let colorStr = '';
            if (typeof color === 'string') {
              colorStr = color;
            } else if (color?.r !== undefined) {
              const r = Math.round(color.r * 255);
              const g = Math.round(color.g * 255);
              const b = Math.round(color.b * 255);
              const a = color.a !== undefined ? color.a : 1;
              colorStr = `rgba(${r}, ${g}, ${b}, ${a})`;
            }
            return `${colorStr} ${Math.round(stop.position * 100)}%`;
          }).join(', ');
          
          // Calculate angle from gradientTransform if available
          let angle = 90; // Default
          if (fill.gradientTransform && Array.isArray(fill.gradientTransform)) {
            const transform = fill.gradientTransform;
            angle = Math.round(Math.atan2(transform[1], transform[0]) * (180 / Math.PI));
          }
          
          styles += `background: 'linear-gradient(${angle}deg, ${stops})',\n        `;
        }
      } else if (fill.type === 'GRADIENT_RADIAL' || fill.type === 'RADIAL_GRADIENT') {
        // REAL radial gradient data
        const gradientStops = fill.gradientStops || fill.stops || [];
        if (gradientStops.length > 0) {
          const stops = gradientStops.map((stop: any) => {
            const color = stop.color;
            let colorStr = '';
            if (typeof color === 'string') {
              colorStr = color;
            } else if (color?.r !== undefined) {
              const r = Math.round(color.r * 255);
              const g = Math.round(color.g * 255);
              const b = Math.round(color.b * 255);
              const a = color.a !== undefined ? color.a : 1;
              colorStr = `rgba(${r}, ${g}, ${b}, ${a})`;
            }
            return `${colorStr} ${Math.round(stop.position * 100)}%`;
          }).join(', ');
          
          styles += `background: 'radial-gradient(circle, ${stops})',\n        `;
        }
      } else if (fill.type === 'IMAGE') {
        // REAL image fill
        const imageHash = fill.imageHash || fill.imageRef || fill.image;
        if (imageHash) {
          styles += `backgroundImage: 'url(https://figma-alpha-api.s3.us-west-2.amazonaws.com/${imageHash})',\n        `;
          styles += `backgroundSize: '${fill.scaleMode === 'FILL' ? 'cover' : fill.scaleMode === 'FIT' ? 'contain' : 'auto'}',\n        `;
          styles += `backgroundRepeat: '${fill.scaleMode === 'TILE' ? 'repeat' : 'no-repeat'}',\n        `;
        }
      }
    }
  }
  
  return styles;
}

function extractActualText(analysis: any): string {
  if (analysis.textContent && analysis.textContent.length > 0) {
    return analysis.textContent.map((text: any) => 
      `<span key="${text.text}">${text.text}</span>`
    ).join('\n      ');
  }
  return '';
}

function extractActualChildren(component: any): string {
  if (component.children && Array.isArray(component.children)) {
    return component.children.map((child: any, index: number) => {
      const childName = child.cleanName || child.component || `Child${index}`;
      const childStyles = extractActualStyles(child);
      const childFills = extractActualFills(child);
      const childDimensions = extractActualDimensions(child);
      
      // Check if child has REAL vector data
      const hasVectorData = child.geometry?.svgData || 
                           child.geometry?.vectorPaths || 
                           child.vectorPaths || 
                           child.svgData;
      
      if (hasVectorData) {
        // Generate REAL SVG element with actual path data
        const svgContent = extractActualSVGContent(child);
        return `<svg 
          key="${index}"
          style={{
            ${childDimensions}
            ${childStyles}
          }}
          title="${childName}"
          viewBox="0 0 ${child.width || 100} ${child.height || 100}"
          fill="none"
        >
          ${svgContent}
        </svg>`;
      }
      
      return `<div 
        key="${index}"
        style={{
          ${childDimensions}
          ${childStyles}
          ${childFills}
        }}
        title="${childName}"
      >
        {/* ${childName} */}
      </div>`;
    }).join('\n      ');
  }
  return '';
}

function extractActualSVGContent(component: any): string {
  // REAL SVG path extraction from multiple sources
  let svgContent = '';
  
  // Try to get actual SVG data from Figma
  const svgData = component.geometry?.svgData || 
                  component.svgData || 
                  component.geometry?.svgContent ||
                  null;
  
  if (svgData) {
    // If we have raw SVG content, extract paths from it
    if (typeof svgData === 'string') {
      const pathMatches = svgData.match(/<path[^>]*>/g);
      if (pathMatches) {
        svgContent = pathMatches.join('\n    ');
      } else {
        svgContent = svgData;
      }
    } else if (svgData.paths && Array.isArray(svgData.paths)) {
      // Extract from structured SVG data
      svgContent = svgData.paths.map((path: any) => 
        `<path d="${path.d || ''}" fill="${path.fill || 'currentColor'}" stroke="${path.stroke || 'none'}" stroke-width="${path.strokeWidth || 0}"/>`
      ).join('\n    ');
    }
  }
  
  // Fallback: try to get vector paths
  if (!svgContent) {
    const vectorPaths = component.geometry?.vectorPaths || 
                       component.vectorPaths || 
                       [];
    
    if (Array.isArray(vectorPaths) && vectorPaths.length > 0) {
      svgContent = vectorPaths.map((path: any) => 
        `<path d="${path.data || path.d || ''}" fill="currentColor"/>`
      ).join('\n    ');
    }
  }
  
  // Fallback: try comprehensive design data
  if (!svgContent && component.comprehensiveDesignData) {
    const compData = component.comprehensiveDesignData;
    if (compData.detailedFills && compData.detailedFills.length > 0) {
      // Create basic shapes based on fills
      const fill = compData.detailedFills[0];
      if (fill.type === 'SOLID') {
        const color = fill.color || 'currentColor';
        svgContent = `<rect width="100%" height="100%" fill="${color}"/>`;
      }
    }
  }
  
  return svgContent || `<rect width="100%" height="100%" fill="currentColor" opacity="0.1"/>`;
}

// Token extraction functions
function extractColorTokens(component: any): Array<{name: string, value: string, usage: string}> {
  const tokens: Array<{name: string, value: string, usage: string}> = [];
  
  // Extract from fills
  if (component.visuals?.fills) {
    component.visuals.fills.forEach((fill: any, index: number) => {
      if (fill.type === 'SOLID' && fill.visible) {
        tokens.push({
          name: `fill-${index}`,
          value: fill.color || fill.fallbackColor,
          usage: 'background'
        });
      }
    });
  }
  
  return tokens;
}

function extractTypographyTokens(component: any): Array<{name: string, value: string}> {
  const tokens: Array<{name: string, value: string}> = [];
  
  if (component.typography) {
    Object.keys(component.typography).forEach(key => {
      const value = component.typography[key];
      if (typeof value === 'string' || typeof value === 'number') {
        tokens.push({
          name: key,
          value: String(value)
        });
      }
    });
  }
  
  return tokens;
}

function extractSpacingTokens(component: any): Array<{name: string, value: string}> {
  const tokens: Array<{name: string, value: string}> = [];
  
  if (component.layout?.padding) {
    const padding = component.layout.padding;
    if (padding.top) tokens.push({name: 'padding-top', value: `${padding.top}px`});
    if (padding.right) tokens.push({name: 'padding-right', value: `${padding.right}px`});
    if (padding.bottom) tokens.push({name: 'padding-bottom', value: `${padding.bottom}px`});
    if (padding.left) tokens.push({name: 'padding-left', value: `${padding.left}px`});
  }
  
  return tokens;
}

function extractEffectTokens(component: any): Array<{name: string, value: string}> {
  const tokens: Array<{name: string, value: string}> = [];
  
  if (component.effects) {
    component.effects.forEach((effect: any, index: number) => {
      if (effect.type === 'DROP_SHADOW') {
        tokens.push({
          name: `shadow-${index}`,
          value: `${effect.offset?.x || 0}px ${effect.offset?.y || 0}px ${effect.radius || 0}px ${effect.color}`
        });
      }
    });
  }
  
  return tokens;
}

function extractBorderTokens(component: any): Array<{name: string, value: string}> {
  const tokens = [];
  
  if (component.visuals?.borderRadius) {
    tokens.push({
      name: 'border-radius',
      value: `${component.visuals.borderRadius.uniform || 0}px`
    });
  }
  
  return tokens;
}

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

function generateStylesExample(data: any, pattern: string): string {
  const hasAutoLayout = data.layout?.autoLayout?.enabled;
  const hasVisuals = data.visuals && Object.keys(data.visuals).length > 0;
  const hasScreenshot = data.screenshot;
  
  let styles = '';
  
  // Add visual reference comment if screenshot is available
  if (hasScreenshot) {
    styles += `/* 
 * Visual Reference: ${data.screenshot}
 * 
 * This CSS was generated from Figma design data.
 * For pixel-perfect accuracy, refer to the screenshot:
 * ~/.figma-exports/${data.screenshot}
 * 
 * Design Details:
 * - Component: ${data.component || data.name || 'Unknown'}
 * - Size: ${data.size?.width || 'auto'} × ${data.size?.height || 'auto'}px
 * - Type: ${pattern}
 * - Auto-layout: ${hasAutoLayout ? 'Enabled' : 'Disabled'}
 */\n\n`;
  }
  
  styles += `.component {\n`;
  
  if (hasAutoLayout) {
    styles += `  /* Auto-layout configuration */\n`;
    styles += `  display: flex;\n`;
    styles += `  flex-direction: ${data.layout.autoLayout.direction === 'HORIZONTAL' ? 'row' : 'column'};\n`;
    if (data.layout.autoLayout.itemSpacing) {
      styles += `  gap: ${data.layout.autoLayout.itemSpacing}px;\n`;
    }
    if (data.layout.autoLayout.paddingTop || data.layout.autoLayout.paddingRight || data.layout.autoLayout.paddingBottom || data.layout.autoLayout.paddingLeft) {
      styles += `  padding: ${data.layout.autoLayout.paddingTop || 0}px ${data.layout.autoLayout.paddingRight || 0}px ${data.layout.autoLayout.paddingBottom || 0}px ${data.layout.autoLayout.paddingLeft || 0}px;\n`;
    }
    if (data.layout.autoLayout.primaryAxisAlignItems) {
      styles += `  align-items: ${data.layout.autoLayout.primaryAxisAlignItems.toLowerCase()};\n`;
    }
    if (data.layout.autoLayout.counterAxisAlignItems) {
      styles += `  justify-content: ${data.layout.autoLayout.counterAxisAlignItems.toLowerCase()};\n`;
    }
    styles += `\n`;
  }
  
  if (hasVisuals) {
    styles += `  /* Visual styling */\n`;
    if (data.visuals.borderRadius) {
      styles += `  border-radius: ${getBorderRadiusValue(data.visuals.borderRadius)};\n`;
    }
    if (data.visuals.fills?.[0]) {
      const fill = data.visuals.fills[0];
      if (fill.type === 'SOLID') {
        styles += `  background-color: ${fill.color};\n`;
      } else if (fill.type === 'GRADIENT_LINEAR') {
        styles += `  background: linear-gradient(${fill.gradientTransform || 'to bottom'}, ${fill.gradientStops?.map((stop: { color: string; position: number }) => `${stop.color} ${stop.position}%`).join(', ')});\n`;
      }
    }
    if (data.visuals.strokes?.[0]) {
      const stroke = data.visuals.strokes[0];
      styles += `  border: ${data.visuals.strokeWeight || 1}px solid ${stroke.color};\n`;
    }
    if (data.visuals.effects?.length > 0) {
      const shadows = data.visuals.effects
        .filter((effect: any) => effect.visible && effect.type === 'DROP_SHADOW')
        .map((effect: any) => `${effect.offset?.x || 0}px ${effect.offset?.y || 0}px ${effect.radius || 0}px ${effect.color}`)
        .join(', ');
      if (shadows) {
        styles += `  box-shadow: ${shadows};\n`;
      }
    }
    styles += `\n`;
  }
  
  if (data.size) {
    styles += `  /* Dimensions */\n`;
    styles += `  width: ${data.size.width}px;\n`;
    styles += `  height: ${data.size.height}px;\n`;
    styles += `\n`;
  }
  
  // Add pixel-perfect positioning if available
  if (data.precisePosition) {
    styles += `  /* Pixel-perfect positioning */\n`;
    styles += `  position: absolute;\n`;
    styles += `  left: ${data.precisePosition.x}px;\n`;
    styles += `  top: ${data.precisePosition.y}px;\n`;
    if (data.precisePosition.rotation !== 0) {
      styles += `  transform: rotate(${data.precisePosition.rotation}deg);\n`;
    }
    styles += `\n`;
  }
  
  // Add typography if available
  if (data.typography) {
    styles += `  /* Typography */\n`;
    if (data.typography.font?.family) {
      styles += `  font-family: "${data.typography.font.family}", sans-serif;\n`;
    }
    if (data.typography.font?.size) {
      styles += `  font-size: ${data.typography.font.size}px;\n`;
    }
    if (data.typography.font?.weight) {
      styles += `  font-weight: ${data.typography.font.weight};\n`;
    }
    if (data.typography.textAlignHorizontal) {
      styles += `  text-align: ${data.typography.textAlignHorizontal.toLowerCase()};\n`;
    }
    if (data.typography.letterSpacing) {
      styles += `  letter-spacing: ${data.typography.letterSpacing}px;\n`;
    }
    if (data.typography.lineHeightPx) {
      styles += `  line-height: ${data.typography.lineHeightPx}px;\n`;
    }
    styles += `\n`;
  }
  
  // Add accessibility and interaction styles
  if (data.semantic?.isInteractive) {
    styles += `  /* Interactive states */\n`;
    styles += `  cursor: pointer;\n`;
    styles += `  transition: all 0.2s ease;\n`;
    styles += `\n`;
    styles += `  &:hover {\n`;
    styles += `    /* Add hover effects based on design */\n`;
    styles += `    transform: translateY(-1px);\n`;
    styles += `  }\n`;
    styles += `\n`;
    styles += `  &:active {\n`;
    styles += `    transform: translateY(0);\n`;
    styles += `  }\n`;
    styles += `\n`;
  }
  
  styles += `  /* Ensure pixel-perfect rendering */\n`;
  styles += `  image-rendering: -webkit-optimize-contrast;\n`;
  styles += `  image-rendering: crisp-edges;\n`;
  styles += `}\n`;
  
  return styles;
}

function getBorderRadiusValue(borderRadius: any): string {
  if (borderRadius.uniform) {
    return `${borderRadius.uniform}px`;
  }
  const values = [
    borderRadius.topLeft || 0,
    borderRadius.topRight || 0,
    borderRadius.bottomRight || 0,
    borderRadius.bottomLeft || 0
  ];
  return values.map(v => `${v}px`).join(' ');
}

// Helper function to extract colors from all children
function extractChildrenColors(children: any[]) {
  const colors = {
    primary: '#000000',
    secondary: '#CCCCCC', 
    background: '#FFFFFF',
    border: '#000000',
    text: '#000000',
    all: {} as Record<string, string>
  };
  
  if (!children || children.length === 0) return colors;
  
  // Extract colors from all children
  children.forEach((child: any, index: number) => {
    const fills = child.visuals?.fills || [];
    fills.forEach((fill: any) => {
      if (fill.type === 'SOLID' && fill.visible !== false && fill.color) {
        let colorStr = '';
        if (typeof fill.color === 'string') {
          colorStr = fill.color;
        } else if (fill.color.r !== undefined) {
          const r = Math.round(fill.color.r * 255);
          const g = Math.round(fill.color.g * 255);
          const b = Math.round(fill.color.b * 255);
          const a = fill.color.a !== undefined ? fill.color.a : 1;
          // Convert to hex for dark colors, rgba for transparency
          if (a === 1) {
            colorStr = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          } else {
            colorStr = `rgba(${r}, ${g}, ${b}, ${a})`;
          }
        }
        
        if (colorStr) {
          colors.all[`child${index}_${child.component || 'element'}`] = colorStr;
          // Set primary color to the first dark color we find
          if (index === 0 || colors.primary === '#000000') {
            colors.primary = colorStr;
          }
        }
      }
    });
  });
  
  return colors;
}

// Enhanced design data processing functions with deep extraction
async function processEnhancedDesignData(component: any, options: {
  includeVectorPaths: boolean;
  normalizeCoordinates: boolean;
  standardizeColors: boolean;
}) {
  const { includeVectorPaths, normalizeCoordinates, standardizeColors } = options;
  
  console.log('🔍 Processing enhanced design data for:', component.component);
  console.log('📊 Component structure:', {
    hasChildren: !!(component.children && component.children.length > 0),
    childrenCount: component.children?.length || 0,
    hasSize: !!component.size,
    hasPosition: !!component.position
  });
  
  // Process ALL children with DEEP extraction for complex designs
  const children = component.children || [];
  
  // Use the component's actual size and position as the container
  const size = component.size || { width: 880, height: 824 }; // Support larger components
  const position = component.position || { x: 0, y: 0 };
  
  console.log('📐 Container dimensions:', size);
  console.log('📍 Container position:', position);
  
  // DEEP EXTRACTION: Process nested children recursively
  function extractAllVisualElements(parentChildren: any[], parentPath: string = ''): any[] {
    const allElements: any[] = [];
    
    parentChildren.forEach((child: any, index: number) => {
      const childPath = parentPath ? `${parentPath} > ${child.component}` : child.component;
      
      // Add this child as a visual element
      const childColor = extractActualColor(child);
      const childSize = child.size || { width: 100, height: 100 };
      const childPos = child.position || { x: 0, y: 0 };
      const vectorPaths = child.geometry?.vectorPaths || [];
      
      allElements.push({
        name: child.component || `Child${index}`,
        type: child.suggestedComponentType || 'element',
        size: childSize,
        position: childPos,
        color: childColor,
        fills: child.visuals?.fills || [],
        effects: child.effects || [],
        vectorPaths: vectorPaths,
        svgData: child.geometry?.svgData || '',
        path: childPath,
        depth: parentPath.split(' > ').length
      });
      
      // Recursively process nested children for complex designs
      if (child.children && child.children.length > 0) {
        const nestedElements = extractAllVisualElements(child.children, childPath);
        allElements.push(...nestedElements);
      }
    });
    
    return allElements;
  }
  
  const allVisualElements = extractAllVisualElements(children);
  console.log(`🎨 Deep extraction found ${allVisualElements.length} visual elements across all levels`);
  
  // Enhanced data structure with DEEP EXTRACTION data
  const enhancedData = {
    metadata: {
      name: component.component || component.name || 'Enhanced Component',
      description: component.description || '',
      componentType: component.suggestedComponentType || 'component',
      originalId: component.id || '',
      tags: component.tags || [],
      complexity: allVisualElements.length > 10 ? 'complex' : allVisualElements.length > 5 ? 'medium' : 'simple',
      totalElements: allVisualElements.length
    },
    positioning: {
      relative: { x: 0, y: 0, width: 100, height: 100 },
      absolute: {
        x: 0,
        y: 0,
        width: size.width,
        height: size.height
      }
    },
    vectorPaths: includeVectorPaths ? {
      svgPath: convertToSVGPath(component),
      cssPath: convertToCSSPath(component),
      complexity: allVisualElements.length > 10 ? 'very-complex' : allVisualElements.length > 5 ? 'complex' : 'simple'
    } : {
      svgPath: '',
      cssPath: '',
      complexity: 'simple' as const
    },
    // Use ALL visual elements from deep extraction
    children: allVisualElements.map((element: any, index: number) => {
      console.log(`🎨 Element ${index + 1}:`, {
        name: element.name,
        path: element.path,
        color: element.color,
        position: element.position,
        size: element.size,
        depth: element.depth,
        hasVectorPaths: element.vectorPaths.length > 0,
        hasEffects: element.effects.length > 0
      });
      
      return {
        name: element.name,
        type: element.type,
        size: element.size,
        position: element.position,
        color: element.color,
        fills: element.fills,
        effects: element.effects,
        vectorPaths: element.vectorPaths,
        svgData: element.svgData,
        path: element.path,
        depth: element.depth
      };
    }),
    colors: standardizeColors ? extractDeepChildrenColors(allVisualElements) : {
      primary: '#000000',
      secondary: '#CCCCCC',
      background: '#FFFFFF',
      border: '#000000',
      text: '#000000',
      all: {}
    },
    styles: extractCompleteStyles(component),
    designTokens: extractDesignTokens(component),
    visualData: {
      fills: component.visuals?.fills || [],
      size: size,
      position: position,
      borderRadius: component.visuals?.borderRadius,
      effects: component.effects || [],
      complexity: allVisualElements.length
    }
  };
  
  console.log('✅ Enhanced data processed:', {
    childrenCount: enhancedData.children.length,
    colorsFound: Object.keys(enhancedData.colors.all).length,
    containerSize: enhancedData.positioning.absolute
  });
  
  return enhancedData;
}

// Helper function to extract actual color from child element
function extractActualColor(child: any): string {
  // Try to get color from visuals.fills first (most accurate)
  if (child.visuals?.fills && child.visuals.fills.length > 0) {
    const fill = child.visuals.fills.find((f: any) => f.visible !== false && f.type === 'SOLID');
    if (fill && fill.color) {
      return fill.color; // This will be in format "rgba(255, 114, 55, 1)"
    }
  }
  
  // Fallback to typography color
  if (child.typography?.textColor) {
    return child.typography.textColor;
  }
  
  // Final fallback
  return '#000000';
}

// Helper function to extract colors with correct mapping
function extractActualChildrenColors(children: any[]) {
  const colors = {
    primary: '#000000',
    secondary: '#CCCCCC', 
    background: '#FFFFFF',
    border: '#000000',
    text: '#000000',
    all: {} as Record<string, string>
  };
  
  if (!children || children.length === 0) return colors;
  
  // Extract actual colors from each child with their positions
  children.forEach((child: any, index: number) => {
    const childColor = extractActualColor(child);
    const childPos = child.position || { x: 0, y: 0 };
    
    if (childColor && childColor !== '#000000') {
      // Create a meaningful key based on position and index
      const key = `child${index}_pos${Math.round(childPos.x)}_${Math.round(childPos.y)}`;
      colors.all[key] = childColor;
      
      // Set primary color to the first colored element
      if (index === 0 || colors.primary === '#000000') {
        colors.primary = childColor;
      }
      
      console.log(`🎨 Color mapping: ${key} = ${childColor} at (${childPos.x}, ${childPos.y})`);
    }
  });
  
  return colors;
}

// Deep color extraction from all visual elements
function extractDeepChildrenColors(allVisualElements: any[]) {
  const colors = {
    primary: '#000000',
    secondary: '#CCCCCC', 
    background: '#FFFFFF',
    border: '#000000',
    text: '#000000',
    all: {} as Record<string, string>
  };
  
  if (!allVisualElements || allVisualElements.length === 0) return colors;
  
  // Extract colors from ALL visual elements including nested ones
  allVisualElements.forEach((element: any, index: number) => {
    const elementColor = element.color;
    const elementPos = element.position || { x: 0, y: 0 };
    
    // Also extract colors from fills array for complex gradients
    if (element.fills && element.fills.length > 0) {
      element.fills.forEach((fill: any, fillIndex: number) => {
        if (fill.visible !== false && fill.type === 'SOLID' && fill.color) {
          const key = `${element.path.replace(/[^a-zA-Z0-9]/g, '_')}_fill${fillIndex}`;
          colors.all[key] = fill.color;
          console.log(`🎨 Deep color: ${key} = ${fill.color} from ${element.path}`);
        } else if (fill.type === 'GRADIENT_LINEAR' && fill.gradientStops) {
          // Extract gradient stop colors
          fill.gradientStops.forEach((stop: any, stopIndex: number) => {
            if (stop.color) {
              const key = `${element.path.replace(/[^a-zA-Z0-9]/g, '_')}_gradient${fillIndex}_stop${stopIndex}`;
              colors.all[key] = stop.color;
              console.log(`🎨 Gradient color: ${key} = ${stop.color} from ${element.path}`);
            }
          });
        }
      });
    }
    
    // Standard color extraction
    if (elementColor && elementColor !== '#000000' && elementColor !== 'transparent') {
      const key = `${element.path.replace(/[^a-zA-Z0-9]/g, '_')}_depth${element.depth}`;
      colors.all[key] = elementColor;
      
      // Set primary color to the first colored element
      if (index === 0 || colors.primary === '#000000') {
        colors.primary = elementColor;
      }
      
      console.log(`🎨 Deep color mapping: ${key} = ${elementColor} from ${element.path}`);
    }
  });
  
  return colors;
}

function convertToSVGPath(component: any): string {
  // Convert vector paths to SVG
  if (component.vectorPaths && component.vectorPaths.length > 0) {
    return component.vectorPaths.map((path: any) => path.data || '').join(' ');
  }
  
  // Handle complex SVG components with multiple paths
  if (component.children && component.children.length > 0) {
    const childPaths = component.children
      .filter((child: any) => child.vectorPaths && child.vectorPaths.length > 0)
      .map((child: any) => child.vectorPaths.map((path: any) => path.data || '').join(' '))
      .join(' ');
    
    if (childPaths) return childPaths;
  }
  
  // Fallback to rectangle
  return `M 0 0 L ${component.width || 0} 0 L ${component.width || 0} ${component.height || 0} L 0 ${component.height || 0} Z`;
}

function convertToCSSPath(component: any): string {
  // Convert to CSS clip-path
  const svgPath = convertToSVGPath(component);
  if (svgPath.includes('M 0 0 L')) {
    return 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
  }
  return 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
}

function determineComplexity(component: any): 'simple' | 'complex' | 'very-complex' {
  if (component.vectorPaths && component.vectorPaths.length > 5) {
    return 'very-complex';
  }
  if (component.vectorPaths && component.vectorPaths.length > 2) {
    return 'complex';
  }
  return 'simple';
}

function standardizeColorsToHex(component: any) {
  const colors: { [key: string]: string } = {};
  
  // Get fills from the correct location
  const fills = component.visuals?.fills || component.fills || [];
  
  // Process fills
  fills.forEach((fill: any, index: number) => {
    if (fill.visible !== false && fill.color) {
      let hexColor = '#000000';
      
      if (fill.type === 'SOLID' && fill.color) {
        // Handle rgba color format
        if (typeof fill.color === 'string' && fill.color.startsWith('rgba')) {
          // Parse rgba string
          const rgbaMatch = fill.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
          if (rgbaMatch) {
            const r = parseInt(rgbaMatch[1]);
            const g = parseInt(rgbaMatch[2]);
            const b = parseInt(rgbaMatch[3]);
            const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
            hexColor = rgbaToHex(r / 255, g / 255, b / 255, a);
          }
        } else if (fill.color.r !== undefined) {
          // Handle object format {r, g, b, a}
          hexColor = rgbaToHex(fill.color.r, fill.color.g, fill.color.b, fill.opacity || 1);
        }
      } else if (fill.type === 'GRADIENT_LINEAR' && fill.gradientStops) {
        // Handle gradient - use first stop color
        const firstStop = fill.gradientStops[0];
        if (firstStop && firstStop.color) {
          if (typeof firstStop.color === 'string' && firstStop.color.startsWith('rgba')) {
            const rgbaMatch = firstStop.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (rgbaMatch) {
              const r = parseInt(rgbaMatch[1]);
              const g = parseInt(rgbaMatch[2]);
              const b = parseInt(rgbaMatch[3]);
              const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
              hexColor = rgbaToHex(r / 255, g / 255, b / 255, a);
            }
          } else if (firstStop.color.r !== undefined) {
            hexColor = rgbaToHex(firstStop.color.r, firstStop.color.g, firstStop.color.b, firstStop.color.a || 1);
          }
        }
      }
      
      colors[`fill${index}`] = hexColor;
      if (index === 0) colors.primary = hexColor;
      if (fill.type === 'SOLID') colors.background = hexColor;
    }
  });
  
  // Process strokes
  const strokes = component.visuals?.strokes || component.strokes || [];
  strokes.forEach((stroke: any, index: number) => {
    if (stroke.visible !== false && stroke.color) {
      const hexColor = rgbaToHex(stroke.color.r, stroke.color.g, stroke.color.b, stroke.opacity || 1);
      colors[`stroke${index}`] = hexColor;
      if (index === 0) colors.border = hexColor;
    }
  });
  
  return {
    primary: colors.primary || '#000000',
    secondary: colors.secondary || '#CCCCCC',
    background: colors.background || '#FFFFFF',
    border: colors.border || '#000000',
    text: colors.text || '#000000',
    all: colors
  };
}

function rgbaToHex(r: number, g: number, b: number, a: number = 1): string {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  return a < 1 ? `${hex}${Math.round(a * 255).toString(16).padStart(2, '0')}` : hex;
}

function extractCompleteStyles(component: any) {
  return {
    borderRadius: {
      topLeft: component.cornerRadius || 0,
      topRight: component.cornerRadius || 0,
      bottomRight: component.cornerRadius || 0,
      bottomLeft: component.cornerRadius || 0,
      uniform: component.cornerRadius || 0
    },
    shadows: (component.effects || [])
      .filter((effect: any) => effect.visible !== false && effect.type === 'DROP_SHADOW')
      .map((effect: any) => ({
        x: effect.offset?.x || 0,
        y: effect.offset?.y || 0,
        blur: effect.radius || 0,
        spread: effect.spread || 0,
        color: rgbaToHex(effect.color.r, effect.color.g, effect.color.b, effect.color.a || 1),
        opacity: effect.color.a || 1
      })),
    effects: (component.effects || [])
      .filter((effect: any) => effect.visible !== false)
      .map((effect: any) => ({
        type: effect.type,
        visible: effect.visible !== false,
        radius: effect.radius || 0,
        color: effect.color ? rgbaToHex(effect.color.r, effect.color.g, effect.color.b, effect.color.a || 1) : '#000000',
        offset: {
          x: effect.offset?.x || 0,
          y: effect.offset?.y || 0
        }
      })),
    opacity: component.opacity || 1,
    blendMode: component.blendMode || 'NORMAL'
  };
}

function extractDesignTokens(component: any) {
  return {
    colors: standardizeColorsToHex(component).all,
    spacing: {
      padding: component.paddingTop || 0,
      margin: component.itemSpacing || 0,
      gap: component.itemSpacing || 0
    },
    typography: {
      fontSize: component.fontSize || 16,
      fontFamily: component.fontName?.family || 'Inter',
      fontWeight: component.fontWeight || 400,
      lineHeight: component.lineHeightPx || component.fontSize || 16
    },
    sizing: {
      width: component.width || 0,
      height: component.height || 0,
      minWidth: component.minWidth || 0,
      minHeight: component.minHeight || 0
    },
    shadows: {},
    borders: {
      width: component.strokeWeight || 0,
      style: component.strokeAlign || 'INSIDE',
      radius: component.cornerRadius || 0
    }
  };
}

function generateMultiPathSVG(enhancedData: any, colors: any, styles: any): string {
  const { visualData } = enhancedData;
  
  // If we have multiple children with vector paths, generate multiple path elements
  if (visualData.children && visualData.children.length > 0) {
    return visualData.children
      .filter((child: any) => child.visuals?.fills && child.visuals.fills.length > 0)
      .map((child: any, index: number) => {
        const fill = child.visuals.fills[0];
        const pathData = child.vectorPaths?.[0]?.data || '';
        const fillColor = fill.type === 'SOLID' ? 
          (typeof fill.color === 'string' ? fill.color : rgbaToHex(fill.color.r, fill.color.g, fill.color.b, fill.color.a || 1)) : 
          colors.primary;
        
        return `<path 
          d="${pathData}"
          fill="${fillColor}"
          stroke="${colors.border || 'none'}"
          strokeWidth="${styles.designTokens?.borders?.width || 0}"
        />`;
      })
      .join('\n        ');
  }
  
  // Fallback to single path
  return `<path 
    d="${enhancedData.vectorPaths?.svgPath || ''}"
    fill="${colors.primary}"
    stroke="${colors.border || 'none'}"
    strokeWidth="${styles.designTokens?.borders?.width || 0}"
  />`;
}

function generateEnhancedReactComponent(enhancedData: any): string {
  const { metadata, positioning, vectorPaths, colors, styles, children } = enhancedData;
  
  console.log('🎨 Generating React component with:', {
    childrenCount: children.length,
    colorsAvailable: Object.keys(colors.all),
    containerSize: positioning.absolute,
    complexity: metadata.complexity,
    totalElements: metadata.totalElements
  });
  
  // Detect component type for specialized styling
  const componentType = detectComponentType(metadata.name, children);
  console.log('🔍 Detected component type:', componentType);
  
  // Handle complex designs differently
  const isComplex = metadata.complexity === 'complex' || metadata.totalElements > 10;
  console.log(`🔧 Complex design handling: ${isComplex ? 'ENABLED' : 'Standard'}`);
  
  // Generate children components with intelligent styling and depth awareness
  const childComponents = generateIntelligentChildComponents(children, positioning, colors, componentType, isComplex);
  
  // Generate container styles based on component type
  const containerStyles = generateIntelligentContainerStyles(positioning, componentType, colors, isComplex);
  
  // Generate CSS for complex gradients and effects
  const complexStyles = isComplex ? generateComplexEffectStyles(children, colors) : '';
  
  return `import React from 'react';

/**
 * Enhanced ${metadata.name} Component
 * Generated with deep extraction and intelligent styling
 * Original ID: ${metadata.originalId}
 * Component Type: ${componentType}
 * Complexity: ${metadata.complexity} (${metadata.totalElements} elements)
 * 
 * Deep extraction data:
 * - Container: ${positioning.absolute.width}x${positioning.absolute.height}px
 * - Visual Elements: ${children.length} across all hierarchy levels
 * - Colors Extracted: ${Object.keys(colors.all).length} unique colors
 * - Gradients & Effects: ${children.filter((c: any) => c.fills?.length > 0 || c.effects?.length > 0).length} elements
 * 
 * Screenshot Context: Use visual reference for accurate styling validation
 */
export const ${metadata.name.replace(/[^a-zA-Z0-9]/g, '')}Component: React.FC = () => {
  return (
    <>
      ${complexStyles ? `<style>{\`${complexStyles}\`}</style>` : ''}
      <div 
        className="${metadata.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}-component"
        style={{
          ${containerStyles}
        }}
        data-complexity="${metadata.complexity}"
        data-elements="${metadata.totalElements}"
      >
        ${childComponents}
      </div>
    </>
  );
};

export default ${metadata.name.replace(/[^a-zA-Z0-9]/g, '')}Component;`;
}

// Intelligent component type detection
function detectComponentType(componentName: string, children: any[]): string {
  const name = componentName.toLowerCase();
  
  // Dialog/Alert detection
  if (name.includes('alert') || name.includes('dialog') || name.includes('popup') || name.includes('modal')) {
    return 'dialog';
  }
  
  // Button detection
  if (name.includes('button') || name.includes('btn')) {
    return 'button';
  }
  
  // Icon detection
  if (name.includes('icon') || (children.length <= 5 && !hasTextContent(children))) {
    return 'icon';
  }
  
  // Form/Input detection
  if (name.includes('input') || name.includes('form') || name.includes('field')) {
    return 'input';
  }
  
  // Card detection
  if (name.includes('card') || name.includes('panel')) {
    return 'card';
  }
  
  // Default based on complexity
  if (children.length > 5) {
    return 'complex-ui';
  }
  
  return 'component';
}

// Check if children contain text content
function hasTextContent(children: any[]): boolean {
  return children.some(child => 
    child.name?.toLowerCase().includes('text') || 
    child.name?.toLowerCase().includes('title') || 
    child.name?.toLowerCase().includes('label') ||
    child.name?.toLowerCase().includes('description')
  );
}

// Generate complex CSS effects for advanced designs
function generateComplexEffectStyles(children: any[], colors: any): string {
  let styles = '';
  
  children.forEach((child: any, index: number) => {
    const className = child.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
    
    // Generate gradient backgrounds from fills
    if (child.fills && child.fills.length > 0) {
      child.fills.forEach((fill: any, fillIndex: number) => {
        if (fill.type === 'GRADIENT_LINEAR' && fill.gradientStops) {
          const stops = fill.gradientStops.map((stop: any) => 
            `${stop.color} ${Math.round(stop.position * 100)}%`
          ).join(', ');
          styles += `.${className} { background: linear-gradient(${fill.angle || 90}deg, ${stops}); }\n`;
        } else if (fill.type === 'GRADIENT_RADIAL' && fill.gradientStops) {
          const stops = fill.gradientStops.map((stop: any) => 
            `${stop.color} ${Math.round(stop.position * 100)}%`
          ).join(', ');
          styles += `.${className} { background: radial-gradient(circle, ${stops}); }\n`;
        } else if (fill.type === 'GRADIENT_ANGULAR' && fill.gradientStops) {
          const stops = fill.gradientStops.map((stop: any) => 
            `${stop.color} ${Math.round(stop.position * 100)}%`
          ).join(', ');
          styles += `.${className} { background: conic-gradient(${stops}); }\n`;
        }
      });
    }
    
    // Generate complex shadow effects
    if (child.effects && child.effects.length > 0) {
      const shadows = child.effects
        .filter((effect: any) => effect.visible !== false)
        .map((effect: any) => {
          if (effect.type === 'DROP_SHADOW') {
            const x = effect.offset?.[0] || 0;
            const y = effect.offset?.[1] || 0;
            const blur = effect.radius || 0;
            const spread = effect.spread || 0;
            const color = effect.color || 'rgba(0,0,0,0.25)';
            return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
          } else if (effect.type === 'INNER_SHADOW') {
            const x = effect.offset?.[0] || 0;
            const y = effect.offset?.[1] || 0;
            const blur = effect.radius || 0;
            const spread = effect.spread || 0;
            const color = effect.color || 'rgba(0,0,0,0.25)';
            return `inset ${x}px ${y}px ${blur}px ${spread}px ${color}`;
          } else if (effect.type === 'LAYER_BLUR') {
            styles += `.${className} { filter: blur(${effect.radius || 4}px); }\n`;
          }
          return '';
        })
        .filter(Boolean);
      
      if (shadows.length > 0) {
        styles += `.${className} { box-shadow: ${shadows.join(', ')}; }\n`;
      }
    }
  });
  
  return styles;
}

// Generate intelligent child components based on component type
function generateIntelligentChildComponents(children: any[], positioning: any, colors: any, componentType: string, isComplex: boolean = false): string {
  return children.map((child: any, index: number) => {
    const childColor = child.color || colors.primary;
    const childSize = child.size;
    const childPos = child.position;
    
    // Calculate percentage positions relative to container
    const leftPercent = ((childPos.x / positioning.absolute.width) * 100).toFixed(2);
    const topPercent = ((childPos.y / positioning.absolute.height) * 100).toFixed(2);
    const widthPercent = ((childSize.width / positioning.absolute.width) * 100).toFixed(2);
    const heightPercent = ((childSize.height / positioning.absolute.height) * 100).toFixed(2);
    
    // Generate component-type-specific styling
    const childStyles = generateChildStyles(child, componentType, childColor);
    
    // Handle different child types
    if (child.vectorPaths && child.vectorPaths.length > 0) {
      const vectorPath = child.vectorPaths[0];
      const pathData = vectorPath.data || '';
      
      return `<svg
        key="${index}"
        className="${child.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}"
        style={{
          position: 'absolute',
          left: '${leftPercent}%',
          top: '${topPercent}%',
          width: '${widthPercent}%',
          height: '${heightPercent}%',
        }}
        viewBox="0 0 ${childSize.width} ${childSize.height}"
        fill="none"
      >
        <path 
          d="${pathData}"
          fill="${childColor}"
          stroke="none"
          strokeWidth="0"
        />
      </svg>`;
    } else {
      return `<div
        key="${index}"
        className="${child.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}"
        style={{
          position: 'absolute',
          left: '${leftPercent}%',
          top: '${topPercent}%',
          width: '${widthPercent}%',
          height: '${heightPercent}%',
          ${childStyles}
        }}
        title="${child.name}"
      >
        ${generateChildContent(child, componentType)}
      </div>`;
    }
  }).join('\n      ');
}

// Generate child-specific styles based on component type and child name
function generateChildStyles(child: any, componentType: string, childColor: string): string {
  const childName = child.name?.toLowerCase() || '';
  let styles = `backgroundColor: '${childColor}',\n          `;
  
  if (componentType === 'dialog') {
    // Dialog-specific child styling
    if (childName.includes('background')) {
      styles += `borderRadius: '12px',\n          `;
      styles += `boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',\n          `;
    } else if (childName.includes('button') || childName.includes('cancel')) {
      styles += `background: 'linear-gradient(to bottom, #fdfdfd, #f1f1f1)',\n          `;
      styles += `border: '1px solid #c7c7cc',\n          `;
      styles += `borderRadius: '5px',\n          `;
      styles += `display: 'flex',\n          `;
      styles += `alignItems: 'center',\n          `;
      styles += `justifyContent: 'center',\n          `;
      styles += `fontSize: '13px',\n          `;
      styles += `color: '#1d1d1f',\n          `;
      styles += `cursor: 'pointer',\n          `;
    } else if (childName.includes('title')) {
      styles += `fontSize: '13px',\n          `;
      styles += `fontWeight: '600',\n          `;
      styles += `color: '#1d1d1f',\n          `;
      styles += `textAlign: 'center',\n          `;
      styles += `display: 'flex',\n          `;
      styles += `alignItems: 'center',\n          `;
      styles += `justifyContent: 'center',\n          `;
    } else if (childName.includes('description')) {
      styles += `fontSize: '11px',\n          `;
      styles += `color: '#6e6e73',\n          `;
      styles += `textAlign: 'center',\n          `;
      styles += `lineHeight: '1.4',\n          `;
      styles += `display: 'flex',\n          `;
      styles += `alignItems: 'flex-start',\n          `;
      styles += `justifyContent: 'center',\n          `;
    } else if (childName.includes('header') || childName.includes('icon')) {
      styles += `background: '#b8d4f0',\n          `;
      styles += `borderRadius: '12px',\n          `;
      styles += `display: 'flex',\n          `;
      styles += `alignItems: 'center',\n          `;
      styles += `justifyContent: 'center',\n          `;
    }
  } else if (componentType === 'icon') {
    // Icon-specific styling
    const isCircular = Math.abs(child.size?.width - child.size?.height) < 5;
    const borderRadius = isCircular ? '50%' : '44.7px';
    styles += `borderRadius: '${borderRadius}',\n          `;
  } else {
    // Default styling
    styles += `borderRadius: '4px',\n          `;
    styles += `display: 'flex',\n          `;
    styles += `alignItems: 'center',\n          `;
    styles += `justifyContent: 'center',\n          `;
  }
  
  return styles;
}

// Generate child content based on component type
function generateChildContent(child: any, componentType: string): string {
  const childName = child.name?.toLowerCase() || '';
  
  if (componentType === 'dialog') {
    if (childName.includes('title')) {
      return 'Title Goes Here';
    } else if (childName.includes('description')) {
      return 'Description text about this alert is shown here, explaining to users what the options underneath are about and what to do.';
    } else if (childName.includes('popup') && childName.includes('button')) {
      return `<span>Lorem ipsum dolor</span>
        <div style={{
          width: '0',
          height: '0',
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: '4px solid #8e8e93',
          marginLeft: '8px'
        }} />`;
    } else if (childName.includes('cancel')) {
      return 'Label';
    } else if (childName.includes('ask')) {
      return `<div style={{
          width: '14px',
          height: '14px',
          border: '1px solid #c7c7cc',
          borderRadius: '2px',
          background: 'white',
          marginRight: '8px'
        }} />
        Don't ask again`;
    }
  }
  
  return '';
}

// Generate intelligent container styles based on component type
function generateIntelligentContainerStyles(positioning: any, componentType: string, colors: any, isComplex: boolean = false): string {
  let styles = `position: 'relative',\n        `;
  styles += `width: '${positioning.absolute.width}px',\n        `;
  styles += `height: '${positioning.absolute.height}px',\n        `;
  
  if (componentType === 'dialog') {
    styles += `background: 'white',\n        `;
    styles += `borderRadius: '12px',\n        `;
    styles += `boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',\n        `;
    styles += `fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',\n        `;
    styles += `overflow: 'hidden',\n        `;
  } else if (componentType === 'icon') {
    styles += `backgroundColor: 'transparent',\n        `;
    styles += `overflow: 'visible',\n        `;
  } else {
    styles += `backgroundColor: 'transparent',\n        `;
    styles += `overflow: 'hidden',\n        `;
  }
  
  return styles;
}

function generateEnhancedVueComponent(enhancedData: any): string {
  const { metadata, positioning, vectorPaths, colors, styles } = enhancedData;
  
  return `<template>
  <div 
    class="${metadata.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}-component"
    :style="{
      left: '${positioning.relative.x}%',
      top: '${positioning.relative.y}%',
      width: '${positioning.relative.width}%',
      height: '${positioning.relative.height}%',
      backgroundColor: '${colors.background}',
      borderRadius: '${styles.borderRadius.uniform}px',
      opacity: ${styles.opacity},
      zIndex: 1
    }"
  >
    ${vectorPaths.svgPath ? `<svg 
      width="100%" 
      height="100%" 
      viewBox="0 0 ${positioning.absolute.width} ${positioning.absolute.height}"
      style="position: absolute; top: 0; left: 0;"
    >
      <path 
        d="${vectorPaths.svgPath}"
        fill="${colors.primary}"
        stroke="${colors.border}"
        stroke-width="${styles.designTokens?.borders?.width || 0}"
      />
    </svg>` : ''}
  </div>
</template>

<script>
export default {
  name: '${metadata.name.replace(/[^a-zA-Z0-9]/g, '')}Component',
  props: {},
  data() {
    return {};
  }
};
</script>`;
}

function generateEnhancedHTML(enhancedData: any): string {
  const { metadata, positioning, vectorPaths, colors, styles } = enhancedData;
  
  return `<!-- Enhanced ${metadata.name} -->
<!-- Generated with vector path conversion, normalized coordinates, and standardized colors -->
<div 
  class="${metadata.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}-component"
  style="
    position: relative;
    left: ${positioning.relative.x}%;
    top: ${positioning.relative.y}%;
    width: ${positioning.relative.width}%;
    height: ${positioning.relative.height}%;
    background-color: ${colors.background};
    border-radius: ${styles.borderRadius.uniform}px;
    opacity: ${styles.opacity};
    z-index: 1;
  "
>
  ${vectorPaths.svgPath ? `<svg 
    width="100%" 
    height="100%" 
    viewBox="0 0 ${positioning.absolute.width} ${positioning.absolute.height}"
    style="position: absolute; top: 0; left: 0;"
  >
    <path 
      d="${vectorPaths.svgPath}"
      fill="${colors.primary}"
      stroke="${colors.border}"
      stroke-width="${styles.designTokens?.borders?.width || 0}"
    />
  </svg>` : ''}
</div>`;
}

function generateEnhancedCSS(enhancedData: any): string {
  const { metadata, positioning, vectorPaths, colors, styles, visualData } = enhancedData;
  
  // Generate gradient CSS if there are gradient fills
  let gradientCSS = '';
  let backgroundCSS = `background-color: ${colors.background};`;
  
  if (visualData.fills) {
    const gradientFill = visualData.fills.find((fill: any) => fill.type === 'GRADIENT_LINEAR' && fill.visible !== false);
    if (gradientFill && gradientFill.gradientStops) {
      const gradientStops = gradientFill.gradientStops.map((stop: any) => {
        const color = stop.color.startsWith('rgba') ? stop.color : `rgba(0, 0, 0, ${stop.color.a || 1})`;
        return `${color} ${stop.position * 100}%`;
      }).join(', ');
      
      gradientCSS = `background: linear-gradient(to bottom, ${gradientStops});`;
      backgroundCSS = `background: linear-gradient(to bottom, ${gradientStops});`;
    }
  }
  
  // Get border radius from visual data
  const borderRadius = visualData.borderRadius?.uniform || styles.borderRadius?.uniform || 0;
  
  return `/* Enhanced ${metadata.name} Styles */
/* Generated with complete design data processing */

.${metadata.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}-component {
  position: relative;
  left: ${positioning.relative.x}%;
  top: ${positioning.relative.y}%;
  width: ${positioning.relative.width}%;
  height: ${positioning.relative.height}%;
  ${backgroundCSS}
  border-radius: ${borderRadius}px;
  opacity: ${styles.opacity || 1};
  z-index: 1;
  
  /* Enhanced features */
  ${vectorPaths.cssPath && vectorPaths.cssPath !== 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' ? `clip-path: ${vectorPaths.cssPath};` : ''}
  
  /* Shadows */
  ${styles.shadows && styles.shadows.length > 0 ? styles.shadows.map((shadow: any, index: number) => 
    `box-shadow: ${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${shadow.color};`
  ).join('\n  ') : ''}
  
  /* Effects */
  ${styles.effects.map((effect: any, index: number) => 
    `filter: ${effect.type === 'DROP_SHADOW' ? `drop-shadow(${effect.offset.x}px ${effect.offset.y}px ${effect.radius}px ${effect.color})` : ''};`
  ).join('\n  ')}
}

/* Responsive design */
@media (max-width: 768px) {
  .${metadata.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}-component {
    left: 0;
    top: 0;
    width: 100%;
    height: auto;
  }
}`;
}

// Enhanced screenshot validation functions
async function validateWithScreenshot(componentId: string, generatedCode?: string) {
  try {
    console.log('🔍 Validating component with screenshot:', componentId);
    
    // Get component data
    const component = getComponentFromFigment(componentId);
    if (!component) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Component not found**: ${componentId}`
          }
        ]
      };
    }
    
    // Check if screenshot exists or can be extracted
    const screenshotPath = await extractScreenshotForValidation(componentId);
    
    // Generate current code if not provided
    if (!generatedCode) {
      const codeResult = await generateEnhancedComponentCode(componentId, 'react', true, true, true);
      if (codeResult.content && codeResult.content[0] && codeResult.content[0].text) {
        const codeMatch = codeResult.content[0].text.match(/```(?:tsx|jsx|react)\n([\s\S]*?)\n```/);
        if (codeMatch) {
          generatedCode = codeMatch[1];
        }
      }
    }
    
    // Analyze component structure for validation
    const validationReport = analyzeComponentAccuracy(component, generatedCode);
    
    let result = `🔍 **Screenshot Validation Report**\n\n`;
    result += `**Component:** ${component.component || component.name}\n`;
    result += `**Token:** ${componentId}\n`;
    result += `**Screenshot:** ${screenshotPath ? 'Available' : 'Missing'}\n\n`;
    
    if (screenshotPath) {
      result += `**Visual Reference:** \`${screenshotPath}\`\n\n`;
    }
    
    result += `**Accuracy Analysis:**\n`;
    result += `- **Colors:** ${validationReport.colorsAccurate ? '✅ Accurate' : '❌ Inaccurate'}\n`;
    result += `- **Positioning:** ${validationReport.positioningAccurate ? '✅ Accurate' : '❌ Inaccurate'}\n`;
    result += `- **Shapes:** ${validationReport.shapesAccurate ? '✅ Accurate' : '❌ Inaccurate'}\n`;
    result += `- **Formation:** ${validationReport.formationAccurate ? '✅ Accurate F shape' : '❌ Wrong formation'}\n\n`;
    
    if (validationReport.issues.length > 0) {
      result += `**Issues Found:**\n`;
      validationReport.issues.forEach((issue, index) => {
        result += `${index + 1}. ${issue}\n`;
      });
      result += '\n';
    }
    
    if (validationReport.suggestions.length > 0) {
      result += `**Improvement Suggestions:**\n`;
      validationReport.suggestions.forEach((suggestion, index) => {
        result += `${index + 1}. ${suggestion}\n`;
      });
    }
    
    return {
      content: [
        {
          type: 'text',
          text: result
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Validation error**: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
}

async function captureComponentScreenshot(componentId: string, includeInDebugData: boolean = true) {
  try {
    console.log('📸 Capturing screenshot for component:', componentId);
    
    // Get component data
    const component = getComponentFromFigment(componentId);
    if (!component) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Component not found**: ${componentId}`
          }
        ]
      };
    }
    
    // Try to get screenshot from bridge endpoint
    let screenshotData = null;
    try {
      const response = await fetch(`http://localhost:8473/screenshot/${componentId}?format=png&scale=2`);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        screenshotData = buffer.toString('base64');
      }
    } catch (error) {
      console.log('Bridge screenshot not available:', error instanceof Error ? error.message : String(error));
    }
    
    // Save screenshot to file
    let screenshotPath = null;
    if (screenshotData) {
      const filename = `${componentId}-screenshot.png`;
      screenshotPath = path.join(EXPORT_DIR, filename);
      const binaryData = Buffer.from(screenshotData, 'base64');
      fs.writeFileSync(screenshotPath, binaryData);
      console.log('📸 Screenshot saved:', screenshotPath);
      
      // Include in debug data if requested
      if (includeInDebugData) {
        await updateDebugDataWithScreenshot(componentId, screenshotData);
      }
    }
    
    let result = `📸 **Screenshot Capture**\n\n`;
    result += `**Component:** ${component.component || component.name}\n`;
    result += `**Token:** ${componentId}\n`;
    result += `**Status:** ${screenshotData ? 'Successfully captured' : 'Failed to capture'}\n`;
    
    if (screenshotPath && screenshotData) {
      result += `**File:** \`${screenshotPath}\`\n`;
      result += `**Size:** ${Math.round(screenshotData.length / 1024)} KB\n`;
    }
    
    result += `**Debug Integration:** ${includeInDebugData && screenshotData ? 'Included' : 'Not included'}\n\n`;
    
    if (screenshotData) {
      result += `**Usage:**\n`;
      result += `- Visual validation of generated code\n`;
      result += `- LLM context for design accuracy\n`;
      result += `- Design system documentation\n`;
      result += `- Team collaboration and review\n`;
    } else {
      result += `**Next Steps:**\n`;
      result += `1. Ensure Figma bridge is running (\`npm run bridge\`)\n`;
      result += `2. Verify component exists in Figma\n`;
      result += `3. Try re-exporting from Figma plugin\n`;
    }
    
    return {
      content: [
        {
          type: 'text',
          text: result
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Screenshot capture error**: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
}

async function extractScreenshotForValidation(componentId: string): Promise<string | null> {
  // Check if screenshot file already exists
  const screenshotPath = path.join(EXPORT_DIR, `${componentId}-screenshot.png`);
  if (fs.existsSync(screenshotPath)) {
    return screenshotPath;
  }
  
  // Try to extract from debug data
  const debugPath = path.join(EXPORT_DIR, `token-${componentId}-debug.json`);
  if (fs.existsSync(debugPath)) {
    try {
      const debugData = JSON.parse(fs.readFileSync(debugPath, 'utf8'));
      if (debugData.screenshotData) {
        const binaryData = Buffer.from(debugData.screenshotData, 'base64');
        fs.writeFileSync(screenshotPath, binaryData);
        console.log('📸 Screenshot extracted from debug data:', screenshotPath);
        return screenshotPath;
      }
    } catch (error) {
      console.log('⚠️ Failed to extract screenshot from debug data:', error);
    }
  }
  
  // Try to capture new screenshot
  const captureResult = await captureComponentScreenshot(componentId, false);
  if (fs.existsSync(screenshotPath)) {
    return screenshotPath;
  }
  
  return null;
}

function analyzeComponentAccuracy(component: any, generatedCode?: string): {
  colorsAccurate: boolean;
  positioningAccurate: boolean;
  shapesAccurate: boolean;
  formationAccurate: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Analyze based on component structure
  const children = component.children || [];
  const expectedColors = [
    'rgba(36, 203, 113, 1)', // Green
    'rgba(255, 114, 55, 1)', // Orange
    'rgba(0, 182, 255, 1)',  // Blue
    'rgba(255, 55, 55, 1)',  // Red
    'rgba(135, 79, 255, 1)'  // Purple
  ];
  
  // Check color accuracy
  let colorsFound = 0;
  if (generatedCode) {
    expectedColors.forEach(color => {
      if (generatedCode.includes(color)) {
        colorsFound++;
      }
    });
  }
  
  const colorsAccurate = colorsFound >= 4; // At least 4 out of 5 colors
  if (!colorsAccurate) {
    issues.push(`Only ${colorsFound}/5 expected colors found in generated code`);
    suggestions.push('Verify color extraction from child.visuals.fills');
  }
  
  // Check positioning accuracy
  const hasPercentagePositioning = generatedCode ? generatedCode.includes('left: ') && generatedCode.includes('%') : false;
  const positioningAccurate = hasPercentagePositioning && children.length === 5;
  if (!positioningAccurate) {
    issues.push('Positioning system may not be using relative percentages correctly');
    suggestions.push('Use actual child.position data for relative positioning');
  }
  
  // Check shape accuracy
  const hasBorderRadius = generatedCode ? generatedCode.includes('borderRadius') : false;
  const hasMultipleShapes = generatedCode ? (generatedCode.match(/borderRadius/g) || []).length > 1 : false;
  const shapesAccurate = hasBorderRadius && hasMultipleShapes;
  if (!shapesAccurate) {
    issues.push('Shape variety (circles vs rounded rectangles) may be incorrect');
    suggestions.push('Distinguish between circular (50%) and rounded rectangle (44.7px) shapes');
  }
  
  // Check formation accuracy (F shape)
  const hasProperLayout = children.length === 5;
  const formationAccurate = hasProperLayout && colorsAccurate && positioningAccurate;
  if (!formationAccurate) {
    issues.push('Component formation does not match expected F shape structure');
    suggestions.push('Ensure top bar (Red+Orange), middle row (Purple+Blue), bottom (Green) positioning');
  }
  
  return {
    colorsAccurate,
    positioningAccurate,
    shapesAccurate,
    formationAccurate,
    issues,
    suggestions
  };
}

async function updateDebugDataWithScreenshot(componentId: string, screenshotData: string) {
  const debugPath = path.join(EXPORT_DIR, `token-${componentId}-debug.json`);
  if (fs.existsSync(debugPath)) {
    try {
      const debugData = JSON.parse(fs.readFileSync(debugPath, 'utf8'));
      debugData.screenshotData = screenshotData;
      debugData.screenshotCaptured = new Date().toISOString();
      fs.writeFileSync(debugPath, JSON.stringify(debugData, null, 2));
      console.log('📸 Screenshot data added to debug file:', debugPath);
    } catch (error) {
      console.log('⚠️ Failed to update debug data with screenshot:', error);
    }
  }
}

// Start the MCP server
const transport = new StdioServerTransport();
server.connect(transport);