# ADR-007: LLM Provider Router Architecture

**Status:** Accepted  
**Date:** 2024-01-XX  
**Authors:** Development Team  
**Reviewers:** Architecture Team, AI/ML Specialists  
**Domain Impact:** AI/LLM Integration Domain (Primary), Error Analysis Domain (Secondary), CLI Domain (Secondary)

## Context and Problem Statement

The CLOI system requires sophisticated AI model integration to provide intelligent error analysis and fix generation across multiple LLM providers (Ollama, Claude, OpenAI, etc.). Without a coherent **AI/LLM Integration Domain**, CLOI cannot effectively route requests to appropriate models, manage different provider APIs, or provide consistent AI-powered responses regardless of the underlying model infrastructure.

**EVOLUTION: Self-Implementing Code Generation**

Building on ADR-036 (ADR-Driven Testing Architecture), the LLM Provider Router must evolve beyond error analysis to support **autonomous feature implementation** through AI-powered code generation. The router must:

1. **Generate implementation code** based on ADR specifications and architectural patterns
2. **Apply context-aware code generation** using comprehensive codebase understanding
3. **Validate generated code** against architectural constraints and quality standards
4. **Coordinate with workflow engine** for complex multi-step implementation processes
5. **Learn from implementation patterns** to improve code generation quality over time

This enables CLOI to autonomously implement its own features while maintaining consistency with existing architectural patterns and code quality standards.

### Domain-Driven Design Context

**Primary Bounded Context:** AI/LLM Integration and Model Management Domain (Enhanced for Code Generation)  
**Secondary Contexts:** Error Analysis (AI-enhanced analysis), CLI Domain (AI command integration), Workflow Management (Implementation Orchestration)  
**Aggregate Root:** LLM Provider Router (Enhanced)  
**Domain Language:** Model Selection, Provider Routing, Code Generation, Pattern Recognition, Implementation Context, Quality Validation, Response Processing, Model Capabilities, Provider Abstraction  
**Domain Events:** Model Selected, Provider Routed, Code Generated, Pattern Applied, Implementation Validated, Request Sent, Response Received, Fallback Triggered, Model Performance Assessed

### Problem Manifestation

1. **Fragmented Provider Integration:**
   ```javascript
   // Before: Scattered provider handling
   if (modelName.includes('claude')) {
     return await claudeProvider.analyze(prompt);
   } else if (modelName.includes('ollama')) {
     return await ollamaProvider.analyze(prompt);
   } else {
     throw new Error('Unknown provider');
   }
   ```

2. **Inconsistent Provider Interfaces:**
   - Different API patterns for each LLM provider
   - Varying request/response formats and error handling
   - No standardized model capability discovery
   - Inconsistent authentication and configuration management

3. **Missing Domain Intelligence:**
   - No intelligent model selection based on request context
   - Lack of provider performance monitoring and optimization
   - No fallback strategies for provider failures
   - Missing cost and usage optimization logic

4. **Poor Extensibility:**
   - Adding new providers requires changes throughout the codebase
   - No plugin architecture for third-party model integrations
   - Difficult to A/B test different models for specific use cases
   - No standardized provider configuration management

## Decision Drivers

### Domain Requirements

1. **Provider Abstraction:** Must abstract differences between LLM providers behind unified interface
2. **Intelligent Routing:** Must route requests to optimal models based on capabilities and context
3. **Reliability:** Must provide fallback mechanisms and error recovery strategies
4. **Performance:** Must optimize for cost, speed, and quality across different providers

### Technical Constraints

1. **API Compatibility:** Must support diverse provider APIs (REST, gRPC, local models)
2. **Authentication:** Must handle different authentication mechanisms securely
3. **Rate Limiting:** Must respect provider-specific rate limits and quotas
4. **Latency Requirements:** Must maintain acceptable response times across providers

### Extensibility Requirements

1. **Provider Plugins:** Must support easy addition of new LLM providers
2. **Model Discovery:** Must automatically discover available models and capabilities
3. **Configuration Management:** Must provide flexible provider configuration
4. **Monitoring Integration:** Must provide comprehensive metrics and observability

## Considered Options

### Option 1: Direct Provider Integration
**Domain Impact:** Simple but creates tight coupling and poor extensibility
**Pros:**
- Direct control over provider interactions
- Minimal abstraction overhead
- Easy debugging of provider-specific issues
**Cons:**
- Tight coupling between business logic and provider APIs
- Difficult to add new providers
- No standardized error handling or fallback
- Provider-specific code scattered throughout system

