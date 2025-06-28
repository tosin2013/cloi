/**
 * Universal AI Client for A2A Protocol
 * 
 * This is the universal interface that ANY AI system can use to connect
 * and collaborate with Cloi through the A2A protocol. Supports:
 * 
 * - Claude Code, GitHub Copilot, Cursor, Local LLMs, Custom AIs
 * - Both Layer 1 (real-time collaboration) and Layer 2 (ecosystem evolution)
 * - Dynamic capability registration and discovery
 * - Standard protocol for all AI systems
 */

import { EventEmitter } from 'events';

// Dynamic imports for optional dependencies
let WebSocket = null;

try {
  const ws = await import('ws');
  WebSocket = ws.WebSocket;
} catch (error) {
  console.warn('⚠️ WebSocket not available. Limited functionality.');
}

export default class UniversalAIClient extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      connection: {
        host: 'localhost',
        port: 9090,
        reconnectAttempts: 3,
        reconnectDelay: 5000,
        timeout: 30000,
        ...config.connection
      },
      ai: {
        id: config.ai?.id || `ai-${Date.now()}`,
        type: config.ai?.type || 'generic-ai',
        name: config.ai?.name || 'Universal AI',
        version: config.ai?.version || '1.0.0',
        capabilities: config.ai?.capabilities || [],
        specializations: config.ai?.specializations || [],
        ...config.ai
      },
      layers: {
        collaboration: config.layers?.collaboration ?? true,  // Layer 1
        ecosystem: config.layers?.ecosystem ?? false,         // Layer 2
        ...config.layers
      }
    };
    
    this.ws = null;
    this.isConnected = false;
    this.messageQueue = [];
    this.pendingRequests = new Map();
    this.activeCollaborations = new Map();
    this.cloiContext = null;
    
    console.log(`🤖 ${this.config.ai.name} initialized for A2A collaboration`);
  }

  /**
   * Connect to Cloi's A2A network
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        if (!WebSocket) {
          throw new Error('WebSocket not available');
        }

        const url = `ws://${this.config.connection.host}:${this.config.connection.port}`;
        console.log(`🔗 ${this.config.ai.name} connecting to Cloi at ${url}...`);
        
        this.ws = new WebSocket(url);
        
        this.ws.on('open', async () => {
          console.log(`✅ ${this.config.ai.name} connected to Cloi A2A network`);
          this.isConnected = true;
          
          // Register with Cloi
          await this.registerWithCloi();
          
          // Process queued messages
          this.processMessageQueue();
          
          this.emit('connected');
          resolve();
        });
        
        this.ws.on('message', (data) => {
          this.handleMessage(JSON.parse(data.toString()));
        });
        
        this.ws.on('close', () => {
          console.log(`🔌 ${this.config.ai.name} disconnected from Cloi`);
          this.isConnected = false;
          this.emit('disconnected');
          
          if (this.config.connection.reconnectAttempts > 0) {
            this.attemptReconnection();
          }
        });
        
        this.ws.on('error', (error) => {
          console.error('❌ A2A Connection error:', error);
          this.emit('error', error);
          reject(error);
        });
        
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection timeout'));
          }
        }, this.config.connection.timeout);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Register this AI with Cloi's A2A network
   */
  async registerWithCloi() {
    const registrationData = {
      id: this.config.ai.id,
      type: this.config.ai.type,
      name: this.config.ai.name,
      version: this.config.ai.version,
      capabilities: this.config.ai.capabilities,
      specializations: this.config.ai.specializations,
      layers: {
        collaboration: this.config.layers.collaboration,
        ecosystem: this.config.layers.ecosystem
      },
      metadata: {
        description: this.config.ai.description || `${this.config.ai.name} AI assistant`,
        features: this.config.ai.features || [],
        supportedLanguages: this.config.ai.supportedLanguages || [],
        maxConcurrentTasks: this.config.ai.maxConcurrentTasks || 5,
        responseTimeMs: this.config.ai.responseTimeMs || 1000
      },
      status: 'active',
      lastSeen: Date.now()
    };
    
    const response = await this.sendMessage('agent:register', registrationData);
    
    if (response && response.cloiContext) {
      this.cloiContext = response.cloiContext;
      console.log(`📊 Received Cloi context: ${Object.keys(this.cloiContext).join(', ')}`);
    }
    
    this.emit('registered', registrationData);
    return response;
  }

  /**
   * LAYER 1: Real-time Collaboration Methods
   */

  /**
   * Request real-time collaboration with Cloi
   */
  async collaborateRealTime(request) {
    console.log(`🤝 ${this.config.ai.name} requesting real-time collaboration: ${request.type}`);
    
    const collaborationId = `rt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const collaboration = {
      id: collaborationId,
      layer: 1, // Real-time collaboration
      type: request.type,
      context: request.context,
      aiAgent: this.config.ai.id,
      startTime: Date.now(),
      status: 'active'
    };
    
    this.activeCollaborations.set(collaborationId, collaboration);
    
    const response = await this.sendMessage('collaboration:realtime', {
      collaborationId,
      request
    });
    
    this.emit('collaboration:started', collaboration, response);
    return { collaborationId, response };
  }

  /**
   * Get comprehensive project understanding from Cloi
   */
  async understandProject(depth = 'comprehensive') {
    const { response } = await this.collaborateRealTime({
      type: 'project-understanding',
      context: {
        depth, // 'quick', 'standard', 'comprehensive', 'deep'
        includeHistory: true,
        includeContext: true,
        includeTools: true
      }
    });
    
    return response.projectUnderstanding;
  }

  /**
   * Collaborate on solving a specific problem
   */
  async solveProblem(problem, context = {}) {
    const { response } = await this.collaborateRealTime({
      type: 'problem-solving',
      context: {
        problem,
        ...context,
        aiCapabilities: this.config.ai.capabilities,
        preferredApproach: context.preferredApproach || 'collaborative'
      }
    });
    
    return response.solution;
  }

  /**
   * Request Cloi to execute specific tools
   */
  async useCloiTools(toolRequests) {
    const { response } = await this.collaborateRealTime({
      type: 'tool-execution',
      context: {
        tools: toolRequests,
        executeInSequence: true,
        returnResults: true
      }
    });
    
    return response.toolResults;
  }

  /**
   * Get real-time code context and analysis
   */
  async getCodeContext(files, analysisType = 'comprehensive') {
    const { response } = await this.collaborateRealTime({
      type: 'code-context',
      context: {
        files,
        analysisType,
        includeRelated: true,
        includeDependencies: true
      }
    });
    
    return response.codeContext;
  }

  /**
   * LAYER 2: Ecosystem Evolution Methods
   */

  /**
   * Request ecosystem evolution (plugin development, etc.)
   */
  async evolveEcosystem(request) {
    if (!this.config.layers.ecosystem) {
      throw new Error('Ecosystem layer not enabled for this AI');
    }
    
    console.log(`🔧 ${this.config.ai.name} requesting ecosystem evolution: ${request.type}`);
    
    const evolutionId = `evo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const evolution = {
      id: evolutionId,
      layer: 2, // Ecosystem evolution
      type: request.type,
      specification: request.specification,
      aiAgent: this.config.ai.id,
      startTime: Date.now(),
      status: 'active'
    };
    
    this.activeCollaborations.set(evolutionId, evolution);
    
    const response = await this.sendMessage('ecosystem:evolution', {
      evolutionId,
      request
    });
    
    this.emit('evolution:started', evolution, response);
    return { evolutionId, response };
  }

  /**
   * Analyze gaps in Cloi's capabilities and suggest improvements
   */
  async analyzeCapabilityGaps() {
    const { response } = await this.evolveEcosystem({
      type: 'capability-analysis',
      specification: {
        analyzeCurrentPlugins: true,
        identifyMissingFeatures: true,
        suggestImprovements: true,
        prioritizeByImpact: true
      }
    });
    
    return response.analysis;
  }

  /**
   * Generate and contribute a new plugin to Cloi
   */
  async contributePlugin(pluginSpec) {
    const { response } = await this.evolveEcosystem({
      type: 'plugin-contribution',
      specification: {
        ...pluginSpec,
        generateTests: true,
        generateDocs: true,
        validateCompatibility: true,
        submitPR: pluginSpec.submitPR || false
      }
    });
    
    return response.contribution;
  }

  /**
   * Suggest and implement workflow improvements
   */
  async improveWorkflows(workflowSpec) {
    const { response } = await this.evolveEcosystem({
      type: 'workflow-improvement',
      specification: {
        ...workflowSpec,
        analyzeCurrentWorkflows: true,
        identifyBottlenecks: true,
        proposeOptimizations: true
      }
    });
    
    return response.improvements;
  }

  /**
   * Universal Workflows for Any AI System
   */

  /**
   * Complete problem-solving workflow (Layer 1 + Layer 2)
   */
  async solveComprehensively(problem, options = {}) {
    console.log(`🎯 ${this.config.ai.name} starting comprehensive problem solving`);
    
    // Phase 1: Understand the environment (Layer 1)
    const understanding = await this.understandProject('comprehensive');
    
    // Phase 2: Analyze the specific problem (Layer 1)
    const analysis = await this.solveProblem(problem, {
      projectContext: understanding,
      depth: 'thorough'
    });
    
    // Phase 3: Check if we need to evolve the ecosystem (Layer 2)
    if (this.config.layers.ecosystem && analysis.requiresNewCapabilities) {
      console.log('🔧 Problem requires ecosystem evolution...');
      
      const gaps = await this.analyzeCapabilityGaps();
      
      if (gaps.recommendedPlugins && gaps.recommendedPlugins.length > 0) {
        for (const pluginSpec of gaps.recommendedPlugins) {
          if (options.autoContribute) {
            await this.contributePlugin(pluginSpec);
          }
        }
      }
    }
    
    return {
      understanding,
      analysis,
      evolutionSuggestions: this.config.layers.ecosystem ? await this.analyzeCapabilityGaps() : null
    };
  }

  /**
   * Continuous learning and improvement loop
   */
  async startLearningLoop(interval = 3600000) { // 1 hour default
    if (!this.config.layers.ecosystem) {
      console.warn('Learning loop requires ecosystem layer to be enabled');
      return;
    }
    
    console.log(`📚 ${this.config.ai.name} starting continuous learning loop`);
    
    const learn = async () => {
      try {
        // Analyze current state
        const gaps = await this.analyzeCapabilityGaps();
        
        // Suggest improvements
        if (gaps.highPriorityGaps && gaps.highPriorityGaps.length > 0) {
          this.emit('learning:gaps-identified', gaps);
          
          // Auto-contribute if configured
          if (this.config.ai.autoContribute) {
            for (const gap of gaps.highPriorityGaps) {
              await this.contributePlugin(gap.suggestedPlugin);
            }
          }
        }
        
        this.emit('learning:cycle-complete', gaps);
      } catch (error) {
        console.error('❌ Learning loop error:', error);
        this.emit('learning:error', error);
      }
    };
    
    // Initial learning cycle
    await learn();
    
    // Set up recurring learning
    const learningInterval = setInterval(learn, interval);
    
    this.emit('learning:started', { interval });
    
    return () => {
      clearInterval(learningInterval);
      this.emit('learning:stopped');
    };
  }

  /**
   * Message handling and protocol methods
   */
  async sendMessage(type, data) {
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      from: this.config.ai.id,
      to: 'cloi-agent',
      data,
      timestamp: Date.now(),
      layer: type.startsWith('ecosystem:') ? 2 : 1
    };
    
    if (!this.isConnected) {
      this.messageQueue.push(message);
      return null;
    }
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(message.id, { resolve, reject });
      
      this.ws.send(JSON.stringify(message));
      
      setTimeout(() => {
        if (this.pendingRequests.has(message.id)) {
          this.pendingRequests.delete(message.id);
          reject(new Error(`Message timeout: ${type}`));
        }
      }, this.config.connection.timeout);
    });
  }

  handleMessage(message) {
    // Handle responses to our requests
    if (this.pendingRequests.has(message.id)) {
      const pending = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);
      pending.resolve(message.data);
      return;
    }
    
    // Handle different message types
    switch (message.type) {
      case 'collaboration:invitation':
        this.emit('collaboration:invited', message.data);
        break;
      case 'task:assignment':
        this.emit('task:assigned', message.data);
        break;
      case 'ecosystem:update':
        this.emit('ecosystem:updated', message.data);
        break;
      case 'cloi:context-update':
        this.cloiContext = { ...this.cloiContext, ...message.data };
        this.emit('context:updated', this.cloiContext);
        break;
      default:
        this.emit('message:received', message);
    }
  }

  processMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      this.ws.send(JSON.stringify(message));
    }
  }

  attemptReconnection() {
    let attempts = 0;
    const maxAttempts = this.config.connection.reconnectAttempts;
    const delay = this.config.connection.reconnectDelay;
    
    const reconnect = () => {
      if (attempts >= maxAttempts) {
        console.error(`❌ ${this.config.ai.name}: Max reconnection attempts reached`);
        this.emit('reconnection:failed');
        return;
      }
      
      attempts++;
      console.log(`🔄 ${this.config.ai.name}: Reconnection attempt ${attempts}/${maxAttempts}...`);
      
      this.connect().catch(() => {
        setTimeout(reconnect, delay);
      });
    };
    
    setTimeout(reconnect, delay);
  }

  /**
   * Disconnect from Cloi
   */
  async disconnect() {
    if (this.ws && this.isConnected) {
      // End active collaborations
      for (const [id, collaboration] of this.activeCollaborations) {
        collaboration.status = 'ended';
        collaboration.endTime = Date.now();
      }
      
      this.ws.close();
      this.isConnected = false;
      console.log(`👋 ${this.config.ai.name} disconnected from Cloi`);
    }
  }

  /**
   * Public API
   */
  getStatus() {
    return {
      connected: this.isConnected,
      ai: this.config.ai,
      layers: this.config.layers,
      collaborations: this.activeCollaborations.size,
      pendingRequests: this.pendingRequests.size,
      messageQueue: this.messageQueue.length,
      cloiContext: this.cloiContext ? Object.keys(this.cloiContext) : null
    };
  }

  getActiveCollaborations() {
    return Array.from(this.activeCollaborations.values());
  }

  getCloiContext() {
    return this.cloiContext;
  }
}

