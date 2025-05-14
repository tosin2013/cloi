/**
 * Model Configuration Module
 * 
 * Defines API endpoints and configurations for different frontier models.
 * Users can override these settings via environment variables or configuration files.
 */

// Default API endpoints for different model providers
export const DEFAULT_ENDPOINTS = {
  'gpt-4.1': 'https://api.openai.com/v1',
  'gpt-4.1-mini': 'https://api.openai.com/v1',
  'o3': 'https://api.openai.com/v1',
  'o3-mini': 'https://api.openai.com/v1'
};

// Model-specific configurations
export const MODEL_CONFIGS = {
  'gpt-4.1': {
    provider: 'openai',
    requiresOrg: false,
    maxTokens: 8192,
    endpointEnvVar: 'OPENAI_API_ENDPOINT',
    keyEnvVar: 'OPENAI_API_KEY',
    modelId: 'gpt-4.1-2025-04-14'  // Actual OpenAI model ID
  },
  'gpt-4.1-mini': {
    provider: 'openai',
    requiresOrg: false,
    maxTokens: 4096,
    endpointEnvVar: 'OPENAI_API_ENDPOINT',
    keyEnvVar: 'OPENAI_API_KEY',
    modelId: 'gpt-4.1-mini-2025-04-14'  // Actual OpenAI model ID
  },
  'o3': {
    provider: 'openai',
    requiresOrg: false,
    maxTokens: 16384,
    endpointEnvVar: 'OPENAI_API_ENDPOINT',
    keyEnvVar: 'OPENAI_API_KEY',
    modelId: 'o3-2025-04-16'  // Actual OpenAI model ID
  },
  'o3-mini': {
    provider: 'openai',
    requiresOrg: false,
    maxTokens: 8192,
    endpointEnvVar: 'OPENAI_API_ENDPOINT',
    keyEnvVar: 'OPENAI_API_KEY',
    modelId: 'o3-mini-2025-01-31'  // Actual OpenAI model ID
  }
};

/**
 * Get the API endpoint for a specific model
 * @param {string} model - The model identifier
 * @returns {string} - The API endpoint URL
 */
export function getApiEndpoint(model) {
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
 * Get the configuration for a specific model
 * @param {string} model - The model identifier
 * @returns {Object} - The model configuration
 */
export function getModelConfig(model) {
  const config = MODEL_CONFIGS[model];
  if (!config) {
    throw new Error(`Unknown model: ${model}`);
  }
  return config;
} 