# ADR-005: Error Context Extraction Strategy

**Status:** Accepted  
**Date:** 2024-01-XX  
**Authors:** Development Team  
**Reviewers:** Architecture Team, Error Analysis Specialists  
**Domain Impact:** Error Analysis Domain (Primary), AI/LLM Integration Domain (Secondary), CLI Domain (Secondary)

## Context and Problem Statement

The CLOI system requires sophisticated error context extraction capabilities to gather comprehensive diagnostic information from various error sources, development environments, and execution contexts. Without a coherent **Error Context Extraction Strategy**, CLOI cannot provide detailed context for AI-powered analysis, limiting the accuracy and effectiveness of error resolution recommendations.

### Domain-Driven Design Context

**Primary Bounded Context:** Error Analysis and Diagnostic Domain  
**Secondary Contexts:** AI/LLM Integration (context-aware prompts), CLI Domain (context display)  
**Aggregate Root:** Error Context Extractor  
**Domain Language:** Context Extraction, Environment Context, Stack Trace Analysis, Code Context, Project Context, Error Metadata, Context Correlation  
**Domain Events:** Error Detected, Context Extracted, Context Enriched, Context Validated, Analysis Context Ready

### Problem Manifestation

1. **Limited Context Collection:**
   ```javascript
   // Before: Basic error information only
   const errorData = {
     message: error.message,
     stack: error.stack,
     timestamp: new Date()
   };
   
   // Missing rich context needed for analysis
   ```

2. **Inconsistent Context Sources:**
   - No standardized approach to environment context gathering
   - Missing integration with development tool contexts (git, package managers, IDEs)
   - Lack of code surrounding error locations for better analysis
   - No correlation between related errors or system state

3. **Missing Domain Intelligence:**
   - No intelligent context prioritization based on error types
   - Lack of context validation and sanitization for AI processing
   - No adaptive context extraction based on available information sources
   - Missing context correlation across multiple error instances

4. **Poor Integration:**
   - Difficult to extend context extraction for new error sources
   - No standardized context format for AI prompt integration
   - Limited context sharing between different analysis components
   - No context caching or optimization for repeated analyses

## Decision Drivers

### Domain Requirements

1. **Comprehensive Context:** Must extract rich contextual information from multiple sources
2. **Intelligent Prioritization:** Must prioritize context based on error types and analysis needs
3. **Adaptive Extraction:** Must adapt context collection based on available information sources
4. **Context Validation:** Must validate and sanitize context for safe AI processing

### Technical Constraints

1. **Performance:** Must collect context efficiently without significant latency impact
2. **Privacy:** Must respect privacy boundaries and avoid collecting sensitive information
3. **Reliability:** Must handle context collection failures gracefully
4. **Resource Usage:** Must manage memory and storage for large context datasets

### Integration Requirements

1. **AI/LLM Integration:** Must provide context in formats optimized for AI analysis
2. **Tool Ecosystem:** Must integrate with common development tools and environments
3. **Error Source Variety:** Must support context extraction from various error sources
4. **Extensibility:** Must enable easy addition of new context extraction capabilities

## Considered Options

### Option 1: Basic Stack Trace Context
**Domain Impact:** Simple but insufficient for complex error analysis
**Pros:**
- Minimal implementation complexity
- Fast context extraction
- Low resource usage
**Cons:**
- Limited context depth and relevance
- No environment or project context
- Poor analysis accuracy for complex errors
- No extensibility for new context sources

### Option 2: Multi-Source Context Collection
**Domain Impact:** Improved context breadth but limited intelligence
**Pros:**
- Broader context from multiple sources
- Better error analysis foundation
- Support for various development environments
**Cons:**
- No intelligent prioritization or filtering
- Potential privacy and security issues
- Limited context correlation and enrichment
- Basic integration with AI systems

### Option 3: Intelligent Context Extraction System (CHOSEN)
**Domain Impact:** Creates comprehensive context domain with intelligent extraction and optimization
**Pros:**
- Intelligent, adaptive context extraction with prioritization
- Comprehensive privacy protection and context validation
- Advanced correlation and enrichment capabilities
- Optimized integration with AI/LLM systems
- Domain-driven design with clear context boundaries
**Cons:**
- More complex implementation and configuration
- Potential performance overhead for comprehensive context collection
- Need for sophisticated context management and storage

