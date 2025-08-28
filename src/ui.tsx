import { useState, useEffect } from 'react';
import { emit, on } from '@create-figma-plugin/utilities';
import { render, Button, Textbox, Checkbox, Divider } from '@create-figma-plugin/ui';
import { h } from 'preact';
import React from 'react';

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Plugin error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: 'var(--figma-color-text-secondary)'
        }}>
          <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '500' }}>
            Something went wrong
          </div>
          <div style={{ fontSize: '11px' }}>
            Please try restarting the plugin
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface BlueprintData {
  component: string;
  cleanName?: string;
  normalizedName?: string;
  isInstance: boolean;
  visuals?: any;
  typography?: any;
  layout?: any;
  size?: any;
  responsive?: any;
  interactivity?: any;
  onClickHandlers?: any;
  transitions?: any;
  tokenMapping?: any;
  designTokens?: any;
  fallbackValues?: any;
  children?: any[];
  semantic?: any;
  groupMetadata?: any;
  componentReference?: any;
  linting?: any;
  lintingWarnings?: any;
  // Additional fields from DesignBlueprint
  description?: string;
  label?: string;
  variant?: string;
  geometry?: any;
  effects?: any[];
  constraints?: any;
  componentProperties?: any;
  absoluteTransform?: any;
  position?: any;
  accessibility?: any;
  breakpointBehavior?: any[];
  animation?: any;
  stateManagement?: any;
  validation?: any;
  metadata?: any;
  designSystem?: any;
  exportConfig?: any;
  componentPath?: string;
  hierarchyLevel?: number;
  siblingIndex?: number;
  prototypeFlow?: any;
  linkedScreens?: string[];
  navigationPath?: string[];
  sectionType?: string;
  containerAdaptation?: any;
  resizingLogic?: any;
  componentPurpose?: string;
  componentRole?: string;
  isReusableInstance?: boolean;
  variantStates?: string[];
  animationType?: string;
  easing?: string;
  timing?: number;
  exportStructure?: any;
  humanReadable?: boolean;
  llmParsable?: boolean;
  yamlExport?: string;
  jsonExport?: string;
  sizeMode?: string;
  responsiveBehavior?: string;
  filename?: string;
  exportedAt?: string;
  suggestedComponentType?: string;
  designIntent?: string;
  importance?: string;
  zIndex?: number;
  layerOrder?: number;
  isContainer?: boolean;
  hasMask?: boolean;
  isClipped?: boolean;
  theme?: string;
  breakpointsUsed?: boolean;
  
  // Enhanced properties for pixel-perfect reproduction
  enhancedVisuals?: any;
  precisePosition?: any;
  preciseTypography?: any;
  componentRelationships?: any;
  designContext?: any;
}

