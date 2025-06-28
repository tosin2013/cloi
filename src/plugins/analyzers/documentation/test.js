#!/usr/bin/env node
/**
 * Documentation Analyzer Plugin Tests
 * Comprehensive test suite for the intelligent documentation management plugin
 */

import assert from 'assert';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple test framework
class DocumentationAnalyzerTestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('📚 Running Documentation Analyzer Plugin Tests...\n');
    
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

    console.log('📊 Documentation Analyzer Test Results:');
    console.log(`   Passed: ${this.passed}`);
    console.log(`   Failed: ${this.failed}`);
    console.log(`   Total:  ${this.tests.length}`);

    if (this.failed > 0) {
      process.exit(1);
    } else {
      console.log('\n🎉 All documentation analyzer tests passed!');
    }
  }
}

const runner = new DocumentationAnalyzerTestRunner();

// Test: Plugin Loading and Interface
runner.test('Documentation analyzer plugin loading and interface validation', async () => {
  const { default: DocumentationAnalyzer } = await import('./index.js');
  
  const manifest = {
    name: 'documentation',
    version: '1.0.0',
    type: 'analyzers'
  };
  
  const config = {
    analysis: {
      scanDirectories: ['docs', 'documentation'],
      trackCoverage: true
    },
    generation: {
      enabled: true,
      autoGenerate: false
    }
  };
  
  const analyzer = new DocumentationAnalyzer(manifest, config);
  
  // Validate required methods exist
  const requiredMethods = [
    'supports', 'analyze', 'analyzeDocumentationCoverage', 
    'analyzeDocumentationStructure', 'analyzeDocumentationQuality',
    'analyzeGenerationOpportunities'
  ];
  
  for (const method of requiredMethods) {
    assert(typeof analyzer[method] === 'function', `Missing method: ${method}`);
  }
  
  console.log('   ✅ All required methods present');
  
  // Test patterns initialization
  assert(analyzer.docPatterns, 'Documentation patterns not initialized');
  assert(analyzer.docTypes, 'Documentation types not initialized');
  assert(analyzer.templatePatterns, 'Template patterns not initialized');
  
  console.log('   ✅ Documentation patterns initialized');
});

// Test: Documentation File Detection
runner.test('Documentation file detection', async () => {
  const { default: DocumentationAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'documentation', version: '1.0.0' };
  const config = {};
  
  const analyzer = new DocumentationAnalyzer(manifest, config);
  
  // Test various file types
  const testCases = [
    { file: 'README.md', expected: true },
    { file: 'api.md', expected: true },
    { file: 'guide.rst', expected: true },
    { file: 'manual.txt', expected: true },
    { file: 'docs.adoc', expected: true },
    { file: 'app.js', expected: false },
    { file: 'style.css', expected: false },
    { file: 'config.json', expected: false }
  ];
  
  for (const testCase of testCases) {
    const isDoc = analyzer.isDocumentationFile(testCase.file);
    assert(isDoc === testCase.expected, 
      `${testCase.file} documentation detection incorrect: expected ${testCase.expected}, got ${isDoc}`);
  }
  
  console.log('   ✅ Documentation file detection working correctly');
});

// Test: Documentation Type Classification
runner.test('Documentation type classification', async () => {
  const { default: DocumentationAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'documentation', version: '1.0.0' };
  const config = {};
  
  const analyzer = new DocumentationAnalyzer(manifest, config);
  
  // Test type classification
  const typeTests = [
    { file: 'README.md', expected: 'readme' },
    { file: 'API.md', expected: 'api' },
    { file: 'tutorial.md', expected: 'guide' },
    { file: 'CHANGELOG.md', expected: 'changelog' },
    { file: 'CONTRIBUTING.md', expected: 'contributing' },
    { file: 'LICENSE.md', expected: 'license' },
    { file: 'architecture.md', expected: 'architecture' },
    { file: 'deployment.md', expected: 'deployment' },
    { file: 'troubleshooting.md', expected: 'troubleshooting' },
    { file: 'random.md', expected: 'general' }
  ];
  
  for (const test of typeTests) {
    const type = analyzer.getDocumentationType(test.file);
    assert(type === test.expected, 
      `${test.file} should be type ${test.expected}, got ${type}`);
  }
  
  console.log('   ✅ Documentation type classification working');
});

