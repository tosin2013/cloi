import keytar from 'keytar';

const SERVICE_NAME = 'cloi-frontier';

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
      return await keytar.getPassword(SERVICE_NAME, model);
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
      await keytar.deletePassword(SERVICE_NAME, model);
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