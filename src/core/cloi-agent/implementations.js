/**
 * Real implementations for Cloi Agent methods
 * 
 * This module provides actual functionality for the placeholder methods
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { UniversalToolDiscovery } from '../tool-discovery/index.js';

const execAsync = promisify(exec);

/**
 * Project Analysis Implementations
 */

export async function detectProjectType() {
  try {
    // Check for various project files
    const checks = [
      { file: 'package.json', type: 'node' },
      { file: 'requirements.txt', type: 'python' },
      { file: 'Cargo.toml', type: 'rust' },
      { file: 'go.mod', type: 'go' },
      { file: 'pom.xml', type: 'java' },
      { file: 'composer.json', type: 'php' },
      { file: 'Gemfile', type: 'ruby' },
      { file: '.csproj', type: 'csharp' }
    ];

    for (const check of checks) {
      try {
        await fs.access(path.join(process.cwd(), check.file));
        return check.type;
      } catch {
        // File doesn't exist, continue
      }
    }

    // Check for framework-specific files
    try {
      await fs.access(path.join(process.cwd(), 'next.config.js'));
      return 'nextjs';
    } catch {}

    try {
      await fs.access(path.join(process.cwd(), 'vite.config.js'));
      return 'vite';
    } catch {}

    return 'unknown';
  } catch (error) {
    console.error('Error detecting project type:', error);
    return 'unknown';
  }
}

export async function detectLanguages() {
  const languages = new Set();
  
  try {
    // Find files by extension
    const { stdout } = await execAsync(
      'find . -type f \\( -name "*.js" -o -name "*.ts" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.java" -o -name "*.cpp" -o -name "*.c" -o -name "*.rb" -o -name "*.php" \\) | grep -v node_modules | head -100'
    );
    
    const files = stdout.split('\n').filter(f => f.trim());
    
    const extensionMap = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.go': 'go',
      '.rs': 'rust',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.rb': 'ruby',
      '.php': 'php'
    };

    files.forEach(file => {
      const ext = path.extname(file);
      if (extensionMap[ext]) {
        languages.add(extensionMap[ext]);
      }
    });
  } catch (error) {
    console.error('Error detecting languages:', error);
  }

  return Array.from(languages);
}

export async function detectFrameworks() {
  const frameworks = [];
  
  try {
    // Check package.json for Node.js frameworks
    const packagePath = path.join(process.cwd(), 'package.json');
    try {
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageData = JSON.parse(packageContent);
      const deps = { ...packageData.dependencies, ...packageData.devDependencies };
      
      // Check for common frameworks
      if (deps.react) frameworks.push('react');
      if (deps.vue) frameworks.push('vue');
      if (deps.angular) frameworks.push('angular');
      if (deps.express) frameworks.push('express');
      if (deps.next) frameworks.push('nextjs');
      if (deps.gatsby) frameworks.push('gatsby');
      if (deps.svelte) frameworks.push('svelte');
      if (deps.fastify) frameworks.push('fastify');
      if (deps.koa) frameworks.push('koa');
    } catch {}

    // Check for Python frameworks
    try {
      const requirementsPath = path.join(process.cwd(), 'requirements.txt');
      const requirements = await fs.readFile(requirementsPath, 'utf8');
      
      if (requirements.includes('django')) frameworks.push('django');
      if (requirements.includes('flask')) frameworks.push('flask');
      if (requirements.includes('fastapi')) frameworks.push('fastapi');
    } catch {}

  } catch (error) {
    console.error('Error detecting frameworks:', error);
  }

  return frameworks;
}

export async function analyzeProjectStructure() {
  try {
    const structure = {
      directories: [],
      hasTests: false,
      hasDocs: false,
      hasCI: false,
      buildTool: null,
      packageManager: null
    };

    // Check common directories
    const dirs = ['src', 'lib', 'test', 'tests', 'docs', 'build', 'dist', 'public'];
    for (const dir of dirs) {
      try {
        await fs.access(path.join(process.cwd(), dir));
        structure.directories.push(dir);
        
        if (dir === 'test' || dir === 'tests') structure.hasTests = true;
        if (dir === 'docs') structure.hasDocs = true;
      } catch {}
    }

    // Check CI/CD
    const ciFiles = ['.github/workflows', '.gitlab-ci.yml', 'Jenkinsfile', '.circleci'];
    for (const ci of ciFiles) {
      try {
        await fs.access(path.join(process.cwd(), ci));
        structure.hasCI = true;
        break;
      } catch {}
    }

    // Detect build tool
    if (await fileExists('webpack.config.js')) structure.buildTool = 'webpack';
    else if (await fileExists('vite.config.js')) structure.buildTool = 'vite';
    else if (await fileExists('rollup.config.js')) structure.buildTool = 'rollup';
    else if (await fileExists('gulpfile.js')) structure.buildTool = 'gulp';

    // Detect package manager
    if (await fileExists('package-lock.json')) structure.packageManager = 'npm';
    else if (await fileExists('yarn.lock')) structure.packageManager = 'yarn';
    else if (await fileExists('pnpm-lock.yaml')) structure.packageManager = 'pnpm';

    return structure;
  } catch (error) {
    console.error('Error analyzing project structure:', error);
    return {};
  }
}

