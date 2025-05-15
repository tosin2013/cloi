/**
 * Endpoints Index Module
 * 
 * Centralizes access to all model endpoints configurations.
 * Provides a unified API for accessing endpoint configurations across providers.
 */

import { getApiEndpoint as getOpenAIEndpoint, getModelConfig as getOpenAIConfig } from './openai_endpoints.js';
import { getAnthropicApiEndpoint, getAnthropicModelConfig } from './anthropic_endpoints.js';

/**
 * Get the API endpoint for a specific model
 * @param {string} model - The model identifier
 * @returns {string} - The API endpoint URL
 */
export function getApiEndpoint(model) {
  // Determine provider based on model name prefix
  if (model.startsWith('gpt-') || model.startsWith('o3') || model.startsWith('o4')) {
    return getOpenAIEndpoint(model);
  } else if (model.startsWith('claude-')) {
    return getAnthropicApiEndpoint(model);
  } else {
    throw new Error(`Unknown model provider for: ${model}`);
  }
}

/**
 * Get the configuration for a specific model
 * @param {string} model - The model identifier
 * @returns {Object} - The model configuration
 */
export function getModelConfig(model) {
  // Determine provider based on model name prefix
  if (model.startsWith('gpt-') || model.startsWith('o3') || model.startsWith('o4')) {
    return getOpenAIConfig(model);
  } else if (model.startsWith('claude-')) {
    return getAnthropicModelConfig(model);
  } else {
    throw new Error(`Unknown model provider for: ${model}`);
  }
} 