## Decision Outcome

### Chosen Solution

Implement an **Intelligent Error Context Extraction System** with domain-driven architecture that provides comprehensive, adaptive, and privacy-aware context collection optimized for AI-powered error analysis.

```javascript
// Error Context Extraction Domain Architecture
class ErrorContextExtractor {
  constructor() {
    this.contextSources = new ContextSourceRegistry();
    this.extractionEngine = new AdaptiveExtractionEngine();
    this.contextValidator = new ContextValidator();
    this.contextEnricher = new ContextEnricher();
    this.contextOptimizer = new ContextOptimizer();
    this.privacyFilter = new PrivacyFilter();
    this.contextCache = new ContextCache();
  }

  async extractErrorContext(error, extractionConfig = {}) {
    // 1. Initialize context extraction session
    const session = await this.initializeExtractionSession(error, extractionConfig);
    
    // 2. Determine optimal context sources based on error characteristics
    const relevantSources = await this.selectContextSources(error, session);
    
    // 3. Extract context from multiple sources in parallel
    const rawContext = await this.extractFromSources(relevantSources, session);
    
    // 4. Validate and sanitize context for privacy and security
    const validatedContext = await this.validateAndSanitize(rawContext, session);
    
    // 5. Enrich context with correlation and analysis metadata
    const enrichedContext = await this.enrichContext(validatedContext, session);
    
    // 6. Optimize context for AI analysis and storage
    const optimizedContext = await this.optimizeForAnalysis(enrichedContext, session);
    
    // 7. Cache context for future use and correlation
    await this.cacheContext(optimizedContext, session);
    
    return optimizedContext;
  }

  async selectContextSources(error, session) {
    // Intelligent context source selection based on error characteristics
    const errorProfile = this.analyzeErrorProfile(error);
    const availableSources = await this.contextSources.getAvailableSources();
    
    // Score and rank context sources by relevance and availability
    const scoredSources = availableSources.map(source => ({
      source,
      relevanceScore: this.calculateRelevanceScore(source, errorProfile),
      availabilityScore: this.calculateAvailabilityScore(source, session),
      costScore: this.calculateCostScore(source, session)
    }));

    // Select optimal combination of sources within constraints
    return this.selectOptimalSources(scoredSources, session.constraints);
  }

  async extractFromSources(sources, session) {
    const contextPromises = sources.map(async (source) => {
      try {
        const startTime = Date.now();
        const context = await source.extract(session);
        const extractionTime = Date.now() - startTime;
        
        return {
          source: source.name,
          context,
          metadata: {
            extractionTime,
            confidence: source.getConfidenceLevel(),
            version: source.version
          }
        };
      } catch (error) {
        // Log extraction failure but continue with other sources
        console.warn(`Context extraction failed for source ${source.name}:`, error);
        return {
          source: source.name,
          context: null,
          error: error.message,
          metadata: { failed: true }
        };
      }
    });

    const results = await Promise.allSettled(contextPromises);
    return results
      .filter(result => result.status === 'fulfilled' && result.value.context)
      .map(result => result.value);
  }
}

// Context Source Registry and Interface
class ContextSource {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.capabilities = this.declareCapabilities();
    this.priority = config.priority || 50;
  }

  async extract(session) {
    // Abstract method - implemented by specific context sources
    throw new Error(`Context source ${this.name} must implement extract() method`);
  }

  async isAvailable(session) {
    // Check if this context source is available in current environment
    return true;
  }

  getConfidenceLevel() {
    // Return confidence level for context provided by this source
    return 0.8;
  }

  getResourceCost() {
    // Return estimated resource cost for extraction
    return { cpu: 'low', memory: 'low', time: 'fast' };
  }

  abstract declareCapabilities();
}

// Specific Context Sources
class StackTraceContextSource extends ContextSource {
  declareCapabilities() {
    return {
      types: ['stack-trace', 'error-location', 'call-chain'],
      languages: ['javascript', 'typescript', 'python', 'java'],
      confidence: 0.9,
      speed: 'instant'
    };
  }

  async extract(session) {
    const error = session.error;
    return {
      stackTrace: error.stack,
      errorLocation: this.parseErrorLocation(error),
      callChain: this.extractCallChain(error.stack),
      sourceMap: await this.resolveSourceMap(error)
    };
  }

  parseErrorLocation(error) {
    // Parse error location from stack trace
    const stackLines = error.stack.split('\\n');
    const locationMatch = stackLines[1]?.match(/at .* \\((.+):(\\d+):(\\d+)\\)/);
    
    if (locationMatch) {
      return {
        file: locationMatch[1],
        line: parseInt(locationMatch[2]),
        column: parseInt(locationMatch[3])
      };
    }
    return null;
  }
}

class CodeContextSource extends ContextSource {
  declareCapabilities() {
    return {
      types: ['surrounding-code', 'function-context', 'module-context'],
      languages: ['javascript', 'typescript', 'python', 'java', 'go'],
      confidence: 0.85,
      speed: 'fast'
    };
  }

  async extract(session) {
    const errorLocation = session.getErrorLocation();
    if (!errorLocation) return null;

    const fileContent = await this.readFile(errorLocation.file);
    const surroundingCode = this.extractSurroundingCode(
      fileContent, 
      errorLocation.line, 
      session.config.codeContextLines || 10
    );

    return {
      surroundingCode,
      functionContext: await this.extractFunctionContext(fileContent, errorLocation),
      moduleStructure: await this.extractModuleStructure(errorLocation.file),
      imports: this.extractImports(fileContent),
      exports: this.extractExports(fileContent)
    };
  }

  extractSurroundingCode(content, errorLine, contextLines) {
    const lines = content.split('\\n');
    const startLine = Math.max(0, errorLine - contextLines - 1);
    const endLine = Math.min(lines.length, errorLine + contextLines);
    
    return {
      lines: lines.slice(startLine, endLine),
      startLine: startLine + 1,
      endLine: endLine,
      errorLine: errorLine,
      highlightedLines: [errorLine]
    };
  }
}

class EnvironmentContextSource extends ContextSource {
  declareCapabilities() {
    return {
      types: ['runtime-environment', 'system-info', 'dependencies'],
      confidence: 0.7,
      speed: 'medium'
    };
  }

  async extract(session) {
    return {
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      },
      environment: {
        cwd: process.cwd(),
        argv: process.argv,
        env: this.getSafeEnvironmentVariables()
      },
      dependencies: await this.extractDependencyInfo(),
      system: await this.getSystemInfo()
    };
  }

  getSafeEnvironmentVariables() {
    // Only include safe, non-sensitive environment variables
    const safeKeys = ['NODE_ENV', 'NODE_PATH', 'PATH', 'SHELL', 'USER', 'HOME'];
    const safeEnv = {};
    
    safeKeys.forEach(key => {
      if (process.env[key]) {
        safeEnv[key] = process.env[key];
      }
    });
    
    return safeEnv;
  }
}

class ProjectContextSource extends ContextSource {
  declareCapabilities() {
    return {
      types: ['project-structure', 'git-context', 'build-info'],
      confidence: 0.8,
      speed: 'medium'
    };
  }

  async extract(session) {
    const projectRoot = await this.findProjectRoot(session.error);
    
    return {
      projectInfo: await this.extractProjectInfo(projectRoot),
      gitContext: await this.extractGitContext(projectRoot),
      buildInfo: await this.extractBuildInfo(projectRoot),
      packageInfo: await this.extractPackageInfo(projectRoot),
      recentChanges: await this.extractRecentChanges(projectRoot)
    };
  }

  async extractGitContext(projectRoot) {
    try {
      const { execSync } = require('child_process');
      const gitRoot = projectRoot;
      
      return {
        branch: execSync('git branch --show-current', { cwd: gitRoot }).toString().trim(),
        commit: execSync('git rev-parse HEAD', { cwd: gitRoot }).toString().trim(),
        status: execSync('git status --porcelain', { cwd: gitRoot }).toString(),
        recentCommits: this.getRecentCommits(gitRoot, 5)
      };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }
}

// Context Validation and Privacy Protection
class ContextValidator {
  constructor() {
    this.privacyRules = new PrivacyRuleEngine();
    this.sensitivePatterns = new SensitivePatternDetector();
    this.contextSanitizer = new ContextSanitizer();
  }

  async validateAndSanitize(rawContext, session) {
    const validationResults = [];
    
    for (const contextItem of rawContext) {
      try {
        // 1. Privacy validation
        const privacyResult = await this.privacyRules.validate(contextItem);
        
        // 2. Sensitive information detection
        const sensitivityResult = await this.sensitivePatterns.analyze(contextItem);
        
        // 3. Context sanitization
        const sanitizedContext = await this.contextSanitizer.sanitize(
          contextItem, 
          privacyResult, 
          sensitivityResult
        );
        
        validationResults.push({
          ...sanitizedContext,
          validation: {
            privacy: privacyResult,
            sensitivity: sensitivityResult,
            sanitized: true
          }
        });
        
      } catch (error) {
        console.warn(`Context validation failed for ${contextItem.source}:`, error);
        // Exclude invalid context rather than including potentially unsafe data
      }
    }
    
    return validationResults;
  }
}

// Context Optimization for AI Analysis
class ContextOptimizer {
  constructor() {
    this.tokenEstimator = new TokenEstimator();
    this.relevanceScorer = new ContextRelevanceScorer();
    this.compressionEngine = new ContextCompressionEngine();
  }

  async optimizeForAnalysis(enrichedContext, session) {
    // 1. Estimate token usage for AI analysis
    const tokenEstimate = await this.tokenEstimator.estimate(enrichedContext);
    
    // 2. Calculate relevance scores for context prioritization
    const scoredContext = await this.relevanceScorer.score(enrichedContext, session);
    
    // 3. Apply compression and filtering based on constraints
    const optimizedContext = await this.applyOptimization(
      scoredContext, 
      tokenEstimate, 
      session.constraints
    );
    
    return {
      context: optimizedContext,
      metadata: {
        originalSize: tokenEstimate.original,
        optimizedSize: tokenEstimate.optimized,
        compressionRatio: tokenEstimate.compressionRatio,
        relevanceScore: this.calculateOverallRelevance(scoredContext)
      }
    };
  }

  async applyOptimization(scoredContext, tokenEstimate, constraints) {
    const maxTokens = constraints.maxTokens || 8000;
    
    if (tokenEstimate.original <= maxTokens) {
      return scoredContext; // No optimization needed
    }

    // Priority-based context selection and compression
    const prioritizedContext = scoredContext
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .reduce((accumulated, contextItem) => {
        const newTotal = accumulated.tokens + contextItem.estimatedTokens;
        
        if (newTotal <= maxTokens) {
          accumulated.items.push(contextItem);
          accumulated.tokens = newTotal;
        } else {
          // Try to compress remaining high-priority items
          const compressed = this.compressionEngine.compress(contextItem, maxTokens - accumulated.tokens);
          if (compressed) {
            accumulated.items.push(compressed);
            accumulated.tokens += compressed.estimatedTokens;
          }
        }
        
        return accumulated;
      }, { items: [], tokens: 0 });

    return prioritizedContext.items;
  }
}
```