// Test: Index File Detection
runner.test('Index file detection', async () => {
  const { default: DocumentationAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'documentation', version: '1.0.0' };
  const config = {};
  
  const analyzer = new DocumentationAnalyzer(manifest, config);
  
  // Test index file detection
  const indexTests = [
    { file: 'index.md', expected: true },
    { file: 'README.md', expected: true },
    { file: 'index.html', expected: true },
    { file: 'toc.md', expected: true },
    { file: 'guide.md', expected: false },
    { file: 'api.md', expected: false }
  ];
  
  for (const test of indexTests) {
    const isIndex = analyzer.isIndexFile(test.file);
    assert(isIndex === test.expected, 
      `${test.file} index detection incorrect: expected ${test.expected}, got ${isIndex}`);
  }
  
  console.log('   ✅ Index file detection working correctly');
});

// Test: Language Detection
runner.test('Programming language detection from file paths', async () => {
  const { default: DocumentationAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'documentation', version: '1.0.0' };
  const config = {};
  
  const analyzer = new DocumentationAnalyzer(manifest, config);
  
  // Test language detection
  const languageTests = [
    { file: 'app.js', expected: 'javascript' },
    { file: 'component.ts', expected: 'typescript' },
    { file: 'script.py', expected: 'python' },
    { file: 'Main.java', expected: 'java' },
    { file: 'Program.cs', expected: 'csharp' },
    { file: 'main.go', expected: 'go' },
    { file: 'lib.rs', expected: 'rust' },
    { file: 'index.php', expected: 'php' },
    { file: 'app.rb', expected: 'ruby' },
    { file: 'config.xml', expected: 'unknown' }
  ];
  
  for (const test of languageTests) {
    const language = analyzer.detectLanguage(test.file);
    assert(language === test.expected, 
      `${test.file} should detect ${test.expected}, got ${language}`);
  }
  
  console.log('   ✅ Language detection working correctly');
});

// Test: Area Detection from Paths
runner.test('Area detection from file paths', async () => {
  const { default: DocumentationAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'documentation', version: '1.0.0' };
  const config = {};
  
  const analyzer = new DocumentationAnalyzer(manifest, config);
  
  // Test area detection
  const areaTests = [
    { path: 'frontend/components/App.js', expected: 'frontend' },
    { path: 'backend/api/users.py', expected: 'backend' },
    { path: 'database/models/User.js', expected: 'database' },
    { path: 'infrastructure/deploy/ansible.yml', expected: 'infrastructure' },
    { path: 'tests/unit/user.test.js', expected: 'testing' },
    { path: 'docs/README.md', expected: 'docs' },
    { path: 'src/utils/helper.js', expected: 'general' }
  ];
  
  for (const test of areaTests) {
    const area = analyzer.detectAreaFromPath(test.path);
    assert(area === test.expected, 
      `${test.path} should detect area ${test.expected}, got ${area}`);
  }
  
  console.log('   ✅ Area detection working correctly');
});

// Test: Content Analysis Methods
runner.test('Documentation content analysis methods', async () => {
  const { default: DocumentationAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'documentation', version: '1.0.0' };
  const config = {};
  
  const analyzer = new DocumentationAnalyzer(manifest, config);
  
  // Test inline documentation detection
  const jsContent = `
    /**
     * Calculate the sum of two numbers
     * @param {number} a - First number
     * @param {number} b - Second number
     * @returns {number} The sum
     */
    function add(a, b) {
      return a + b;
    }
  `;
  
  assert(analyzer.hasInlineDocumentation(jsContent, 'javascript'), 
    'Should detect inline documentation in JavaScript');
  assert(analyzer.hasJSDocComments(jsContent), 
    'Should detect JSDoc comments');
  assert(analyzer.hasParameterDocs(jsContent), 
    'Should detect parameter documentation');
  assert(analyzer.hasReturnDocs(jsContent), 
    'Should detect return documentation');
  
  const pythonContent = `
    def add(a, b):
        """
        Calculate the sum of two numbers.
        
        Args:
            a (int): First number
            b (int): Second number
            
        Returns:
            int: The sum of a and b
        """
        return a + b
  `;
  
  assert(analyzer.hasInlineDocumentation(pythonContent, 'python'), 
    'Should detect inline documentation in Python');
  assert(analyzer.hasPythonDocstrings(pythonContent), 
    'Should detect Python docstrings');
  
  console.log('   ✅ Content analysis methods working correctly');
});

