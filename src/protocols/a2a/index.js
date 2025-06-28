import { EventEmitter } from 'events';
import A2AHttpServer from './http-server.js';

// Dynamic imports for optional dependencies
let uuid = null;
let Ajv = null;
let cron = null;

try {
  const uuidModule = await import('uuid');
  uuid = uuidModule.v4;
  
  const ajvModule = await import('ajv');
  Ajv = ajvModule.default;
  
  const cronModule = await import('node-cron');
  cron = cronModule.default;
} catch (error) {
  console.warn('⚠️ Some A2A protocol dependencies not installed. Features may be limited.');
}

/**
 * Agent2Agent Protocol Implementation
 * 
 * Standards-compliant A2A protocol using HTTP/JSON-RPC 2.0
 * Compatible with the official A2A specification and a2a-js SDK
 */
export default class A2AProtocol extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = this.mergeDefaultConfig(config);
    this.agentId = uuid ? uuid() : Math.random().toString(36).substr(2, 9);
    
    // Create HTTP server instance
    this.httpServer = new A2AHttpServer(this.config);
    
    // Legacy compatibility properties
    this.agents = new Map();
    this.tasks = new Map();
    this.sessions = new Map();
    this.messageHistory = [];
    this.connections = new Set();
    
    // Protocol state
    this.isActive = false;
    this.isCoordinator = false;
    
    // Initialize metrics
    this.metrics = {
      messagesProcessed: 0,
      tasksCompleted: 0,
      errors: 0,
      startTime: Date.now(),
      uptime: 0,
      activeAgents: 0,
      activeTasks: 0,
      activeConnections: 0,
      agentsConnected: 0
    };
    
    // Forward events from HTTP server
    this.httpServer.on('server:started', (data) => {
      this.isActive = true;
      this.emit('protocol:started', data);
    });
    
    this.httpServer.on('server:stopped', () => {
      this.isActive = false;
      this.emit('protocol:stopped');
    });
    
    console.log(`🤖 A2A Protocol initialized with agent ID: ${this.agentId}`);
  }

  /**
   * Start the A2A protocol
   */
  async start() {
    try {
      console.log('🚀 Starting Agent2Agent protocol...');
      
      // Start HTTP server
      await this.httpServer.start();
      
      this.isActive = true;
      
      console.log(`✅ A2A Protocol started successfully on port ${this.config.networking.port}`);
      
    } catch (error) {
      console.error('❌ Failed to start A2A protocol:', error);
      throw error;
    }
  }

  /**
   * Stop the A2A protocol
   */
  async stop() {
    try {
      console.log('🛑 Stopping Agent2Agent protocol...');
      
      // Stop HTTP server
      await this.httpServer.stop();
      
      this.isActive = false;
      
      // Clear state
      this.agents.clear();
      this.tasks.clear();
      this.sessions.clear();
      
      // Emit shutdown event
      this.emit('protocol:stopped', { agentId: this.agentId });
      console.log('✅ A2A Protocol stopped successfully');
      
    } catch (error) {
      console.error('❌ Error stopping A2A protocol:', error);
      throw error;
    }
  }

  /**
   * Get server status
   */
  getStatus() {
    return this.httpServer.getStatus();
  }

  /**
   * Get agent card
   */
  getAgentCard() {
    return this.httpServer.getAgentCard();
  }

  /**
   * Default configuration
   */
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
      },
      ...config
    };
  }

  /**
   * Register this agent's capabilities (legacy compatibility)
   */
  async registerAgent(capabilities = [], metadata = {}) {
    const agentInfo = {
      id: this.agentId,
      capabilities,
      metadata: {
        ...metadata,
        startTime: Date.now(),
        version: '1.0.0',
        type: 'cloi-agent'
      },
      status: 'active',
      lastSeen: Date.now()
    };
    
    this.agents.set(this.agentId, agentInfo);
    
    // Broadcast registration if discovery is enabled
    if (this.config.discovery.enabled && this.isActive) {
      await this.broadcastMessage('agent:register', agentInfo);
    }
    
    this.emit('agent:registered', agentInfo);
    console.log(`📝 Agent registered with capabilities: ${capabilities.join(', ')}`);
    
    return agentInfo;
  }

  /**
   * Discover other agents in the network
   */
  async discoverAgents() {
    console.log('🔍 Discovering agents in the network...');
    
    const discoveryMessage = {
      type: 'agent:discovery',
      agentId: this.agentId,
      timestamp: Date.now()
    };
    
    await this.broadcastMessage('agent:discovery', discoveryMessage);
    
    // Wait for responses
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        const agents = Array.from(this.agents.values()).filter(agent => agent.id !== this.agentId);
        console.log(`📊 Discovered ${agents.length} agents`);
        resolve(agents);
      }, this.config.discovery.broadcastInterval);
    });
  }

  /**
   * Create a new collaboration task
   */
  async createTask(taskData, requiredCapabilities = []) {
    const taskId = uuid ? uuid() : Math.random().toString(36).substr(2, 9);
    
    const task = {
      id: taskId,
      ...taskData,
      requiredCapabilities,
      status: 'pending',
      createdBy: this.agentId,
      createdAt: Date.now(),
      participants: [],
      results: [],
      coordinationPattern: this.config.coordination.defaultPattern
    };
    
    this.tasks.set(taskId, task);
    
    // Find suitable agents
    const suitableAgents = this.findSuitableAgents(requiredCapabilities);
    
    if (suitableAgents.length === 0) {
      console.warn(`⚠️ No suitable agents found for task ${taskId}`);
      task.status = 'failed';
      task.error = 'No suitable agents available';
      return task;
    }
    
    // Initiate task coordination
    await this.coordinateTask(task, suitableAgents);
    
    this.emit('task:created', task);
    console.log(`📋 Task created: ${taskId} with ${suitableAgents.length} potential participants`);
    
    return task;
  }

  /**
   * Participate in a task
   */
  async participateInTask(taskId, contribution) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    const participation = {
      agentId: this.agentId,
      contribution,
      timestamp: Date.now(),
      status: 'submitted'
    };
    
    task.participants.push(participation);
    task.results.push(contribution);
    
    // Notify task coordinator
    await this.sendMessage(task.createdBy, 'task:contribution', {
      taskId,
      participation
    });
    
    this.emit('task:participated', { taskId, participation });
    console.log(`🤝 Participated in task: ${taskId}`);
    
    return participation;
  }

  /**
   * Complete a task and merge results
   */
  async completeTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    if (task.createdBy !== this.agentId) {
      throw new Error(`Only task creator can complete task ${taskId}`);
    }
    
    // Apply coordination pattern to merge results
    const finalResult = await this.mergeTaskResults(task);
    
    task.status = 'completed';
    task.completedAt = Date.now();
    task.finalResult = finalResult;
    
    // Notify all participants
    for (const participant of task.participants) {
      if (participant.agentId !== this.agentId) {
        await this.sendMessage(participant.agentId, 'task:completed', {
          taskId,
          finalResult
        });
      }
    }
    
    this.metrics.tasksCompleted++;
    this.emit('task:completed', task);
    console.log(`✅ Task completed: ${taskId}`);
    
    return task;
  }

  /**
   * Send a message to a specific agent
   */
  async sendMessage(targetAgentId, messageType, data) {
    const message = {
      id: uuid ? uuid() : Math.random().toString(36).substr(2, 9),
      type: messageType,
      from: this.agentId,
      to: targetAgentId,
      data,
      timestamp: Date.now()
    };
    
    // Validate message
    if (this.validator && !this.validateMessage(message)) {
      throw new Error('Invalid message format');
    }
    
    // Find connection to target agent
    const targetAgent = this.agents.get(targetAgentId);
    if (!targetAgent || !targetAgent.connection) {
      throw new Error(`Agent ${targetAgentId} not connected`);
    }
    
    // Send message
    await this.transmitMessage(targetAgent.connection, message);
    
    this.metrics.messagesProcessed++;
    this.emit('message:sent', message);
    
    return message;
  }

  /**
   * Broadcast message to all connected agents
   */
  async broadcastMessage(messageType, data) {
    const message = {
      id: uuid ? uuid() : Math.random().toString(36).substr(2, 9),
      type: messageType,
      from: this.agentId,
      to: 'broadcast',
      data,
      timestamp: Date.now()
    };
    
    const promises = [];
    for (const connection of this.connections) {
      if (connection.readyState === WebSocket.OPEN) {
        promises.push(this.transmitMessage(connection, message));
      }
    }
    
    await Promise.allSettled(promises);
    
    this.metrics.messagesProcessed++;
    this.emit('message:broadcast', message);
    
    return message;
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(message, connection) {
    try {
      // Validate message
      if (this.validator && !this.validateMessage(message)) {
        console.warn('⚠️ Received invalid message:', message);
        return;
      }
      
      // Add to message history
      this.addToMessageHistory(message);
      
      // Route message based on type
      switch (message.type) {
        case 'agent:register':
          await this.handleAgentRegistration(message, connection);
          break;
        case 'agent:discovery':
          await this.handleAgentDiscovery(message, connection);
          break;
        case 'task:invite':
          await this.handleTaskInvitation(message);
          break;
        case 'task:contribution':
          await this.handleTaskContribution(message);
          break;
        case 'task:completed':
          await this.handleTaskCompletion(message);
          break;
        case 'coordination:vote':
          await this.handleCoordinationVote(message);
          break;
        case 'coordination:consensus':
          await this.handleConsensusRequest(message);
          break;
        default:
          this.emit('message:unknown', message);
      }
      
      this.emit('message:received', message);
      
    } catch (error) {
      console.error('❌ Error handling message:', error);
      this.metrics.errors++;
      this.emit('error', error);
    }
  }

  /**
   * Network and connection management
   */
  async startNetworkServices() {
    if (!WebSocket) {
      throw new Error('WebSocket not available');
    }
    
    const { WebSocketServer } = await import('ws');
    
    this.server = new WebSocketServer({
      port: this.config.networking.port,
      host: this.config.networking.host
    });
    
    this.server.on('connection', (ws, request) => {
      this.handleNewConnection(ws, request);
    });
    
    this.server.on('error', (error) => {
      console.error('❌ A2A Server error:', error);
      this.emit('error', error);
    });
  }

  handleNewConnection(ws, request) {
    console.log('🔗 New agent connection established');
    
    this.connections.add(ws);
    this.metrics.agentsConnected++;
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleMessage(message, ws);
      } catch (error) {
        console.error('❌ Error parsing message:', error);
      }
    });
    
    ws.on('close', () => {
      this.connections.delete(ws);
      console.log('🔌 Agent connection closed');
    });
    
    ws.on('error', (error) => {
      console.error('❌ Connection error:', error);
      this.connections.delete(ws);
    });
    
    this.emit('connection:new', { connection: ws, request });
  }

  async transmitMessage(connection, message) {
    if (connection.readyState === WebSocket.OPEN) {
      const serialized = JSON.stringify(message);
      connection.send(serialized);
    }
  }

  /**
   * Message handlers
   */
  async handleAgentRegistration(message, connection) {
    const agentInfo = message.data;
    agentInfo.connection = connection;
    agentInfo.lastSeen = Date.now();
    
    this.agents.set(agentInfo.id, agentInfo);
    
    console.log(`📝 Agent registered: ${agentInfo.id} with capabilities: ${agentInfo.capabilities?.join(', ') || 'none'}`);
    this.emit('agent:connected', agentInfo);
  }

  async handleAgentDiscovery(message, connection) {
    // Respond with our agent information
    const response = {
      type: 'agent:discovery:response',
      agentId: this.agentId,
      capabilities: this.agents.get(this.agentId)?.capabilities || [],
      metadata: this.agents.get(this.agentId)?.metadata || {}
    };
    
    await this.transmitMessage(connection, response);
  }

  async handleTaskInvitation(message) {
    const { taskId, taskData, capabilities } = message.data;
    
    // Check if we can contribute to this task
    const ourCapabilities = this.agents.get(this.agentId)?.capabilities || [];
    const canContribute = capabilities.some(cap => ourCapabilities.includes(cap));
    
    if (canContribute) {
      this.emit('task:invitation', { taskId, taskData });
    }
  }

  async handleTaskContribution(message) {
    const { taskId, participation } = message.data;
    const task = this.tasks.get(taskId);
    
    if (task && task.createdBy === this.agentId) {
      task.participants.push(participation);
      task.results.push(participation.contribution);
      
      this.emit('task:contribution:received', { taskId, participation });
    }
  }

  async handleTaskCompletion(message) {
    const { taskId, finalResult } = message.data;
    this.emit('task:result', { taskId, finalResult });
  }

  async handleCoordinationVote(message) {
    // Handle voting coordination pattern
    this.emit('coordination:vote', message.data);
  }

  async handleConsensusRequest(message) {
    // Handle consensus building
    this.emit('coordination:consensus', message.data);
  }

  /**
   * Task coordination methods
   */
  async coordinateTask(task, suitableAgents) {
    const pattern = this.coordinationPatterns[task.coordinationPattern];
    if (!pattern) {
      throw new Error(`Unknown coordination pattern: ${task.coordinationPattern}`);
    }
    
    return await pattern.coordinate(task, suitableAgents, this);
  }

  async mergeTaskResults(task) {
    const pattern = this.coordinationPatterns[task.coordinationPattern];
    if (!pattern) {
      throw new Error(`Unknown coordination pattern: ${task.coordinationPattern}`);
    }
    
    return await pattern.mergeResults(task.results, this);
  }

  findSuitableAgents(requiredCapabilities) {
    const suitableAgents = [];
    
    for (const agent of this.agents.values()) {
      if (agent.id === this.agentId) continue;
      
      const hasRequiredCapabilities = requiredCapabilities.every(
        capability => agent.capabilities?.includes(capability)
      );
      
      if (hasRequiredCapabilities) {
        suitableAgents.push(agent);
      }
    }
    
    return suitableAgents;
  }

  /**
   * Utility methods
   */
  initializeValidator() {
    if (!Ajv) return null;
    
    const ajv = new Ajv();
    const messageSchema = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        type: { type: 'string' },
        from: { type: 'string' },
        to: { type: 'string' },
        data: { type: 'object' },
        timestamp: { type: 'number' }
      },
      required: ['id', 'type', 'from', 'to', 'timestamp']
    };
    
    return ajv.compile(messageSchema);
  }

  validateMessage(message) {
    if (!this.validator) {
      // Basic validation when Ajv is not available
      return message && 
             typeof message.id === 'string' &&
             typeof message.type === 'string' &&
             typeof message.from === 'string' &&
             typeof message.to === 'string' &&
             typeof message.timestamp === 'number';
    }
    return this.validator(message);
  }

  addToMessageHistory(message) {
    this.messageHistory.push(message);
    
    // Limit history size
    if (this.messageHistory.length > this.config.messaging.messageHistory) {
      this.messageHistory.shift();
    }
  }

  initializeCoordinationPatterns() {
    return {
      'peer-to-peer': {
        coordinate: async (task, agents, protocol) => {
          // Invite all suitable agents
          for (const agent of agents) {
            await protocol.sendMessage(agent.id, 'task:invite', {
              taskId: task.id,
              taskData: task,
              capabilities: task.requiredCapabilities
            });
          }
        },
        mergeResults: async (results, protocol) => {
          // Simple aggregation for peer-to-peer
          return {
            type: 'peer-to-peer-result',
            results,
            confidence: results.length > 0 ? 0.8 : 0.0,
            consensus: results.length
          };
        }
      },
      'consensus': {
        coordinate: async (task, agents, protocol) => {
          // Implement consensus-based coordination
          task.voting = {
            participants: agents.map(a => a.id),
            votes: new Map(),
            threshold: protocol.config.coordination.consensusThreshold
          };
        },
        mergeResults: async (results, protocol) => {
          // Consensus-based result merging
          return {
            type: 'consensus-result',
            results,
            confidence: 0.9,
            consensus: true
          };
        }
      },
      'hierarchical': {
        coordinate: async (task, agents, protocol) => {
          // Implement hierarchical coordination
          const coordinator = agents[0]; // Select coordinator
          task.coordinator = coordinator.id;
        },
        mergeResults: async (results, protocol) => {
          // Hierarchical result merging
          return {
            type: 'hierarchical-result',
            results,
            confidence: 0.85,
            coordinator: true
          };
        }
      }
    };
  }

  startDiscoveryService() {
    if (!cron) {
      console.warn('⚠️ Cron not available, using setTimeout for discovery');
      this.discoveryInterval = setInterval(() => {
        this.discoverAgents();
      }, this.config.discovery.broadcastInterval);
      return;
    }
    
    // Schedule discovery broadcasts
    cron.schedule('*/30 * * * * *', () => {
      if (this.isActive) {
        this.discoverAgents();
      }
    });
  }

  startMonitoring() {
    // Start basic monitoring
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.emit('metrics:updated', this.getMetrics());
    }, 10000);
  }

  startCleanupTasks() {
    // Clean up old tasks and expired agents
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredTasks();
      this.cleanupInactiveAgents();
    }, this.config.persistence?.cleanupInterval || 60000);
  }

  clearTimers() {
    if (this.discoveryInterval) clearInterval(this.discoveryInterval);
    if (this.monitoringInterval) clearInterval(this.monitoringInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
  }

  cleanupExpiredTasks() {
    const now = Date.now();
    const timeout = this.config.coordination.taskTimeoutMs;
    
    for (const [taskId, task] of this.tasks) {
      if (task.status === 'pending' && (now - task.createdAt) > timeout) {
        task.status = 'expired';
        this.emit('task:expired', task);
      }
    }
  }

  cleanupInactiveAgents() {
    const now = Date.now();
    const ttl = this.config.discovery.agentTtl;
    
    for (const [agentId, agent] of this.agents) {
      if (agentId !== this.agentId && (now - agent.lastSeen) > ttl) {
        this.agents.delete(agentId);
        this.emit('agent:expired', agent);
      }
    }
  }

  updateMetrics() {
    this.metrics.uptime = Date.now() - this.metrics.startTime;
    this.metrics.activeAgents = this.agents.size;
    this.metrics.activeTasks = Array.from(this.tasks.values()).filter(t => t.status === 'pending').length;
    this.metrics.activeConnections = this.connections.size;
  }

  /**
   * Configuration management
   */
  mergeDefaultConfig(userConfig) {
    const defaultConfig = {
      networking: {
        protocol: 'websocket',
        port: 9090,
        host: 'localhost',
        maxConnections: 100,
        timeoutMs: 30000
      },
      coordination: {
        defaultPattern: 'peer-to-peer',
        consensusThreshold: 0.6,
        taskTimeoutMs: 300000
      },
      discovery: {
        enabled: true,
        broadcastInterval: 30000,
        agentTtl: 120000
      },
      messaging: {
        validateSchema: true,
        messageHistory: 1000
      },
      monitoring: {
        enabled: true
      }
    };
    
    return this.deepMerge(defaultConfig, userConfig);
  }

  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Public API methods
   */
  getMetrics() {
    this.updateMetrics();
    return { ...this.metrics };
  }

  getAgents() {
    return Array.from(this.agents.values());
  }

  getTasks() {
    return Array.from(this.tasks.values());
  }

  getStatus() {
    return this.httpServer.getStatus();
  }
}