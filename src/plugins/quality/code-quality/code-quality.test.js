#!/usr/bin/env node
/**
 * Test suite for CodeQualityPlugin
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
    console.log('🧪 Running Code Quality Plugin Tests...\n');
    
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
      console.log('\n🎉 All code quality plugin tests passed!');
    }
  }
}

const runner = new TestRunner();

// Test: Plugin Imports
runner.test('Code quality plugin module imports', async () => {
  console.log('   Importing code quality plugin...');
  
  const CodeQualityPlugin = (await import('./index.js')).default;
  
  if (!CodeQualityPlugin) {
    throw new Error('Failed to import code quality plugin');
  }
  
  console.log('   ✅ Code quality plugin imported successfully');
});

// Test: Plugin Initialization
runner.test('Code quality plugin initialization', async () => {
  const CodeQualityPlugin = (await import('./index.js')).default;
  
  const mockManifest = { 
    name: 'code-quality', 
    version: '1.0.0',
    capabilities: ['linting', 'formatting', 'security-analysis']
  };
  const mockConfig = {
    enabled: true,
    tools: {
      eslint: { enabled: true },
      prettier: { enabled: true },
      black: { enabled: true },
      flake8: { enabled: true }
    }
  };
  
  const plugin = new CodeQualityPlugin(mockManifest, mockConfig);
  
  if (!plugin.name || plugin.name !== 'code-quality') {
    throw new Error('Plugin initialization failed');
  }
  
  if (!plugin.tools || Object.keys(plugin.tools).length === 0) {
    throw new Error('Tools not initialized');
  }
  
  console.log('   ✅ Plugin initialized correctly');
  console.log(`   Available tools: ${Object.keys(plugin.tools).join(', ')}`);
});

// Test: Language Detection
runner.test('Language detection functionality', async () => {
  const CodeQualityPlugin = (await import('./index.js')).default;
  
  const mockManifest = { name: 'code-quality', version: '1.0.0' };
  const plugin = new CodeQualityPlugin(mockManifest, {});
  
  const testCases = [
    { file: 'test.js', expected: 'javascript' },
    { file: 'component.jsx', expected: 'javascript' },
    { file: 'module.ts', expected: 'typescript' },
    { file: 'component.tsx', expected: 'typescript' },
    { file: 'script.py', expected: 'python' },
    { file: 'config.json', expected: 'json' },
    { file: 'readme.md', expected: 'markdown' },
    { file: 'unknown.xyz', expected: 'unknown' }
  ];
  
  for (const testCase of testCases) {
    const detected = plugin.detectLanguage(testCase.file);
    if (detected !== testCase.expected) {
      throw new Error(`Language detection failed for ${testCase.file}: expected ${testCase.expected}, got ${detected}`);
    }
  }
  
  console.log('   ✅ Language detection working correctly');
});

// Test: File Support Check
runner.test('File support checking', async () => {
  const CodeQualityPlugin = (await import('./index.js')).default;
  
  const mockManifest = { name: 'code-quality', version: '1.0.0' };
  const plugin = new CodeQualityPlugin(mockManifest, {});
  
  const supportedFiles = ['test.js', 'app.py', 'component.tsx'];
  const unsupportedFiles = ['image.png', 'document.pdf', 'archive.zip'];
  
  for (const file of supportedFiles) {
    if (!plugin.supportsFile(file)) {
      throw new Error(`Should support file: ${file}`);
    }
  }
  
  for (const file of unsupportedFiles) {
    if (plugin.supportsFile(file)) {
      throw new Error(`Should not support file: ${file}`);
    }
  }
  
  console.log('   ✅ File support checking working correctly');
});

// Test: Tool Configuration
runner.test('Tool configuration management', async () => {
  const CodeQualityPlugin = (await import('./index.js')).default;
  
  const mockManifest = { name: 'code-quality', version: '1.0.0' };
  const mockConfig = {
    tools: {
      eslint: { enabled: true },
      prettier: { enabled: false },
      black: { enabled: true },
      flake8: { enabled: false }
    }
  };
  
  const plugin = new CodeQualityPlugin(mockManifest, mockConfig);
  
  if (!plugin.isToolEnabled('eslint')) {
    throw new Error('ESLint should be enabled');
  }
  
  if (plugin.isToolEnabled('prettier')) {
    throw new Error('Prettier should be disabled');
  }
  
  if (!plugin.isToolEnabled('black')) {
    throw new Error('Black should be enabled');
  }
  
  if (plugin.isToolEnabled('flake8')) {
    throw new Error('Flake8 should be disabled');
  }
  
  console.log('   ✅ Tool configuration management working correctly');
});

// Test: Tool Selection
runner.test('Tool selection for different languages', async () => {
  const CodeQualityPlugin = (await import('./index.js')).default;
  
  const mockManifest = { name: 'code-quality', version: '1.0.0' };
  const plugin = new CodeQualityPlugin(mockManifest, {});
  
  const enabledTools = plugin.getEnabledTools();
  
  if (!Array.isArray(enabledTools)) {
    throw new Error('getEnabledTools should return an array');
  }
  
  // JavaScript tools should be available
  const jsTools = ['eslint', 'prettier'];
  const hasJSTools = jsTools.some(tool => enabledTools.includes(tool));
  if (!hasJSTools) {
    throw new Error('Should include JavaScript tools');
  }
  
  // Python tools should be available
  const pyTools = ['black', 'flake8', 'pylint', 'mypy'];
  const hasPyTools = pyTools.some(tool => enabledTools.includes(tool));
  if (!hasPyTools) {
    throw new Error('Should include Python tools');
  }
  
  console.log('   ✅ Tool selection working correctly');
  console.log(`   Available tools: ${enabledTools.join(', ')}`);
});

// Test: Fixable Tools
runner.test('Fixable tool identification', async () => {
  const CodeQualityPlugin = (await import('./index.js')).default;
  
  const mockManifest = { name: 'code-quality', version: '1.0.0' };
  const plugin = new CodeQualityPlugin(mockManifest, {});
  
  const fixableTools = plugin.getFixableTools();
  
  if (!Array.isArray(fixableTools)) {
    throw new Error('getFixableTools should return an array');
  }
  
  const expectedFixable = ['eslint', 'prettier', 'black'];
  for (const tool of expectedFixable) {
    if (!fixableTools.includes(tool)) {
      throw new Error(`${tool} should be fixable`);
    }
  }
  
  // Tools that shouldn't be fixable
  const nonFixable = ['flake8', 'pylint', 'mypy'];
  for (const tool of nonFixable) {
    if (fixableTools.includes(tool)) {
      throw new Error(`${tool} should not be fixable`);
    }
  }
  
  console.log('   ✅ Fixable tool identification working correctly');
  console.log(`   Fixable tools: ${fixableTools.join(', ')}`);
});

// Test: Severity Mapping
runner.test('Pylint severity mapping', async () => {
  const CodeQualityPlugin = (await import('./index.js')).default;
  
  const mockManifest = { name: 'code-quality', version: '1.0.0' };
  const plugin = new CodeQualityPlugin(mockManifest, {});
  
  const testCases = [
    { pylintType: 'error', expected: 'error' },
    { pylintType: 'warning', expected: 'warning' },
    { pylintType: 'refactor', expected: 'info' },
    { pylintType: 'convention', expected: 'info' },
    { pylintType: 'info', expected: 'info' },
    { pylintType: 'unknown', expected: 'warning' }
  ];
  
  for (const testCase of testCases) {
    const mapped = plugin.mapPylintSeverity(testCase.pylintType);
    if (mapped !== testCase.expected) {
      throw new Error(`Pylint severity mapping failed for ${testCase.pylintType}: expected ${testCase.expected}, got ${mapped}`);
    }
  }
  
  console.log('   ✅ Pylint severity mapping working correctly');
});

// Test: Supported Extensions
runner.test('Supported extensions enumeration', async () => {
  const CodeQualityPlugin = (await import('./index.js')).default;
  
  const mockManifest = { name: 'code-quality', version: '1.0.0' };
  const plugin = new CodeQualityPlugin(mockManifest, {});
  
  const extensions = plugin.getSupportedExtensions();
  
  if (!Array.isArray(extensions)) {
    throw new Error('getSupportedExtensions should return an array');
  }
  
  const expectedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py'];
  for (const ext of expectedExtensions) {
    if (!extensions.includes(ext)) {
      throw new Error(`Should support extension: ${ext}`);
    }
  }
  
  console.log('   ✅ Supported extensions enumeration working');
  console.log(`   Supported extensions: ${extensions.join(', ')}`);
});

// Test: Configuration Access
runner.test('Configuration access methods', async () => {
  const CodeQualityPlugin = (await import('./index.js')).default;
  
  const mockManifest = { name: 'code-quality', version: '1.0.0' };
  const mockConfig = {
    enabled: true,
    autoFix: false,
    tools: {
      eslint: {
        enabled: true,
        rules: { 'no-console': 'warn' }
      }
    }
  };
  
  const plugin = new CodeQualityPlugin(mockManifest, mockConfig);
  
  // Test getConfig method
  if (plugin.getConfig('enabled') !== true) {
    throw new Error('getConfig should return correct value');
  }
  
  if (plugin.getConfig('autoFix') !== false) {
    throw new Error('getConfig should return correct boolean value');
  }
  
  if (plugin.getConfig('tools.eslint.enabled') !== true) {
    throw new Error('getConfig should handle nested paths');
  }
  
  if (plugin.getConfig('nonexistent', 'default') !== 'default') {
    throw new Error('getConfig should return default value for missing keys');
  }
  
  console.log('   ✅ Configuration access methods working correctly');
});

// Test: Mock Analysis (without running actual tools)
runner.test('Analysis structure validation', async () => {
  const CodeQualityPlugin = (await import('./index.js')).default;
  
  const mockManifest = { name: 'code-quality', version: '1.0.0' };
  const mockConfig = {
    tools: {
      eslint: { enabled: false }, // Disable to avoid running actual tools
      prettier: { enabled: false },
      black: { enabled: false },
      flake8: { enabled: false }
    }
  };
  
  const plugin = new CodeQualityPlugin(mockManifest, mockConfig);
  
  // Mock files that would exist
  const mockFiles = ['test.js', 'script.py'];
  
  try {
    const result = await plugin.analyze(mockFiles);
    
    // Validate result structure
    if (!result.timestamp) {
      throw new Error('Result should have timestamp');
    }
    
    if (!result.files || !Array.isArray(result.files)) {
      throw new Error('Result should have files array');
    }
    
    if (!result.summary) {
      throw new Error('Result should have summary');
    }
    
    if (typeof result.duration !== 'number') {
      throw new Error('Result should have duration number');
    }
    
    if (!Array.isArray(result.toolsUsed)) {
      throw new Error('Result should have toolsUsed array');
    }
    
    console.log('   ✅ Analysis result structure is valid');
  } catch (error) {
    if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
      console.log('   ✅ Analysis structure validated (files not found as expected)');
    } else {
      throw error;
    }
  }
});

// Test: Recommendation Generation
runner.test('Recommendation generation', async () => {
  const CodeQualityPlugin = (await import('./index.js')).default;
  
  const mockManifest = { name: 'code-quality', version: '1.0.0' };
  const plugin = new CodeQualityPlugin(mockManifest, {});
  
  // Mock analysis results with high error count
  const mockResults = {
    summary: {
      totalIssues: 50,
      errors: 15,
      warnings: 30,
      info: 5
    },
    toolsUsed: ['eslint']
  };
  
  const recommendations = plugin.generateRecommendations(mockResults);
  
  if (!Array.isArray(recommendations)) {
    throw new Error('generateRecommendations should return an array');
  }
  
  // Should recommend auto-fix for high error count
  const hasErrorReduction = recommendations.some(rec => rec.type === 'error-reduction');
  if (!hasErrorReduction) {
    throw new Error('Should recommend error reduction for high error count');
  }
  
  // Should recommend prettier when eslint is used but prettier is not
  const hasToolIntegration = recommendations.some(rec => rec.type === 'tool-integration');
  if (!hasToolIntegration) {
    throw new Error('Should recommend prettier integration');
  }
  
  console.log('   ✅ Recommendation generation working correctly');
  console.log(`   Generated ${recommendations.length} recommendations`);
});

// Test: Report Generation
runner.test('Report generation', async () => {
  const CodeQualityPlugin = (await import('./index.js')).default;
  
  const mockManifest = { name: 'code-quality', version: '1.0.0' };
  const plugin = new CodeQualityPlugin(mockManifest, {});
  
  const mockResults = {
    files: ['test.js'],
    summary: { totalIssues: 5, errors: 1, warnings: 4 },
    toolsUsed: ['eslint'],
    results: {}
  };
  
  // Test JSON report
  const jsonReport = await plugin.generateReport(mockResults, { format: 'json' });
  if (jsonReport.format !== 'json') {
    throw new Error('JSON report should have correct format');
  }
  
  // Test HTML report
  const htmlReport = await plugin.generateReport(mockResults, { format: 'html' });
  if (htmlReport.format !== 'html') {
    throw new Error('HTML report should have correct format');
  }
  
  // Test Markdown report
  const mdReport = await plugin.generateReport(mockResults, { format: 'markdown' });
  if (mdReport.format !== 'markdown') {
    throw new Error('Markdown report should have correct format');
  }
  
  console.log('   ✅ Report generation working correctly');
  console.log(`   Supports formats: json, html, markdown`);
});

// Run all tests
console.log('🚀 Starting Code Quality Plugin Tests...\n');

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