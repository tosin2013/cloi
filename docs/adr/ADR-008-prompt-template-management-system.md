# ADR-008: Prompt Template Management System

**Status:** Accepted  
**Date:** 2024-01-XX  
**Authors:** Development Team  
**Reviewers:** Architecture Team, AI/ML Specialists, UX Team  
**Domain Impact:** AI/LLM Integration Domain (Primary), Error Analysis Domain (Secondary), CLI Domain (Secondary)

## Context and Problem Statement

The CLOI system requires sophisticated prompt template management to optimize AI interactions across different error types, LLM providers, and analysis contexts. Without a coherent **Prompt Template Management System**, CLOI cannot leverage the full potential of AI models, provide consistent prompt quality, or adapt prompts for optimal results across different providers and use cases.

### Domain-Driven Design Context

**Primary Bounded Context:** AI/LLM Integration and Prompt Optimization Domain  
**Secondary Contexts:** Error Analysis (context-aware prompts), CLI Domain (user-facing prompt customization)  
**Aggregate Root:** Prompt Template Manager  
**Domain Language:** Prompt Templates, Template Variables, Context Injection, Prompt Optimization, Template Versioning, Provider Adaptation, Response Quality  
**Domain Events:** Template Selected, Context Injected, Prompt Generated, Template Optimized, Quality Assessed, Template Updated

### Problem Manifestation

1. **Hardcoded Prompt Strings:**
   ```javascript
   // Before: Static, inflexible prompts
   const analysisPrompt = `
   Analyze this error and provide a fix:
   Error: ${error.message}
   Stack: ${error.stack}
   Please provide a solution.
   `;
   
   // No context awareness, provider optimization, or template management
   ```

2. **Inconsistent Prompt Quality:**
   - No standardized prompt structure across different analysis types
   - Missing context injection and dynamic prompt adaptation
   - Lack of provider-specific prompt optimization
   - No prompt versioning or A/B testing capabilities

3. **Missing Domain Intelligence:**
   - No intelligent template selection based on error characteristics
   - Lack of prompt optimization based on AI response quality
   - No template library management or community contributions
   - Missing prompt analytics and continuous improvement

4. **Poor Extensibility:**
   - Difficult to add new prompt templates for specific use cases
   - No template inheritance or composition patterns
   - Limited customization options for different user preferences
   - No integration with external prompt optimization tools

## Decision Drivers

### Domain Requirements

1. **Template Management:** Must provide comprehensive template lifecycle management
2. **Context Injection:** Must intelligently inject relevant context into prompts
3. **Provider Optimization:** Must optimize prompts for different LLM providers
4. **Quality Optimization:** Must continuously improve prompt effectiveness

### Technical Constraints

1. **Token Efficiency:** Must manage token usage across different model contexts
2. **Performance:** Must generate optimized prompts efficiently without latency
3. **Scalability:** Must handle large template libraries and high prompt generation volume
4. **Compatibility:** Must support various prompt formats and provider requirements

### Integration Requirements

1. **Error Analysis Integration:** Must generate context-aware prompts for error analysis
2. **Provider Router Integration:** Must work seamlessly with LLM Provider Router
3. **Configuration Integration:** Must support user customization and preferences
4. **Analytics Integration:** Must provide prompt performance metrics and optimization

## Considered Options

### Option 1: Simple String Template System
**Domain Impact:** Basic templating but limited intelligence and optimization
**Pros:**
- Simple implementation using template literals
- Fast prompt generation
- Easy template creation and modification
**Cons:**
- No intelligent context injection
- Limited provider optimization
- No quality optimization or analytics
- Poor template management and versioning

### Option 2: Advanced Template Engine
**Domain Impact:** Improved templating but limited AI-specific optimization
**Pros:**
- Sophisticated templating with logic and conditionals
- Template inheritance and composition
- Variable injection and formatting
**Cons:**
- No AI-specific prompt optimization
- Limited provider adaptation
- Basic quality assessment
- Manual template optimization

