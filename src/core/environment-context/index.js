/**
 * Environment Context Provider
 * 
 * Provides formatted environmental context for LLM interactions,
 * ensuring AIs have accurate information about the runtime environment.
 */

import { pluginManager } from '../plugin-manager/index.js';

export class EnvironmentContextProvider {
  constructor() {
    this.environmentAnalyzer = null;
    this.contextCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async initialize() {
    // Load the environment analyzer plugin
    try {
      await pluginManager.discoverPlugins();
      this.environmentAnalyzer = await pluginManager.loadPlugin('analyzers', 'environment');
      console.log('✅ Environment context provider initialized');
      return true;
    } catch (error) {
      console.warn('⚠️  Environment analyzer not available:', error.message);
      return false;
    }
  }

  /**
   * Get environment context formatted for LLM consumption
   */
  async getContextForLLM(includeDetails = false) {
    if (!this.environmentAnalyzer) {
      return this.getFallbackContext();
    }

    const cacheKey = `llm-context-${includeDetails}`;
    const cached = this.contextCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.context;
    }

    try {
      const environment = await this.environmentAnalyzer.getEnvironment();
      const context = this.formatEnvironmentForLLM(environment, includeDetails);
      
      this.contextCache.set(cacheKey, {
        context,
        timestamp: Date.now()
      });
      
      return context;
    } catch (error) {
      console.warn('Failed to get environment context:', error.message);
      return this.getFallbackContext();
    }
  }

  /**
   * Format environment information for LLM consumption
   */
  formatEnvironmentForLLM(environment, includeDetails = false) {
    const context = {
      // Core system information
      system: {
        platform: environment.system.platform,
        architecture: environment.system.arch,
        operatingSystem: this.getOSDescription(environment.system),
        user: environment.system.user.username,
        workingDirectory: environment.project.cwd
      },

      // Runtime information
      runtime: {
        nodejs: {
          version: environment.node.version,
          path: environment.node.execPath
        },
        packageManagers: this.getAvailablePackageManagers(environment.packages),
        python: environment.python.python3 ? {
          version: environment.python.python3.version,
          virtualenv: environment.python.virtualenv?.active || false
        } : null
      },

      // Development tools
      tools: {
        available: this.getAvailableTools(environment.tools),
        versionControl: environment.tools.git.available ? 'git' : null,
        containerization: this.getContainerTools(environment.containers, environment.tools),
        cloudContext: this.getCloudContext(environment.cloud)
      },

      // Project context
      project: {
        type: this.inferProjectType(environment.project),
        languages: environment.project.languages,
        hasGit: environment.project.hasGit,
        packageManager: this.getProjectPackageManager(environment.project),
        deployment: this.getDeploymentContext(environment.deployment)
      },

      // Capabilities and constraints
      capabilities: environment.system.capabilities || [],
      constraints: this.identifyConstraints(environment),

      // Network and connectivity
      connectivity: {
        internet: environment.network.internetConnected,
        hostname: environment.network.hostname
      }
    };

    if (includeDetails) {
      context.detailed = {
        systemResources: environment.resources,
        environmentVariables: this.getRelevantEnvVars(environment.node.env),
        installedPackages: environment.project.package,
        securityContext: environment.security
      };
    }

    return context;
  }

  /**
   * Get environment context for error analysis
   */
  async getContextForError(errorMessage, errorContext = {}) {
    if (!this.environmentAnalyzer) {
      return { error: 'Environment analyzer not available' };
    }

    const environment = await this.environmentAnalyzer.getEnvironment();
    const relevantContext = this.extractRelevantContext(environment, errorMessage, errorContext);
    
    return {
      ...relevantContext,
      suggestions: await this.environmentAnalyzer.generateEnvironmentSuggestions(errorMessage, environment),
      troubleshooting: this.generateTroubleshootingSteps(errorMessage, environment)
    };
  }

  /**
   * Extract context relevant to a specific error
   */
  extractRelevantContext(environment, errorMessage, errorContext) {
    const relevant = {
      system: environment.system.platform,
      tools: {},
      project: environment.project
    };

    // File system errors
    if (/ENOENT|EACCES|file|directory/.test(errorMessage)) {
      relevant.filesystem = {
        permissions: environment.security.user,
        workingDirectory: environment.project.cwd,
        isRoot: environment.security.isRoot
      };
    }

    // Package manager errors
    if (/npm|yarn|pnpm/.test(errorMessage)) {
      relevant.packageManagers = environment.packages;
      relevant.nodeVersion = environment.node.version;
    }

    // Git errors
    if (/git/.test(errorMessage)) {
      relevant.git = {
        available: environment.tools.git.available,
        project: environment.project.git
      };
    }

    // Network errors
    if (/network|fetch|timeout|ECONNREFUSED/.test(errorMessage)) {
      relevant.network = environment.network;
      relevant.connectivity = environment.network.internetConnected;
    }

    // Container errors
    if (/docker|container/.test(errorMessage)) {
      relevant.containers = environment.containers;
      relevant.tools.docker = environment.tools.docker;
    }

    return relevant;
  }