### Domain-Driven Reasoning

1. **Context Domain Encapsulation:** Each context source encapsulates domain knowledge about specific context types and extraction methods
2. **Intelligent Extraction Logic:** Extraction engine embodies domain expertise about context relevance and optimization
3. **Privacy-First Architecture:** Domain language focuses on safe context handling and privacy protection
4. **Adaptive Context Strategy:** Clear domain boundaries enable context adaptation based on error characteristics

## Consequences

### Positive Domain Outcomes

1. **Comprehensive Error Context:**
   - Rich contextual information from multiple sources (code, environment, project, system)
   - Intelligent context prioritization based on error types and analysis needs
   - Adaptive context extraction optimized for available information sources
   - Context correlation across multiple error instances and patterns

2. **Privacy and Security Protection:**
   - Comprehensive privacy filtering and sensitive information detection
   - Configurable privacy rules and sanitization policies
   - Secure context handling and storage with encryption
   - Audit trails for context access and usage

3. **AI-Optimized Context:**
   - Context formatting optimized for AI/LLM analysis and prompting
   - Token-aware context compression and prioritization
   - Relevance scoring for optimal context selection
   - Context metadata for AI confidence assessment

4. **Extensible Architecture:**
   - Plugin architecture for adding new context sources
   - Standardized context source interface and capabilities
   - Configurable extraction strategies and optimization policies
   - Community-extensible context extraction ecosystem

