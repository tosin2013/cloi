/**
 * Plugin Manager - Core Plugin System
 * 
 * Handles plugin discovery, loading, and lifecycle management.
 * Inspired by Ansible and Terraform plugin architectures.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/**
 * Plugin Types - Following Ansible's plugin architecture
 */
export const PLUGIN_TYPES = {
  ANALYZER: 'analyzers',      // Language/framework-specific analysis
  PROVIDER: 'providers',      // LLM and service providers  
  FIXER: 'fixers',           // Fix strategy implementations
  QUALITY: 'quality',        // Code quality tools
  INTEGRATION: 'integrations' // External tool integrations
};

/**
 * Plugin Manager Class
 */
export class PluginManager {
  constructor(config = {}) {
    this.config = config;
    this.plugins = new Map();
    this.pluginPaths = this.getPluginSearchPaths();
    this.registry = new Map(); // Plugin registry cache
  }

  /**
   * Get plugin search paths in order of precedence
   * Following Ansible's search path hierarchy
   */
  getPluginSearchPaths() {
    const paths = [];
    
    // 1. Project-specific plugins (highest precedence)
    const projectPath = path.join(process.cwd(), '.cloi', 'plugins');
    if (fs.existsSync(projectPath)) {
      paths.push(projectPath);
    }

    // 2. User plugins
    const userHome = process.env.HOME || process.env.USERPROFILE;
    if (userHome) {
      const userPath = path.join(userHome, '.cloi', 'plugins');
      if (fs.existsSync(userPath)) {
        paths.push(userPath);
      }
    }

    // 3. Built-in plugins (using relative path from plugin-manager)
    const builtinPath = path.join(__dirname, '..', '..', 'plugins');
    if (fs.existsSync(builtinPath)) {
      paths.push(builtinPath);
    }

    // 4. System-wide plugins
    const systemPath = path.join(__dirname, '..', '..', '..', 'plugins');
    if (fs.existsSync(systemPath)) {
      paths.push(systemPath);
    }

    return paths;
  }

  /**
   * Discover all plugins in search paths
   */
  async discoverPlugins() {
    console.log(chalk.gray('🔍 Discovering plugins...'));
    
    for (const searchPath of this.pluginPaths) {
      console.log(chalk.gray(`  Searching: ${searchPath}`));
      await this.discoverPluginsInPath(searchPath);
    }

    console.log(chalk.green(`✅ Discovered ${this.registry.size} plugins`));
  }

