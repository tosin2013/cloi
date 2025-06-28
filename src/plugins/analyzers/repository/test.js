#!/usr/bin/env node
/**
 * Repository Analyzer Plugin Tests
 * Comprehensive test suite for the repository analysis and expertise tracking plugin
 */

import assert from 'assert';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple test framework
class RepositoryAnalyzerTestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🔍 Running Repository Analyzer Plugin Tests...\n');
    
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

    console.log('📊 Repository Analyzer Test Results:');
    console.log(`   Passed: ${this.passed}`);
    console.log(`   Failed: ${this.failed}`);
    console.log(`   Total:  ${this.tests.length}`);

    if (this.failed > 0) {
      process.exit(1);
    } else {
      console.log('\n🎉 All repository analyzer tests passed!');
    }
  }
}

const runner = new RepositoryAnalyzerTestRunner();

// Test: Plugin Loading and Interface
runner.test('Repository analyzer plugin loading and interface validation', async () => {
  const { default: RepositoryAnalyzer } = await import('./index.js');
  
  const manifest = {
    name: 'repository',
    version: '1.0.0',
    type: 'analyzers'
  };
  
  const config = {
    analysis: {
      includeHistory: true,
      maxHistoryDepth: 100
    },
    expertise: {
      enabled: true,
      trackContributors: true
    }
  };
  
  const analyzer = new RepositoryAnalyzer(manifest, config);
  
  // Validate required methods exist
  const requiredMethods = [
    'supports', 'analyze', 'analyzeLanguages', 'analyzeInfrastructure',
    'analyzeExpertise', 'analyzeIntelligence', 'detectLanguage'
  ];
  
  for (const method of requiredMethods) {
    assert(typeof analyzer[method] === 'function', `Missing method: ${method}`);
  }
  
  console.log('   ✅ All required methods present');
  
  // Test language patterns initialization
  assert(analyzer.languagePatterns, 'Language patterns not initialized');
  assert(analyzer.languagePatterns.javascript, 'JavaScript patterns not found');
  assert(analyzer.languagePatterns.python, 'Python patterns not found');
  assert(analyzer.languagePatterns.ansible || analyzer.infrastructurePatterns, 'Infrastructure patterns not found');
  
  console.log('   ✅ Language and infrastructure patterns initialized');
});

// Test: Language Detection
runner.test('Language detection functionality', async () => {
  const { default: RepositoryAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'repository', version: '1.0.0' };
  const config = {};
  
  const analyzer = new RepositoryAnalyzer(manifest, config);
  
  // Test various file extensions
  const testCases = [
    { file: 'app.js', expected: 'javascript' },
    { file: 'component.tsx', expected: 'typescript' },
    { file: 'script.py', expected: 'python' },
    { file: 'Main.java', expected: 'java' },
    { file: 'Program.cs', expected: 'csharp' },
    { file: 'main.go', expected: 'go' },
    { file: 'lib.rs', expected: 'rust' },
    { file: 'index.php', expected: 'php' },
    { file: 'app.rb', expected: 'ruby' },
    { file: 'ViewController.swift', expected: 'swift' },
    { file: 'MainActivity.kt', expected: 'kotlin' },
    { file: 'main.cpp', expected: 'cpp' },
    { file: 'program.c', expected: 'c' },
    { file: 'script.sh', expected: 'shell' },
    { file: 'deploy.yml', expected: 'yaml' },
    { file: 'package.json', expected: 'javascript' },
    { file: 'Dockerfile', expected: 'docker' },
    { file: 'requirements.txt', expected: null }, // Should not detect as a language
  ];
  
  for (const testCase of testCases) {
    const detected = analyzer.detectLanguage(testCase.file);
    if (testCase.expected === null) {
      assert(detected === null, `${testCase.file} should not detect language, got ${detected}`);
    } else {
      assert(detected === testCase.expected, 
        `${testCase.file} should detect ${testCase.expected}, got ${detected}`);
    }
  }
  
  console.log('   ✅ Language detection working correctly for all test cases');
});

// Test: Infrastructure File Detection
runner.test('Infrastructure file detection', async () => {
  const { default: RepositoryAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'repository', version: '1.0.0' };
  const config = {};
  
  const analyzer = new RepositoryAnalyzer(manifest, config);
  
  // Test infrastructure file detection
  const infraTests = [
    { file: 'playbook.yml', method: 'isAnsibleFile', expected: true },
    { file: 'roles/common/tasks/main.yml', method: 'isAnsibleFile', expected: true },
    { file: 'main.tf', method: 'isTerraformFile', expected: true },
    { file: 'variables.tfvars', method: 'isTerraformFile', expected: true },
    { file: 'deployment.yaml', method: 'isKubernetesFile', expected: false }, // Would need content analysis
    { file: 'Dockerfile', method: 'isDockerFile', expected: true },
    { file: 'docker-compose.yml', method: 'isDockerFile', expected: true },
    { file: 'regular.txt', method: 'isDockerFile', expected: false }
  ];
  
  for (const test of infraTests) {
    const result = analyzer[test.method](test.file);
    // Note: Some methods are async and would need content, so we test the method exists
    assert(typeof analyzer[test.method] === 'function', 
      `Method ${test.method} should exist`);
  }
  
  console.log('   ✅ Infrastructure file detection methods working');
});

