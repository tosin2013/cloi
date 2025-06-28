/**
 * Project Enhancement Command
 * 
 * Analyzes existing projects and suggests/applies improvements
 */

import { UniversalToolDiscovery } from '../core/tool-discovery/index.js';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

// Simple askYesNo implementation
async function askYesNo(question) {
  // Check if we're in an interactive terminal
  if (!process.stdin.isTTY) {
    console.log(`${question} (y/N) - Auto-skipping in non-interactive mode`);
    return false;
  }
  
  try {
    const terminalUI = await import('../ui/terminalUI.js');
    return terminalUI.askYesNo(question);
  } catch (error) {
    console.log(`${question} (y/N) - Defaulting to No`);
    return false;
  }
}

export class ProjectEnhancer {
  constructor() {
    this.discovery = new UniversalToolDiscovery();
    this.enhancements = [];
  }

  async enhance(projectPath = process.cwd()) {
    console.log(chalk.blue(`🔍 Analyzing project at: ${projectPath}\n`));

    // Analyze current project state
    const analysis = await this.analyzeProject(projectPath);
    
    // Generate enhancement suggestions
    const suggestions = await this.generateSuggestions(analysis);
    
    if (suggestions.length === 0) {
      console.log(chalk.green('✅ Your project is already well-configured!'));
      return;
    }

    // Show suggestions
    await this.showSuggestions(suggestions);
    
    // Apply enhancements
    await this.applyEnhancements(suggestions, projectPath);
  }

  async analyzeProject(projectPath) {
    const analysis = {
      type: await this.detectProjectType(projectPath),
      hasGit: await this.checkGit(projectPath),
      hasTests: await this.checkTests(projectPath),
      hasLinting: await this.checkLinting(projectPath),
      hasFormatting: await this.checkFormatting(projectPath),
      hasCI: await this.checkCI(projectPath),
      hasDocumentation: await this.checkDocumentation(projectPath),
      hasTypeScript: await this.checkTypeScript(projectPath),
      hasCloiConfig: await this.checkCloiConfig(projectPath),
      packageManager: await this.detectPackageManager(projectPath),
      availableTools: await this.discovery.discoverAll()
    };

    return analysis;
  }

