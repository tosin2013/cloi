/**
 * Context Builder for Cloi MCP Server
 * 
 * Builds comprehensive context about the Cloi codebase
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { glob } from 'glob';

export class CloiContextBuilder {
  constructor() {
    // Use environment variable for Cloi project root, with fallbacks
    this.projectRoot = process.env.CLOI_PROJECT_ROOT || 
                      process.env.CLOI_ROOT ||
                      this.findCloiRoot();
    
    // Verify the project root is correctly set
    if (process.env.DEBUG === 'cloi-mcp') {
      console.error(`DEBUG: Using Cloi project root: ${this.projectRoot}`);
    }
    this.contextCache = new Map();
  }

  findCloiRoot() {
    // Try to find the Cloi root by looking for package.json with "cloi" name
    const possiblePaths = [
      process.cwd(),
      path.resolve(process.cwd(), '..'),
      path.resolve(process.cwd(), '../..'),
      '/Users/tosinakinosho/workspaces/cloi' // fallback absolute path
    ];

    for (const testPath of possiblePaths) {
      try {
        const packagePath = path.join(testPath, 'package.json');
        if (fsSync.existsSync(packagePath)) {
          const pkg = JSON.parse(fsSync.readFileSync(packagePath, 'utf-8'));
          if (pkg.name && (pkg.name.includes('cloi') || pkg.description?.includes('debugging'))) {
            return testPath;
          }
        }
      } catch (e) {
        // Continue searching
      }
    }

    // Default fallback
    return '/Users/tosinakinosho/workspaces/cloi';
  }

  async getContext(area = 'all') {
    // Check cache
    if (this.contextCache.has(area)) {
      return this.contextCache.get(area);
    }

    let context = {
      area,
      timestamp: new Date().toISOString(),
      data: {}
    };

    switch (area) {
      case 'architecture':
        context.data = await this.getArchitectureContext();
        break;
      case 'dependencies':
        context.data = await this.getDependenciesContext();
        break;
      case 'patterns':
        context.data = await this.getPatternsContext();
        break;
      case 'llm-flow':
        context.data = await this.getLLMFlowContext();
        break;
      case 'rag-flow':
        context.data = await this.getRAGFlowContext();
        break;
      case 'all':
        context.data = {
          architecture: await this.getArchitectureContext(),
          dependencies: await this.getDependenciesContext(),
          patterns: await this.getPatternsContext(),
          flows: {
            llm: await this.getLLMFlowContext(),
            rag: await this.getRAGFlowContext()
          }
        };
        break;
    }

    // Cache the result
    this.contextCache.set(area, context);
    return context;
  }

  async getArchitectureContext() {
    const architecture = {
      overview: "Cloi is a modular CLI tool for terminal error analysis and debugging",
      modules: {},
      entryPoints: [],
      dataFlow: []
    };

    // Analyze module structure
    const modules = {
      cli: {
        path: 'src/cli',
        description: 'Command-line interface and user interaction',
        mainFiles: ['index.js'],
        dependencies: ['core', 'ui', 'utils']
      },
      core: {
        path: 'src/core',
        description: 'Core LLM functionality and routing',
        mainFiles: ['index.js', 'executor/router.js'],
        dependencies: ['utils', 'ui']
      },
      rag: {
        path: 'src/rag',
        description: 'Retrieval-Augmented Generation system',
        mainFiles: ['index.js', 'embeddings.js', 'vectorStore.js'],
        dependencies: ['utils']
      },
      ui: {
        path: 'src/ui',
        description: 'Terminal UI components',
        mainFiles: ['terminalUI.js'],
        dependencies: []
      },
      utils: {
        path: 'src/utils',
        description: 'Utility functions and helpers',
        mainFiles: ['patch.js', 'gitUtils.js', 'history.js'],
        dependencies: []
      }
    };

    // Get actual file counts
    for (const [name, module] of Object.entries(modules)) {
      const files = await glob(`${path.join(this.projectRoot, module.path)}/**/*.js`);
      architecture.modules[name] = {
        ...module,
        fileCount: files.length,
        exports: await this.getModuleExports(module.path)
      };
    }

    // Entry points
    architecture.entryPoints = [
      {
        file: 'bin/index.js',
        description: 'Main CLI entry point',
        commands: ['analyze', 'fix', 'history']
      }
    ];

    // Data flow
    architecture.dataFlow = [
      {
        name: 'Error Analysis Flow',
        steps: [
          'CLI receives error input',
          'Core analyzes with LLM',
          'RAG provides context if needed',
          'UI displays results'
        ]
      },
      {
        name: 'Fix Generation Flow',
        steps: [
          'Analyze error first',
          'Generate patch with LLM',
          'Apply patch to files',
          'Show results to user'
        ]
      }
    ];

    return architecture;
  }

  async getDependenciesContext() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    // Debug logging if enabled
    if (process.env.DEBUG === 'cloi-mcp') {
      console.error(`DEBUG: Looking for package.json at: ${packageJsonPath}`);
    }
    
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

    const dependencies = {
      runtime: {},
      development: {},
      python: []
    };

    // Runtime dependencies
    for (const [name, version] of Object.entries(packageJson.dependencies || {})) {
      dependencies.runtime[name] = {
        version,
        purpose: this.getDependencyPurpose(name),
        criticalFor: this.getCriticalFeatures(name)
      };
    }

    // Python dependencies
    try {
      const requirementsPath = path.join(this.projectRoot, 'bin/requirements.txt');
      const requirements = await fs.readFile(requirementsPath, 'utf-8');
      dependencies.python = requirements
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => {
          const [pkg, version] = line.split('==');
          return { package: pkg, version: version || 'latest' };
        });
    } catch (error) {
      // No Python requirements
    }

    return dependencies;
  }

  getDependencyPurpose(depName) {
    const purposes = {
      '@anthropic-ai/sdk': 'Claude AI integration',
      'ollama': 'Local LLM integration',
      'faiss-node': 'Vector similarity search for RAG',
      'chalk': 'Terminal output coloring',
      'boxen': 'Terminal UI boxes',
      'yargs': 'Command-line argument parsing',
      '@huggingface/transformers': 'CodeBERT embeddings'
    };
    return purposes[depName] || 'Supporting functionality';
  }

  getCriticalFeatures(depName) {
    const critical = {
      '@anthropic-ai/sdk': ['Claude model support'],
      'ollama': ['Local model support'],
      'faiss-node': ['RAG system', 'Code search'],
      'yargs': ['CLI functionality']
    };
    return critical[depName] || [];
  }

  async getPatternsContext() {
    const patterns = {
      architectural: [
        {
          name: 'Module Pattern',
          description: 'ES modules with clear separation of concerns',
          example: 'Each module exports specific functions via index.js'
        },
        {
          name: 'Executor Pattern',
          description: 'Different executors for different LLM providers',
          location: 'src/core/executor/',
          usage: 'Allows easy addition of new LLM providers'
        },
        {
          name: 'Prompt Template Pattern',
          description: 'Reusable prompt templates for different operations',
          location: 'src/core/promptTemplates/',
          usage: 'Consistent prompt engineering'
        }
      ],
      coding: [
        {
          name: 'Async/Await',
          description: 'All async operations use async/await',
          reason: 'Better error handling and readability'
        },
        {
          name: 'Error Handling',
          description: 'Try-catch blocks with descriptive errors',
          example: 'chalk.red("✗ Error:") for user-facing errors'
        },
        {
          name: 'ES Module Imports',
          description: 'Always use .js extension in imports',
          reason: 'Required for ES modules'
        }
      ],
      ui: [
        {
          name: 'Chalk Coloring',
          description: 'Consistent color scheme for output',
          colors: {
            error: 'red',
            success: 'green',
            warning: 'yellow',
            info: 'cyan'
          }
        },
        {
          name: 'Boxen Formatting',
          description: 'Important information in boxes',
          usage: 'Results, summaries, important messages'
        },
        {
          name: 'Thinking Animation',
          description: 'Animated dots during LLM operations',
          location: 'src/core/ui/thinking.js'
        }
      ]
    };

    return patterns;
  }

  async getLLMFlowContext() {
    const flow = {
      overview: 'LLM operations flow through a router that selects the appropriate executor',
      steps: [],
      components: {},
      decisionPoints: []
    };

    // Main flow steps
    flow.steps = [
      {
        step: 1,
        action: 'Receive prompt and model specification',
        component: 'CLI or API caller'
      },
      {
        step: 2,
        action: 'Router detects model provider',
        component: 'src/core/executor/router.js',
        code: 'detectModelProvider(model)'
      },
      {
        step: 3,
        action: 'Route to appropriate executor',
        component: 'Ollama or Claude executor',
        decision: 'Based on model name pattern'
      },
      {
        step: 4,
        action: 'Apply optimization settings',
        component: 'Model-specific optimizations'
      },
      {
        step: 5,
        action: 'Execute LLM query',
        component: 'Model executor',
        async: true
      },
      {
        step: 6,
        action: 'Process and return response',
        component: 'Response formatter'
      }
    ];

    // Component details
    flow.components = {
      router: {
        file: 'src/core/executor/router.js',
        functions: ['routeModelQuery', 'detectModelProvider'],
        purpose: 'Central routing logic'
      },
      ollamaExecutor: {
        file: 'src/core/executor/ollama.js',
        functions: ['queryOllamaWithTempScript'],
        purpose: 'Handle Ollama model queries'
      },
      claudeExecutor: {
        file: 'src/core/executor/claude.js',
        functions: ['queryClaudeWithTempScript'],
        purpose: 'Handle Claude API queries'
      }
    };

    // Decision points
    flow.decisionPoints = [
      {
        point: 'Model Selection',
        logic: 'If model contains "claude" → Claude, else → Ollama',
        fallback: 'Default to Ollama'
      },
      {
        point: 'Streaming Decision',
        logic: 'If onStreamStart callback provided → Enable streaming',
        impact: 'Real-time output vs batch response'
      }
    ];

    return flow;
  }

  async getRAGFlowContext() {
    const flow = {
      overview: 'RAG system provides context-aware code retrieval using CodeBERT embeddings',
      indexingFlow: [],
      retrievalFlow: [],
      components: {},
      configuration: {}
    };

    // Indexing flow
    flow.indexingFlow = [
      {
        step: 1,
        action: 'Scan project files',
        component: 'File crawler',
        filters: 'Supported extensions only'
      },
      {
        step: 2,
        action: 'Chunk code files',
        component: 'src/rag/chunking.js',
        strategy: 'Semantic boundaries'
      },
      {
        step: 3,
        action: 'Generate embeddings',
        component: 'CodeBERT service',
        endpoint: 'http://localhost:5001'
      },
      {
        step: 4,
        action: 'Store in FAISS index',
        component: 'src/rag/vectorStore.js',
        storage: '.cloi/rag-data/'
      }
    ];

    // Retrieval flow
    flow.retrievalFlow = [
      {
        step: 1,
        action: 'Receive query',
        component: 'RAG interface'
      },
      {
        step: 2,
        action: 'Generate query embedding',
        component: 'CodeBERT service'
      },
      {
        step: 3,
        action: 'Vector similarity search',
        component: 'FAISS index',
        algorithm: 'Cosine similarity'
      },
      {
        step: 4,
        action: 'BM25 keyword search',
        component: 'src/rag/bm25.js',
        algorithm: 'TF-IDF based'
      },
      {
        step: 5,
        action: 'Hybrid ranking',
        component: 'src/rag/hybridSearch.js',
        weights: 'Vector: 0.7, BM25: 0.3'
      },
      {
        step: 6,
        action: 'Return top K results',
        component: 'Result formatter',
        default: 'K = 5'
      }
    ];

    // Components
    flow.components = {
      embeddings: {
        service: 'CodeBERT Python service',
        model: 'microsoft/codebert-base',
        dimension: 768
      },
      vectorStore: {
        library: 'faiss-node',
        indexType: 'Flat',
        persistence: 'File-based'
      },
      chunking: {
        strategy: 'AST-aware for code',
        overlap: '20% overlap between chunks'
      }
    };

    // Configuration
    flow.configuration = {
      supportedExtensions: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java'],
      chunkSize: 'Dynamic based on file type',
      embeddingBatchSize: 32,
      retrievalThreshold: 0.7
    };

    return flow;
  }

  async traceFlow(startPoint, endPoint = '') {
    const traces = {
      'cli command': await this.traceCLICommand(),
      'error analysis': await this.traceErrorAnalysis(),
      'fix generation': await this.traceFixGeneration(),
      'rag query': await this.traceRAGQuery()
    };

    const trace = traces[startPoint.toLowerCase()] || {
      error: `Unknown start point: ${startPoint}`,
      availableStartPoints: Object.keys(traces)
    };

    if (endPoint && trace.steps) {
      // Filter to end point if specified
      const endIndex = trace.steps.findIndex(s => 
        s.component.toLowerCase().includes(endPoint.toLowerCase())
      );
      if (endIndex !== -1) {
        trace.steps = trace.steps.slice(0, endIndex + 1);
      }
    }

    return trace;
  }

  async traceCLICommand() {
    return {
      startPoint: 'CLI Command Entry',
      flow: 'Terminal → CLI → Core → Output',
      steps: [
        {
          location: 'Terminal',
          action: 'User types: cloi analyze',
          next: 'bin/index.js'
        },
        {
          location: 'bin/index.js',
          action: 'Node.js entry point',
          code: '#!/usr/bin/env node',
          next: 'src/cli/index.js'
        },
        {
          location: 'src/cli/index.js',
          action: 'Parse arguments with yargs',
          component: 'CLI parser',
          next: 'Command handler'
        },
        {
          location: 'Command handler',
          action: 'Execute specific command logic',
          branches: {
            analyze: 'handleAnalyze()',
            fix: 'handleFix()',
            history: 'showHistory()'
          }
        },
        {
          location: 'Core module',
          action: 'Process with LLM/RAG',
          async: true,
          next: 'UI module'
        },
        {
          location: 'UI module',
          action: 'Format and display results',
          component: 'terminalUI.js',
          output: 'Terminal'
        }
      ]
    };
  }

  async traceErrorAnalysis() {
    return {
      startPoint: 'Error Analysis',
      flow: 'Error Input → Analysis → LLM → Results',
      steps: [
        {
          location: 'CLI handler',
          action: 'Receive error text',
          function: 'handleAnalyze()'
        },
        {
          location: 'src/core/index.js',
          action: 'Call analyzeWithLLM()',
          parameters: ['errorOutput', 'model', 'fileInfo']
        },
        {
          location: 'Prompt builder',
          action: 'Build analysis prompt',
          component: 'src/core/promptTemplates/analyze.js'
        },
        {
          location: 'Router',
          action: 'Route to model executor',
          decision: 'Ollama or Claude'
        },
        {
          location: 'Executor',
          action: 'Query LLM',
          async: true,
          timeout: '30 seconds'
        },
        {
          location: 'Response processor',
          action: 'Parse LLM response',
          format: 'JSON with analysis and reasoning'
        },
        {
          location: 'UI formatter',
          action: 'Format for display',
          output: 'Colored terminal output'
        }
      ]
    };
  }

  async traceFixGeneration() {
    return {
      startPoint: 'Fix Generation',
      flow: 'Analysis → Patch Generation → Application',
      steps: [
        {
          location: 'Fix command',
          action: 'Start fix generation',
          prerequisite: 'Error analysis complete'
        },
        {
          location: 'src/core/index.js',
          action: 'Call generatePatch()',
          inputs: ['errorAnalysis', 'fileContent', 'model']
        },
        {
          location: 'File reader',
          action: 'Read target file content',
          component: 'src/utils/cliTools.js'
        },
        {
          location: 'Prompt builder',
          action: 'Build patch prompt',
          component: 'src/core/promptTemplates/patch.js'
        },
        {
          location: 'LLM executor',
          action: 'Generate fix with LLM',
          output: 'Unified diff format'
        },
        {
          location: 'Patch validator',
          action: 'Validate generated patch',
          checks: ['Syntax', 'Applicability']
        },
        {
          location: 'UI',
          action: 'Show patch to user',
          interactive: 'Ask for confirmation'
        },
        {
          location: 'Patch applicator',
          action: 'Apply patch to file',
          component: 'src/utils/patch.js',
          rollback: 'Available on failure'
        }
      ]
    };
  }

  async traceRAGQuery() {
    return {
      startPoint: 'RAG Query',
      flow: 'Query → Embedding → Search → Results',
      steps: [
        {
          location: 'RAG interface',
          action: 'Receive search query',
          component: 'src/rag/index.js'
        },
        {
          location: 'Query processor',
          action: 'Prepare query for search',
          function: 'prepareQueryForSearch()'
        },
        {
          location: 'CodeBERT service',
          action: 'Generate query embedding',
          endpoint: 'POST /embed',
          dimension: 768
        },
        {
          location: 'FAISS search',
          action: 'Vector similarity search',
          component: 'src/rag/vectorStore.js',
          algorithm: 'L2 distance'
        },
        {
          location: 'BM25 search',
          action: 'Keyword-based search',
          component: 'src/rag/bm25.js',
          parallel: true
        },
        {
          location: 'Hybrid ranker',
          action: 'Combine and rank results',
          weights: {vector: 0.7, bm25: 0.3}
        },
        {
          location: 'Result processor',
          action: 'Format and return top K',
          default: 'K = 5',
          output: 'Relevant code chunks'
        }
      ]
    };
  }

  async getModuleExports(modulePath) {
    try {
      const indexPath = path.join(this.projectRoot, modulePath, 'index.js');
      const content = await fs.readFile(indexPath, 'utf-8');
      
      // Simple export extraction
      const exports = [];
      const exportMatches = content.matchAll(/export\s+(?:async\s+)?(?:function|const|let|var)\s+(\w+)/g);
      for (const match of exportMatches) {
        exports.push(match[1]);
      }
      
      // Also check for export { ... } statements
      const namedExportMatch = content.match(/export\s*{([^}]+)}/);
      if (namedExportMatch) {
        const names = namedExportMatch[1].split(',').map(n => n.trim());
        exports.push(...names);
      }
      
      return exports;
    } catch (error) {
      return [];
    }
  }
}