/**
 * Environment Awareness Analyzer
 * 
 * Provides deep knowledge of the actual runtime environment including
 * OS, packages, system state, and deployment context for better LLM assistance.
 */

import { BaseAnalyzer } from '../../../core/plugin-manager/interfaces.js';
import { execSync, spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export default class EnvironmentAnalyzer extends BaseAnalyzer {
  constructor(manifest, config = {}) {
    super(manifest, config);
    this.environmentCache = new Map();
    this.lastScan = 0;
    this.scanInterval = 5 * 60 * 1000; // 5 minutes
  }

  async initialize() {
    await this.discoverEnvironment();
    return true;
  }

  supports(context) {
    // Always available to provide environmental context
    return true;
  }

  async analyze(errorOutput, context) {
    const environment = await this.getEnvironment();
    
    return {
      analyzer: 'environment',
      language: 'system',
      framework: ['environment'],
      errorType: 'environment-context',
      confidence: 1.0,
      environment,
      suggestions: await this.generateEnvironmentSuggestions(errorOutput, environment),
      metadata: {
        contextType: 'environment',
        lastUpdated: new Date().toISOString(),
        systemFingerprint: this.generateSystemFingerprint(environment)
      }
    };
  }

  /**
   * Comprehensive environment discovery
   */
  async discoverEnvironment() {
    console.log('🔍 Discovering environment context...');
    
    const environment = {
      system: await this.getSystemInfo(),
      node: await this.getNodeEnvironment(),
      python: await this.getPythonEnvironment(),
      packages: await this.getPackageManagers(),
      tools: await this.getDevTools(),
      containers: await this.getContainerInfo(),
      cloud: await this.getCloudContext(),
      network: await this.getNetworkInfo(),
      security: await this.getSecurityContext(),
      resources: await this.getResourceInfo(),
      project: await this.getProjectContext(),
      deployment: await this.getDeploymentContext()
    };

    this.environmentCache.set('current', environment);
    this.lastScan = Date.now();
    
    return environment;
  }

  /**
   * Get system information
   */
  async getSystemInfo() {
    const system = {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      shell: process.env.SHELL || 'unknown',
      user: os.userInfo(),
      tmpdir: os.tmpdir(),
      homedir: os.homedir()
    };

    // Add OS-specific details
    try {
      if (system.platform === 'darwin') {
        const macInfo = await this.getMacOSInfo();
        system.macos = macInfo;
      } else if (system.platform === 'linux') {
        const linuxInfo = await this.getLinuxInfo();
        system.linux = linuxInfo;
      } else if (system.platform === 'win32') {
        const windowsInfo = await this.getWindowsInfo();
        system.windows = windowsInfo;
      }
    } catch (error) {
      system.osInfoError = error.message;
    }

    return system;
  }

  /**
   * Get Node.js environment details
   */
  async getNodeEnvironment() {
    const nodeEnv = {
      version: process.version,
      versions: process.versions,
      execPath: process.execPath,
      argv: process.argv,
      cwd: process.cwd(),
      env: this.sanitizeEnvironmentVariables(process.env)
    };

    // Check for package managers
    try {
      nodeEnv.npm = {
        version: execSync('npm --version', { encoding: 'utf8' }).trim(),
        globalPath: execSync('npm root -g', { encoding: 'utf8' }).trim()
      };
    } catch {}

    try {
      nodeEnv.yarn = {
        version: execSync('yarn --version', { encoding: 'utf8' }).trim()
      };
    } catch {}

    try {
      nodeEnv.pnpm = {
        version: execSync('pnpm --version', { encoding: 'utf8' }).trim()
      };
    } catch {}

    return nodeEnv;
  }

  /**
   * Get Python environment details
   */
  async getPythonEnvironment() {
    const pythonEnv = {};

    try {
      const pythonVersion = execSync('python3 --version', { encoding: 'utf8' }).trim();
      pythonEnv.python3 = {
        version: pythonVersion,
        path: execSync('which python3', { encoding: 'utf8' }).trim()
      };

      // Check for pip
      try {
        pythonEnv.pip = {
          version: execSync('pip3 --version', { encoding: 'utf8' }).trim()
        };
      } catch {}

      // Check for virtual environments
      if (process.env.VIRTUAL_ENV) {
        pythonEnv.virtualenv = {
          path: process.env.VIRTUAL_ENV,
          active: true
        };
      }

      // Check for conda
      try {
        pythonEnv.conda = {
          version: execSync('conda --version', { encoding: 'utf8' }).trim(),
          env: process.env.CONDA_DEFAULT_ENV
        };
      } catch {}

    } catch (error) {
      pythonEnv.error = 'Python not available';
    }

    return pythonEnv;
  }

  /**
   * Get package manager information
   */
  async getPackageManagers() {
    const managers = {};

    // System package managers
    const systemManagers = {
      brew: { cmd: 'brew --version', platform: 'darwin' },
      apt: { cmd: 'apt --version', platform: 'linux' },
      yum: { cmd: 'yum --version', platform: 'linux' },
      dnf: { cmd: 'dnf --version', platform: 'linux' },
      pacman: { cmd: 'pacman --version', platform: 'linux' },
      chocolatey: { cmd: 'choco --version', platform: 'win32' },
      winget: { cmd: 'winget --version', platform: 'win32' }
    };

    for (const [name, config] of Object.entries(systemManagers)) {
      if (config.platform === 'all' || config.platform === os.platform()) {
        try {
          const version = execSync(config.cmd, { encoding: 'utf8', timeout: 5000 }).trim();
          managers[name] = { version, available: true };
        } catch {
          managers[name] = { available: false };
        }
      }
    }

    return managers;
  }

  /**
   * Get development tools information
   */
  async getDevTools() {
    const tools = {};

    const devTools = [
      'git', 'docker', 'kubectl', 'terraform', 'ansible',
      'mysql', 'postgres', 'redis', 'mongodb',
      'nginx', 'apache2', 'sqlite3',
      'java', 'mvn', 'gradle', 'go', 'rust', 'cargo'
    ];

    for (const tool of devTools) {
      try {
        const version = execSync(`${tool} --version`, { 
          encoding: 'utf8', 
          timeout: 3000,
          stdio: ['ignore', 'pipe', 'ignore']
        }).trim();
        tools[tool] = { version, available: true };
      } catch {
        tools[tool] = { available: false };
      }
    }

    return tools;
  }

  /**
   * Get container and virtualization info
   */
  async getContainerInfo() {
    const containers = {};

    // Check if running in container
    try {
      await fs.access('/.dockerenv');
      containers.inDocker = true;
    } catch {
      containers.inDocker = false;
    }

    // Check for container tools
    try {
      containers.docker = {
        version: execSync('docker --version', { encoding: 'utf8' }).trim(),
        available: true
      };
    } catch {
      containers.docker = { available: false };
    }

    try {
      containers.podman = {
        version: execSync('podman --version', { encoding: 'utf8' }).trim(),
        available: true
      };
    } catch {
      containers.podman = { available: false };
    }

    return containers;
  }

  /**
   * Get cloud context information
   */
  async getCloudContext() {
    const cloud = {};

    // AWS
    if (process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION) {
      cloud.aws = {
        region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION,
        profile: process.env.AWS_PROFILE,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ? '[SET]' : '[NOT SET]'
      };
    }

    // Google Cloud
    if (process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT) {
      cloud.gcp = {
        project: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT,
        credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS ? '[SET]' : '[NOT SET]'
      };
    }

    // Azure
    if (process.env.AZURE_CLIENT_ID) {
      cloud.azure = {
        clientId: '[SET]',
        tenantId: process.env.AZURE_TENANT_ID ? '[SET]' : '[NOT SET]'
      };
    }

    // Heroku
    if (process.env.HEROKU_APP_NAME) {
      cloud.heroku = {
        app: process.env.HEROKU_APP_NAME
      };
    }

    return cloud;
  }

  /**
   * Get network information
   */
  async getNetworkInfo() {
    const network = {
      interfaces: os.networkInterfaces(),
      hostname: os.hostname()
    };

    // Check internet connectivity
    try {
      execSync('ping -c 1 8.8.8.8', { timeout: 3000 });
      network.internetConnected = true;
    } catch {
      network.internetConnected = false;
    }

    return network;
  }

  /**
   * Get security context
   */
  async getSecurityContext() {
    const security = {
      user: os.userInfo(),
      isRoot: process.getuid ? process.getuid() === 0 : false,
      nodeIntegrity: process.env.NODE_OPTIONS || 'default'
    };

    // Check for security tools
    try {
      security.sudo = {
        available: !!execSync('which sudo', { encoding: 'utf8' }).trim()
      };
    } catch {
      security.sudo = { available: false };
    }

    return security;
  }

  /**
   * Get system resource information
   */
  async getResourceInfo() {
    return {
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        usage: process.memoryUsage()
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0]?.model,
        loadavg: os.loadavg()
      },
      disk: await this.getDiskInfo()
    };
  }

  /**
   * Get project-specific context
   */
  async getProjectContext() {
    const project = {
      cwd: process.cwd(),
      hasPackageJson: false,
      hasGit: false,
      languages: []
    };

    try {
      await fs.access('package.json');
      project.hasPackageJson = true;
      
      const packageData = JSON.parse(await fs.readFile('package.json', 'utf8'));
      project.package = {
        name: packageData.name,
        version: packageData.version,
        main: packageData.main,
        scripts: Object.keys(packageData.scripts || {}),
        dependencies: Object.keys(packageData.dependencies || {}),
        devDependencies: Object.keys(packageData.devDependencies || {})
      };
    } catch {}

    try {
      await fs.access('.git');
      project.hasGit = true;
      
      const gitBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const gitRemote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      project.git = { branch: gitBranch, remote: gitRemote };
    } catch {}

    // Detect languages
    const files = await fs.readdir('.').catch(() => []);
    if (files.some(f => f.endsWith('.js') || f.endsWith('.ts'))) project.languages.push('javascript');
    if (files.some(f => f.endsWith('.py'))) project.languages.push('python');
    if (files.some(f => f.endsWith('.go'))) project.languages.push('go');
    if (files.some(f => f.endsWith('.rs'))) project.languages.push('rust');

    return project;
  }

  /**
   * Get deployment context
   */
  async getDeploymentContext() {
    const deployment = {};

    // Check for deployment configs
    const deploymentFiles = [
      'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
      'Procfile', 'app.yaml', 'serverless.yml',
      'terraform/', 'ansible/', '.github/workflows/',
      'Makefile', 'justfile'
    ];

    for (const file of deploymentFiles) {
      try {
        await fs.access(file);
        deployment[file] = true;
      } catch {
        deployment[file] = false;
      }
    }

    return deployment;
  }

  /**
   * Platform-specific information
   */
  async getMacOSInfo() {
    try {
      const version = execSync('sw_vers -productVersion', { encoding: 'utf8' }).trim();
      const build = execSync('sw_vers -buildVersion', { encoding: 'utf8' }).trim();
      return { version, build };
    } catch {
      return {};
    }
  }

  async getLinuxInfo() {
    try {
      const release = await fs.readFile('/etc/os-release', 'utf8');
      const distro = {};
      release.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          distro[key] = value.replace(/"/g, '');
        }
      });
      return distro;
    } catch {
      return {};
    }
  }

  async getWindowsInfo() {
    try {
      const version = execSync('ver', { encoding: 'utf8' }).trim();
      return { version };
    } catch {
      return {};
    }
  }

  async getDiskInfo() {
    try {
      if (os.platform() === 'darwin' || os.platform() === 'linux') {
        const output = execSync('df -h .', { encoding: 'utf8' });
        const lines = output.split('\n');
        if (lines.length > 1) {
          const parts = lines[1].split(/\s+/);
          return {
            total: parts[1],
            used: parts[2],
            available: parts[3],
            usage: parts[4]
          };
        }
      }
    } catch {}
    return {};
  }

  /**
   * Sanitize environment variables (remove sensitive data)
   */
  sanitizeEnvironmentVariables(env) {
    const sanitized = {};
    const sensitivePatterns = [
      /password/i, /secret/i, /key/i, /token/i, /auth/i, /credential/i
    ];

    for (const [key, value] of Object.entries(env)) {
      if (sensitivePatterns.some(pattern => pattern.test(key))) {
        sanitized[key] = '[HIDDEN]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Generate system fingerprint for change detection
   */
  generateSystemFingerprint(environment) {
    const fingerprint = {
      platform: environment.system.platform,
      arch: environment.system.arch,
      nodeVersion: environment.node.version,
      packageManagers: Object.keys(environment.packages).filter(pm => environment.packages[pm].available),
      availableTools: Object.keys(environment.tools).filter(tool => environment.tools[tool].available)
    };

    return Buffer.from(JSON.stringify(fingerprint)).toString('base64');
  }

  /**
   * Get current environment (cached or refresh)
   */
  async getEnvironment(forceRefresh = false) {
    const now = Date.now();
    
    if (forceRefresh || (now - this.lastScan) > this.scanInterval) {
      return await this.discoverEnvironment();
    }

    return this.environmentCache.get('current') || await this.discoverEnvironment();
  }

  /**
   * Generate environment-aware suggestions
   */
  async generateEnvironmentSuggestions(errorOutput, environment) {
    const suggestions = [];

    // Missing tools suggestions
    if (!environment.tools.git.available) {
      suggestions.push({
        title: 'Install Git',
        description: 'Git is not available but commonly needed for development',
        command: this.getInstallCommand('git', environment),
        priority: 'high'
      });
    }

    if (!environment.tools.docker.available && environment.deployment.Dockerfile) {
      suggestions.push({
        title: 'Install Docker',
        description: 'Dockerfile found but Docker is not available',
        command: this.getInstallCommand('docker', environment),
        priority: 'high'
      });
    }

    // Environment-specific error suggestions
    if (errorOutput.includes('permission denied') && !environment.security.isRoot) {
      suggestions.push({
        title: 'Try with elevated permissions',
        description: 'Permission error detected, may need sudo/admin rights',
        command: 'sudo',
        priority: 'medium'
      });
    }

    if (errorOutput.includes('ENOENT') || errorOutput.includes('command not found')) {
      suggestions.push({
        title: 'Check PATH environment',
        description: 'Command not found, may need to install or add to PATH',
        priority: 'medium'
      });
    }

    return suggestions;
  }

  /**
   * Get platform-appropriate install command
   */
  getInstallCommand(tool, environment) {
    const platform = environment.system.platform;
    const commands = {
      darwin: `brew install ${tool}`,
      linux: environment.packages.apt?.available ? `sudo apt install ${tool}` : 
             environment.packages.yum?.available ? `sudo yum install ${tool}` : 
             `# Install ${tool} using your package manager`,
      win32: environment.packages.chocolatey?.available ? `choco install ${tool}` : 
             environment.packages.winget?.available ? `winget install ${tool}` : 
             `# Install ${tool} using package manager`
    };

    return commands[platform] || `# Install ${tool}`;
  }

  /**
   * Export environment context for LLM consumption
   */
  async getEnvironmentContext() {
    const environment = await this.getEnvironment();
    
    return {
      summary: this.generateEnvironmentSummary(environment),
      capabilities: this.generateCapabilitiesList(environment),
      constraints: this.generateConstraintsList(environment),
      recommendations: await this.generateEnvironmentSuggestions('', environment),
      full: environment
    };
  }

  generateEnvironmentSummary(environment) {
    return `Running on ${environment.system.platform} ${environment.system.arch} with Node.js ${environment.node.version}. Available tools: ${Object.keys(environment.tools).filter(t => environment.tools[t].available).join(', ')}. Project: ${environment.project.languages.join(', ')} project${environment.project.hasGit ? ' with Git' : ''}.`;
  }

  generateCapabilitiesList(environment) {
    const capabilities = [];
    
    if (environment.tools.git.available) capabilities.push('Version control with Git');
    if (environment.tools.docker.available) capabilities.push('Container deployment');
    if (environment.tools.kubectl.available) capabilities.push('Kubernetes deployment');
    if (environment.packages.npm) capabilities.push('Node.js package management');
    if (environment.python.python3) capabilities.push('Python development');
    
    return capabilities;
  }

  generateConstraintsList(environment) {
    const constraints = [];
    
    if (!environment.network.internetConnected) constraints.push('No internet connectivity');
    if (environment.containers.inDocker) constraints.push('Running in Docker container');
    if (environment.security.isRoot) constraints.push('Running as root user');
    if (!environment.tools.git.available) constraints.push('Git not available');
    
    return constraints;
  }
}