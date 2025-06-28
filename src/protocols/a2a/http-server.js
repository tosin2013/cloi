import { EventEmitter } from 'events';
import express from 'express';
import cors from 'cors';
import { v4 as uuid } from 'uuid';

/**
 * Standards-compliant A2A HTTP Server
 * Implements the Agent2Agent protocol using HTTP/JSON-RPC 2.0
 * Based on the official A2A specification
 */
export default class A2AHttpServer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = this.mergeDefaultConfig(config);
    this.agentId = uuid();
    this.tasks = new Map();
    this.sessions = new Map();
    this.messageHistory = [];
    
    // HTTP Server components
    this.app = express();
    this.server = null;
    this.isRunning = false;
    
    // A2A Protocol state
    this.metrics = {
      messagesProcessed: 0,
      tasksCompleted: 0,
      errors: 0,
      startTime: Date.now()
    };
    
    console.log(`🤖 A2A HTTP Server initialized with agent ID: ${this.agentId}`);
  }

  mergeDefaultConfig(config) {
    return {
      networking: {
        port: 9090,
        host: 'localhost',
        ...config.networking
      },
      ai: {
        integration: 'universal',
        ...config.ai
      },
      cors: {
        enabled: true,
        origin: '*',
        ...config.cors
      },
      agent: {
        name: 'Cloi Development Agent',
        description: 'Local development expert with plugin ecosystem',
        version: '1.0.0',
        ...config.agent
      }
    };
  }

  /**
   * Start the A2A HTTP server
   */
  async start() {
    try {
      console.log('🚀 Starting A2A HTTP server...');
      
      // Setup Express middleware
      this.setupMiddleware();
      
      // Setup A2A routes
      this.setupRoutes();
      
      // Start HTTP server
      await this.startHttpServer();
      
      this.isRunning = true;
      this.emit('server:started', { 
        agentId: this.agentId, 
        port: this.config.networking.port 
      });
      
      console.log(`✅ A2A HTTP server started on port ${this.config.networking.port}`);
      console.log(`🔗 Agent Card: http://${this.config.networking.host}:${this.config.networking.port}/.well-known/agent.json`);
      
    } catch (error) {
      console.error('❌ Failed to start A2A HTTP server:', error);
      throw error;
    }
  }

  /**
   * Stop the A2A HTTP server
   */
  async stop() {
    if (!this.isRunning) {
      console.log('⚠️ A2A server is not running');
      return;
    }

    return new Promise((resolve) => {
      this.server.close(() => {
        this.isRunning = false;
        console.log('✅ A2A HTTP server stopped');
        this.emit('server:stopped');
        resolve();
      });
    });
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // CORS support
    if (this.config.cors.enabled) {
      this.app.use(cors({
        origin: this.config.cors.origin,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
      }));
    }

    // JSON parsing
    this.app.use(express.json({ limit: '10mb' }));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`📡 ${req.method} ${req.url} - ${req.ip}`);
      next();
    });

    // Error handling
    this.app.use((err, req, res, next) => {
      console.error('Express error:', err);
      res.status(500).json(this.createErrorResponse('Internal server error', null, -32603));
    });
  }

  /**
   * Setup A2A protocol routes
   */
  setupRoutes() {
    // Agent Card discovery endpoint
    this.app.get('/.well-known/agent.json', (req, res) => {
      try {
        const agentCard = this.getAgentCard();
        res.json(agentCard);
      } catch (error) {
        console.error('Error serving agent card:', error);
        res.status(500).json({ error: 'Failed to retrieve agent card' });
      }
    });

    // Main JSON-RPC endpoint
    this.app.post('/', async (req, res) => {
      try {
        const response = await this.handleJsonRpc(req.body);
        
        // Check if it's a streaming response (AsyncGenerator)
        if (response && typeof response[Symbol.asyncIterator] === 'function') {
          // Setup Server-Sent Events
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.flushHeaders();

          try {
            for await (const event of response) {
              res.write(`id: ${Date.now()}\n`);
              res.write(`data: ${JSON.stringify(event)}\n\n`);
            }
          } catch (streamError) {
            console.error('Streaming error:', streamError);
            const errorResponse = this.createErrorResponse(
              streamError.message,
              req.body?.id,
              -32603
            );
            res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
          } finally {
            res.end();
          }
        } else {
          // Standard JSON response
          res.json(response);
        }
      } catch (error) {
        console.error('JSON-RPC handler error:', error);
        const errorResponse = this.createErrorResponse(
          error.message,
          req.body?.id,
          -32603
        );
        res.status(500).json(errorResponse);
      }
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        agentId: this.agentId,
        uptime: Date.now() - this.metrics.startTime,
        metrics: this.metrics
      });
    });
  }

  /**
   * Start the HTTP server
   */
  async startHttpServer() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(
        this.config.networking.port,
        this.config.networking.host,
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Handle JSON-RPC 2.0 requests
   */
  async handleJsonRpc(request) {
    // Validate JSON-RPC format
    if (!request || request.jsonrpc !== '2.0' || !request.method) {
      return this.createErrorResponse('Invalid JSON-RPC request', request?.id, -32600);
    }

    this.metrics.messagesProcessed++;

    try {
      switch (request.method) {
        case 'message/send':
          return await this.handleSendMessage(request);
        case 'message/stream':
          return await this.handleStreamMessage(request);
        case 'tasks/get':
          return await this.handleGetTask(request);
        case 'tasks/cancel':
          return await this.handleCancelTask(request);
        case 'tasks/pushNotificationConfig/set':
          return await this.handleSetPushNotificationConfig(request);
        case 'tasks/pushNotificationConfig/get':
          return await this.handleGetPushNotificationConfig(request);
        case 'tasks/resubscribe':
          return await this.handleTaskResubscribe(request);
        default:
          return this.createErrorResponse('Method not found', request.id, -32601);
      }
    } catch (error) {
      console.error(`Error handling ${request.method}:`, error);
      return this.createErrorResponse(error.message, request.id, -32603);
    }
  }

  /**
   * Handle message/send requests
   */
  async handleSendMessage(request) {
    const { message, blocking = false, configuration = {} } = request.params || {};
    
    if (!message) {
      return this.createErrorResponse('Missing message parameter', request.id, -32602);
    }

    // Convert A2A message to internal format
    const internalMessage = this.convertFromA2AMessage(message);
    
    // Create task
    const task = this.createTask(message, configuration);
    
    // Process message with Cloi's capabilities
    const result = await this.processMessage(internalMessage, task);
    
    // Update task
    task.state = 'completed';
    task.updatedAt = new Date().toISOString();
    task.result = result;
    
    this.metrics.tasksCompleted++;
    
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        taskId: task.id,
        message: this.convertToA2AMessage(result, task)
      }
    };
  }

  /**
   * Handle message/stream requests (Server-Sent Events)
   */
  async handleStreamMessage(request) {
    const { message } = request.params || {};
    
    if (!message) {
      throw new Error('Missing message parameter');
    }

    // Return async generator for streaming
    return this.createMessageStream(message, request.id);
  }

  /**
   * Create streaming response generator
   */
  async* createMessageStream(message, requestId) {
    const task = this.createTask(message);
    
    // Initial response
    yield {
      jsonrpc: '2.0',
      id: requestId,
      result: {
        taskId: task.id,
        message: {
          kind: 'message',
          messageId: uuid(),
          role: 'agent',
          parts: [{ kind: 'text', text: 'Starting analysis...' }],
          taskId: task.id
        }
      }
    };

    // Process with progress updates
    try {
      const internalMessage = this.convertFromA2AMessage(message);
      
      // Simulate processing steps
      const steps = [
        'Analyzing error context...',
        'Loading appropriate analyzers...',
        'Running analysis...',
        'Generating suggestions...'
      ];

      for (const step of steps) {
        yield {
          jsonrpc: '2.0',
          id: requestId,
          result: {
            taskId: task.id,
            message: {
              kind: 'message',
              messageId: uuid(),
              role: 'agent',
              parts: [{ kind: 'text', text: step }],
              taskId: task.id
            }
          }
        };
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Final result
      const result = await this.processMessage(internalMessage, task);
      
      yield {
        jsonrpc: '2.0',
        id: requestId,
        result: {
          taskId: task.id,
          message: this.convertToA2AMessage(result, task)
        }
      };
      
    } catch (error) {
      yield {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: -32603,
          message: error.message
        }
      };
    }
  }

  /**
   * Handle tasks/get requests
   */
  async handleGetTask(request) {
    const { taskId } = request.params || {};
    
    if (!taskId) {
      return this.createErrorResponse('Missing taskId parameter', request.id, -32602);
    }

    const task = this.tasks.get(taskId);
    
    if (!task) {
      return this.createErrorResponse('Task not found', request.id, -32001);
    }

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        task: this.convertTaskToA2A(task)
      }
    };
  }

  /**
   * Handle tasks/cancel requests
   */
  async handleCancelTask(request) {
    const { taskId } = request.params || {};
    
    if (!taskId) {
      return this.createErrorResponse('Missing taskId parameter', request.id, -32602);
    }

    const task = this.tasks.get(taskId);
    
    if (!task) {
      return this.createErrorResponse('Task not found', request.id, -32001);
    }

    if (task.state === 'completed' || task.state === 'canceled') {
      return this.createErrorResponse('Task not cancelable', request.id, -32002);
    }

    task.state = 'canceled';
    task.updatedAt = new Date().toISOString();

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        success: true
      }
    };
  }

  /**
   * Handle push notification config requests (placeholder)
   */
  async handleSetPushNotificationConfig(request) {
    return this.createErrorResponse('Push notifications not supported', request.id, -32003);
  }

  async handleGetPushNotificationConfig(request) {
    return this.createErrorResponse('Push notifications not supported', request.id, -32003);
  }

  async handleTaskResubscribe(request) {
    return this.createErrorResponse('Task resubscription not supported', request.id, -32004);
  }

  /**
   * Get Agent Card for discovery
   */
  getAgentCard() {
    return {
      name: this.config.agent.name,
      description: this.config.agent.description,
      url: `http://${this.config.networking.host}:${this.config.networking.port}/`,
      version: this.config.agent.version,
      provider: {
        organization: 'Cloi AI',
        url: 'https://github.com/cloi-ai/cloi'
      },
      capabilities: {
        streaming: true,
        pushNotifications: false,
        stateTransitionHistory: true
      },
      skills: [
        {
          id: 'code-analysis',
          name: 'Code Analysis',
          description: 'Analyze code structure, identify bugs, and suggest improvements',
          tags: ['analysis', 'debugging', 'code-quality'],
          examples: [
            'Analyze this TypeScript error: Cannot find module',
            'Review this function for potential issues',
            'Find performance bottlenecks in this code'
          ],
          inputModes: ['text/plain', 'application/json'],
          outputModes: ['text/plain', 'application/json']
        },
        {
          id: 'error-fixing',
          name: 'Automated Error Fixing',
          description: 'Automatically generate and apply fixes for common coding errors',
          tags: ['fixing', 'automation', 'debugging'],
          examples: [
            'Fix this linting error automatically',
            'Generate a patch for this TypeScript error',
            'Auto-fix test failures'
          ]
        },
        {
          id: 'environment-analysis',
          name: 'Environment Analysis',
          description: 'Analyze development environment and project context',
          tags: ['environment', 'context', 'setup'],
          examples: [
            'Analyze my development environment',
            'Check project dependencies and configuration',
            'Identify missing tools or setup issues'
          ]
        }
      ],
      defaultInputModes: ['text/plain'],
      defaultOutputModes: ['text/plain', 'application/json'],
      securitySchemes: undefined,
      security: undefined
    };
  }

  /**
   * Convert A2A message format to Cloi internal format
   */
  convertFromA2AMessage(a2aMessage) {
    const textContent = a2aMessage.parts
      ?.filter(part => part.kind === 'text')
      ?.map(part => part.text)
      ?.join('\n') || '';

    return {
      id: a2aMessage.messageId,
      type: 'message:send',
      from: 'external-agent',
      to: this.agentId,
      data: {
        role: a2aMessage.role,
        content: textContent,
        contextId: a2aMessage.contextId,
        taskId: a2aMessage.taskId,
        metadata: a2aMessage.metadata
      },
      timestamp: Date.now()
    };
  }

  /**
   * Convert Cloi internal result to A2A message format
   */
  convertToA2AMessage(internalResult, task) {
    return {
      kind: 'message',
      messageId: uuid(),
      role: 'agent',
      parts: [
        {
          kind: 'text',
          text: internalResult.analysis || internalResult.content || internalResult.message || 'Analysis completed'
        }
      ],
      contextId: internalResult.contextId,
      taskId: task.id,
      metadata: {
        confidence: internalResult.confidence,
        analyzer: internalResult.analyzer,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Create a new task
   */
  createTask(message, configuration = {}) {
    const task = {
      id: uuid(),
      kind: 'task',
      contextId: message.contextId || uuid(),
      state: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      message,
      configuration,
      history: [message],
      artifacts: [],
      statusHistory: [
        {
          state: 'submitted',
          timestamp: new Date().toISOString()
        }
      ]
    };

    this.tasks.set(task.id, task);
    return task;
  }

  /**
   * Convert internal task to A2A format
   */
  convertTaskToA2A(task) {
    return {
      kind: 'task',
      id: task.id,
      contextId: task.contextId,
      status: {
        state: task.state,
        timestamp: task.updatedAt
      },
      history: task.history,
      artifacts: task.artifacts,
      metadata: task.metadata
    };
  }

  /**
   * Process message using Cloi's capabilities
   */
  async processMessage(internalMessage, task) {
    try {
      // This is where we'd integrate with Cloi's existing systems
      // For now, return a simple analysis
      
      const content = internalMessage.data.content;
      
      // Simulate analysis
      const analysis = `Analysis of: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"\n\nThis appears to be a ${this.detectErrorType(content)}. Here are some suggestions:\n\n1. Check for syntax errors\n2. Verify imports and dependencies\n3. Review variable scope\n4. Consider type compatibility`;

      return {
        id: uuid(),
        analysis,
        confidence: 0.85,
        analyzer: 'cloi-basic',
        suggestions: [
          {
            title: 'Check syntax',
            description: 'Review code for syntax errors',
            priority: 'high'
          }
        ],
        contextId: internalMessage.data.contextId,
        taskId: task.id
      };
      
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }

  /**
   * Simple error type detection
   */
  detectErrorType(content) {
    if (/TypeError|ReferenceError|SyntaxError/.test(content)) {
      return 'JavaScript runtime error';
    }
    if (/ImportError|ModuleNotFoundError/.test(content)) {
      return 'Python import error';
    }
    if (/compilation.*failed|build.*error/i.test(content)) {
      return 'build error';
    }
    return 'general error';
  }

  /**
   * Create JSON-RPC error response
   */
  createErrorResponse(message, id, code) {
    this.metrics.errors++;
    
    return {
      jsonrpc: '2.0',
      id: id || null,
      error: {
        code,
        message
      }
    };
  }

  /**
   * Get server status
   */
  getStatus() {
    return {
      agentId: this.agentId,
      isRunning: this.isRunning,
      port: this.config.networking.port,
      uptime: Date.now() - this.metrics.startTime,
      metrics: this.metrics,
      tasksActive: this.tasks.size
    };
  }
}