/**
 * Factory functions for specific AI systems
 */

export function createClaudeCodeClient(options = {}) {
  return new UniversalAIClient({
    ai: {
      id: 'claude-code',
      type: 'code-assistant',
      name: 'Claude Code',
      version: '1.0.0',
      capabilities: [
        'code-generation',
        'code-analysis',
        'refactoring',
        'debugging',
        'explanation',
        'documentation',
        'testing',
        'optimization'
      ],
      specializations: ['multi-language', 'context-aware', 'best-practices'],
      supportedLanguages: ['javascript', 'python', 'typescript', 'java', 'go', 'rust'],
      ...options.ai
    },
    layers: {
      collaboration: true,
      ecosystem: true, // Claude Code can contribute to ecosystem
      ...options.layers
    },
    ...options
  });
}

export function createCopilotClient(options = {}) {
  return new UniversalAIClient({
    ai: {
      id: 'github-copilot',
      type: 'code-completion',
      name: 'GitHub Copilot',
      capabilities: [
        'code-completion',
        'code-generation',
        'pattern-recognition',
        'context-inference'
      ],
      specializations: ['code-completion', 'pattern-matching'],
      ...options.ai
    },
    layers: {
      collaboration: true,
      ecosystem: false, // Copilot focuses on collaboration
      ...options.layers
    },
    ...options
  });
}