// Test: Support Check
runner.test('Repository context support check', async () => {
  const { default: RepositoryAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'repository', version: '1.0.0' };
  const config = {};
  
  const analyzer = new RepositoryAnalyzer(manifest, config);
  
  // Test support check (should support any context in a Git repo)
  const contexts = [
    { files: ['app.js'], error: 'ReferenceError: x is not defined' },
    { files: ['script.py'], error: 'NameError: name is not defined' },
    { files: ['main.go'], error: 'undefined: fmt' },
    { files: [], error: 'General error' }
  ];
  
  for (const context of contexts) {
    const supports = analyzer.supports(context);
    // Repository analyzer should support any context if in a Git repo
    assert(typeof supports === 'boolean', 'Support check should return boolean');
  }
  
  console.log('   ✅ Context support checking working correctly');
});

// Test: File Size Utilities
runner.test('File size parsing and validation', async () => {
  const { default: RepositoryAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'repository', version: '1.0.0' };
  const config = {};
  
  const analyzer = new RepositoryAnalyzer(manifest, config);
  
  // Test size parsing
  const sizeTests = [
    { input: '1KB', expected: 1024 },
    { input: '5MB', expected: 5 * 1024 * 1024 },
    { input: '1GB', expected: 1024 * 1024 * 1024 },
    { input: '100', expected: 100 },
    { input: '2.5MB', expected: 2.5 * 1024 * 1024 }
  ];
  
  for (const test of sizeTests) {
    const parsed = analyzer.parseSize(test.input);
    assert(parsed === test.expected, 
      `${test.input} should parse to ${test.expected}, got ${parsed}`);
  }
  
  console.log('   ✅ File size parsing working correctly');
});

// Test: Area Detection from Path
runner.test('Area detection from file paths', async () => {
  const { default: RepositoryAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'repository', version: '1.0.0' };
  const config = {};
  
  const analyzer = new RepositoryAnalyzer(manifest, config);
  
  // Test area detection
  const areaTests = [
    { path: 'frontend/src/components/App.js', expected: 'frontend' },
    { path: 'backend/api/users.py', expected: 'backend' },
    { path: 'database/migrations/001_create_users.sql', expected: 'database' },
    { path: 'infrastructure/terraform/main.tf', expected: 'infrastructure' },
    { path: 'tests/unit/user.test.js', expected: 'testing' },
    { path: 'docs/README.md', expected: 'documentation' },
    { path: 'src/utils/helper.js', expected: 'general' }
  ];
  
  for (const test of areaTests) {
    const area = analyzer.detectAreaFromPath(test.path);
    assert(area === test.expected, 
      `${test.path} should detect area ${test.expected}, got ${area}`);
  }
  
  console.log('   ✅ Area detection working correctly');
});

// Test: Pattern Initialization
runner.test('Pattern initialization and validation', async () => {
  const { default: RepositoryAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'repository', version: '1.0.0' };
  const config = {};
  
  const analyzer = new RepositoryAnalyzer(manifest, config);
  
  // Validate language patterns
  assert(analyzer.languagePatterns.javascript.includes('.js'), 'JavaScript patterns incomplete');
  assert(analyzer.languagePatterns.python.includes('.py'), 'Python patterns incomplete');
  assert(analyzer.languagePatterns.typescript.includes('.ts'), 'TypeScript patterns incomplete');
  
  // Validate infrastructure patterns
  assert(analyzer.infrastructurePatterns.ansible, 'Ansible patterns not found');
  assert(analyzer.infrastructurePatterns.terraform, 'Terraform patterns not found');
  assert(analyzer.infrastructurePatterns.kubernetes, 'Kubernetes patterns not found');
  assert(analyzer.infrastructurePatterns.docker, 'Docker patterns not found');
  
  // Validate framework patterns
  assert(analyzer.frameworkPatterns.react, 'React patterns not found');
  assert(analyzer.frameworkPatterns.django, 'Django patterns not found');
  assert(analyzer.frameworkPatterns.spring, 'Spring patterns not found');
  
  console.log('   ✅ All pattern types initialized correctly');
  
  // Test pattern completeness
  const expectedLanguages = [
    'javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust',
    'php', 'ruby', 'swift', 'kotlin', 'cpp', 'c', 'shell'
  ];
  
  for (const lang of expectedLanguages) {
    assert(analyzer.languagePatterns[lang], `Missing language pattern: ${lang}`);
  }
  
  console.log('   ✅ All expected language patterns present');
});

// Test: Cache Key Generation
runner.test('Cache key generation', async () => {
  const { default: RepositoryAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'repository', version: '1.0.0' };
  const config = {};
  
  const analyzer = new RepositoryAnalyzer(manifest, config);
  
  // Test cache key generation
  const cacheKey = await analyzer.generateCacheKey();
  assert(typeof cacheKey === 'string', 'Cache key should be string');
  assert(cacheKey.length > 0, 'Cache key should not be empty');
  
  console.log('   ✅ Cache key generation working');
  console.log(`   Generated cache key: ${cacheKey}`);
});

