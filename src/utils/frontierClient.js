import { KeyManager } from './keyManager.js';
import { getApiEndpoint, getModelConfig } from './modelConfig.js';
import boxen from 'boxen';
import { askInput } from '../ui/terminalUI.js';
import { BOX } from '../ui/terminalUI.js';
import chalk from 'chalk';
import fs from 'fs';
import { dirname, join } from 'path';

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

      // Use the correct endpoint based on provider
      const endpoint = this.config.provider === 'openai' ? 
        this.endpoint + '/responses' : 
        this.endpoint + '/completions';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        
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
      const normalized = this.normalizeResponse(data);
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
      max_output_tokens: Math.min(options.max_tokens || 512, this.config.maxTokens),
      top_p: 1,
      store: true
    };

    switch (this.config.provider) {
      case 'openai':
        // Base request structure for all OpenAI models
        const requestBody = {
          model: this.config.modelId,
          input: [{ content: prompt, role: "user" }],
          text: {
            format: {
              type: "text"
            }
          },
          tools: [],
          max_output_tokens: Math.min(options.max_tokens || 512, this.config.maxTokens),
          top_p: 1,
          store: true
        };

        // Handle model-specific parameters:
        const isReasoningModel = this.config.modelId.startsWith('o3-');
        
        // For reasoning models (o3 family)
        if (isReasoningModel) {
          // Add reasoning.effort parameter for o3 models
          requestBody.reasoning = {
            effort: "low" // Use low to conserve tokens
          };
        } 
        // For standard models (gpt-4.1, etc.)
        else {
          // Empty reasoning object for non-o3 models
          requestBody.reasoning = {};
          
          // Temperature parameter is supported for standard models
          requestBody.temperature = options.temperature || 1;
        }

        return requestBody;
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
    let mainResponseText = '';
    let reasoningText = '';
    let usageData = data.usage || {};

    switch (this.config.provider) {
      case 'openai':
        // Check if the response was incomplete due to token limits
        if (data.status === "incomplete" && data.incomplete_details) {
          console.log(chalk.yellow(`Response incomplete: ${data.incomplete_details.reason}. Try reducing max_tokens.`));
        }
      
        // For the /responses API
        if (data.output && Array.isArray(data.output)) {
          const messageOutput = data.output.find(out => out.type === 'message');
          if (messageOutput && messageOutput.content && Array.isArray(messageOutput.content) && messageOutput.content.length > 0 &&
              messageOutput.content[0].type === 'output_text' && typeof messageOutput.content[0].text === 'string') {
            mainResponseText = messageOutput.content[0].text;
          } else if (data.status === "incomplete") {
            // Create a helpful error message for incomplete responses
            mainResponseText = `Error: Response incomplete due to token limit. The model started generating a response but hit the token limit before finishing.`;
          }

          const reasoningOutput = data.output.find(out => out.type === 'reasoning');
          if (reasoningOutput && reasoningOutput.summary && Array.isArray(reasoningOutput.summary)) {
            reasoningText = reasoningOutput.summary
              .filter(step => step.type === 'text_step' && typeof step.text === 'string')
              .map(step => step.text)
              .join('\n');
          }
        } else if (data.choices && Array.isArray(data.choices) && data.choices.length > 0 && // Fallback for older /chat/completions
            data.choices[0].message && typeof data.choices[0].message.content === 'string') {
          mainResponseText = data.choices[0].message.content;
        }
        
        return {
          response: mainResponseText,
          reasoning: reasoningText,
          usage: usageData
        };

      case 'anthropic':
        // Ensure Anthropic structure is also safely accessed
        if (data.content && Array.isArray(data.content) && data.content.length > 0 &&
            typeof data.content[0].text === 'string') {
          mainResponseText = data.content[0].text;
        }
        // Anthropic doesn't typically provide separate reasoning in this structure via cloi's current setup.
        // If it did, similar extraction logic would go here.
        return {
          response: mainResponseText,
          reasoning: '', // No separate reasoning field from Anthropic in current parsing
          usage: {
            prompt_tokens: data.usage?.input_tokens,
            completion_tokens: data.usage?.output_tokens,
            total_tokens: data.usage?.total_tokens
          }
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
    return isFrontier;
  }
} 