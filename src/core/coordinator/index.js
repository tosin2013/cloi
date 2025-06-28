/**
 * Modular Coordinator - Main System Orchestrator
 * 
 * Coordinates all subsystems: plugins, configuration, state management,
 * and provides the main interface for the enhanced Cloi platform.
 */

import chalk from 'chalk';
import { pluginManager, PLUGIN_TYPES } from '../plugin-manager/index.js';
import { configManager } from '../config-manager/index.js';
import { stateManager } from '../state-manager/index.js';

/**
 * Coordinator Class - Main system orchestrator
 */
export class Coordinator {
  constructor(options = {}) {
    this.options = options;
    this.initialized = false;
    this.activePlugins = new Map();
    this.currentSession = null;
  }

  /**
   * Initialize the entire system
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    console.log(chalk.blue('🚀 Initializing Enhanced Cloi Platform...'));

    try {
      // Load configuration first
      await configManager.load();
      console.log(chalk.gray('  ✅ Configuration loaded'));

      // Validate configuration
      const validation = configManager.validate();
      if (!validation.valid) {
        console.log(chalk.yellow('⚠️  Configuration warnings:'));
        validation.errors.forEach(error => 
          console.log(chalk.yellow(`    - ${error}`))
        );
      }

      // Initialize state manager with session restoration
      await stateManager.initialize();

      // Discover and load plugins
      await pluginManager.discoverPlugins();
      await this.loadEssentialPlugins();
      console.log(chalk.gray('  ✅ Plugins loaded'));

      // Start session management
      this.currentSession = await stateManager.startSession({
        platform: 'enhanced-cloi',
        version: '2.0.0',
        config: configManager.get('session', {})
      });
      console.log(chalk.gray('  ✅ Session started'));

      this.initialized = true;
      console.log(chalk.green('✅ Enhanced Cloi Platform initialized successfully'));

    } catch (error) {
      console.error(chalk.red('❌ Failed to initialize platform:'), error.message);
      throw error;
    }
  }

  /**
   * Load essential plugins based on configuration
   */
  async loadEssentialPlugins() {
    const autoLoad = configManager.get('plugins.autoLoad', true);
    if (!autoLoad) {
      console.log(chalk.gray('  Plugin auto-loading disabled'));
      return;
    }

    // Load default providers
    await this.loadProviders();

    // Load default analyzers
    await this.loadAnalyzers();

    // Load configured integrations
    await this.loadIntegrations();
  }

