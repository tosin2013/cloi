/**
 * Universal Tool Discovery System
 * 
 * Discovers and categorizes ALL tools available on the system
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class UniversalToolDiscovery {
  constructor() {
    this.cache = new Map();
    this.categories = {
      'project-creators': [],
      'package-managers': [],
      'build-tools': [],
      'testing-tools': [],
      'linters': [],
      'formatters': [],
      'bundlers': [],
      'compilers': [],
      'databases': [],
      'containers': [],
      'cloud-tools': [],
      'version-control': [],
      'editors': [],
      'languages': [],
      'frameworks': [],
      'system-tools': []
    };
  }

  async discoverAll() {
    console.log('🔍 Discovering all available tools on your system...\n');
    
    // Discover from multiple sources
    const discoveries = await Promise.all([
      this.discoverFromPath(),
      this.discoverFromNpm(),
      this.discoverFromBrew(),
      this.discoverFromApt(),
      this.discoverFromSnap(),
      this.discoverFromFlatpak(),
      this.discoverFromPython(),
      this.discoverFromRust(),
      this.discoverFromGo()
    ]);

    // Merge and categorize
    const allTools = this.mergeDiscoveries(discoveries);
    const categorized = this.categorizeTools(allTools);
    
    return categorized;
  }

  async discoverFromPath() {
    const tools = new Set();
    const pathEnv = process.env.PATH || '';
    const pathDirs = pathEnv.split(path.delimiter);

    for (const dir of pathDirs) {
      try {
        const files = await fs.readdir(dir);
        files.forEach(file => {
          // Skip common system files
          if (!this.isSystemFile(file)) {
            tools.add({
              name: file,
              path: path.join(dir, file),
              source: 'PATH',
              category: this.guessCategory(file)
            });
          }
        });
      } catch (error) {
        // Directory doesn't exist or no permission
      }
    }

    return Array.from(tools);
  }

  async discoverFromNpm() {
    const tools = [];
    
    try {
      // Global packages
      const globalOutput = execSync('npm list -g --depth=0 --json', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      const globalPackages = JSON.parse(globalOutput);
      
      if (globalPackages.dependencies) {
        Object.keys(globalPackages.dependencies).forEach(pkg => {
          tools.push({
            name: pkg,
            version: globalPackages.dependencies[pkg].version,
            source: 'npm-global',
            category: this.guessCategory(pkg),
            executable: this.findNpmExecutable(pkg)
          });
        });
      }

      // Local packages (if in a project)
      try {
        const localOutput = execSync('npm list --depth=0 --json', { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        const localPackages = JSON.parse(localOutput);
        
        if (localPackages.dependencies) {
          Object.keys(localPackages.dependencies).forEach(pkg => {
            tools.push({
              name: pkg,
              version: localPackages.dependencies[pkg].version,
              source: 'npm-local',
              category: this.guessCategory(pkg),
              executable: `./node_modules/.bin/${pkg}`
            });
          });
        }
      } catch {
        // Not in an npm project
      }

    } catch (error) {
      // npm not available
    }

    return tools;
  }

  async discoverFromBrew() {
    const tools = [];
    
    try {
      const output = execSync('brew list --formula', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      output.split('\n').forEach(formula => {
        if (formula.trim()) {
          tools.push({
            name: formula.trim(),
            source: 'homebrew',
            category: this.guessCategory(formula.trim()),
            manager: 'brew'
          });
        }
      });
    } catch {
      // Homebrew not available
    }

    return tools;
  }

  async discoverFromApt() {
    const tools = [];
    
    try {
      const output = execSync('dpkg -l | grep "^ii"', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      output.split('\n').forEach(line => {
        const parts = line.split(/\s+/);
        if (parts.length >= 3) {
          const packageName = parts[1];
          tools.push({
            name: packageName,
            version: parts[2],
            source: 'apt',
            category: this.guessCategory(packageName),
            manager: 'apt'
          });
        }
      });
    } catch {
      // apt not available (not Ubuntu/Debian)
    }

    return tools;
  }

  async discoverFromSnap() {
    const tools = [];
    
    try {
      const output = execSync('snap list', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      output.split('\n').slice(1).forEach(line => {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          tools.push({
            name: parts[0],
            version: parts[1],
            source: 'snap',
            category: this.guessCategory(parts[0]),
            manager: 'snap'
          });
        }
      });
    } catch {
      // snap not available
    }

    return tools;
  }

  async discoverFromFlatpak() {
    const tools = [];
    
    try {
      const output = execSync('flatpak list --app', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      output.split('\n').forEach(line => {
        const parts = line.split('\t');
        if (parts.length >= 2) {
          tools.push({
            name: parts[0],
            id: parts[1],
            source: 'flatpak',
            category: this.guessCategory(parts[0]),
            manager: 'flatpak'
          });
        }
      });
    } catch {
      // flatpak not available
    }

    return tools;
  }

  async discoverFromPython() {
    const tools = [];
    
    try {
      // pip packages
      const output = execSync('pip list --format=json', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const packages = JSON.parse(output);
      packages.forEach(pkg => {
        tools.push({
          name: pkg.name,
          version: pkg.version,
          source: 'pip',
          category: this.guessCategory(pkg.name),
          language: 'python'
        });
      });
    } catch {
      // pip not available
    }

    return tools;
  }

  async discoverFromRust() {
    const tools = [];
    
    try {
      // cargo packages
      const cargoHome = process.env.CARGO_HOME || path.join(os.homedir(), '.cargo');
      const binDir = path.join(cargoHome, 'bin');
      
      const files = await fs.readdir(binDir);
      files.forEach(file => {
        tools.push({
          name: file,
          source: 'cargo',
          category: this.guessCategory(file),
          language: 'rust',
          path: path.join(binDir, file)
        });
      });
    } catch {
      // cargo not available
    }

    return tools;
  }

  async discoverFromGo() {
    const tools = [];
    
    try {
      // Go binaries
      const goPath = process.env.GOPATH || path.join(os.homedir(), 'go');
      const binDir = path.join(goPath, 'bin');
      
      const files = await fs.readdir(binDir);
      files.forEach(file => {
        tools.push({
          name: file,
          source: 'go',
          category: this.guessCategory(file),
          language: 'go',
          path: path.join(binDir, file)
        });
      });
    } catch {
      // Go not available
    }

    return tools;
  }

  isSystemFile(filename) {
    const systemFiles = [
      'ls', 'cat', 'grep', 'find', 'cp', 'mv', 'rm', 'mkdir', 'rmdir',
      'ps', 'kill', 'top', 'df', 'du', 'mount', 'umount', 'chmod',
      'chown', 'su', 'sudo', 'which', 'whereis', 'man', 'echo', 'pwd'
    ];
    
    return systemFiles.includes(filename) || filename.startsWith('.');
  }

  guessCategory(toolName) {
    const patterns = {
      'project-creators': ['create-', 'init-', 'new-', 'generate-', 'scaffold'],
      'package-managers': ['npm', 'yarn', 'pnpm', 'pip', 'cargo', 'gem', 'composer'],
      'build-tools': ['webpack', 'vite', 'rollup', 'parcel', 'esbuild', 'grunt', 'gulp'],
      'testing-tools': ['jest', 'mocha', 'cypress', 'playwright', 'selenium', 'karma'],
      'linters': ['eslint', 'tslint', 'pylint', 'flake8', 'clippy', 'golint'],
      'formatters': ['prettier', 'black', 'gofmt', 'rustfmt', 'autopep8'],
      'bundlers': ['webpack', 'rollup', 'parcel', 'browserify'],
      'compilers': ['gcc', 'clang', 'javac', 'rustc', 'go', 'tsc'],
      'databases': ['mysql', 'postgres', 'mongo', 'redis', 'sqlite'],
      'containers': ['docker', 'podman', 'kubectl', 'helm'],
      'cloud-tools': ['aws', 'gcloud', 'azure', 'terraform', 'ansible'],
      'version-control': ['git', 'svn', 'hg', 'bzr'],
      'editors': ['vim', 'nano', 'emacs', 'code', 'atom'],
      'languages': ['node', 'python', 'ruby', 'java', 'go', 'rust', 'php'],
      'frameworks': ['react', 'vue', 'angular', 'express', 'django', 'rails']
    };

    for (const [category, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => toolName.toLowerCase().includes(keyword))) {
        return category;
      }
    }

    return 'system-tools';
  }

  findNpmExecutable(packageName) {
    // Common patterns for npm package executables
    const patterns = [
      packageName,
      packageName.replace('@', '').replace('/', '-'),
      packageName.split('/').pop()
    ];

    return patterns[0]; // Return most likely executable name
  }

  mergeDiscoveries(discoveries) {
    const allTools = new Map();
    
    discoveries.flat().forEach(tool => {
      const key = `${tool.name}-${tool.source}`;
      if (!allTools.has(key)) {
        allTools.set(key, tool);
      }
    });

    return Array.from(allTools.values());
  }

  categorizeTools(tools) {
    const categorized = { ...this.categories };
    
    tools.forEach(tool => {
      const category = tool.category || 'system-tools';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(tool);
    });

    // Remove empty categories
    Object.keys(categorized).forEach(category => {
      if (categorized[category].length === 0) {
        delete categorized[category];
      }
    });

    return categorized;
  }

  async getAvailableCreators() {
    const allTools = await this.discoverAll();
    return allTools['project-creators'] || [];
  }

  async findBestTool(purpose, projectType = null) {
    const allTools = await this.discoverAll();
    
    // Define preferred tools for different purposes
    const preferences = {
      'react-project': ['create-react-app', 'vite', 'next'],
      'vue-project': ['create-vue', 'vue-cli', 'vite'],
      'node-project': ['npm', 'yarn', 'pnpm'],
      'python-project': ['poetry', 'pipenv', 'pip'],
      'build': ['vite', 'webpack', 'rollup', 'esbuild'],
      'test': ['jest', 'vitest', 'mocha', 'cypress'],
      'lint': ['eslint', 'prettier', 'tslint'],
      'format': ['prettier', 'black', 'gofmt']
    };

    const key = projectType ? `${projectType}-${purpose}` : purpose;
    const preferredTools = preferences[key] || preferences[purpose] || [];
    
    // Find best available tool
    for (const preferred of preferredTools) {
      const found = this.findToolByName(allTools, preferred);
      if (found) {
        return found;
      }
    }

    // Return first tool in relevant category
    const category = this.purposeToCategory(purpose);
    const categoryTools = allTools[category];
    return categoryTools && categoryTools.length > 0 ? categoryTools[0] : null;
  }

  findToolByName(categorizedTools, name) {
    for (const category of Object.values(categorizedTools)) {
      const found = category.find(tool => 
        tool.name.toLowerCase().includes(name.toLowerCase())
      );
      if (found) return found;
    }
    return null;
  }

  purposeToCategory(purpose) {
    const mapping = {
      'project': 'project-creators',
      'build': 'build-tools',
      'test': 'testing-tools',
      'lint': 'linters',
      'format': 'formatters'
    };
    
    return mapping[purpose] || 'system-tools';
  }

  async saveDiscovery(tools) {
    // Cache the discovery for faster subsequent runs
    const cacheFile = path.join(os.tmpdir(), 'cloi-tools-cache.json');
    const cacheData = {
      timestamp: Date.now(),
      tools: tools
    };
    
    try {
      await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      // Ignore cache errors
    }
  }

  async loadCachedDiscovery() {
    const cacheFile = path.join(os.tmpdir(), 'cloi-tools-cache.json');
    
    try {
      const cacheData = JSON.parse(await fs.readFile(cacheFile, 'utf8'));
      
      // Use cache if less than 1 hour old
      if (Date.now() - cacheData.timestamp < 3600000) {
        return cacheData.tools;
      }
    } catch (error) {
      // No cache or invalid cache
    }
    
    return null;
  }
}