### Option 3: Intelligent Prompt Management System (CHOSEN)
**Domain Impact:** Creates comprehensive prompt domain with AI-optimized management
**Pros:**
- Intelligent template selection and context injection
- Provider-specific prompt optimization and adaptation
- Continuous quality improvement with analytics
- Extensible template ecosystem with community support
- Domain-driven design with clear prompt boundaries
**Cons:**
- More complex implementation and configuration
- Potential overhead for simple prompt generation
- Need for sophisticated quality assessment framework

## Decision Outcome

### Chosen Solution

Implement an **Intelligent Prompt Template Management System** with domain-driven architecture that provides comprehensive template management, context-aware prompt generation, and continuous optimization for AI interactions.

```javascript
// Prompt Template Management Domain Architecture
class PromptTemplateManager {
  constructor() {
    this.templateRegistry = new TemplateRegistry();
    this.templateSelector = new IntelligentTemplateSelector();
    this.contextInjector = new ContextInjector();
    this.providerAdapter = new ProviderPromptAdapter();
    this.qualityOptimizer = new PromptQualityOptimizer();
    this.templateVersionManager = new TemplateVersionManager();
    this.promptAnalytics = new PromptAnalytics();
    this.templateCache = new TemplateCache();
  }

  async generateOptimizedPrompt(request) {
    // 1. Select optimal template based on request characteristics
    const template = await this.selectTemplate(request);
    
    // 2. Inject relevant context into template
    const contextualPrompt = await this.injectContext(template, request);
    
    // 3. Adapt prompt for target LLM provider
    const adaptedPrompt = await this.adaptForProvider(contextualPrompt, request.provider);
    
    // 4. Apply quality optimizations
    const optimizedPrompt = await this.optimizeQuality(adaptedPrompt, request);
    
    // 5. Track prompt generation for analytics
    await this.trackPromptGeneration(optimizedPrompt, request);
    
    return optimizedPrompt;
  }

  async selectTemplate(request) {
    // Intelligent template selection based on request characteristics
    const requestProfile = this.analyzeRequestProfile(request);
    const candidates = await this.templateRegistry.findCandidateTemplates(requestProfile);
    
    // Score templates based on relevance, quality, and performance history
    const scoredTemplates = await Promise.all(
      candidates.map(async template => ({
        template,
        relevanceScore: await this.calculateRelevanceScore(template, requestProfile),
        qualityScore: await this.getQualityScore(template, requestProfile),
        performanceScore: await this.getPerformanceScore(template, request.provider)
      }))
    );

    // Select template with highest combined score
    const selectedTemplate = scoredTemplates
      .sort((a, b) => this.calculateCombinedScore(b) - this.calculateCombinedScore(a))[0];

    return selectedTemplate.template;
  }

  async injectContext(template, request) {
    // Extract available context from request
    const availableContext = await this.extractAvailableContext(request);
    
    // Determine optimal context injection strategy
    const injectionStrategy = await this.contextInjector.determineStrategy(
      template, 
      availableContext, 
      request.constraints
    );
    
    // Apply context injection with optimization
    const contextualPrompt = await this.contextInjector.inject(
      template, 
      availableContext, 
      injectionStrategy
    );
    
    return contextualPrompt;
  }

  async adaptForProvider(prompt, provider) {
    const providerCapabilities = await provider.getCapabilities();
    const adaptationRules = await this.providerAdapter.getAdaptationRules(provider);
    
    // Apply provider-specific optimizations
    const adaptedPrompt = await this.providerAdapter.adapt(
      prompt, 
      providerCapabilities, 
      adaptationRules
    );
    
    return adaptedPrompt;
  }
}

// Template Registry and Management
class TemplateRegistry {
  constructor() {
    this.templates = new Map();
    this.templateIndex = new TemplateSearchIndex();
    this.templateCategories = new TemplateCategoryManager();
    this.communityTemplates = new CommunityTemplateManager();
  }

  async registerTemplate(template) {
    // Validate template structure and metadata
    const validationResult = await this.validateTemplate(template);
    if (!validationResult.isValid) {
      throw new Error(`Template validation failed: ${validationResult.errors}`);
    }

    // Generate template ID and version
    const templateId = this.generateTemplateId(template);
    const version = await this.templateVersionManager.createVersion(template);
    
    // Register template with full metadata
    const templateRecord = {
      id: templateId,
      version,
      template,
      metadata: {
        registeredAt: new Date(),
        category: template.category,
        tags: template.tags,
        capabilities: template.capabilities,
        quality: await this.assessInitialQuality(template)
      }
    };

    this.templates.set(templateId, templateRecord);
    await this.templateIndex.index(templateRecord);
    
    this.emitDomainEvent('TemplateRegistered', { templateId, version });
    
    return templateId;
  }

  async findCandidateTemplates(requestProfile) {
    // Multi-faceted template search
    const searchResults = await Promise.all([
      this.templateIndex.searchByCategory(requestProfile.category),
      this.templateIndex.searchByTags(requestProfile.tags),
      this.templateIndex.searchByCapabilities(requestProfile.requiredCapabilities),
      this.templateIndex.searchBySimilarity(requestProfile.context)
    ]);

    // Merge and deduplicate search results
    const candidateIds = new Set();
    searchResults.forEach(results => 
      results.forEach(result => candidateIds.add(result.templateId))
    );

    // Return full template records
    return Array.from(candidateIds)
      .map(id => this.templates.get(id))
      .filter(template => template && template.metadata.quality.score > 0.3);
  }
}

// Template Structure and Types
class PromptTemplate {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.category = config.category; // 'error-analysis', 'code-generation', 'explanation'
    this.type = config.type; // 'system', 'user', 'assistant', 'function'
    this.tags = config.tags || [];
    this.version = config.version || '1.0.0';
    this.template = config.template;
    this.variables = new TemplateVariables(config.variables);
    this.constraints = new TemplateConstraints(config.constraints);
    this.capabilities = new TemplateCapabilities(config.capabilities);
    this.providerAdaptations = new ProviderAdaptations(config.providerAdaptations);
  }

  async render(context, options = {}) {
    // Validate required variables are present
    await this.variables.validate(context);
    
    // Apply template rendering with context
    const rendered = await this.applyTemplateLogic(this.template, context);
    
    // Apply post-processing optimizations
    const optimized = await this.applyOptimizations(rendered, options);
    
    return optimized;
  }

  async applyTemplateLogic(template, context) {
    // Support multiple template formats
    switch (this.type) {
      case 'handlebars':
        return await this.renderHandlebars(template, context);
      case 'mustache':
        return await this.renderMustache(template, context);
      case 'liquid':
        return await this.renderLiquid(template, context);
      case 'custom':
        return await this.renderCustom(template, context);
      default:
        return await this.renderSimple(template, context);
    }
  }

  renderSimple(template, context) {
    // Simple variable substitution with safety checks
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value = context;
      
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) {
          console.warn(`Template variable ${key} not found in context`);
          return match; // Keep original if not found
        }
      }
      
      return this.sanitizeValue(value);
    });
  }

  sanitizeValue(value) {
    // Sanitize values for safe prompt injection
    if (typeof value === 'string') {
      // Remove potentially harmful content
      return value
        .replace(/[<>]/g, '') // Remove HTML-like tags
        .replace(/\{|\}/g, '') // Remove template-like syntax
        .trim();
    }
    return String(value);
  }
}

// Specific Template Types
class ErrorAnalysisTemplate extends PromptTemplate {
  constructor(config) {
    super({
      ...config,
      category: 'error-analysis',
      capabilities: {
        contextTypes: ['stack-trace', 'code-context', 'environment'],
        errorTypes: config.supportedErrorTypes || ['all'],
        languages: config.supportedLanguages || ['javascript'],
        analysisDepth: config.analysisDepth || 'standard'
      }
    });
  }

  async render(context, options = {}) {
    // Error-specific context preparation
    const errorContext = await this.prepareErrorContext(context);
    
    // Apply error analysis optimizations
    const optimizedContext = await this.optimizeForErrorAnalysis(errorContext, options);
    
    return super.render(optimizedContext, options);
  }

  async prepareErrorContext(context) {
    return {
      ...context,
      errorSummary: this.generateErrorSummary(context.error),
      relevantCode: await this.extractRelevantCode(context),
      similarErrors: await this.findSimilarErrors(context.error),
      suggestedApproach: this.suggestAnalysisApproach(context.error)
    };
  }
}

class CodeGenerationTemplate extends PromptTemplate {
  constructor(config) {
    super({
      ...config,
      category: 'code-generation',
      capabilities: {
        codeTypes: config.supportedCodeTypes || ['fix', 'enhancement', 'refactor'],
        languages: config.supportedLanguages || ['javascript'],
        complexity: config.maxComplexity || 'medium',
        testGeneration: config.includeTests || false
      }
    });
  }

  async render(context, options = {}) {
    // Code generation context preparation
    const codeContext = await this.prepareCodeContext(context);
    
    // Apply code generation best practices
    const optimizedContext = await this.optimizeForCodeGeneration(codeContext, options);
    
    return super.render(optimizedContext, options);
  }

  async prepareCodeContext(context) {
    return {
      ...context,
      codeStyle: await this.detectCodeStyle(context),
      patterns: await this.identifyPatterns(context),
      constraints: this.extractConstraints(context),
      bestPractices: await this.getBestPractices(context.language)
    };
  }
}

// Context Injection System
class ContextInjector {
  constructor() {
    this.injectionStrategies = new Map([
      ['prioritized', new PrioritizedInjectionStrategy()],
      ['token-optimized', new TokenOptimizedInjectionStrategy()],
      ['relevance-based', new RelevanceBasedInjectionStrategy()],
      ['adaptive', new AdaptiveInjectionStrategy()]
    ]);
  }

  async determineStrategy(template, context, constraints) {
    // Analyze template requirements and context characteristics
    const templateAnalysis = await this.analyzeTemplate(template);
    const contextAnalysis = await this.analyzeContext(context);
    const constraintAnalysis = await this.analyzeConstraints(constraints);

    // Select optimal injection strategy
    const strategy = await this.selectOptimalStrategy(
      templateAnalysis,
      contextAnalysis,
      constraintAnalysis
    );

    return strategy;
  }

  async inject(template, context, strategy) {
    // Apply selected injection strategy
    const injectedContext = await strategy.inject(template, context);
    
    // Validate injection results
    const validation = await this.validateInjection(template, injectedContext);
    if (!validation.isValid) {
      console.warn('Context injection validation failed:', validation.warnings);
    }

    return injectedContext;
  }
}

// Provider Adaptation System
class ProviderPromptAdapter {
  constructor() {
    this.adaptationRules = new Map();
    this.providerProfiles = new Map();
    this.optimizationStrategies = new Map();
  }

  async adapt(prompt, providerCapabilities, adaptationRules) {
    // Apply provider-specific adaptations
    let adaptedPrompt = prompt;

    for (const rule of adaptationRules) {
      adaptedPrompt = await this.applyAdaptationRule(adaptedPrompt, rule, providerCapabilities);
    }

    // Validate adapted prompt meets provider constraints
    const validation = await this.validateForProvider(adaptedPrompt, providerCapabilities);
    if (!validation.isValid) {
      adaptedPrompt = await this.handleValidationFailure(adaptedPrompt, validation);
    }

    return adaptedPrompt;
  }

  async getAdaptationRules(provider) {
    const providerType = provider.getType();
    const baseRules = this.adaptationRules.get(providerType) || [];
    
    // Add dynamic rules based on current provider capabilities
    const dynamicRules = await this.generateDynamicRules(provider);
    
    return [...baseRules, ...dynamicRules];
  }

  async applyAdaptationRule(prompt, rule, capabilities) {
    switch (rule.type) {
      case 'token-limit':
        return await this.applyTokenLimitRule(prompt, rule, capabilities);
      case 'format-style':
        return await this.applyFormatStyleRule(prompt, rule, capabilities);
      case 'instruction-style':
        return await this.applyInstructionStyleRule(prompt, rule, capabilities);
      case 'context-compression':
        return await this.applyContextCompressionRule(prompt, rule, capabilities);
      default:
        return prompt;
    }
  }
}

// Quality Optimization System
class PromptQualityOptimizer {
  constructor() {
    this.qualityMetrics = new QualityMetricsCollector();
    this.optimizationEngine = new OptimizationEngine();
    this.abTestManager = new ABTestManager();
    this.feedbackProcessor = new FeedbackProcessor();
  }

  async optimizeQuality(prompt, request) {
    // Get historical quality data for similar prompts
    const qualityHistory = await this.qualityMetrics.getHistory(prompt, request);
    
    // Apply proven optimizations
    let optimizedPrompt = await this.applyProvenOptimizations(prompt, qualityHistory);
    
    // Consider A/B testing opportunities
    const abTestCandidate = await this.abTestManager.considerForTesting(optimizedPrompt, request);
    if (abTestCandidate) {
      optimizedPrompt = abTestCandidate;
    }

    return optimizedPrompt;
  }

  async assessQuality(prompt, response, context) {
    // Multi-dimensional quality assessment
    const qualityAssessment = {
      accuracy: await this.assessAccuracy(response, context),
      relevance: await this.assessRelevance(response, context),
      completeness: await this.assessCompleteness(response, context),
      clarity: await this.assessClarity(response),
      efficiency: await this.assessEfficiency(prompt, response),
      userSatisfaction: await this.getUserSatisfaction(response, context)
    };

    // Calculate overall quality score
    qualityAssessment.overallScore = this.calculateOverallQuality(qualityAssessment);
    
    // Store quality data for future optimization
    await this.qualityMetrics.record(prompt, response, qualityAssessment);
    
    return qualityAssessment;
  }
}
```