  /**
   * Load provider plugins
   */
  async loadProviders() {
    const defaultProvider = configManager.get('providers.default', 'ollama');
    const fallbackProviders = configManager.get('providers.fallback', []);
    
    // Load default provider
    try {
      const provider = await pluginManager.loadPlugin(PLUGIN_TYPES.PROVIDER, defaultProvider);
      this.activePlugins.set(`provider:${defaultProvider}`, provider);
      console.log(chalk.gray(`    📡 Loaded provider: ${defaultProvider}`));
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Failed to load default provider ${defaultProvider}: ${error.message}`));
    }

    // Load fallback providers
    for (const providerName of fallbackProviders) {
      try {
        const provider = await pluginManager.loadPlugin(PLUGIN_TYPES.PROVIDER, providerName);
        this.activePlugins.set(`provider:${providerName}`, provider);
        console.log(chalk.gray(`    📡 Loaded fallback provider: ${providerName}`));
      } catch (error) {
        console.log(chalk.gray(`    ⚠️  Failed to load fallback provider ${providerName}`));
      }
    }
  }

  /**
   * Load analyzer plugins
   */
  async loadAnalyzers() {
    const analyzers = await pluginManager.loadPluginsByType(PLUGIN_TYPES.ANALYZER);
    
    for (const { name, instance } of analyzers) {
      this.activePlugins.set(`analyzer:${name}`, instance);
      console.log(chalk.gray(`    🔍 Loaded analyzer: ${name}`));
    }
  }

  /**
   * Load integration plugins
   */
  async loadIntegrations() {
    const enabledIntegrations = configManager.get('integrations.enabled', []);
    
    for (const integrationName of enabledIntegrations) {
      try {
        const integration = await pluginManager.loadPlugin(PLUGIN_TYPES.INTEGRATION, integrationName);
        this.activePlugins.set(`integration:${integrationName}`, integration);
        console.log(chalk.gray(`    🔗 Loaded integration: ${integrationName}`));
      } catch (error) {
        console.log(chalk.gray(`    ⚠️  Failed to load integration ${integrationName}`));
      }
    }
  }

  /**
   * Analyze error using the best available analyzer
   */
  async analyzeError(errorOutput, context = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(chalk.blue('🔍 Analyzing error...'));

    // Find suitable analyzers
    const suitableAnalyzers = this.findSuitableAnalyzers(context);
    
    if (suitableAnalyzers.length === 0) {
      console.log(chalk.yellow('⚠️  No suitable analyzers found, using generic analysis'));
      return await this.genericAnalysis(errorOutput, context);
    }

    // Use the highest priority analyzer
    const bestAnalyzer = suitableAnalyzers[0];
    console.log(chalk.gray(`  Using analyzer: ${bestAnalyzer.name}`));

    try {
      const analysis = await bestAnalyzer.instance.analyze(errorOutput, context);
      
      // Record analysis in session
      await stateManager.recordAnalysis({
        analyzer: bestAnalyzer.name,
        errorOutput,
        context,
        result: analysis
      });

      return {
        analyzer: bestAnalyzer.name,
        ...analysis
      };

    } catch (error) {
      console.log(chalk.red(`❌ Analysis failed: ${error.message}`));
      return await this.genericAnalysis(errorOutput, context);
    }
  }

  /**
   * Find analyzers that support the given context
   */
  findSuitableAnalyzers(context) {
    const analyzers = [];
    
    for (const [key, plugin] of this.activePlugins) {
      if (key.startsWith('analyzer:') && plugin.supports(context)) {
        analyzers.push({
          name: key.replace('analyzer:', ''),
          instance: plugin,
          priority: plugin.getPriority()
        });
      }
    }

    // Sort by priority (highest first)
    return analyzers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate fix using configured providers
   */
  async generateFix(analysis, context = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(chalk.blue('🛠️  Generating fix...'));

    const provider = this.getAvailableProvider();
    if (!provider) {
      throw new Error('No available AI providers');
    }

    try {
      // Build enhanced prompt using analysis
      const prompt = this.buildFixPrompt(analysis, context);
      
      // Query the provider
      const response = await provider.query(prompt, {
        max_tokens: configManager.get('analysis.maxTokens', 512),
        temperature: configManager.get('analysis.temperature', 0.3)
      });

      // Record fix attempt
      const fix = await stateManager.recordFix({
        type: analysis.errorType || 'generic',
        analysis: analysis,
        provider: this.getProviderName(provider),
        prompt,
        response: response.response,
        context
      });

      return {
        fixId: fix.id,
        fix: response.response,
        confidence: analysis.confidence || 0.5,
        suggestions: analysis.suggestions || []
      };

    } catch (error) {
      console.log(chalk.red(`❌ Fix generation failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Apply a fix using the appropriate fixer
   */
  async applyFix(fixId, fixData, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(chalk.blue(`🔧 Applying fix: ${fixId}`));

    // Find suitable fixer
    const fixer = this.findSuitableFixer(fixData.type, fixData);
    if (!fixer) {
      throw new Error(`No suitable fixer found for type: ${fixData.type}`);
    }

    try {
      // Prepare rollback data before applying
      const rollbackData = await this.prepareRollbackData(fixData);
      await stateManager.prepareRollback(fixId, rollbackData);

      // Apply the fix
      const result = await fixer.fix(fixData, { fixId, ...options });
      
      // Update fix status
      await stateManager.updateFixStatus(fixId, 'applied', {
        result,
        appliedAt: new Date().toISOString()
      });

      console.log(chalk.green(`✅ Fix applied successfully: ${fixId}`));
      return result;

    } catch (error) {
      await stateManager.updateFixStatus(fixId, 'failed', {
        error: error.message,
        failedAt: new Date().toISOString()
      });

      console.log(chalk.red(`❌ Fix application failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get an available AI provider
   */
  getAvailableProvider() {
    const defaultProvider = configManager.get('providers.default', 'ollama');
    const fallbackProviders = configManager.get('providers.fallback', []);
    
    // Try default provider first
    const defaultKey = `provider:${defaultProvider}`;
    if (this.activePlugins.has(defaultKey)) {
      return this.activePlugins.get(defaultKey);
    }

    // Try fallback providers
    for (const providerName of fallbackProviders) {
      const key = `provider:${providerName}`;
      if (this.activePlugins.has(key)) {
        return this.activePlugins.get(key);
      }
    }

    return null;
  }

  /**
   * Get provider name from instance
   */
  getProviderName(provider) {
    for (const [key, instance] of this.activePlugins) {
      if (instance === provider && key.startsWith('provider:')) {
        return key.replace('provider:', '');
      }
    }
    return 'unknown';
  }

  /**
   * Find suitable fixer for fix type
   */
  findSuitableFixer(fixType, fixData) {
    for (const [key, plugin] of this.activePlugins) {
      if (key.startsWith('fixer:') && plugin.canFix(fixType, fixData)) {
        return plugin;
      }
    }
    return null;
  }

  /**
   * Build enhanced prompt for fix generation
   */
  buildFixPrompt(analysis, context) {
    let prompt = `Please analyze this error and provide a fix:\n\n`;
    
    if (analysis.language) {
      prompt += `Language: ${analysis.language}\n`;
    }
    
    if (analysis.framework) {
      prompt += `Framework: ${Array.isArray(analysis.framework) ? analysis.framework.join(', ') : analysis.framework}\n`;
    }
    
    if (analysis.errorType) {
      prompt += `Error Type: ${analysis.errorType}\n`;
    }
    
    prompt += `\nError Output:\n${context.errorOutput || 'No error output provided'}\n`;
    
    if (analysis.suggestions && analysis.suggestions.length > 0) {
      prompt += `\nAnalyzer Suggestions:\n`;
      analysis.suggestions.forEach((suggestion, index) => {
        prompt += `${index + 1}. ${suggestion.title}: ${suggestion.description}\n`;
      });
    }
    
    prompt += `\nPlease provide a specific fix for this error.`;
    
    return prompt;
  }

  /**
   * Prepare rollback data
   */
  async prepareRollbackData(fixData) {
    // This would depend on the fix type
    // For now, return basic structure
    return {
      type: fixData.type,
      timestamp: new Date().toISOString(),
      files: [], // Would be populated based on fix type
      commands: [] // Would be populated for command fixes
    };
  }

  /**
   * Generic analysis fallback
   */
  async genericAnalysis() {
    return {
      language: 'unknown',
      framework: 'unknown',
      errorType: 'generic',
      confidence: 0.3,
      suggestions: [
        {
          type: 'generic',
          title: 'Review error message',
          description: 'Examine the error output for clues about the issue',
          priority: 'medium'
        }
      ],
      metadata: {}
    };
  }

  /**
   * Shutdown the platform
   */
  async shutdown() {
    if (!this.initialized) {
      return;
    }

    console.log(chalk.blue('🛑 Shutting down Enhanced Cloi Platform...'));

    // End current session
    if (this.currentSession) {
      await stateManager.endSession();
    }

    // Cleanup plugins
    for (const [key, plugin] of this.activePlugins) {
      try {
        if (typeof plugin.cleanup === 'function') {
          await plugin.cleanup();
        }
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Failed to cleanup plugin ${key}: ${error.message}`));
      }
    }

    this.activePlugins.clear();
    this.initialized = false;

    console.log(chalk.green('✅ Platform shutdown complete'));
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      activePlugins: Array.from(this.activePlugins.keys()),
      currentSession: this.currentSession?.id,
      config: {
        defaultProvider: configManager.get('providers.default'),
        pluginAutoLoad: configManager.get('plugins.autoLoad')
      }
    };
  }
}

// Export singleton instance
export const coordinator = new Coordinator();