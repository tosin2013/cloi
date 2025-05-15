/**
 * Anthropic Endpoints Configuration Module
 * 
 * Defines API endpoints and configurations for Anthropic models.
 * Users can override these settings via environment variables or configuration files.
 */

// Default API endpoints for Anthropic models
export const DEFAULT_ENDPOINTS = {
  'claude-3-opus': 'https://api.anthropic.com/v1',
  'claude-3-sonnet': 'https://api.anthropic.com/v1',
  'claude-3-haiku': 'https://api.anthropic.com/v1'
};

// Model-specific configurations
export const MODEL_CONFIGS = {
  'claude-3-opus': {
    provider: 'anthropic',
    requiresOrg: false,
    maxTokens: 4096,
    endpointEnvVar: 'ANTHROPIC_API_ENDPOINT',
    keyEnvVar: 'ANTHROPIC_API_KEY',
    modelId: 'claude-3-opus-20240229'  // Actual Anthropic model ID
  },
  'claude-3-sonnet': {
    provider: 'anthropic',
    requiresOrg: false,
    maxTokens: 4096,
    endpointEnvVar: 'ANTHROPIC_API_ENDPOINT',
    keyEnvVar: 'ANTHROPIC_API_KEY',
    modelId: 'claude-3-sonnet-20240229'  // Actual Anthropic model ID
  },
  'claude-3-haiku': {
    provider: 'anthropic',
    requiresOrg: false,
    maxTokens: 4096,
    endpointEnvVar: 'ANTHROPIC_API_ENDPOINT',
    keyEnvVar: 'ANTHROPIC_API_KEY',
    modelId: 'claude-3-haiku-20240307'  // Actual Anthropic model ID
  }
};

/**
 * Get the API endpoint for a specific Anthropic model
 * @param {string} model - The model identifier
 * @returns {string} - The API endpoint URL
 */
export function getAnthropicApiEndpoint(model) {
  // Check environment variable first
  const config = MODEL_CONFIGS[model];
  if (!config) {
    throw new Error(`Unknown model: ${model}`);
  }

  // Check for environment variable override
  const envEndpoint = process.env[config.endpointEnvVar];
  if (envEndpoint) {
    return envEndpoint;
  }

  // Fall back to default endpoint
  return DEFAULT_ENDPOINTS[model];
}

/**
 * Get the configuration for a specific Anthropic model
 * @param {string} model - The model identifier
 * @returns {Object} - The model configuration
 */
export function getAnthropicModelConfig(model) {
  const config = MODEL_CONFIGS[model];
  if (!config) {
    throw new Error(`Unknown model: ${model}`);
  }
  return config;
} 