  async detectProjectType(projectPath) {
    try {
      const packagePath = path.join(projectPath, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageData = JSON.parse(packageContent);
      
      // Detect based on dependencies
      const deps = { ...packageData.dependencies, ...packageData.devDependencies };
      
      if (deps.react) return 'react';
      if (deps.vue) return 'vue';
      if (deps.angular) return 'angular';
      if (deps.express || deps.fastify || deps.koa) return 'node-backend';
      if (deps.next) return 'nextjs';
      if (deps.gatsby) return 'gatsby';
      
      return 'node';
    } catch {
      // Check for other project types
      try {
        await fs.access(path.join(projectPath, 'requirements.txt'));
        return 'python';
      } catch {}
      
      try {
        await fs.access(path.join(projectPath, 'Cargo.toml'));
        return 'rust';
      } catch {}
      
      return 'unknown';
    }
  }

  async checkGit(projectPath) {
    try {
      await fs.access(path.join(projectPath, '.git'));
      return true;
    } catch {
      return false;
    }
  }

  async checkTests(projectPath) {
    try {
      // Check for test directories
      const testDirs = ['test', 'tests', '__tests__', 'spec'];
      for (const dir of testDirs) {
        try {
          await fs.access(path.join(projectPath, dir));
          return true;
        } catch {}
      }
      
      // Check package.json for test script
      const packagePath = path.join(projectPath, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageData = JSON.parse(packageContent);
      
      return packageData.scripts && packageData.scripts.test && packageData.scripts.test !== 'echo "Error: no test specified" && exit 1';
    } catch {
      return false;
    }
  }

  async checkLinting(projectPath) {
    const lintFiles = ['.eslintrc', '.eslintrc.js', '.eslintrc.json', 'eslint.config.js', '.pylintrc', 'tslint.json'];
    
    for (const file of lintFiles) {
      try {
        await fs.access(path.join(projectPath, file));
        return true;
      } catch {}
    }
    
    // Check package.json
    try {
      const packagePath = path.join(projectPath, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageData = JSON.parse(packageContent);
      const deps = { ...packageData.dependencies, ...packageData.devDependencies };
      
      return !!(deps.eslint || deps.tslint || deps.standard);
    } catch {
      return false;
    }
  }

  async checkFormatting(projectPath) {
    const formatFiles = ['.prettierrc', '.prettierrc.js', '.prettierrc.json', 'prettier.config.js'];
    
    for (const file of formatFiles) {
      try {
        await fs.access(path.join(projectPath, file));
        return true;
      } catch {}
    }
    
    return false;
  }

  async checkCI(projectPath) {
    const ciPaths = [
      '.github/workflows',
      '.gitlab-ci.yml',
      'Jenkinsfile',
      '.circleci/config.yml',
      '.travis.yml'
    ];
    
    for (const ciPath of ciPaths) {
      try {
        await fs.access(path.join(projectPath, ciPath));
        return true;
      } catch {}
    }
    
    return false;
  }

  async checkDocumentation(projectPath) {
    try {
      await fs.access(path.join(projectPath, 'README.md'));
      return true;
    } catch {
      return false;
    }
  }

  async checkTypeScript(projectPath) {
    try {
      await fs.access(path.join(projectPath, 'tsconfig.json'));
      return true;
    } catch {
      return false;
    }
  }

  async checkCloiConfig(projectPath) {
    try {
      await fs.access(path.join(projectPath, '.cloirc.json'));
      return true;
    } catch {
      return false;
    }
  }

  async detectPackageManager(projectPath) {
    try {
      await fs.access(path.join(projectPath, 'package-lock.json'));
      return 'npm';
    } catch {}
    
    try {
      await fs.access(path.join(projectPath, 'yarn.lock'));
      return 'yarn';
    } catch {}
    
    try {
      await fs.access(path.join(projectPath, 'pnpm-lock.yaml'));
      return 'pnpm';
    } catch {}
    
    return 'npm'; // default
  }

  async generateSuggestions(analysis) {
    const suggestions = [];

    // Git
    if (!analysis.hasGit) {
      suggestions.push({
        type: 'git',
        title: 'Initialize Git repository',
        description: 'Version control is essential for tracking changes',
        priority: 'high',
        command: 'git init',
        files: ['.gitignore']
      });
    }

    // Testing
    if (!analysis.hasTests && analysis.type !== 'unknown') {
      const testFramework = this.getTestFramework(analysis.type);
      suggestions.push({
        type: 'testing',
        title: `Add ${testFramework} testing framework`,
        description: 'Testing ensures code quality and prevents regressions',
        priority: 'high',
        command: `${analysis.packageManager} install -D ${testFramework}`,
        files: ['test/', 'jest.config.js'],
        scripts: { test: 'jest' }
      });
    }

    // Linting
    if (!analysis.hasLinting && (analysis.type.includes('node') || analysis.type === 'react' || analysis.type === 'vue')) {
      suggestions.push({
        type: 'linting',
        title: 'Add ESLint for code quality',
        description: 'Catch errors and enforce coding standards',
        priority: 'medium',
        command: `${analysis.packageManager} install -D eslint`,
        files: ['.eslintrc.json'],
        scripts: { lint: 'eslint src/' }
      });
    }

    // Formatting
    if (!analysis.hasFormatting) {
      suggestions.push({
        type: 'formatting',
        title: 'Add Prettier for code formatting',
        description: 'Consistent code formatting across the project',
        priority: 'medium',
        command: `${analysis.packageManager} install -D prettier`,
        files: ['.prettierrc'],
        scripts: { format: 'prettier --write .' }
      });
    }

    // TypeScript
    if (!analysis.hasTypeScript && analysis.type !== 'unknown' && analysis.type !== 'python') {
      suggestions.push({
        type: 'typescript',
        title: 'Add TypeScript support',
        description: 'Type safety and better IDE support',
        priority: 'low',
        command: `${analysis.packageManager} install -D typescript @types/node`,
        files: ['tsconfig.json']
      });
    }

    // CI/CD
    if (!analysis.hasCI && analysis.hasGit) {
      suggestions.push({
        type: 'ci',
        title: 'Add GitHub Actions CI/CD',
        description: 'Automated testing and deployment',
        priority: 'medium',
        files: ['.github/workflows/ci.yml']
      });
    }

    // Documentation
    if (!analysis.hasDocumentation) {
      suggestions.push({
        type: 'docs',
        title: 'Create README.md',
        description: 'Document your project for users and contributors',
        priority: 'medium',
        files: ['README.md']
      });
    }

    // Cloi Config
    if (!analysis.hasCloiConfig) {
      suggestions.push({
        type: 'cloi',
        title: 'Add Cloi configuration',
        description: 'Enable enhanced Cloi features for your project',
        priority: 'low',
        files: ['.cloirc.json']
      });
    }

    return suggestions;
  }

  getTestFramework(projectType) {
    const frameworks = {
      'react': 'jest @testing-library/react',
      'vue': 'vitest @vue/test-utils',
      'angular': '@angular/cli',
      'node': 'jest',
      'node-backend': 'jest supertest',
      'python': 'pytest'
    };
    
    return frameworks[projectType] || 'jest';
  }

  async showSuggestions(suggestions) {
    console.log(chalk.cyan(`\n📋 Found ${suggestions.length} enhancement suggestions:\n`));

    const grouped = {
      high: suggestions.filter(s => s.priority === 'high'),
      medium: suggestions.filter(s => s.priority === 'medium'),
      low: suggestions.filter(s => s.priority === 'low')
    };

    for (const [priority, items] of Object.entries(grouped)) {
      if (items.length === 0) continue;
      
      const color = priority === 'high' ? chalk.red : 
                   priority === 'medium' ? chalk.yellow : 
                   chalk.gray;
      
      console.log(color(`${priority.toUpperCase()} Priority:`));
      items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title}`);
        console.log(chalk.gray(`     ${item.description}`));
      });
      console.log();
    }
  }

  async applyEnhancements(suggestions, projectPath) {
    const proceed = await askYesNo('\nWould you like to apply these enhancements?');
    
    if (!proceed) {
      console.log(chalk.yellow('\n👋 No changes made. You can run this command again anytime.'));
      return;
    }

    console.log(chalk.blue('\n🔧 Applying enhancements...\n'));

    for (const suggestion of suggestions) {
      const apply = await askYesNo(`Apply: ${suggestion.title}?`);
      
      if (apply) {
        try {
          await this.applySuggestion(suggestion, projectPath);
          console.log(chalk.green(`  ✅ ${suggestion.title} - Complete`));
        } catch (error) {
          console.log(chalk.red(`  ❌ ${suggestion.title} - Failed: ${error.message}`));
        }
      } else {
        console.log(chalk.gray(`  ⏭️  ${suggestion.title} - Skipped`));
      }
    }

    console.log(chalk.green('\n✨ Enhancement complete!'));
    console.log(chalk.cyan('\n💡 Next steps:'));
    console.log('  • Review the changes made');
    console.log('  • Run any new test/lint commands');
    console.log('  • Commit the improvements');
  }

  async applySuggestion(suggestion, projectPath) {
    // Run installation command if needed
    if (suggestion.command) {
      console.log(chalk.gray(`  Running: ${suggestion.command}`));
      execSync(suggestion.command, { 
        cwd: projectPath,
        stdio: 'inherit'
      });
    }

    // Create files
    if (suggestion.files) {
      for (const file of suggestion.files) {
        await this.createFile(projectPath, file, suggestion.type);
      }
    }

    // Add scripts to package.json
    if (suggestion.scripts) {
      await this.addScripts(projectPath, suggestion.scripts);
    }
  }

  async createFile(projectPath, filename, type) {
    const filePath = path.join(projectPath, filename);
    
    // Don't overwrite existing files
    try {
      await fs.access(filePath);
      return; // File already exists
    } catch {}

    const content = this.getFileContent(filename, type);
    
    // Create directory if needed
    const dir = path.dirname(filePath);
    if (dir !== projectPath) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    await fs.writeFile(filePath, content);
  }

  getFileContent(filename, type) {
    const templates = {
      '.gitignore': `node_modules/
.env
.env.local
dist/
build/
*.log
.DS_Store
coverage/
.vscode/
.idea/`,

      '.eslintrc.json': `{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "indent": ["error", 2],
    "quotes": ["error", "single"],
    "semi": ["error", "always"]
  }
}`,

      '.prettierrc': `{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}`,

      'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`,

      'jest.config.js': `export default {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ]
};`,

      '.github/workflows/ci.yml': `name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
    - run: npm ci
    - run: npm test
    - run: npm run lint`,

      'README.md': `# Project Name

Brief description of your project.

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\`

## License

MIT`,

      '.cloirc.json': `{
  "project": {
    "type": "${type}",
    "enhanced": true,
    "cloi": {
      "version": "1.0.0",
      "autoAnalyze": true,
      "sessionTracking": true,
      "enhancedAt": "${new Date().toISOString()}"
    }
  }
}`
    };

    return templates[filename] || '';
  }

  async addScripts(projectPath, scripts) {
    try {
      const packagePath = path.join(projectPath, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageData = JSON.parse(packageContent);
      
      if (!packageData.scripts) {
        packageData.scripts = {};
      }
      
      for (const [name, command] of Object.entries(scripts)) {
        if (!packageData.scripts[name]) {
          packageData.scripts[name] = command;
        }
      }
      
      await fs.writeFile(packagePath, JSON.stringify(packageData, null, 2));
    } catch (error) {
      console.error('Failed to update package.json scripts:', error);
    }
  }
}

// CLI interface
export async function enhanceProject(projectPath) {
  const enhancer = new ProjectEnhancer();
  
  try {
    await enhancer.enhance(projectPath);
  } catch (error) {
    console.error(chalk.red(`\n❌ Enhancement failed: ${error.message}`));
    process.exit(1);
  }
}