### Domain Risks and Mitigations

1. **Privacy Risk:**
   - **Risk:** Accidentally collecting and exposing sensitive information
   - **Mitigation:** Comprehensive privacy filtering and validation systems
   - **Monitoring:** Audit trails and privacy compliance monitoring

2. **Performance Risk:**
   - **Risk:** Context extraction causing significant analysis delays
   - **Mitigation:** Intelligent source selection and parallel extraction
   - **Optimization:** Context caching and extraction time limits

3. **Context Quality Risk:**
   - **Risk:** Poor context quality affecting analysis accuracy
   - **Mitigation:** Context validation and confidence scoring
   - **Assessment:** Context quality metrics and feedback loops

4. **Resource Usage Risk:**
   - **Risk:** Excessive memory or storage usage from large contexts
   - **Mitigation:** Context optimization and compression strategies
   - **Management:** Resource limits and cleanup policies

### Implementation Impact

1. **New Domain Components:**
   - Error Context Extractor with intelligent source selection
   - Context Source Registry with plugin architecture
   - Context Validator with privacy protection and sanitization
   - Context Optimizer with AI-aware compression and prioritization
   - Context Cache with correlation and analysis optimization

2. **Context Extraction Framework:**
   ```json
   {
     "extractionConfig": {
       "sources": {
         "stackTrace": { "enabled": true, "priority": 100 },
         "codeContext": { "enabled": true, "priority": 90, "lines": 15 },
         "environment": { "enabled": true, "priority": 70 },
         "project": { "enabled": true, "priority": 80 },
         "git": { "enabled": true, "priority": 60 }
       },
       "privacy": {
         "filterSensitive": true,
         "allowEnvironmentVars": ["NODE_ENV", "NODE_PATH"],
         "excludePatterns": ["password", "key", "token", "secret"]
       },
       "optimization": {
         "maxTokens": 8000,
         "compressionLevel": "balanced",
         "relevanceThreshold": 0.3
       }
     }
   }
   ```

