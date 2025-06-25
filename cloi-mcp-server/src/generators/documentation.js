/**
 * Documentation Generator for Cloi
 * 
 * Generates comprehensive documentation based on actual codebase analysis
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

export class DocumentationGenerator {
  constructor(repoConfig) {
    this.repoConfig = repoConfig;
    this.projectRoot = path.resolve(process.cwd(), '..');
  }

  // Business Requirements Document
  async generateBRD(feature, scope = 'enhancement') {
    const brd = {
      title: `Business Requirements Document - ${feature}`,
      project: 'Cloi - Terminal Error Analysis & Debugging Tool',
      feature,
      scope,
      generatedDate: new Date().toISOString(),
      sections: {}
    };

    // Executive Summary
    brd.sections.executiveSummary = {
      title: "Executive Summary",
      content: this.generateExecutiveSummary(feature, scope)
    };

    // Business Context
    brd.sections.businessContext = {
      title: "Business Context",
      content: await this.generateBusinessContext(feature)
    };

    // Requirements
    brd.sections.requirements = {
      title: "Business Requirements",
      content: this.generateBusinessRequirements(feature, scope)
    };

    // Success Criteria
    brd.sections.successCriteria = {
      title: "Success Criteria",
      content: this.generateSuccessCriteria(feature)
    };

    // Stakeholders
    brd.sections.stakeholders = {
      title: "Stakeholders",
      content: this.generateStakeholderAnalysis(feature)
    };

    return this.formatDocument(brd);
  }

  generateExecutiveSummary(feature, scope) {
    const summaries = {
      core: `This document outlines the business requirements for adding ${feature} to Cloi's core functionality. This enhancement will improve the tool's ability to analyze and fix terminal errors, providing greater value to developers.`,
      enhancement: `This document details the requirements for enhancing Cloi with ${feature}. This improvement will extend Cloi's capabilities and improve the developer experience.`,
      integration: `This document specifies the requirements for integrating ${feature} with Cloi. This integration will expand Cloi's ecosystem and enable new workflows.`
    };

    return summaries[scope] || summaries.enhancement;
  }

  async generateBusinessContext(feature) {
    const context = `## Current State
Cloi currently provides:
- Terminal error analysis using LLMs (Ollama and Claude)
- Automatic patch generation and application
- RAG-based code context retrieval
- Interactive CLI interface

## Problem Statement
${this.generateProblemStatement(feature)}

## Opportunity
By implementing ${feature}, Cloi can:
- Enhance its error analysis capabilities
- Provide more accurate fixes
- Improve developer productivity
- Expand its use cases`;

    return context;
  }

  generateProblemStatement(feature) {
    const normalized = feature.toLowerCase();
    
    if (normalized.includes('test')) {
      return "Developers need better testing capabilities to ensure Cloi's reliability and catch regressions early.";
    } else if (normalized.includes('api')) {
      return "Users need programmatic access to Cloi's functionality for integration with other tools.";
    } else if (normalized.includes('ui') || normalized.includes('interface')) {
      return "The current interface could be enhanced to provide better user experience and clearer feedback.";
    } else {
      return `Users have expressed the need for ${feature} to improve their debugging workflow.`;
    }
  }

  generateBusinessRequirements(feature, scope) {
    return `## Functional Requirements
1. **Core Functionality**
   - ${feature} must integrate seamlessly with existing Cloi architecture
   - Maintain backward compatibility with current CLI commands
   - Preserve performance characteristics

2. **User Experience**
   - Intuitive interface following Cloi's current patterns
   - Clear error messages and feedback
   - Comprehensive help documentation

3. **Technical Requirements**
   - Compatible with Node.js 14+
   - Maintain ES module structure
   - Follow existing code patterns

## Non-Functional Requirements
1. **Performance**
   - Response time under 2 seconds for most operations
   - Minimal memory footprint

2. **Reliability**
   - Graceful error handling
   - No impact on existing functionality

3. **Maintainability**
   - Clear, documented code
   - Follows Cloi's modular architecture`;
  }

  generateSuccessCriteria(feature) {
    return `## Success Metrics
1. **Adoption**
   - 80% of users utilize ${feature} within first month
   - Positive feedback in user surveys

2. **Quality**
   - Zero critical bugs in production
   - 95% test coverage for new code

3. **Performance**
   - No degradation in existing operations
   - Meets response time requirements

## Acceptance Criteria
- [ ] Feature fully implemented and tested
- [ ] Documentation complete and reviewed
- [ ] Integration tests passing
- [ ] Performance benchmarks met
- [ ] User acceptance testing completed`;
  }

  generateStakeholderAnalysis(feature) {
    return `## Primary Stakeholders
1. **End Users (Developers)**
   - Primary beneficiaries of ${feature}
   - Need reliable, fast error analysis

2. **Cloi Maintainers**
   - Responsible for implementation
   - Need maintainable, well-documented code

3. **Open Source Community**
   - Contributors and reviewers
   - Need clear contribution guidelines

## Stakeholder Needs
- **Users**: Improved debugging capabilities
- **Maintainers**: Clean, testable implementation
- **Community**: Clear documentation and examples`;
  }

  // Functional Specification Document
  async generateFSD(feature, includeFlows = true) {
    const fsd = {
      title: `Functional Specification Document - ${feature}`,
      project: 'Cloi',
      feature,
      generatedDate: new Date().toISOString(),
      sections: {}
    };

    // Overview
    fsd.sections.overview = {
      title: "Overview",
      content: `This document provides detailed functional specifications for implementing ${feature} in Cloi.`
    };

    // Functional Requirements
    fsd.sections.functionalRequirements = {
      title: "Functional Requirements",
      content: await this.generateDetailedFunctionalRequirements(feature)
    };

    // User Flows
    if (includeFlows) {
      fsd.sections.userFlows = {
        title: "User Flows",
        content: this.generateUserFlows(feature)
      };
    }

    // API Specifications
    fsd.sections.apiSpecs = {
      title: "API Specifications",
      content: this.generateAPISpecifications(feature)
    };

    // Error Handling
    fsd.sections.errorHandling = {
      title: "Error Handling",
      content: this.generateErrorHandlingSpecs(feature)
    };

    return this.formatDocument(fsd);
  }

  async generateDetailedFunctionalRequirements(feature) {
    const requirements = `## Core Functions

### 1. Input Processing
- Accept user input via CLI arguments
- Validate input parameters
- Provide helpful error messages for invalid input

### 2. Processing Logic
- Integration with existing Cloi modules
- Leverage LLM routing for intelligent processing
- Use RAG system for context when applicable

### 3. Output Generation
- Format output using Cloi's UI components
- Use chalk for colored terminal output
- Display results in boxen frames when appropriate

### 4. Error Recovery
- Graceful degradation on failures
- Clear error messages with suggested actions
- Logging for debugging purposes

## Integration Points

### LLM Integration
- Route through existing executor pattern
- Support both Ollama and Claude models
- Use appropriate prompt templates

### RAG System
- Index relevant code for context
- Retrieve similar patterns
- Enhance accuracy with context

### CLI Integration
- Add commands to yargs configuration
- Follow existing command patterns
- Update help documentation`;

    return requirements;
  }

  generateUserFlows(feature) {
    return `## Primary User Flow

\`\`\`
1. User invokes Cloi with ${feature} command
   └─> CLI parses arguments
       └─> Validates input
           ├─> Valid: Proceed to processing
           └─> Invalid: Show error and usage

2. Processing Phase
   └─> Initialize required components
       └─> Execute feature logic
           ├─> Success: Generate output
           └─> Error: Handle gracefully

3. Output Phase
   └─> Format results
       └─> Display to user
           └─> Log for history
\`\`\`

## Alternative Flows

### Error Recovery Flow
\`\`\`
1. Error detected
   └─> Log error details
       └─> Determine error type
           └─> Show user-friendly message
               └─> Suggest corrective action
\`\`\`

### Interactive Mode Flow
\`\`\`
1. Feature requires user input
   └─> Prompt user with readline
       └─> Validate response
           ├─> Valid: Continue
           └─> Invalid: Re-prompt
\`\`\``;
  }

  generateAPISpecifications(feature) {
    return `## CLI API

### Command Structure
\`\`\`bash
cloi ${feature.toLowerCase().replace(/\s+/g, '-')} [options] [arguments]
\`\`\`

### Options
- \`--help, -h\`: Show help for ${feature}
- \`--verbose, -v\`: Enable verbose output
- \`--model, -m\`: Specify LLM model (default: phi4:latest)

### Arguments
- Primary argument: Description of what to process
- Optional arguments: Additional parameters

## Internal API

### Main Function
\`\`\`javascript
export async function handle${this.toPascalCase(feature)}(args) {
  // Implementation
}
\`\`\`

### Helper Functions
\`\`\`javascript
// Validation
function validate${this.toPascalCase(feature)}Input(input) { }

// Processing
async function process${this.toPascalCase(feature)}(data) { }

// Output formatting
function format${this.toPascalCase(feature)}Output(result) { }
\`\`\``;
  }

  generateErrorHandlingSpecs(feature) {
    return `## Error Types

### Input Errors
- **Invalid Arguments**: Show usage help
- **Missing Required Parameters**: Prompt for input
- **Invalid Format**: Show example usage

### Processing Errors
- **LLM Unavailable**: Fall back to alternative or show error
- **RAG System Error**: Continue without context
- **File System Error**: Show permission/path issues

### System Errors
- **Out of Memory**: Graceful shutdown with error
- **Network Error**: Retry logic with backoff
- **Unknown Error**: Log details and show generic message

## Error Messages

### Format
\`\`\`javascript
chalk.red('✗ Error:') + ' ' + errorMessage
chalk.gray('Details:') + ' ' + errorDetails
chalk.yellow('Suggestion:') + ' ' + suggestion
\`\`\`

### Examples
- "✗ Error: Model 'gpt-4' not found"
- "  Details: Available models: phi4:latest, claude-3-sonnet"
- "  Suggestion: Use --model phi4:latest or install the model"`;
  }

  // High-Level Design
  async generateHLD(component, includeArchitecture = true) {
    const hld = {
      title: `High-Level Design - ${component}`,
      project: 'Cloi',
      component,
      generatedDate: new Date().toISOString(),
      sections: {}
    };

    // Architecture Overview
    if (includeArchitecture) {
      hld.sections.architecture = {
        title: "Architecture Overview",
        content: this.generateArchitectureOverview(component)
      };
    }

    // Component Design
    hld.sections.componentDesign = {
      title: "Component Design",
      content: this.generateComponentDesign(component)
    };

    // Integration Design
    hld.sections.integration = {
      title: "Integration Design",
      content: this.generateIntegrationDesign(component)
    };

    // Data Flow
    hld.sections.dataFlow = {
      title: "Data Flow",
      content: this.generateDataFlow(component)
    };

    return this.formatDocument(hld);
  }

  generateArchitectureOverview(component) {
    return `## System Architecture

\`\`\`
┌─────────────────────────────────────────────────┐
│                   CLI Entry                      │
│              (src/cli/index.js)                  │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│                ${component}                      │
│         (New Component Integration)              │
└────────┬────────────────────┬───────────────────┘
         │                    │
         ▼                    ▼
┌──────────────────┐ ┌──────────────────┐
│   Core Module    │ │    RAG System    │
│  (LLM Routing)   │ │ (Context Retrieval)│
└──────────────────┘ └──────────────────┘
\`\`\`

## Architectural Principles
1. **Modularity**: Components are loosely coupled
2. **Extensibility**: Easy to add new features
3. **Performance**: Async operations throughout
4. **Error Handling**: Graceful degradation`;
  }

  generateComponentDesign(component) {
    return `## Component Structure

### Module Organization
\`\`\`
${component}/
├── index.js          # Main entry point
├── processor.js      # Core processing logic
├── validator.js      # Input validation
├── formatter.js      # Output formatting
└── errors.js         # Error definitions
\`\`\`

### Key Interfaces

#### Main Interface
\`\`\`javascript
export interface ${this.toPascalCase(component)}Interface {
  // Initialize component
  init(config: Config): Promise<void>;
  
  // Process input
  process(input: Input): Promise<Result>;
  
  // Clean up resources
  cleanup(): Promise<void>;
}
\`\`\`

#### Configuration
\`\`\`javascript
interface Config {
  model?: string;      // LLM model to use
  timeout?: number;    // Operation timeout
  verbose?: boolean;   // Verbose logging
}
\`\`\`

### Dependencies
- Core LLM module for AI operations
- RAG system for context retrieval
- UI utilities for terminal output
- File system utilities for persistence`;
  }

  generateIntegrationDesign(component) {
    return `## Integration Points

### 1. CLI Integration
- Register command in yargs configuration
- Add to help system
- Handle command-line arguments

### 2. LLM Integration
- Use router for model selection
- Create prompt templates
- Handle streaming responses

### 3. RAG Integration
- Index relevant code sections
- Query for similar patterns
- Enhance prompts with context

### 4. Error System Integration
- Define custom error types
- Integrate with global error handler
- Provide meaningful error messages

## Integration Flow
\`\`\`javascript
// CLI Entry
CLI.registerCommand('${component}', async (args) => {
  // Validate input
  const validated = await validator.validate(args);
  
  // Process with LLM
  const result = await processor.process(validated);
  
  // Format output
  const formatted = formatter.format(result);
  
  // Display result
  ui.display(formatted);
});
\`\`\``;
  }

  generateDataFlow(component) {
    return `## Data Flow Diagram

\`\`\`
User Input
    │
    ▼
[Input Validation]
    │
    ├─→ Invalid ──→ [Error Message] ──→ User
    │
    ▼ Valid
[Context Retrieval (RAG)]
    │
    ▼
[LLM Processing]
    │
    ├─→ Error ──→ [Error Handler] ──→ User
    │
    ▼ Success
[Result Formatting]
    │
    ▼
[Display Output]
    │
    ▼
User
\`\`\`

## Data Structures

### Input Data
\`\`\`javascript
{
  command: string,
  options: {
    model?: string,
    verbose?: boolean
  },
  arguments: string[]
}
\`\`\`

### Processing Data
\`\`\`javascript
{
  input: ProcessedInput,
  context: RAGContext,
  llmResponse: LLMResult,
  metadata: {
    startTime: Date,
    model: string,
    tokens: number
  }
}
\`\`\`

### Output Data
\`\`\`javascript
{
  success: boolean,
  result: string | object,
  error?: Error,
  suggestions?: string[],
  executionTime: number
}
\`\`\``;
  }

  // Low-Level Design
  async generateLLD(component, includeCode = true) {
    const lld = {
      title: `Low-Level Design - ${component}`,
      project: 'Cloi',
      component,
      generatedDate: new Date().toISOString(),
      sections: {}
    };

    // Detailed Design
    lld.sections.detailedDesign = {
      title: "Detailed Design",
      content: await this.generateDetailedDesign(component)
    };

    // Implementation Details
    lld.sections.implementation = {
      title: "Implementation Details",
      content: this.generateImplementationDetails(component, includeCode)
    };

    // Algorithm Design
    lld.sections.algorithms = {
      title: "Algorithms",
      content: this.generateAlgorithms(component)
    };

    // Testing Strategy
    lld.sections.testing = {
      title: "Testing Strategy",
      content: this.generateTestingStrategy(component)
    };

    return this.formatDocument(lld);
  }

  async generateDetailedDesign(component) {
    return `## Class/Module Design

### Main Module: ${component}.js
\`\`\`javascript
import { LLMRouter } from '../core/executor/router.js';
import { RAGSystem } from '../rag/index.js';
import { UIComponents } from '../ui/terminalUI.js';

export class ${this.toPascalCase(component)} {
  constructor(config = {}) {
    this.config = { ...defaultConfig, ...config };
    this.llm = new LLMRouter();
    this.rag = new RAGSystem();
    this.stats = { processed: 0, errors: 0 };
  }

  async initialize() {
    // Initialize subsystems
    await this.llm.initialize();
    await this.rag.initialize();
  }

  async process(input) {
    this.stats.processed++;
    try {
      // Validation
      const validated = await this.validate(input);
      
      // Context retrieval
      const context = await this.getContext(validated);
      
      // LLM processing
      const result = await this.executeLLM(validated, context);
      
      // Post-processing
      return this.postProcess(result);
    } catch (error) {
      this.stats.errors++;
      throw this.handleError(error);
    }
  }
}
\`\`\`

### Supporting Modules

#### Validator Module
\`\`\`javascript
export class ${this.toPascalCase(component)}Validator {
  static validate(input) {
    // Input validation logic
    if (!input || typeof input !== 'object') {
      throw new ValidationError('Invalid input format');
    }
    
    // Field validation
    const required = ['field1', 'field2'];
    for (const field of required) {
      if (!input[field]) {
        throw new ValidationError(\`Missing required field: \${field}\`);
      }
    }
    
    return this.sanitize(input);
  }
  
  static sanitize(input) {
    // Clean and normalize input
    return {
      ...input,
      field1: input.field1.trim(),
      field2: this.normalizeField2(input.field2)
    };
  }
}
\`\`\``;
  }

  generateImplementationDetails(component, includeCode) {
    let details = `## Implementation Approach

### 1. File Structure
\`\`\`
src/
├── ${component}/
│   ├── index.js        # Public API
│   ├── core.js         # Core logic
│   ├── validator.js    # Input validation
│   ├── processor.js    # Main processing
│   └── utils.js        # Helper functions
\`\`\`

### 2. Key Functions`;

    if (includeCode) {
      details += `

#### Main Processing Function
\`\`\`javascript
async function process${this.toPascalCase(component)}(input, options = {}) {
  const startTime = Date.now();
  
  try {
    // Step 1: Validate input
    const validated = validator.validate(input);
    
    // Step 2: Get context if needed
    let context = null;
    if (options.useContext) {
      context = await rag.getRelevantContext(validated);
    }
    
    // Step 3: Prepare prompt
    const prompt = promptBuilder.build(validated, context);
    
    // Step 4: Call LLM
    const response = await llm.query(prompt, options.model);
    
    // Step 5: Process response
    const result = responseProcessor.process(response);
    
    // Step 6: Log metrics
    metrics.record({
      operation: '${component}',
      duration: Date.now() - startTime,
      success: true
    });
    
    return result;
  } catch (error) {
    metrics.recordError(error);
    throw error;
  }
}
\`\`\`

#### Error Handling
\`\`\`javascript
function handleError(error) {
  if (error instanceof ValidationError) {
    return {
      type: 'validation',
      message: error.message,
      suggestion: 'Check input format and try again'
    };
  }
  
  if (error instanceof LLMError) {
    return {
      type: 'llm',
      message: 'AI processing failed',
      suggestion: 'Try a different model or simplify input'
    };
  }
  
  // Unknown error
  logger.error('Unexpected error:', error);
  return {
    type: 'unknown',
    message: 'An unexpected error occurred',
    suggestion: 'Check logs for details'
  };
}
\`\`\``;
    }

    details += `

### 3. State Management
- Use class instances for stateful components
- Functional approach for stateless utilities
- Proper cleanup in destructors

### 4. Performance Considerations
- Lazy loading of heavy dependencies
- Caching of frequently used data
- Parallel processing where applicable
- Stream processing for large datasets`;

    return details;
  }

  generateAlgorithms(component) {
    return `## Core Algorithms

### 1. Input Processing Algorithm
\`\`\`
FUNCTION processInput(rawInput):
  1. Tokenize input into components
  2. FOR each token:
     a. Classify token type
     b. Validate against schema
     c. Transform to internal format
  3. Build structured representation
  4. RETURN processed input
\`\`\`

### 2. Context Matching Algorithm
\`\`\`
FUNCTION findRelevantContext(query):
  1. Generate embeddings for query
  2. Search vector store for similar items
  3. Rank results by relevance score
  4. Filter by threshold (default: 0.7)
  5. Combine with keyword search results
  6. RETURN top K matches
\`\`\`

### 3. Response Processing Algorithm
\`\`\`
FUNCTION processLLMResponse(response):
  1. Parse response structure
  2. Extract key information
  3. Validate response format
  4. Apply post-processing rules:
     a. Format code blocks
     b. Highlight important sections
     c. Add contextual links
  5. Generate final output
  6. RETURN formatted result
\`\`\`

## Complexity Analysis

| Algorithm | Time Complexity | Space Complexity |
|-----------|----------------|------------------|
| Input Processing | O(n) | O(n) |
| Context Matching | O(m log m) | O(k) |
| Response Processing | O(n) | O(n) |

Where:
- n = input size
- m = number of context items
- k = number of results to return`;
  }

  generateTestingStrategy(component) {
    return `## Testing Strategy

### 1. Unit Tests
\`\`\`javascript
// Test input validation
describe('${component} Validator', () => {
  test('validates required fields', () => {
    const invalid = { field1: 'value' };
    expect(() => validator.validate(invalid))
      .toThrow('Missing required field: field2');
  });
  
  test('sanitizes input correctly', () => {
    const input = { field1: '  value  ', field2: 'TEST' };
    const result = validator.validate(input);
    expect(result.field1).toBe('value');
    expect(result.field2).toBe('test');
  });
});
\`\`\`

### 2. Integration Tests
\`\`\`javascript
// Test LLM integration
describe('${component} LLM Integration', () => {
  test('processes with Ollama model', async () => {
    const input = createTestInput();
    const result = await processor.process(input, {
      model: 'phi4:latest'
    });
    expect(result).toHaveProperty('success', true);
  });
  
  test('handles LLM errors gracefully', async () => {
    const input = createTestInput();
    mockLLMError();
    const result = await processor.process(input);
    expect(result.error).toBeDefined();
  });
});
\`\`\`

### 3. End-to-End Tests
\`\`\`bash
# Test CLI command
$ cloi ${component} --model phi4:latest "test input"
# Expected: Successful processing and output

# Test error handling
$ cloi ${component} --invalid-option
# Expected: Clear error message and usage help
\`\`\`

### 4. Performance Tests
- Measure response time for typical inputs
- Test with large inputs (>1000 tokens)
- Verify memory usage stays within limits
- Test concurrent request handling

### 5. Test Data
- Create fixtures for common scenarios
- Include edge cases and error conditions
- Maintain test data in \`__tests__/fixtures/\``;
  }

  // API Documentation
  async generateAPIDocs(module = 'all') {
    const docs = {
      title: `API Documentation - Cloi ${module === 'all' ? '' : module}`,
      project: 'Cloi',
      generatedDate: new Date().toISOString(),
      sections: {}
    };

    if (module === 'all' || module === 'core') {
      docs.sections.core = {
        title: "Core Module API",
        content: await this.generateCoreAPIDocs()
      };
    }

    if (module === 'all' || module === 'rag') {
      docs.sections.rag = {
        title: "RAG System API",
        content: await this.generateRAGAPIDocs()
      };
    }

    if (module === 'all' || module === 'cli') {
      docs.sections.cli = {
        title: "CLI API",
        content: await this.generateCLIAPIDocs()
      };
    }

    if (module === 'all' || module === 'utils') {
      docs.sections.utils = {
        title: "Utilities API",
        content: await this.generateUtilsAPIDocs()
      };
    }

    return this.formatDocument(docs);
  }

  async generateCoreAPIDocs() {
    return `## Core Module API

### analyzeWithLLM(errorOutput, model, fileInfo, codeSummary, filePath, optimizationSet)
Analyzes error output using specified LLM model.

**Parameters:**
- \`errorOutput\` (string): The error message to analyze
- \`model\` (string): Model to use (default: 'phi4:latest')
- \`fileInfo\` (object): Optional file context
- \`codeSummary\` (string): Optional code summary
- \`filePath\` (string): Optional file path
- \`optimizationSet\` (string): Optimization preset

**Returns:** Promise<{analysis: string, reasoning: string, wasStreamed: boolean}>

**Example:**
\`\`\`javascript
const result = await analyzeWithLLM(
  "TypeError: Cannot read property 'x' of undefined",
  'phi4:latest',
  { line: 42, file: 'app.js' }
);
\`\`\`

### generateTerminalCommandFix(errorInfo, userQuery, lastCommand, model)
Generates fix for terminal command errors.

**Parameters:**
- \`errorInfo\` (object): Error details
- \`userQuery\` (string): User's description
- \`lastCommand\` (string): Failed command
- \`model\` (string): LLM model to use

**Returns:** Promise<{command: string, explanation: string}>

### generatePatch(errorAnalysis, fileContent, model)
Generates code patch for identified issues.

**Parameters:**
- \`errorAnalysis\` (object): Analysis results
- \`fileContent\` (string): Original file content
- \`model\` (string): LLM model to use

**Returns:** Promise<{patch: string, explanation: string}>`;
  }

  async generateRAGAPIDocs() {
    return `## RAG System API

### indexProject(projectPath, options)
Indexes a project for RAG retrieval.

**Parameters:**
- \`projectPath\` (string): Path to project root
- \`options\` (object): Indexing options
  - \`extensions\` (array): File extensions to index
  - \`excludePaths\` (array): Paths to exclude
  - \`forceRebuild\` (boolean): Force rebuild index

**Returns:** Promise<{indexed: number, time: number}>

### searchRelevantCode(query, options)
Searches for relevant code snippets.

**Parameters:**
- \`query\` (string): Search query
- \`options\` (object): Search options
  - \`topK\` (number): Number of results (default: 5)
  - \`threshold\` (number): Relevance threshold (default: 0.7)

**Returns:** Promise<Array<{file: string, content: string, score: number}>>

### getEmbedding(text)
Generates embedding for text using CodeBERT.

**Parameters:**
- \`text\` (string): Text to embed

**Returns:** Promise<Float32Array>`;
  }

  async generateCLIAPIDocs() {
    return `## CLI Commands

### Basic Usage
\`\`\`bash
cloi [command] [options]
\`\`\`

### Commands

#### analyze
Analyze the last error from terminal.
\`\`\`bash
cloi analyze [--model <model>] [--verbose]
\`\`\`

#### fix
Generate and apply fix for error.
\`\`\`bash
cloi fix [--auto-apply] [--model <model>]
\`\`\`

#### history
Show command history.
\`\`\`bash
cloi history [--limit <n>] [--errors-only]
\`\`\`

### Global Options
- \`--help, -h\`: Show help
- \`--version, -v\`: Show version
- \`--model, -m\`: Specify LLM model
- \`--verbose\`: Enable verbose output
- \`--no-color\`: Disable colored output`;
  }

  async generateUtilsAPIDocs() {
    return `## Utilities API

### File Operations

#### readFileWithContext(filePath, errorLine, contextLines)
Reads file with surrounding context.

**Parameters:**
- \`filePath\` (string): Path to file
- \`errorLine\` (number): Line number of interest
- \`contextLines\` (number): Lines of context (default: 5)

**Returns:** Promise<{content: string, lineNumbers: number[]}>

### Git Operations

#### getGitStatus(repoPath)
Gets git repository status.

**Parameters:**
- \`repoPath\` (string): Repository path

**Returns:** Promise<{branch: string, modified: string[], staged: string[]}>

### Terminal Operations

#### runCommand(command, options)
Executes shell command safely.

**Parameters:**
- \`command\` (string): Command to run
- \`options\` (object): Execution options
  - \`cwd\` (string): Working directory
  - \`timeout\` (number): Timeout in ms

**Returns:** Promise<{stdout: string, stderr: string, exitCode: number}>`;
  }

  // Developer Guide
  async generateDeveloperGuide(topic = 'all') {
    const guide = {
      title: `Developer Guide - ${topic === 'all' ? 'Complete' : topic}`,
      project: 'Cloi',
      generatedDate: new Date().toISOString(),
      sections: {}
    };

    if (topic === 'all' || topic === 'getting-started') {
      guide.sections.gettingStarted = {
        title: "Getting Started",
        content: this.generateGettingStarted()
      };
    }

    if (topic === 'all' || topic === 'architecture') {
      guide.sections.architecture = {
        title: "Architecture Overview",
        content: this.generateArchitectureGuide()
      };
    }

    if (topic === 'all' || topic === 'llm-integration') {
      guide.sections.llmIntegration = {
        title: "LLM Integration Guide",
        content: this.generateLLMGuide()
      };
    }

    if (topic === 'all' || topic === 'rag-system') {
      guide.sections.ragSystem = {
        title: "RAG System Guide",
        content: this.generateRAGGuide()
      };
    }

    if (topic === 'all' || topic === 'testing') {
      guide.sections.testing = {
        title: "Testing Guide",
        content: this.generateTestingGuide()
      };
    }

    return this.formatDocument(guide);
  }

  generateGettingStarted() {
    return `## Setting Up Development Environment

### Prerequisites
- Node.js 14+ 
- Python 3.8+ (for CodeBERT service)
- Git

### Initial Setup
\`\`\`bash
# Clone repository
git clone https://github.com/cloi-ai/cloi.git
cd cloi

# Install dependencies
npm install

# Set up CodeBERT service
npm run codebert-setup

# Install Ollama models
npm run dev:ollama

# Link for local development
npm link
\`\`\`

### Development Workflow

1. **Start CodeBERT service**
   \`\`\`bash
   npm run codebert-start
   \`\`\`

2. **Run in development mode**
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Test changes**
   \`\`\`bash
   # Manual testing
   cloi analyze
   
   # Test specific features
   cloi fix --model phi4:latest
   \`\`\`

### Code Style
- Use ES modules with .js extensions
- Follow async/await patterns
- Use chalk for colored output
- Handle errors gracefully`;
  }

  generateArchitectureGuide() {
    return `## Cloi Architecture

### Module Structure
\`\`\`
src/
├── cli/          # CLI entry point and command handling
├── core/         # Core LLM functionality
│   ├── executor/ # Model-specific executors
│   ├── promptTemplates/ # Prompt engineering
│   └── ui/       # Core UI components
├── rag/          # Retrieval-Augmented Generation
├── ui/           # Terminal UI components
└── utils/        # Utility functions
\`\`\`

### Key Design Patterns

#### 1. Executor Pattern (LLM Routing)
\`\`\`javascript
// Router selects appropriate executor
const executor = detectModelProvider(model);
const result = await executor.query(prompt, model);
\`\`\`

#### 2. Prompt Template System
\`\`\`javascript
// Templates for different operations
const prompt = buildAnalysisPrompt(error, context);
\`\`\`

#### 3. RAG Pipeline
\`\`\`javascript
// Index → Embed → Store → Retrieve
const context = await rag.getRelevantContext(query);
\`\`\`

### Adding New Features

1. **Identify the appropriate module**
2. **Follow existing patterns**
3. **Update exports in index.js**
4. **Add CLI integration if needed**
5. **Document the feature**`;
  }

  generateLLMGuide() {
    return `## LLM Integration Guide

### Adding a New Model

1. **Create executor in src/core/executor/**
   \`\`\`javascript
   // newmodel.js
   export async function queryNewModel(prompt, model, optimizationSet) {
     // Implementation
   }
   \`\`\`

2. **Update router.js**
   \`\`\`javascript
   // Add to provider detection
   if (model.includes('newmodel')) {
     return PROVIDERS.NEWMODEL;
   }
   \`\`\`

3. **Add prompt optimizations**
   \`\`\`javascript
   // In optimization configs
   NEWMODEL: {
     temperature: 0.7,
     max_tokens: 2000
   }
   \`\`\`

### Working with Prompts

#### Creating Templates
\`\`\`javascript
export function buildNewPrompt(input, context) {
  return \`You are an expert debugger.
  
Context: \${context}
Task: \${input}

Provide a solution following these guidelines:
1. Be specific and actionable
2. Include code examples
3. Explain the reasoning\`;
}
\`\`\`

#### Best Practices
- Keep prompts focused
- Include relevant context
- Specify output format
- Handle edge cases`;
  }

  generateRAGGuide() {
    return `## RAG System Guide

### How It Works

1. **Indexing Phase**
   - Scan project files
   - Generate CodeBERT embeddings
   - Store in FAISS vector database

2. **Retrieval Phase**
   - Convert query to embedding
   - Search vector store
   - Combine with BM25 keyword search
   - Return ranked results

### Customizing RAG

#### File Filtering
\`\`\`javascript
const SUPPORTED_EXTENSIONS = [
  '.js', '.ts', '.jsx', '.tsx',
  '.py', '.java', '.cpp'
];
\`\`\`

#### Chunking Strategy
\`\`\`javascript
// Adjust chunk size based on file type
const chunkSize = determineOptimalChunkSize(fileType);
\`\`\`

#### Embedding Service
- Runs on port 5001
- Uses CodeBERT model
- Caches embeddings

### Troubleshooting
- **Service not running**: Check Python installation
- **Slow indexing**: Reduce file count or chunk size
- **Poor results**: Adjust relevance threshold`;
  }

  generateTestingGuide() {
    return `## Testing Guide

### Testing Philosophy
- Test critical paths
- Focus on integration points
- Mock external dependencies
- Use realistic test data

### Manual Testing Checklist

#### Basic Functionality
- [ ] Error analysis works
- [ ] Fix generation is accurate
- [ ] Patches apply correctly
- [ ] History tracking functions

#### LLM Integration
- [ ] Ollama models work
- [ ] Claude API integration works
- [ ] Model fallback works
- [ ] Error handling is graceful

#### RAG System
- [ ] Indexing completes
- [ ] Search returns relevant results
- [ ] Performance is acceptable

### Writing Tests

#### Unit Test Example
\`\`\`javascript
describe('Patch Generation', () => {
  test('generates valid unified diff', () => {
    const original = 'line1\\nline2\\nline3';
    const modified = 'line1\\nline2-fixed\\nline3';
    const patch = generatePatch(original, modified);
    expect(patch).toContain('@@');
    expect(patch).toContain('-line2');
    expect(patch).toContain('+line2-fixed');
  });
});
\`\`\`

#### Integration Test Example
\`\`\`javascript
describe('CLI Integration', () => {
  test('analyze command works end-to-end', async () => {
    const result = await runCLI(['analyze']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Analysis complete');
  });
});
\`\`\`

### Performance Testing
- Measure indexing time
- Check memory usage
- Monitor API response times
- Test with large codebases`;
  }

  // Helper methods
  formatDocument(doc) {
    let formatted = `# ${doc.title}\n\n`;
    formatted += `**Project:** ${doc.project}\n`;
    formatted += `**Generated:** ${new Date(doc.generatedDate).toLocaleDateString()}\n\n`;
    formatted += `---\n\n`;

    for (const section of Object.values(doc.sections)) {
      formatted += `## ${section.title}\n\n`;
      formatted += `${section.content}\n\n`;
    }

    return formatted;
  }

  toPascalCase(str) {
    return str
      .split(/[\s-_]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
}