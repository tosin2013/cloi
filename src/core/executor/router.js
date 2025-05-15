/**
 * Model Router Module
 * 
 * Routes LLM queries to the appropriate executor based on model type.
 * Handles the decision logic for frontier vs. local models.
 */

import { FrontierClient } from './frontier.js';
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
  if (FrontierClient.isFrontierModel(model)) {
    // Use frontier client for frontier models
    const client = new FrontierClient(model);
    const response = await client.query(prompt, options);
    return {
      response: response.response,
      reasoning: response.reasoning || ''
    };
  } else {
    // Use Ollama for local models
    const response = await OllamaExecutor.queryOllamaWithTempScript(prompt, model, optimizationSet);
    return {
      response: response,
      reasoning: ''
    };
  }
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
  if (FrontierClient.isFrontierModel(model)) {
    // Frontier models don't support structured output directly
    // Use regular query and parse the result
    const client = new FrontierClient(model);
    const response = await client.query(prompt, options);
    
    // Try to parse JSON from response
    try {
      const textResponse = response.response.trim();
      // Remove markdown code formatting if present
      const jsonText = textResponse
        .replace(/^```json\s+/m, '')
        .replace(/\s*```$/m, '');
      
      return JSON.parse(jsonText);
    } catch (error) {
      console.error(`Failed to parse structured output: ${error.message}`);
      return { error: 'Failed to parse structured output', rawResponse: response.response };
    }
  } else {
    // Use Ollama structured output
    return OllamaExecutor.queryOllamaStructured(prompt, model, schema, options);
  }
}

/**
 * Ensures a model is available and installed if needed
 * @param {string} model - Model name to ensure
 * @returns {Promise<boolean>} - True if successful
 */
export async function ensureModelAvailable(model) {
  if (FrontierClient.isFrontierModel(model)) {
    // For frontier models, we just need a valid client
    // The actual check for API key happens during query
    return true;
  } else {
    // For Ollama models, ensure it's installed
    return OllamaExecutor.ensureModel(model);
  }
}

/**
 * Gets the list of available models (both local and frontier)
 * @param {boolean} includeRemote - Whether to include remote models
 * @returns {string[]} - Array of available models
 */
export function getAllAvailableModels(includeRemote = true) {
  const ollamaModels = OllamaExecutor.getAvailableModels();
  
  if (!includeRemote) {
    return ollamaModels;
  }
  
  const frontierModels = [
    'gpt-4.1',
    'o3',
    'o4-mini'
  ];
  
  return [...ollamaModels, ...frontierModels];
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
  if (FrontierClient.isFrontierModel(model)) {
    // Can't "install" frontier models
    return true;
  } else {
    const installed = await OllamaExecutor.readModels();
    if (!installed.includes(model)) {
      return OllamaExecutor.installModel(model);
    }
    return true;
  }
} 