  /**
   * Discover plugins in a specific path
   */
  async discoverPluginsInPath(searchPath) {
    if (!fs.existsSync(searchPath)) {
      console.log(chalk.gray(`    Path does not exist: ${searchPath}`));
      return;
    }

    for (const pluginType of Object.values(PLUGIN_TYPES)) {
      const typePath = path.join(searchPath, pluginType);
      if (!fs.existsSync(typePath)) {
        console.log(chalk.gray(`    No ${pluginType} directory in ${searchPath}`));
        continue;
      }

      const entries = fs.readdirSync(typePath, { withFileTypes: true });
      console.log(chalk.gray(`    Found ${entries.length} entries in ${typePath}`));
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          console.log(chalk.gray(`    Registering ${pluginType}:${entry.name}`));
          await this.registerPlugin(pluginType, entry.name, path.join(typePath, entry.name));
        }
      }
    }
  }

  /**
   * Register a plugin in the registry
   */
  async registerPlugin(type, name, pluginPath) {
    const manifestPath = path.join(pluginPath, 'plugin.json');
    
    if (!fs.existsSync(manifestPath)) {
      console.log(chalk.yellow(`⚠️  Plugin ${name} missing manifest: ${manifestPath}`));
      return;
    }

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const pluginKey = `${type}:${name}`;
      
      this.registry.set(pluginKey, {
        type,
        name,
        path: pluginPath,
        manifest,
        loaded: false,
        instance: null
      });

      console.log(chalk.gray(`  📦 Registered: ${pluginKey}`));
    } catch (error) {
      console.log(chalk.red(`❌ Failed to register plugin ${name}: ${error.message}`));
    }
  }

  /**
   * Load a specific plugin by type and name
   */
  async loadPlugin(type, name) {
    const pluginKey = `${type}:${name}`;
    const plugin = this.registry.get(pluginKey);

    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginKey}`);
    }

    if (plugin.loaded) {
      return plugin.instance;
    }

    try {
      const entryPoint = path.join(plugin.path, plugin.manifest.main || 'index.js');
      
      if (!fs.existsSync(entryPoint)) {
        throw new Error(`Plugin entry point not found: ${entryPoint}`);
      }

      // Dynamic import for ES modules
      const module = await import(`file://${entryPoint}`);
      const PluginClass = module.default || module[plugin.manifest.class || 'Plugin'];

      if (!PluginClass) {
        throw new Error(`Plugin class not found in ${entryPoint}`);
      }

      // Instantiate the plugin
      const instance = new PluginClass(plugin.manifest, this.config);
      
      // Validate plugin interface
      if (!this.validatePluginInterface(type, instance)) {
        throw new Error(`Plugin ${pluginKey} does not implement required interface`);
      }

      plugin.instance = instance;
      plugin.loaded = true;

      console.log(chalk.green(`✅ Loaded plugin: ${pluginKey}`));
      return instance;

    } catch (error) {
      console.log(chalk.red(`❌ Failed to load plugin ${pluginKey}: ${error.message}`));
      throw error;
    }
  }

  /**
   * Validate plugin implements required interface for its type
   */
  validatePluginInterface(type, instance) {
    const interfaces = {
      [PLUGIN_TYPES.ANALYZER]: ['analyze', 'supports'],
      [PLUGIN_TYPES.PROVIDER]: ['query', 'isAvailable'],
      [PLUGIN_TYPES.FIXER]: ['fix', 'canFix'],
      [PLUGIN_TYPES.QUALITY]: ['check', 'getMetrics'],
      [PLUGIN_TYPES.INTEGRATION]: ['execute', 'isConfigured']
    };

    const requiredMethods = interfaces[type] || [];
    
    return requiredMethods.every(method => 
      typeof instance[method] === 'function'
    );
  }

  /**
   * Get all plugins of a specific type
   */
  getPluginsByType(type) {
    const plugins = [];
    
    for (const [key, plugin] of this.registry) {
      if (plugin.type === type) {
        plugins.push(plugin);
      }
    }

    return plugins;
  }

  /**
   * Load all plugins of a specific type
   */
  async loadPluginsByType(type) {
    const plugins = this.getPluginsByType(type);
    const instances = [];

    for (const plugin of plugins) {
      try {
        const instance = await this.loadPlugin(plugin.type, plugin.name);
        instances.push({
          name: plugin.name,
          instance,
          manifest: plugin.manifest
        });
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Skipped plugin ${plugin.name}: ${error.message}`));
      }
    }

    return instances;
  }

  /**
   * Install a plugin from npm registry
   */
  async installPlugin(packageName, destination = 'user') {
    console.log(chalk.blue(`📦 Installing plugin: ${packageName}`));
    
    const destinationPath = this.getInstallPath(destination);
    
    // TODO: Implement npm install logic
    // This would:
    // 1. Download package from npm
    // 2. Extract to appropriate plugin directory
    // 3. Validate plugin structure
    // 4. Register in local registry
    
    throw new Error('Plugin installation not yet implemented');
  }

  /**
   * Get installation path for plugins
   */
  getInstallPath(destination) {
    const userHome = process.env.HOME || process.env.USERPROFILE;
    
    switch (destination) {
      case 'project':
        return path.join(process.cwd(), '.cloi', 'plugins');
      case 'user':
        return path.join(userHome, '.cloi', 'plugins');
      case 'system':
        return path.join(__dirname, '..', '..', 'plugins');
      default:
        throw new Error(`Invalid destination: ${destination}`);
    }
  }

  /**
   * List all discovered plugins
   */
  listPlugins() {
    const plugins = [];
    
    for (const [key, plugin] of this.registry) {
      plugins.push({
        type: plugin.type,
        name: plugin.name,
        version: plugin.manifest.version,
        description: plugin.manifest.description,
        loaded: plugin.loaded,
        path: plugin.path
      });
    }

    return plugins;
  }
}

/**
 * Base Plugin Class
 * All plugins should extend this class
 */
export class BasePlugin {
  constructor(manifest, config = {}) {
    this.manifest = manifest;
    this.config = config;
    this.name = manifest.name;
    this.version = manifest.version;
  }

  /**
   * Plugin initialization hook
   */
  async initialize() {
    // Override in subclasses
  }

  /**
   * Plugin cleanup hook
   */
  async cleanup() {
    // Override in subclasses
  }

  /**
   * Get plugin configuration
   */
  getConfig(key, defaultValue = null) {
    return this.config[key] ?? defaultValue;
  }
}

// Export singleton instance
export const pluginManager = new PluginManager();