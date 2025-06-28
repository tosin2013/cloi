/**
 * Plugin Interfaces - Base classes for different plugin types
 * 
 * These define the contracts that plugins must implement,
 * similar to Ansible's plugin base classes.
 */

import { BasePlugin } from './index.js';

/**
 * Analyzer Plugin Interface
 * For language/framework-specific error analysis
 */
export class BaseAnalyzer extends BasePlugin {
  /**
   * Check if this analyzer supports the given context
   * @param {Object} context - Error context (files, error type, etc.)
   * @returns {boolean} - True if this analyzer can handle the context
   */
  supports(context) {
    throw new Error('Analyzer must implement supports() method');
  }

  /**
   * Analyze the error and provide insights
   * @param {string} errorOutput - The error output
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} - Analysis result
   */
  async analyze(errorOutput, context) {
    throw new Error('Analyzer must implement analyze() method');
  }

  /**
   * Get priority for this analyzer (higher = more specific)
   * @returns {number} - Priority score
   */
  getPriority() {
    return this.manifest.priority || 0;
  }
}

/**
 * Provider Plugin Interface  
 * For LLM and external service providers
 */
export class BaseProvider extends BasePlugin {
  /**
   * Check if provider is available and configured
   * @returns {Promise<boolean>} - True if provider is ready
   */
  async isAvailable() {
    throw new Error('Provider must implement isAvailable() method');
  }

  /**
   * Send query to the provider
   * @param {string} prompt - The prompt to send
   * @param {Object} options - Provider-specific options
   * @returns {Promise<Object>} - Response from provider
   */
  async query(prompt, options = {}) {
    throw new Error('Provider must implement query() method');
  }

  /**
   * Get supported model types
   * @returns {string[]} - Array of supported model identifiers
   */
  getSupportedModels() {
    return this.manifest.supportedModels || [];
  }

  /**
   * Get provider capabilities
   * @returns {Object} - Capability flags
   */
  getCapabilities() {
    return {
      streaming: false,
      structured: false,
      vision: false,
      ...this.manifest.capabilities
    };
  }
}

/**
 * Fixer Plugin Interface
 * For different fix application strategies
 */
export class BaseFixer extends BasePlugin {
  /**
   * Check if this fixer can handle the given fix type
   * @param {string} fixType - Type of fix (patch, command, etc.)
   * @param {Object} context - Fix context
   * @returns {boolean} - True if fixer can handle this
   */
  canFix(fixType, context) {
    throw new Error('Fixer must implement canFix() method');
  }

  /**
   * Apply the fix
   * @param {Object} fix - Fix instructions
   * @param {Object} context - Application context
   * @returns {Promise<Object>} - Result of fix application
   */
  async fix(fix, context) {
    throw new Error('Fixer must implement fix() method');
  }

  /**
   * Validate fix before application
   * @param {Object} fix - Fix to validate
   * @returns {Promise<Object>} - Validation result
   */
  async validateFix(fix) {
    // Default implementation - override if needed
    return { valid: true, issues: [] };
  }

  /**
   * Rollback a previously applied fix
   * @param {string} fixId - ID of fix to rollback
   * @returns {Promise<Object>} - Rollback result
   */
  async rollback(fixId) {
    throw new Error('Fixer must implement rollback() method');
  }
}

/**
 * Quality Plugin Interface
 * For code quality analysis tools
 */
export class BaseQuality extends BasePlugin {
  /**
   * Check code quality
   * @param {string[]} files - Files to check
   * @param {Object} options - Check options
   * @returns {Promise<Object>} - Quality analysis result
   */
  async check(files, options = {}) {
    throw new Error('Quality plugin must implement check() method');
  }

  /**
   * Get quality metrics
   * @param {string[]} files - Files to analyze
   * @returns {Promise<Object>} - Quality metrics
   */
  async getMetrics(files) {
    throw new Error('Quality plugin must implement getMetrics() method');
  }

  /**
   * Get supported file extensions
   * @returns {string[]} - Array of file extensions
   */
  getSupportedExtensions() {
    return this.manifest.supportedExtensions || [];
  }

  /**
   * Get quality rules configuration
   * @returns {Object} - Rules configuration
   */
  getRulesConfig() {
    return this.manifest.rules || {};
  }
}

/**
 * Integration Plugin Interface
 * For external tool integrations
 */
export class BaseIntegration extends BasePlugin {
  /**
   * Check if integration is properly configured
   * @returns {Promise<boolean>} - True if configured
   */
  async isConfigured() {
    throw new Error('Integration must implement isConfigured() method');
  }

  /**
   * Execute integration action
   * @param {string} action - Action to execute
   * @param {Object} params - Action parameters
   * @returns {Promise<Object>} - Execution result
   */
  async execute(action, params = {}) {
    throw new Error('Integration must implement execute() method');
  }

  /**
   * Get available actions
   * @returns {string[]} - Array of available actions
   */
  getAvailableActions() {
    return this.manifest.actions || [];
  }

  /**
   * Get integration health status
   * @returns {Promise<Object>} - Health status
   */
  async getHealth() {
    return {
      status: 'healthy',
      message: 'Integration is working properly',
      lastCheck: new Date().toISOString()
    };
  }
}

/**
 * Plugin Factory
 * Creates plugin instances based on type
 */
export class PluginFactory {
  static createPlugin(type, manifest, config) {
    const baseClasses = {
      analyzer: BaseAnalyzer,
      provider: BaseProvider,
      fixer: BaseFixer,
      quality: BaseQuality,
      integration: BaseIntegration
    };

    const BaseClass = baseClasses[type];
    if (!BaseClass) {
      throw new Error(`Unknown plugin type: ${type}`);
    }

    return new BaseClass(manifest, config);
  }
}

// Already exported above - no need to re-export