// Test: Documentation Scoring
runner.test('Documentation quality scoring', async () => {
  const { default: DocumentationAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'documentation', version: '1.0.0' };
  const config = {};
  
  const analyzer = new DocumentationAnalyzer(manifest, config);
  
  // Test documentation scoring
  const wellDocumentedContent = `
    /**
     * This is a comprehensive function with excellent documentation.
     * It includes detailed descriptions, parameters, return values, and examples.
     * 
     * @param {string} input - The input string to process
     * @param {object} options - Configuration options
     * @returns {string} The processed result
     * 
     * @example
     * const result = processString('hello', { uppercase: true });
     * console.log(result); // 'HELLO'
     */
    function processString(input, options) {
      // Implementation here
      return input;
    }
  `;
  
  const poorlyDocumentedContent = `
    function doSomething(x) {
      return x;
    }
  `;
  
  const goodScore = analyzer.calculateDocumentationScore(wellDocumentedContent, 'javascript');
  const poorScore = analyzer.calculateDocumentationScore(poorlyDocumentedContent, 'javascript');
  
  assert(goodScore > poorScore, 'Well documented code should score higher');
  assert(goodScore >= 80, 'Well documented code should score at least 80');
  assert(poorScore <= 50, 'Poorly documented code should score 50 or less');
  
  console.log('   ✅ Documentation scoring working correctly');
  console.log(`   Well documented score: ${goodScore}`);
  console.log(`   Poorly documented score: ${poorScore}`);
});

// Test: Priority Calculation
runner.test('Documentation priority calculation', async () => {
  const { default: DocumentationAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'documentation', version: '1.0.0' };
  const config = {};
  
  const analyzer = new DocumentationAnalyzer(manifest, config);
  
  // Test priority calculation
  const highPriorityFile = 'src/api/public/users.js';
  const mediumPriorityFile = 'src/index.js';
  const lowPriorityFile = 'src/utils/helper.js';
  
  const highPriority = analyzer.calculateDocumentationPriority(highPriorityFile, 'function test() {}');
  const mediumPriority = analyzer.calculateDocumentationPriority(mediumPriorityFile, 'function test() {}');
  const lowPriority = analyzer.calculateDocumentationPriority(lowPriorityFile, 'function test() {}');
  
  assert(highPriority === 'high', 'API files should have high priority');
  assert(mediumPriority === 'medium', 'Index files should have medium priority');
  assert(lowPriority === 'low', 'Utility files should have low priority');
  
  console.log('   ✅ Priority calculation working correctly');
});

// Test: Support Check
runner.test('Documentation context support check', async () => {
  const { default: DocumentationAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'documentation', version: '1.0.0' };
  const config = {};
  
  const analyzer = new DocumentationAnalyzer(manifest, config);
  
  // Test support check
  const contexts = [
    { files: ['README.md'], error: 'Documentation issue' },
    { files: ['app.js'], error: 'JavaScript error' },
    { files: ['script.py'], error: 'Python error' },
    { files: [], error: 'General error' }
  ];
  
  for (const context of contexts) {
    const supports = analyzer.supports(context);
    assert(typeof supports === 'boolean', 'Support check should return boolean');
  }
  
  console.log('   ✅ Context support checking working correctly');
});

// Test: Cache Key Generation
runner.test('Cache key generation', async () => {
  const { default: DocumentationAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'documentation', version: '1.0.0' };
  const config = {};
  
  const analyzer = new DocumentationAnalyzer(manifest, config);
  
  // Test cache key generation
  const cacheKey = await analyzer.generateCacheKey();
  assert(typeof cacheKey === 'string', 'Cache key should be string');
  assert(cacheKey.length > 0, 'Cache key should not be empty');
  assert(cacheKey.startsWith('docs-'), 'Cache key should have docs prefix');
  
  console.log('   ✅ Cache key generation working');
  console.log(`   Generated cache key: ${cacheKey}`);
});

