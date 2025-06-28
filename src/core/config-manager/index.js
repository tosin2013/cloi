/**
 * Configuration Manager - Hierarchical Configuration System
 * 
 * Implements configuration management similar to Ansible's variable precedence.
 * Supports multiple configuration sources with clear precedence rules.
 */

import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import chalk from 'chalk';
import { merge } from 'lodash-es';

/**
 * Configuration Sources in order of precedence (lowest to highest)
 */
export const CONFIG_SOURCES = {
  DEFAULTS: 'defaults',           // Built-in defaults
  SYSTEM: 'system',              // System-wide config
  USER: 'user',                  // User home config
  PROJECT: 'project',            // Project-specific config
  ENVIRONMENT: 'environment',     // Environment variables
  CLI: 'cli'                     // Command-line arguments
};

/**
 * Configuration Manager Class
 */
export class ConfigManager {
  constructor(options = {}) {
    this.options = options;
    this.configs = new Map();
    this.merged = {};
    this.watchers = [];
    this.debug = options.debug || false;
  }

  /**
   * Load all configuration sources
   */
  async load() {
    if (this.debug) {
      console.log(chalk.gray('🔧 Loading configuration...'));
    }

    // Load in precedence order (lowest first)
    await this.loadDefaults();
    await this.loadSystemConfig();
    await this.loadUserConfig();
    await this.loadProjectConfig();
    await this.loadEnvironmentConfig();
    await this.loadCliConfig();

    // Merge all configurations
    this.mergeConfigs();

    if (this.debug) {
      console.log(chalk.green('✅ Configuration loaded'));
      this.debugConfig();
    }
  }

  /**
   * Load default configuration
   */
  async loadDefaults() {
    const defaults = {
      plugins: {
        autoLoad: true,
        searchPaths: [],
        registry: {
          enabled: true,
          url: 'https://registry.cloi.dev'
        }
      },
      providers: {
        default: 'ollama',
        fallback: ['claude', 'openai'],
        timeout: 30000
      },
      analysis: {
        maxTokens: 512,
        temperature: 0.3,
        contextLines: 30
      },
      quality: {
        enabled: true,
        autoFix: false,
        rules: {}
      },
      ui: {
        colors: true,
        progress: true,
        verbose: false
      },
      security: {
        allowUnsigned: false,
        validatePlugins: true,
        sandbox: true
      }
    };

    this.configs.set(CONFIG_SOURCES.DEFAULTS, defaults);
  }

  /**
   * Load system-wide configuration
   */
  async loadSystemConfig() {
    const systemPaths = [
      '/etc/cloi/config.yml',
      '/etc/cloi/config.yaml',
      '/usr/local/etc/cloi/config.yml'
    ];

    for (const configPath of systemPaths) {
      if (fs.existsSync(configPath)) {
        try {
          const config = await this.loadConfigFile(configPath);
          this.configs.set(CONFIG_SOURCES.SYSTEM, config);
          if (this.debug) {
            console.log(chalk.gray(`  📄 System config: ${configPath}`));
          }
          break;
        } catch (error) {
          console.log(chalk.yellow(`⚠️  Failed to load system config ${configPath}: ${error.message}`));
        }
      }
    }
  }

  /**
   * Load user configuration
   */
  async loadUserConfig() {
    const userHome = process.env.HOME || process.env.USERPROFILE;
    if (!userHome) return;

    const userPaths = [
      path.join(userHome, '.cloi', 'config.yml'),
      path.join(userHome, '.cloi', 'config.yaml'),
      path.join(userHome, '.cloirc.yml'),
      path.join(userHome, '.cloirc.yaml')
    ];

    for (const configPath of userPaths) {
      if (fs.existsSync(configPath)) {
        try {
          const config = await this.loadConfigFile(configPath);
          this.configs.set(CONFIG_SOURCES.USER, config);
          if (this.debug) {
            console.log(chalk.gray(`  📄 User config: ${configPath}`));
          }
          break;
        } catch (error) {
          console.log(chalk.yellow(`⚠️  Failed to load user config ${configPath}: ${error.message}`));
        }
      }
    }
  }

  /**
   * Load project-specific configuration
   */
  async loadProjectConfig() {
    const projectPaths = [
      path.join(process.cwd(), '.cloi', 'config.yml'),
      path.join(process.cwd(), '.cloi', 'config.yaml'),
      path.join(process.cwd(), 'cloi.config.yml'),
      path.join(process.cwd(), 'cloi.config.yaml')
    ];

    for (const configPath of projectPaths) {
      if (fs.existsSync(configPath)) {
        try {
          const config = await this.loadConfigFile(configPath);
          this.configs.set(CONFIG_SOURCES.PROJECT, config);
          if (this.debug) {
            console.log(chalk.gray(`  📄 Project config: ${configPath}`));
          }
          break;
        } catch (error) {
          console.log(chalk.yellow(`⚠️  Failed to load project config ${configPath}: ${error.message}`));
        }
      }
    }
  }