### Domain-Driven Reasoning

1. **Template Domain Encapsulation:** Each template type encapsulates domain knowledge about specific prompt patterns and optimization strategies
2. **Intelligent Selection Logic:** Template selector embodies domain expertise about prompt effectiveness and suitability
3. **Context-Aware Architecture:** Domain language focuses on context injection and template adaptation
4. **Quality-Driven Evolution:** Clear domain boundaries enable continuous prompt improvement and optimization

## Consequences

### Positive Domain Outcomes

1. **Intelligent Prompt Management:**
   - Automated template selection based on request characteristics and quality history
   - Context-aware prompt generation with intelligent variable injection
   - Provider-specific prompt optimization for maximum effectiveness
   - Continuous quality improvement through analytics and A/B testing

2. **Extensible Template Ecosystem:**
   - Standardized template structure with community contribution support
   - Template inheritance and composition for code reuse
   - Version management with rollback and comparison capabilities
   - Category-based organization with powerful search and discovery

3. **Quality Optimization:**
   - Multi-dimensional quality assessment with continuous improvement
   - A/B testing framework for prompt effectiveness comparison
   - Feedback-driven optimization with user satisfaction metrics
   - Performance analytics with provider-specific insights

4. **Developer Experience:**
   - Simple template creation with comprehensive validation
   - Visual template editor with preview and testing capabilities
   - Template debugging tools with context simulation
   - Community template marketplace with ratings and reviews

