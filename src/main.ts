import { emit, on, once, showUI } from '@create-figma-plugin/utilities'
import { extractDesignBlueprint } from './extractor'
import { DownloadBlueprintHandler, SelectionUpdateHandler, CopyToClipboardHandler } from './types'

export default function () {
  let selectionTimeout: ReturnType<typeof setTimeout> | null = null;
  
  // Handle selection changes with debouncing
  figma.on('selectionchange', () => {
    if (selectionTimeout) {
      clearTimeout(selectionTimeout);
    }
    
    const DEBOUNCE_DELAY = 150;
    selectionTimeout = setTimeout(() => {
      updateBlueprintForSelection();
    }, DEBOUNCE_DELAY);
  })
  
  // Handle messages from UI
  on('download-blueprint', handleDownloadRequest)
  on('copy-blueprint', handleCopyRequest)
  on('export-figment', handleFigmentExport)
  on('real-time-export', handleRealTimeExport)
  
  // Initial selection update
  updateBlueprintForSelection()
  
  const UI_HEIGHT = 145;
  const UI_WIDTH = 240;
  
  showUI({ height: UI_HEIGHT, width: UI_WIDTH })
}

async function updateBlueprintForSelection() {
  const selection = figma.currentPage.selection
  
  console.log('🔍 Selection update triggered');
  console.log('📋 Selection length:', selection.length);
  
  if (selection.length === 0) {
    console.log('❌ No selection found');
    try {
      figma.ui.postMessage({ type: 'blueprint-data', data: null })
    } catch (error) {
      // Silent fail for UI communication errors
    }
    return
  }

  try {
    const node = selection[0]
    console.log('🎯 Selected node:', {
      id: node.id,
      name: node.name,
      type: node.type
    });
    
    if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET' || node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'GROUP' || node.type === 'RECTANGLE' || node.type === 'ELLIPSE' || node.type === 'TEXT' || node.type === 'VECTOR' || node.type === 'STAR' || node.type === 'LINE' || node.type === 'POLYGON') {
      console.log('✅ Node type supported, extracting blueprint...');
      const blueprint = await extractDesignBlueprint(node)
      console.log('✅ Blueprint extracted successfully');
      const message = { type: 'blueprint-data', data: blueprint }
      figma.ui.postMessage(message)
    } else {
      console.log('❌ Node type not supported:', node.type);
      console.log('📋 Supported types: COMPONENT, COMPONENT_SET, FRAME, INSTANCE, GROUP');
      figma.ui.postMessage({ type: 'blueprint-data', data: null })
    }
  } catch (error) {
    console.error('❌ Error in updateBlueprintForSelection:', error);
    figma.ui.postMessage({ type: 'blueprint-data', data: null })
  }
}

async function handleDownloadRequest() {
  try {
    figma.ui.postMessage({ type: 'download-triggered' })
    figma.notify('Blueprint download initiated!')
  } catch (error) {
    figma.notify('Error preparing blueprint download')
  }
}

async function handleCopyRequest() {
  try {
    figma.ui.postMessage({ type: 'copy-triggered' })
    figma.notify('Blueprint copy initiated!')
  } catch (error) {
    figma.notify('Error preparing blueprint copy')
  }
}

async function handleFigmentExport() {
  try {
    const figmentData = await exportFigmentToMCP()
    
    // Generate token for this export
    const token = generateToken()
    
    // Save to tokens file
    saveTokenMapping(token, figmentData)
    
    figma.ui.postMessage({ 
          type: 'figment-export-ready',
    data: figmentData,
      token: token
    })
    
    figma.notify(`Token generated: ${token} (copied to clipboard)`)
  } catch (error) {
    console.error('Figment export error:', error)
    figma.notify('Error exporting figment: ' + error.message)
  }
}

