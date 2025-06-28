#!/usr/bin/env node
/**
 * Browser Testing Integration Plugin Tests
 * Comprehensive test suite for the browser testing automation plugin
 */

import assert from 'assert';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple test framework
class BrowserTestingTestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🎭 Running Browser Testing Integration Plugin Tests...\n');
    
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

    console.log('📊 Browser Testing Plugin Test Results:');
    console.log(`   Passed: ${this.passed}`);
    console.log(`   Failed: ${this.failed}`);
    console.log(`   Total:  ${this.tests.length}`);

    if (this.failed > 0) {
      process.exit(1);
    } else {
      console.log('\n🎉 All browser testing integration tests passed!');
    }
  }
}

const runner = new BrowserTestingTestRunner();

// Test: Plugin Loading and Interface
runner.test('Browser testing plugin loading and interface validation', async () => {
  const { default: BrowserTestingIntegration } = await import('./index.js');
  
  const manifest = {
    name: 'browser-testing',
    version: '1.0.0',
    type: 'integrations'
  };
  
  const config = {
    browsers: {
      chromium: { enabled: true, headless: true },
      firefox: { enabled: false },
      webkit: { enabled: false }
    }
  };
  
  const plugin = new BrowserTestingIntegration(manifest, config);
  
  // Validate required methods exist
  const requiredMethods = [
    'connect', 'disconnect', 'isConnected', 'execute', 'isConfigured',
    'runTests', 'createTest', 'takeScreenshot', 'runVisualTest',
    'runAccessibilityTest', 'runPerformanceTest', 'runMobileTest'
  ];
  
  for (const method of requiredMethods) {
    assert(typeof plugin[method] === 'function', `Missing method: ${method}`);
  }
  
  console.log('   ✅ All required methods present');
  
  // Test browser initialization
  assert(plugin.browsers.chromium, 'Chromium browser not initialized');
  assert(plugin.browsers.firefox, 'Firefox browser not initialized');
  assert(plugin.browsers.webkit, 'WebKit browser not initialized');
  
  console.log('   ✅ Browser engines initialized');
});

// Test: Configuration Validation and Browser Detection
runner.test('Configuration validation and browser detection', async () => {
  const { default: BrowserTestingIntegration } = await import('./index.js');
  
  const manifest = { name: 'browser-testing', version: '1.0.0' };
  
  // Test with Chromium enabled
  const chromiumConfig = {
    browsers: {
      chromium: {
        enabled: true,
        headless: true,
        viewport: { width: 1920, height: 1080 }
      },
      firefox: { enabled: false },
      webkit: { enabled: false }
    }
  };
  
  const plugin = new BrowserTestingIntegration(manifest, chromiumConfig);
  
  const enabledBrowsers = plugin.getEnabledBrowsers();
  assert(enabledBrowsers.includes('chromium'), 'Chromium should be enabled');
  assert(!enabledBrowsers.includes('firefox'), 'Firefox should not be enabled');
  assert(!enabledBrowsers.includes('webkit'), 'WebKit should not be enabled');
  assert(enabledBrowsers.length === 1, 'Only Chromium should be enabled');
  
  console.log('   ✅ Browser configuration validated');
  
  // Test browser projects generation
  const projects = plugin.generateBrowserProjects();
  assert(projects.length >= 1, 'At least one browser project should be generated');
  assert(projects.some(p => p.name === 'chromium'), 'Chromium project not found');
  
  console.log('   ✅ Browser projects generated correctly');
});

// Test: Test Configuration Generation
runner.test('Playwright test configuration generation', async () => {
  const { default: BrowserTestingIntegration } = await import('./index.js');
  
  const manifest = { name: 'browser-testing', version: '1.0.0' };
  const config = {
    testing: {
      timeout: 30000,
      retries: 2,
      workers: 4
    },
    browsers: {
      chromium: { enabled: true, headless: true }
    }
  };
  
  const plugin = new BrowserTestingIntegration(manifest, config);
  
  // Test test runner initialization
  assert(plugin.testConfig.timeout === 30000, 'Timeout not set correctly');
  assert(plugin.testConfig.retries === 2, 'Retries not set correctly');
  assert(plugin.testConfig.workers === 4, 'Workers not set correctly');
  
  console.log('   ✅ Test configuration initialized correctly');
  
  // Test config generation
  const configPath = await plugin.generatePlaywrightConfig(['chromium'], {
    reporter: 'json'
  });
  
  assert(typeof configPath === 'string', 'Config path should be string');
  assert(configPath.includes('playwright.config.tmp.js'), 'Config file name incorrect');
  
  // Verify config file was created
  try {
    await fs.access(configPath);
    console.log('   ✅ Playwright config file generated');
    
    // Clean up
    await fs.unlink(configPath);
  } catch (error) {
    throw new Error('Config file not created or not accessible');
  }
});

