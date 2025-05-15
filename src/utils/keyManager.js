import keytar from 'keytar';

const SERVICE_NAME = 'cloi-frontier';
const OPENAI_SHARED_KEY = 'openai-shared';

/**
 * Manages secure storage and retrieval of API keys for frontier models
 */
export class KeyManager {
  /**
   * Store API key securely in the system keychain
   * @param {string} model - Model identifier (e.g., 'gpt-4.1')
   * @param {string} apiKey - The API key to store
   * @returns {Promise<boolean>} - Success status
   */
  static async storeKey(model, apiKey) {
    try {
      // If this is an OpenAI model, store it both as model-specific and shared key
      if (model.startsWith('gpt-') || model.startsWith('o3') || model.startsWith('o4')) {
        await keytar.setPassword(SERVICE_NAME, OPENAI_SHARED_KEY, apiKey);
      }
      await keytar.setPassword(SERVICE_NAME, model, apiKey);
      return true;
    } catch (error) {
      console.error(`Failed to store API key: ${error.message}`);
      return false;
    }
  }

  /**
   * Retrieve API key from the system keychain
   * @param {string} model - Model identifier
   * @returns {Promise<string|null>} - The API key or null if not found
   */
  static async getKey(model) {
    try {
      // First try to get model-specific key
      const modelKey = await keytar.getPassword(SERVICE_NAME, model);
      if (modelKey) {
        return modelKey;
      }

      // If model-specific key not found and it's an OpenAI model, try shared key
      if (model.startsWith('gpt-') || model.startsWith('o3') || model.startsWith('o4')) {
        const sharedKey = await keytar.getPassword(SERVICE_NAME, OPENAI_SHARED_KEY);
        if (sharedKey) {
          return sharedKey;
        }
      }

      return null;
    } catch (error) {
      console.error(`Failed to retrieve API key: ${error.message}`);
      return null;
    }
  }

  /**
   * Delete API key from the system keychain
   * @param {string} model - Model identifier
   * @returns {Promise<boolean>} - Success status
   */
  static async deleteKey(model) {
    try {
      // Delete model-specific key
      await keytar.deletePassword(SERVICE_NAME, model);
      
      // If it's an OpenAI model, also consider deleting shared key
      if (model.startsWith('gpt-') || model.startsWith('o3') || model.startsWith('o4')) {
        // Only delete the shared key if explicitly requested
        if (model === OPENAI_SHARED_KEY) {
          await keytar.deletePassword(SERVICE_NAME, OPENAI_SHARED_KEY);
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to delete API key: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if an API key exists for a model
   * @param {string} model - Model identifier
   * @returns {Promise<boolean>} - True if key exists
   */
  static async hasKey(model) {
    const key = await KeyManager.getKey(model);
    return key !== null;
  }
} 