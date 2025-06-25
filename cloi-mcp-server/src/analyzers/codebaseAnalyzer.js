/**
 * Codebase Analyzer for Cloi
 * 
 * Analyzes the Cloi codebase structure, patterns, and dependencies
 */

import fs from 'fs/promises';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { glob } from 'glob';

export class CloiCodebaseAnalyzer {
  constructor() {
    // Use environment variable for Cloi project root, with fallback
    this.projectRoot = process.env.CLOI_PROJECT_ROOT || 
                      process.env.CLOI_ROOT ||
                      path.resolve(process.cwd(), '..');
    
    this.moduleMap = {
      core: 'src/core',
      rag: 'src/rag',
      cli: 'src/cli',
      utils: 'src/utils',
      ui: 'src/ui'
    };
  }

  async analyzeModule(moduleName, depth = 'detailed') {
    const modulePath = path.join(this.projectRoot, this.moduleMap[moduleName]);
    
    try {
      const files = await glob(`${modulePath}/**/*.js`);
      const analysis = {
        module: moduleName,
        path: modulePath,
        fileCount: files.length,
        files: [],
        imports: new Set(),
        exports: new Set(),
        patterns: [],
        dependencies: new Set()
      };

      for (const file of files) {
        const fileAnalysis = await this.analyzeFile(file, depth);
        analysis.files.push(fileAnalysis);
        
        fileAnalysis.imports.forEach(imp => analysis.imports.add(imp));
        fileAnalysis.exports.forEach(exp => analysis.exports.add(exp));
        fileAnalysis.dependencies.forEach(dep => analysis.dependencies.add(dep));
      }

      // Identify patterns
      analysis.patterns = this.identifyModulePatterns(moduleName, analysis);
      
      // Convert sets to arrays for JSON serialization
      analysis.imports = Array.from(analysis.imports);
      analysis.exports = Array.from(analysis.exports);
      analysis.dependencies = Array.from(analysis.dependencies);

      if (depth === 'overview') {
        // Simplify for overview
        delete analysis.files;
      }

      return analysis;
    } catch (error) {
      return {
        error: `Failed to analyze module ${moduleName}: ${error.message}`
      };
    }
  }

  async analyzeFile(filePath, depth) {
    const content = await fs.readFile(filePath, 'utf-8');
    const relativePath = path.relative(this.projectRoot, filePath);
    
    const analysis = {
      file: relativePath,
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      dependencies: []
    };

    try {
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });

      traverse.default(ast, {
        ImportDeclaration(path) {
          const source = path.node.source.value;
          analysis.imports.push(source);
          
          // Track external dependencies
          if (!source.startsWith('.') && !source.startsWith('/')) {
            analysis.dependencies.push(source);
          }
        },
        
        ExportNamedDeclaration(path) {
          if (path.node.declaration) {
            if (path.node.declaration.type === 'FunctionDeclaration') {
              analysis.exports.push(path.node.declaration.id.name);
            }
          }
        },
        
        ExportDefaultDeclaration(path) {
          analysis.exports.push('default');
        },
        
        FunctionDeclaration(path) {
          if (depth !== 'overview') {
            analysis.functions.push({
              name: path.node.id?.name || 'anonymous',
              async: path.node.async,
              params: path.node.params.length
            });
          }
        },
        
        ClassDeclaration(path) {
          if (depth !== 'overview') {
            analysis.classes.push({
              name: path.node.id?.name || 'anonymous'
            });
          }
        }
      });
    } catch (error) {
      analysis.parseError = error.message;
    }

    return analysis;
  }

  identifyModulePatterns(moduleName, analysis) {
    const patterns = [];

    switch (moduleName) {
      case 'core':
        patterns.push('LLM Router Pattern - Dynamic model selection');
        patterns.push('Prompt Template System - Structured prompts');
        patterns.push('Executor Pattern - Separate handlers for each LLM');
        break;
      
      case 'rag':
        patterns.push('Vector Storage with FAISS');
        patterns.push('Hybrid Search - BM25 + Vector similarity');
        patterns.push('CodeBERT Embeddings for code understanding');
        patterns.push('Chunking Strategy for code files');
        break;
      
      case 'cli':
        patterns.push('Interactive CLI Loop');
        patterns.push('Command parsing with yargs');
        patterns.push('Terminal UI with chalk and boxen');
        break;
      
      case 'utils':
        patterns.push('Git Integration for patch management');
        patterns.push('Terminal history tracking');
        patterns.push('File patching utilities');
        break;
    }

    return patterns;
  }

  async findPatterns(pattern, includeContext = true) {
    const results = [];
    const searchPattern = pattern.toLowerCase();
    
    // Search across all modules
    for (const [moduleName, modulePath] of Object.entries(this.moduleMap)) {
      const fullPath = path.join(this.projectRoot, modulePath);
      const files = await glob(`${fullPath}/**/*.js`);
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');
        const matches = [];
        
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(searchPattern)) {
            const match = {
              line: index + 1,
              content: line.trim()
            };
            
            if (includeContext) {
              match.context = {
                before: lines.slice(Math.max(0, index - 2), index).join('\n'),
                after: lines.slice(index + 1, Math.min(lines.length, index + 3)).join('\n')
              };
            }
            
            matches.push(match);
          }
        });
        
        if (matches.length > 0) {
          results.push({
            file: path.relative(this.projectRoot, file),
            module: moduleName,
            matches
          });
        }
      }
    }
    
    return {
      pattern,
      totalMatches: results.reduce((sum, r) => sum + r.matches.length, 0),
      results
    };
  }
}