// Test: Test Template Generation
runner.test('Test template generation', async () => {
  const { default: BrowserTestingIntegration } = await import('./index.js');
  
  const manifest = { name: 'browser-testing', version: '1.0.0' };
  const config = {};
  
  const plugin = new BrowserTestingIntegration(manifest, config);
  
  // Test basic template
  const basicTemplate = plugin.generateTestTemplate(
    'Login Test',
    'e2e',
    'https://example.com/login',
    'basic'
  );
  
  assert(typeof basicTemplate === 'string', 'Template should be string');
  assert(basicTemplate.includes('Login Test'), 'Template should include test name');
  assert(basicTemplate.includes('https://example.com/login'), 'Template should include URL');
  assert(basicTemplate.includes("import { test, expect } from '@playwright/test'"), 'Template should import Playwright');
  
  console.log('   ✅ Basic template generated correctly');
  
  // Test form template
  const formTemplate = plugin.generateTestTemplate(
    'Contact Form',
    'form',
    'https://example.com/contact',
    'form'
  );
  
  assert(formTemplate.includes('Form Testing'), 'Form template should include form keywords');
  assert(formTemplate.includes('page.fill'), 'Form template should include fill actions');
  
  console.log('   ✅ Form template generated correctly');
  
  // Test navigation template
  const navTemplate = plugin.generateTestTemplate(
    'Site Navigation',
    'navigation',
    'https://example.com',
    'navigation'
  );
  
  assert(navTemplate.includes('Navigation Test'), 'Navigation template should include nav keywords');
  assert(navTemplate.includes('page.goBack'), 'Navigation template should include navigation actions');
  
  console.log('   ✅ Navigation template generated correctly');
});

// Test: Action Code Generation
runner.test('Test action code generation', async () => {
  const { default: BrowserTestingIntegration } = await import('./index.js');
  
  const manifest = { name: 'browser-testing', version: '1.0.0' };
  const config = {};
  
  const plugin = new BrowserTestingIntegration(manifest, config);
  
  // Test click action
  const clickCode = plugin.generateActionCode({
    type: 'click',
    selector: 'button[type="submit"]'
  });
  assert(clickCode.includes('page.click'), 'Click action not generated correctly');
  assert(clickCode.includes('button[type="submit"]'), 'Click selector not included');
  
  // Test fill action
  const fillCode = plugin.generateActionCode({
    type: 'fill',
    selector: 'input[name="email"]',
    value: 'test@example.com'
  });
  assert(fillCode.includes('page.fill'), 'Fill action not generated correctly');
  assert(fillCode.includes('test@example.com'), 'Fill value not included');
  
  // Test navigate action
  const navCode = plugin.generateActionCode({
    type: 'navigate',
    url: 'https://example.com/page'
  });
  assert(navCode.includes('page.goto'), 'Navigate action not generated correctly');
  assert(navCode.includes('https://example.com/page'), 'Navigate URL not included');
  
  // Test wait action
  const waitCode = plugin.generateActionCode({
    type: 'wait',
    selector: '.loading-spinner'
  });
  assert(waitCode.includes('page.waitForSelector'), 'Wait action not generated correctly');
  assert(waitCode.includes('.loading-spinner'), 'Wait selector not included');
  
  console.log('   ✅ Action code generation working correctly');
});

