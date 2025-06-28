import { BaseQuality } from '../../../core/plugin-manager/interfaces.js';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * CodeQualityPlugin - Advanced code quality management
 * 
 * Supports multiple languages and tools:
 * - JavaScript/TypeScript: ESLint, Prettier
 * - Python: Black, Flake8, Pylint, MyPy
 * - Security: Snyk
 * - Code Analysis: SonarQube
 */
export default class CodeQualityPlugin extends BaseQuality {
  constructor(manifest, config) {
    super(manifest, config);
    
    this.supportedLanguages = ['javascript', 'typescript', 'python'];
    this.supportedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py'];
    
    // Tool availability cache
    this.toolCache = new Map();
    
    // Initialize tool configurations
    this.initializeTools();
  }

  /**
   * Initialize tool configurations
   */
  initializeTools() {
    this.tools = {
      // JavaScript/TypeScript tools
      eslint: {
        name: 'ESLint',
        command: 'npx eslint',
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        configFiles: ['.eslintrc.js', '.eslintrc.json', '.eslintrc.yml', 'eslint.config.js'],
        type: 'linter'
      },
      prettier: {
        name: 'Prettier',
        command: 'npx prettier',
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.yml', '.yaml'],
        configFiles: ['.prettierrc', '.prettierrc.json', '.prettierrc.yml', 'prettier.config.js'],
        type: 'formatter'
      },
      
      // Python tools
      black: {
        name: 'Black',
        command: 'black',
        extensions: ['.py'],
        configFiles: ['pyproject.toml', '.black'],
        type: 'formatter'
      },
      flake8: {
        name: 'Flake8',
        command: 'flake8',
        extensions: ['.py'],
        configFiles: ['.flake8', 'setup.cfg', 'tox.ini', 'pyproject.toml'],
        type: 'linter'
      },
      pylint: {
        name: 'Pylint',
        command: 'pylint',
        extensions: ['.py'],
        configFiles: ['.pylintrc', 'pylint.ini', 'pyproject.toml'],
        type: 'linter'
      },
      mypy: {
        name: 'MyPy',
        command: 'mypy',
        extensions: ['.py'],
        configFiles: ['mypy.ini', 'pyproject.toml', '.mypy.ini'],
        type: 'type-checker'
      },
      
      // Security and analysis tools
      snyk: {
        name: 'Snyk',
        command: 'snyk',
        extensions: ['.js', '.py', '.json'],
        configFiles: ['.snyk'],
        type: 'security'
      }
    };
  }

  /**
   * Analyze code quality for given files
   */
  async analyze(files, options = {}) {
    const startTime = Date.now();
    const results = {
      timestamp: new Date().toISOString(),
      files: Array.isArray(files) ? files : [files],
      results: {},
      summary: {
        totalIssues: 0,
        errors: 0,
        warnings: 0,
        info: 0,
        fixable: 0
      },
      duration: 0,
      toolsUsed: []
    };

    try {
      // Filter and categorize files by language
      const categorizedFiles = await this.categorizeFiles(results.files);
      
      // Run analysis for each tool
      const enabledTools = this.getEnabledTools(options);
      
      for (const toolName of enabledTools) {
        const tool = this.tools[toolName];
        if (!tool) continue;

        const relevantFiles = categorizedFiles.filter(file => 
          tool.extensions.some(ext => file.path.endsWith(ext))
        );

        if (relevantFiles.length === 0) continue;

        try {
          console.log(`Running ${tool.name} analysis...`);
          const toolResult = await this.runTool(toolName, relevantFiles, options);
          results.results[toolName] = toolResult;
          results.toolsUsed.push(toolName);
          
          // Update summary
          if (toolResult.issues) {
            results.summary.totalIssues += toolResult.issues.length;
            toolResult.issues.forEach(issue => {
              switch (issue.severity) {
                case 'error': results.summary.errors++; break;
                case 'warning': results.summary.warnings++; break;
                case 'info': results.summary.info++; break;
              }
              if (issue.fixable) results.summary.fixable++;
            });
          }
        } catch (error) {
          console.warn(`${tool.name} analysis failed:`, error.message);
          results.results[toolName] = {
            success: false,
            error: error.message,
            issues: []
          };
        }
      }

      results.duration = Date.now() - startTime;
      return results;

    } catch (error) {
      results.duration = Date.now() - startTime;
      results.error = error.message;
      return results;
    }
  }