### Option 2: Simple Provider Factory Pattern
**Domain Impact:** Basic abstraction but limited intelligence and capabilities
**Pros:**
- Basic provider abstraction
- Easier to add new providers
- Centralized provider instantiation
**Cons:**
- No intelligent routing capabilities
- Limited error handling and fallback
- No performance optimization or monitoring
- Manual provider selection

### Option 3: Intelligent Provider Router with Domain Architecture (CHOSEN)
**Domain Impact:** Creates robust AI/LLM domain with intelligent routing and extensibility
**Pros:**
- Complete provider abstraction with intelligent routing
- Automatic model selection based on capabilities and context
- Comprehensive fallback and error recovery strategies
- Extensible plugin architecture for new providers
- Domain-driven design with clear boundaries
**Cons:**
- More complex implementation and configuration
- Potential routing overhead for simple requests
- Need for comprehensive provider capability modeling

## Decision Outcome

### Chosen Solution

Implement an **Intelligent LLM Provider Router** with domain-driven architecture that provides unified access to multiple LLM providers through intelligent routing, capability matching, and comprehensive error handling.

```javascript
// AI/LLM Integration Domain Architecture
class LLMProviderRouter {
  constructor() {
    this.providerRegistry = new ProviderRegistry();
    this.capabilityMatcher = new CapabilityMatcher();
    this.routingStrategy = new IntelligentRoutingStrategy();
    this.fallbackManager = new FallbackManager();
    this.performanceMonitor = new ProviderPerformanceMonitor();
    this.requestOptimizer = new RequestOptimizer();
  }

  async processRequest(request) {
    // 1. Analyze request requirements
    const requirements = await this.analyzeRequestRequirements(request);
    
    // 2. Select optimal provider and model
    const provider = await this.selectOptimalProvider(requirements);
    
    // 3. Optimize request for selected provider
    const optimizedRequest = await this.requestOptimizer.optimize(request, provider);
    
    // 4. Execute with fallback handling
    return await this.executeWithFallback(optimizedRequest, provider, requirements);
  }

  async selectOptimalProvider(requirements) {
    // Get available providers that meet requirements
    const candidates = await this.capabilityMatcher.findCapableProviders(requirements);
    
    // Apply routing strategy (performance, cost, availability)
    const selectedProvider = await this.routingStrategy.select(candidates, requirements);
    
    // Update provider selection metrics
    this.performanceMonitor.recordSelection(selectedProvider, requirements);
    
    return selectedProvider;
  }

  async executeWithFallback(request, primaryProvider, requirements) {
    try {
      const response = await primaryProvider.execute(request);
      this.performanceMonitor.recordSuccess(primaryProvider, response);
      return response;
    } catch (error) {
      return await this.fallbackManager.handleFailure(
        error, 
        request, 
        primaryProvider, 
        requirements
      );
    }
  }
}

// Provider Abstraction Interface
class LLMProvider {
  constructor(config) {
    this.config = config;
    this.capabilities = new ProviderCapabilities();
    this.rateLimiter = new RateLimiter(config.limits);
    this.authenticator = new ProviderAuthenticator(config.auth);
  }

  async execute(request) {
    // 1. Validate request against capabilities
    await this.validateRequest(request);
    
    // 2. Apply rate limiting
    await this.rateLimiter.checkLimit();
    
    // 3. Authenticate and execute
    const authToken = await this.authenticator.getToken();
    const response = await this.sendRequest(request, authToken);
    
    // 4. Process and normalize response
    return this.normalizeResponse(response);
  }

  abstract async sendRequest(request, authToken);
  abstract normalizeResponse(response);
  abstract getCapabilities();
}

// Specific Provider Implementations
class OllamaProvider extends LLMProvider {
  getCapabilities() {
    return new ProviderCapabilities({
      modelTypes: ['code-analysis', 'text-generation', 'chat'],
      maxTokens: 8192,
      supportsBatching: false,
      supportsStreaming: true,
      cost: 'free',
      latency: 'medium',
      availability: 'local'
    });
  }

  async sendRequest(request, authToken) {
    // Ollama-specific API implementation
  }
}

class ClaudeProvider extends LLMProvider {
  getCapabilities() {
    return new ProviderCapabilities({
      modelTypes: ['advanced-reasoning', 'code-analysis', 'text-generation'],
      maxTokens: 200000,
      supportsBatching: true,
      supportsStreaming: true,
      cost: 'paid',
      latency: 'low',
      availability: 'cloud'
    });
  }

  async sendRequest(request, authToken) {
    // Claude API implementation
  }
}

// Intelligent Routing Strategies
class RoutingStrategy {
  async select(providers, requirements) {
    return this.applyRoutingLogic(providers, requirements);
  }

  abstract applyRoutingLogic(providers, requirements);
}

class CostOptimizedRouting extends RoutingStrategy {
  applyRoutingLogic(providers, requirements) {
    return providers
      .filter(p => p.capabilities.meetRequirements(requirements))
      .sort((a, b) => a.capabilities.cost - b.capabilities.cost)[0];
  }
}

class PerformanceOptimizedRouting extends RoutingStrategy {
  applyRoutingLogic(providers, requirements) {
    return providers
      .filter(p => p.capabilities.meetRequirements(requirements))
      .sort((a, b) => a.performanceScore - b.performanceScore)[0];
  }
}
```