// Test: Test Results Parsing
runner.test('Test results parsing', async () => {
  const { default: BrowserTestingIntegration } = await import('./index.js');
  
  const manifest = { name: 'browser-testing', version: '1.0.0' };
  const config = {};
  
  const plugin = new BrowserTestingIntegration(manifest, config);
  
  // Test successful results
  const successOutput = `
Running 5 tests using 2 workers

  ✓ [chromium] › login.spec.js:3:1 › user can login
  ✓ [chromium] › navigation.spec.js:8:1 › navigation works
  ✓ [firefox] › login.spec.js:3:1 › user can login
  ✓ [firefox] › navigation.spec.js:8:1 › navigation works
  ✓ [webkit] › forms.spec.js:5:1 › form submission

  5 passed (10s)
`;
  
  const successSummary = plugin.parseTestResults(successOutput);
  assert(successSummary.passed === 5, 'Passed count incorrect');
  assert(successSummary.failed === 0, 'Failed count should be 0');
  assert(successSummary.total === 5, 'Total count incorrect');
  
  console.log('   ✅ Success results parsed correctly');
  
  // Test failed results
  const failedOutput = `
Running 3 tests using 2 workers

  ✓ [chromium] › login.spec.js:3:1 › user can login
  ✗ [chromium] › forms.spec.js:8:1 › form validation
  - [firefox] › login.spec.js:3:1 › user can login (skipped)

  1 passed
  1 failed
  1 skipped (5s)
`;
  
  const failedSummary = plugin.parseTestResults(failedOutput);
  assert(failedSummary.passed === 1, 'Passed count incorrect for failed tests');
  assert(failedSummary.failed === 1, 'Failed count incorrect');
  assert(failedSummary.skipped === 1, 'Skipped count incorrect');
  assert(failedSummary.total === 3, 'Total count incorrect for mixed results');
  
  console.log('   ✅ Failed results parsed correctly');
});

// Test: Coverage Calculation
runner.test('Code coverage calculation', async () => {
  const { default: BrowserTestingIntegration } = await import('./index.js');
  
  const manifest = { name: 'browser-testing', version: '1.0.0' };
  const config = {};
  
  const plugin = new BrowserTestingIntegration(manifest, config);
  
  // Test coverage calculation
  const mockCoverageData = [
    {
      url: 'http://example.com/script.js',
      text: 'function test() { console.log("hello"); }',
      ranges: [
        { start: 0, end: 20 }, // Partial coverage
        { start: 25, end: 40 }
      ]
    }
  ];
  
  const coverage = plugin.calculateCoverage(mockCoverageData);
  
  assert(typeof coverage.percentage === 'number', 'Coverage percentage should be number');
  assert(coverage.percentage >= 0 && coverage.percentage <= 100, 'Coverage percentage should be 0-100');
  assert(typeof coverage.covered === 'number', 'Covered bytes should be number');
  assert(typeof coverage.total === 'number', 'Total bytes should be number');
  assert(coverage.covered <= coverage.total, 'Covered should not exceed total');
  
  console.log('   ✅ Coverage calculation working correctly');
  
  // Test empty coverage
  const emptyCoverage = plugin.calculateCoverage([]);
  assert(emptyCoverage.percentage === 0, 'Empty coverage should be 0%');
  assert(emptyCoverage.covered === 0, 'Empty coverage covered should be 0');
  assert(emptyCoverage.total === 0, 'Empty coverage total should be 0');
  
  console.log('   ✅ Empty coverage handled correctly');
});

// Test: Available Operations
runner.test('Available operations and status reporting', async () => {
  const { default: BrowserTestingIntegration } = await import('./index.js');
  
  const manifest = { name: 'browser-testing', version: '1.0.0' };
  const config = {};
  
  const plugin = new BrowserTestingIntegration(manifest, config);
  
  const operations = plugin.getAvailableOperations();
  const expectedOps = [
    'run-tests',
    'create-test',
    'screenshot',
    'visual-test',
    'accessibility-test',
    'performance-test',
    'mobile-test',
    'generate-test',
    'install-browsers',
    'update-snapshots'
  ];
  
  for (const op of expectedOps) {
    assert(operations.includes(op), `Missing operation: ${op}`);
  }
  
  console.log('   ✅ All expected operations available');
  
  // Test status reporting
  const status = await plugin.getStatus();
  assert(typeof status === 'object', 'Status should be object');
  assert(typeof status.connected === 'boolean', 'Status should have connected boolean');
  assert(typeof status.browsers === 'object', 'Status should have browsers object');
  assert(typeof status.configuration === 'object', 'Status should have configuration object');
  
  // Check browser status
  for (const browser of ['chromium', 'firefox', 'webkit']) {
    assert(status.browsers[browser], `Browser ${browser} not in status`);
    assert(typeof status.browsers[browser].enabled === 'boolean', `Browser ${browser} enabled should be boolean`);
    assert(typeof status.browsers[browser].connected === 'boolean', `Browser ${browser} connected should be boolean`);
  }
  
  console.log('   ✅ Status reporting working correctly');
});

