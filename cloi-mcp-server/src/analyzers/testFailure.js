/**
 * Test Failure Analyzer for Cloi
 * 
 * Analyzes test failures and errors with Cloi codebase context
 */

import fs from 'fs/promises';
import path from 'path';

export class TestFailureAnalyzer {
  constructor(repoConfig) {
    this.repoConfig = repoConfig;
    // Use environment variable for Cloi project root, with fallback
    this.projectRoot = process.env.CLOI_PROJECT_ROOT || 
                      process.env.CLOI_ROOT ||
                      path.resolve(process.cwd(), '..');
    
    this.errorPatterns = this.initializeErrorPatterns();
  }

  initializeErrorPatterns() {
    return {
      importError: {
        pattern: /Cannot find module|Module not found|Cannot resolve/i,
        category: 'import',
        solutions: ['Check file paths', 'Verify module installation', 'Check import syntax']
      },
      syntaxError: {
        pattern: /SyntaxError|Unexpected token|Parsing error/i,
        category: 'syntax',
        solutions: ['Check syntax', 'Verify ES module syntax', 'Check for missing semicolons']
      },
      asyncError: {
        pattern: /UnhandledPromiseRejection|await is only valid|async/i,
        category: 'async',
        solutions: ['Add async keyword', 'Handle promise rejection', 'Add try-catch block']
      },
      typeError: {
        pattern: /TypeError|undefined is not|Cannot read property/i,
        category: 'type',
        solutions: ['Check variable initialization', 'Verify object properties', 'Add null checks']
      },
      ragError: {
        pattern: /FAISS|embedding|vector|CodeBERT/i,
        category: 'rag',
        solutions: ['Check CodeBERT service', 'Verify embeddings', 'Check vector store']
      },
      llmError: {
        pattern: /Ollama|Claude|model|prompt/i,
        category: 'llm',
        solutions: ['Check model availability', 'Verify API keys', 'Check prompt format']
      }
    };
  }

  async analyzeFailure(errorMessage, context = '', filePath = '') {
    const analysis = {
      error: errorMessage,
      context,
      file: filePath,
      category: 'unknown',
      rootCause: '',
      affectedComponents: [],
      suggestedFixes: [],
      relatedCode: [],
      preventionTips: []
    };

    // Categorize error
    analysis.category = this.categorizeError(errorMessage);
    
    // Extract error details
    const errorDetails = this.extractErrorDetails(errorMessage);
    analysis.rootCause = errorDetails.rootCause;
    
    // Find affected components
    analysis.affectedComponents = await this.findAffectedComponents(errorMessage, filePath);
    
    // Generate fix suggestions based on Cloi patterns
    analysis.suggestedFixes = await this.generateFixSuggestions(
      analysis.category,
      errorDetails,
      filePath
    );
    
    // Find related code
    if (filePath) {
      analysis.relatedCode = await this.findRelatedCode(filePath, errorDetails);
    }
    
    // Add prevention tips
    analysis.preventionTips = this.generatePreventionTips(analysis.category);

    return analysis;
  }

  categorizeError(errorMessage) {
    for (const [key, pattern] of Object.entries(this.errorPatterns)) {
      if (pattern.pattern.test(errorMessage)) {
        return pattern.category;
      }
    }
    return 'unknown';
  }

