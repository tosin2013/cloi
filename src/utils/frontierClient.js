import { KeyManager } from './keyManager.js';
import { getApiEndpoint, getModelConfig } from './modelConfig.js';
import boxen from 'boxen';
import { askInput } from '../ui/prompt.js';
import { BOX } from '../ui/boxen.js';
import chalk from 'chalk';

/**
 * Client for interacting with frontier models (GPT-4.1, O3)
 */
export class FrontierClient {
  /**
   * Initialize the client with a model
   * @param {string} model - Model identifier
   */
  constructor(model) {
    this.model = model;
    this.config = getModelConfig(model);
    this.endpoint = getApiEndpoint(model);
  }

  /**
   * Get the API key and optional organization ID for the current model
   * @returns {Promise<{apiKey: string, orgId?: string}>} - API credentials
   * @throws {Error} If API key is not found
   */
  async getCredentials() {
    try {
      const apiKey = await KeyManager.getKey(this.model);
      console.log(chalk.gray(`Checking API key for ${this.model}: ${apiKey ? 'found' : 'not found'}`));
      
      if (!apiKey) {
        console.log(chalk.yellow(`No API key found for ${this.model}, prompting for input...`));
        console.log(boxen(
          `Please enter your API key for ${this.model}:`,
          { ...BOX.CONFIRM, title: 'API Key Required' }
        ));
        
        const newApiKey = await askInput('API Key: ');
        
        if (!newApiKey) {
          console.log(chalk.red('No API key provided'));
          throw new Error('API key is required for frontier models.');
        }
        
        console.log(chalk.gray('Attempting to store new API key...'));
        const stored = await KeyManager.storeKey(this.model, newApiKey);
        if (!stored) {
          console.log(chalk.red('Failed to store API key securely'));
          throw new Error('Failed to store API key securely.');
        }
        console.log(chalk.green('API key stored successfully'));
        
        return { apiKey: newApiKey };
      }

      // For providers that require organization ID (like OpenAI)
      const orgId = this.config.requiresOrg ? 
        await KeyManager.getKey(`${this.model}_org`) : 
        undefined;

      if (this.config.requiresOrg && !orgId) {
        console.log(chalk.yellow(`Organization ID required for ${this.model}`));
      }

      return { apiKey, orgId };
    } catch (error) {
      console.error(chalk.red(`Error getting credentials: ${error.message}`));
      throw error;
    }
  }

  /**
   * Make an API call to the appropriate service
   * @param {string} prompt - The prompt to send
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - API response
   */
  async query(prompt, options = {}) {
    try {
      const { apiKey, orgId } = await this.getCredentials();
      
      // Prepare headers based on provider
      const headers = {
        'Content-Type': 'application/json',
      };

      // Add provider-specific headers
      switch (this.config.provider) {
        case 'openai':
          headers['Authorization'] = `Bearer ${apiKey}`;
          if (orgId) headers['OpenAI-Organization'] = orgId;
          break;
        case 'anthropic':
          headers['x-api-key'] = apiKey;
          break;
        default:
          throw new Error(`Unknown provider: ${this.config.provider}`);
      }

      // Prepare request body based on provider
      const body = this.prepareRequestBody(prompt, options);
      console.log(chalk.gray('Request Body:'), JSON.stringify(body, null, 2));

      // Use the correct endpoint based on provider
      const endpoint = this.config.provider === 'openai' ? 
        this.endpoint + '/responses' : 
        this.endpoint + '/completions';

      console.log(chalk.gray(`Making API request to ${endpoint}`));
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      console.log(chalk.gray('Raw Response Status:'), response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.log(chalk.red('API request failed raw error data:'), errorData);
        
        if (response.status === 401) {
          // Invalid API key - delete it and throw error
          console.log(chalk.red('Invalid API key detected, removing...'));
          await KeyManager.deleteKey(this.model);
          throw new Error('Invalid API key. Please try again with a valid key.');
        }
        
        const errorMessage = errorData.error?.message || errorData.error || errorData.message || response.statusText;
        throw new Error(`API request failed: ${errorMessage}`);
      }

      const data = await response.json();
      console.log(chalk.gray('Raw API Response Data:'), JSON.stringify(data, null, 2));
      const normalized = this.normalizeResponse(data);
      console.log(chalk.gray('Normalized API Response:'), JSON.stringify(normalized, null, 2));
      return normalized;
    } catch (error) {
      // If the error is about invalid/missing API key, delete the stored key
      if (error.message.includes('Invalid API key') || error.message.includes('API key')) {
        console.log(chalk.red('API key error detected, removing key...'));
        await KeyManager.deleteKey(this.model);
      }
      throw error;
    }
  }