// Test: Configuration Options
runner.test('Configuration options and features', async () => {
  const { default: BrowserTestingIntegration } = await import('./index.js');
  
  const manifest = { name: 'browser-testing', version: '1.0.0' };
  const config = {
    browsers: {
      chromium: { enabled: true },
      firefox: { enabled: true },
      webkit: { enabled: false }
    },
    visual: {
      enabled: true,
      threshold: 0.1
    },
    accessibility: {
      enabled: true,
      standards: ['wcag2aa']
    },
    performance: {
      enabled: true,
      metrics: ['FCP', 'LCP'],
      thresholds: { FCP: 1500, LCP: 2000 }
    },
    mobile: {
      enabled: true,
      devices: ['iPhone 13', 'Pixel 5']
    }
  };
  
  const plugin = new BrowserTestingIntegration(manifest, config);
  
  // Test configuration retrieval
  assert(plugin.getConfig('visual.enabled') === true, 'Visual testing not enabled');
  assert(plugin.getConfig('visual.threshold') === 0.1, 'Visual threshold not set');
  assert(plugin.getConfig('accessibility.enabled') === true, 'Accessibility testing not enabled');
  assert(plugin.getConfig('performance.enabled') === true, 'Performance testing not enabled');
  assert(plugin.getConfig('mobile.enabled') === true, 'Mobile testing not enabled');
  
  console.log('   ✅ Configuration options working correctly');
  
  // Test enabled browsers
  const enabledBrowsers = plugin.getEnabledBrowsers();
  assert(enabledBrowsers.includes('chromium'), 'Chromium should be enabled');
  assert(enabledBrowsers.includes('firefox'), 'Firefox should be enabled');
  assert(!enabledBrowsers.includes('webkit'), 'WebKit should not be enabled');
  assert(enabledBrowsers.length === 2, 'Should have 2 enabled browsers');
  
  console.log('   ✅ Browser configuration working correctly');
});

// Test: File Operations
runner.test('File operations and utilities', async () => {
  const { default: BrowserTestingIntegration } = await import('./index.js');
  
  const manifest = { name: 'browser-testing', version: '1.0.0' };
  const config = {};
  
  const plugin = new BrowserTestingIntegration(manifest, config);
  
  // Test file existence check
  const currentFile = import.meta.url.replace('file://', '');
  const existsResult = await plugin.fileExists(currentFile);
  assert(existsResult === true, 'Current file should exist');
  
  const notExistsResult = await plugin.fileExists('/nonexistent/file.txt');
  assert(notExistsResult === false, 'Nonexistent file should not exist');
  
  console.log('   ✅ File existence checking working correctly');
});

// Test: Error Handling
runner.test('Error handling and validation', async () => {
  const { default: BrowserTestingIntegration } = await import('./index.js');
  
  const manifest = { name: 'browser-testing', version: '1.0.0' };
  const config = {};
  
  const plugin = new BrowserTestingIntegration(manifest, config);
  
  // Test invalid operation error
  try {
    await plugin.execute('invalid-operation');
    assert(false, 'Should have thrown error for invalid operation');
  } catch (error) {
    assert(error.message.includes('Unknown operation'), 'Wrong error message');
  }
  
  console.log('   ✅ Invalid operation error handled correctly');
  
  // Test mobile device error
  try {
    await plugin.runMobileTest({ device: 'InvalidDevice' });
    assert(false, 'Should have thrown error for invalid device');
  } catch (error) {
    assert(error.message.includes('not supported'), 'Wrong error message for invalid device');
  }
  
  console.log('   ✅ Invalid device error handled correctly');
});

// Run all tests
console.log('🚀 Starting Browser Testing Integration Plugin Tests...\n');

// Add environment info
console.log('Environment Info:');
console.log(`   Node.js: ${process.version}`);
console.log(`   Platform: ${process.platform}`);
console.log(`   Working Directory: ${process.cwd()}`);
console.log('');

runner.run().catch(error => {
  console.error('Fatal error running browser testing tests:', error);
  process.exit(1);
});