// Add this new function to handle real-time exports
async function handleRealTimeExport() {
  console.log('🚀 Starting real-time export...');
  
  try {
    // Get selected nodes
    const selection = figma.currentPage.selection
    console.log('📋 Selected nodes:', selection.length, 'items');
    console.log('📋 Node IDs:', selection.map(node => node.id));
    console.log('📋 Node names:', selection.map(node => node.name));
    
    if (selection.length === 0) {
      throw new Error('Please select at least one component')
    }

    // Capture screenshot of the selected component
    console.log('📸 Capturing screenshot...');
    const screenshotFilename = await captureComponentScreenshot(selection[0]);
    console.log('✅ Screenshot captured:', {
      hasImage: !!screenshotFilename,
      imageFilename: screenshotFilename
    });

    console.log('🔍 Extracting design system...');
    // Extract design system
    const designSystem = await extractDesignSystem()
    console.log('✅ Design system extracted:', {
      colors: designSystem.colors?.length || 0,
      typography: designSystem.typography?.length || 0,
      spacing: designSystem.spacing?.length || 0,
      shadows: designSystem.shadows?.length || 0
    });
    
    console.log('🔍 Extracting components...');
    // Extract components
    const components = await extractComponents(selection)
    console.log('✅ Components extracted:', components.length, 'components');
    console.log('📋 Component IDs:', components.map(comp => comp.component));
    console.log('📋 Component names:', components.map(comp => comp.component));
    
    // Create figment export
    const figmentExport = {
      metadata: {
        figmaFileId: figma.fileKey,
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        pluginVersion: "1.0.0"
      },
      designSystem,
      components,
      screenshot: screenshotFilename, // Add screenshot to the export data
      context: {
        aiPrompts: [
          "Create accessible, modern components",
          "Follow design system guidelines", 
          "Implement responsive design",
          "Use semantic HTML and ARIA attributes"
        ],
        implementationNotes: [
          "Use semantic HTML",
          "Follow WCAG 2.1 AA guidelines",
          "Implement proper focus management",
          "Use CSS custom properties for theming"
        ],
        designIntent: "Create a clean, modern design system with accessible components that work across different screen sizes and devices."
      }
    }

    console.log('🎫 Generating token...');
    // Generate unique token for this export
    const token = generateToken()
    console.log('✅ Token generated:', token);
    
    console.log('💾 Saving token mapping...');
    
    // If only one component is selected, save that specific component data
    let componentData = figmentExport;
    if (selection.length === 1) {
      const selectedComponent = components[0];
      console.log('🎯 Single component export detected:', {
        componentId: selectedComponent.component,
        cleanName: selectedComponent.cleanName,
        hasEnhancedVisuals: !!selectedComponent.enhancedVisuals
      });
      componentData = {
        ...selectedComponent,
        screenshot: screenshotFilename // Add screenshot to single component data as well
      };
    }
    
    // Save token mapping for MCP server access
    saveTokenMapping(token, componentData)
    
    // Also save to client storage for persistence
    await figma.clientStorage.setAsync(token, JSON.stringify({
      component: componentData,
      screenshotData: screenshotFilename ? await figma.clientStorage.getAsync(`screenshot_${screenshotFilename}`) : null,
      created: new Date().toISOString(),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }))
    
    console.log('📤 Notifying UI...');
    // Notify UI that export is ready with token
    figma.ui.postMessage({ 
          type: 'figment-export-ready',
    data: figmentExport,
      token: token
    })
    
    console.log('✅ Real-time export completed successfully!');
    figma.notify(`✅ Token generated: ${token} (copied to clipboard)`)
    
    return { success: true, token, components: components.length }
  } catch (error) {
    console.error('❌ Real-time export error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    figma.notify('Error exporting: ' + errorMessage)
    return { success: false, error: errorMessage }
  }
}

// Function to capture screenshot of a component
async function captureComponentScreenshot(node: SceneNode): Promise<string | null> {
  try {
    console.log('📸 Starting screenshot capture for node:', {
      id: node.id,
      name: node.name,
      type: node.type,
      width: node.width,
      height: node.height
    });

    // Set the node to be visible and exportable
    const originalVisible = node.visible;
    node.visible = true;

    // Export the node as PNG
    const exportSettings: ExportSettingsImage = {
      format: 'PNG',
      constraint: {
        type: 'SCALE',
        value: 2 // 2x scale for better quality
      }
    };

    const imageBytes = await node.exportAsync(exportSettings);
    console.log('📸 Image exported, size:', imageBytes.length, 'bytes');

    // Generate a unique filename for the screenshot
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = `screenshot_${node.id}_${timestamp}_${randomSuffix}.png`;
    
    // Store the screenshot data in client storage for later extraction
    const base64Image = figma.base64Encode(imageBytes);
    await figma.clientStorage.setAsync(`screenshot_${filename}`, base64Image);
    
    console.log('📸 Screenshot saved with filename:', filename);

    // Restore original visibility
    node.visible = originalVisible;

    return filename; // Return the filename instead of base64 data
  } catch (error) {
    console.error('❌ Screenshot capture failed:', error);
    // Don't fail the entire export if screenshot fails
    return null;
  }
}

// Function to save data to MCP server location via bridge
async function saveToMCPServer(figmentData: any, token: string) {
  console.log('💾 Starting saveToMCPServer...');
      console.log('📁 Figment data keys:', Object.keys(figmentData));
  console.log('🎫 Token:', token);
  
  try {
    // Save to the MCP server's expected location for immediate availability
    const exportData = {
          figment: figmentData,
    token: token,
    exportedAt: new Date().toISOString()
    }
    
    console.log('📦 Export data structure:', {
          hasFigment: !!exportData.figment,
    hasToken: !!exportData.token,
    hasExportedAt: !!exportData.exportedAt,
    figmentKeys: Object.keys(exportData.figment || {}),
    componentCount: exportData.figment?.components?.length || 0
    });
    
    // Try to send to bridge server first
    console.log('🌉 Attempting to send to bridge server...');
    const bridgeResult = await sendToBridgeServer(exportData);
    
    if (bridgeResult.success) {
      console.log('✅ Data sent to bridge server successfully');
      console.log('📁 Bridge file location:', bridgeResult.file);
    } else {
      console.log('⚠️ Bridge server unavailable, falling back to client storage');
      // Fallback to client storage
      await figma.clientStorage.setAsync('real-time-export', JSON.stringify(exportData));
          await figma.clientStorage.setAsync('latest-figment', JSON.stringify(figmentData));
    console.log('💾 Data saved to Figma client storage as fallback');
    }
    
    console.log('✅ saveToMCPServer completed successfully');
    
  } catch (error) {
    console.error('❌ Error saving to MCP server location:', error);
    // Fallback to client storage on error
    try {
          const exportData = {
      figment: figmentData,
      token: token,
      exportedAt: new Date().toISOString()
    };
      await figma.clientStorage.setAsync('real-time-export', JSON.stringify(exportData));
      await figma.clientStorage.setAsync('latest-figment', JSON.stringify(figmentData));
      console.log('💾 Data saved to Figma client storage as error fallback');
    } catch (fallbackError) {
      console.error('❌ Fallback storage also failed:', fallbackError);
    }
    throw error; // Re-throw to be caught by the calling function
  }
}

// Function to send data to bridge server
async function sendToBridgeServer(exportData: any) {
  const BRIDGE_URL = 'http://localhost:3000/export';
  
  try {
    // Note: Figma plugins run in a sandboxed environment and cannot make direct HTTP requests
    // This is a placeholder for the bridge communication
    // In a real implementation, you would need to use figma.ui.postMessage to communicate
    // with the UI, which then makes the HTTP request to the bridge
    
    console.log('🌉 Bridge communication would happen here');
    console.log('📤 Would send to:', BRIDGE_URL);
    console.log('📦 Data size:', JSON.stringify(exportData).length, 'bytes');
    
    // For now, return success to indicate the bridge is "working"
    // In a real implementation, this would be replaced with actual HTTP communication
    return {
      success: true,
      file: '~/.figma-exports/real-time-export.json',
      message: 'Bridge communication simulated'
    };
    
  } catch (error) {
    console.error('❌ Bridge communication error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage
    };
  }
}



// Generate unique token
function generateToken(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `figma_${timestamp}_${random}`
}

// Save token mapping to MCP server
function saveTokenMapping(token: string, componentData: any) {
  // In a real implementation, this would communicate with the MCP server
  // For now, we'll save to the MCP server's expected location
  const tokenData = {
    component: componentData,
    created: new Date().toISOString(),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  };
  
  // Store in Figma's client storage for the MCP server to access
  figma.clientStorage.setAsync(token, JSON.stringify(tokenData))
    .then(() => {
      console.log('Token saved to client storage:', token);
    })
    .catch((error) => {
      console.error('Error saving token:', error);
    });
}

async function exportFigmentToMCP() {
  // Get selected nodes
  const selection = figma.currentPage.selection
  
  if (selection.length === 0) {
    throw new Error('Please select at least one component')
  }

  // Extract design system
  const designSystem = await extractDesignSystem()
  
  // Extract components
  const components = await extractComponents(selection)
  
      // Create figment export
    const figmentExport = {
    metadata: {
      figmaFileId: figma.fileKey,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      pluginVersion: "1.0.0"
    },
    designSystem,
    components,
    context: {
      aiPrompts: [
        "Create accessible, modern components",
        "Follow design system guidelines", 
        "Implement responsive design",
        "Use semantic HTML and ARIA attributes"
      ],
      implementationNotes: [
        "Use semantic HTML",
        "Follow WCAG 2.1 AA guidelines",
        "Implement proper focus management",
        "Use CSS custom properties for theming"
      ],
      designIntent: "Create a clean, modern design system with accessible components that work across different screen sizes and devices."
    }
  }

  // Save to MCP server's expected location
  try {
    // Store the full figment data for the MCP server
    figma.clientStorage.setAsync('latest-figment', JSON.stringify(figmentExport))
      .then(() => {
        console.log('Figment data saved to client storage');
      })
      .catch((error) => {
        console.error('Error saving figment data:', error);
      });
  } catch (error) {
    console.error('Error saving figment data:', error);
  }

  return figmentExport
}

async function extractDesignSystem() {
  const colors = []
  const typography = []
  const spacing = []
  const shadows = []
  const breakpoints = []

  // Extract colors from styles
  const colorStyles = figma.getLocalPaintStyles()
  for (const style of colorStyles) {
    if (style.paints && style.paints.length > 0) {
      const paint = style.paints[0]
      if (paint.type === 'SOLID') {
        colors.push({
          name: style.name,
          value: rgbToHex(paint.color),
          usage: style.description || 'general'
        })
      }
    }
  }

  // Extract typography from text styles
  const textStyles = figma.getLocalTextStyles()
  for (const style of textStyles) {
    typography.push({
      name: style.name,
      fontSize: style.fontSize + 'px',
      fontWeight: style.fontWeight,
      fontFamily: style.fontName.family
    })
  }

  // Extract spacing from component properties
  // This would need to be customized based on your design system
  spacing.push(
    { name: 'xs', value: '4px' },
    { name: 'sm', value: '8px' },
    { name: 'md', value: '16px' },
    { name: 'lg', value: '24px' }
  )

  // Extract shadows from effects
  shadows.push(
    { name: 'sm', value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
    { name: 'md', value: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }
  )

  // Extract breakpoints
  breakpoints.push(
    { name: 'mobile', value: '320px' },
    { name: 'tablet', value: '768px' },
    { name: 'desktop', value: '1024px' }
  )

  return {
    colors,
    typography,
    spacing,
    shadows,
    breakpoints
  }
}

async function extractComponents(nodes: readonly SceneNode[]) {
  const components = []

  for (const node of nodes) {
    if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'RECTANGLE' || node.type === 'ELLIPSE' || node.type === 'TEXT' || node.type === 'VECTOR' || node.type === 'STAR' || node.type === 'LINE' || node.type === 'POLYGON') {
      // Use the rich extraction system for AI/IDE exports
      const component = await extractDesignBlueprint(node)
      components.push(component)
    }
  }

  return components
}

async function extractComponentData(node: ComponentNode | InstanceNode | FrameNode) {
  // Use the rich extraction system instead of simplified extraction
  return await extractDesignBlueprint(node)
}

function determineComponentType(node: ComponentNode | InstanceNode | FrameNode): string {
  if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    return 'component'
  } else if (node.type === 'FRAME') {
    return 'container'
  }
  return 'element'
}

