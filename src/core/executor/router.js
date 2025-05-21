/**
 * Model Router Module
 * 
 * Routes LLM queries to the appropriate executor based on model type.
 * Handles Ollama model execution.
 */

import * as OllamaExecutor from './ollama.js';
import { startThinking } from '../ui/thinking.js';

/**
 * Routes query to appropriate model provider based on model type
 * @param {string} prompt - The prompt to send
 * @param {string} model - The model to use
 * @param {Object} options - Additional options
 * @param {string} optimizationSet - Optimization preset for Ollama models
 * @returns {Promise<{response: string, reasoning: string}>} - The model's response
 */
export async function routeModelQuery(prompt, model, options = {}, optimizationSet = 'error_analysis') {
  // Extract callback from options if present
  const { onStreamStart, ...modelOptions } = options;
  
  // Use Ollama for all models
  const response = await OllamaExecutor.queryOllamaWithTempScript(prompt, model, optimizationSet, onStreamStart);
  return {
    response: response,
    reasoning: ''
  };
}

/**
 * Routes structured query to appropriate model provider
 * @param {string} prompt - The prompt to send
 * @param {string} model - The model to use
 * @param {Object} schema - JSON schema for structured output
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - The structured response
 */
export async function routeStructuredQuery(prompt, model, schema, options = {}) {
  // Use Ollama structured output
  return OllamaExecutor.queryOllamaStructured(prompt, model, schema, options);
}

/**
 * Ensures a model is available and installed if needed
 * @param {string} model - Model name to ensure
 * @returns {Promise<boolean>} - True if successful
 */
export async function ensureModelAvailable(model) {
  // For Ollama models, ensure it's installed
  return OllamaExecutor.ensureModel(model);
}

/**
 * Gets the list of available models (only Ollama models)
 * @param {boolean} includeRemote - Whether to include remote models
 * @returns {string[]} - Array of available models
 */
export function getAllAvailableModels(includeRemote = true) {
  return OllamaExecutor.getAvailableModels();
}

/**
 * Gets the list of installed models
 * @returns {Promise<string[]>} - Array of installed model names
 */
export async function getInstalledModels() {
  return await OllamaExecutor.readModels();
}

/**
 * Installs a model if not already installed
 * @param {string} model - Model to install
 * @returns {Promise<boolean>} - True if successful
 */
export async function installModelIfNeeded(model) {
  const installed = await OllamaExecutor.readModels();
  if (!installed.includes(model)) {
    return OllamaExecutor.installModel(model);
  }
  return true;
} 