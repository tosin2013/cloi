/**
 * JavaScript Analyzer Plugin
 * 
 * Analyzes JavaScript/TypeScript errors with enhanced context understanding
 */

import { BaseAnalyzer } from '../../../core/plugin-manager/interfaces.js';
import path from 'path';
import fs from 'fs';

export default class JavaScriptAnalyzer extends BaseAnalyzer {
  constructor(manifest, config) {
    super(manifest, config);
    this.supportedExtensions = manifest.supportedExtensions || [];
    this.frameworkPatterns = this.initializeFrameworkPatterns();
  }

  /**
   * Initialize framework detection patterns
   */
  initializeFrameworkPatterns() {
    return {
      react: [
        /import.*react/i,
        /from ['"]react['"]/i,
        /jsx?/i,
        /<[A-Z]\w*.*>/
      ],
      vue: [
        /import.*vue/i,
        /from ['"]vue['"]/i,
        /<template>/i,
        /<script.*setup>/i
      ],
      express: [
        /import.*express/i,
        /require\(['"]express['"]\)/i,
        /app\.(get|post|put|delete)/i
      ],
      node: [
        /require\(/i,
        /module\.exports/i,
        /process\./i,
        /__dirname/i
      ]
    };
  }

  /**
   * Check if this analyzer supports the given context
   */
  supports(context) {
    const { files = [], error = '' } = context;
    
    // Check file extensions
    const hasJSFiles = files.some(file => 
      this.supportedExtensions.some(ext => file.endsWith(ext))
    );

    // Check error patterns specific to JavaScript/Node.js
    const hasJSError = this.hasJavaScriptErrorPatterns(error);

    return hasJSFiles || hasJSError;
  }

  /**
   * Check for JavaScript-specific error patterns
   */
  hasJavaScriptErrorPatterns(error) {
    const jsErrorPatterns = [
      /SyntaxError/i,
      /ReferenceError/i,
      /TypeError/i,
      /RangeError/i,
      /Error: Cannot find module/i,
      /npm ERR!/i,
      /yarn error/i,
      /webpack/i,
      /babel/i,
      /eslint/i,
      /tsc /i,
      /ts\(\d+\)/i,
      /at .*\.js:/i,
      /at .*\.ts:/i
    ];

    return jsErrorPatterns.some(pattern => pattern.test(error));
  }

  /**
   * Analyze JavaScript/TypeScript error
   */
  async analyze(errorOutput, context) {
    const analysis = {
      language: 'javascript',
      framework: await this.detectFramework(context),
      errorType: this.classifyError(errorOutput),
      suggestions: [],
      confidence: 0,
      metadata: {}
    };

    // Perform different analysis based on error type
    switch (analysis.errorType) {
      case 'syntax':
        await this.analyzeSyntaxError(errorOutput, context, analysis);
        break;
      case 'module':
        await this.analyzeModuleError(errorOutput, context, analysis);
        break;
      case 'type':
        await this.analyzeTypeError(errorOutput, context, analysis);
        break;
      case 'runtime':
        await this.analyzeRuntimeError(errorOutput, context, analysis);
        break;
      case 'build':
        await this.analyzeBuildError(errorOutput, context, analysis);
        break;
      default:
        await this.analyzeGenericError(errorOutput, context, analysis);
    }

    // Add framework-specific suggestions
    this.addFrameworkSuggestions(analysis);

    return analysis;
  }

  /**
   * Detect JavaScript framework being used
   */
  async detectFramework(context) {
    const { files = [] } = context;
    const detectedFrameworks = [];

    // Check package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        if (deps.react || deps['@types/react']) detectedFrameworks.push('react');
        if (deps.vue || deps['@vue/cli']) detectedFrameworks.push('vue');
        if (deps.express) detectedFrameworks.push('express');
        if (deps.typescript || deps['@types/node']) detectedFrameworks.push('typescript');
      } catch (error) {
        // Ignore package.json parsing errors
      }
    }

    // Check file content patterns
    for (const file of files) {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          for (const [framework, patterns] of Object.entries(this.frameworkPatterns)) {
            if (patterns.some(pattern => pattern.test(content))) {
              if (!detectedFrameworks.includes(framework)) {
                detectedFrameworks.push(framework);
              }
            }
          }
        } catch (error) {
          // Ignore file reading errors
        }
      }
    }

    return detectedFrameworks.length > 0 ? detectedFrameworks : ['node'];
  }

  /**
   * Classify the type of JavaScript error
   */
  classifyError(errorOutput) {
    if (/SyntaxError|Unexpected token|Unexpected end of input/i.test(errorOutput)) {
      return 'syntax';
    }
    
    if (/Cannot find module|Module not found|ERR_MODULE_NOT_FOUND/i.test(errorOutput)) {
      return 'module';
    }
    
    if (/TypeError|ReferenceError|is not a function|Cannot read property/i.test(errorOutput)) {
      return 'type';
    }
    
    if (/webpack|babel|rollup|vite|parcel/i.test(errorOutput)) {
      return 'build';
    }
    
    if (/RangeError|Maximum call stack|out of memory/i.test(errorOutput)) {
      return 'runtime';
    }

    return 'generic';
  }

  /**
   * Analyze syntax errors
   */
  async analyzeSyntaxError(errorOutput, context, analysis) {
    analysis.confidence = 0.9;
    
    if (/Unexpected token/i.test(errorOutput)) {
      analysis.suggestions.push({
        type: 'syntax',
        title: 'Check for syntax errors',
        description: 'Look for missing brackets, semicolons, or invalid characters',
        priority: 'high'
      });
    }

    if (/Unexpected end of input/i.test(errorOutput)) {
      analysis.suggestions.push({
        type: 'syntax',
        title: 'Check for unclosed brackets or parentheses',
        description: 'The parser reached end of file unexpectedly',
        priority: 'high'
      });
    }

    // Extract line number if available
    const lineMatch = errorOutput.match(/at line (\d+)|:(\d+):/);
    if (lineMatch) {
      analysis.metadata.errorLine = parseInt(lineMatch[1] || lineMatch[2]);
    }
  }

  /**
   * Analyze module/import errors
   */
  async analyzeModuleError(errorOutput, context, analysis) {
    analysis.confidence = 0.85;
    
    const moduleMatch = errorOutput.match(/Cannot find module ['"]([^'"]+)['"]/);
    if (moduleMatch) {
      const moduleName = moduleMatch[1];
      analysis.metadata.missingModule = moduleName;
      
      if (moduleName.startsWith('./') || moduleName.startsWith('../')) {
        analysis.suggestions.push({
          type: 'file',
          title: 'Check relative import path',
          description: `Verify that the file ${moduleName} exists and the path is correct`,
          priority: 'high'
        });
      } else {
        analysis.suggestions.push({
          type: 'dependency',
          title: 'Install missing dependency',
          description: `Run: npm install ${moduleName}`,
          command: `npm install ${moduleName}`,
          priority: 'high'
        });
      }
    }
  }

  /**
   * Analyze type errors
   */
  async analyzeTypeError(errorOutput, context, analysis) {
    analysis.confidence = 0.8;
    
    if (/is not a function/i.test(errorOutput)) {
      analysis.suggestions.push({
        type: 'type',
        title: 'Check function call',
        description: 'Verify the variable is actually a function and properly imported',
        priority: 'high'
      });
    }

    if (/Cannot read property.*of undefined/i.test(errorOutput)) {
      analysis.suggestions.push({
        type: 'type',
        title: 'Check for undefined values',
        description: 'Add null/undefined checks before accessing properties',
        priority: 'high'
      });
    }
  }

  /**
   * Analyze runtime errors
   */
  async analyzeRuntimeError(errorOutput, context, analysis) {
    analysis.confidence = 0.75;
    
    if (/Maximum call stack/i.test(errorOutput)) {
      analysis.suggestions.push({
        type: 'runtime',
        title: 'Check for infinite recursion',
        description: 'Review recursive functions for proper base cases',
        priority: 'critical'
      });
    }
  }

  /**
   * Analyze build errors
   */
  async analyzeBuildError(errorOutput, context, analysis) {
    analysis.confidence = 0.7;
    
    if (/webpack/i.test(errorOutput)) {
      analysis.suggestions.push({
        type: 'build',
        title: 'Check webpack configuration',
        description: 'Review webpack.config.js for misconfigurations',
        priority: 'medium'
      });
    }

    if (/babel/i.test(errorOutput)) {
      analysis.suggestions.push({
        type: 'build',
        title: 'Check Babel configuration',
        description: 'Verify .babelrc or babel.config.js settings',
        priority: 'medium'
      });
    }
  }

  /**
   * Analyze generic errors
   */
  async analyzeGenericError(errorOutput, context, analysis) {
    analysis.confidence = 0.5;
    
    analysis.suggestions.push({
      type: 'generic',
      title: 'Review error stack trace',
      description: 'Check the full stack trace for clues about the error location',
      priority: 'medium'
    });
  }

  /**
   * Add framework-specific suggestions
   */
  addFrameworkSuggestions(analysis) {
    const frameworks = Array.isArray(analysis.framework) ? analysis.framework : [analysis.framework];
    
    for (const framework of frameworks) {
      switch (framework) {
        case 'react':
          this.addReactSuggestions(analysis);
          break;
        case 'vue':
          this.addVueSuggestions(analysis);
          break;
        case 'express':
          this.addExpressSuggestions(analysis);
          break;
        case 'typescript':
          this.addTypeScriptSuggestions(analysis);
          break;
      }
    }
  }

  /**
   * Add React-specific suggestions
   */
  addReactSuggestions(analysis) {
    if (analysis.errorType === 'type') {
      analysis.suggestions.push({
        type: 'react',
        title: 'Check React component props',
        description: 'Verify component props are correctly passed and typed',
        priority: 'medium'
      });
    }
  }

  /**
   * Add Vue-specific suggestions
   */
  addVueSuggestions(analysis) {
    if (analysis.errorType === 'syntax') {
      analysis.suggestions.push({
        type: 'vue',
        title: 'Check Vue template syntax',
        description: 'Verify template directives and component structure',
        priority: 'medium'
      });
    }
  }

  /**
   * Add Express-specific suggestions
   */
  addExpressSuggestions(analysis) {
    if (analysis.errorType === 'runtime') {
      analysis.suggestions.push({
        type: 'express',
        title: 'Check middleware and route handlers',
        description: 'Verify async/await usage and error handling in routes',
        priority: 'medium'
      });
    }
  }

  /**
   * Add TypeScript-specific suggestions
   */
  addTypeScriptSuggestions(analysis) {
    analysis.suggestions.push({
      type: 'typescript',
      title: 'Run TypeScript compiler',
      description: 'Check for type errors with: npx tsc --noEmit',
      command: 'npx tsc --noEmit',
      priority: 'medium'
    });
  }
}