### Domain-Driven Reasoning

1. **Provider Domain Encapsulation:** Each provider encapsulates domain knowledge about specific LLM capabilities and behaviors
2. **Intelligent Routing Logic:** Router embodies domain expertise about model selection and optimization
3. **Capability-Based Selection:** Domain language focuses on model capabilities rather than implementation details
4. **Extensible Provider Architecture:** Clear domain boundaries enable easy addition of new providers

## Consequences

### Positive Domain Outcomes

1. **Unified LLM Access:**
   - Single interface for all LLM providers regardless of underlying implementation
   - Consistent request/response format across different models
   - Standardized error handling and recovery mechanisms
   - Unified authentication and configuration management

2. **Intelligent Model Selection:**
   - Automatic selection of optimal models based on request characteristics
   - Capability-based routing considering model strengths and limitations
   - Cost and performance optimization across different providers
   - Context-aware model selection for specific use cases

3. **Enhanced Reliability:**
   - Comprehensive fallback strategies for provider failures
   - Automatic retry logic with exponential backoff
   - Circuit breaker patterns for unhealthy providers
   - Graceful degradation when primary providers are unavailable

4. **Extensible Architecture:**
   - Plugin-based architecture for adding new LLM providers
   - Configurable routing strategies for different optimization goals
   - Standardized provider interface for consistent integration
   - Easy A/B testing and model comparison capabilities

### Domain Risks and Mitigations

1. **Routing Complexity Risk:**
   - **Risk:** Complex routing logic affecting request latency and maintainability
   - **Mitigation:** Configurable routing strategies with performance monitoring
   - **Optimization:** Caching of routing decisions and provider capabilities

2. **Provider Lock-in Risk:**
   - **Risk:** Over-optimization for specific providers affecting portability
   - **Mitigation:** Provider-agnostic capability modeling and standardized interfaces
   - **Monitoring:** Regular assessment of provider dependencies and alternatives

3. **Configuration Complexity Risk:**
   - **Risk:** Complex provider configuration affecting usability
   - **Mitigation:** Sensible defaults with progressive configuration options
   - **Documentation:** Comprehensive configuration guides and examples

4. **Performance Overhead Risk:**
   - **Risk:** Router overhead affecting overall system performance
   - **Mitigation:** Optimized routing algorithms with result caching
   - **Measurement:** Performance benchmarks and latency monitoring

### Implementation Impact

1. **New Domain Components:**
   - LLM Provider Router with intelligent routing capabilities
   - Provider Registry for dynamic provider discovery and management
   - Capability Matcher for requirement-based provider selection
   - Fallback Manager for error recovery and provider failover
   - Performance Monitor for provider optimization and metrics

2. **Provider Integration Framework:**
   ```javascript
   // Provider Configuration Schema
   {
     providers: {
       ollama: {
         type: 'ollama',
         endpoint: 'http://localhost:11434',
         models: ['llama2', 'codellama', 'mistral'],
         capabilities: {
           maxTokens: 8192,
           supportedTypes: ['code-analysis', 'chat']
         }
       },
       claude: {
         type: 'claude',
         apiKey: '${ANTHROPIC_API_KEY}',
         models: ['claude-3-sonnet', 'claude-3-haiku'],
         capabilities: {
           maxTokens: 200000,
           supportedTypes: ['advanced-reasoning', 'code-analysis']
         }
       }
     },
     routing: {
       strategy: 'performance-optimized',
       fallbackChain: ['claude', 'ollama'],
       maxRetries: 3
     }
   }
   ```

