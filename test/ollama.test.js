/**
 * Basic Ollama Integration Tests
 * Run with: node test/ollama.test.js
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
    console.log('🧪 Running Ollama Integration Tests...\n');
    
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
      console.log('\n🎉 All tests passed!');
    }
  }
}

const runner = new TestRunner();

// Dynamic import helper with fallback
async function tryImport(modulePath, functionName) {
  try {
    const module = await import(modulePath);
    if (!module[functionName]) {
      throw new Error(`Function ${functionName} not found in ${modulePath}`);
    }
    return module[functionName];
  } catch (error) {
    console.log(`   ⚠️  Warning: Could not import ${functionName} from ${modulePath}: ${error.message}`);
    return null;
  }
}

// Test: Module imports
runner.test('Module imports', async () => {
  console.log('   Checking core module imports...');
  
  const analyzeWithLLM = await tryImport('../src/core/index.js', 'analyzeWithLLM');
  const ensureModelAvailable = await tryImport('../src/core/executor/router.js', 'ensureModelAvailable');
  const getAllAvailableModels = await tryImport('../src/core/executor/router.js', 'getAllAvailableModels');
  
  if (!analyzeWithLLM) {
    throw new Error('Failed to import analyzeWithLLM function');
  }
  if (!ensureModelAvailable) {
    throw new Error('Failed to import ensureModelAvailable function');
  }
  if (!getAllAvailableModels) {
    throw new Error('Failed to import getAllAvailableModels function');
  }
  
  console.log('   ✅ All required functions imported successfully');
});

// Test: Ollama connectivity
runner.test('Ollama service connectivity', async () => {
  try {
    // Try to import and use ollama client
    const { Ollama } = await import('ollama');
    const ollama = new Ollama({ host: 'http://localhost:11434' });
    
    // Check if Ollama is running
    const models = await ollama.list();
    console.log(`   ✅ Ollama is running with ${models.models.length} models`);
    
    if (models.models.length === 0) {
      console.log('   ⚠️  Warning: No models available in Ollama');
    } else {
      console.log(`   Available models: ${models.models.map(m => m.name).join(', ')}`);
    }
  } catch (error) {
    throw new Error(`Ollama connectivity check failed: ${error.message}`);
  }
});

// Test: Model Availability Check
runner.test('Model availability check', async () => {
  const getAllAvailableModels = await tryImport('../src/core/executor/router.js', 'getAllAvailableModels');
  
  if (!getAllAvailableModels) {
    console.log('   ⚠️  Skipping test: getAllAvailableModels not available');
    return;
  }
  
  const models = await getAllAvailableModels();
  if (!Array.isArray(models)) {
    throw new Error('getAllAvailableModels should return an array');
  }
  console.log(`   Found ${models.length} available models`);
  
  if (models.length === 0) {
    console.log('   ⚠️  Warning: No models available through Cloi interface');
  }
});

// Test: Ensure Model Available
runner.test('Ensure specific model available', async () => {
  const ensureModelAvailable = await tryImport('../src/core/executor/router.js', 'ensureModelAvailable');
  
  if (!ensureModelAvailable) {
    console.log('   ⚠️  Skipping test: ensureModelAvailable not available');
    return;
  }
  
  // Test with common models in order of preference
  const testModels = ['phi3.5:latest', 'llama3.2:1b', 'phi4:latest', 'llama3.2:latest'];
  let modelFound = false;
  
  for (const model of testModels) {
    try {
      const available = await ensureModelAvailable(model);
      if (available) {
        console.log(`   ✅ Model ${model} is available`);
        modelFound = true;
        break;
      }
    } catch (error) {
      console.log(`   ⚠️  Model ${model} not available: ${error.message}`);
      continue;
    }
  }
  
  if (!modelFound) {
    throw new Error('No test models available. Please ensure Ollama is running with at least one model.');
  }
});

// Test: Basic Error Analysis
runner.test('Basic error analysis with Ollama', async () => {
  const analyzeWithLLM = await tryImport('../src/core/index.js', 'analyzeWithLLM');
  
  if (!analyzeWithLLM) {
    console.log('   ⚠️  Skipping test: analyzeWithLLM not available');
    return;
  }
  
  const testError = 'ReferenceError: undefinedVariable is not defined';
  const fileInfo = { language: 'javascript', fileName: 'test.js' };
  
  // Use lightweight models for testing
  const testModels = ['phi3.5:latest', 'llama3.2:1b', 'phi4:latest'];
  let result = null;
  
  for (const model of testModels) {
    try {
      console.log(`   Trying analysis with model: ${model}`);
      result = await analyzeWithLLM(testError, model, fileInfo, '', 'test.js');
      console.log(`   ✅ Analysis completed with model: ${model}`);
      break;
    } catch (error) {
      console.log(`   ⚠️  Model ${model} failed: ${error.message}`);
      if (error.message.includes('not found') || error.message.includes('not available')) {
        continue; // Try next model
      }
      throw error;
    }
  }
  
  if (!result) {
    throw new Error('No models available for testing');
  }
  
  if (!result.analysis || typeof result.analysis !== 'string') {
    throw new Error('Analysis should return a string');
  }
  
  console.log(`   Analysis length: ${result.analysis.length} characters`);
  
  // Verify the analysis contains some meaningful content
  if (result.analysis.length < 20) {
    throw new Error('Analysis seems too short to be meaningful');
  }
});

// Test: JavaScript Error Analysis (More comprehensive)
runner.test('JavaScript error analysis', async () => {
  const analyzeWithLLM = await tryImport('../src/core/index.js', 'analyzeWithLLM');
  
  if (!analyzeWithLLM) {
    console.log('   ⚠️  Skipping test: analyzeWithLLM not available');
    return;
  }
  
  const jsError = `
TypeError: Cannot read properties of undefined (reading 'length')
    at calculateLength (test.js:5:20)
    at main (test.js:9:15)
  `;
  
  const fileInfo = { 
    language: 'javascript', 
    fileName: 'test.js',
    content: `
function calculateLength(arr) {
  return arr.length; // Error: arr might be undefined
}

function main() {
  const result = calculateLength();
  console.log(result);
}
    `.trim()
  };
  
  const testModels = ['phi3.5:latest', 'llama3.2:1b'];
  let analysisCompleted = false;
  
  for (const model of testModels) {
    try {
      console.log(`   Analyzing JavaScript error with ${model}...`);
      const result = await analyzeWithLLM(jsError, model, fileInfo, fileInfo.content, 'test.js');
      
      if (result.analysis && result.analysis.length > 50) {
        console.log(`   ✅ JavaScript analysis completed with ${model}`);
        console.log(`   Analysis excerpt: "${result.analysis.substring(0, 100)}..."`);
        analysisCompleted = true;
        break;
      }
    } catch (error) {
      console.log(`   ⚠️  JavaScript analysis with ${model} failed: ${error.message}`);
      if (error.message.includes('not found')) {
        continue;
      }
      throw error;
    }
  }
  
  if (!analysisCompleted) {
    throw new Error('JavaScript error analysis failed with all available models');
  }
});

// Run all tests
console.log('🚀 Starting Ollama Integration Tests for Cloi...\n');

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