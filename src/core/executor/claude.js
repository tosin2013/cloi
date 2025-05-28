/**
 * Claude Executor Module
 * 
 * Handles execution of LLM queries via Anthropic's Claude API.
 * Uses the official Anthropic JavaScript SDK for direct model interaction.
 */

import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import { getAnthropicApiKey } from '../../utils/apiKeyManager.js';

// Claude model configurations
const CLAUDE_MODELS = [
  'claude-4-opus-20250514',
  'claude-4-sonnet-20250514',
];

// Optimization sets for different use cases
const OPTIMIZATION_SETS = {
  "error_analysis": { 
    temperature: 0.3, 
    max_tokens: 1024,
    stream: true 
  },
  "error_determination": { 
    temperature: 0.1, 
    max_tokens: 64,
    stream: false 
  },
  "command_generation": { 
    temperature: 0.1, 
    max_tokens: 512,
    stream: false 
  },
  "patch_generation": { 
    temperature: 0.1, 
    max_tokens: 1536,
    stream: false 
  }
};

/**
 * Returns a list of available Claude models
 * @returns {string[]} - Array of Claude model names
 */
export function getClaudeModels() {
  return [...CLAUDE_MODELS];
}

/**
 * Creates and configures an Anthropic client instance
 * @returns {Anthropic|null} - Configured Anthropic client or null if no API key
 */
function createClaudeClient() {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return null;
  }
  
  return new Anthropic({
    apiKey: apiKey
  });
}

/**
 * Builds Claude-specific options based on optimization set
 * @param {string} optimizationSet - The optimization preset to use
 * @returns {Object} - Claude API options
 */
export function buildClaudeOptions(optimizationSet = "error_analysis") {
  const baseOptions = {
    temperature: 0.3,
    max_tokens: 1024,
    stream: false
  };
  
  const optSet = OPTIMIZATION_SETS[optimizationSet] || OPTIMIZATION_SETS["error_analysis"];
  return { ...baseOptions, ...optSet };
}

/**
 * Ensures Claude is available and accessible
 * @returns {Promise<boolean>} - True if Claude is available
 */
export async function ensureClaudeAvailable() {
  const client = createClaudeClient();
  if (!client) {
    console.error(chalk.red('Claude API key not found. Please set ANTHROPIC_API_KEY in your .zshrc file.'));
    return false;
  }
  
  try {
    // Test the API key by making a minimal request
    await client.messages.create({
      model: 'claude-3-5-haiku-20241022', // Use the fastest model for testing
      max_tokens: 1,
      messages: [{ role: 'user', content: 'test' }]
    });
    return true;
  } catch (error) {
    console.error(chalk.red(`Claude API error: ${error.message}`));
    return false;
  }
}

/**
 * Handles Claude-specific errors with user-friendly messages
 * @param {Error} error - The error to handle
 * @returns {string} - User-friendly error message
 */
export function handleClaudeError(error) {
  if (error.status === 401) {
    return 'Invalid API key. Please check your ANTHROPIC_API_KEY in .zshrc';
  } else if (error.status === 429) {
    return 'Rate limit exceeded. Please try again in a moment.';
  } else if (error.status === 400) {
    return 'Invalid request. Please check your input.';
  } else if (error.status >= 500) {
    return 'Claude API is temporarily unavailable. Please try again later.';
  } else {
    return `Claude API error: ${error.message}`;
  }
}

/**
 * Runs a query using Claude with streaming output
 * @param {string} prompt - The prompt to send
 * @param {string} model - Claude model to use
 * @param {string} optimizationSet - Optimization preset
 * @param {Function} [onStreamStart] - Optional callback when streaming begins
 * @returns {Promise<string>} - The model's response
 */
export async function queryClaudeStream(prompt, model, optimizationSet = "error_analysis", onStreamStart = null) {
  const client = createClaudeClient();
  if (!client) {
    throw new Error('Claude API key not available');
  }
  
  try {
    const options = buildClaudeOptions(optimizationSet);
    
    const requestParams = {
      model: model,
      max_tokens: options.max_tokens,
      temperature: options.temperature,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ]
    };
    
    // Handle streaming vs non-streaming
    if (options.stream && optimizationSet === "error_analysis") {
      requestParams.stream = true;
      
      let fullResponse = '';
      let firstChunkReceived = false;
      
      const stream = await client.messages.create(requestParams);
      
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
          const content = chunk.delta.text;
          
          // Notify that streaming has started on first actual content, if callback provided
          if (!firstChunkReceived && typeof onStreamStart === 'function') {
            onStreamStart();
            firstChunkReceived = true;
          }
          
          fullResponse += content;
          // Output in gray with no indentation
          process.stdout.write(chalk.gray(content));
        }
      }
      
      // Print a final newline
      process.stdout.write('\n');
      return fullResponse;
    } else {
      // Non-streaming request
      const response = await client.messages.create(requestParams);
      return response.content[0]?.text || '';
    }
  } catch (error) {
    const errorMessage = handleClaudeError(error);
    console.error(chalk.red(errorMessage));
    throw new Error(errorMessage);
  }
}

/**
 * Runs a query using Claude with structured JSON output
 * @param {string} prompt - The prompt to send
 * @param {string} model - Claude model to use
 * @param {Object} schema - JSON schema for structured output
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - The structured response
 */
export async function queryClaudeStructured(prompt, model, schema, options = {}) {
  const client = createClaudeClient();
  if (!client) {
    throw new Error('Claude API key not available');
  }
  
  try {
    const defaultOptions = buildClaudeOptions("patch_generation");
    const combinedOptions = { ...defaultOptions, ...options };
    
    // Add JSON schema instruction to the prompt
    const structuredPrompt = `${prompt}\n\nPlease respond with valid JSON that matches this schema: ${JSON.stringify(schema)}`;
    
    const response = await client.messages.create({
      model: model,
      max_tokens: combinedOptions.max_tokens,
      temperature: combinedOptions.temperature,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: structuredPrompt
            }
          ]
        }
      ]
    });
    
    const content = response.content[0]?.text || '';
    
    try {
      return JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON from the response if it's wrapped in markdown or other text
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      throw new Error(`Failed to parse JSON response: ${parseError.message}`);
    }
  } catch (error) {
    const errorMessage = handleClaudeError(error);
    console.error(chalk.red(errorMessage));
    throw new Error(errorMessage);
  }
}

/**
 * Wrapper function for backward compatibility with existing code
 * @param {string} prompt - The prompt to send
 * @param {string} model - Claude model to use
 * @param {string} optimizationSet - Optimization preset
 * @param {Function} [onStreamStart] - Optional callback when streaming begins
 * @returns {Promise<string>} - The model's response
 */
export async function queryClaudeWithTempScript(prompt, model, optimizationSet = "error_analysis", onStreamStart = null) {
  return await queryClaudeStream(prompt, model, optimizationSet, onStreamStart);
} 