// Test: Metrics Generation
runner.test('Documentation metrics generation', async () => {
  const { default: DocumentationAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'documentation', version: '1.0.0' };
  const config = {};
  
  const analyzer = new DocumentationAnalyzer(manifest, config);
  
  // Test metrics generation with mock data
  const mockAnalysis = {
    structure: { files: ['readme.md', 'api.md', 'guide.md'] },
    coverage: { 
      overall: { percentage: 75 },
      missingDocs: ['file1.js', 'file2.js']
    },
    quality: { overallScore: 82 },
    recommendations: [
      { type: 'coverage', priority: 'high' },
      { type: 'quality', priority: 'medium' }
    ]
  };
  
  const metrics = analyzer.generateMetrics(mockAnalysis);
  
  assert(typeof metrics === 'object', 'Metrics should be object');
  assert(metrics.totalDocuments === 3, 'Total documents count incorrect');
  assert(metrics.coveragePercentage === 75, 'Coverage percentage incorrect');
  assert(metrics.qualityScore === 82, 'Quality score incorrect');
  assert(metrics.missingDocs === 2, 'Missing docs count incorrect');
  assert(metrics.recommendationCount === 2, 'Recommendation count incorrect');
  
  console.log('   ✅ Metrics generation working correctly');
  console.log(`   Generated metrics:`, metrics);
});

// Test: Configuration Access
runner.test('Configuration access and defaults', async () => {
  const { default: DocumentationAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'documentation', version: '1.0.0' };
  const config = {
    analysis: {
      scanDirectories: ['docs', 'wiki'],
      trackCoverage: true
    },
    generation: {
      enabled: false,
      formats: ['markdown', 'html']
    }
  };
  
  const analyzer = new DocumentationAnalyzer(manifest, config);
  
  // Test configuration access
  const scanDirs = analyzer.getConfig('analysis.scanDirectories');
  assert(Array.isArray(scanDirs), 'Scan directories should be array');
  assert(scanDirs.includes('docs'), 'Should include docs directory');
  assert(scanDirs.includes('wiki'), 'Should include wiki directory');
  
  assert(analyzer.getConfig('analysis.trackCoverage') === true, 'Track coverage should be true');
  assert(analyzer.getConfig('generation.enabled') === false, 'Generation should be disabled');
  
  // Test default values
  const defaultValue = analyzer.getConfig('nonexistent.key', 'default');
  assert(defaultValue === 'default', 'Default value not returned');
  
  const defaultArray = analyzer.getConfig('analysis.scanDirectories', ['docs']);
  assert(Array.isArray(defaultArray), 'Default array not returned correctly');
  
  console.log('   ✅ Configuration access working correctly');
});

// Test: Priority and Interface Compliance
runner.test('Analyzer priority and interface compliance', async () => {
  const { default: DocumentationAnalyzer } = await import('./index.js');
  
  const manifest = { name: 'documentation', version: '1.0.0' };
  const config = {};
  
  const analyzer = new DocumentationAnalyzer(manifest, config);
  
  // Test priority
  const priority = analyzer.getPriority();
  assert(typeof priority === 'number', 'Priority should be number');
  assert(priority > 0, 'Priority should be positive');
  assert(priority <= 100, 'Priority should be reasonable');
  
  console.log('   ✅ Priority correctly set:', priority);
  
  // Test that analyze method exists and is async
  const analyzeMethod = analyzer.analyze;
  assert(typeof analyzeMethod === 'function', 'Analyze method should exist');
  
  // Test supports method
  const supportsMethod = analyzer.supports;
  assert(typeof supportsMethod === 'function', 'Supports method should exist');
  
  console.log('   ✅ Analyzer interface compliance verified');
});

// Run all tests
console.log('🚀 Starting Documentation Analyzer Plugin Tests...\n');

// Add environment info
console.log('Environment Info:');
console.log(`   Node.js: ${process.version}`);
console.log(`   Platform: ${process.platform}`);
console.log(`   Working Directory: ${process.cwd()}`);
console.log('');

runner.run().catch(error => {
  console.error('Fatal error running documentation analyzer tests:', error);
  process.exit(1);
});