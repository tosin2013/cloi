/**
 * Model Configuration Module
 * 
 * Provides utilities for managing default model configuration.
 * Allows setting and retrieving the default model for CLOI to use.
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { FrontierClient } from '../core/executor/frontier.js';
import { KeyManager } from './keyManager.js';

// Path to the CLOI configuration directory
const CONFIG_DIR = join(homedir(), '.cloi');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

/**
 * Ensures the configuration directory exists
 * @returns {Promise<void>}
 */
async function ensureConfigDir() {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch (error) {
    console.error(`Error creating config directory: ${error.message}`);
  }
}

/**
 * Gets the current configuration object
 * @returns {Promise<Object>} Configuration object
 */
async function getConfig() {
  await ensureConfigDir();
  
  try {
    if (existsSync(CONFIG_FILE)) {
      const content = await fs.readFile(CONFIG_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Error reading config file: ${error.message}`);
  }
  
  // Return default config if file doesn't exist or is invalid
  return { defaultModel: 'phi4:latest' };
}

/**
 * Saves the configuration object
 * @param {Object} config Configuration object to save
 * @returns {Promise<boolean>} True if successful
 */
async function saveConfig(config) {
  await ensureConfigDir();
  
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error saving config file: ${error.message}`);
    return false;
  }
}

/**
 * Gets the default model from configuration
 * @returns {Promise<string>} The default model name
 */
export async function getDefaultModel() {
  const config = await getConfig();
  return config.defaultModel || 'phi4:latest';
}

/**
 * Sets the default model in configuration
 * @param {string} modelName The model name to set as default
 * @returns {Promise<boolean>} True if successful
 */
export async function setDefaultModel(modelName) {
  const config = await getConfig();
  config.defaultModel = modelName;
  return saveConfig(config);
}

/**
 * Checks if the default model is a Frontier model requiring an API key
 * @param {string} modelName The model name to check
 * @returns {boolean} True if the model is a Frontier model
 */
export function isFrontierModel(modelName) {
  return FrontierClient.isFrontierModel(modelName);
}

/**
 * Stores API key for Frontier model
 * @param {string} modelName The model name
 * @param {string} apiKey The API key to store
 * @returns {Promise<boolean>} True if successful
 */
export async function storeModelApiKey(modelName, apiKey) {
  return KeyManager.storeKey(modelName, apiKey);
}

/**
 * Verifies that a valid API key exists for a Frontier model
 * @param {string} modelName The model name to check
 * @returns {Promise<boolean>} True if a valid API key exists
 */
export async function verifyModelApiKey(modelName) {
  if (!isFrontierModel(modelName)) {
    return true; // Not a Frontier model, no API key needed
  }
  
  const hasKey = await KeyManager.hasKey(modelName);
  if (!hasKey) {
    return false;
  }
  
  // Test the API key
  try {
    const client = new FrontierClient(modelName);
    await client.getCredentials();
    return true;
  } catch (error) {
    // Invalid API key
    await KeyManager.deleteKey(modelName);
    return false;
  }
} 