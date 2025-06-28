/**
 * Claude Provider Plugin
 * 
 * Integrates with Anthropic's Claude API with streaming and structured output
 */

import { BaseProvider } from '../../../core/plugin-manager/interfaces.js';
import Anthropic from '@anthropic-ai/sdk';

export default class ClaudeProvider extends BaseProvider {
  constructor(manifest, config) {
    super(manifest, config);
    this.client = null;
    this.rateLimiter = null;
    this.initializeClient();
  }

  /**
   * Initialize Anthropic client
   */
  initializeClient() {
    const apiKey = this.getConfig('apiKey') || 
                   process.env.ANTHROPIC_API_KEY ||
                   this.config.apiKey;

    if (!apiKey) {
      console.warn('⚠️  Claude provider: No API key configured');
      return;
    }

    this.client = new Anthropic({
      apiKey: apiKey,
      baseURL: this.getConfig('baseURL'),
      timeout: this.getConfig('timeout', 30000)
    });

    // Initialize rate limiter if enabled
    if (this.getConfig('rateLimiting.enabled', true)) {
      this.initializeRateLimiter();
    }
  }

  /**
   * Initialize rate limiter
   */
  initializeRateLimiter() {
    const requestsPerMinute = this.getConfig('rateLimiting.requestsPerMinute', 50);
    const tokensPerMinute = this.getConfig('rateLimiting.tokensPerMinute', 40000);
    
    this.rateLimiter = {
      requests: [],
      tokens: [],
      requestLimit: requestsPerMinute,
      tokenLimit: tokensPerMinute
    };
  }

  /**
   * Check if provider is available
   */
  async isAvailable() {
    if (!this.client) {
      return false;
    }

    try {
      // Simple availability check - could ping the API
      return true;
    } catch (error) {
      console.error('Claude provider unavailable:', error.message);
      return false;
    }
  }

  /**
   * Send query to Claude
   */
  async query(prompt, options = {}) {
    if (!this.client) {
      throw new Error('Claude provider not initialized - check API key configuration');
    }

    // Apply rate limiting
    if (this.rateLimiter) {
      await this.checkRateLimit(options.max_tokens || 1000);
    }

    const {
      model = this.getConfig('defaultModel', 'claude-3-5-sonnet-20241022'),
      temperature = 0.3,
      max_tokens = 1000,
      stream = false,
      structured = false,
      onStreamStart,
      ...otherOptions
    } = options;

    try {
      if (structured) {
        return await this.queryStructured(prompt, model, options);
      } else if (stream) {
        return await this.queryStreaming(prompt, model, options);
      } else {
        return await this.queryStandard(prompt, model, options);
      }
    } catch (error) {
      // Enhanced error handling
      if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before making more requests.');
      } else if (error.status === 401) {
        throw new Error('Invalid API key. Please check your Claude API configuration.');
      } else if (error.status === 400) {
        throw new Error(`Invalid request: ${error.message}`);
      } else {
        throw new Error(`Claude API error: ${error.message}`);
      }
    }
  }

  /**
   * Standard (non-streaming) query
   */
  async queryStandard(prompt, model, options) {
    const response = await this.client.messages.create({
      model: model,
      max_tokens: options.max_tokens || 1000,
      temperature: options.temperature || 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      ...options
    });

    return {
      response: response.content[0].text,
      reasoning: '', // Claude doesn't provide separate reasoning
      usage: response.usage,
      model: response.model
    };
  }

  /**
   * Streaming query
   */
  async queryStreaming(prompt, model, options) {
    const stream = await this.client.messages.create({
      model: model,
      max_tokens: options.max_tokens || 1000,
      temperature: options.temperature || 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: true,
      ...options
    });

    let fullResponse = '';
    let firstChunk = true;

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        if (firstChunk && options.onStreamStart) {
          options.onStreamStart();
          firstChunk = false;
        }
        
        const text = chunk.delta.text;
        if (text) {
          process.stdout.write(text);
          fullResponse += text;
        }
      }
    }

    return {
      response: fullResponse,
      reasoning: '',
      streamed: true
    };
  }

  /**
   * Structured output query (using Claude's structured output when available)
   */
  async queryStructured(prompt, model, options) {
    // For now, Claude doesn't have native structured output like OpenAI
    // We'll need to implement JSON parsing from responses
    const enhancedPrompt = this.addStructuredPrompt(prompt, options.schema);
    
    const response = await this.queryStandard(enhancedPrompt, model, options);
    
    try {
      // Try to parse JSON from response
      const jsonMatch = response.response.match(/```json\n([\s\S]*?)\n```/) ||
                       response.response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const structuredData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return structuredData;
      }
    } catch (error) {
      console.warn('Failed to parse structured output:', error.message);
    }

    // Fallback to regular response
    return { error: 'Failed to parse structured output', raw: response.response };
  }

  /**
   * Add structured output instructions to prompt
   */
  addStructuredPrompt(prompt, schema) {
    if (!schema) {
      return prompt + '\n\nPlease provide your response in JSON format.';
    }

    const schemaDesc = JSON.stringify(schema, null, 2);
    return `${prompt}

Please provide your response in JSON format following this exact schema:

\`\`\`json
${schemaDesc}
\`\`\`

Your response should be valid JSON that matches this schema exactly.`;
  }

  /**
   * Check rate limiting
   */
  async checkRateLimit(tokensRequested) {
    if (!this.rateLimiter) return;

    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean old entries
    this.rateLimiter.requests = this.rateLimiter.requests.filter(time => time > oneMinuteAgo);
    this.rateLimiter.tokens = this.rateLimiter.tokens.filter(entry => entry.time > oneMinuteAgo);

    // Check request limit
    if (this.rateLimiter.requests.length >= this.rateLimiter.requestLimit) {
      const waitTime = this.rateLimiter.requests[0] - oneMinuteAgo;
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    // Check token limit
    const tokensUsed = this.rateLimiter.tokens.reduce((sum, entry) => sum + entry.tokens, 0);
    if (tokensUsed + tokensRequested > this.rateLimiter.tokenLimit) {
      throw new Error('Token rate limit exceeded. Please wait before making more requests.');
    }

    // Record this request
    this.rateLimiter.requests.push(now);
    this.rateLimiter.tokens.push({ time: now, tokens: tokensRequested });
  }

  /**
   * Get supported models
   */
  getSupportedModels() {
    return this.manifest.supportedModels;
  }

  /**
   * Get provider capabilities
   */
  getCapabilities() {
    return this.manifest.capabilities;
  }

  /**
   * Test connection to Claude API
   */
  async testConnection() {
    try {
      const response = await this.query('Test connection', { max_tokens: 10 });
      return {
        success: true,
        latency: Date.now() - Date.now(), // Would measure actual latency
        model: response.model
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    if (!this.rateLimiter) {
      return { requests: 0, tokens: 0 };
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentRequests = this.rateLimiter.requests.filter(time => time > oneMinuteAgo);
    const recentTokens = this.rateLimiter.tokens
      .filter(entry => entry.time > oneMinuteAgo)
      .reduce((sum, entry) => sum + entry.tokens, 0);

    return {
      requests: recentRequests.length,
      tokens: recentTokens,
      requestLimit: this.rateLimiter.requestLimit,
      tokenLimit: this.rateLimiter.tokenLimit
    };
  }
}