  extractErrorDetails(errorMessage) {
    const details = {
      rootCause: '',
      lineNumber: null,
      functionName: '',
      moduleName: ''
    };

    // Extract line number
    const lineMatch = errorMessage.match(/line (\d+)|:(\d+):/);
    if (lineMatch) {
      details.lineNumber = parseInt(lineMatch[1] || lineMatch[2]);
    }

    // Extract function name
    const funcMatch = errorMessage.match(/at (\w+)\s*\(|function (\w+)/);
    if (funcMatch) {
      details.functionName = funcMatch[1] || funcMatch[2];
    }

    // Extract module name
    const moduleMatch = errorMessage.match(/from ['"](.+?)['"]/);
    if (moduleMatch) {
      details.moduleName = moduleMatch[1];
    }

    // Determine root cause
    if (errorMessage.includes('Cannot find module')) {
      details.rootCause = `Module '${details.moduleName}' not found`;
    } else if (errorMessage.includes('is not a function')) {
      details.rootCause = 'Attempting to call a non-function value';
    } else if (errorMessage.includes('undefined')) {
      details.rootCause = 'Accessing undefined value';
    } else {
      details.rootCause = errorMessage.split('\n')[0];
    }

    return details;
  }

  async findAffectedComponents(errorMessage, filePath) {
    const components = [];

    // Check which Cloi modules might be affected
    if (errorMessage.includes('ollama') || errorMessage.includes('claude')) {
      components.push({
        module: 'core',
        component: 'LLM executor',
        path: 'src/core/executor/'
      });
    }

    if (errorMessage.includes('embedding') || errorMessage.includes('FAISS')) {
      components.push({
        module: 'rag',
        component: 'RAG system',
        path: 'src/rag/'
      });
    }

    if (errorMessage.includes('terminal') || errorMessage.includes('UI')) {
      components.push({
        module: 'ui',
        component: 'Terminal UI',
        path: 'src/ui/'
      });
    }

    if (filePath) {
      const module = this.identifyModule(filePath);
      if (module) {
        components.push({
          module: module.name,
          component: module.component,
          path: module.path
        });
      }
    }

    return components;
  }

  identifyModule(filePath) {
    for (const [moduleName, modulePath] of Object.entries({
      core: 'src/core',
      rag: 'src/rag',
      cli: 'src/cli',
      utils: 'src/utils',
      ui: 'src/ui'
    })) {
      if (filePath.includes(modulePath)) {
        return {
          name: moduleName,
          path: modulePath,
          component: this.getComponentName(filePath, moduleName)
        };
      }
    }
    return null;
  }

  getComponentName(filePath, moduleName) {
    const fileName = path.basename(filePath, '.js');
    const componentMap = {
      core: {
        'router': 'Model Router',
        'ollama': 'Ollama Executor',
        'claude': 'Claude Executor'
      },
      rag: {
        'index': 'RAG System',
        'embeddings': 'Embeddings Service',
        'vectorStore': 'Vector Store'
      },
      cli: {
        'index': 'CLI Entry Point'
      }
    };

    return componentMap[moduleName]?.[fileName] || fileName;
  }

  async generateFixSuggestions(category, errorDetails, filePath) {
    const suggestions = [];

    switch (category) {
      case 'import':
        suggestions.push({
          fix: "Check import path and file extension",
          code: `// Ensure .js extension for ES modules\nimport { function } from './module.js'; // Not './module'`,
          reason: "Cloi uses ES modules which require explicit .js extensions"
        });
        
        if (errorDetails.moduleName && !errorDetails.moduleName.startsWith('.')) {
          suggestions.push({
            fix: "Install missing dependency",
            code: `npm install ${errorDetails.moduleName}`,
            reason: "External module not found in node_modules"
          });
        }
        break;

      case 'async':
        suggestions.push({
          fix: "Add async keyword to function",
          code: `// Change this:\nfunction ${errorDetails.functionName || 'myFunction'}() {\n  await someAsyncCall();\n}\n\n// To this:\nasync function ${errorDetails.functionName || 'myFunction'}() {\n  await someAsyncCall();\n}`,
          reason: "await can only be used inside async functions"
        });
        
        suggestions.push({
          fix: "Add error handling",
          code: `try {\n  const result = await asyncOperation();\n} catch (error) {\n  console.error(chalk.red('Error:'), error.message);\n}`,
          reason: "Follow Cloi's error handling pattern"
        });
        break;

      case 'llm':
        suggestions.push({
          fix: "Check model availability",
          code: `// Use the model checker\nawait ensureModelAvailable(model);`,
          reason: "Ensure model is installed before use"
        });
        
        suggestions.push({
          fix: "Verify API configuration",
          code: `// Check API key for Claude\nif (model.includes('claude') && !process.env.ANTHROPIC_API_KEY) {\n  throw new Error('ANTHROPIC_API_KEY not set');\n}`,
          reason: "Claude models require API key"
        });
        break;

      case 'rag':
        suggestions.push({
          fix: "Start CodeBERT service",
          code: `npm run start-codebert`,
          reason: "RAG system requires CodeBERT service running on port 5001"
        });
        
        suggestions.push({
          fix: "Check vector store initialization",
          code: `// Initialize vector store\nconst index = await getOrCreateIndex(projectRoot);`,
          reason: "Vector store must be initialized before use"
        });
        break;
    }

    // Add general suggestions
    suggestions.push({
      fix: "Follow Cloi's error handling pattern",
      code: `import chalk from 'chalk';\n\ntry {\n  // Your code here\n} catch (error) {\n  console.error(chalk.red('✗ Error:'), error.message);\n  // Handle gracefully\n}`,
      reason: "Consistent error handling improves debugging"
    });

    return suggestions;
  }

  async findRelatedCode(filePath, errorDetails) {
    const relatedCode = [];

    try {
      if (filePath && await this.fileExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');

        if (errorDetails.lineNumber) {
          const startLine = Math.max(0, errorDetails.lineNumber - 5);
          const endLine = Math.min(lines.length, errorDetails.lineNumber + 5);
          
          relatedCode.push({
            file: filePath,
            lineNumber: errorDetails.lineNumber,
            code: lines.slice(startLine, endLine).join('\n'),
            highlight: errorDetails.lineNumber - startLine
          });
        }

        // Find function definition if mentioned
        if (errorDetails.functionName) {
          const funcLine = lines.findIndex(line => 
            line.includes(`function ${errorDetails.functionName}`) ||
            line.includes(`${errorDetails.functionName} =`) ||
            line.includes(`${errorDetails.functionName}:`)
          );

          if (funcLine !== -1) {
            relatedCode.push({
              file: filePath,
              lineNumber: funcLine + 1,
              code: lines.slice(funcLine, Math.min(funcLine + 10, lines.length)).join('\n'),
              context: 'Function definition'
            });
          }
        }
      }
    } catch (error) {
      // Ignore file read errors
    }

    return relatedCode;
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  generatePreventionTips(category) {
    const tips = {
      import: [
        "Always use .js extension for ES module imports",
        "Use relative paths starting with './' or '../'",
        "Run 'npm install' after adding new dependencies"
      ],
      async: [
        "Mark functions as async when using await",
        "Always handle promise rejections",
        "Use try-catch blocks for async operations"
      ],
      syntax: [
        "Use a linter to catch syntax errors early",
        "Be consistent with ES module syntax",
        "Test code changes incrementally"
      ],
      type: [
        "Initialize variables before use",
        "Add null/undefined checks",
        "Use optional chaining (?.) for nested properties"
      ],
      llm: [
        "Check model availability before use",
        "Set required environment variables",
        "Handle model-specific errors gracefully"
      ],
      rag: [
        "Ensure CodeBERT service is running",
        "Initialize vector store before queries",
        "Handle embedding failures gracefully"
      ],
      unknown: [
        "Check error logs for more details",
        "Test in isolation to identify the issue",
        "Review recent changes that might have caused the error"
      ]
    };

    return tips[category] || tips.unknown;
  }

  async suggestFix(issue, codeSnippet = '') {
    const analysis = await this.analyzeFailure(issue, '', '');
    
    const suggestion = {
      issue,
      analysis: analysis.category,
      fixes: analysis.suggestedFixes,
      bestPractices: []
    };

    // Add code-specific suggestions if provided
    if (codeSnippet) {
      const codeAnalysis = this.analyzeCodeSnippet(codeSnippet);
      suggestion.codeIssues = codeAnalysis.issues;
      suggestion.improvedCode = codeAnalysis.improved;
    }

    // Add Cloi-specific best practices
    suggestion.bestPractices = [
      "Follow Cloi's modular architecture",
      "Use the existing error handling patterns",
      "Leverage the LLM router for model operations",
      "Utilize the RAG system for code context"
    ];

    return suggestion;
  }

  analyzeCodeSnippet(code) {
    const analysis = {
      issues: [],
      improved: code
    };

    // Check for common issues
    if (!code.includes('try') && code.includes('await')) {
      analysis.issues.push("Missing error handling for async operation");
      analysis.improved = `try {\n${code}\n} catch (error) {\n  console.error(chalk.red('Error:'), error.message);\n}`;
    }

    if (code.includes("require(")) {
      analysis.issues.push("Using CommonJS require instead of ES module import");
      analysis.improved = code.replace(/const (\w+) = require\(['"](.+)['"]\)/g, 
        "import $1 from '$2'");
    }

    if (code.includes("console.log") && !code.includes("chalk")) {
      analysis.issues.push("Not using chalk for colored output");
    }

    return analysis;
  }
}