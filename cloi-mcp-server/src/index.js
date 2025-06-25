#!/usr/bin/env node
/**
 * Cloi Development MCP Server
 * 
 * An MCP server that assists with Cloi development by providing:
 * - Codebase analysis and understanding
 * - Feature development assistance
 * - Test failure debugging
 * - Comprehensive documentation generation
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from "@modelcontextprotocol/sdk/types.js";

// Import analyzers and generators
import { CloiCodebaseAnalyzer } from './analyzers/codebaseAnalyzer.js';
import { FeatureDevelopmentAssistant } from './assistants/featureDevelopment.js';
import { TestFailureAnalyzer } from './analyzers/testFailure.js';
import { DocumentationGenerator } from './generators/documentation.js';
import { CloiContextBuilder } from './context/contextBuilder.js';
import { GitHubCLI } from './tools/githubCLI.js';

// Repository configuration discovered from analysis
const REPO_CONFIG = {
  name: "cloi",
  type: "CLI Tool",
  framework: "Node.js",
  language: "JavaScript (ES Modules)",
  domain: "Terminal Error Analysis & Debugging",
  architecture: "Modular",
  codebaseContext: {
    modules: {
      core: {
        description: "LLM integration and routing",
        components: ["executor/router.js", "executor/ollama.js", "executor/claude.js"],
        patterns: ["Strategy pattern for model selection", "Prompt templates"]
      },
      rag: {
        description: "Retrieval-Augmented Generation with CodeBERT",
        components: ["indexer.js", "retriever.js", "embeddings.js", "vectorStore.js"],
        patterns: ["FAISS vector search", "BM25 keyword search", "Hybrid retrieval"]
      },
      cli: {
        description: "Command-line interface and user interaction",
        components: ["index.js"],
        patterns: ["Interactive CLI loop", "Command parsing"]
      },
      utils: {
        description: "Helper utilities",
        components: ["patch.js", "gitUtils.js", "history.js", "terminalLogger.js"],
        patterns: ["File patching", "Git integration", "Terminal logging"]
      }
    },
    llmIntegration: {
      providers: ["Ollama (local)", "Claude (API)"],
      routing: "Dynamic based on model name",
      promptTemplates: ["analyze", "classify", "command", "patch"]
    },
    testingPatterns: {
      framework: "None currently",
      approach: "Manual testing recommended"
    }
  }
};

// Initialize components
const codebaseAnalyzer = new CloiCodebaseAnalyzer();
const featureAssistant = new FeatureDevelopmentAssistant(REPO_CONFIG);
const testAnalyzer = new TestFailureAnalyzer(REPO_CONFIG);
const docGenerator = new DocumentationGenerator(REPO_CONFIG);
const contextBuilder = new CloiContextBuilder();
const githubCLI = new GitHubCLI();

// Create MCP server
const server = new Server(
  {
    name: "cloi-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const tools = [
  // Codebase Analysis Tools
  {
    name: "analyze_cloi_module",
    description: "Analyze a specific Cloi module to understand its structure and patterns",
    inputSchema: {
      type: "object",
      properties: {
        module: {
          type: "string",
          description: "Module name (core, rag, cli, utils)",
          enum: ["core", "rag", "cli", "utils"]
        },
        depth: {
          type: "string",
          description: "Analysis depth",
          enum: ["overview", "detailed", "deep"],
          default: "detailed"
        }
      },
      required: ["module"]
    }
  },
  {
    name: "find_code_patterns",
    description: "Find code patterns and examples in Cloi codebase",
    inputSchema: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "Pattern to search for (e.g., 'error handling', 'LLM routing', 'prompt template')"
        },
        context: {
          type: "boolean",
          description: "Include surrounding code context",
          default: true
        }
      },
      required: ["pattern"]
    }
  },
  
  // Feature Development Tools
  {
    name: "suggest_feature_implementation",
    description: "Get implementation suggestions for a new Cloi feature",
    inputSchema: {
      type: "object",
      properties: {
        feature: {
          type: "string",
          description: "Description of the feature to implement"
        },
        type: {
          type: "string",
          description: "Feature type",
          enum: ["command", "llm-integration", "utility", "ui-component", "error-handler"],
          default: "utility"
        }
      },
      required: ["feature"]
    }
  },
  {
    name: "generate_cloi_boilerplate",
    description: "Generate boilerplate code following Cloi patterns",
    inputSchema: {
      type: "object",
      properties: {
        component: {
          type: "string",
          description: "Component type to generate"
        },
        name: {
          type: "string",
          description: "Name for the new component"
        },
        module: {
          type: "string",
          description: "Target module",
          enum: ["core", "rag", "cli", "utils"]
        }
      },
      required: ["component", "name", "module"]
    }
  },
  
  // Test Failure Analysis Tools
  {
    name: "analyze_test_failure",
    description: "Analyze test failure or error with Cloi codebase context",
    inputSchema: {
      type: "object",
      properties: {
        error: {
          type: "string",
          description: "Error message or stack trace"
        },
        context: {
          type: "string",
          description: "Additional context about when the error occurred"
        },
        file: {
          type: "string",
          description: "File where error occurred (optional)"
        }
      },
      required: ["error"]
    }
  },
  {
    name: "suggest_fix",
    description: "Get fix suggestions based on Cloi patterns",
    inputSchema: {
      type: "object",
      properties: {
        issue: {
          type: "string",
          description: "Description of the issue"
        },
        code: {
          type: "string",
          description: "Relevant code snippet (optional)"
        }
      },
      required: ["issue"]
    }
  },
  
  // Documentation Generation Tools
  {
    name: "generate_brd",
    description: "Generate Business Requirements Document for Cloi features",
    inputSchema: {
      type: "object",
      properties: {
        feature: {
          type: "string",
          description: "Feature name or description"
        },
        scope: {
          type: "string",
          description: "Scope of the feature",
          enum: ["core", "enhancement", "integration"],
          default: "enhancement"
        }
      },
      required: ["feature"]
    }
  },
  {
    name: "generate_fsd",
    description: "Generate Functional Specification Document",
    inputSchema: {
      type: "object",
      properties: {
        feature: {
          type: "string",
          description: "Feature to document"
        },
        includeFlows: {
          type: "boolean",
          description: "Include user flow diagrams",
          default: true
        }
      },
      required: ["feature"]
    }
  },
  {
    name: "generate_hld",
    description: "Generate High-Level Design document",
    inputSchema: {
      type: "object",
      properties: {
        component: {
          type: "string",
          description: "Component or feature for HLD"
        },
        includeArchitecture: {
          type: "boolean",
          description: "Include architecture diagrams",
          default: true
        }
      },
      required: ["component"]
    }
  },
  {
    name: "generate_lld",
    description: "Generate Low-Level Design document with implementation details",
    inputSchema: {
      type: "object",
      properties: {
        component: {
          type: "string",
          description: "Component for detailed design"
        },
        includeCode: {
          type: "boolean",
          description: "Include code examples",
          default: true
        }
      },
      required: ["component"]
    }
  },
  {
    name: "generate_api_docs",
    description: "Generate API documentation for Cloi modules",
    inputSchema: {
      type: "object",
      properties: {
        module: {
          type: "string",
          description: "Module to document",
          enum: ["core", "rag", "cli", "utils", "all"],
          default: "all"
        }
      }
    }
  },
  {
    name: "generate_developer_guide",
    description: "Generate developer guide for contributing to Cloi",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "Specific topic (optional)",
          enum: ["getting-started", "architecture", "llm-integration", "rag-system", "testing", "all"],
          default: "all"
        }
      }
    }
  },
  
  // Test Scenario Generation Tools
  {
    name: "generate_test_scenarios",
    description: "Generate CLI test scenarios for Cloi features",
    inputSchema: {
      type: "object",
      properties: {
        feature: {
          type: "string",
          description: "Feature to test (e.g., 'error analysis', 'patch generation')"
        },
        scenarioType: {
          type: "string",
          description: "Type of test scenarios",
          enum: ["unit", "integration", "end-to-end", "error-cases", "all"],
          default: "all"
        }
      },
      required: ["feature"]
    }
  },
  {
    name: "create_test_suite",
    description: "Create comprehensive test suite for Cloi module",
    inputSchema: {
      type: "object",
      properties: {
        module: {
          type: "string",
          description: "Module to test",
          enum: ["core", "rag", "cli", "utils"],
          default: "core"
        },
        includeFixtures: {
          type: "boolean",
          description: "Include test fixtures and mock data",
          default: true
        }
      },
      required: ["module"]
    }
  },
  
  // Context and Navigation Tools
  {
    name: "get_cloi_context",
    description: "Get comprehensive context about Cloi codebase",
    inputSchema: {
      type: "object",
      properties: {
        area: {
          type: "string",
          description: "Specific area of interest",
          enum: ["architecture", "dependencies", "patterns", "llm-flow", "rag-flow", "all"],
          default: "all"
        }
      }
    }
  },
  {
    name: "trace_execution_flow",
    description: "Trace execution flow through Cloi components",
    inputSchema: {
      type: "object",
      properties: {
        startPoint: {
          type: "string",
          description: "Starting point (e.g., 'cli command', 'error analysis')"
        },
        endPoint: {
          type: "string",
          description: "End point (optional)"
        }
      },
      required: ["startPoint"]
    }
  },
  
  // GitHub CLI Tool
  {
    name: "github_cli_command",
    description: "Execute GitHub CLI commands for repository management and workflow operations. By default uses CLOI_PROJECT_ROOT as working directory.",
    inputSchema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "GitHub CLI command to execute (e.g., 'run list', 'run view 12345', 'pr list')"
        },
        args: {
          type: "array",
          description: "Additional arguments for the command",
          items: { type: "string" }
        },
        repository: {
          type: "string",
          description: "Repository in OWNER/REPO format (optional, for commands that support -R flag)"
        }
      },
      required: ["command"]
    }
  }
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const args = request.params.arguments || {};
  
  return await handleToolCall(toolName, args);
});

// Tool implementation handler
async function handleToolCall(toolName, args) {
  try {
    let result;
    
    switch (toolName) {
      // Codebase Analysis
      case "analyze_cloi_module":
        result = await codebaseAnalyzer.analyzeModule(args.module, args.depth);
        break;
      case "find_code_patterns":
        result = await codebaseAnalyzer.findPatterns(args.pattern, args.context);
        break;
        
      // Feature Development
      case "suggest_feature_implementation":
        result = await featureAssistant.suggestImplementation(args.feature, args.type);
        break;
      case "generate_cloi_boilerplate":
        result = await featureAssistant.generateBoilerplate(args.component, args.name, args.module);
        break;
        
      // Test Failure Analysis
      case "analyze_test_failure":
        result = await testAnalyzer.analyzeFailure(args.error, args.context, args.file);
        break;
      case "suggest_fix":
        result = await testAnalyzer.suggestFix(args.issue, args.code);
        break;
        
      // Documentation Generation
      case "generate_brd":
        result = await docGenerator.generateBRD(args.feature, args.scope);
        break;
      case "generate_fsd":
        result = await docGenerator.generateFSD(args.feature, args.includeFlows);
        break;
      case "generate_hld":
        result = await docGenerator.generateHLD(args.component, args.includeArchitecture);
        break;
      case "generate_lld":
        result = await docGenerator.generateLLD(args.component, args.includeCode);
        break;
      case "generate_api_docs":
        result = await docGenerator.generateAPIDocs(args.module);
        break;
      case "generate_developer_guide":
        result = await docGenerator.generateDeveloperGuide(args.topic);
        break;
        
      // Test Scenario Generation
      case "generate_test_scenarios":
        result = await generateTestScenarios(args.feature, args.scenarioType);
        break;
      case "create_test_suite":
        result = await createTestSuite(args.module, args.includeFixtures);
        break;
        
      // Context and Navigation
      case "get_cloi_context":
        result = await contextBuilder.getContext(args.area);
        break;
      case "trace_execution_flow":
        result = await contextBuilder.traceFlow(args.startPoint, args.endPoint);
        break;
        
      // GitHub CLI
      case "github_cli_command":
        result = await githubCLI.executeCommand(args.command, args.args, args.repository);
        break;
        
      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${toolName}`
        );
    }
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error.message}`
    );
  }
}

// Test Scenario Generation Methods
async function generateTestScenarios(feature, scenarioType = 'all') {
  const scenarios = {
    feature,
    scenarioType,
    generated: new Date().toISOString(),
    scenarios: []
  };

  const featureTests = {
    'error analysis': {
      unit: [
        {
          name: 'test_error_parsing',
          description: 'Test parsing of different error formats',
          setup: 'Mock error inputs',
          test: 'Verify correct classification and extraction',
          assertions: ['Error type identified', 'Line numbers extracted', 'File paths found']
        },
        {
          name: 'test_llm_prompt_building',
          description: 'Test analysis prompt construction',
          setup: 'Sample error with context',
          test: 'buildAnalysisPrompt() produces correct format',
          assertions: ['Prompt contains error text', 'Context included', 'Instructions clear']
        }
      ],
      integration: [
        {
          name: 'test_llm_integration',
          description: 'Test end-to-end LLM analysis',
          setup: 'Start with known error',
          test: 'analyzeWithLLM() returns valid analysis',
          assertions: ['Analysis is not empty', 'Reasoning provided', 'No errors thrown']
        }
      ],
      'end-to-end': [
        {
          name: 'test_cli_analyze_command',
          description: 'Test full analyze command flow',
          command: 'cloi analyze',
          input: 'Sample error from terminal',
          expected: 'Analysis displayed with formatting'
        }
      ],
      'error-cases': [
        {
          name: 'test_malformed_error_handling',
          description: 'Test handling of malformed error input',
          input: 'Random text, not an error',
          expected: 'Graceful handling with helpful message'
        }
      ]
    },
    'patch generation': {
      unit: [
        {
          name: 'test_patch_format_validation',
          description: 'Test unified diff format validation',
          setup: 'Generate sample patch',
          test: 'Verify unified diff format compliance',
          assertions: ['Header present', 'Line numbers correct', 'Context included']
        }
      ],
      integration: [
        {
          name: 'test_patch_application',
          description: 'Test applying generated patches',
          setup: 'Create test file with known issue',
          test: 'Generate and apply patch',
          assertions: ['Patch applies cleanly', 'Issue is fixed', 'No syntax errors']
        }
      ]
    },
    'rag system': {
      unit: [
        {
          name: 'test_embedding_generation',
          description: 'Test CodeBERT embedding generation',
          setup: 'Sample code snippet',
          test: 'generateEmbedding() returns valid vector',
          assertions: ['Vector has correct dimensions', 'No NaN values', 'Consistent results']
        }
      ],
      integration: [
        {
          name: 'test_vector_search',
          description: 'Test FAISS vector search',
          setup: 'Indexed test codebase',
          test: 'Search for similar code patterns',
          assertions: ['Results returned', 'Relevance scores reasonable', 'Performance acceptable']
        }
      ]
    }
  };

  const requestedTests = featureTests[feature.toLowerCase()] || {
    unit: [{ name: 'generic_test', description: `Generic test for ${feature}` }]
  };

  if (scenarioType === 'all') {
    for (const [type, tests] of Object.entries(requestedTests)) {
      scenarios.scenarios.push({
        type,
        tests: tests.map(test => ({
          ...test,
          framework: 'Manual CLI testing',
          executable: generateExecutableTest(test, feature)
        }))
      });
    }
  } else {
    const tests = requestedTests[scenarioType] || [];
    scenarios.scenarios.push({
      type: scenarioType,
      tests: tests.map(test => ({
        ...test,
        framework: 'Manual CLI testing',
        executable: generateExecutableTest(test, feature)
      }))
    });
  }

  return scenarios;
}

function generateExecutableTest(test, feature) {
  if (test.command) {
    // CLI command test
    return {
      type: 'cli',
      steps: [
        `# Test: ${test.name}`,
        `# ${test.description}`,
        `echo "Running: ${test.command}"`,
        test.command,
        `# Expected: ${test.expected || 'Success'}`
      ].join('\n')
    };
  } else {
    // Manual test procedure
    return {
      type: 'manual',
      procedure: [
        `1. Setup: ${test.setup || 'Prepare test environment'}`,
        `2. Execute: ${test.test || 'Run the test case'}`,
        `3. Verify: ${test.assertions ? test.assertions.join(', ') : 'Check results'}`,
        `4. Cleanup: Reset test environment`
      ].join('\n')
    };
  }
}

async function createTestSuite(module, includeFixtures = true) {
  const testSuite = {
    module,
    generatedDate: new Date().toISOString(),
    structure: {},
    fixtures: {},
    runCommands: []
  };

  // Define test structure for each module
  const moduleTests = {
    core: {
      files: [
        'core/llm-routing.test.js',
        'core/prompt-templates.test.js',
        'core/error-analysis.test.js'
      ],
      testTypes: ['unit', 'integration'],
      dependencies: ['Mock LLM responses', 'Sample error data']
    },
    rag: {
      files: [
        'rag/embeddings.test.js',
        'rag/vector-search.test.js',
        'rag/hybrid-search.test.js'
      ],
      testTypes: ['unit', 'integration'],
      dependencies: ['Test codebase', 'Mock CodeBERT service']
    },
    cli: {
      files: [
        'cli/command-parsing.test.js',
        'cli/user-interaction.test.js',
        'cli/end-to-end.test.js'
      ],
      testTypes: ['unit', 'integration', 'e2e'],
      dependencies: ['Mock terminal input', 'Test commands']
    },
    utils: {
      files: [
        'utils/file-operations.test.js',
        'utils/git-operations.test.js',
        'utils/patch-utilities.test.js'
      ],
      testTypes: ['unit'],
      dependencies: ['Test files', 'Mock git repository']
    }
  };

  testSuite.structure = moduleTests[module] || moduleTests.core;

  if (includeFixtures) {
    testSuite.fixtures = generateTestFixtures(module);
  }

  // Add run commands
  testSuite.runCommands = [
    '# Manual test execution commands',
    '# Note: Cloi currently uses manual testing',
    '',
    '# Test error analysis',
    'cloi analyze "TypeError: Cannot read property \'x\' of undefined"',
    '',
    '# Test fix generation',
    'echo "const obj = {}; console.log(obj.x.y);" > test-file.js',
    'cloi fix test-file.js',
    '',
    '# Test history functionality',
    'cloi history --limit 5',
    '',
    '# Test with different models',
    'cloi analyze --model phi4:latest "SyntaxError: Unexpected token"',
    '',
    '# Clean up',
    'rm -f test-file.js'
  ];

  return testSuite;
}

function generateTestFixtures(module) {
  const fixtures = {
    core: {
      'sample-errors.js': `// Sample errors for testing
export const SAMPLE_ERRORS = {
  syntaxError: "SyntaxError: Unexpected token '}' at line 42",
  typeError: "TypeError: Cannot read property 'length' of undefined at app.js:15",
  referenceError: "ReferenceError: myFunction is not defined at index.js:8"
};`,
      'mock-llm-responses.js': `// Mock LLM responses for testing
export const MOCK_RESPONSES = {
  analysis: {
    response: "The error indicates a null pointer exception...",
    reasoning: "The variable was not properly initialized..."
  }
};`
    },
    rag: {
      'test-codebase/': {
        'sample.js': 'function testFunction() { return "test"; }',
        'error.js': 'const obj = null; obj.prop; // This will error'
      },
      'expected-embeddings.json': '{"test": [0.1, 0.2, 0.3]}'
    },
    cli: {
      'test-commands.sh': `#!/bin/bash
# Test CLI commands
echo "Testing basic functionality..."
cloi --help
cloi --version`,
      'sample-inputs.txt': 'Sample error messages for testing CLI'
    },
    utils: {
      'test-files/': {
        'original.js': 'const x = 1;\nconsole.log(x);',
        'modified.js': 'const x = 2;\nconsole.log(x);'
      }
    }
  };

  return fixtures[module] || {};
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Cloi MCP Server running...");
}

main().catch(console.error);