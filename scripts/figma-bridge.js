#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const PORT = process.env.FIGMA_BRIDGE_PORT || 8473;
const EXPORT_DIR = path.join(os.homedir(), '.figma-exports');
const TOKENS_FILE = path.join(EXPORT_DIR, 'tokens.json');
const LATEST_EXPORT_FILE = path.join(EXPORT_DIR, 'latest-figment.json');

// Ensure export directory exists
function ensureExportDirectory() {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
    console.log(`📁 Export dir: ${EXPORT_DIR}`);
  }
}

// Generate unique token
function generateToken() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `figma_${timestamp}_${random}`;
}

// Clean up old debug logs (older than 24 hours)
function cleanupOldDebugLogs() {
  try {
    const files = fs.readdirSync(EXPORT_DIR);
    const debugFiles = files.filter(file => file.startsWith('token-') && file.endsWith('-debug.json'));
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    debugFiles.forEach(file => {
      const filePath = path.join(EXPORT_DIR, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Cleaned: ${file}`);
      }
    });
  } catch (error) {
    // Silently ignore cleanup errors
  }
}

// Save token mapping
function saveTokenMapping(token, componentData) {
  try {
    ensureExportDirectory();
    let tokens = {};
    
    if (fs.existsSync(TOKENS_FILE)) {
      tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
    }
    
    tokens[token] = {
      component: componentData,
      created: new Date().toISOString(),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
    console.log(`💾 Token: ${token}`);
    
    // Create a temporary debug log file with complete token data
    const debugLogFile = path.join(EXPORT_DIR, `token-${token}-debug.json`);
    
    // Enhanced metadata with Figma-specific context
    const enhancedMetadata = {
      hasEnhancedVisuals: !!componentData.enhancedVisuals,
      hasChildren: !!(componentData.children && componentData.children.length > 0),
      componentName: componentData.component || componentData.name || 'Unknown',
      componentType: componentData.suggestedComponentType || 'component',
      dataKeys: Object.keys(componentData),
      enhancedVisualsKeys: componentData.enhancedVisuals ? Object.keys(componentData.enhancedVisuals) : [],
      childrenCount: componentData.children ? componentData.children.length : 0,
      size: componentData.size,
      position: componentData.position,
      precisePosition: componentData.precisePosition,
      layout: componentData.layout,
      
      // NEW: Figma-specific metadata
      figmaMetadata: {
        componentId: componentData.id || componentData.componentId,
        componentKey: componentData.key,
        isMainComponent: componentData.isMainComponent || false,
        isInstance: componentData.isInstance || false,
        variantProperties: componentData.variantProperties || {},
        componentProperties: componentData.componentProperties || {},
        mainComponent: componentData.mainComponent || null
      },
      
      // NEW: Interaction states detection
      interactionStates: {
        hasHoverState: componentData.semantic?.hasHoverState || false,
        hasClickHandler: componentData.semantic?.hasClickHandler || false,
        isInteractive: componentData.semantic?.isInteractive || false,
        hasInteractions: componentData.semantic?.hasInteractions || false
      },
      
      // NEW: Accessibility context
      accessibility: {
        role: componentData.semantic?.role || 'div',
        isContainer: componentData.semantic?.isContainer || false,
        isReusable: componentData.semantic?.isReusable || false,
        isResponsive: componentData.semantic?.isResponsive || false
      },
      
      // NEW: Design system integration
      designSystem: {
        hasDesignTokens: !!(componentData.designTokens),
        designTokensKeys: componentData.designTokens ? Object.keys(componentData.designTokens) : [],
        hasLinting: !!(componentData.linting && componentData.linting.length > 0),
        lintingWarnings: componentData.lintingWarnings ? componentData.lintingWarnings.length : 0,
        nonTokenValues: componentData.nonTokenValues || []
      }
    };
    
    const debugData = {
      token: token,
      timestamp: new Date().toISOString(),
      completeComponentData: componentData,
      metadata: enhancedMetadata,
      figmentContext: {
        hasDesignSystem: !!(componentData.designTokens),
        designTokensKeys: componentData.designTokens ? Object.keys(componentData.designTokens) : [],
        hasContext: !!(componentData.designContext),
        contextKeys: componentData.designContext ? Object.keys(componentData.designContext) : []
      }
    };
    
    fs.writeFileSync(debugLogFile, JSON.stringify(debugData, null, 2));
    console.log(`📝 Debug: ${path.basename(debugLogFile)}`);
    console.log(`🔍 Component: ${debugData.metadata.componentName} (${debugData.metadata.componentType})`);
    
  } catch (error) {
    console.error('❌ Error saving token mapping:', error);
  }
}

  // Save figment export
  function saveFigmentExport(figmentData) {
  try {
    ensureExportDirectory();
    fs.writeFileSync(LATEST_EXPORT_FILE, JSON.stringify(figmentData, null, 2));
    console.log(`💾 Figment: ${path.basename(LATEST_EXPORT_FILE)}`);
    return true;
  } catch (error) {
    console.error('❌ Error saving figment export:', error);
    return false;
  }
}

// Save real-time export
function saveRealTimeExport(exportData) {
  try {
    ensureExportDirectory();
    const realTimeFile = path.join(EXPORT_DIR, 'real-time-export.json');
    fs.writeFileSync(realTimeFile, JSON.stringify(exportData, null, 2));
    console.log(`💾 Real-time: ${path.basename(realTimeFile)}`);
    return true;
  } catch (error) {
    console.error('❌ Error saving real-time export:', error);
    return false;
  }
}

// Parse JSON from request body
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    if (req.method === 'POST') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      
      if (url.pathname === '/export') {
              console.log('📤 Export request');
      const data = await parseRequestBody(req);
      console.log('📦 Type:', data.type);
        
          if (data.type === 'figment') {
    const success = saveFigmentExport(data.figment);
          if (success) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              success: true, 
              message: 'Figment export saved successfully',
              file: LATEST_EXPORT_FILE
            }));
          } else {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              success: false, 
              error: 'Failed to save figment export' 
            }));
          }
        } else if (data.type === 'real-time') {
          // Use token from Figma plugin or generate one if not provided
          const token = data.token || generateToken();
          console.log('🎫 Token:', token, data.token ? '(provided)' : '(generated)');
          const exportData = {
            figment: data.figment,
            token: token,
            exportedAt: new Date().toISOString()
          };
          
                      const success = saveRealTimeExport(exportData);
            if (success) {
              console.log('💾 Mapping token:', token);
            
            // Extract the specific component that was exported
            let componentData = null;
            if (data.figment && data.figment.components && data.figment.components.length > 0) {
              // If there's a specific component ID in the data, find it
              if (data.componentId) {
                componentData = data.figment.components.find(comp => 
                  comp.id === data.componentId || 
                  comp.component === data.componentId ||
                  comp.cleanName === data.componentId
                );
              }
              
              // If no specific component found, use the first one
              if (!componentData) {
                componentData = data.figment.components[0];
              }
              
              console.log('🔍 Component:', componentData.component || componentData.cleanName, '| ID:', componentData.id || 'none');
            }
            
            // Ensure the component data has the token as its ID for proper matching
            if (componentData) {
              componentData.id = token;
              componentData.tokenId = token;
            }
            
            // Log the final component data after ID assignment
            if (componentData) {
              console.log('🔍 Final:', componentData.component || componentData.cleanName, '| ID:', componentData.id);
            }
            
                  // Save the specific component data, not the entire figment
      saveTokenMapping(token, componentData || data.figment);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              success: true, 
              token: token,
              message: 'Real-time export saved successfully',
              file: path.join(EXPORT_DIR, 'real-time-export.json')
            }));
          } else {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              success: false, 
              error: 'Failed to save real-time export' 
            }));
          }
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            error: 'Invalid export type. Use "figment" or "real-time"' 
          }));
        }
      } else if (url.pathname.startsWith('/debug/')) {
        // Debug endpoint to view token data
        const token = url.pathname.replace('/debug/', '');
        const debugFile = path.join(EXPORT_DIR, `token-${token}-debug.json`);
        
        if (fs.existsSync(debugFile)) {
          const debugData = JSON.parse(fs.readFileSync(debugFile, 'utf8'));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(debugData, null, 2));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            error: `Debug data not found for token: ${token}` 
          }));
        }
      } else if (url.pathname === '/health') {
        // Get list of available debug logs
        let debugLogs = [];
        try {
          const files = fs.readdirSync(EXPORT_DIR);
          debugLogs = files
            .filter(file => file.startsWith('token-') && file.endsWith('-debug.json'))
            .map(file => {
              const filePath = path.join(EXPORT_DIR, file);
              const stats = fs.statSync(filePath);
              return {
                file: file,
                token: file.replace('token-', '').replace('-debug.json', ''),
                created: stats.mtime.toISOString(),
                size: stats.size
              };
            })
            .sort((a, b) => new Date(b.created) - new Date(a.created))
            .slice(0, 5); // Show only the 5 most recent
        } catch (error) {
          // Ignore errors
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'healthy',
          port: PORT,
          exportDir: EXPORT_DIR,
          timestamp: new Date().toISOString(),
          debugLogs: debugLogs
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Endpoint not found' 
        }));
      }
    } else if (req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      
      if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'healthy',
          port: PORT,
          exportDir: EXPORT_DIR,
          timestamp: new Date().toISOString()
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Endpoint not found' 
        }));
      }
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        error: 'Method not allowed' 
      }));
    }
  } catch (error) {
    console.error('❌ Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }));
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Bridge server: http://localhost:${PORT}`);
  console.log(`📁 Export dir: ${EXPORT_DIR}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`📤 Export: http://localhost:${PORT}/export`);
  console.log(`🔍 Debug: http://localhost:${PORT}/debug/{TOKEN}`);
  console.log('');
  console.log('💡 Usage:');
  console.log('• Keep server running');
  console.log('• Export from Figma plugin');
  console.log('• MCP server auto-detects exports');
  console.log('');
  
  // Clean up old debug logs on startup
  cleanupOldDebugLogs();
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bridge server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down bridge server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