### Domain Risks and Mitigations

1. **Template Complexity Risk:**
   - **Risk:** Over-complex templates affecting maintainability and performance
   - **Mitigation:** Template complexity limits and validation rules
   - **Monitoring:** Template performance metrics and usage analytics

2. **Quality Assessment Risk:**
   - **Risk:** Inaccurate quality metrics leading to poor optimization decisions
   - **Mitigation:** Multi-dimensional assessment with human validation
   - **Validation:** Regular quality metric calibration and accuracy checks

3. **Context Injection Risk:**
   - **Risk:** Context injection causing prompt bloat or irrelevant information
   - **Mitigation:** Intelligent context prioritization and token management
   - **Optimization:** Context relevance scoring and automatic filtering

4. **Provider Compatibility Risk:**
   - **Risk:** Provider adaptations not working effectively across different models
   - **Mitigation:** Comprehensive testing and validation for each provider
   - **Monitoring:** Provider-specific performance tracking and optimization

### Implementation Impact

1. **New Domain Components:**
   - Prompt Template Manager with intelligent selection and optimization
   - Template Registry with versioning and community support
   - Context Injector with adaptive injection strategies
   - Provider Adapter with model-specific optimization
   - Quality Optimizer with continuous improvement capabilities

2. **Template Structure Standards:**
   ```json
   {
     "id": "error-analysis-comprehensive-v2",
     "name": "Comprehensive Error Analysis Template",
     "category": "error-analysis",
     "type": "handlebars",
     "version": "2.1.0",
     "description": "Advanced error analysis with context and solution generation",
     "template": "{{> system-context}}\n\nAnalyze this error:\n{{error.summary}}\n\n{{#if context.code}}Code Context:\n```{{context.language}}\n{{context.code}}\n```{{/if}}\n\n{{> analysis-instructions}}",
     "variables": {
       "error": { "type": "object", "required": true },
       "context": { "type": "object", "required": false }
     },
     "constraints": {
       "maxTokens": 4000,
       "minQuality": 0.7
     },
     "providerAdaptations": {
       "claude": { "instructionStyle": "conversational" },
       "gpt": { "instructionStyle": "structured" }
     }
   }
   ```