3. **Integration Points:**
   - Error Analysis Domain: AI-enhanced error classification and fix generation
   - CLI Domain: Model selection and AI command processing
   - Configuration Domain: Provider configuration and routing preferences
   - A2A Protocol Domain: AI service exposure through standardized interfaces

## Compliance with Domain Principles

### Ubiquitous Language ✅
- Clear vocabulary for providers, models, capabilities, and routing concepts
- Consistent terminology across all AI/LLM integration operations
- Domain-specific language for model selection and optimization

### Bounded Context Integrity ✅
- AI/LLM Integration Domain has clear boundaries and responsibilities
- Provider-specific logic encapsulated within domain boundaries
- Controlled integration with other domains through standardized interfaces

### Aggregate Design ✅
- LLM Provider Router serves as aggregate root for all AI interactions
- Maintains consistency for provider selection and request routing
- Encapsulates routing logic and provider state management

### Domain Service Collaboration ✅
- Clean integration with Error Analysis Domain for AI-enhanced analysis
- Standardized interfaces for CLI and A2A Protocol domain interactions
- Event-driven communication for routing decisions and performance metrics

## Related Decisions

- **Depends On:**
  - ADR-001: CLI Unification Strategy (AI command integration)
  - ADR-004: Error Classification System Architecture (AI-enhanced analysis)
- **Influences:**
  - ADR-008: Prompt Template Management System (prompt optimization for providers)
  - ADR-009: Model Selection and Routing Strategy (detailed routing implementation)
  - ADR-018: AI Response Quality Assessment (response evaluation framework)
- **Related:**
  - ADR-002: A2A Protocol Integration Architecture (AI service exposure)
  - ADR-013: Configuration Hierarchy and Precedence (provider configuration)

## Verification Criteria

### Functional Verification
- [ ] All supported providers can be accessed through unified interface
- [ ] Intelligent routing selects appropriate models based on request characteristics
- [ ] Fallback mechanisms work correctly when primary providers fail
- [ ] Provider capabilities are accurately modeled and matched
- [ ] Authentication and rate limiting work correctly for all providers

### Domain Verification
- [ ] AI/LLM Integration Domain maintains clear boundaries
- [ ] Provider abstraction follows domain-driven principles
- [ ] Routing logic embodies domain expertise about model capabilities
- [ ] Domain events are properly triggered and handled
- [ ] Integration with other domains follows established patterns

### Performance Verification
- [ ] Routing decisions complete within acceptable time limits (<100ms)
- [ ] Provider selection does not significantly impact request latency
- [ ] Fallback mechanisms activate within reasonable timeframes
- [ ] Memory usage remains bounded under concurrent requests
- [ ] Provider performance monitoring provides accurate metrics

### Quality Verification
- [ ] Model selection accuracy meets requirements for different use cases
- [ ] Fallback strategies maintain service availability during provider outages
- [ ] Error handling provides meaningful diagnostics for troubleshooting
- [ ] Configuration validation prevents invalid provider setups
- [ ] A/B testing capabilities enable model comparison and optimization

### Integration Verification
- [ ] Error Analysis Domain can leverage AI capabilities seamlessly
- [ ] CLI commands can specify model preferences and routing options
- [ ] A2A Protocol can expose AI capabilities to external agents
- [ ] Configuration management supports dynamic provider updates
- [ ] Monitoring integration provides comprehensive observability

## Future Considerations

1. **Advanced Routing Algorithms:** Machine learning-based routing optimization
2. **Model Fine-tuning Integration:** Support for custom model training and deployment
3. **Multi-modal Support:** Integration with vision, audio, and other non-text models
4. **Federated Learning:** Distributed model training across multiple providers
5. **Cost Optimization:** Advanced cost modeling and budget-aware routing
6. **Real-time Model Switching:** Dynamic model selection based on real-time performance
7. **Provider Marketplace:** Community-driven provider ecosystem and discovery

---

**Domain Maturity:** Evolving (core domain with significant innovation potential)  
**Review Date:** 2024-03-XX  
**Impact Assessment:** Critical (enables intelligent AI integration across entire system) 