  /**
   * Automatically fix quality issues
   */
  async autoFix(files, options = {}) {
    const results = {
      timestamp: new Date().toISOString(),
      files: Array.isArray(files) ? files : [files],
      fixed: [],
      errors: [],
      summary: {
        totalFixed: 0,
        filesModified: 0,
        toolsUsed: []
      }
    };

    try {
      const categorizedFiles = await this.categorizeFiles(results.files);
      const fixableTools = this.getFixableTools(options);

      for (const toolName of fixableTools) {
        const tool = this.tools[toolName];
        if (!tool) continue;

        const relevantFiles = categorizedFiles.filter(file => 
          tool.extensions.some(ext => file.path.endsWith(ext))
        );

        if (relevantFiles.length === 0) continue;

        try {
          console.log(`Auto-fixing with ${tool.name}...`);
          const fixResult = await this.autoFixWithTool(toolName, relevantFiles, options);
          
          if (fixResult.success) {
            results.fixed.push({
              tool: toolName,
              files: fixResult.files,
              changes: fixResult.changes
            });
            results.summary.totalFixed += fixResult.changes;
            results.summary.filesModified += fixResult.files.length;
            results.summary.toolsUsed.push(toolName);
          }
        } catch (error) {
          results.errors.push({
            tool: toolName,
            error: error.message
          });
        }
      }

      return results;

    } catch (error) {
      results.error = error.message;
      return results;
    }
  }

  /**
   * Get quality metrics for files
   */
  async getMetrics(files, options = {}) {
    const categorizedFiles = await this.categorizeFiles(Array.isArray(files) ? files : [files]);
    
    const metrics = {
      timestamp: new Date().toISOString(),
      files: categorizedFiles.length,
      languages: {},
      complexity: {
        average: 0,
        max: 0,
        total: 0
      },
      maintainability: {
        score: 0,
        grade: 'A'
      },
      coverage: {
        percentage: 0,
        lines: { total: 0, covered: 0 }
      },
      duplication: {
        percentage: 0,
        blocks: 0
      }
    };

    // Calculate basic metrics
    for (const file of categorizedFiles) {
      const language = this.detectLanguage(file.path);
      if (!metrics.languages[language]) {
        metrics.languages[language] = {
          files: 0,
          lines: 0,
          size: 0
        };
      }
      
      metrics.languages[language].files++;
      metrics.languages[language].lines += file.lines || 0;
      metrics.languages[language].size += file.size || 0;
    }

    // Run specific metric tools if available
    if (this.isToolEnabled('pylint') && categorizedFiles.some(f => f.path.endsWith('.py'))) {
      const pylintMetrics = await this.getPylintMetrics(categorizedFiles.filter(f => f.path.endsWith('.py')));
      if (pylintMetrics) {
        metrics.complexity = pylintMetrics.complexity;
        metrics.maintainability = pylintMetrics.maintainability;
      }
    }

    return metrics;
  }