3. **Integration Points:**
   - AI/LLM Integration Domain: Seamless integration with provider router
   - Error Analysis Domain: Context-aware error analysis prompt generation
   - CLI Domain: Template customization and user preference management
   - Configuration Domain: Template configuration and optimization settings

## Verification Criteria

### Functional Verification
- [ ] Template selection accurately matches request characteristics
- [ ] Context injection produces relevant, optimized prompts
- [ ] Provider adaptation works correctly for all supported models
- [ ] Quality optimization improves prompt effectiveness over time
- [ ] Template versioning and rollback function properly

### Quality Verification
- [ ] Generated prompts consistently produce high-quality AI responses
- [ ] Quality assessment accurately measures prompt effectiveness
- [ ] A/B testing framework enables data-driven optimization
- [ ] Continuous improvement increases average prompt quality
- [ ] User satisfaction metrics validate optimization effectiveness

### Performance Verification
- [ ] Prompt generation completes within acceptable time limits
- [ ] Template registry searches perform efficiently at scale
- [ ] Context injection optimizes token usage effectively
- [ ] Provider adaptation minimizes latency overhead
- [ ] Quality optimization provides measurable improvements

### Integration Verification
- [ ] LLM Provider Router integration works seamlessly
- [ ] Error Analysis Domain leverages appropriate templates
- [ ] CLI Domain supports template customization effectively
- [ ] Configuration management handles template preferences
- [ ] Community template ecosystem enables external contributions

---

**Domain Maturity:** Evolving (sophisticated domain with significant optimization potential)  
**Review Date:** 2024-03-XX  
**Impact Assessment:** High (enables significantly improved AI interaction quality) 