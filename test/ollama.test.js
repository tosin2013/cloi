/**
 * Basic Ollama Integration Tests
 * Run with: node test/ollama.test.js
 */

import { analyzeWithLLM } from '../src/core/index.js';
import { ensureModelAvailable, getAllAvailableModels } from '../src/core/executor/router.js';

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

// Test: Model Availability Check
runner.test('Model availability check', async () => {
  const models = await getAllAvailableModels();
  if (!Array.isArray(models)) {
    throw new Error('getAllAvailableModels should return an array');
  }
  console.log(`   Found ${models.length} available models`);
});

// Test: Ensure Model Available
runner.test('Ensure specific model available', async () => {
  // Test with a common model (phi3.5 or phi4)
  const testModels = ['phi3.5:latest', 'phi4:latest', 'llama3.2:1b'];
  let modelFound = false;
  
  for (const model of testModels) {
    try {
      const available = await ensureModelAvailable(model);
      if (available) {
        console.log(`   Model ${model} is available`);
        modelFound = true;
        break;
      }
    } catch (error) {
      // Continue to next model
      continue;
    }
  }
  
  if (!modelFound) {
    throw new Error('No test models available. Please ensure Ollama is running with at least one model.');
  }
});

// Test: Basic Error Analysis
runner.test('Basic error analysis with Ollama', async () => {
  const testError = 'ReferenceError: undefinedVariable is not defined';
  const fileInfo = { language: 'javascript', fileName: 'test.js' };
  
  // Use a lightweight model for testing
  const testModels = ['phi3.5:latest', 'phi4:latest'];
  let result = null;
  
  for (const model of testModels) {
    try {
      result = await analyzeWithLLM(testError, model, fileInfo, '', 'test.js');
      console.log(`   Analysis completed with model: ${model}`);
      break;
    } catch (error) {
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
});

// Test: JavaScript Error Analysis
runner.test('JavaScript error analysis', async () => {
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
  
  const testModels = ['phi3.5:latest', 'phi4:latest'];
  let analysisCompleted = false;
  
  for (const model of testModels) {
    try {
      const result = await analyzeWithLLM(jsError, model, fileInfo, fileInfo.content, 'test.js');
      
      if (result.analysis && result.analysis.length > 50) {
        console.log(`   JavaScript analysis completed with ${model}`);
        analysisCompleted = true;
        break;
      }
    } catch (error) {
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

// Test: Python Error Analysis
runner.test('Python error analysis', async () => {
  const pythonError = `
NameError: name 'undefined_variable' is not defined
  File "test.py", line 3, in broken_function
    return undefined_variable
  `;
  
  const fileInfo = { 
    language: 'python', 
    fileName: 'test.py',
    content: `
def broken_function():
    return undefined_variable  # NameError

broken_function()
    `.trim()
  };
  
  const testModels = ['phi3.5:latest', 'phi4:latest'];
  let analysisCompleted = false;
  
  for (const model of testModels) {
    try {
      const result = await analyzeWithLLM(pythonError, model, fileInfo, fileInfo.content, 'test.py');
      
      if (result.analysis && result.analysis.length > 50) {
        console.log(`   Python analysis completed with ${model}`);
        analysisCompleted = true;
        break;
      }
    } catch (error) {
      if (error.message.includes('not found')) {
        continue;
      }
      throw error;
    }
  }
  
  if (!analysisCompleted) {
    throw new Error('Python error analysis failed with all available models');
  }
});

// Run the tests
runner.run().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
}); 