  /**
   * Prepare the request body according to the provider's format
   * @private
   */
  prepareRequestBody(prompt, options) {
    const baseOptions = {
      temperature: options.temperature || 0.7,
      max_output_tokens: Math.min(options.max_tokens || 2048, this.config.maxTokens),
      top_p: 1,
      store: true
    };

    switch (this.config.provider) {
      case 'openai':
        return {
          model: this.config.modelId,
          input: [{ content: prompt, role: "user" }],
          text: {
            format: {
              type: "text"
            }
          },
          reasoning: {},
          tools: [],
          temperature: options.temperature || 1,
          max_output_tokens: Math.min(options.max_tokens || 2048, this.config.maxTokens),
          top_p: 1,
          store: true
        };
      case 'anthropic':
        return {
          model: this.config.modelId,
          messages: [
            { role: "user", content: prompt }
          ],
          ...baseOptions,
          stream: false,
        };
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  /**
   * Normalize the response format across different providers
   * @private
   */
  normalizeResponse(data) {
    console.log(chalk.blue('Normalizing response from provider:'), this.config.provider, JSON.stringify(data, null, 2));
    switch (this.config.provider) {
      case 'openai':
        // Check if this is from the /responses API (has an 'output' array)
        if (data.output && Array.isArray(data.output) && data.output.length > 0 &&
            data.output[0].content && Array.isArray(data.output[0].content) && data.output[0].content.length > 0 &&
            data.output[0].content[0].type === 'output_text' && typeof data.output[0].content[0].text === 'string') {
          return {
            response: data.output[0].content[0].text,
            usage: data.usage || {}
          };
        }
        // Fallback for older completions API format (just in case, though /responses is primary for frontier)
        if (data.choices && Array.isArray(data.choices) && data.choices.length > 0 &&
            data.choices[0].message && typeof data.choices[0].message.content === 'string') {
          return {
            response: data.choices[0].message.content,
            usage: data.usage || {}
          };
        }
        // If neither known structure matches, return empty with usage
        console.log(chalk.yellow('OpenAI response structure not recognized for text extraction, returning empty response.'));
        return {
          response: '',
          usage: data.usage || {}
        };
      case 'anthropic':
        // Ensure Anthropic structure is also safely accessed
        if (data.content && Array.isArray(data.content) && data.content.length > 0 &&
            typeof data.content[0].text === 'string') {
          return {
            response: data.content[0].text,
            usage: {
              prompt_tokens: data.usage?.input_tokens,
              completion_tokens: data.usage?.output_tokens,
              total_tokens: data.usage?.total_tokens
            }
          };
        }
        console.log(chalk.yellow('Anthropic response structure not recognized for text extraction, returning empty response.'));
        return {
          response: '',
          usage: data.usage || {}
        };
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  /**
   * Check if this is a frontier model
   * @param {string} model - Model name to check
   * @returns {boolean} - True if it's a frontier model
   */
  static isFrontierModel(model) {
    const frontierModels = [
      'gpt-4.1-mini',
      'gpt-4.1',
      'o3',
      'o3-mini'
    ];
    const isFrontier = frontierModels.includes(model);
    console.log(chalk.gray(`Checking if ${model} is a frontier model: ${isFrontier}`));
    return isFrontier;
  }
} 