export async function getProjectHistory() {
  try {
    const history = {
      commits: [],
      branches: [],
      contributors: [],
      lastActivity: null
    };

    // Get recent commits
    try {
      const { stdout: commits } = await execAsync(
        'git log --oneline -n 10 --pretty=format:"%h|%an|%ae|%ad|%s" --date=iso'
      );
      
      history.commits = commits.split('\n').map(line => {
        const [hash, author, email, date, message] = line.split('|');
        return { hash, author, email, date, message };
      });

      if (history.commits.length > 0) {
        history.lastActivity = history.commits[0].date;
      }
    } catch {}

    // Get branches
    try {
      const { stdout: branches } = await execAsync('git branch -r');
      history.branches = branches.split('\n')
        .map(b => b.trim())
        .filter(b => b && !b.includes('HEAD'));
    } catch {}

    // Get contributors
    try {
      const { stdout: contributors } = await execAsync(
        'git log --format="%an|%ae" | sort | uniq'
      );
      history.contributors = contributors.split('\n')
        .filter(c => c)
        .map(c => {
          const [name, email] = c.split('|');
          return { name, email };
        });
    } catch {}

    return history;
  } catch (error) {
    console.error('Error getting project history:', error);
    return null;
  }
}

export async function getCurrentContext() {
  try {
    const context = {
      workingDirectory: process.cwd(),
      currentBranch: null,
      modifiedFiles: [],
      untrackedFiles: [],
      activeSessions: []
    };

    // Get git status
    try {
      const { stdout: branch } = await execAsync('git branch --show-current');
      context.currentBranch = branch.trim();

      const { stdout: status } = await execAsync('git status --porcelain');
      const statusLines = status.split('\n').filter(l => l);
      
      statusLines.forEach(line => {
        const [status, file] = line.trim().split(/\s+/);
        if (status.includes('M')) context.modifiedFiles.push(file);
        if (status === '??') context.untrackedFiles.push(file);
      });
    } catch {}

    return context;
  } catch (error) {
    console.error('Error getting current context:', error);
    return {};
  }
}

export async function detectCodePatterns(files) {
  const patterns = [];
  
  try {
    // Sample some files to detect patterns
    const sampleFiles = files.slice(0, 20);
    
    for (const file of sampleFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for common patterns
        if (content.includes('express()')) patterns.push('Express.js');
        if (content.includes('React.Component') || content.includes('useState')) patterns.push('React');
        if (content.includes('async function') || content.includes('await ')) patterns.push('Async/Await');
        if (content.includes('class ') && content.includes('extends')) patterns.push('OOP');
        if (content.includes('module.exports')) patterns.push('CommonJS');
        if (content.includes('export default') || content.includes('import ')) patterns.push('ES Modules');
      } catch {}
    }
  } catch (error) {
    console.error('Error detecting code patterns:', error);
  }

  return [...new Set(patterns)];
}

export function calculateComplexity(fileCount, lineCount) {
  if (fileCount < 10 && lineCount < 1000) return 'simple';
  if (fileCount < 50 && lineCount < 5000) return 'moderate';
  if (fileCount < 200 && lineCount < 20000) return 'complex';
  return 'very complex';
}

export function detectMainLanguage(fileTypes) {
  const languageMap = {
    '.js': 'javascript',
    '.ts': 'typescript',
    '.py': 'python',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java'
  };

  let maxCount = 0;
  let mainLang = 'unknown';

  for (const [ext, count] of Object.entries(fileTypes)) {
    if (count > maxCount && languageMap[ext]) {
      maxCount = count;
      mainLang = languageMap[ext];
    }
  }

  return mainLang;
}

export async function analyzeDirectoryStructure() {
  try {
    const { stdout } = await execAsync(
      'find . -type d -not -path "*/node_modules/*" -not -path "*/.git/*" | head -50'
    );
    
    const dirs = stdout.split('\n').filter(d => d && d !== '.');
    
    // Categorize directories
    const structure = {
      source: dirs.filter(d => d.includes('src') || d.includes('lib')),
      tests: dirs.filter(d => d.includes('test') || d.includes('spec')),
      config: dirs.filter(d => d.includes('config')),
      docs: dirs.filter(d => d.includes('doc')),
      build: dirs.filter(d => d.includes('build') || d.includes('dist'))
    };

    return structure;
  } catch (error) {
    return {};
  }
}

export async function findRelevantFiles(problem) {
  const relevant = [];
  
  try {
    // Extract keywords from problem
    const keywords = problem.description
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Search for files containing keywords
    for (const keyword of keywords.slice(0, 5)) {
      try {
        const { stdout } = await execAsync(
          `grep -r "${keyword}" --include="*.js" --include="*.ts" --include="*.py" . | cut -d: -f1 | uniq | head -10`
        );
        
        const files = stdout.split('\n').filter(f => f);
        relevant.push(...files);
      } catch {}
    }
  } catch (error) {
    console.error('Error finding relevant files:', error);
  }

  return [...new Set(relevant)];
}

export async function getRelevantTools(problem) {
  const discovery = new UniversalToolDiscovery();
  const allTools = await discovery.discoverAll();
  
  // Determine relevant tool categories based on problem
  const problemLower = problem.description.toLowerCase();
  const relevantCategories = [];

  if (problemLower.includes('test') || problemLower.includes('spec')) {
    relevantCategories.push('testing-tools');
  }
  if (problemLower.includes('lint') || problemLower.includes('style')) {
    relevantCategories.push('linters');
  }
  if (problemLower.includes('build') || problemLower.includes('compile')) {
    relevantCategories.push('build-tools');
  }
  if (problemLower.includes('format')) {
    relevantCategories.push('formatters');
  }

  const relevant = {};
  for (const category of relevantCategories) {
    if (allTools[category]) {
      relevant[category] = allTools[category];
    }
  }

  return relevant;
}

// Helper function
async function fileExists(filename) {
  try {
    await fs.access(path.join(process.cwd(), filename));
    return true;
  } catch {
    return false;
  }
}