  /**
   * Generate troubleshooting steps based on environment
   */
  generateTroubleshootingSteps(errorMessage, environment) {
    const steps = [];

    // Permission errors
    if (/permission|EACCES/.test(errorMessage)) {
      if (environment.system.platform !== 'win32') {
        steps.push('Check file permissions with: ls -la');
        if (!environment.security.isRoot) {
          steps.push('Try with elevated permissions: sudo');
        }
      }
    }

    // Missing command errors
    if (/command not found|ENOENT/.test(errorMessage)) {
      steps.push('Verify the command is installed');
      steps.push('Check your PATH environment variable');
      
      const missingTools = this.identifyMissingTools(errorMessage, environment);
      if (missingTools.length > 0) {
        steps.push(`Install missing tools: ${missingTools.join(', ')}`);
      }
    }

    // Network errors
    if (/network|fetch|timeout/.test(errorMessage)) {
      steps.push('Check internet connectivity');
      if (!environment.network.internetConnected) {
        steps.push('No internet connection detected');
      }
    }

    // Node.js specific errors
    if (/node_modules|npm|package\.json/.test(errorMessage)) {
      steps.push('Try: npm install');
      steps.push('Clear cache: npm cache clean --force');
      steps.push('Delete node_modules and reinstall');
    }

    return steps;
  }

  /**
   * Helper methods
   */
  getOSDescription(system) {
    const descriptions = {
      darwin: `macOS ${system.macos?.version || 'Unknown'}`,
      linux: system.linux?.PRETTY_NAME || `Linux ${system.release}`,
      win32: `Windows ${system.windows?.version || system.release}`
    };
    
    return descriptions[system.platform] || `${system.platform} ${system.release}`;
  }

  getAvailablePackageManagers(packages) {
    return Object.keys(packages).filter(pm => packages[pm].available);
  }

  getAvailableTools(tools) {
    return Object.keys(tools).filter(tool => tools[tool].available);
  }

  getContainerTools(containers, tools) {
    const containerTools = [];
    if (tools.docker?.available) containerTools.push('docker');
    if (tools.podman?.available) containerTools.push('podman');
    if (containers.inDocker) containerTools.push('running-in-docker');
    return containerTools;
  }

  getCloudContext(cloud) {
    const contexts = [];
    if (cloud.aws) contexts.push(`AWS (${cloud.aws.region})`);
    if (cloud.gcp) contexts.push(`GCP (${cloud.gcp.project})`);
    if (cloud.azure) contexts.push('Azure');
    if (cloud.heroku) contexts.push(`Heroku (${cloud.heroku.app})`);
    return contexts;
  }

  inferProjectType(project) {
    if (project.package?.dependencies?.react) return 'React';
    if (project.package?.dependencies?.vue) return 'Vue.js';
    if (project.package?.dependencies?.express) return 'Node.js/Express';
    if (project.package?.dependencies?.next) return 'Next.js';
    if (project.languages.includes('python')) return 'Python';
    if (project.languages.includes('javascript')) return 'JavaScript/Node.js';
    return 'Unknown';
  }

  getProjectPackageManager(project) {
    if (project.package) {
      // Detect from lock files
      return 'npm'; // Simplified for now
    }
    return null;
  }

  getDeploymentContext(deployment) {
    const contexts = [];
    if (deployment.Dockerfile) contexts.push('Docker');
    if (deployment['docker-compose.yml']) contexts.push('Docker Compose');
    if (deployment.Procfile) contexts.push('Heroku');
    if (deployment['app.yaml']) contexts.push('Google App Engine');
    if (deployment['.github/workflows/']) contexts.push('GitHub Actions');
    return contexts;
  }

  identifyConstraints(environment) {
    const constraints = [];
    
    if (!environment.network.internetConnected) {
      constraints.push('No internet connectivity');
    }
    
    if (environment.containers.inDocker) {
      constraints.push('Running in Docker container');
    }
    
    if (environment.security.isRoot) {
      constraints.push('Running as root user');
    }
    
    if (!environment.tools.git.available) {
      constraints.push('Git not available');
    }
    
    return constraints;
  }

  getRelevantEnvVars(env) {
    const relevant = {};
    const relevantKeys = [
      'NODE_ENV', 'PORT', 'HOST', 'DEBUG',
      'PATH', 'HOME', 'SHELL',
      'CI', 'GITHUB_ACTIONS', 'HEROKU_APP_NAME'
    ];
    
    for (const key of relevantKeys) {
      if (env[key]) {
        relevant[key] = env[key];
      }
    }
    
    return relevant;
  }

  identifyMissingTools(errorMessage, environment) {
    const tools = [];
    const toolPatterns = {
      git: /git/,
      docker: /docker/,
      python: /python/,
      node: /node/,
      npm: /npm/
    };
    
    for (const [tool, pattern] of Object.entries(toolPatterns)) {
      if (pattern.test(errorMessage) && !environment.tools[tool]?.available) {
        tools.push(tool);
      }
    }
    
    return tools;
  }

  getFallbackContext() {
    return {
      system: {
        platform: process.platform,
        architecture: process.arch,
        nodeVersion: process.version,
        workingDirectory: process.cwd()
      },
      error: 'Detailed environment analysis not available'
    };
  }

  /**
   * Get context formatted for A2A protocol
   */
  async getContextForA2A() {
    const context = await this.getContextForLLM(true);
    
    return {
      environment: context,
      timestamp: new Date().toISOString(),
      capabilities: [
        'file-operations',
        'command-execution',
        'package-management',
        'git-operations'
      ].filter(cap => this.hasCapability(cap, context)),
      
      recommendations: [
        'Always check environment constraints before suggesting commands',
        'Use appropriate package manager for the detected system',
        'Consider platform-specific differences in commands',
        'Verify tool availability before suggesting usage'
      ]
    };
  }

  hasCapability(capability, context) {
    const capabilityMap = {
      'file-operations': true, // Always available
      'command-execution': true, // Always available
      'package-management': context.runtime.packageManagers.length > 0,
      'git-operations': context.tools.versionControl === 'git'
    };
    
    return capabilityMap[capability] || false;
  }
}

// Export singleton instance
export const environmentContext = new EnvironmentContextProvider();