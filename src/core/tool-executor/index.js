/**
 * Tool Executor - Execute discovered development tools
 * 
 * Provides safe execution of development tools with proper error handling,
 * logging, and integration with environment context.
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { environmentContext } from '../environment-context/index.js';

export class ToolExecutor {
  constructor(options = {}) {
    this.options = {
      timeout: 120000, // 2 minutes default timeout
      maxBuffer: 1024 * 1024, // 1MB buffer
      dryRun: false,
      logOutput: true,
      ...options
    };
    this.executionHistory = [];
    this.supportedTools = new Map();
    this.initializeSupportedTools();
  }

  /**
   * Initialize supported tools with their execution strategies
   */
  initializeSupportedTools() {
    // Package managers
    this.supportedTools.set('npm', {
      type: 'package-manager',
      commands: {
        install: 'npm install',
        'install-dev': 'npm install --save-dev',
        'install-global': 'npm install -g',
        run: 'npm run',
        test: 'npm test',
        build: 'npm run build',
        start: 'npm start',
        audit: 'npm audit',
        'audit-fix': 'npm audit fix',
        outdated: 'npm outdated',
        update: 'npm update',
        cache: 'npm cache clean --force'
      },
      requiresArgs: ['install', 'install-dev', 'install-global', 'run'],
      safeCommands: ['install', 'test', 'build', 'audit', 'outdated'],
      dangerousCommands: ['audit-fix', 'update', 'cache']
    });

    this.supportedTools.set('yarn', {
      type: 'package-manager',
      commands: {
        install: 'yarn install',
        add: 'yarn add',
        'add-dev': 'yarn add --dev',
        'add-global': 'yarn global add',
        run: 'yarn run',
        test: 'yarn test',
        build: 'yarn build',
        start: 'yarn start',
        audit: 'yarn audit',
        outdated: 'yarn outdated',
        upgrade: 'yarn upgrade'
      },
      requiresArgs: ['add', 'add-dev', 'add-global', 'run'],
      safeCommands: ['install', 'test', 'build', 'audit', 'outdated'],
      dangerousCommands: ['upgrade']
    });

    this.supportedTools.set('pnpm', {
      type: 'package-manager',
      commands: {
        install: 'pnpm install',
        add: 'pnpm add',
        'add-dev': 'pnpm add --save-dev',
        'add-global': 'pnpm add --global',
        run: 'pnpm run',
        test: 'pnpm test',
        build: 'pnpm build',
        start: 'pnpm start',
        audit: 'pnpm audit',
        outdated: 'pnpm outdated',
        update: 'pnpm update'
      },
      requiresArgs: ['add', 'add-dev', 'add-global', 'run'],
      safeCommands: ['install', 'test', 'build', 'audit', 'outdated'],
      dangerousCommands: ['update']
    });

    // Git operations
    this.supportedTools.set('git', {
      type: 'version-control',
      commands: {
        status: 'git status',
        log: 'git log --oneline -10',
        'log-graph': 'git log --graph --oneline --all -10',
        diff: 'git diff',
        'diff-staged': 'git diff --staged',
        'diff-cached': 'git diff --cached',
        branch: 'git branch',
        'branch-all': 'git branch -a',
        'branch-remote': 'git branch -r',
        remote: 'git remote -v',
        fetch: 'git fetch',
        pull: 'git pull',
        push: 'git push',
        add: 'git add',
        commit: 'git commit',
        checkout: 'git checkout',
        merge: 'git merge',
        rebase: 'git rebase',
        stash: 'git stash',
        'stash-list': 'git stash list',
        'stash-pop': 'git stash pop',
        'stash-apply': 'git stash apply',
        reset: 'git reset',
        'reset-hard': 'git reset --hard',
        clean: 'git clean -fd'
      },
      requiresArgs: ['add', 'commit', 'checkout', 'merge', 'rebase', 'reset'],
      safeCommands: ['status', 'log', 'diff', 'branch', 'remote', 'fetch', 'stash-list'],
      dangerousCommands: ['reset-hard', 'clean', 'push', 'rebase']
    });

    // Python tools
    this.supportedTools.set('pip', {
      type: 'package-manager',
      commands: {
        install: 'pip install',
        'install-dev': 'pip install --editable',
        'install-user': 'pip install --user',
        uninstall: 'pip uninstall',
        list: 'pip list',
        show: 'pip show',
        freeze: 'pip freeze',
        'freeze-requirements': 'pip freeze > requirements.txt',
        check: 'pip check',
        outdated: 'pip list --outdated'
      },
      requiresArgs: ['install', 'install-dev', 'install-user', 'uninstall', 'show'],
      safeCommands: ['list', 'show', 'freeze', 'check', 'outdated'],
      dangerousCommands: ['uninstall', 'freeze-requirements']
    });

    this.supportedTools.set('python', {
      type: 'interpreter',
      commands: {
        version: 'python --version',
        'version3': 'python3 --version',
        run: 'python',
        'run3': 'python3',
        test: 'python -m pytest',
        'test-verbose': 'python -m pytest -v',
        'test-coverage': 'python -m pytest --cov',
        lint: 'python -m flake8',
        format: 'python -m black',
        'format-check': 'python -m black --check'
      },
      requiresArgs: ['run', 'run3'],
      safeCommands: ['version', 'version3', 'test', 'lint', 'format-check'],
      dangerousCommands: ['format']
    });

    // Docker tools
    this.supportedTools.set('docker', {
      type: 'containerization',
      commands: {
        version: 'docker --version',
        ps: 'docker ps',
        'ps-all': 'docker ps -a',
        images: 'docker images',
        build: 'docker build',
        run: 'docker run',
        exec: 'docker exec',
        logs: 'docker logs',
        stop: 'docker stop',
        start: 'docker start',
        restart: 'docker restart',
        rm: 'docker rm',
        rmi: 'docker rmi',
        'system-prune': 'docker system prune',
        'compose-up': 'docker-compose up',
        'compose-down': 'docker-compose down',
        'compose-logs': 'docker-compose logs'
      },
      requiresArgs: ['build', 'run', 'exec', 'logs', 'stop', 'start', 'restart', 'rm', 'rmi'],
      safeCommands: ['version', 'ps', 'images', 'logs'],
      dangerousCommands: ['system-prune', 'rm', 'rmi', 'compose-down']
    });

    // Database tools
    this.supportedTools.set('psql', {
      type: 'database',
      commands: {
        version: 'psql --version',
        connect: 'psql',
        'list-databases': 'psql -l',
        'list-tables': 'psql -d DATABASE -c "\\dt"',
        dump: 'pg_dump',
        restore: 'pg_restore'
      },
      requiresArgs: ['connect', 'list-tables', 'dump', 'restore'],
      safeCommands: ['version', 'list-databases'],
      dangerousCommands: ['dump', 'restore']
    });

    this.supportedTools.set('mysql', {
      type: 'database',
      commands: {
        version: 'mysql --version',
        connect: 'mysql',
        'show-databases': 'mysql -e "SHOW DATABASES;"',
        'show-tables': 'mysql -e "SHOW TABLES;" DATABASE',
        dump: 'mysqldump',
        restore: 'mysql'
      },
      requiresArgs: ['connect', 'show-tables', 'dump', 'restore'],
      safeCommands: ['version', 'show-databases'],
      dangerousCommands: ['dump', 'restore']
    });

    // System tools
    this.supportedTools.set('brew', {
      type: 'system-package-manager',
      commands: {
        install: 'brew install',
        uninstall: 'brew uninstall',
        update: 'brew update',
        upgrade: 'brew upgrade',
        list: 'brew list',
        search: 'brew search',
        info: 'brew info',
        outdated: 'brew outdated',
        cleanup: 'brew cleanup',
        doctor: 'brew doctor'
      },
      requiresArgs: ['install', 'uninstall', 'search', 'info'],
      safeCommands: ['list', 'search', 'info', 'outdated', 'doctor'],
      dangerousCommands: ['uninstall', 'update', 'upgrade', 'cleanup']
    });
  }

  /**
   * Execute a tool command with safety checks
   */
  async executeCommand(tool, command, args = [], options = {}) {
    const executionOptions = {
      ...this.options,
      ...options,
      tool,
      command,
      args
    };

    // Validate tool and command
    const validation = await this.validateExecution(tool, command, args, executionOptions);
    if (!validation.valid) {
      throw new Error(`Execution validation failed: ${validation.error}`);
    }

    // Build full command
    const fullCommand = this.buildCommand(tool, command, args);
    
    // Log execution attempt
    this.logExecution('start', { tool, command, args, fullCommand });

    if (executionOptions.dryRun) {
      console.log(chalk.yellow(`🔍 DRY RUN: Would execute: ${fullCommand}`));
      return {
        success: true,
        dryRun: true,
        command: fullCommand,
        output: '[DRY RUN - No actual execution]'
      };
    }

    try {
      // Get environment context
      await environmentContext.initialize();
      const envContext = await environmentContext.getContextForLLM();

      // Execute command
      const result = await this.executeWithTimeout(fullCommand, executionOptions);
      
      // Record successful execution
      const executionRecord = {
        id: Date.now().toString(),
        tool,
        command,
        args,
        fullCommand,
        success: true,
        output: result.stdout,
        error: result.stderr,
        exitCode: 0,
        duration: result.duration,
        timestamp: new Date().toISOString(),
        environment: {
          cwd: process.cwd(),
          platform: envContext.system.platform,
          nodeVersion: envContext.runtime.nodejs.version
        }
      };

      this.executionHistory.push(executionRecord);
      this.logExecution('success', executionRecord);

      return {
        success: true,
        output: result.stdout,
        error: result.stderr,
        duration: result.duration,
        command: fullCommand,
        executionId: executionRecord.id
      };

    } catch (error) {
      // Record failed execution
      const executionRecord = {
        id: Date.now().toString(),
        tool,
        command,
        args,
        fullCommand,
        success: false,
        output: error.stdout || '',
        error: error.stderr || error.message,
        exitCode: error.code || 1,
        duration: error.duration || 0,
        timestamp: new Date().toISOString(),
        environment: {
          cwd: process.cwd(),
          platform: process.platform
        }
      };

      this.executionHistory.push(executionRecord);
      this.logExecution('error', executionRecord);

      throw new Error(`Command execution failed: ${error.message}`);
    }
  }

  /**
   * Validate execution safety
   */
  async validateExecution(tool, command, args, options) {
    // Check if tool is supported
    if (!this.supportedTools.has(tool)) {
      return {
        valid: false,
        error: `Unsupported tool: ${tool}`
      };
    }

    const toolConfig = this.supportedTools.get(tool);

    // Check if command exists for tool
    if (!toolConfig.commands[command]) {
      return {
        valid: false,
        error: `Unknown command '${command}' for tool '${tool}'`
      };
    }

    // Check if command requires arguments
    if (toolConfig.requiresArgs.includes(command) && args.length === 0) {
      return {
        valid: false,
        error: `Command '${command}' requires arguments`
      };
    }

    // Check if command is dangerous and requires confirmation
    if (toolConfig.dangerousCommands.includes(command) && !options.force) {
      return {
        valid: false,
        error: `Dangerous command '${command}' requires --force flag`
      };
    }

    // Check if tool is available in environment
    try {
      await environmentContext.initialize();
      const envContext = await environmentContext.getContextForLLM();
      
      if (!envContext.tools.available.includes(tool)) {
        return {
          valid: false,
          error: `Tool '${tool}' is not available in current environment`
        };
      }
    } catch (error) {
      console.warn('Could not validate tool availability:', error.message);
    }

    return { valid: true };
  }

  /**
   * Build full command string
   */
  buildCommand(tool, command, args) {
    const toolConfig = this.supportedTools.get(tool);
    const baseCommand = toolConfig.commands[command];
    
    if (args.length > 0) {
      return `${baseCommand} ${args.join(' ')}`;
    }
    
    return baseCommand;
  }

  /**
   * Execute command with timeout
   */
  async executeWithTimeout(command, options) {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const child = spawn('sh', ['-c', command], {
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        if (options.logOutput) {
          process.stdout.write(chunk);
        }
      });

      child.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        if (options.logOutput) {
          process.stderr.write(chunk);
        }
      });

      // Set timeout
      const timeout = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`Command timed out after ${options.timeout}ms`));
      }, options.timeout);

      child.on('close', (code) => {
        clearTimeout(timeout);
        const duration = Date.now() - startTime;

        if (code === 0) {
          resolve({
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            duration
          });
        } else {
          const error = new Error(`Command failed with exit code ${code}`);
          error.code = code;
          error.stdout = stdout.trim();
          error.stderr = stderr.trim();
          error.duration = duration;
          reject(error);
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        error.duration = Date.now() - startTime;
        reject(error);
      });
    });
  }

  /**
   * Log execution events
   */
  logExecution(event, data) {
    const timestamp = new Date().toISOString();
    
    switch (event) {
      case 'start':
        console.log(chalk.blue(`🔧 [${timestamp}] Executing: ${data.fullCommand}`));
        break;
      case 'success':
        console.log(chalk.green(`✅ [${timestamp}] Command completed in ${data.duration}ms`));
        break;
      case 'error':
        console.log(chalk.red(`❌ [${timestamp}] Command failed: ${data.error}`));
        break;
    }
  }

  /**
   * Get supported tools
   */
  getSupportedTools() {
    return Array.from(this.supportedTools.keys());
  }

  /**
   * Get tool configuration
   */
  getToolConfig(tool) {
    return this.supportedTools.get(tool);
  }

  /**
   * Get available commands for a tool
   */
  getToolCommands(tool) {
    const config = this.supportedTools.get(tool);
    return config ? Object.keys(config.commands) : [];
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit = 50) {
    return this.executionHistory
      .slice(-limit)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Clear execution history
   */
  clearHistory() {
    this.executionHistory = [];
  }

  /**
   * Check if a command is safe to execute automatically
   */
  isCommandSafe(tool, command) {
    const config = this.supportedTools.get(tool);
    if (!config) return false;
    
    return config.safeCommands.includes(command);
  }

  /**
   * Check if a command is dangerous and requires confirmation
   */
  isCommandDangerous(tool, command) {
    const config = this.supportedTools.get(tool);
    if (!config) return true; // Assume dangerous if unknown
    
    return config.dangerousCommands.includes(command);
  }

  /**
   * Suggest appropriate commands based on context
   */
  async suggestCommands(context = {}) {
    const suggestions = [];
    await environmentContext.initialize();
    const envContext = await environmentContext.getContextForLLM();

    // Suggest package manager commands
    const packageManagers = envContext.runtime.packageManagers || [];
    if (packageManagers.length > 0) {
      const pm = packageManagers[0]; // Use first available
      
      if (context.error && /module|package|dependency|not found/i.test(context.error)) {
        suggestions.push({
          tool: pm,
          command: 'install',
          reason: 'Error suggests missing dependencies',
          safety: 'safe'
        });
      }
      
      if (context.task === 'test') {
        suggestions.push({
          tool: pm,
          command: 'test',
          reason: 'Run project tests',
          safety: 'safe'
        });
      }
      
      if (context.task === 'install') {
        suggestions.push({
          tool: pm,
          command: 'install',
          reason: 'Install project dependencies',
          safety: 'safe'
        });
      }
    }

    // Suggest git commands
    if (envContext.tools.versionControl === 'git') {
      if (context.task === 'status') {
        suggestions.push({
          tool: 'git',
          command: 'status',
          reason: 'Check repository status',
          safety: 'safe'
        });
      }
    }

    return suggestions;
  }
}

// Export singleton instance
export const toolExecutor = new ToolExecutor();