export function createLocalLLMClient(modelName, options = {}) {
  return new UniversalAIClient({
    ai: {
      id: `local-${modelName.toLowerCase()}`,
      type: 'local-llm',
      name: `Local ${modelName}`,
      capabilities: options.capabilities || [
        'text-generation',
        'analysis',
        'reasoning'
      ],
      specializations: options.specializations || ['local-processing', 'privacy-focused'],
      ...options.ai
    },
    layers: {
      collaboration: true,
      ecosystem: options.ecosystem || false,
      ...options.layers
    },
    ...options
  });
}

export function createCustomAIClient(aiConfig, options = {}) {
  return new UniversalAIClient({
    ai: aiConfig,
    ...options
  });
}

/**
 * Multi-AI orchestration
 */
export class AIOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.connectedAIs = new Map();
    this.orchestrationRules = new Map();
  }

  async connectAI(aiClient) {
    await aiClient.connect();
    this.connectedAIs.set(aiClient.config.ai.id, aiClient);
    
    // Set up inter-AI communication
    aiClient.on('collaboration:needed', (request) => {
      this.routeToOptimalAI(request);
    });
    
    this.emit('ai:connected', aiClient.config.ai);
  }

  routeToOptimalAI(request) {
    // Find the best AI for the task based on capabilities
    const suitable = Array.from(this.connectedAIs.values())
      .filter(ai => this.canHandleRequest(ai, request))
      .sort((a, b) => this.scoreAIForRequest(b, request) - this.scoreAIForRequest(a, request));
    
    if (suitable.length > 0) {
      const bestAI = suitable[0];
      this.emit('request:routed', { request, ai: bestAI.config.ai.id });
      return bestAI;
    }
    
    return null;
  }

  canHandleRequest(ai, request) {
    return request.requiredCapabilities.some(cap => 
      ai.config.ai.capabilities.includes(cap)
    );
  }

  scoreAIForRequest(ai, request) {
    // Simple scoring based on capability overlap
    const overlap = request.requiredCapabilities.filter(cap =>
      ai.config.ai.capabilities.includes(cap)
    ).length;
    
    return overlap / request.requiredCapabilities.length;
  }
}