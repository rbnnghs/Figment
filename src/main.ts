import { emit, on, once, showUI } from '@create-figma-plugin/utilities'
import { extractDesignBlueprint } from './extractor'
import { DownloadBlueprintHandler, SelectionUpdateHandler, CopyToClipboardHandler } from './types'

export default function () {
  let selectionTimeout: ReturnType<typeof setTimeout> | null = null;
  
  // Initialize plugin and cleanup old storage data
  initializePlugin();
  
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
  on('force-selection-refresh', handleForceSelectionRefresh)
  on('select-parent-component', handleSelectParentComponent)
  on('debug-selection', handleDebugSelection)
  
  // Initial selection update
  updateBlueprintForSelection()
  
  const UI_HEIGHT = 145;
  const UI_WIDTH = 240;
  
  showUI({ height: UI_HEIGHT, width: UI_WIDTH })
}

// Enhanced selection handling for complex components
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

  // Notify UI that processing has started
  try {
    figma.ui.postMessage({ 
      type: 'processing-started', 
      status: 'Analyzing selection...' 
    });
  } catch (error) {
    // Silent fail for UI communication errors
  }

  // DEBUG: Log all selected items for variant debugging
  if (selection.length > 1) {
    console.log('🔍 Multiple items selected:');
    selection.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.name} (${item.type}) - Children: ${'children' in item ? item.children?.length || 0 : 0}`);
    });
  }

  try {
    let node = selection[0]
    console.log('🎯 Selected node:', {
      id: node.id,
      name: node.name,
      type: node.type,
      width: 'width' in node ? node.width : 'N/A',
      height: 'height' in node ? node.height : 'N/A',
      hasChildren: 'children' in node ? node.children?.length || 0 : 'N/A',
      parentType: node.parent ? node.parent.type : 'N/A',
      parentName: node.parent ? node.parent.name : 'N/A'
    });
    
    // VARIANT SELECTION FIX: Check if we have a child element selected (common issue with complex components)
    const isChildElement = isLikelyChildElement(node);
    console.log('🔍 Child element check result:', isChildElement);
    
    if (isChildElement) {
      console.log('⚠️ Child element detected, searching for proper parent component...');
      figma.notify('Child element selected, finding parent component...', { timeout: 2000 });
      
      // Try to find a proper parent component
      const properComponent = findProperParentComponent(node);
      if (properComponent) {
        node = properComponent;
        console.log('✅ Found proper parent component:', {
          id: node.id,
          name: node.name,
          type: node.type,
          width: 'width' in node ? node.width : 'N/A',
          height: 'height' in node ? node.height : 'N/A'
        });
      }
    }
    
    // Enhanced node type checking with fallback selection
    if (isSupportedNodeType(node)) {
      console.log('✅ Node type supported, extracting blueprint...');
      console.log('🎯 Processing node:', node.name, 'Type:', node.type);
      
      // Update processing status
      try {
        figma.ui.postMessage({ 
          type: 'processing-update', 
          status: `Extracting ${node.name}...` 
        });
      } catch (error) {
        // Silent fail for UI communication errors
      }
      
      // Add minimum delay to ensure loading indicator is visible
      const startTime = Date.now();
      
      try {
        const blueprint = await extractDesignBlueprint(node)
        
        // Ensure minimum 500ms processing time for UI feedback
        const processingTime = Date.now() - startTime;
        const minDelay = Math.max(0, 500 - processingTime);
        
        if (minDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, minDelay));
        }
        
        console.log('✅ Blueprint extracted successfully');
        const message = { type: 'blueprint-data', data: blueprint }
        figma.ui.postMessage(message)
      } catch (error) {
        console.error('❌ Error extracting blueprint:', error);
        figma.notify('Error extracting component data', { error: true });
        figma.ui.postMessage({ type: 'blueprint-data', data: null })
      }
    } else {
      // Try to find a supported parent or child component
      console.log('⚠️ Node type not directly supported:', node.type, 'for node:', node.name);
      console.log('🔍 Searching for compatible component...');
      
      // Update processing status
      try {
        figma.ui.postMessage({ 
          type: 'processing-update', 
          status: 'Finding compatible component...' 
        });
      } catch (error) {
        // Silent fail for UI communication errors
      }
      
      const compatibleNode = findCompatibleComponent(node);
      
      if (compatibleNode) {
        console.log('✅ Found compatible component:', {
          id: compatibleNode.id,
          name: compatibleNode.name,
          type: compatibleNode.type
        });
        
        // Update processing status
        try {
          figma.ui.postMessage({ 
            type: 'processing-update', 
            status: `Extracting ${compatibleNode.name}...` 
          });
        } catch (error) {
          // Silent fail for UI communication errors
        }
        
        // Add minimum delay to ensure loading indicator is visible
        const startTime = Date.now();
        
        const blueprint = await extractDesignBlueprint(compatibleNode)
        
        // Ensure minimum 500ms processing time for UI feedback
        const processingTime = Date.now() - startTime;
        const minDelay = Math.max(0, 500 - processingTime);
        
        if (minDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, minDelay));
        }
        
        const message = { type: 'blueprint-data', data: blueprint }
        figma.ui.postMessage(message)
      } else {
        console.log('❌ No compatible component found');
        console.log('📋 Supported types: COMPONENT, COMPONENT_SET, FRAME, INSTANCE, GROUP, RECTANGLE, ELLIPSE, TEXT, VECTOR, STAR, LINE, POLYGON, BOOLEAN_OPERATION, SLICE');
        figma.ui.postMessage({ type: 'blueprint-data', data: null })
        figma.ui.postMessage({ type: 'selection-issue' })
      }
    }
  } catch (error) {
    console.error('❌ Error in updateBlueprintForSelection:', error);
    figma.ui.postMessage({ type: 'blueprint-data', data: null })
  }
}

// Enhanced node type checking
function isSupportedNodeType(node: SceneNode): boolean {
  const supportedTypes = [
    'COMPONENT', 
    'COMPONENT_SET', 
    'FRAME', 
    'INSTANCE', 
    'GROUP', 
    'RECTANGLE', 
    'ELLIPSE', 
    'TEXT', 
    'VECTOR', 
    'STAR', 
    'LINE', 
    'POLYGON',
    'BOOLEAN_OPERATION',
    'SLICE'
  ];
  
  return supportedTypes.includes(node.type);
}

// Enhanced child element detection - fixed for variants and complex components
function isLikelyChildElement(node: SceneNode): boolean {
  if (!node.parent || !('type' in node.parent)) return false;
  
  // Check if node has dimensions
  if (!('width' in node && 'height' in node)) return false;
  
  // CRITICAL FIX: Never treat these as child elements - they ARE the components we want
  if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET' || node.type === 'INSTANCE') {
    console.log('🎯 Component/Instance/ComponentSet detected - NOT a child element');
    return false;
  }
  
  // Don't treat frames with children as child elements - they might be variants
  if (node.type === 'FRAME' && 'children' in node && node.children && node.children.length > 0) {
    console.log('🎯 Frame with children detected - NOT a child element');
    return false;
  }
  
  // Don't treat groups with multiple children as child elements - they might be component variants
  if (node.type === 'GROUP' && 'children' in node && node.children && node.children.length > 1) {
    console.log('🎯 Group with multiple children detected - NOT a child element');
    return false;
  }
  
  const width = node.width;
  const height = node.height;
  const parent = node.parent;
  
  // Only treat very small elements as potential child elements
  const isVerySmallElement = width < 50 && height < 50;
  const isSmallElement = width < 100 && height < 100;
  
  // Check parent characteristics
  const parentName = parent.name.toLowerCase();
  const hasComponentParent = parentName.includes('component') || 
                           parentName.includes('dialog') || 
                           parentName.includes('modal') ||
                           parentName.includes('card') ||
                           parentName.includes('button') ||
                           parentName.includes('form') ||
                           parentName.includes('panel') ||
                           parentName.includes('container');
  
  // Check if parent is a component-like structure
  const parentIsComponentLike = parent.type === 'COMPONENT' || 
                               parent.type === 'COMPONENT_SET' ||
                               parent.type === 'INSTANCE' ||
                               (parent.type === 'FRAME' && 'width' in parent && parent.width > width * 3);
  
  // Only very small elements should be considered child elements
  if (isVerySmallElement && hasComponentParent && parentIsComponentLike) {
    console.log('🔍 Very small element detected as potential child');
    return true;
  }
  
  // Text, icons, and simple shapes that are clearly decorative elements
  if ((node.type === 'TEXT' || node.type === 'VECTOR' || node.type === 'ELLIPSE' || node.type === 'RECTANGLE') && 
      isSmallElement && parentIsComponentLike && 'width' in parent && parent.width > width * 3) {
    console.log('🔍 Small decorative element detected as potential child');
    return true;
  }
  
  console.log('✅ Not a child element - treating as main component');
  return false;
}

// Find proper parent component when tiny elements are selected
function findProperParentComponent(node: SceneNode): SceneNode | null {
  console.log('🔍 Searching for proper parent component...');
  
  let current = node.parent;
  let levelsUp = 0;
  const maxLevels = 10; // Prevent infinite loops
  
  while (current && levelsUp < maxLevels) {
    levelsUp++;
    
    // Check if this parent is a substantial component
    if ('width' in current && 'height' in current) {
      const width = current.width;
      const height = current.height;
      
      console.log(`🔍 Level ${levelsUp}: ${current.name} (${width}x${height})`);
      
      // Look for substantial components (reasonable size)
      if (width > 200 && height > 200) {
        // Check if it's a supported type
        if ('type' in current && isSupportedNodeType(current as SceneNode)) {
          console.log(`✅ Found substantial parent: ${current.name} (${width}x${height})`);
          figma.notify(`Found proper component: ${current.name}`, { timeout: 2000 });
          return current as SceneNode;
        }
      }
      
      // Special case: if we find a component with "Dialog" in the name, prioritize it
      if (current.name.toLowerCase().includes('dialog') && 
          'type' in current && isSupportedNodeType(current as SceneNode)) {
        console.log(`✅ Found dialog component: ${current.name} (${width}x${height})`);
        figma.notify(`Found dialog component: ${current.name}`, { timeout: 2000 });
        return current as SceneNode;
      }
      
      // Special case: if we find "System_Save Dialog" specifically, prioritize it
      if (current.name === 'System_Save Dialog' && 
          'type' in current && isSupportedNodeType(current as SceneNode)) {
        console.log(`✅ Found System_Save Dialog: ${current.name} (${width}x${height})`);
        figma.notify(`Found System_Save Dialog component`, { timeout: 2000 });
        return current as SceneNode;
      }
    }
    
    current = current.parent;
  }
  
  console.log('❌ No substantial parent component found');
  return null;
}

// Find compatible component in complex structures
function findCompatibleComponent(node: SceneNode): SceneNode | null {
  console.log('🔍 Searching for compatible component for:', node.name, node.type);
  
  // Check if the node itself is supported
  if (isSupportedNodeType(node)) {
    console.log('✅ Node itself is supported:', node.name);
    return node;
  }
  
  // Special handling for component sets - prefer the component set itself over individual variants
  if (node.type === 'COMPONENT_SET') {
    console.log('✅ Component set detected:', node.name);
    figma.notify(`Using component set: ${node.name}`, { timeout: 2000 });
    return node;
  }
  
  // CRITICAL FIX: For variants and complex components, don't search too aggressively
  // If it's a frame or group with multiple children, it's likely a variant component itself
  if ((node.type === 'FRAME' || node.type === 'GROUP') && 'children' in node && node.children && node.children.length > 0) {
    console.log('🎯 Frame/Group with children - likely a variant component');
    figma.notify(`Using variant component: ${node.name}`, { timeout: 2000 });
    return node;
  }
  
  // Check parent components with more comprehensive traversal
  let current = node.parent;
  let level = 0;
  const maxLevels = 15; // Increased from implicit 10
  
  while (current && level < maxLevels) {
    level++;
    console.log(`🔍 Level ${level}: Checking parent ${current.name} (${current.type})`);
    
    if ('type' in current && isSupportedNodeType(current as SceneNode)) {
      // Prefer component sets and components over frames
      if (current.type === 'COMPONENT_SET' || current.type === 'COMPONENT' || current.type === 'INSTANCE') {
        console.log('✅ Found high-priority parent component:', current.name, current.type);
        figma.notify(`Found component: ${current.name}`, { timeout: 2000 });
        return current as SceneNode;
      }
      
      // Store frame as fallback but continue looking for better options
      if (current.type === 'FRAME' && level <= 3) {
        console.log('📝 Frame found as fallback option:', current.name);
        // Continue searching for better options, but remember this frame
      }
      
      // For other supported types, return immediately
      console.log('✅ Found supported parent component:', current.name, current.type);
      figma.notify(`Found compatible component: ${current.name}`, { timeout: 2000 });
      return current as SceneNode;
    }
    
    current = current.parent;
  }
  
  // Check children more thoroughly (useful for containers with unsupported types)
  if ('children' in node && node.children && node.children.length > 0) {
    console.log('🔍 Checking children for compatible components...');
    
    // First pass: Look for components and component sets
    for (const child of node.children) {
      if (child.type === 'COMPONENT' || child.type === 'COMPONENT_SET' || child.type === 'INSTANCE') {
        console.log('✅ Found high-priority child component:', child.name, child.type);
        figma.notify(`Found component: ${child.name}`, { timeout: 2000 });
        return child;
      }
    }
    
    // Second pass: Look for any supported type
    for (const child of node.children) {
      if (isSupportedNodeType(child)) {
        console.log('✅ Found supported child component:', child.name, child.type);
        figma.notify(`Found compatible component: ${child.name}`, { timeout: 2000 });
        return child;
      }
    }
    
    // Third pass: Recursively check grandchildren (one level deep)
    for (const child of node.children) {
      if ('children' in child && child.children) {
        for (const grandchild of child.children) {
          if (grandchild.type === 'COMPONENT' || grandchild.type === 'COMPONENT_SET' || grandchild.type === 'INSTANCE') {
            console.log('✅ Found grandchild component:', grandchild.name, grandchild.type);
            figma.notify(`Found nested component: ${grandchild.name}`, { timeout: 2000 });
            return grandchild;
          }
        }
      }
    }
  }
  
  console.log('❌ No compatible component found after exhaustive search');
  return null;
}

// Force refresh selection (useful for debugging)
async function handleForceSelectionRefresh() {
  console.log('🔄 Force refreshing selection...');
  updateBlueprintForSelection();
}

// Manually select parent component
async function handleSelectParentComponent() {
  console.log('🔍 Manually selecting parent component...');
  
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.notify('No selection found', { error: true });
    return;
  }
  
  const node = selection[0];
  const parentComponent = findProperParentComponent(node);
  
  if (parentComponent) {
    // Select the parent component in Figma
    figma.currentPage.selection = [parentComponent];
    figma.notify(`Selected parent component: ${parentComponent.name}`, { timeout: 2000 });
    
    // Update the blueprint
    setTimeout(() => {
      updateBlueprintForSelection();
    }, 100);
  } else {
    figma.notify('No suitable parent component found', { error: true });
  }
}

// Debug selection hierarchy
async function handleDebugSelection() {
  console.log('🔍 Debugging selection hierarchy...');
  
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.notify('No selection found', { error: true });
    return;
  }
  
  const node = selection[0];
  console.log('🎯 Current selection:', {
    id: node.id,
    name: node.name,
    type: node.type,
    width: 'width' in node ? node.width : 'N/A',
    height: 'height' in node ? node.height : 'N/A'
  });
  
  // Walk up the hierarchy
  let current = node.parent;
  let level = 1;
  while (current && level <= 10) {
    console.log(`📋 Level ${level} parent:`, {
      id: current.id,
      name: current.name,
      type: 'type' in current ? current.type : 'N/A',
      width: 'width' in current ? current.width : 'N/A',
      height: 'height' in current ? current.height : 'N/A'
    });
    
    if (current.name === 'System_Save Dialog') {
      figma.notify(`Found System_Save Dialog at level ${level}`, { timeout: 3000 });
    }
    
    current = current.parent;
    level++;
  }
  
  figma.notify('Check console for selection hierarchy', { timeout: 2000 });
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
    const errorMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Unknown error');
    figma.notify('Error exporting figment: ' + errorMessage)
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
        ...figmentExport,
        screenshot: screenshotFilename // Add screenshot to single component data as well
      };
    }
    
    // Save token mapping for MCP server access
    saveTokenMapping(token, componentData)
    
    // Store using figma.clientStorage API (adheres to 5MB limit, async operations)
    try {
      const storageData = {
        token,
        component: componentData,
        screenshotFilename,
        metadata: {
          created: new Date().toISOString(),
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          nodeId: selection[0].id,
          nodeName: selection[0].name,
          nodeType: selection[0].type
        }
      };

      // Store the main export data
      await figma.clientStorage.setAsync(`export_${token}`, storageData);
      
      // Update recent exports list
      const recentExports = await figma.clientStorage.getAsync('recent_exports') || [];
      const newExport = {
        token,
        name: selection[0].name,
        type: selection[0].type,
        timestamp: new Date().toISOString()
      };
      
      // Add to beginning and keep only last 10 exports
      const updatedExports = [newExport, ...recentExports.slice(0, 9)];
      await figma.clientStorage.setAsync('recent_exports', updatedExports);
      
      console.log('💾 Data stored successfully using figma.clientStorage');
    } catch (storageError) {
      console.error('❌ Storage failed:', storageError);
      if (storageError.message && storageError.message.includes('quota')) {
        figma.notify('⚠️ Storage quota exceeded. Please clear old exports.');
      }
      throw storageError;
    }
    
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
    const errorMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Unknown error');
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

    // Export the node as PNG with reduced quality to save storage
    const exportSettings: ExportSettingsImage = {
      format: 'PNG',
      constraint: {
        type: 'SCALE',
        value: 1 // Reduced from 2x to 1x to save storage
      }
    };

    let imageBytes = await node.exportAsync(exportSettings);
    console.log('📸 Image exported, size:', imageBytes.length, 'bytes');

    // Check if image is too large (> 2MB base64 = ~1.5MB raw for better quality)
    if (imageBytes.length > 1500000) {
      console.log('⚠️ Screenshot too large, trying with lower quality...');
      
             // Try with lower quality settings
       const lowerQualitySettings: ExportSettingsImage = {
         format: 'PNG',
         constraint: { type: 'SCALE', value: 2 }, // Scale down to 2x instead of 4x
         contentsOnly: true
       };
      
      try {
        const lowerQualityBytes = await node.exportAsync(lowerQualitySettings);
        console.log('📸 Lower quality image exported, size:', lowerQualityBytes.length, 'bytes');
        
        if (lowerQualityBytes.length > 1500000) {
          console.log('⚠️ Still too large, skipping screenshot');
          node.visible = originalVisible;
          return null;
        }
        
        // Use the lower quality image
        imageBytes = lowerQualityBytes;
      } catch (error) {
        console.log('⚠️ Lower quality export failed, skipping screenshot');
        node.visible = originalVisible;
        return null;
      }
    }

    // Generate a unique filename for the screenshot
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = `screenshot_${node.id}_${timestamp}_${randomSuffix}.png`;
    
    // Store the screenshot data in client storage for later extraction
    const base64Image = figma.base64Encode(imageBytes);
    
    // Clean up old screenshots before storing new one
    await cleanupOldScreenshots();
    
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

// Function to check storage usage and estimate available space
async function checkStorageUsage(): Promise<{ used: number; available: number; total: number }> {
  try {
    const keys = await figma.clientStorage.keysAsync();
    let totalUsed = 0;
    
    // Estimate storage usage by checking key sizes
    for (const key of keys) {
      const value = await figma.clientStorage.getAsync(key);
      if (value) {
        // Estimate size: key length + JSON stringified value length
        const estimatedSize = key.length + JSON.stringify(value).length;
        totalUsed += estimatedSize;
      }
    }
    
    const total = 5 * 1024 * 1024; // 5MB in bytes
    const available = total - totalUsed;
    
    console.log(`📊 Storage usage: ${(totalUsed / 1024 / 1024).toFixed(2)}MB used, ${(available / 1024 / 1024).toFixed(2)}MB available`);
    
    return {
      used: totalUsed,
      available,
      total
    };
  } catch (error) {
    console.error('❌ Error checking storage usage:', error);
    return { used: 0, available: 5 * 1024 * 1024, total: 5 * 1024 * 1024 };
  }
}

// Enhanced cleanup with storage usage awareness
async function cleanupOldScreenshots() {
  try {
    const storageInfo = await checkStorageUsage();
    const keys = await figma.clientStorage.keysAsync();
    const screenshotKeys = keys.filter(key => key.startsWith('screenshot_'));
    const tokenKeys = keys.filter(key => key.startsWith('figma_'));
    
    console.log(`🔍 Found ${screenshotKeys.length} screenshots and ${tokenKeys.length} tokens in storage`);
    
    // If storage is more than 80% full, be very aggressive
    if (storageInfo.used > storageInfo.total * 0.8) {
      console.log('🚨 Storage nearly full, performing emergency cleanup...');
      
      // Keep only the most recent screenshot and token
      if (screenshotKeys.length > 1) {
        const keysToDelete = screenshotKeys.slice(0, screenshotKeys.length - 1);
        for (const key of keysToDelete) {
          await figma.clientStorage.deleteAsync(key);
          console.log('🗑️ Emergency cleanup deleted screenshot:', key);
        }
      }
      
      if (tokenKeys.length > 1) {
        const keysToDelete = tokenKeys.slice(0, tokenKeys.length - 1);
        for (const key of keysToDelete) {
          await figma.clientStorage.deleteAsync(key);
          console.log('🗑️ Emergency cleanup deleted token:', key);
        }
      }
    }
    // If we have too many items, be more aggressive with cleanup
    else if (screenshotKeys.length > 3 || tokenKeys.length > 5) {
      console.log('🧹 Performing aggressive cleanup...');
      
      // Delete all but the 2 most recent screenshots
      if (screenshotKeys.length > 2) {
        const keysToDelete = screenshotKeys.slice(0, screenshotKeys.length - 2);
        for (const key of keysToDelete) {
          await figma.clientStorage.deleteAsync(key);
          console.log('🗑️ Cleaned up old screenshot:', key);
        }
      }
      
      // Delete all but the 3 most recent tokens
      if (tokenKeys.length > 3) {
        const keysToDelete = tokenKeys.slice(0, tokenKeys.length - 3);
        for (const key of keysToDelete) {
          await figma.clientStorage.deleteAsync(key);
          console.log('🗑️ Cleaned up old token:', key);
        }
      }
    } else {
      // Normal cleanup - keep only the 5 most recent screenshots and 10 most recent tokens
      if (screenshotKeys.length > 5) {
        const keysToDelete = screenshotKeys.slice(0, screenshotKeys.length - 5);
        for (const key of keysToDelete) {
          await figma.clientStorage.deleteAsync(key);
          console.log('🗑️ Cleaned up old screenshot:', key);
        }
      }
      
      if (tokenKeys.length > 10) {
        const keysToDelete = tokenKeys.slice(0, tokenKeys.length - 10);
        for (const key of keysToDelete) {
          await figma.clientStorage.deleteAsync(key);
          console.log('🗑️ Cleaned up old token:', key);
        }
      }
    }
    
    console.log('✅ Storage cleanup completed');
  } catch (error) {
    console.error('❌ Error cleaning up old storage:', error);
  }
}

// Emergency storage cleanup - clears everything if storage is still full
async function emergencyStorageCleanup() {
  try {
    console.log('🚨 Performing emergency storage cleanup...');
    const keys = await figma.clientStorage.keysAsync();
    
    // Delete all screenshots and tokens
    for (const key of keys) {
      if (key.startsWith('screenshot_') || key.startsWith('figma_')) {
        await figma.clientStorage.deleteAsync(key);
        console.log('🗑️ Emergency cleanup deleted:', key);
      }
    }
    
    console.log('✅ Emergency cleanup completed');
  } catch (error) {
    console.error('❌ Error during emergency cleanup:', error);
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

// Initialize plugin with proper clientStorage management
async function initializePlugin() {
  try {
    console.log('🚀 Initializing Figment plugin with clientStorage management');
    
    // Clean up expired exports
    await cleanupExpiredExports();
    
    // Log storage usage for debugging
    await logStorageUsage();
    
    console.log('✅ Plugin initialization complete');
  } catch (error) {
    console.error('❌ Plugin initialization failed:', error);
  }
}

// Clean up expired exports to manage 5MB storage quota
async function cleanupExpiredExports() {
  try {
    const keys = await figma.clientStorage.keysAsync();
    const exportKeys = keys.filter(key => key.startsWith('export_'));
    const now = new Date();
    
    let cleanedCount = 0;
    
    for (const key of exportKeys) {
      try {
        const data = await figma.clientStorage.getAsync(key);
        if (data && data.metadata && data.metadata.expires) {
          const expiresAt = new Date(data.metadata.expires);
          if (now > expiresAt) {
            await figma.clientStorage.deleteAsync(key);
            cleanedCount++;
            console.log(`🗑️ Cleaned expired export: ${key}`);
          }
        }
      } catch (error) {
        // If we can't read the data, it's probably corrupted, so delete it
        await figma.clientStorage.deleteAsync(key);
        cleanedCount++;
        console.log(`🗑️ Cleaned corrupted export: ${key}`);
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`✅ Cleaned ${cleanedCount} expired/corrupted exports`);
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Log current storage usage for debugging
async function logStorageUsage() {
  try {
    const keys = await figma.clientStorage.keysAsync();
    console.log(`📊 Storage keys: ${keys.length} total`);
    
    const exportKeys = keys.filter(key => key.startsWith('export_'));
    const screenshotKeys = keys.filter(key => key.startsWith('screenshot_'));
    const otherKeys = keys.filter(key => !key.startsWith('export_') && !key.startsWith('screenshot_'));
    
    console.log(`📊 Storage breakdown:`);
    console.log(`  - Exports: ${exportKeys.length} keys`);
    console.log(`  - Screenshots: ${screenshotKeys.length} keys`);
    console.log(`  - Other: ${otherKeys.length} keys`);
  } catch (error) {
    console.error('❌ Storage usage logging failed:', error);
  }
}

// Get export data from clientStorage
async function getExportFromStorage(token: string) {
  try {
    const data = await figma.clientStorage.getAsync(`export_${token}`);
    if (!data) {
      return null;
    }
    
    // Check if expired
    if (data.metadata && data.metadata.expires) {
      const now = new Date();
      const expiresAt = new Date(data.metadata.expires);
      if (now > expiresAt) {
        // Clean up expired data
        await figma.clientStorage.deleteAsync(`export_${token}`);
        return null;
      }
    }
    
    return data;
  } catch (error) {
    console.error('❌ Failed to get export from storage:', error);
    return null;
  }
}

// List all available exports
async function listAvailableExports() {
  try {
    const recentExports = await figma.clientStorage.getAsync('recent_exports') || [];
    return recentExports.filter((exp: any) => exp && exp.token);
  } catch (error) {
    console.error('❌ Failed to list exports:', error);
    return [];
  }
}

// Save token mapping to MCP server
async function saveTokenMapping(token: string, componentData: any) {
  // Define tokenData outside try block so it's available in catch
  const tokenData = {
    component: componentData,
    created: new Date().toISOString(),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  };
  
  try {
    // Clean up old storage before saving new token
    await cleanupOldScreenshots();
    
    // Store in Figma's client storage for the MCP server to access
    await figma.clientStorage.setAsync(token, JSON.stringify(tokenData));
    console.log('Token saved to client storage:', token);
  } catch (error) {
    console.error('Error saving token to client storage:', error);
    // If storage fails, try to clean up and retry once
    try {
      await cleanupOldScreenshots();
      await figma.clientStorage.setAsync(token, JSON.stringify(tokenData));
      console.log('Token saved to client storage after cleanup:', token);
    } catch (retryError) {
      console.error('Failed to save token after normal cleanup, trying emergency cleanup:', retryError);
      // If normal cleanup fails, try emergency cleanup
      try {
        await emergencyStorageCleanup();
        await figma.clientStorage.setAsync(token, JSON.stringify(tokenData));
        console.log('Token saved to client storage after emergency cleanup:', token);
      } catch (emergencyError) {
        console.error('Failed to save token even after emergency cleanup:', emergencyError);
        // At this point, we can't save to storage, but we can still send to bridge
        console.log('⚠️ Storage unavailable, but export can still proceed via bridge');
      }
    }
  }
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
  const colorStyles = await figma.getLocalPaintStylesAsync()
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
  const textStyles = await figma.getLocalTextStylesAsync()
  for (const style of textStyles) {
    typography.push({
      name: style.name,
      fontSize: (style.fontSize || 16) + 'px',
      fontWeight: (style.fontName as any)?.style || 'Regular',
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
    if (isSupportedNodeType(node)) {
      // Use the rich extraction system for AI/IDE exports
      const component = await extractDesignBlueprint(node)
      components.push(component)
    } else {
      // Try to find a compatible component
      const compatibleNode = findCompatibleComponent(node)
      if (compatibleNode) {
        const component = await extractDesignBlueprint(compatibleNode)
        components.push(component)
      }
    }
  }

  return components
}

async function extractComponentData(node: SceneNode) {
  // Use the rich extraction system instead of simplified extraction
  return await extractDesignBlueprint(node)
}

function determineComponentType(node: SceneNode): string {
  if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    return 'component'
  } else if (node.type === 'FRAME') {
    return 'container'
  }
  return 'element'
}

function extractComponentProps(node: SceneNode) {
  const props: any = {}
  
  // Extract common properties
  if ('width' in node && 'height' in node) {
    props.width = node.width
    props.height = node.height
  }
  
  // Extract text content if available
  if (node.type === 'TEXT') {
    props.text = (node as TextNode).characters
  }
  
  return props
}

async function extractComponentStyling(node: SceneNode) {
  const styling: any = {}
  
  // Extract fills
  if ('fills' in node && node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
    const fill = node.fills[0]
    if (fill.type === 'SOLID') {
      styling.backgroundColor = rgbToHex(fill.color)
    }
  }
  
  // Extract strokes
  if ('strokes' in node && node.strokes && Array.isArray(node.strokes) && node.strokes.length > 0) {
    const stroke = node.strokes[0]
    if (stroke.type === 'SOLID' && 'strokeWeight' in node) {
      styling.borderColor = rgbToHex(stroke.color)
      styling.borderWidth = (typeof node.strokeWeight === 'number' ? node.strokeWeight : 1) + 'px'
    }
  }
  
  // Extract effects (shadows)
  if ('effects' in node && node.effects && Array.isArray(node.effects) && node.effects.length > 0) {
    const effect = node.effects[0]
    if (effect.type === 'DROP_SHADOW') {
      styling.boxShadow = `${effect.offset.x}px ${effect.offset.y}px ${effect.radius}px rgba(0, 0, 0, ${effect.color ? effect.color.a || 0.5 : 0.5})`
    }
  }
  
  // Extract corner radius
  if ('cornerRadius' in node && node.cornerRadius) {
    styling.borderRadius = (typeof node.cornerRadius === 'number' ? node.cornerRadius : 0) + 'px'
  }
  
  return styling
}

function extractAccessibilityData(node: SceneNode) {
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

function generateCodeHints(node: SceneNode) {
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