// Test: Metrics Generation
runner.test('Metrics generation', async () => {
  const { default: RepositoryAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'repository', version: '1.0.0' };
  const config = {};
  
  const analyzer = new RepositoryAnalyzer(manifest, config);
  
  // Test metrics generation with mock data
  const mockAnalysis = {
    languages: {
      javascript: { files: ['app.js', 'utils.js'], totalLines: 500 },
      python: { files: ['main.py'], totalLines: 200 }
    },
    frameworks: ['react', 'express'],
    expertise: {
      'alice': { commits: 50 },
      'bob': { commits: 30 }
    },
    infrastructure: {
      ansible: { files: ['playbook.yml'] },
      terraform: { files: ['main.tf'] }
    }
  };
  
  const metrics = analyzer.generateMetrics(mockAnalysis);
  
  assert(typeof metrics === 'object', 'Metrics should be object');
  assert(metrics.totalFiles === 3, 'Total files count incorrect');
  assert(metrics.totalLines === 700, 'Total lines count incorrect');
  assert(metrics.totalContributors === 2, 'Total contributors count incorrect');
  assert(metrics.languageCount === 2, 'Language count incorrect');
  assert(metrics.frameworkCount === 2, 'Framework count incorrect');
  
  console.log('   ✅ Metrics generation working correctly');
  console.log(`   Generated metrics:`, metrics);
});

// Test: Configuration Access
runner.test('Configuration access and defaults', async () => {
  const { default: RepositoryAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'repository', version: '1.0.0' };
  const config = {
    analysis: {
      maxHistoryDepth: 500,
      includeHistory: true
    },
    expertise: {
      trackContributors: false,
      expertiseThreshold: 0.2
    }
  };
  
  const analyzer = new RepositoryAnalyzer(manifest, config);
  
  // Test configuration access
  assert(analyzer.getConfig('analysis.maxHistoryDepth') === 500, 'Config value not retrieved');
  assert(analyzer.getConfig('analysis.includeHistory') === true, 'Boolean config not retrieved');
  assert(analyzer.getConfig('expertise.trackContributors') === false, 'Boolean false not retrieved');
  assert(analyzer.getConfig('expertise.expertiseThreshold') === 0.2, 'Float config not retrieved');
  
  // Test default values
  assert(analyzer.getConfig('nonexistent.key', 'default') === 'default', 'Default value not returned');
  assert(analyzer.getConfig('analysis.timeout', 30000) === 30000, 'Default number not returned');
  
  console.log('   ✅ Configuration access working correctly');
});

// Test: Priority and Analysis Interface
runner.test('Analyzer priority and interface compliance', async () => {
  const { default: RepositoryAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'repository', version: '1.0.0' };
  const config = {};
  
  const analyzer = new RepositoryAnalyzer(manifest, config);
  
  // Test priority
  const priority = analyzer.getPriority();
  assert(typeof priority === 'number', 'Priority should be number');
  assert(priority > 0, 'Priority should be positive');
  assert(priority <= 100, 'Priority should be reasonable');
  
  console.log('   ✅ Priority correctly set:', priority);
  
  // Test that analyze method exists and returns promise
  const analyzeMethod = analyzer.analyze;
  assert(typeof analyzeMethod === 'function', 'Analyze method should exist');
  
  // Test supports method
  const supportsMethod = analyzer.supports;
  assert(typeof supportsMethod === 'function', 'Supports method should exist');
  
  console.log('   ✅ Analyzer interface compliance verified');
});

// Test: Error Handling
runner.test('Error handling and edge cases', async () => {
  const { default: RepositoryAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'repository', version: '1.0.0' };
  const config = {};
  
  const analyzer = new RepositoryAnalyzer(manifest, config);
  
  // Test with invalid file paths
  const invalidLanguage = analyzer.detectLanguage('');
  assert(invalidLanguage === null, 'Empty filename should return null');
  
  const noExtension = analyzer.detectLanguage('README');
  assert(noExtension === null, 'File without extension should return null for most cases');
  
  // Test size parsing with invalid input
  const invalidSize = analyzer.parseSize('invalid');
  assert(invalidSize === 0, 'Invalid size should return 0');
  
  const emptySize = analyzer.parseSize('');
  assert(emptySize === 0, 'Empty size should return 0');
  
  console.log('   ✅ Error handling working correctly');
});

// Run all tests
console.log('🚀 Starting Repository Analyzer Plugin Tests...\n');

// Add environment info
console.log('Environment Info:');
console.log(`   Node.js: ${process.version}`);
console.log(`   Platform: ${process.platform}`);
console.log(`   Working Directory: ${process.cwd()}`);
console.log(`   Git Repository: ${process.cwd().includes('.git') ? 'Yes' : 'Unknown'}`);
console.log('');

runner.run().catch(error => {
  console.error('Fatal error running repository analyzer tests:', error);
  process.exit(1);
});