const DesignBlueprintExporter = () => {
  const [selectedNode, setSelectedNode] = useState<BlueprintData | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  
  // Export options state
  const [exportFormat, setExportFormat] = useState<'json' | 'yaml'>('json');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied'>('idle');
  
  // Enhanced UI state
  const [hoveredElementInfo, setHoveredElementInfo] = useState<{element: any, x: number, y: number} | null>(null);
  const [selectionIssue, setSelectionIssue] = useState<boolean>(false);
  
  // Loading state for node processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data.pluginMessage || event.data;
      
      if (message && message.type === 'blueprint-data') {
        setSelectedNode(message.data);
        setSelectionIssue(false);
        setIsProcessing(false);
        setProcessingStatus('');
      } else if (message && message.type === 'download-triggered') {
        handleExport();
      } else if (message && message.type === 'copy-triggered') {
        handleCopy();
      } else if (message && message.type === 'figment-export-ready') {
        handleFigmentExportReady(message.data, message.token);
      } else if (message && message.type === 'selection-issue') {
        setSelectionIssue(true);
        setIsProcessing(false);
        setProcessingStatus('');
      } else if (message && message.type === 'processing-started') {
        setIsProcessing(true);
        setProcessingStatus(message.status || 'Processing selection...');
      } else if (message && message.type === 'processing-update') {
        setProcessingStatus(message.status || 'Processing...');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Force refresh selection
  const handleForceRefresh = () => {
    parent.postMessage({ pluginMessage: { type: 'force-selection-refresh' } }, '*');
  };

    const handleExport = (format?: 'json' | 'yaml') => {
    if (!selectedNode) {
      return;
    }
    
    const actualFormat = format || exportFormat;
    setIsExporting(true);

    try {
      const blueprint = generateLLMBlueprint(selectedNode);
      
      let content = blueprint;
      let contentType = 'application/json';
      let fileExtension = 'json';
      
      if (actualFormat === 'yaml') {
        // Convert JSON to YAML (basic conversion)
        content = JSON.stringify(JSON.parse(blueprint), null, 2)
          .replace(/"/g, '')
          .replace(/:/g, ': ')
          .replace(/,$/gm, '')
          .replace(/[{}]/g, '');
        contentType = 'text/yaml';
        fileExtension = 'yaml';
      }
      
      const fileName = `${selectedNode.normalizedName || selectedNode.component || 'blueprint'}.${fileExtension}`;
      
      try {
        const dataBlob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
      } catch (downloadError) {
        
        // Fallback: Copy to clipboard and notify user
        try {
          navigator.clipboard.writeText(content).then(() => {
            alert(`Download not supported in this environment. Content has been copied to clipboard.\n\nFilename: ${fileName}`);
          }).catch(() => {
            // Final fallback: Show content in new window
            const newWindow = window.open('', '_blank');
            if (newWindow) {
              newWindow.document.write(`<pre>${content}</pre>`);
              newWindow.document.title = fileName;
              alert(`Download not supported. Content opened in new window.\n\nFilename: ${fileName}`);
            } else {
              alert(`Download failed and popup blocked. Please check browser settings.\n\nContent:\n${content.substring(0, 500)}...`);
            }
          });
        } catch {
          alert(`Download failed. Please copy the content manually:\n\n${content.substring(0, 500)}...`);
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Export failed: ${errorMessage}`);
    } finally {
      setTimeout(() => {
        setIsExporting(false);
      }, 1000);
    }
  };

  const handleFigmentExport = () => {
    if (!selectedNode) {
      alert('Please select a component first');
      return;
    }
    
    setIsExporting(true);
    emit('export-figment');
  };

  const handleFigmentExportReady = async (figmentData: any, token?: string) => {
    setIsExporting(false);
    
    console.log('🔍 Figment export ready:', { figmentData, token });
    console.log('📁 Export data structure:', {
      hasMetadata: !!figmentData?.metadata,
      hasDesignSystem: !!figmentData?.designSystem,
      hasComponents: !!figmentData?.components,
      componentCount: figmentData?.components?.length || 0,
      componentIds: figmentData?.components?.map((comp: any) => comp.id) || []
    });
    
    // Always copy token to clipboard first (primary UX)
    if (token) {
      try {
        await handleTokenCopy(token);
      } catch (error) {
        console.error('❌ Token copy failed:', error);
        // Don't throw - continue with export process
      }
    }
    
    // Try to send to bridge server for MCP availability (secondary)
    console.log('🌉 Attempting to send to bridge server...');
    const bridgeResult = await sendToBridgeServer(figmentData, token);
    
    if (bridgeResult.success) {
      console.log('✅ Data sent to bridge server successfully');
      console.log('📁 Bridge file location:', bridgeResult.file);
      // showSuccessNotification(`✅ Export complete!\n\nToken: ${token}\n\n✅ Copied to clipboard\n✅ Bridge connected\n\nData available for MCP server and AI assistants.`);
    } else {
      console.log('⚠️ Bridge server unavailable - token is still available for MCP use');
      // showSuccessNotification(`✅ Token copied: ${token}\n\n⚠️ Bridge server not found\n\nStart the bridge server with: npm run bridge`);
    }
  };

  // Function to send data to bridge server
  const sendToBridgeServer = async (figmentData: any, token?: string) => {
    const BRIDGE_URL = 'http://localhost:8473/export';
    
    try {
      // Extract component ID if this is a single component export
      let componentId = null;
      if (figmentData.components && figmentData.components.length === 1) {
        const component = figmentData.components[0];
        componentId = component.component || component.id || component.cleanName;
      }
      
      const exportData = {
        type: 'real-time',
        figment: figmentData,
        token: token || generateToken(),
        componentId: componentId
      };
      
      console.log('🌉 Sending to bridge server:', BRIDGE_URL);
      console.log('📦 Data size:', JSON.stringify(exportData).length, 'bytes');
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Bridge server response:', result);
      
      return {
        success: true,
        file: result.file,
        token: result.token,
        message: result.message
      };
      
    } catch (error) {
      console.error('❌ Bridge server communication error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Bridge server timeout - server may not be running';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Bridge server not found - start with: npm run bridge';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'CORS error - check bridge server configuration';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Generate token for bridge communication
  const generateToken = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `figma_${timestamp}_${random}`;
  };

  const handleTokenCopy = async (token: string) => {
    console.log('🎫 Starting token copy process:', token);
    console.log('📋 Clipboard API available:', !!navigator.clipboard);
    console.log('🔒 Secure context:', window.isSecureContext);
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        console.log('✅ Using modern clipboard API');
        await navigator.clipboard.writeText(token);
        console.log('✅ Token copied to clipboard successfully');
        // showSuccessNotification('✅ Token copied to clipboard!');
        return;
      }
    } catch (clipboardError) {
      console.warn('⚠️ Modern clipboard API failed:', clipboardError);
    }
    
    try {
      // Fallback for older browsers or non-secure contexts
      console.log('⚠️ Using fallback clipboard method');
      const textArea = document.createElement('textarea');
      textArea.value = token;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      
      // Try to focus and select
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, token.length);
      
      // Attempt copy
      const copied = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (copied) {
        console.log('✅ Token copied using fallback method');
        // showSuccessNotification('✅ Token copied to clipboard!');
        return;
      } else {
        throw new Error('execCommand copy returned false');
      }
    } catch (fallbackError) {
      console.error('❌ Fallback clipboard method failed:', fallbackError);
    }
    
    // Final fallback - show token dialog for manual copying
    console.log('ℹ️ All clipboard methods failed, showing manual copy dialog');
    showTokenDialog(token);
  };

  const showTokenDialog = (token: string) => {
    // Create a modal-like notification with selectable text
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--figma-color-bg);
      color: var(--figma-color-text);
      padding: 16px;
      border: 1px solid var(--figma-color-border);
      border-radius: 8px;
      font-size: 11px;
      font-weight: 500;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    notification.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: 600;">Copy this token:</div>
      <div style="
        background: var(--figma-color-bg-secondary);
        padding: 8px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 10px;
        word-break: break-all;
        user-select: all;
        cursor: text;
      ">${token}</div>
      <div style="margin-top: 8px; font-size: 9px; color: var(--figma-color-text-secondary);">
        Use this token with any AI assistant or development tool
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 10000);
    
    // Remove on click
    notification.addEventListener('click', () => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    });
  };

  const showSuccessNotification = (message: string) => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--figma-color-bg);
      color: var(--figma-color-text);
      padding: 8px 12px;
      border: 1px solid var(--figma-color-border);
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.2s ease;
      max-width: 250px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 200);
    }, 3000);
  };

  const showErrorNotification = (message: string) => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--figma-color-bg);
      color: var(--figma-color-text);
      padding: 8px 12px;
      border: 1px solid var(--figma-color-border);
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.2s ease;
      max-width: 250px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 200);
    }, 3000);
  };

  const handleCopy = async () => {
    if (!selectedNode) return;
    
    setCopyStatus('copying');
    
    try {
      const blueprint = generateLLMBlueprint(selectedNode);
      await navigator.clipboard.writeText(blueprint);
      setCopyStatus('copied');
      
      setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
      
    } catch (error) {
      setCopyStatus('idle');
    }
  };

  const renderComponentInfo = () => {
    if (!selectedNode) return null;

    return (
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--figma-color-border)',
        backgroundColor: 'var(--figma-color-bg-secondary)'
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '500',
          color: 'var(--figma-color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '8px'
        }}>
          Component Info
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--figma-color-text)'
            }}>
              {selectedNode.component}
            </span>
            <span style={{
              fontSize: '11px',
              color: 'var(--figma-color-text-secondary)',
              backgroundColor: 'var(--figma-color-bg-tertiary)',
              padding: '2px 6px',
              borderRadius: '3px'
            }}>
              {selectedNode.semantic?.role || 'component'}
            </span>
          </div>
          
          {selectedNode.size && (
            <div style={{
              fontSize: '11px',
              color: 'var(--figma-color-text-secondary)'
            }}>
              {Math.round(selectedNode.size.width)} × {Math.round(selectedNode.size.height)}px
              {selectedNode.children && ` • ${selectedNode.children.length} children`}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getElementIcon = (child: any) => {
    if (child.typography?.textContent) return 'T';
    if (child.semantic?.role === 'button' || child.interactivity?.onClick) return 'BTN';
    if (child.visuals?.fills?.some((fill: any) => fill.type === 'IMAGE')) return 'IMG';
    if (child.component?.toLowerCase().includes('icon')) return 'ICN';
    if (child.visuals?.strokes?.length > 0) return 'VEC';
    return 'DIV';
  };

  const getElementColor = (child: any) => {
    const fills = child.visuals?.fills;
    if (fills && fills[0]?.color) {
      const { r, g, b } = fills[0].color;
      return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
    }
    return 'var(--figma-color-border)';
  };





    const renderBlueprintTrace = (data: BlueprintData) => {
    if (!data.size) {
      return (
        <div style={{
          width: '100%',
          height: '100px',
          border: '2px dashed var(--figma-color-border)',
          borderRadius: '6px',
          backgroundColor: 'var(--figma-color-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          color: 'var(--figma-color-text-secondary)',
          cursor: 'pointer'
        }}>
          {data.component}
        </div>
      );
    }



     // Visual mode - interactive component layout preview
     const containerWidth = 340;
     const containerHeight = 200;
     
     const scale = Math.min(
       (containerWidth - 20) / data.size.width,
       (containerHeight - 40) / data.size.height,
       1
     );
     
     const scaledWidth = data.size.width * scale;
     const scaledHeight = data.size.height * scale;
     
     return (
       <div style={{
         width: '100%',
         height: '100%',
         position: 'relative',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         padding: '8px'
       }}>

         {/* Main Component Container */}
         <div style={{
           width: scaledWidth,
           height: scaledHeight,
           border: '1px solid var(--figma-color-bg-brand)',
           borderRadius: '3px',
           backgroundColor: 'var(--figma-color-bg)',
           position: 'relative',
           overflow: 'hidden'
         }}>
           {/* Component Header */}
           <div style={{
             position: 'absolute',
             top: '-18px',
             left: '0',
             fontSize: '10px',
             fontWeight: '500',
             color: 'var(--figma-color-text-secondary)',
             backgroundColor: 'var(--figma-color-bg)',
             padding: '1px 4px',
             borderRadius: '2px',
             border: '1px solid var(--figma-color-border)',
             whiteSpace: 'nowrap',
             zIndex: 10
           }}>
             {data.component}
           </div>

           {/* Child Elements - Positioned Layout */}
           {data.children?.map((child, index) => {
             if (!child.size || !child.position) return null;
             
             const childX = (child.position.x || 0) * scale;
             const childY = (child.position.y || 0) * scale;
             const childWidth = Math.max(child.size.width * scale, 12);
             const childHeight = Math.max(child.size.height * scale, 8);
             
             const isHovered = hoveredElement === `visual-${index}`;
             const elementColor = getElementColor(child);
             
             // Determine element styling based on type
             let elementStyle: React.CSSProperties = {
               position: 'absolute',
               left: childX,
               top: childY,
               width: childWidth,
               height: childHeight,
               cursor: 'pointer',
               transition: 'all 0.15s ease',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               fontSize: '7px',
               fontWeight: '500',
               borderRadius: '2px'
             };

             const isText = child.typography?.textContent;
             const isInteractive = child.semantic?.role === 'button' || child.interactivity?.onClick;
             
             if (isText) {
               elementStyle.border = '1px dashed var(--figma-color-border-secondary)';
               elementStyle.backgroundColor = isHovered ? 'var(--figma-color-bg-hover)' : 'transparent';
               elementStyle.color = 'var(--figma-color-text-secondary)';
                           } else if (isInteractive) {
               elementStyle.border = '1px solid var(--figma-color-border)';
               elementStyle.backgroundColor = isHovered ? 'var(--figma-color-bg-brand)' : elementColor;
               elementStyle.color = isHovered ? 'var(--figma-color-text-onbrand)' : 'var(--figma-color-text)';
             } else {
               elementStyle.border = '1px solid var(--figma-color-border)';
               elementStyle.backgroundColor = isHovered ? 'var(--figma-color-bg-hover)' : elementColor;
               elementStyle.color = 'var(--figma-color-text-secondary)';
             }

             if (isHovered) {
               elementStyle.transform = 'scale(1.05)';
               elementStyle.zIndex = 10;
       
             }

             return (
               <div
                 key={index}
                                  style={elementStyle}
                 onMouseEnter={(e) => {
                   setHoveredElement(`visual-${index}`);
                   const rect = e.currentTarget.getBoundingClientRect();
                   setHoveredElementInfo({
                     element: child,
                     x: rect.right + 8,
                     y: rect.top
                   });
                 }}
                 onMouseLeave={() => {
                   setHoveredElement(null);
                   setHoveredElementInfo(null);
                 }}
 

               >
                 {childWidth > 20 && childHeight > 12 ? getElementIcon(child) : ''}
               </div>
             );
           })}
         </div>

         {         /* Info Panel */}
         <div style={{
           position: 'absolute',
           bottom: '6px',
           left: '50%',
           transform: 'translateX(-50%)',
           fontSize: '8px',
           color: 'var(--figma-color-text-secondary)',
           backgroundColor: 'var(--figma-color-bg)',
           padding: '2px 6px',
           borderRadius: '3px',
           border: '1px solid var(--figma-color-border)',
           whiteSpace: 'nowrap'
         }}>
           {Math.round(data.size.width)} × {Math.round(data.size.height)}px • {data.children?.length || 0} elements
         </div>
       </div>
     );
  };

  // Use the new blueprint trace renderer
  const renderFigment = renderBlueprintTrace;

  const generateLLMBlueprint = (data: BlueprintData) => {
    // Clean and filter the data for LLM consumption
    const cleanDesignTokens = data.designTokens ? Object.fromEntries(
      Object.entries(data.designTokens).map(([category, tokens]) => [
        category,
        Object.fromEntries(
          Object.entries(tokens as Record<string, any>).filter(([_, value]) => value !== null)
        )
      ]).filter(([_, tokens]) => Object.keys(tokens as Record<string, any>).length > 0)
    ) : {};

    const cleanVisuals = data.visuals ? {
      ...(data.visuals.fills && data.visuals.fills.length > 0 && { 
        fills: data.visuals.fills.map((fill: any) => ({
          type: fill.type,
          ...(fill.color && { color: fill.color }),
          ...(fill.gradientStops && { gradientStops: fill.gradientStops }),
          ...(fill.gradientTransform && { gradientTransform: fill.gradientTransform }),
          ...(fill.opacity !== 1 && { opacity: fill.opacity })
        }))
      }),
      ...(data.visuals.strokes && data.visuals.strokes.length > 0 && { 
        strokes: data.visuals.strokes.map((stroke: any) => ({
          type: stroke.type,
          ...(stroke.color && { color: stroke.color }),
          ...(stroke.gradientStops && { gradientStops: stroke.gradientStops }),
          ...(stroke.gradientTransform && { gradientTransform: stroke.gradientTransform }),
          ...(stroke.opacity !== 1 && { opacity: stroke.opacity })
        }))
      }),
      ...(data.visuals.borderRadius && { borderRadius: data.visuals.borderRadius }),
      ...(data.visuals.opacity !== 1 && { opacity: data.visuals.opacity }),
      ...(data.visuals.strokeWeight && data.visuals.strokeWeight !== 1 && { strokeWeight: data.visuals.strokeWeight })
    } : {};

    const cleanLayout = data.layout ? {
      // Layout system information
      ...(data.layout.autoLayout && data.layout.autoLayout.enabled && { 
        display: 'flex',
        direction: data.layout.autoLayout.direction.toLowerCase(),
        alignItems: data.layout.autoLayout.alignItems?.toLowerCase(),
        justifyContent: data.layout.autoLayout.justifyContent?.toLowerCase(),
        gap: data.layout.autoLayout.gap > 0 ? `${data.layout.autoLayout.gap}px` : undefined
      }),
      ...(!data.layout.autoLayout?.enabled && { display: 'block' }),
      
      // Constraints and sizing
      ...(data.layout.constraints && { constraints: data.layout.constraints }),
      ...(data.layout.sizeMode && { sizeMode: data.layout.sizeMode }),
      
      // Spacing
      ...(data.layout.padding && Object.values(data.layout.padding).some((v: any) => v > 0) && { 
        padding: {
          ...(data.layout.padding.top > 0 && { top: `${data.layout.padding.top}px` }),
          ...(data.layout.padding.right > 0 && { right: `${data.layout.padding.right}px` }),
          ...(data.layout.padding.bottom > 0 && { bottom: `${data.layout.padding.bottom}px` }),
          ...(data.layout.padding.left > 0 && { left: `${data.layout.padding.left}px` })
        }
      }),
      ...(data.layout.gap && data.layout.gap > 0 && { gap: `${data.layout.gap}px` })
    } : {};

    const cleanChildren = data.children?.map(child => {
      const cleanChildVisuals = child.visuals ? {
        ...(child.visuals.fills && child.visuals.fills.length > 0 && { 
          fills: child.visuals.fills.map((fill: any) => ({
            type: fill.type,
            ...(fill.color && { color: fill.color }),
            ...(fill.gradientStops && { gradientStops: fill.gradientStops }),
            ...(fill.gradientTransform && { gradientTransform: fill.gradientTransform }),
            ...(fill.opacity !== 1 && { opacity: fill.opacity })
          }))
        }),
        ...(child.visuals.strokes && child.visuals.strokes.length > 0 && { 
          strokes: child.visuals.strokes.map((stroke: any) => ({
            type: stroke.type,
            ...(stroke.color && { color: stroke.color }),
            ...(stroke.gradientStops && { gradientStops: stroke.gradientStops }),
            ...(stroke.gradientTransform && { gradientTransform: stroke.gradientTransform }),
            ...(stroke.opacity !== 1 && { opacity: stroke.opacity })
          }))
        }),
        ...(child.visuals.borderRadius && { borderRadius: child.visuals.borderRadius }),
        ...(child.visuals.opacity !== 1 && { opacity: child.visuals.opacity }),
        ...(child.visuals.strokeWeight && child.visuals.strokeWeight !== 1 && { strokeWeight: child.visuals.strokeWeight })
      } : {};

      const cleanChildTypography = child.typography ? {
        ...(child.typography.font && { 
          font: {
            family: child.typography.font.fallback?.family,
            size: child.typography.font.fallback?.size,
            weight: child.typography.font.fallback?.weight
          }
        }),
        ...(child.typography.textContent && { textContent: child.typography.textContent }),
        ...(child.typography.textColor && { textColor: child.typography.textColor }),
        ...(child.typography.alignment && { alignment: child.typography.alignment }),
        ...(child.typography.textCase && child.typography.textCase !== 'ORIGINAL' && { textCase: child.typography.textCase.toLowerCase() }),
        ...(child.typography.textDecoration && child.typography.textDecoration !== 'NONE' && { textDecoration: child.typography.textDecoration.toLowerCase() })
      } : {};

      // Determine semantic tag based on content, styling, and context
      const getSemanticTag = (child: any) => {
        if (child.semantic?.role === 'text' || child.typography?.textContent) {
          const fontSize = parseInt(child.typography?.font?.fallback?.size || '16');
          const weight = child.typography?.font?.fallback?.weight || 400;
          const textContent = child.typography?.textContent?.toLowerCase() || '';
          
          // Check if it's actually a button (interactive element)
          if (child.semantic?.role === 'button' || 
              child.interactivity?.onClick || 
              textContent.includes('button') ||
              child.component?.toLowerCase().includes('button')) {
            return 'button';
          }
          
          // Check if it's a heading (semantic page structure)
          if (fontSize >= 32 || weight >= 600) {
            // Verify it's actually a heading, not just large decorative text
            if (textContent.includes('heading') || 
                textContent.includes('title') || 
                textContent.includes('header') ||
                child.component?.toLowerCase().includes('heading') ||
                child.component?.toLowerCase().includes('title')) {
              return 'h1';
            }
            // Large decorative text should be span or p
            return 'span';
          }
          
          if (fontSize >= 24 || weight >= 600) return 'h2';
          if (fontSize >= 20 || weight >= 600) return 'h3';
          if (fontSize >= 18 || weight >= 600) return 'h4';
          if (fontSize >= 16 || weight >= 600) return 'h5';
          if (fontSize >= 14 || weight >= 600) return 'h6';
          
          // Default to span for short text, p for longer text
          return textContent.length < 50 ? 'span' : 'p';
        }
        return undefined;
      };

      // Add layout information
      const getLayoutInfo = (child: any) => {
        const layout: any = {};
        
        if (child.layout?.autoLayout?.enabled) {
          layout.display = 'flex';
          layout.direction = child.layout.autoLayout.direction.toLowerCase();
          layout.alignItems = child.layout.autoLayout.alignItems?.toLowerCase();
          layout.justifyContent = child.layout.autoLayout.justifyContent?.toLowerCase();
          if (child.layout.autoLayout.gap > 0) layout.gap = `${child.layout.autoLayout.gap}px`;
        } else {
          layout.display = 'block';
        }
        
        // Add padding if available
        if (child.layout?.padding) {
          const padding = child.layout.padding;
          if (padding.top > 0 || padding.right > 0 || padding.bottom > 0 || padding.left > 0) {
            layout.padding = {
              ...(padding.top > 0 && { top: `${padding.top}px` }),
              ...(padding.right > 0 && { right: `${padding.right}px` }),
              ...(padding.bottom > 0 && { bottom: `${padding.bottom}px` }),
              ...(padding.left > 0 && { left: `${padding.left}px` })
            };
          }
        }
        
        return Object.keys(layout).length > 0 ? layout : undefined;
      };

      // Recursively process nested children
      const nestedChildren = child.children?.map((grandchild: any) => {
        // Apply same cleaning logic to nested children
        return {
          component: grandchild.component,
          type: grandchild.semantic?.role || 'element',
          ...(grandchild.size && { size: grandchild.size }),
          ...(grandchild.typography && { typography: grandchild.typography }),
          ...(grandchild.visuals && { visuals: grandchild.visuals })
        };
      }).filter((grandchild: any) => Object.keys(grandchild).length > 2) || [];

      return {
        component: child.component,
        type: child.semantic?.role || 'element',
        ...(getSemanticTag(child) && { semanticTag: getSemanticTag(child) }),
        ...(child.size && { size: child.size }),
        ...(child.position && (child.position.x !== 0 || child.position.y !== 0 || child.position.rotation !== 0) && { 
          position: {
            ...(child.position.x !== 0 && { x: child.position.x }),
            ...(child.position.y !== 0 && { y: child.position.y }),
            ...(child.position.rotation !== 0 && { rotation: child.position.rotation })
          }
        }),
        ...(Object.keys(cleanChildVisuals).length > 0 && { visuals: cleanChildVisuals }),
        ...(Object.keys(cleanChildTypography).length > 0 && { typography: cleanChildTypography }),
        ...(getLayoutInfo(child) && { layout: getLayoutInfo(child) }),
        ...(child.zIndex && child.zIndex !== 0 && { zIndex: child.zIndex }),
        ...(child.layerOrder && { layerOrder: child.layerOrder }),
        ...(child.interactivity && Object.keys(child.interactivity).length > 0 && { interactivity: child.interactivity }),
        ...(nestedChildren.length > 0 && { children: nestedChildren })
      };
    }).filter(child => Object.keys(child).length > 2) || [];

    // Create a clean, LLM-optimized JSON structure
    const blueprint = {
      _extractionSummary: {
        version: "2.0.0",
        features: {
          subPixelPositioning: !!data.precisePosition,
          canvasBasedTypography: !!data.preciseTypography,
          advancedVisualEffects: !!data.enhancedVisuals,
          componentSystemIntegration: !!data.componentRelationships,
          designContextAware: !!data.designContext
        },
        completeness: `${calculateExtractionCompleteness(data)}% of advanced features extracted`
      },
      
      component: data.component,
      type: data.semantic?.role || 'component',
      ...(data.description && { description: data.description }),
      
      // Core properties
      size: data.size,
      // Only include position if it's meaningful (not at origin and not default rotation)
      ...(data.position && (data.position.x !== 0 || data.position.y !== 0 || data.position.rotation !== 0) && { 
        position: {
          ...(data.position.x !== 0 && { x: data.position.x }),
          ...(data.position.y !== 0 && { y: data.position.y }),
          ...(data.position.rotation !== 0 && { rotation: data.position.rotation })
        }
      }),
      
      // Design tokens and styling (only if they exist and are meaningful)
      ...(Object.keys(cleanDesignTokens).length > 0 && { designTokens: cleanDesignTokens }),
      ...(Object.keys(cleanVisuals).length > 0 && { visuals: cleanVisuals }),
      ...(data.typography && Object.keys(data.typography).length > 0 && { 
        typography: {
          ...(data.typography.font && { 
            font: {
              family: data.typography.font.fallback?.family,
              size: data.typography.font.fallback?.size,
              weight: data.typography.font.fallback?.weight
            }
          }),
          ...(data.typography.textContent && { textContent: data.typography.textContent }),
          ...(data.typography.textColor && { textColor: data.typography.textColor }),
          ...(data.typography.alignment && { alignment: data.typography.alignment }),
          ...(data.typography.textCase && data.typography.textCase !== 'ORIGINAL' && { textCase: data.typography.textCase.toLowerCase() }),
          ...(data.typography.textDecoration && data.typography.textDecoration !== 'NONE' && { textDecoration: data.typography.textDecoration.toLowerCase() })
        }
      }),
      
      // Layout and structure (only if meaningful)
      ...(Object.keys(cleanLayout).length > 0 && { layout: cleanLayout }),
      ...(cleanChildren.length > 0 && { children: cleanChildren }),
      
      // Semantic and accessibility (only if meaningful)
      ...(data.semantic && data.semantic.role && { semantic: { role: data.semantic.role } }),
      
      // Responsive behavior (only if enabled)
      ...(data.responsive && Object.keys(data.responsive).length > 0 && { responsive: data.responsive }),
      
      // Interactivity (only if present)
      ...(data.interactivity && Object.keys(data.interactivity).length > 0 && { interactivity: data.interactivity }),
      
      // Enhanced features
      ...(data.enhancedVisuals && { enhancedVisuals: data.enhancedVisuals }),
      ...(data.precisePosition && { precisePosition: data.precisePosition }),
      ...(data.preciseTypography && { preciseTypography: data.preciseTypography }),
      ...(data.componentRelationships && { componentRelationships: data.componentRelationships }),
      ...(data.designContext && { designContext: data.designContext }),
      
      // Export metadata
      exportedAt: new Date().toISOString(),
      
      // Enhanced metadata for LLM understanding
      metadata: {
        extractedFrom: 'figma',
        version: '2.0.0-pixel-perfect',
        extractionCapabilities: {
          pixelPerfectAccuracy: true,
          subPixelPositioning: !!data.precisePosition,
          canvasBasedTypography: !!data.preciseTypography,
          advancedVisualEffects: !!data.enhancedVisuals,
          componentSystemAware: !!data.componentRelationships,
          designContextAware: !!data.designContext,
          extractionCompleteness: calculateExtractionCompleteness(data)
        },
        complexity: calculateComplexity(data, cleanChildren),
        relationships: {
          parentType: null, // Parent type not available in current data structure
          childrenTypes: cleanChildren.map((child: any) => child.type || 'unknown'),
          siblingIndex: data.siblingIndex || 0,
          hierarchyDepth: data.hierarchyLevel || 0
        },
        designSystemContext: {
          usesTokens: Object.keys(cleanDesignTokens).length > 0,
          tokenTypes: Object.keys(cleanDesignTokens),
          componentVariant: data.variant || null,
          isSystemComponent: data.isInstance || false
        },
        implementationContext: {
          estimatedComplexity: calculateImplementationComplexity(data, cleanChildren),
          requiredDependencies: getRequiredDependencies(data),
          suggestedLibraries: getSuggestedLibraries(data),
          performanceConsiderations: getPerformanceConsiderations(data, cleanChildren)
        }
      },
      
      // AI hints for code generation
      aiHints: {
        // Component classification and patterns
        componentType: data.semantic?.role || 'component',
        componentPattern: detectComponentPattern(data),
        suggestedHTML: getSuggestedHTMLElement(data),
        
        // Implementation guidance
        implementation: {
          framework: getFrameworkRecommendations(data),
          styling: getStyleImplementationHints(data, cleanDesignTokens, cleanVisuals),
          layout: getLayoutImplementationHints(data),
          responsive: getResponsiveImplementationHints(data),
          accessibility: getAccessibilityImplementationHints(data),
          typography: getTypographySystemAnalysis(data, cleanChildren),
          colorSystem: getColorSystemAnalysis(data, cleanChildren)
        },
        
        // Semantic structure
        semantics: {
          role: data.semantic?.role,
          purpose: data.semantic?.purpose,
          isInteractive: data.semantic?.isInteractive || false,
          hasStates: detectInteractionStates(data),
          hierarchyLevel: data.hierarchyLevel || 0,
          contextualRole: getContextualRole(data, cleanChildren),
          componentRelationships: getComponentRelationships(data, cleanChildren),
          compositionPatterns: getCompositionPatterns(data, cleanChildren)
        },
        
        // Design system integration
        designSystem: {
          usesTokens: Object.keys(cleanDesignTokens).length > 0,
          tokenCategories: Object.keys(cleanDesignTokens),
          componentVariant: data.variant,
          designPatterns: detectDesignPatterns(data, cleanChildren),
          tokenRecommendations: generateTokenRecommendations(data, cleanChildren),
          systemIntegration: getSystemIntegrationHints(data, cleanChildren)
        },
        
        // Code generation hints
        codeGeneration: {
          preferredStructure: getPreferredCodeStructure(data),
          stateManagement: getStateManagementHints(data),
          propsInterface: generatePropsInterface(data),
          cssStrategy: getCSSStrategy(data, cleanVisuals),
          testingHints: getTestingRecommendations(data),
          implementationExamples: getImplementationExamples(data, cleanChildren),
          performanceOptimizations: getAdvancedPerformanceHints(data, cleanChildren),
          animationOpportunities: getAnimationOpportunities(data, cleanChildren)
        },
        
        // Implementation guidance
        accessibility: data.semantic?.role ? `Use proper ARIA roles and labels for ${data.semantic.role}` : 'Ensure proper semantic HTML structure',
        layout: data.layout?.autoLayout?.enabled ? `Use flexbox with ${data.layout.autoLayout.direction.toLowerCase()} direction` : 'Use appropriate layout system',
        styling: Object.keys(cleanDesignTokens).length > 0 ? 'Use design tokens for consistent styling' : 'Apply consistent visual styling',
        ...(data.size && { dimensions: `${data.size.width}×${data.size.height}px` }),
        
        pixelPerfectInstructions: {
          overview: "This component includes advanced data for precise reproduction",
          dataAvailable: {
            enhancedVisuals: !!data.enhancedVisuals,
            precisePositioning: !!data.precisePosition, 
            advancedTypography: !!data.preciseTypography,
            componentSystem: !!data.componentRelationships,
            designContext: !!data.designContext
          },
          
          // Positioning guidance
          ...(data.precisePosition && {
            positioningGuidance: {
              useSubPixels: "Use the preciseX and preciseY values for exact positioning",
              relativePositioning: `Element is ${data.precisePosition.relativeToParent?.xPercent?.toFixed(1)}% from left, ${data.precisePosition.relativeToParent?.yPercent?.toFixed(1)}% from top of parent`,
              pixelPerfectBounds: `Visual bounds: ${data.precisePosition.visualBounds?.width}×${data.precisePosition.visualBounds?.height}px`,
              implementationHint: "Use transform: translate3d() for sub-pixel positioning"
            }
          }),
          
          // Typography guidance  
          ...(data.preciseTypography && {
            typographyGuidance: {
              fontLoading: `Use font-display: ${data.preciseTypography.fontDisplay || 'swap'} for optimal loading`,
              textMetrics: data.preciseTypography.textMetrics ? 
                `Actual text width: ${Math.round(data.preciseTypography.textMetrics.width)}px, ascent: ${Math.round(data.preciseTypography.textMetrics.actualBoundingBoxAscent)}px` : 
                "Canvas-based measurements available",
              lineSpacing: data.preciseTypography.lineBoxes?.length > 0 ? 
                `${data.preciseTypography.lineBoxes.length} lines detected` : 
                "Single-line text",
              fontStack: data.preciseTypography.fontStack ? 
                `Primary: ${data.preciseTypography.fontStack.primary?.family}, Fallback: ${data.preciseTypography.fontStack.systemFallback}` :
                "Use provided font fallback chain",
              implementationHint: "Use line-height and letter-spacing values from textMetrics"
            }
          }),
          
          // Visual effects guidance
          ...(data.enhancedVisuals && {
            visualGuidance: {
              blendModes: data.enhancedVisuals.mixBlendMode !== 'normal' ? 
                `Apply mix-blend-mode: ${data.enhancedVisuals.mixBlendMode}` : 
                "Standard normal blending",
              masking: data.enhancedVisuals.clipPath ? 
                `Use clip-path: ${data.enhancedVisuals.clipPath}` : 
                "No clipping required",
              backdropEffects: data.enhancedVisuals.backdropBlur > 0 ? 
                `Apply backdrop-filter: blur(${data.enhancedVisuals.backdropBlur}px)` : 
                "No backdrop effects",
              subPixelRendering: data.enhancedVisuals.subPixelRendering ? 
                "Enable text-rendering: optimizeLegibility" : 
                "Standard text rendering",
              implementationHint: "Use CSS containment and will-change for complex effects"
            }
          }),
          
          // Component system guidance
          ...(data.componentRelationships && {
            componentGuidance: {
              designSystem: data.componentRelationships.designSystemPath?.length > 0 ? 
                `Part of design system: ${data.componentRelationships.designSystemPath.join(' > ')}` : 
                "Standalone component",
              instanceOverrides: data.componentRelationships.instanceOverrides?.length > 0 ? 
                `${data.componentRelationships.instanceOverrides.length} instance overrides detected` : 
                "Base component state",
              styleReferences: data.componentRelationships.styleReferences?.length > 0 ? 
                `Uses ${data.componentRelationships.styleReferences.length} design system styles` : 
                "Custom styling",
              implementationHint: "Consider creating prop interfaces for overrides"
            }
          }),
          
          // Implementation strategy
          implementationStrategy: {
            approach: "precise-reproduction",
            priority: [
              data.precisePosition ? "Use precise positioning values" : null,
              data.preciseTypography ? "Implement exact typography measurements" : null,
              data.enhancedVisuals ? "Apply advanced visual effects" : null,
              data.componentRelationships ? "Respect design system relationships" : null
            ].filter(Boolean),
            framework: {
              react: "Use styled-components or CSS-in-JS for precise control",
              vue: "Use scoped styles with CSS custom properties",
              angular: "Use component-scoped styles with ViewEncapsulation"
            },
            css: {
              positioning: data.precisePosition ? "absolute/relative with transform" : "standard positioning",
              typography: data.preciseTypography ? "exact line-height and letter-spacing" : "standard typography",
              effects: data.enhancedVisuals ? "advanced CSS properties" : "standard effects"
            }
          }
        }
      }
    };
    
    return JSON.stringify(blueprint, null, 2);
  };

  // Helper functions for enhanced AI hints
  const detectComponentPattern = (data: any): string => {
    const name = data.component?.toLowerCase() || '';
    const hasChildren = data.children && data.children.length > 0;
    const isInteractive = data.semantic?.isInteractive || data.interactivity;
    
    // Detect common UI patterns
    if (name.includes('button') || data.semantic?.role === 'button') return 'button';
    if (name.includes('card') && hasChildren) return 'card';
    if (name.includes('modal') || name.includes('dialog')) return 'modal';
    if (name.includes('form') || data.semantic?.role === 'form') return 'form';
    if (name.includes('input') || name.includes('field')) return 'input';
    if (name.includes('nav') || name.includes('menu')) return 'navigation';
    if (name.includes('list') && hasChildren) return 'list';
    if (name.includes('grid') && hasChildren) return 'grid';
    if (name.includes('table') && hasChildren) return 'table';
    if (name.includes('header')) return 'header';
    if (name.includes('footer')) return 'footer';
    if (name.includes('sidebar')) return 'sidebar';
    if (name.includes('notification') || name.includes('alert')) return 'notification';
    if (name.includes('tooltip')) return 'tooltip';
    if (name.includes('dropdown')) return 'dropdown';
    if (name.includes('tab')) return 'tabs';
    if (hasChildren && data.layout?.autoLayout?.enabled) return 'container';
    if (data.semantic?.role === 'text' || data.typography?.textContent) return 'text';
    
    return 'component';
  };

  const getSuggestedHTMLElement = (data: any): string => {
    const pattern = detectComponentPattern(data);
    const isInteractive = data.semantic?.isInteractive || data.interactivity;
    
    const elementMap: Record<string, string> = {
      'button': 'button',
      'form': 'form',
      'input': 'input',
      'navigation': 'nav',
      'list': 'ul',
      'table': 'table',
      'header': 'header',
      'footer': 'footer',
      'sidebar': 'aside',
      'text': data.typography?.textContent?.length > 50 ? 'p' : 'span',
      'notification': 'div[role="alert"]',
      'modal': 'dialog',
      'tooltip': 'div[role="tooltip"]',
      'dropdown': 'select'
    };
    
    return elementMap[pattern] || (isInteractive ? 'button' : 'div');
  };

  const getFrameworkRecommendations = (data: any): any => {
    const pattern = detectComponentPattern(data);
    const hasState = data.semantic?.isInteractive || data.interactivity;
    
    return {
      react: {
        component: hasState ? 'functional component with hooks' : 'functional component',
        hooks: hasState ? ['useState', 'useCallback'] : [],
        patterns: pattern === 'form' ? ['controlled components'] : 
                 pattern === 'modal' ? ['portal', 'focus management'] : 
                 pattern === 'list' ? ['key props', 'virtualization if large'] : []
      },
      vue: {
        component: hasState ? 'composition API' : 'template-only',
        composables: hasState ? ['ref', 'computed'] : []
      },
      angular: {
        component: 'standalone component',
        features: hasState ? ['reactive forms', 'change detection'] : []
      }
    };
  };

  const getStyleImplementationHints = (data: any, tokens: any, visuals: any): any => {
    const hasTokens = Object.keys(tokens).length > 0;
    const hasComplexVisuals = visuals.borderRadius || visuals.boxShadow || visuals.fills?.length > 1;
    
    return {
      approach: hasTokens ? 'design-tokens' : 'css-custom-properties',
      methodology: 'CSS-in-JS recommended for component-scoped styles',
      considerations: [
        hasComplexVisuals ? 'Complex visual effects detected - consider CSS-in-JS or styled-components' : null,
        data.responsive ? 'Responsive design - use CSS Grid or Flexbox' : null,
        visuals.borderRadius ? 'Consistent border radius - extract to design token' : null,
        visuals.boxShadow ? 'Shadow effects - consider elevation system' : null
      ].filter(Boolean),
      cssProperties: generateCSSHints(visuals, data)
    };
  };

  const generateCSSHints = (visuals: any, data: any): any => {
    const hints: any = {};
    
    if (visuals.fills?.length > 0) {
      hints.background = visuals.fills[0].type === 'SOLID' ? 'solid color' : 'gradient or image';
    }
    
    if (visuals.borderRadius) {
      hints.borderRadius = getBorderRadiusValue(visuals.borderRadius);
    }
    
    if (data.layout?.autoLayout?.enabled) {
      hints.display = 'flex';
      hints.flexDirection = data.layout.autoLayout.direction === 'HORIZONTAL' ? 'row' : 'column';
      hints.gap = data.layout.autoLayout.itemSpacing ? `${data.layout.autoLayout.itemSpacing}px` : 'auto';
    }
    
    if (data.size) {
      hints.dimensions = {
        width: `${data.size.width}px`,
        height: `${data.size.height}px`,
        aspectRatio: (data.size.width / data.size.height).toFixed(2)
      };
    }
    
    return hints;
  };

  const getLayoutImplementationHints = (data: any): any => {
    const autoLayout = data.layout?.autoLayout;
    const hasChildren = data.children && data.children.length > 0;
    
    if (autoLayout?.enabled) {
      return {
        system: 'flexbox',
        direction: autoLayout.direction === 'HORIZONTAL' ? 'row' : 'column',
        alignment: {
          main: autoLayout.primaryAxisAlignItems || 'flex-start',
          cross: autoLayout.counterAxisAlignItems || 'stretch'
        },
        spacing: autoLayout.itemSpacing ? `gap: ${autoLayout.itemSpacing}px` : 'no gap',
        padding: autoLayout.paddingTop ? `padding: ${autoLayout.paddingTop}px` : 'no padding',
        implementation: 'Use CSS Flexbox with appropriate flex properties'
      };
    }
    
    if (hasChildren) {
      return {
        system: 'css-grid',
        implementation: 'Consider CSS Grid for complex layouts or absolute positioning for precise control'
      };
    }
    
    return {
      system: 'block',
      implementation: 'Standard block-level element'
    };
  };

  const getResponsiveImplementationHints = (data: any): any => {
    if (!data.responsive) return null;
    
    // Generate breakpoints based on component size
    const componentWidth = data.size?.width || 400;
    const breakpoints = generateResponsiveBreakpoints(componentWidth);
    
    return {
      strategy: 'mobile-first',
      breakpoints,
      considerations: [
        'Use relative units (rem, em, %) where appropriate',
        'Implement fluid typography with clamp()',
        'Consider container queries for component-level responsiveness',
        data.layout?.autoLayout?.enabled ? 'Flexbox will handle most responsive behavior automatically' : 'May need explicit responsive rules',
        componentWidth > 768 ? 'Component is large - consider responsive scaling' : 'Component size is mobile-friendly'
      ].filter(Boolean),
      implementation: 'Use CSS media queries or CSS-in-JS responsive utilities'
    };
  };

  const getAccessibilityImplementationHints = (data: any): any => {
    const pattern = detectComponentPattern(data);
    const isInteractive = data.semantic?.isInteractive;
    const allTextElements = extractAllTextElements(data, data.children || []);
    const allColors = extractAllColors(data, data.children || []);
    
    const baseHints = {
      semanticHTML: `Use semantic ${getSuggestedHTMLElement(data)} element`,
      ariaLabels: isInteractive ? 'Add aria-label or aria-labelledby' : 'Ensure proper heading hierarchy',
      keyboardNavigation: isInteractive ? 'Implement keyboard event handlers' : 'Not applicable',
      focusManagement: isInteractive ? 'Ensure visible focus indicators' : 'Not applicable',
      colorContrast: generateContrastRecommendations(allColors),
      textAccessibility: generateTextAccessibilityHints(allTextElements)
    };
    
    const patternSpecificHints: Record<string, any> = {
      'notification': {
        ...baseHints,
        specific: [
          'Use role="alert" for important notifications',
          'Use role="status" for non-critical updates',
          'Provide dismiss functionality with proper labeling',
          'Ensure notification content is announced by screen readers',
          'Consider auto-dismiss timing (minimum 5 seconds for reading)'
        ]
      },
      'button': {
        ...baseHints,
        specific: ['Add aria-pressed for toggle buttons', 'Use aria-expanded for dropdown triggers', 'Ensure minimum 44px touch target']
      },
      'form': {
        ...baseHints,
        specific: ['Associate labels with inputs', 'Provide error messages with aria-describedby', 'Use fieldset for grouped inputs']
      },
      'modal': {
        ...baseHints,
        specific: ['Implement focus trapping', 'Add aria-modal="true"', 'Manage focus return on close']
      },
      'navigation': {
        ...baseHints,
        specific: ['Use nav element', 'Add aria-current for active items', 'Implement skip links']
      },
      'list': {
        ...baseHints,
        specific: ['Use proper list markup (ul/ol)', 'Add role="list" if CSS removes list semantics']
      }
    };
    
    return patternSpecificHints[pattern] || baseHints;
  };

  const generateContrastRecommendations = (colors: any[]): string[] => {
    const recommendations: string[] = [];
    
    const textColors = colors.filter(c => c.usage === 'text');
    const backgroundColors = colors.filter(c => c.usage === 'background');
    
    if (textColors.length > 0 && backgroundColors.length > 0) {
      recommendations.push('Verify WCAG AA contrast ratio (4.5:1) between text and background colors');
      recommendations.push('Test with color blindness simulators');
    }
    
    if (colors.some(c => c.color.includes('128, 128, 128'))) {
      recommendations.push('Gray text may have contrast issues - verify accessibility');
    }
    
    recommendations.push('Ensure color is not the only means of conveying information');
    
    return recommendations;
  };

  const generateTextAccessibilityHints = (textElements: any[]): string[] => {
    const hints: string[] = [];
    
    const sizes = textElements.map(el => parseFloat(el.fontSize || '16'));
    const minSize = Math.min(...sizes);
    
    if (minSize < 14) {
      hints.push('Some text is below 14px - consider increasing for better readability');
    }
    
    if (textElements.some(el => el.fontWeight && el.fontWeight < 400)) {
      hints.push('Light font weights may be difficult to read - ensure sufficient contrast');
    }
    
    const hierarchy = analyzeTypographyHierarchy(textElements);
    if (hierarchy.filter(h => h.includes('heading')).length > 0) {
      hints.push('Use proper heading tags (h1, h2, h3) for semantic hierarchy');
    }
    
    hints.push('Test with screen readers and 200% zoom');
    hints.push('Ensure text can be selected and copied');
    
    return hints;
  };

  const detectInteractionStates = (data: any): string[] => {
    const states: string[] = [];
    
    if (data.semantic?.isInteractive || data.interactivity) {
      states.push('hover', 'focus', 'active');
    }
    
    if (detectComponentPattern(data) === 'button') {
      states.push('disabled');
    }
    
    if (data.semantic?.role === 'input') {
      states.push('invalid', 'disabled', 'required');
    }
    
    if (detectComponentPattern(data) === 'modal') {
      states.push('open', 'closed');
    }
    
    return states;
  };

  const getContextualRole = (data: any, children: any[]): string => {
    if (children.length === 0) return 'leaf';
    if (children.length === 1) return 'wrapper';
    if (children.every((child: any) => child.type === 'text')) return 'text-container';
    if (children.some((child: any) => detectComponentPattern(child) === 'button')) return 'interactive-container';
    return 'container';
  };

  const detectDesignPatterns = (data: any, children: any[]): string[] => {
    const patterns: string[] = [];
    
    // Layout patterns
    if (data.layout?.autoLayout?.enabled) {
      patterns.push(data.layout.autoLayout.direction === 'HORIZONTAL' ? 'horizontal-stack' : 'vertical-stack');
    }
    
    // Component patterns
    const pattern = detectComponentPattern(data);
    if (pattern !== 'component') patterns.push(pattern);
    
    // Composition patterns
    if (children.length > 3) patterns.push('multi-element-composition');
    if (children.some((child: any) => child.typography?.textContent)) patterns.push('text-and-media');
    
    return patterns;
  };

  const getPreferredCodeStructure = (data: any): any => {
    const pattern = detectComponentPattern(data);
    const hasChildren = data.children && data.children.length > 0;
    
    return {
      componentType: hasChildren ? 'composite' : 'atomic',
      structure: pattern === 'form' ? 'controlled-form' : 
                pattern === 'list' ? 'mapped-list' : 
                pattern === 'modal' ? 'portal-component' : 'standard-component',
      props: generatePropsInterface(data),
      children: hasChildren ? 'render-children' : 'self-closing'
    };
  };

  const getStateManagementHints = (data: any): any => {
    const pattern = detectComponentPattern(data);
    const isInteractive = data.semantic?.isInteractive;
    
    if (!isInteractive) return { required: false };
    
    const stateHints: Record<string, any> = {
      'button': { states: ['pressed', 'disabled'], management: 'local-state' },
      'form': { states: ['values', 'validation', 'submission'], management: 'form-library' },
      'modal': { states: ['open', 'closing'], management: 'global-state' },
      'input': { states: ['value', 'validation', 'focus'], management: 'controlled-component' }
    };
    
    return stateHints[pattern] || { states: ['active'], management: 'local-state' };
  };

  const generatePropsInterface = (data: any): any => {
    const pattern = detectComponentPattern(data);
    const baseProps = ['className?', 'style?', 'children?'];
    
    const patternProps: Record<string, string[]> = {
      'button': [...baseProps, 'onClick', 'disabled?', 'variant?'],
      'form': [...baseProps, 'onSubmit', 'validation?'],
      'input': [...baseProps, 'value', 'onChange', 'placeholder?', 'required?'],
      'text': [...baseProps, 'as?', 'variant?'],
      'modal': [...baseProps, 'isOpen', 'onClose', 'title?']
    };
    
    return {
      required: patternProps[pattern]?.filter(prop => !prop.includes('?')) || [],
      optional: patternProps[pattern]?.filter(prop => prop.includes('?')) || baseProps
    };
  };

  const getCSSStrategy = (data: any, visuals: any): any => {
    const hasComplexVisuals = visuals.borderRadius || visuals.boxShadow || visuals.fills?.length > 1;
    const hasAnimations = data.animation || data.interactivity;
    
    return {
      approach: hasComplexVisuals || hasAnimations ? 'css-in-js' : 'css-modules',
      reasoning: hasComplexVisuals ? 'Complex visual effects benefit from dynamic styling' : 
                hasAnimations ? 'Animations require programmatic control' : 
                'Simple styling can use static CSS',
      recommendations: [
        'Use CSS custom properties for theming',
        hasComplexVisuals ? 'Consider styled-components or emotion for complex styles' : null,
        data.responsive ? 'Implement responsive design with CSS Grid/Flexbox' : null
      ].filter(Boolean)
    };
  };

  const getTestingRecommendations = (data: any): any => {
    const pattern = detectComponentPattern(data);
    const isInteractive = data.semantic?.isInteractive;
    
    return {
      unit: isInteractive ? 'Test user interactions and state changes' : 'Test rendering and props',
      integration: pattern === 'form' ? 'Test form submission and validation' : 
                  pattern === 'modal' ? 'Test modal opening/closing and focus management' : 
                  'Test component integration with parent components',
      accessibility: 'Test with screen readers and keyboard navigation',
      visual: 'Consider visual regression testing for complex components'
    };
  };

  const calculateComplexity = (data: any, children: any[]): string => {
    let score = 0;
    
    // Base complexity
    if (children.length > 0) score += 1;
    if (children.length > 3) score += 1;
    if (children.length > 10) score += 2;
    
    // Visual complexity
    if (data.visuals?.fills?.length > 1) score += 1;
    if (data.visuals?.borderRadius) score += 1;
    if (data.visuals?.boxShadow) score += 1;
    
    // Layout complexity
    if (data.layout?.autoLayout?.enabled) score += 1;
    if (data.responsive) score += 1;
    
    // Interaction complexity
    if (data.semantic?.isInteractive) score += 1;
    if (data.interactivity) score += 2;
    
    // Typography complexity
    if (data.typography) score += 1;
    
    if (score <= 2) return 'simple';
    if (score <= 5) return 'moderate';
    if (score <= 8) return 'complex';
    return 'very-complex';
  };

  const calculateExtractionCompleteness = (data: any): number => {
    let availableFeatures = 0;
    let totalFeatures = 5; // Total pixel-perfect features we can extract
    
    // Check for each pixel-perfect feature
    if (data.enhancedVisuals) availableFeatures++;
    if (data.precisePosition) availableFeatures++;
    if (data.preciseTypography) availableFeatures++;
    if (data.componentRelationships) availableFeatures++;
    if (data.designContext) availableFeatures++;
    
    return Math.round((availableFeatures / totalFeatures) * 100);
  };

  const calculateImplementationComplexity = (data: any, children: any[]): any => {
    const pattern = detectComponentPattern(data);
    const hasState = data.semantic?.isInteractive || data.interactivity;
    const hasComplexLayout = data.layout?.autoLayout?.enabled && children.length > 3;
    
    return {
      level: calculateComplexity(data, children),
      factors: [
        hasState ? 'state-management' : null,
        hasComplexLayout ? 'complex-layout' : null,
        data.responsive ? 'responsive-design' : null,
        pattern === 'form' ? 'form-validation' : null,
        pattern === 'modal' ? 'focus-management' : null,
        children.length > 10 ? 'performance-optimization' : null
      ].filter(Boolean),
      estimatedDevelopmentTime: getEstimatedDevelopmentTime(data, children, pattern)
    };
  };

  const getEstimatedDevelopmentTime = (data: any, children: any[], pattern: string): string => {
    let baseTime = 30; // base minutes
    
    // Adjust base time by pattern complexity
    const patternMultipliers: Record<string, number> = {
      'text': 0.5,
      'button': 1,
      'input': 1.2,
      'form': 3,
      'modal': 2.5,
      'navigation': 2,
      'table': 2.5,
      'list': 1.5,
      'card': 1.3,
      'notification': 1.2
    };
    
    baseTime *= patternMultipliers[pattern] || 1;
    
    // Add time for children
    baseTime += children.length * 15;
    
    // Add time for complex features
    if (data.semantic?.isInteractive) baseTime += 30;
    if (data.responsive) baseTime += 45;
    if (data.animation) baseTime += 60;
    if (data.visuals?.borderRadius) baseTime += 10;
    if (data.visuals?.boxShadow) baseTime += 15;
    if (data.layout?.autoLayout?.enabled) baseTime += 20;
    
    // Apply complexity multiplier
    const complexityMultiplier = {
      'simple': 1,
      'moderate': 1.3,
      'complex': 1.8,
      'very-complex': 2.5
    }[calculateComplexity(data, children)] || 1;
    
    const totalMinutes = Math.round(baseTime * complexityMultiplier);
    
    if (totalMinutes < 60) return `${totalMinutes} minutes`;
    if (totalMinutes < 480) return `${Math.round(totalMinutes / 60 * 10) / 10} hours`;
    return `${Math.round(totalMinutes / 480 * 10) / 10} days`;
  };

  const getRequiredDependencies = (data: any): string[] => {
    const pattern = detectComponentPattern(data);
    const dependencies: string[] = ['react']; // Always need React
    
    // Pattern-specific dependencies
    if (pattern === 'form') {
      dependencies.push('react-hook-form');
      if (data.validation) {
        dependencies.push('@hookform/resolvers', 'yup');
      }
    }
    
    if (pattern === 'modal') {
      dependencies.push('react-dom');
      if (data.semantic?.isInteractive) {
        dependencies.push('focus-trap-react');
      }
    }
    
    if (pattern === 'input' && data.semantic?.isInteractive) {
      dependencies.push('react-hook-form');
    }
    
    // Feature-based dependencies
    if (data.animation || data.interactivity?.animations) {
      dependencies.push('framer-motion');
    }
    
    if (data.responsive && data.responsive.breakpoints && Object.keys(data.responsive.breakpoints).length > 0) {
      dependencies.push('@media-query/react');
    }
    
    // Styling dependencies based on complexity
    const hasComplexVisuals = data.visuals?.borderRadius || data.visuals?.boxShadow || 
                             (data.visuals?.fills && data.visuals.fills.length > 1);
    const hasDesignTokens = Object.keys(data.designTokens || {}).length > 0;
    
    if (hasComplexVisuals || hasDesignTokens) {
      dependencies.push('styled-components', '@types/styled-components');
    }
    
    // TypeScript if component is complex
    const complexity = calculateComplexity(data, data.children || []);
    if (complexity === 'complex' || complexity === 'very-complex') {
      dependencies.push('@types/react');
    }
    
    return Array.from(new Set(dependencies)); // Remove duplicates
  };

  const getSuggestedLibraries = (data: any): any => {
    const pattern = detectComponentPattern(data);
    
    const suggestions: any = {
      styling: [],
      state: [],
      animation: [],
      accessibility: [],
      testing: []
    };
    
    // Styling libraries
    if (data.visuals?.borderRadius || data.visuals?.boxShadow) {
      suggestions.styling.push('styled-components', 'emotion', 'stitches');
    } else {
      suggestions.styling.push('css-modules', 'tailwindcss');
    }
    
    // State management
    if (data.semantic?.isInteractive) {
      suggestions.state.push('zustand', 'jotai', 'redux-toolkit');
    }
    
    // Animation libraries
    if (data.animation || pattern === 'modal') {
      suggestions.animation.push('framer-motion', 'react-spring', 'lottie-react');
    }
    
    // Accessibility libraries
    if (data.semantic?.isInteractive) {
      suggestions.accessibility.push('react-aria', 'reach-ui', 'ariakit');
    }
    
    // Testing libraries
    suggestions.testing.push('@testing-library/react', '@testing-library/jest-dom', '@testing-library/user-event');
    
    return suggestions;
  };

  const getPerformanceConsiderations = (data: any, children: any[]): string[] => {
    const considerations: string[] = [];
    
    if (children.length > 20) {
      considerations.push('Consider virtualization for large lists');
    }
    
    if (data.visuals?.fills?.find((fill: any) => fill.type === 'IMAGE')) {
      considerations.push('Optimize images with next/image or similar');
    }
    
    if (data.animation || data.interactivity) {
      considerations.push('Use CSS transforms for animations to avoid layout thrashing');
    }
    
    if (detectComponentPattern(data) === 'form') {
      considerations.push('Debounce validation and API calls');
    }
    
    if (data.responsive) {
      considerations.push('Use CSS media queries instead of JavaScript for responsive behavior');
    }
    
    if (children.length > 5) {
      considerations.push('Consider code splitting for complex components');
    }
    
    return considerations;
  };

  const getImplementationExamples = (data: any, children: any[]): any => {
    const pattern = detectComponentPattern(data);
    const hasState = data.semantic?.isInteractive || data.interactivity;
    
    const examples: any = {
      react: {
        component: generateReactExample(data, pattern, hasState),
        props: generatePropsExample(data, pattern),
        styles: generateStylesExample(data, pattern)
      },
      typescript: {
        interface: generateTypeScriptInterface(data, pattern),
        types: generateCustomTypes(data, pattern)
      },
      css: {
        classes: generateCSSClasses(data, pattern),
        variables: generateCSSVariables(data)
      }
    };
    
    return examples;
  };

  const generateReactExample = (data: any, pattern: string, hasState: boolean): string => {
    const componentName = data.component?.replace(/[^a-zA-Z0-9]/g, '') || 'Component';
    const props = generatePropsInterface(data);
    
    const templates: Record<string, string> = {
      'button': `
interface ${componentName}Props {
  ${props.required.join(';\n  ')};
  ${props.optional.join(';\n  ')};
}

export const ${componentName}: React.FC<${componentName}Props> = ({ 
  children, 
  onClick, 
  disabled = false,
  variant = 'primary',
  ...props 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={\`btn btn-\${variant}\`}
      {...props}
    >
      {children}
    </button>
  );
};`,
      'form': `
interface ${componentName}Props {
  onSubmit: (data: FormData) => void;
  validation?: ValidationSchema;
}

export const ${componentName}: React.FC<${componentName}Props> = ({ 
  onSubmit,
  validation 
}) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields here */}
      <button type="submit">Submit</button>
    </form>
  );
};`,
      'modal': `
interface ${componentName}Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const ${componentName}: React.FC<${componentName}Props> = ({ 
  isOpen, 
  onClose, 
  title, 
  children 
}) => {
  if (!isOpen) return null;
  
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {title && <h2>{title}</h2>}
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>,
    document.body
  );
};`
    };
    
    return templates[pattern] || `
interface ${componentName}Props {
  children?: React.ReactNode;
  className?: string;
}

export const ${componentName}: React.FC<${componentName}Props> = ({ 
  children, 
  className,
  ...props 
}) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};`;
  };

  const generatePropsExample = (data: any, pattern: string): any => {
    const examples: Record<string, any> = {
      'button': {
        usage: '<Button onClick={() => {}} variant="primary">Click me</Button>',
        props: {
          onClick: '() => void',
          variant: '"primary" | "secondary" | "danger"',
          disabled: 'boolean',
          size: '"small" | "medium" | "large"'
        }
      },
      'form': {
        usage: '<Form onSubmit={handleSubmit} validation={schema} />',
        props: {
          onSubmit: '(data: FormData) => void',
          validation: 'ValidationSchema',
          initialValues: 'Record<string, any>'
        }
      },
      'modal': {
        usage: '<Modal isOpen={isOpen} onClose={handleClose} title="Dialog">Content</Modal>',
        props: {
          isOpen: 'boolean',
          onClose: '() => void',
          title: 'string',
          size: '"small" | "medium" | "large" | "fullscreen"'
        }
      }
    };
    
    return examples[pattern] || {
      usage: `<Component className="custom-class">Content</Component>`,
      props: {
        className: 'string',
        children: 'React.ReactNode'
      }
    };
  };

  const generateStylesExample = (data: any, pattern: string): string => {
    const hasAutoLayout = data.layout?.autoLayout?.enabled;
    const hasVisuals = data.visuals && Object.keys(data.visuals).length > 0;
    
    let styles = '';
    
    if (hasAutoLayout) {
      styles += `
.component {
  display: flex;
  flex-direction: ${data.layout.autoLayout.direction === 'HORIZONTAL' ? 'row' : 'column'};
  ${data.layout.autoLayout.itemSpacing ? `gap: ${data.layout.autoLayout.itemSpacing}px;` : ''}
  ${data.layout.autoLayout.paddingTop ? `padding: ${data.layout.autoLayout.paddingTop}px;` : ''}
}`;
    }
    
    if (hasVisuals) {
      styles += `
.component {
        ${data.visuals.borderRadius ? `border-radius: ${getBorderRadiusValue(data.visuals.borderRadius)};` : ''}
  ${data.visuals.fills?.[0] ? `background-color: ${data.visuals.fills[0].color};` : ''}
  ${data.visuals.strokes?.[0] ? `border: 1px solid ${data.visuals.strokes[0].color};` : ''}
}`;
    }
    
    if (data.size) {
      styles += `
.component {
  width: ${data.size.width}px;
  height: ${data.size.height}px;
}`;
    }
    
    return styles || `
.component {
  /* Add your styles here */
}`;
  };

  const generateTypeScriptInterface = (data: any, pattern: string): string => {
    const componentName = data.component?.replace(/[^a-zA-Z0-9]/g, '') || 'Component';
    const props = generatePropsInterface(data);
    
    const requiredProps = props.required.filter((prop: string) => prop && prop.trim()).map((prop: string) => 
      `${prop}: ${getTypeForProp(prop)}`
    );
    
    const optionalProps = props.optional.filter((prop: string) => prop && prop.trim()).map((prop: string) => 
      `${prop.replace('?', '')}: ${getTypeForProp(prop.replace('?', ''))}`
    );
    
    const allProps = [...requiredProps, ...optionalProps].filter(prop => prop && prop.trim());
    
    let interfaceContent = `
interface ${componentName}Props {`;
    
    if (allProps.length > 0) {
      interfaceContent += `
  ${allProps.join(';\n  ')};`;
    }
    
    interfaceContent += `
}`;

    // Add pattern-specific interfaces only if needed
    if (pattern === 'form') {
      interfaceContent += `

interface FormData {
  // Define your form fields here
  [key: string]: any;
}`;
    }

    if (pattern === 'modal') {
      interfaceContent += `

interface ModalProps extends ${componentName}Props {
  isOpen: boolean;
  onClose: () => void;
}`;
    }
    
    return interfaceContent;
  };

  const getTypeForProp = (prop: string): string => {
    const typeMap: Record<string, string> = {
      'onClick': '() => void',
      'onSubmit': '(data: any) => void',
      'onClose': '() => void',
      'onChange': '(value: any) => void',
      'disabled': 'boolean',
      'required': 'boolean',
      'isOpen': 'boolean',
      'className': 'string',
      'style': 'React.CSSProperties',
      'children': 'React.ReactNode',
      'variant': 'string',
      'size': 'string',
      'title': 'string',
      'placeholder': 'string'
    };
    
    return typeMap[prop] || 'any';
  };

  const generateCustomTypes = (data: any, pattern: string): string => {
    const types: string[] = [];
    
    if (pattern === 'button') {
      types.push(`
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';`);
    }
    
    if (pattern === 'form') {
      types.push(`
type ValidationRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
};

type ValidationSchema = Record<string, ValidationRule>;`);
    }
    
    if (pattern === 'modal') {
      types.push(`
type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen';
type ModalAnimation = 'fade' | 'slide' | 'scale';`);
    }
    
    return types.join('\n');
  };

  const generateCSSClasses = (data: any, pattern: string): string[] => {
    const baseClass = pattern.toLowerCase();
    const classes = [baseClass];
    
    if (data.semantic?.isInteractive) {
      classes.push(`${baseClass}--interactive`);
    }
    
    if (data.variant) {
      classes.push(`${baseClass}--${data.variant.toLowerCase()}`);
    }
    
    if (data.size) {
      const sizeClass = data.size.width > 200 ? 'large' : data.size.width > 100 ? 'medium' : 'small';
      classes.push(`${baseClass}--${sizeClass}`);
    }
    
    return classes;
  };

  const generateResponsiveBreakpoints = (componentWidth: number): string[] => {
    const breakpoints: string[] = ['320px']; // Always include mobile
    
    // Add breakpoints based on component width
    if (componentWidth > 480) {
      breakpoints.push('480px');
    }
    if (componentWidth > 768) {
      breakpoints.push('768px');
    }
    if (componentWidth > 1024) {
      breakpoints.push('1024px');
    }
    if (componentWidth > 1440) {
      breakpoints.push('1440px');
    }
    
    // Always include a breakpoint slightly larger than component width
    const nextBreakpoint = Math.ceil(componentWidth / 100) * 100;
    if (nextBreakpoint > componentWidth && !breakpoints.includes(`${nextBreakpoint}px`)) {
      breakpoints.push(`${nextBreakpoint}px`);
    }
    
    return breakpoints.sort((a, b) => parseInt(a) - parseInt(b));
  };

  const getBorderRadiusValue = (borderRadius: any): string => {
    if (typeof borderRadius === 'number') {
      return `${borderRadius}px`;
    }
    
    if (typeof borderRadius === 'object' && borderRadius !== null) {
      if (borderRadius.uniform !== undefined) {
        return `${borderRadius.uniform}px`;
      }
      
      // Handle mixed corner radius
      const { topLeft, topRight, bottomLeft, bottomRight } = borderRadius;
      if (topLeft !== undefined || topRight !== undefined || bottomLeft !== undefined || bottomRight !== undefined) {
        const tl = topLeft || 0;
        const tr = topRight || 0;
        const bl = bottomLeft || 0;
        const br = bottomRight || 0;
        
        // If all corners are the same, return uniform value
        if (tl === tr && tr === bl && bl === br) {
          return `${tl}px`;
        }
        
        // Return mixed corner values
        return `${tl}px ${tr}px ${br}px ${bl}px`;
      }
    }
    
    return '0px';
  };

  const generateCSSVariables = (data: any): Record<string, string> => {
    const variables: Record<string, string> = {};
    
    if (data.visuals?.fills?.[0]?.color) {
      variables['--primary-color'] = data.visuals.fills[0].color;
    }
    
    if (data.visuals?.borderRadius) {
      variables['--border-radius'] = getBorderRadiusValue(data.visuals.borderRadius);
    }
    
    if (data.size) {
      variables['--width'] = `${data.size.width}px`;
      variables['--height'] = `${data.size.height}px`;
    }
    
    if (data.layout?.autoLayout?.itemSpacing) {
      variables['--gap'] = `${data.layout.autoLayout.itemSpacing}px`;
    }
    
    return variables;
  };

  // Advanced analysis functions for 100% LLM accuracy
  const getTypographySystemAnalysis = (data: any, children: any[]): any => {
    const allTextElements = extractAllTextElements(data, children);
    const fontSizes = allTextElements.map(el => parseFloat(el.fontSize || '16')).filter(Boolean);
    const fontWeights = allTextElements.map(el => el.fontWeight || 400).filter(Boolean);
    const fontFamilies = Array.from(new Set(allTextElements.map(el => el.fontFamily).filter(Boolean)));
    
    return {
      hierarchy: analyzeTypographyHierarchy(allTextElements),
      scale: {
        sizes: Array.from(new Set(fontSizes)).sort((a, b) => b - a),
        weights: Array.from(new Set(fontWeights)).sort((a, b) => b - a),
        families: fontFamilies
      },
      semanticMapping: generateSemanticTypographyMapping(allTextElements),
      recommendations: {
        systemApproach: fontSizes.length > 2 ? 'modular-scale' : 'simple-scale',
        tokenStructure: generateTypographyTokens(allTextElements),
        accessibilityNotes: getTypographyAccessibilityNotes(allTextElements)
      }
    };
  };

  const getColorSystemAnalysis = (data: any, children: any[]): any => {
    try {
      const allColors = extractAllColors(data, children);
      const colorPalette = analyzeColorPalette(allColors);
      
      return {
        palette: colorPalette,
        usage: analyzeColorUsage(allColors), // Pass original colors array, not palette
        relationships: analyzeColorRelationships(colorPalette),
        recommendations: {
          tokenStructure: generateColorTokens(colorPalette),
          accessibilityCompliance: checkColorAccessibility(allColors),
          systemApproach: colorPalette.length > 5 ? 'comprehensive-system' : 'simple-palette'
        }
      };
    } catch (error) {
      console.error('Error in color system analysis:', error);
      return {
        palette: [],
        usage: {},
        relationships: { colorCount: 0 },
        recommendations: {
          tokenStructure: {},
          accessibilityCompliance: { needsContrastCheck: true, recommendations: [] },
          systemApproach: 'simple-palette'
        }
      };
    }
  };

  const getComponentRelationships = (data: any, children: any[]): any => {
    return {
      isContainer: children.length > 0,
      containsVariants: children.some((child: any) => child.component?.includes('/')),
      hasTextHierarchy: children.some((child: any) => child.typography?.textContent),
      layoutPattern: detectLayoutPattern(data, children),
      nesting: {
        depth: calculateNestingDepth(children),
        complexity: children.length > 3 ? 'complex' : children.length > 1 ? 'moderate' : 'simple'
      },
      dependencies: children.map((child: any) => ({
        component: child.component,
        type: child.type,
        role: child.semantic?.role || 'unknown'
      }))
    };
  };

  const getCompositionPatterns = (data: any, children: any[]): string[] => {
    const patterns: string[] = [];
    
    // Layout composition patterns
    if (data.layout?.direction === 'vertical') patterns.push('vertical-composition');
    if (data.layout?.direction === 'horizontal') patterns.push('horizontal-composition');
    
    // Content composition patterns
    const hasText = children.some((child: any) => child.type === 'text');
    const hasContainers = children.some((child: any) => child.type === 'container');
    const hasElements = children.some((child: any) => child.type === 'element');
    
    if (hasText && hasContainers) patterns.push('text-container-mix');
    if (hasText && hasElements) patterns.push('text-element-mix');
    if (hasContainers && hasElements) patterns.push('container-element-mix');
    
    // Structural patterns
    if (children.length > 5) patterns.push('multi-component');
    if (children.every((child: any) => child.size?.width === children[0].size?.width)) patterns.push('uniform-width');
    if (children.some((child: any) => child.position)) patterns.push('positioned-elements');
    
    // Design patterns
    const componentNames = children.map((child: any) => child.component?.toLowerCase() || '');
    if (componentNames.some(name => name.includes('title') || name.includes('header'))) patterns.push('header-content');
    if (componentNames.some(name => name.includes('variant') || name.includes('option'))) patterns.push('variant-showcase');
    
    return patterns;
  };

  const generateTokenRecommendations = (data: any, children: any[]): any => {
    const allColors = extractAllColors(data, children);
    const allTextElements = extractAllTextElements(data, children);
    const spacingValues = extractSpacingValues(data, children);
    const borderRadiusValues = extractBorderRadiusValues(data, children);
    
    return {
      colors: generateColorTokens(analyzeColorPalette(allColors)),
      typography: generateTypographyTokens(allTextElements),
      spacing: generateSpacingTokens(spacingValues),
      borderRadius: generateBorderRadiusTokens(borderRadiusValues),
      shadows: generateShadowTokens(data, children),
      breakpoints: generateBreakpointTokens(data)
    };
  };

  const getSystemIntegrationHints = (data: any, children: any[]): any => {
    const complexity = calculateComplexity(data, children);
    const pattern = detectComponentPattern(data);
    
    return {
      designSystemFit: {
        level: complexity === 'simple' ? 'atomic' : complexity === 'moderate' ? 'molecular' : 'organism',
        reusability: children.length > 0 ? 'high' : 'medium',
        composability: children.length > 2 ? 'composable' : 'standalone'
      },
      integrationStrategy: {
        approach: pattern === 'notification' ? 'system-component' : 'custom-component',
        dependencies: getSystemDependencies(data, children),
        variants: suggestComponentVariants(data, children)
      },
      scalability: {
        responsive: data.responsive ? 'fully-responsive' : 'static',
        theming: Object.keys(data.designTokens || {}).length > 0 ? 'themeable' : 'fixed',
        customization: 'highly-customizable'
      }
    };
  };

  const getAdvancedPerformanceHints = (data: any, children: any[]): string[] => {
    const hints: string[] = [];
    
    if (children.length > 10) {
      hints.push('Consider virtualization for large component lists');
      hints.push('Implement React.memo for child components to prevent unnecessary re-renders');
    }
    
    if (children.length > 5) {
      hints.push('Use React.memo for performance optimization');
      hints.push('Consider code splitting if component becomes large');
    }
    
    if (data.visuals?.borderRadius) {
      hints.push('Use CSS containment for layout optimization');
    }
    
    if (data.visuals?.boxShadow) {
      hints.push('Use transform: translateZ(0) to promote shadow elements to GPU layer');
    }
    
    if (data.layout?.direction === 'vertical' && children.length > 3) {
      hints.push('Consider CSS Grid for complex vertical layouts');
    }
    
    const hasImages = children.some((child: any) => 
      child.visuals?.fills?.some((fill: any) => fill.type === 'IMAGE')
    );
    if (hasImages) {
      hints.push('Implement lazy loading for images');
      hints.push('Use next/image or similar for automatic optimization');
    }
    
    if (data.animation || data.interactivity) {
      hints.push('Use CSS transforms instead of changing layout properties');
      hints.push('Implement will-change CSS property for animated elements');
    }
    
    const complexity = calculateComplexity(data, children);
    if (complexity === 'complex' || complexity === 'very-complex') {
      hints.push('Consider dynamic imports for complex components');
      hints.push('Use tree shaking to eliminate unused code');
    }
    
    return hints;
  };

  const getAnimationOpportunities = (data: any, children: any[]): any => {
    const opportunities: any = {
      entrance: [],
      interaction: [],
      transition: [],
      microInteractions: []
    };
    
    const pattern = detectComponentPattern(data);
    
    if (pattern === 'notification') {
      opportunities.entrance.push('slide-in-from-top', 'fade-in-scale');
      opportunities.transition.push('auto-dismiss-after-delay');
      opportunities.microInteractions.push('close-button-hover');
    }
    
    if (pattern === 'modal') {
      opportunities.entrance.push('fade-in-backdrop', 'scale-in-content');
      opportunities.transition.push('backdrop-blur-in');
    }
    
    if (pattern === 'button') {
      opportunities.interaction.push('hover-scale', 'active-press', 'focus-ring');
      opportunities.microInteractions.push('ripple-effect', 'loading-spinner');
    }
    
    if (data.layout?.direction === 'vertical' && children.length > 2) {
      opportunities.entrance.push('stagger-children-entrance');
    }
    
    if (data.visuals?.borderRadius) {
      opportunities.microInteractions.push('border-radius-hover-change');
    }
    
    if (data.visuals?.boxShadow) {
      opportunities.interaction.push('shadow-elevation-on-hover');
    }
    
    const hasText = children.some((child: any) => child.type === 'text');
    if (hasText) {
      opportunities.microInteractions.push('text-color-transition', 'typing-animation');
    }
    
    return {
      ...opportunities,
      recommendations: {
        library: 'framer-motion',
        performance: 'Use transform and opacity for best performance',
        accessibility: 'Respect prefers-reduced-motion user preference'
      }
    };
  };

  // Utility functions for advanced analysis
  const extractAllTextElements = (data: any, children: any[]): any[] => {
    const textElements: any[] = [];
    
    if (data.typography?.textContent) {
      textElements.push({
        content: data.typography.textContent,
        fontSize: data.typography.font?.fallback?.size,
        fontWeight: data.typography.font?.fallback?.weight,
        fontFamily: data.typography.font?.fallback?.family,
        color: data.typography.textColor
      });
    }
    
    const extractFromChildren = (childrenArray: any[]): void => {
      childrenArray.forEach((child: any) => {
        if (child.typography?.textContent) {
          textElements.push({
            content: child.typography.textContent,
            fontSize: child.typography.font?.fallback?.size,
            fontWeight: child.typography.font?.fallback?.weight,
            fontFamily: child.typography.font?.fallback?.family,
            color: child.typography.textColor
          });
        }
        if (child.children) {
          extractFromChildren(child.children);
        }
      });
    };
    
    if (children) extractFromChildren(children);
    return textElements.filter(el => el.content);
  };

  const extractAllColors = (data: any, children: any[]): any[] => {
    const colors: any[] = [];
    
    const extractColorsFromElement = (element: any): void => {
      if (element.visuals?.fills) {
        element.visuals.fills.forEach((fill: any) => {
          if (fill.color) colors.push({ color: fill.color, usage: 'background', element: element.component });
        });
      }
      
      if (element.visuals?.strokes) {
        element.visuals.strokes.forEach((stroke: any) => {
          if (stroke.color) colors.push({ color: stroke.color, usage: 'border', element: element.component });
        });
      }
      
      if (element.typography?.textColor) {
        colors.push({ color: element.typography.textColor, usage: 'text', element: element.component });
      }
    };
    
    extractColorsFromElement(data);
    
    const processChildren = (childrenArray: any[]): void => {
      childrenArray.forEach((child: any) => {
        extractColorsFromElement(child);
        if (child.children) processChildren(child.children);
      });
    };
    
    if (children) processChildren(children);
    return colors;
  };

  const analyzeTypographyHierarchy = (textElements: any[]): string[] => {
    return textElements.map((element) => {
      const weight = element.fontWeight || 400;
      const size = parseFloat(element.fontSize || '16');
      
      if (weight >= 700 && size >= 24) return 'primary-heading';
      if (weight >= 600 && size >= 20) return 'secondary-heading';
      if (weight >= 500 && size >= 18) return 'tertiary-heading';
      if (size >= 16) return 'body-text';
      return 'small-text';
    });
  };

  const analyzeColorPalette = (colors: any[]): any[] => {
    const uniqueColors = Array.from(new Set(colors.map(c => c.color)));
    return uniqueColors.map(color => ({
      value: color,
      usage: colors.filter(c => c.color === color).map(c => c.usage),
      frequency: colors.filter(c => c.color === color).length,
      elements: colors.filter(c => c.color === color).map(c => c.element)
    }));
  };

  const generateSemanticTypographyMapping = (textElements: any[]): Record<string, string> => {
    const mapping: Record<string, string> = {};
    textElements.forEach((element, index) => {
      const key = element.content.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const hierarchy = analyzeTypographyHierarchy([element])[0];
      mapping[key] = hierarchy;
    });
    return mapping;
  };

  const getTypographyAccessibilityNotes = (textElements: any[]): string[] => {
    const notes: string[] = [];
    const sizes = textElements.map(el => parseFloat(el.fontSize || '16'));
    
    if (sizes.some(size => size < 14)) {
      notes.push('Some text sizes are below 14px - consider accessibility implications');
    }
    
    if (textElements.some(el => el.fontWeight && el.fontWeight < 300)) {
      notes.push('Very light font weights may have poor readability');
    }
    
    notes.push('Ensure sufficient color contrast ratios');
    notes.push('Test with screen readers and zoom up to 200%');
    
    return notes;
  };

  const analyzeColorUsage = (colors: any[]): Record<string, number> => {
    const usage: Record<string, number> = {};
    colors.forEach(color => {
      // Handle both original color objects (single usage string) and palette objects (usage array)
      if (Array.isArray(color.usage)) {
        color.usage.forEach((use: string) => {
          usage[use] = (usage[use] || 0) + 1;
        });
      } else if (color.usage) {
        usage[color.usage] = (usage[color.usage] || 0) + 1;
      }
    });
    return usage;
  };

  const analyzeColorRelationships = (palette: any[]): any => {
    return {
      dominantColor: palette.reduce((prev, current) => 
        prev.frequency > current.frequency ? prev : current
      )?.value,
      colorCount: palette.length,
      hasNeutrals: palette.some(color => 
        color.value.includes('255, 255, 255') || 
        color.value.includes('0, 0, 0') ||
        color.value.includes('128, 128, 128')
      ),
      hasAccents: palette.some(color => 
        !color.value.includes('255, 255, 255') && 
        !color.value.includes('0, 0, 0') &&
        color.frequency < 3
      )
    };
  };

  const checkColorAccessibility = (colors: any[]): any => {
    return {
      needsContrastCheck: true,
      recommendations: [
        'Verify WCAG AA contrast ratios (4.5:1 for normal text)',
        'Test with color blindness simulators',
        'Ensure color is not the only means of conveying information'
      ]
    };
  };

  const detectLayoutPattern = (data: any, children: any[]): string => {
    if (!children.length) return 'single-element';
    if (data.layout?.direction === 'vertical') return 'vertical-stack';
    if (data.layout?.direction === 'horizontal') return 'horizontal-stack';
    if (children.some((child: any) => child.position)) return 'positioned-layout';
    return 'flow-layout';
  };

  const calculateNestingDepth = (children: any[]): number => {
    if (!children.length) return 0;
    return 1 + Math.max(...children.map((child: any) => 
      child.children ? calculateNestingDepth(child.children) : 0
    ));
  };

  const extractSpacingValues = (data: any, children: any[]): number[] => {
    const values: number[] = [];
    
    if (data.layout?.gap) values.push(parseFloat(data.layout.gap));
    if (data.layout?.padding) {
      Object.values(data.layout.padding).forEach((val: any) => {
        if (typeof val === 'string') values.push(parseFloat(val));
      });
    }
    
    return Array.from(new Set(values)).filter(Boolean);
  };

  const extractBorderRadiusValues = (data: any, children: any[]): number[] => {
    const values: number[] = [];
    
    const extractFromElement = (element: any): void => {
      if (element.visuals?.borderRadius?.uniform) {
        values.push(element.visuals.borderRadius.uniform);
      }
    };
    
    extractFromElement(data);
    children.forEach(extractFromElement);
    
    return Array.from(new Set(values)).filter(Boolean);
  };

  const generateSpacingTokens = (values: number[]): Record<string, string> => {
    const tokens: Record<string, string> = {};
    values.forEach((value, index) => {
      tokens[`spacing-${index + 1}`] = `${value}px`;
    });
    return tokens;
  };

  const generateBorderRadiusTokens = (values: number[]): Record<string, string> => {
    const tokens: Record<string, string> = {};
    values.forEach((value, index) => {
      tokens[`radius-${index + 1}`] = `${value}px`;
    });
    return tokens;
  };

  const generateColorTokens = (palette: any[]): Record<string, string> => {
    const tokens: Record<string, string> = {};
    
    palette.forEach((color, index) => {
      const usages = color.usage;
      if (usages.includes('background')) tokens[`color-bg-${index + 1}`] = color.value;
      if (usages.includes('text')) tokens[`color-text-${index + 1}`] = color.value;
      if (usages.includes('border')) tokens[`color-border-${index + 1}`] = color.value;
    });
    
    return tokens;
  };

  const generateTypographyTokens = (textElements: any[]): Record<string, string> => {
    const tokens: Record<string, string> = {};
    const uniqueSizes = Array.from(new Set(textElements.map(el => el.fontSize))).filter(Boolean);
    const uniqueWeights = Array.from(new Set(textElements.map(el => el.fontWeight))).filter(Boolean);
    
    uniqueSizes.forEach((size, index) => {
      tokens[`font-size-${index + 1}`] = size;
    });
    
    uniqueWeights.forEach((weight, index) => {
      tokens[`font-weight-${index + 1}`] = weight.toString();
    });
    
    return tokens;
  };

  const generateShadowTokens = (data: any, children: any[]): Record<string, string> => {
    return {}; // Placeholder for shadow token generation
  };

  const generateBreakpointTokens = (data: any): Record<string, string> => {
    const width = data.size?.width || 400;
    return {
      'mobile': '320px',
      'tablet': '768px',
      'desktop': '1024px',
      'component-width': `${width}px`
    };
  };

  const getSystemDependencies = (data: any, children: any[]): string[] => {
    const deps: string[] = [];
    const pattern = detectComponentPattern(data);
    
    if (pattern === 'notification') deps.push('notification-system');
    if (children.length > 3) deps.push('layout-system');
    if (data.responsive) deps.push('responsive-system');
    
    return deps;
  };

  const suggestComponentVariants = (data: any, children: any[]): string[] => {
    const variants: string[] = [];
    const pattern = detectComponentPattern(data);
    
    if (pattern === 'notification') {
      variants.push('success', 'warning', 'error', 'info');
    }
    
    if (data.size) {
      variants.push('small', 'medium', 'large');
    }
    
    return variants;
  };

  // Note: renderBlueprintTrace is already defined above

  return (
    <div style={{
      width: '240px',
      height: '140px',
      backgroundColor: 'var(--figma-color-bg)',
      display: 'flex',
      flexDirection: 'column',
      fontSize: '11px',
      fontFamily: 'Inter, sans-serif',
      overflow: 'auto',
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      {/* CSS Animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>


      {/* Export Section */}
      {selectedNode ? (
        <div style={{
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flex: 1,
          minHeight: 0,
          overflow: 'auto'
        }}>
          {/* Real-time Export Button */}
          <button
            onClick={() => {
              emit('real-time-export');
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              fontSize: '12px',
              fontWeight: '600',
              border: '2px solid var(--figma-color-bg-brand)',
              borderRadius: '6px',
              backgroundColor: 'var(--figma-color-bg-brand)',
              color: 'var(--figma-color-text-onbrand)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--figma-color-bg-brand-hover)';
              e.currentTarget.style.borderColor = 'var(--figma-color-bg-brand-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--figma-color-bg-brand)';
              e.currentTarget.style.borderColor = 'var(--figma-color-bg-brand)';
            }}
          >
            {/* <span style={{ fontSize: '14px' }}>⚡</span> */}
            Bridge
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            margin: '2px 0',
            flexShrink: 0
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--figma-color-border)' }} />
            <span style={{ fontSize: '9px', color: 'var(--figma-color-text-secondary)' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--figma-color-border)' }} />
          </div>

          {/* Format Export Options */}
          <div style={{
            display: 'flex',
            gap: '8px',
            flexShrink: 0
          }}>
            {(['json', 'yaml'] as const).map((format) => (
              <button
                key={format}
                onClick={() => {
                  setExportFormat(format);
                  handleExport(format);
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontWeight: '500',
                  border: '1px solid var(--figma-color-border)',
                  borderRadius: '5px',
                  backgroundColor: 'var(--figma-color-bg)',
                  color: 'var(--figma-color-text)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.15s ease',
                  minWidth: 0,
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--figma-color-bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--figma-color-bg)';
                }}
              >
                {format}
              </button>
            ))}
          </div>


        </div>
      ) : isProcessing ? (
        <div style={{
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--figma-color-text)',
          fontSize: '11px',
          textAlign: 'center',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* Animated loading spinner */}
          <div style={{
            width: '24px',
            height: '24px',
            border: '2px solid var(--figma-color-border)',
            borderTop: '2px solid var(--figma-color-bg-brand)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '12px'
          }} />
          <div style={{ fontWeight: '500', marginBottom: '4px' }}>Processing...</div>
          <div style={{ fontSize: '10px', opacity: 0.7, maxWidth: '180px', lineHeight: '1.3' }}>
            {processingStatus || 'Extracting design data...'}
          </div>
        </div>
      ) : (
        <div style={{
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--figma-color-text-secondary)',
          fontSize: '11px',
          textAlign: 'center',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.6 }}>🎨</div>
          <div style={{ fontWeight: '500', marginBottom: '4px' }}>Select a component</div>
          <div style={{ fontSize: '10px', opacity: 0.7 }}>to export design data</div>
        </div>
      )}

      {/* Enhanced Element Hover Tooltip */}
      {hoveredElementInfo && (
        <div style={{
          position: 'absolute',
          left: Math.max(8, Math.min(hoveredElementInfo.x + 15, 240 - 280 - 8)),
          top: Math.max(8, Math.min(hoveredElementInfo.y + 15, 100 - 160 - 8)),
          backgroundColor: 'var(--figma-color-bg)',
          border: '1px solid var(--figma-color-border)',
          borderRadius: '6px',
          padding: '8px 10px',
          fontSize: '10px',
          color: 'var(--figma-color-text)',
          zIndex: 1000,
          pointerEvents: 'none',
          minWidth: '200px',
          maxWidth: '280px',
          maxHeight: '160px',
          overflow: 'hidden'
        }}>
          {/* Component Header */}
          <div style={{ 
            fontWeight: '600', 
            marginBottom: '6px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '2px',
              backgroundColor: hoveredElementInfo.element.semantic?.role === 'button' 
                ? 'var(--figma-color-bg-brand)' 
                : hoveredElementInfo.element.typography?.textContent
                ? '#10b981'
                : '#6b7280',
              flexShrink: 0
            }} />
            {hoveredElementInfo.element.component}
          </div>

          {/* Size */}
          <div style={{ 
            color: 'var(--figma-color-text-secondary)',
            marginBottom: '6px',
            fontSize: '9px'
          }}>
            {Math.round(hoveredElementInfo.element.size?.width || 0)} × {Math.round(hoveredElementInfo.element.size?.height || 0)}px
          </div>

          {/* Colors & Visuals */}
          {hoveredElementInfo.element.visuals && (
            <div style={{ marginBottom: '6px' }}>
              {/* Fill Colors */}
              {hoveredElementInfo.element.visuals.fills && hoveredElementInfo.element.visuals.fills.length > 0 && (
                <div style={{ marginBottom: '4px' }}>
                  <div style={{ fontSize: '9px', color: 'var(--figma-color-text-secondary)', marginBottom: '2px' }}>
                    Fill:
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {hoveredElementInfo.element.visuals.fills.slice(0, 3).map((fill: any, index: number) => {
                      if (fill.type === 'SOLID' && fill.color) {
                        const { r, g, b } = fill.color;
                        // Ensure valid color values and handle NaN
                        const rVal = Math.round((r || 0) * 255);
                        const gVal = Math.round((g || 0) * 255);
                        const bVal = Math.round((b || 0) * 255);
                        const hex = `#${rVal.toString(16).padStart(2, '0')}${gVal.toString(16).padStart(2, '0')}${bVal.toString(16).padStart(2, '0')}`;
                        return (
                          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <div style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '2px',
                              backgroundColor: `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`,
                              border: '1px solid var(--figma-color-border)',
                              flexShrink: 0
                            }} />
                            <span style={{ fontSize: '8px', fontFamily: 'Monaco, monospace' }}>
                              {hex.toUpperCase()}
                            </span>
                          </div>
                        );
                      } else if (fill.type === 'GRADIENT_LINEAR' && fill.gradientStops) {
                        return (
                          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <div style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '2px',
                              background: `linear-gradient(90deg, ${fill.gradientStops.map((stop: any) => {
                                const { r, g, b } = stop.color;
                                const rVal = Math.round((r || 0) * 255);
                                const gVal = Math.round((g || 0) * 255);
                                const bVal = Math.round((b || 0) * 255);
                                return `rgb(${rVal}, ${gVal}, ${bVal}) ${Math.round((stop.position || 0) * 100)}%`;
                              }).join(', ')})`,
                              border: '1px solid var(--figma-color-border)',
                              flexShrink: 0
                            }} />
                            <span style={{ fontSize: '8px' }}>Gradient</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}

              {/* Stroke Colors */}
              {hoveredElementInfo.element.visuals.strokes && hoveredElementInfo.element.visuals.strokes.length > 0 && (
                <div style={{ marginBottom: '4px' }}>
                  <div style={{ fontSize: '9px', color: 'var(--figma-color-text-secondary)', marginBottom: '2px' }}>
                    Stroke:
                  </div>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {hoveredElementInfo.element.visuals.strokes.slice(0, 2).map((stroke: any, index: number) => {
                      if (stroke.color) {
                        const { r, g, b } = stroke.color;
                        // Ensure valid color values and handle NaN
                        const rVal = Math.round((r || 0) * 255);
                        const gVal = Math.round((g || 0) * 255);
                        const bVal = Math.round((b || 0) * 255);
                        const hex = `#${rVal.toString(16).padStart(2, '0')}${gVal.toString(16).padStart(2, '0')}${bVal.toString(16).padStart(2, '0')}`;
                        return (
                          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <div style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '2px',
                              backgroundColor: `rgb(${rVal}, ${gVal}, ${bVal})`,
                              border: '1px solid var(--figma-color-border)',
                              flexShrink: 0
                            }} />
                            <span style={{ fontSize: '8px', fontFamily: 'Monaco, monospace' }}>
                              {hex.toUpperCase()}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })}
                    {hoveredElementInfo.element.visuals.strokeWeight && (
                      <span style={{ fontSize: '8px', color: 'var(--figma-color-text-secondary)' }}>
                        {hoveredElementInfo.element.visuals.strokeWeight}px
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Border Radius */}
              {hoveredElementInfo.element.visuals.borderRadius && hoveredElementInfo.element.visuals.borderRadius > 0 && (
                <div style={{ fontSize: '8px', color: 'var(--figma-color-text-secondary)', marginBottom: '4px' }}>
                  Radius: {hoveredElementInfo.element.visuals.borderRadius}px
                </div>
              )}
            </div>
          )}

          {/* Typography - Only show if there's actual text content */}
          {hoveredElementInfo.element.typography?.textContent && (
            <div style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '9px', color: 'var(--figma-color-text-secondary)', marginBottom: '2px' }}>
                Text:
              </div>
              <div style={{ fontSize: '8px', lineHeight: '1.3' }}>
                {hoveredElementInfo.element.typography.font && (
                  <div style={{ marginBottom: '2px', color: 'var(--figma-color-text-secondary)' }}>
                    {hoveredElementInfo.element.typography.font.fallback?.family || 'System'} • {hoveredElementInfo.element.typography.font.fallback?.size || 16}px • {hoveredElementInfo.element.typography.font.fallback?.weight || 400}
                  </div>
                )}
                <div style={{ 
                  fontStyle: 'italic',
                  color: 'var(--figma-color-text)',
                  background: 'var(--figma-color-bg-secondary)',
                  padding: '2px 4px',
                  borderRadius: '2px'
                }}>
                  "{hoveredElementInfo.element.typography.textContent.slice(0, 40)}{hoveredElementInfo.element.typography.textContent.length > 40 ? '...' : ''}"
                </div>
              </div>
            </div>
          )}

                    {/* Interactive States - Only show if interactive */}
          {hoveredElementInfo.element.interactivity?.onClick && (
            <div style={{ marginBottom: '6px' }}>
              <span style={{ 
                background: 'var(--figma-color-bg-brand)',
                color: 'var(--figma-color-text-onbrand)',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '8px',
                fontWeight: '500'
              }}>
                Interactive
              </span>
            </div>
          )}

                               {/* Layout Info - Only show if it's something other than basic block */}
          {hoveredElementInfo.element.layout && (
            hoveredElementInfo.element.layout.display === 'flex' || 
            hoveredElementInfo.element.layout.direction || 
            hoveredElementInfo.element.layout.gap
          ) && (
            <div style={{ fontSize: '8px', color: 'var(--figma-color-text-secondary)' }}>
              {hoveredElementInfo.element.layout.display || 'block'}
              {hoveredElementInfo.element.layout.direction && ` • ${hoveredElementInfo.element.layout.direction}`}
              {hoveredElementInfo.element.layout.gap && ` • ${hoveredElementInfo.element.layout.gap} gap`}
            </div>
          )}
        </div>
      )}

      {/* Selection Troubleshooting */}
      {selectionIssue && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--figma-color-bg)',
          border: '1px solid var(--figma-color-border)',
          borderRadius: '8px',
          padding: '16px',
          maxWidth: '300px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000
        }}>
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
              🔧 Selection Troubleshooting
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--figma-color-text-secondary)' }}>
              Having trouble selecting variants, groups, or complex components?
            </p>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: '600' }}>Try these solutions:</h4>
            <ul style={{ margin: '0', paddingLeft: '16px', fontSize: '11px', lineHeight: '1.4' }}>
              <li>Use the <strong>Layers panel</strong> (⌘+Y) to select from hierarchy</li>
              <li>Double-click to enter edit mode, then exit</li>
              <li>Right-click and select from context menu</li>
              <li>Try the <strong>Move tool</strong> (V) and click on component</li>
              <li>Select parent frame first, then drill down</li>
            </ul>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleForceRefresh}
              style={{
                background: 'var(--figma-color-bg-brand)',
                color: 'var(--figma-color-text-onbrand)',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              🔄 Force Refresh
            </button>
            <button
              onClick={() => {
                parent.postMessage({ pluginMessage: { type: 'select-parent-component' } }, '*');
              }}
              style={{
                background: 'var(--figma-color-bg-accent)',
                color: 'var(--figma-color-text-onaccent)',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              🔍 Find Parent
            </button>
            <button
              onClick={() => {
                parent.postMessage({ pluginMessage: { type: 'debug-selection' } }, '*');
              }}
              style={{
                background: 'var(--figma-color-bg-secondary)',
                color: 'var(--figma-color-text)',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              🐛 Debug
            </button>
            <button
              onClick={() => setSelectionIssue(false)}
              style={{
                background: 'var(--figma-color-bg-secondary)',
                color: 'var(--figma-color-text)',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <DesignBlueprintExporter />
    </ErrorBoundary>
  );
}

export default render(App);

