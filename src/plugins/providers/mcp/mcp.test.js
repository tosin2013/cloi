#!/usr/bin/env node
/**
 * Test suite for MCPProvider
 */

// Simple test framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 Running MCP Provider Tests...\n');
    
    for (const { name, fn } of this.tests) {
      try {
        console.log(`Testing: ${name}`);
        await fn();
        console.log(`✅ ${name} - PASSED\n`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name} - FAILED`);
        console.log(`   Error: ${error.message}\n`);
        this.failed++;
      }
    }

    console.log('📊 Test Results:');
    console.log(`   Passed: ${this.passed}`);
    console.log(`   Failed: ${this.failed}`);
    console.log(`   Total:  ${this.tests.length}`);

    if (this.failed > 0) {
      process.exit(1);
    } else {
      console.log('\n🎉 All MCP provider tests passed!');
    }
  }
}

const runner = new TestRunner();

// Test: MCP Provider Imports
runner.test('MCP provider module imports', async () => {
  console.log('   Importing MCP provider...');
  
  const MCPProvider = (await import('./index.js')).default;
  
  if (!MCPProvider) {
    throw new Error('Failed to import MCP provider');
  }
  
  console.log('   ✅ MCP provider imported successfully');
});

// Test: MCP Provider Initialization
runner.test('MCP provider initialization', async () => {
  const MCPProvider = (await import('./index.js')).default;
  
  const mockManifest = { name: 'mcp', version: '1.0.0' };
  const mockConfig = {
    servers: {
      'test-server': {
        command: 'echo',
        args: ['test'],
        enabled: true
      }
    }
  };
  
  const provider = new MCPProvider(mockManifest, mockConfig);
  
  if (!provider.name || provider.name !== 'mcp') {
    throw new Error('Provider initialization failed');
  }
  
  if (provider.servers.size === 0) {
    throw new Error('No servers loaded during initialization');
  }
  
  console.log('   ✅ Provider initialized correctly');
  console.log(`   Loaded ${provider.servers.size} server configurations`);
});

// Test: Availability Check
runner.test('MCP provider availability check', async () => {
  const MCPProvider = (await import('./index.js')).default;
  
  const mockManifest = { name: 'mcp', version: '1.0.0' };
  const mockConfig = {
    servers: {
      'test-server': {
        command: 'node',
        args: ['-e', 'console.log("test")'],
        enabled: true
      }
    }
  };
  
  const provider = new MCPProvider(mockManifest, mockConfig);
  
  const available = await provider.isAvailable();
  if (!available) {
    throw new Error('Provider should be available when servers are configured');
  }
  
  console.log('   ✅ Availability check working correctly');
});

// Test: Server Configuration Loading
runner.test('Server configuration loading', async () => {
  const MCPProvider = (await import('./index.js')).default;
  
  const mockManifest = { name: 'mcp', version: '1.0.0' };
  const mockConfig = {
    servers: {
      'server1': {
        command: 'node',
        args: ['script1.js'],
        enabled: true,
        description: 'Test server 1'
      },
      'server2': {
        command: 'python',
        args: ['script2.py'],
        enabled: false,
        description: 'Test server 2'
      },
      'server3': {
        command: 'node',
        args: ['script3.js'],
        enabled: true,
        description: 'Test server 3'
      }
    }
  };
  
  const provider = new MCPProvider(mockManifest, mockConfig);
  
  // Should load enabled servers + default cloi-mcp-server
  const expectedEnabledServers = 3; // server1, server3, cloi-mcp-server
  if (provider.servers.size !== expectedEnabledServers) {
    throw new Error(`Expected ${expectedEnabledServers} enabled servers, got ${provider.servers.size}`);
  }
  
  // Check specific servers
  if (!provider.servers.has('server1')) {
    throw new Error('server1 should be loaded');
  }
  
  if (provider.servers.has('server2')) {
    throw new Error('server2 should not be loaded (disabled)');
  }
  
  if (!provider.servers.has('server3')) {
    throw new Error('server3 should be loaded');
  }
  
  console.log('   ✅ Server configuration loading working correctly');
  console.log(`   Loaded servers: ${Array.from(provider.servers.keys()).join(', ')}`);
});

// Test: Supported Models
runner.test('Supported models enumeration', async () => {
  const MCPProvider = (await import('./index.js')).default;
  
  const mockManifest = { name: 'mcp', version: '1.0.0' };
  const mockConfig = {};
  
  const provider = new MCPProvider(mockManifest, mockConfig);
  
  const models = provider.getSupportedModels();
  if (!Array.isArray(models) || models.length === 0) {
    throw new Error('getSupportedModels should return a non-empty array');
  }
  
  if (!models.includes('mcp-default')) {
    throw new Error('Should include mcp-default model');
  }
  
  console.log('   ✅ Supported models enumeration working');
  console.log(`   Available models: ${models.join(', ')}`);
});

// Test: Capabilities
runner.test('Provider capabilities', async () => {
  const MCPProvider = (await import('./index.js')).default;
  
  const mockManifest = { name: 'mcp', version: '1.0.0' };
  const mockConfig = {};
  
  const provider = new MCPProvider(mockManifest, mockConfig);
  
  const capabilities = provider.getCapabilities();
  
  if (!capabilities || typeof capabilities !== 'object') {
    throw new Error('getCapabilities should return an object');
  }
  
  const expectedCapabilities = ['functionCalling', 'tools', 'resources', 'multiServer'];
  for (const cap of expectedCapabilities) {
    if (!(cap in capabilities)) {
      throw new Error(`Missing expected capability: ${cap}`);
    }
  }
  
  console.log('   ✅ Provider capabilities correct');
  console.log(`   Capabilities: ${Object.keys(capabilities).join(', ')}`);
});

// Test: Server Status
runner.test('Server status tracking', async () => {
  const MCPProvider = (await import('./index.js')).default;
  
  const mockManifest = { name: 'mcp', version: '1.0.0' };
  const mockConfig = {
    servers: {
      'test-server': {
        command: 'node',
        args: ['-v'],
        enabled: true,
        description: 'Test server'
      }
    }
  };
  
  const provider = new MCPProvider(mockManifest, mockConfig);
  
  const status = provider.getServerStatus();
  
  if (!status || typeof status !== 'object') {
    throw new Error('getServerStatus should return an object');
  }
  
  if (!status['test-server']) {
    throw new Error('test-server should be in status');
  }
  
  const serverStatus = status['test-server'];
  if (serverStatus.status !== 'disconnected') {
    throw new Error('Server should initially be disconnected');
  }
  
  console.log('   ✅ Server status tracking working');
  console.log(`   Tracked servers: ${Object.keys(status).join(', ')}`);
});

// Test: Tool Selection Logic
runner.test('Tool selection logic', async () => {
  const MCPProvider = (await import('./index.js')).default;
  
  const mockManifest = { name: 'mcp', version: '1.0.0' };
  const mockConfig = {};
  
  const provider = new MCPProvider(mockManifest, mockConfig);
  
  const mockTools = [
    { name: 'analyze_cloi_module', description: 'Analyze module' },
    { name: 'generate_test_scenarios', description: 'Generate tests' },
    { name: 'github_cli_command', description: 'GitHub CLI' }
  ];
  
  // Test analysis prompt
  const analysisTool = provider.selectToolForPrompt('analyze the error in core module', mockTools);
  if (!analysisTool || analysisTool.name !== 'analyze_cloi_module') {
    throw new Error('Should select analysis tool for analysis prompt');
  }
  
  // Test generation prompt
  const generationTool = provider.selectToolForPrompt('generate test cases for feature', mockTools);
  if (!generationTool || generationTool.name !== 'generate_test_scenarios') {
    throw new Error('Should select generation tool for generation prompt');
  }
  
  // Test GitHub prompt
  const githubTool = provider.selectToolForPrompt('create GitHub issue', mockTools);
  if (!githubTool || githubTool.name !== 'github_cli_command') {
    throw new Error('Should select GitHub tool for GitHub prompt');
  }
  
  console.log('   ✅ Tool selection logic working correctly');
});

// Test: Event Handling
runner.test('Event handling', async () => {
  const MCPProvider = (await import('./index.js')).default;
  
  const mockManifest = { name: 'mcp', version: '1.0.0' };
  const mockConfig = {};
  
  const provider = new MCPProvider(mockManifest, mockConfig);
  
  let eventFired = false;
  
  provider.on('test-event', (data) => {
    eventFired = true;
  });
  
  provider.eventEmitter.emit('test-event', { test: true });
  
  if (!eventFired) {
    throw new Error('Event should have been fired');
  }
  
  // Test removing listener
  const listener = () => {};
  provider.on('test-event-2', listener);
  provider.off('test-event-2', listener);
  
  console.log('   ✅ Event handling working correctly');
});

// Test: Cleanup
runner.test('Provider cleanup', async () => {
  const MCPProvider = (await import('./index.js')).default;
  
  const mockManifest = { name: 'mcp', version: '1.0.0' };
  const mockConfig = {};
  
  const provider = new MCPProvider(mockManifest, mockConfig);
  
  // Add some listeners
  provider.on('test-event', () => {});
  provider.on('another-event', () => {});
  
  // Cleanup
  await provider.destroy();
  
  // Check that event emitter is cleaned up
  if (provider.eventEmitter.listenerCount() > 0) {
    throw new Error('Event listeners should be removed during cleanup');
  }
  
  console.log('   ✅ Provider cleanup working correctly');
});

// Run all tests
console.log('🚀 Starting MCP Provider Tests...\n');

// Add environment info
console.log('Environment Info:');
console.log(`   Node.js: ${process.version}`);
console.log(`   Platform: ${process.platform}`);
console.log(`   Working Directory: ${process.cwd()}`);
console.log('');

runner.run().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});