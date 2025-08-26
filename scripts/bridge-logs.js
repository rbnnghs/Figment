#!/usr/bin/env node

const http = require('http');

console.log('🔍 Bridge Server Log Monitor');
console.log('============================');
console.log('');

// Function to fetch and display bridge status
async function checkBridgeStatus() {
  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:8473/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Timeout')));
    });

    console.log(`✅ Bridge Server Status: ${response.status}`);
    console.log(`📍 Port: ${response.port}`);
    console.log(`📁 Export Directory: ${response.exportDir}`);
    console.log(`🕐 Last Check: ${new Date().toISOString()}`);
    
    if (response.debugLogs && response.debugLogs.length > 0) {
      console.log('\n🎫 Recent Tokens:');
      response.debugLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. ${log.token} (${log.file})`);
        console.log(`     Created: ${log.created}`);
        console.log(`     Size: ${(log.size / 1024).toFixed(1)} KB`);
      });
    } else {
      console.log('\n📭 No recent tokens found');
    }
    
  } catch (error) {
    console.log('❌ Bridge server not responding');
    console.log('💡 Make sure to run: npm run bridge');
  }
  
  console.log('\n' + '='.repeat(50));
}

// Check status immediately
checkBridgeStatus();

// Then check every 5 seconds
setInterval(checkBridgeStatus, 5000);

console.log('💡 Press Ctrl+C to stop monitoring');
console.log('💡 Run "npm run bridge" in another terminal to start the bridge server');