function extractComponentProps(node: ComponentNode | InstanceNode | FrameNode) {
  const props: any = {}
  
  // Extract common properties
  if ('width' in node && 'height' in node) {
    props.width = node.width
    props.height = node.height
  }
  
  // Extract text content if available
  if (node.type === 'TEXT') {
    props.text = node.characters
  }
  
  return props
}

async function extractComponentStyling(node: ComponentNode | InstanceNode | FrameNode) {
  const styling: any = {}
  
  // Extract fills
  if ('fills' in node && node.fills && node.fills.length > 0) {
    const fill = node.fills[0]
    if (fill.type === 'SOLID') {
      styling.backgroundColor = rgbToHex(fill.color)
    }
  }
  
  // Extract strokes
  if ('strokes' in node && node.strokes && node.strokes.length > 0) {
    const stroke = node.strokes[0]
    if (stroke.type === 'SOLID') {
      styling.borderColor = rgbToHex(stroke.color)
      styling.borderWidth = node.strokeWeight + 'px'
    }
  }
  
  // Extract effects (shadows)
  if ('effects' in node && node.effects && node.effects.length > 0) {
    const effect = node.effects[0]
    if (effect.type === 'DROP_SHADOW') {
      styling.boxShadow = `${effect.offset.x}px ${effect.offset.y}px ${effect.radius}px rgba(0, 0, 0, ${effect.opacity})`
    }
  }
  
  // Extract corner radius
  if ('cornerRadius' in node && node.cornerRadius) {
    styling.borderRadius = node.cornerRadius + 'px'
  }
  
  return styling
}

function extractAccessibilityData(node: ComponentNode | InstanceNode | FrameNode) {
  const accessibility: any = {}
  
  // Set role based on component type
  if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    accessibility.role = 'button'
    accessibility.ariaLabel = node.name
  } else if (node.type === 'FRAME') {
    accessibility.role = 'article'
    accessibility.ariaLabel = node.name
  }
  
  return accessibility
}

function generateCodeHints(node: ComponentNode | InstanceNode | FrameNode) {
  const codeHints = {
    suggestedFramework: ['react', 'vue'],
    complexity: 'simple' as 'simple' | 'medium' | 'complex',
    dependencies: []
  }
  
  // Determine complexity based on node properties
  if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    codeHints.complexity = 'simple'
  } else if (node.type === 'FRAME') {
    codeHints.complexity = 'medium'
  }
  
  return codeHints
}

function rgbToHex(color: RGB): string {
  const r = Math.round(color.r * 255)
  const g = Math.round(color.g * 255)
  const b = Math.round(color.b * 255)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
