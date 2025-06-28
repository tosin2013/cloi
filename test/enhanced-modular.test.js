#!/usr/bin/env node
/**
 * Enhanced Modular Platform Tests
 * Run with: node test/enhanced-modular.test.js
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
    console.log('🧪 Running Enhanced Cloi Modular Platform Tests...\n');
    
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
      console.log('\n🎉 All enhanced modular tests passed!');
    }
  }
}

const runner = new TestRunner();

// Test: Core Module Imports
runner.test('Core modular module imports', async () => {
  console.log('   Importing core modular modules...');
  
  const { pluginManager, PLUGIN_TYPES } = await import('../src/core/plugin-manager/index.js');
  const { configManager } = await import('../src/core/config-manager/index.js');
  const { stateManager } = await import('../src/core/state-manager/index.js');
  const { coordinator } = await import('../src/core/coordinator/index.js');
  
  if (!pluginManager || !PLUGIN_TYPES) {
    throw new Error('Failed to import plugin manager');
  }
  if (!configManager) {
    throw new Error('Failed to import config manager');
  }
  if (!stateManager) {
    throw new Error('Failed to import state manager');
  }
  if (!coordinator) {
    throw new Error('Failed to import coordinator');
  }
  
  console.log('   ✅ All core modular modules imported successfully');
  console.log(`   Plugin types: ${Object.keys(PLUGIN_TYPES).join(', ')}`);
});

// Test: Plugin Manager
runner.test('Plugin manager functionality', async () => {
  const { pluginManager } = await import('../src/core/plugin-manager/index.js');
  
  console.log('   Testing plugin discovery...');
  await pluginManager.discoverPlugins();
  
  const plugins = pluginManager.listPlugins();
  console.log(`   Found ${plugins.length} plugins`);
  
  if (plugins.length === 0) {
    throw new Error('No plugins discovered - expected at least JavaScript analyzer and Claude provider');
  }
  
  // Check for expected plugins
  const hasJSAnalyzer = plugins.some(p => p.type === 'analyzers' && p.name === 'javascript');
  const hasClaudeProvider = plugins.some(p => p.type === 'providers' && p.name === 'claude');
  
  if (!hasJSAnalyzer) {
    throw new Error('JavaScript analyzer plugin not found');
  }
  if (!hasClaudeProvider) {
    throw new Error('Claude provider plugin not found');
  }
  
  console.log('   ✅ Plugin discovery working correctly');
});

// Test: Plugin Loading
runner.test('Plugin loading and validation', async () => {
  const { pluginManager } = await import('../src/core/plugin-manager/index.js');
  
  await pluginManager.discoverPlugins();
  
  console.log('   Loading JavaScript analyzer...');
  const jsAnalyzer = await pluginManager.loadPlugin('analyzers', 'javascript');
  
  // Validate interface
  const requiredMethods = ['analyze', 'supports', 'getPriority'];
  for (const method of requiredMethods) {
    if (typeof jsAnalyzer[method] !== 'function') {
      throw new Error(`JavaScript analyzer missing method: ${method}`);
    }
  }
  
  console.log('   Loading Claude provider...');
  const claudeProvider = await pluginManager.loadPlugin('providers', 'claude');
  
  const providerMethods = ['query', 'isAvailable', 'getSupportedModels'];
  for (const method of providerMethods) {
    if (typeof claudeProvider[method] !== 'function') {
      throw new Error(`Claude provider missing method: ${method}`);
    }
  }
  
  console.log('   ✅ Plugin loading and validation successful');
});

// Test: Configuration Manager
runner.test('Configuration manager functionality', async () => {
  const { configManager } = await import('../src/core/config-manager/index.js');
  
  console.log('   Loading configuration...');
  await configManager.load();
  
  const config = configManager.getAll();
  if (!config || typeof config !== 'object') {
    throw new Error('Configuration loading failed');
  }
  
  // Test configuration access
  const defaultProvider = configManager.get('providers.default', 'test');
  if (!defaultProvider) {
    throw new Error('Configuration access not working');
  }
  
  // Test configuration validation
  const validation = configManager.validate();
  if (!validation || typeof validation.valid !== 'boolean') {
    throw new Error('Configuration validation not working');
  }
  
  console.log('   ✅ Configuration manager working correctly');
  console.log(`   Default provider: ${defaultProvider}`);
  console.log(`   Config valid: ${validation.valid}`);
});

// Test: State Manager
runner.test('State manager functionality', async () => {
  const { stateManager } = await import('../src/core/state-manager/index.js');
  
  console.log('   Testing session management...');
  const session = await stateManager.startSession({
    test: true,
    environment: 'test'
  });
  
  if (!session || !session.id) {
    throw new Error('Session creation failed');
  }
  
  console.log('   Testing analysis recording...');
  const analysis = await stateManager.recordAnalysis({
    type: 'test-analysis',
    result: { success: true }
  });
  
  if (!analysis || !analysis.id) {
    throw new Error('Analysis recording failed');
  }
  
  console.log('   Testing fix recording...');
  const fix = await stateManager.recordFix({
    type: 'test-fix',
    description: 'Test fix for unit tests'
  });
  
  if (!fix || !fix.id) {
    throw new Error('Fix recording failed');
  }
  
  console.log('   Testing session end...');
  const summary = await stateManager.endSession();
  
  if (!summary || !summary.id) {
    throw new Error('Session end failed');
  }
  
  console.log('   ✅ State manager working correctly');
  console.log(`   Session duration: ${summary.duration}ms`);
});

// Test: Coordinator Integration
runner.test('Coordinator integration', async () => {
  const { coordinator } = await import('../src/core/coordinator/index.js');
  
  console.log('   Initializing coordinator...');
  await coordinator.initialize();
  
  const status = coordinator.getStatus();
  if (!status.initialized) {
    throw new Error('Coordinator initialization failed');
  }
  
  console.log('   Testing error analysis...');
  const analysis = await coordinator.analyzeError(
    'ReferenceError: testVariable is not defined',
    {
      files: ['test.js'],
      errorOutput: 'ReferenceError: testVariable is not defined',
      language: 'javascript'
    }
  );
  
  if (!analysis || !analysis.analyzer) {
    throw new Error('Error analysis failed');
  }
  
  if (analysis.analyzer !== 'javascript') {
    throw new Error('Wrong analyzer selected');
  }
  
  console.log('   Shutting down coordinator...');
  await coordinator.shutdown();
  
  console.log('   ✅ Coordinator integration working correctly');
  console.log(`   Analyzer used: ${analysis.analyzer}`);
  console.log(`   Error type: ${analysis.errorType}`);
  console.log(`   Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
});

// Test: JavaScript Analyzer Functionality
runner.test('JavaScript analyzer functionality', async () => {
  const { pluginManager } = await import('../src/core/plugin-manager/index.js');
  
  await pluginManager.discoverPlugins();
  const jsAnalyzer = await pluginManager.loadPlugin('analyzers', 'javascript');
  
  // Test different error contexts
  const testCases = [
    {
      context: { files: ['test.js'], error: 'SyntaxError: Unexpected token' },
      shouldSupport: true,
      description: 'JavaScript syntax error'
    },
    {
      context: { files: ['test.py'], error: 'NameError: name is not defined' },
      shouldSupport: false,
      description: 'Python error'
    },
    {
      context: { files: ['app.jsx'], error: 'ReferenceError: React is not defined' },
      shouldSupport: true,
      description: 'React JSX error'
    }
  ];
  
  for (const testCase of testCases) {
    const supports = jsAnalyzer.supports(testCase.context);
    console.log(`   ${testCase.description}: ${supports ? 'SUPPORTED' : 'NOT SUPPORTED'}`);
    
    if (supports !== testCase.shouldSupport) {
      throw new Error(`${testCase.description} support detection incorrect`);
    }
  }
  
  // Test actual analysis
  console.log('   Testing error analysis...');
  const analysis = await jsAnalyzer.analyze(
    'ReferenceError: myVariable is not defined',
    { files: ['test.js'], errorOutput: 'ReferenceError: myVariable is not defined' }
  );
  
  if (!analysis || !analysis.language) {
    throw new Error('Analysis failed to return proper result');
  }
  
  if (analysis.language !== 'javascript') {
    throw new Error('Analysis language detection failed');
  }
  
  console.log('   ✅ JavaScript analyzer working correctly');
  console.log(`   Language: ${analysis.language}`);
  console.log(`   Error type: ${analysis.errorType}`);
  console.log(`   Framework: ${Array.isArray(analysis.framework) ? analysis.framework.join(', ') : analysis.framework}`);
});

// Test: Plugin Interface Contracts
runner.test('Plugin interface contracts', async () => {
  const { BaseAnalyzer, BaseProvider } = await import('../src/core/plugin-manager/interfaces.js');
  
  // Test that base classes can be instantiated
  const testManifest = { name: 'test', version: '1.0.0' };
  const testConfig = { test: true };
  
  const analyzer = new BaseAnalyzer(testManifest, testConfig);
  if (!analyzer.name || !analyzer.version) {
    throw new Error('BaseAnalyzer initialization failed');
  }
  
  const provider = new BaseProvider(testManifest, testConfig);
  if (!provider.name || !provider.version) {
    throw new Error('BaseProvider initialization failed');
  }
  
  // Test that abstract methods throw errors
  try {
    analyzer.supports({});
    throw new Error('BaseAnalyzer.supports should throw error');
  } catch (error) {
    if (!error.message.includes('must implement')) {
      throw new Error('BaseAnalyzer.supports should throw implementation error');
    }
  }
  
  try {
    await provider.query('test');
    throw new Error('BaseProvider.query should throw error');
  } catch (error) {
    if (!error.message.includes('must implement')) {
      throw new Error('BaseProvider.query should throw implementation error');
    }
  }
  
  console.log('   ✅ Plugin interface contracts working correctly');
});

// Test: Configuration Hierarchy
runner.test('Configuration hierarchy', async () => {
  const { configManager } = await import('../src/core/config-manager/index.js');
  
  await configManager.load();
  
  // Test setting and getting values
  configManager.set('test.value', 'test123');
  const value = configManager.get('test.value');
  
  if (value !== 'test123') {
    throw new Error('Configuration set/get not working');
  }
  
  // Test nested access
  const plugins = configManager.get('plugins', {});
  if (!plugins || typeof plugins !== 'object') {
    throw new Error('Configuration nested access failed');
  }
  
  // Test default values
  const nonExistent = configManager.get('non.existent.key', 'default');
  if (nonExistent !== 'default') {
    throw new Error('Configuration default values not working');
  }
  
  console.log('   ✅ Configuration hierarchy working correctly');
});

// Run all tests
console.log('🚀 Starting Enhanced Cloi Modular Platform Tests...\n');

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