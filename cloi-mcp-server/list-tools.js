#!/usr/bin/env node

/**
 * List all available MCP tools
 */

import { spawn } from 'child_process';

console.log('📋 Listing all available MCP tools...\n');

const server = spawn('node', ['src/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Send list tools request
const listRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/list",
  params: {}
};

server.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    try {
      const response = JSON.parse(line);
      
      if (response.result && response.result.tools) {
        console.log(`🛠️  Found ${response.result.tools.length} tools:\n`);
        
        response.result.tools.forEach((tool, index) => {
          console.log(`${index + 1}. ${tool.name}`);
          console.log(`   📝 ${tool.description}`);
          
          // Show some input parameters
          if (tool.inputSchema && tool.inputSchema.properties) {
            const params = Object.keys(tool.inputSchema.properties);
            if (params.length > 0) {
              console.log(`   🔧 Parameters: ${params.slice(0, 3).join(', ')}${params.length > 3 ? '...' : ''}`);
            }
          }
          console.log('');
        });
        
        console.log('✅ All tools are properly registered and available!');
        server.kill();
        process.exit(0);
      }
    } catch (e) {
      // Ignore non-JSON lines
    }
  }
});

server.stderr.on('data', (data) => {
  const message = data.toString().trim();
  if (message && message.includes('running')) {
    console.log('✅ Server started successfully');
  }
});

// Wait for server startup, then send request
setTimeout(() => {
  const request = JSON.stringify(listRequest) + '\n';
  server.stdin.write(request);
}, 1000);

// Timeout
setTimeout(() => {
  console.log('⏰ Timeout reached');
  server.kill();
  process.exit(1);
}, 10000);