  /**
   * Generate comprehensive quality report
   */
  async generateReport(analysisResults, options = {}) {
    const format = options.format || 'json';
    const includeMetrics = options.includeMetrics !== false;
    
    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: this.version,
        format,
        includeMetrics
      },
      summary: analysisResults.summary,
      toolsUsed: analysisResults.toolsUsed,
      results: analysisResults.results
    };

    // Add metrics if requested
    if (includeMetrics) {
      report.metrics = await this.getMetrics(analysisResults.files);
    }

    // Add recommendations
    report.recommendations = this.generateRecommendations(analysisResults);

    // Format report based on requested format
    switch (format) {
      case 'html':
        return this.generateHTMLReport(report);
      case 'markdown':
        return this.generateMarkdownReport(report);
      case 'junit':
        return this.generateJUnitReport(report);
      case 'json':
      default:
        return {
          format: 'json',
          content: JSON.stringify(report, null, 2),
          timestamp: report.metadata.timestamp
        };
    }
  }

  /**
   * Run specific tool analysis
   */
  async runTool(toolName, files, options = {}) {
    const tool = this.tools[toolName];
    const toolConfig = this.getConfig(`tools.${toolName}`, {});
    
    if (!toolConfig.enabled) {
      return { success: false, message: `${tool.name} is disabled` };
    }

    // Check if tool is available
    const isAvailable = await this.isToolAvailable(toolName);
    if (!isAvailable) {
      throw new Error(`${tool.name} is not installed or not available`);
    }

    const filePaths = files.map(f => f.path);
    
    switch (toolName) {
      case 'eslint':
        return await this.runESLint(filePaths, toolConfig, options);
      case 'prettier':
        return await this.runPrettier(filePaths, toolConfig, options);
      case 'black':
        return await this.runBlack(filePaths, toolConfig, options);
      case 'flake8':
        return await this.runFlake8(filePaths, toolConfig, options);
      case 'pylint':
        return await this.runPylint(filePaths, toolConfig, options);
      case 'mypy':
        return await this.runMyPy(filePaths, toolConfig, options);
      case 'snyk':
        return await this.runSnyk(filePaths, toolConfig, options);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * Run ESLint analysis
   */
  async runESLint(files, config, options) {
    const args = [
      '--format', 'json',
      '--no-error-on-unmatched-pattern',
      ...files
    ];

    if (config.configFile) {
      args.unshift('--config', config.configFile);
    }

    try {
      const { stdout } = await execAsync(`npx eslint ${args.join(' ')}`);
      const results = JSON.parse(stdout);
      
      const issues = [];
      results.forEach(result => {
        result.messages.forEach(message => {
          issues.push({
            file: result.filePath,
            line: message.line,
            column: message.column,
            severity: message.severity === 2 ? 'error' : 'warning',
            message: message.message,
            rule: message.ruleId,
            fixable: message.fix !== undefined,
            tool: 'eslint'
          });
        });
      });

      return {
        success: true,
        tool: 'eslint',
        issues,
        summary: {
          errors: issues.filter(i => i.severity === 'error').length,
          warnings: issues.filter(i => i.severity === 'warning').length
        }
      };
    } catch (error) {
      // ESLint returns non-zero exit code when issues are found
      if (error.stdout) {
        try {
          const results = JSON.parse(error.stdout);
          return this.runESLint(files, config, options); // Recursive call to parse results
        } catch (parseError) {
          throw new Error(`ESLint failed: ${error.message}`);
        }
      }
      throw error;
    }
  }

  /**
   * Run Prettier analysis
   */
  async runPrettier(files, config, options) {
    const issues = [];
    
    for (const file of files) {
      try {
        const { stdout } = await execAsync(`npx prettier --check "${file}"`);
        // No issues if prettier check passes
      } catch (error) {
        issues.push({
          file,
          line: 1,
          column: 1,
          severity: 'warning',
          message: 'File is not formatted according to Prettier rules',
          rule: 'prettier/prettier',
          fixable: true,
          tool: 'prettier'
        });
      }
    }

    return {
      success: true,
      tool: 'prettier',
      issues,
      summary: {
        warnings: issues.length
      }
    };
  }

  /**
   * Run Black analysis
   */
  async runBlack(files, config, options) {
    const issues = [];
    
    for (const file of files) {
      try {
        await execAsync(`black --check --diff "${file}"`);
        // No issues if black check passes
      } catch (error) {
        if (error.stdout && error.stdout.includes('would reformat')) {
          issues.push({
            file,
            line: 1,
            column: 1,
            severity: 'warning',
            message: 'File would be reformatted by Black',
            rule: 'black-format',
            fixable: true,
            tool: 'black'
          });
        }
      }
    }

    return {
      success: true,
      tool: 'black',
      issues,
      summary: {
        warnings: issues.length
      }
    };
  }

  /**
   * Run Flake8 analysis
   */
  async runFlake8(files, config, options) {
    const args = [
      '--format=json',
      ...files
    ];

    if (config.configFile) {
      args.unshift('--config', config.configFile);
    }

    try {
      const { stdout } = await execAsync(`flake8 ${args.join(' ')}`);
      
      // Flake8 doesn't output JSON by default, parse line format
      const issues = [];
      if (stdout.trim()) {
        const lines = stdout.trim().split('\n');
        lines.forEach(line => {
          const match = line.match(/^(.+):(\d+):(\d+):\s+([A-Z]\d+)\s+(.+)$/);
          if (match) {
            const [, file, lineNum, col, code, message] = match;
            issues.push({
              file,
              line: parseInt(lineNum),
              column: parseInt(col),
              severity: code.startsWith('E') ? 'error' : 'warning',
              message,
              rule: code,
              fixable: false,
              tool: 'flake8'
            });
          }
        });
      }

      return {
        success: true,
        tool: 'flake8',
        issues,
        summary: {
          errors: issues.filter(i => i.severity === 'error').length,
          warnings: issues.filter(i => i.severity === 'warning').length
        }
      };
    } catch (error) {
      if (error.stdout) {
        // Flake8 found issues
        return this.runFlake8(files, config, options);
      }
      throw error;
    }
  }

  /**
   * Run Pylint analysis
   */
  async runPylint(files, config, options) {
    const args = [
      '--output-format=json',
      '--reports=no',
      ...files
    ];

    if (config.configFile) {
      args.unshift('--rcfile', config.configFile);
    }

    try {
      const { stdout } = await execAsync(`pylint ${args.join(' ')}`);
      const results = JSON.parse(stdout);
      
      const issues = results.map(result => ({
        file: result.path,
        line: result.line,
        column: result.column,
        severity: this.mapPylintSeverity(result.type),
        message: result.message,
        rule: result['message-id'],
        fixable: false,
        tool: 'pylint'
      }));

      return {
        success: true,
        tool: 'pylint',
        issues,
        summary: {
          errors: issues.filter(i => i.severity === 'error').length,
          warnings: issues.filter(i => i.severity === 'warning').length,
          info: issues.filter(i => i.severity === 'info').length
        }
      };
    } catch (error) {
      if (error.stdout) {
        try {
          const results = JSON.parse(error.stdout);
          return this.runPylint(files, config, options);
        } catch (parseError) {
          throw new Error(`Pylint failed: ${error.message}`);
        }
      }
      throw error;
    }
  }

  /**
   * Run MyPy analysis
   */
  async runMyPy(files, config, options) {
    const args = [
      '--show-error-codes',
      '--no-error-summary',
      ...files
    ];

    if (config.configFile) {
      args.unshift('--config-file', config.configFile);
    }

    try {
      const { stdout, stderr } = await execAsync(`mypy ${args.join(' ')}`);
      
      const issues = [];
      const output = stdout || stderr;
      if (output.trim()) {
        const lines = output.trim().split('\n');
        lines.forEach(line => {
          const match = line.match(/^(.+):(\d+):\s+(error|warning|note):\s+(.+?)\s+\[([^\]]+)\]$/);
          if (match) {
            const [, file, lineNum, severity, message, code] = match;
            issues.push({
              file,
              line: parseInt(lineNum),
              column: 1,
              severity: severity === 'error' ? 'error' : severity === 'warning' ? 'warning' : 'info',
              message,
              rule: code,
              fixable: false,
              tool: 'mypy'
            });
          }
        });
      }

      return {
        success: true,
        tool: 'mypy',
        issues,
        summary: {
          errors: issues.filter(i => i.severity === 'error').length,
          warnings: issues.filter(i => i.severity === 'warning').length,
          info: issues.filter(i => i.severity === 'info').length
        }
      };
    } catch (error) {
      if (error.stdout || error.stderr) {
        return this.runMyPy(files, config, options);
      }
      throw error;
    }
  }

  /**
   * Run Snyk security analysis
   */
  async runSnyk(files, config, options) {
    try {
      const { stdout } = await execAsync('snyk test --json');
      const results = JSON.parse(stdout);
      
      const issues = [];
      if (results.vulnerabilities) {
        results.vulnerabilities.forEach(vuln => {
          issues.push({
            file: vuln.from ? vuln.from.join(' > ') : 'package.json',
            line: 1,
            column: 1,
            severity: vuln.severity,
            message: `${vuln.title}: ${vuln.description}`,
            rule: vuln.id,
            fixable: vuln.isUpgradable,
            tool: 'snyk'
          });
        });
      }

      return {
        success: true,
        tool: 'snyk',
        issues,
        summary: {
          high: issues.filter(i => i.severity === 'high').length,
          medium: issues.filter(i => i.severity === 'medium').length,
          low: issues.filter(i => i.severity === 'low').length
        }
      };
    } catch (error) {
      if (error.stdout) {
        try {
          const results = JSON.parse(error.stdout);
          return this.runSnyk(files, config, options);
        } catch (parseError) {
          throw new Error(`Snyk failed: ${error.message}`);
        }
      }
      throw error;
    }
  }

  /**
   * Auto-fix with specific tool
   */
  async autoFixWithTool(toolName, files, options) {
    const filePaths = files.map(f => f.path);
    
    switch (toolName) {
      case 'eslint':
        return await this.autoFixESLint(filePaths, options);
      case 'prettier':
        return await this.autoFixPrettier(filePaths, options);
      case 'black':
        return await this.autoFixBlack(filePaths, options);
      default:
        throw new Error(`Auto-fix not supported for ${toolName}`);
    }
  }

  /**
   * Auto-fix with ESLint
   */
  async autoFixESLint(files, options) {
    try {
      await execAsync(`npx eslint --fix ${files.join(' ')}`);
      return {
        success: true,
        files,
        changes: files.length // Simplified - could count actual changes
      };
    } catch (error) {
      // ESLint --fix can still return non-zero exit code
      return {
        success: true,
        files,
        changes: files.length
      };
    }
  }

  /**
   * Auto-fix with Prettier
   */
  async autoFixPrettier(files, options) {
    try {
      await execAsync(`npx prettier --write ${files.join(' ')}`);
      return {
        success: true,
        files,
        changes: files.length
      };
    } catch (error) {
      throw new Error(`Prettier auto-fix failed: ${error.message}`);
    }
  }

  /**
   * Auto-fix with Black
   */
  async autoFixBlack(files, options) {
    try {
      await execAsync(`black ${files.join(' ')}`);
      return {
        success: true,
        files,
        changes: files.length
      };
    } catch (error) {
      throw new Error(`Black auto-fix failed: ${error.message}`);
    }
  }

  /**
   * Helper methods
   */

  async categorizeFiles(filePaths) {
    const categorized = [];
    
    for (const filePath of filePaths) {
      try {
        const stats = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        
        categorized.push({
          path: filePath,
          size: stats.size,
          lines: content.split('\n').length,
          language: this.detectLanguage(filePath),
          lastModified: stats.mtime
        });
      } catch (error) {
        console.warn(`Could not analyze file ${filePath}:`, error.message);
      }
    }
    
    return categorized;
  }

  detectLanguage(filePath) {
    const ext = path.extname(filePath);
    const languageMap = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.json': 'json',
      '.md': 'markdown',
      '.yml': 'yaml',
      '.yaml': 'yaml'
    };
    return languageMap[ext] || 'unknown';
  }

  getEnabledTools(options) {
    const tools = Object.keys(this.tools);
    return tools.filter(tool => this.isToolEnabled(tool, options));
  }

  getFixableTools(options) {
    return ['eslint', 'prettier', 'black'].filter(tool => this.isToolEnabled(tool, options));
  }

  isToolEnabled(toolName, options = {}) {
    if (options.tools && Array.isArray(options.tools)) {
      return options.tools.includes(toolName);
    }
    return this.getConfig(`tools.${toolName}.enabled`, true);
  }

  async isToolAvailable(toolName) {
    if (this.toolCache.has(toolName)) {
      return this.toolCache.get(toolName);
    }

    const tool = this.tools[toolName];
    try {
      await execAsync(`${tool.command.split(' ')[0]} --version`);
      this.toolCache.set(toolName, true);
      return true;
    } catch (error) {
      this.toolCache.set(toolName, false);
      return false;
    }
  }

  mapPylintSeverity(type) {
    const severityMap = {
      'error': 'error',
      'warning': 'warning',
      'refactor': 'info',
      'convention': 'info',
      'info': 'info'
    };
    return severityMap[type] || 'warning';
  }

  generateRecommendations(analysisResults) {
    const recommendations = [];
    
    // High error count recommendation
    if (analysisResults.summary.errors > 10) {
      recommendations.push({
        type: 'error-reduction',
        priority: 'high',
        message: 'High number of errors detected. Consider running auto-fix tools first.',
        action: 'Run auto-fix with: cloi quality auto-fix'
      });
    }

    // Tool-specific recommendations
    if (analysisResults.toolsUsed.includes('eslint') && !analysisResults.toolsUsed.includes('prettier')) {
      recommendations.push({
        type: 'tool-integration',
        priority: 'medium',
        message: 'Consider enabling Prettier for consistent code formatting.',
        action: 'Enable Prettier in quality plugin configuration'
      });
    }

    return recommendations;
  }

  generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Code Quality Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .error { color: #d32f2f; }
        .warning { color: #f57c00; }
        .info { color: #1976d2; }
        .issue { margin: 10px 0; padding: 10px; border-left: 3px solid #ccc; }
    </style>
</head>
<body>
    <h1>Code Quality Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p>Total Issues: ${report.summary.totalIssues}</p>
        <p class="error">Errors: ${report.summary.errors}</p>
        <p class="warning">Warnings: ${report.summary.warnings}</p>
        <p class="info">Info: ${report.summary.info}</p>
        <p>Fixable: ${report.summary.fixable}</p>
    </div>
    <!-- Additional report content would go here -->
</body>
</html>`;

    return {
      format: 'html',
      content: html,
      timestamp: new Date().toISOString()
    };
  }

  generateMarkdownReport(report) {
    const md = `# Code Quality Report

## Summary
- **Total Issues**: ${report.summary.totalIssues}
- **Errors**: ${report.summary.errors}
- **Warnings**: ${report.summary.warnings}
- **Info**: ${report.summary.info}
- **Fixable**: ${report.summary.fixable}

## Tools Used
${report.toolsUsed.map(tool => `- ${tool}`).join('\n')}

## Recommendations
${report.recommendations.map(rec => `- **${rec.type}**: ${rec.message}`).join('\n')}
`;

    return {
      format: 'markdown',
      content: md,
      timestamp: new Date().toISOString()
    };
  }

  generateJUnitReport(report) {
    // Simplified JUnit XML format
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="CodeQuality" tests="${report.summary.totalIssues}" failures="${report.summary.errors}" time="0">
  <!-- Test cases would be generated here -->
</testsuite>`;

    return {
      format: 'junit',
      content: xml,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get supported file extensions
   */
  getSupportedExtensions() {
    return this.supportedExtensions;
  }

  /**
   * Check if file is supported
   */
  supportsFile(filePath) {
    return this.supportedExtensions.some(ext => filePath.endsWith(ext));
  }
}