  /**
   * Load environment variable configuration
   */
  async loadEnvironmentConfig() {
    const envConfig = {};
    const prefix = 'CLOI_';

    // Convert environment variables to nested config object
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefix)) {
        const configKey = key.substring(prefix.length).toLowerCase();
        const keyPath = configKey.split('_');
        
        let current = envConfig;
        for (let i = 0; i < keyPath.length - 1; i++) {
          if (!current[keyPath[i]]) {
            current[keyPath[i]] = {};
          }
          current = current[keyPath[i]];
        }
        
        // Parse value (try JSON, fallback to string)
        let parsedValue = value;
        try {
          parsedValue = JSON.parse(value);
        } catch {
          // Keep as string
        }
        
        current[keyPath[keyPath.length - 1]] = parsedValue;
      }
    }

    if (Object.keys(envConfig).length > 0) {
      this.configs.set(CONFIG_SOURCES.ENVIRONMENT, envConfig);
      if (this.debug) {
        console.log(chalk.gray(`  🌍 Environment config loaded`));
      }
    }
  }

  /**
   * Load CLI configuration (passed via options)
   */
  async loadCliConfig() {
    if (this.options.config) {
      this.configs.set(CONFIG_SOURCES.CLI, this.options.config);
      if (this.debug) {
        console.log(chalk.gray(`  ⚡ CLI config loaded`));
      }
    }
  }

  /**
   * Load and parse a configuration file
   */
  async loadConfigFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.yml':
      case '.yaml':
        return yaml.load(content);
      case '.json':
        return JSON.parse(content);
      default:
        throw new Error(`Unsupported config file format: ${ext}`);
    }
  }

  /**
   * Merge all configurations using precedence rules
   */
  mergeConfigs() {
    const sources = [
      CONFIG_SOURCES.DEFAULTS,
      CONFIG_SOURCES.SYSTEM,
      CONFIG_SOURCES.USER,
      CONFIG_SOURCES.PROJECT,
      CONFIG_SOURCES.ENVIRONMENT,
      CONFIG_SOURCES.CLI
    ];

    this.merged = {};
    
    for (const source of sources) {
      const config = this.configs.get(source);
      if (config) {
        this.merged = merge(this.merged, config);
      }
    }
  }

  /**
   * Get configuration value by path
   */
  get(keyPath, defaultValue = undefined) {
    const keys = keyPath.split('.');
    let current = this.merged;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }

    return current;
  }

  /**
   * Set configuration value by path
   */
  set(keyPath, value) {
    const keys = keyPath.split('.');
    let current = this.merged;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Get all configuration
   */
  getAll() {
    return { ...this.merged };
  }

  /**
   * Get configuration for a specific plugin
   */
  getPluginConfig(pluginName) {
    return this.get(`plugins.${pluginName}`, {});
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(providerName) {
    return this.get(`providers.${providerName}`, {});
  }

  /**
   * Save configuration to file
   */
  async save(scope = 'user', format = 'yml') {
    const configToSave = this.getConfigForScope(scope);
    const filePath = this.getConfigPath(scope, format);
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Format and save
    let content;
    switch (format) {
      case 'yml':
      case 'yaml':
        content = yaml.dump(configToSave, { indent: 2 });
        break;
      case 'json':
        content = JSON.stringify(configToSave, null, 2);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    
    if (this.debug) {
      console.log(chalk.green(`✅ Configuration saved to ${filePath}`));
    }
  }

  /**
   * Get configuration for a specific scope
   */
  getConfigForScope(scope) {
    // Remove defaults and lower precedence configs
    const scopeOrder = {
      system: [CONFIG_SOURCES.SYSTEM],
      user: [CONFIG_SOURCES.USER],
      project: [CONFIG_SOURCES.PROJECT]
    };

    const sources = scopeOrder[scope] || [CONFIG_SOURCES.USER];
    let config = {};

    for (const source of sources) {
      const sourceConfig = this.configs.get(source);
      if (sourceConfig) {
        config = merge(config, sourceConfig);
      }
    }

    return config;
  }

  /**
   * Get configuration file path for scope
   */
  getConfigPath(scope, format) {
    const ext = format === 'json' ? 'json' : 'yml';
    
    switch (scope) {
      case 'system':
        return `/etc/cloi/config.${ext}`;
      case 'user':
        const userHome = process.env.HOME || process.env.USERPROFILE;
        return path.join(userHome, '.cloi', `config.${ext}`);
      case 'project':
        return path.join(process.cwd(), '.cloi', `config.${ext}`);
      default:
        throw new Error(`Invalid scope: ${scope}`);
    }
  }

  /**
   * Debug configuration
   */
  debugConfig() {
    console.log(chalk.cyan('\n📋 Configuration Sources:'));
    
    for (const [source, config] of this.configs) {
      console.log(chalk.gray(`  ${source}:`), Object.keys(config).length, 'keys');
    }

    console.log(chalk.cyan('\n🔧 Merged Configuration:'));
    console.log(JSON.stringify(this.merged, null, 2));
  }

  /**
   * Validate configuration
   */
  validate() {
    const errors = [];
    
    // Validate required fields
    const requiredFields = [
      'providers.default',
      'plugins.autoLoad'
    ];

    for (const field of requiredFields) {
      if (this.get(field) === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate provider exists
    const defaultProvider = this.get('providers.default');
    if (defaultProvider && !this.get(`providers.${defaultProvider}`)) {
      errors.push(`Default provider '${defaultProvider}' not configured`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Watch for configuration changes
   */
  watch(callback) {
    // TODO: Implement file watching for configuration changes
    this.watchers.push(callback);
  }
}

// Export singleton instance
export const configManager = new ConfigManager();