3. **Integration Points:**
   - AI/LLM Integration Domain: Context-aware prompt generation and analysis
   - CLI Domain: Context display and user interaction
   - Error Analysis Domain: Context-enhanced error classification
   - Configuration Domain: Context extraction configuration and preferences

## Verification Criteria

### Functional Verification
- [ ] Context extraction works correctly from all configured sources
- [ ] Privacy filtering effectively removes sensitive information
- [ ] Context optimization produces relevant, compressed context within token limits
- [ ] Context correlation identifies related errors and patterns
- [ ] Context caching improves performance for repeated analyses

### Domain Verification
- [ ] Error Context Extraction Domain maintains clear boundaries
- [ ] Context source abstraction follows domain-driven principles
- [ ] Extraction logic embodies domain expertise about context relevance
- [ ] Domain events are properly triggered and handled
- [ ] Integration with other domains follows established patterns

### Privacy Verification
- [ ] Sensitive information detection accurately identifies privacy risks
- [ ] Context sanitization removes sensitive data without losing relevance
- [ ] Privacy rules engine enforces configurable privacy policies
- [ ] Audit trails track context access and usage appropriately
- [ ] Compliance validation ensures privacy regulation adherence

### Performance Verification
- [ ] Context extraction completes within acceptable time limits
- [ ] Parallel source extraction optimizes total extraction time
- [ ] Context compression maintains relevance while reducing size
- [ ] Memory usage remains bounded during context extraction
- [ ] Context caching provides measurable performance improvements

### Integration Verification
- [ ] AI/LLM systems can effectively utilize extracted context
- [ ] CLI commands display context information appropriately
- [ ] Error Analysis Domain leverages context for improved classification
- [ ] Configuration management supports context extraction preferences
- [ ] Context quality metrics enable continuous improvement

## Future Considerations

1. **Machine Learning Context Relevance:** AI-powered context relevance scoring
2. **Real-time Context Streaming:** Continuous context updates during analysis
3. **Cross-Project Context Correlation:** Context sharing across related projects
4. **Context Visualization:** Interactive context exploration and analysis tools
5. **Collaborative Context Enhancement:** Team-based context annotation and improvement
6. **Context Analytics:** Comprehensive analytics on context effectiveness
7. **Context Marketplace:** Community-driven context extraction plugins

---

**Domain Maturity:** Core (essential domain with significant optimization potential)  
**Review Date:** 2024-03-XX  
**Impact Assessment:** High (enables significantly improved error analysis accuracy) 