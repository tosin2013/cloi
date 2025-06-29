# ADR-006: Multi-Language Error Analysis Framework

**Status:** Accepted  
**Date:** 2024-12-14  
**Deciders:** CLOI Development Team  
**Technical Story:** [Error Analysis Domain Enhancement - Multi-Language Support]

## Context and Problem Statement

The CLOI system must provide sophisticated error analysis capabilities across multiple programming languages, frameworks, and runtime environments. Each language has unique error patterns, syntax conventions, and debugging paradigms that require specialized analysis approaches. The multi-language framework must operate within the Error Analysis Domain while maintaining consistency and providing extensible architecture for new language support.

### Domain-Driven Design Context

**Bounded Context:** Error Analysis Domain  
**Aggregate Root:** Multi-Language Error Analyzer  
**Domain Language:** Error Patterns, Language Semantics, Syntax Analysis, Runtime Context, Stack Trace Parsing  
**Core Domain Events:** Language Detected, Error Parsed, Pattern Matched, Analysis Completed

## Decision Drivers

### Domain-Driven Considerations
- **Aggregate Consistency:** Unified error analysis interface across all supported languages
- **Ubiquitous Language:** Consistent terminology for error concepts across languages
- **Bounded Context Integrity:** Language-specific logic contained within error analysis domain
- **Domain Service Reliability:** Consistent error detection and classification quality

### Technical Requirements
- **Language Extensibility:** Support for adding new programming languages without core changes
- **Pattern Recognition:** Language-specific error pattern detection and classification
- **Context Preservation:** Maintain debugging context across language boundaries
- **Performance Optimization:** Efficient analysis for mixed-language codebases

## Considered Options

### Option 1: Single Universal Error Parser
- **Domain Impact:** Oversimplified aggregate losing language-specific semantics
- **Technical:** One parser attempting to handle all language patterns
- **Pros:** Simple implementation, unified interface
- **Cons:** Poor accuracy, loss of language-specific insights, maintainability issues

### Option 2: Pluggable Language-Specific Analyzers ⭐ (Chosen)
- **Domain Impact:** Rich aggregate with specialized language domain services
- **Technical:** Modular architecture with language-specific analysis plugins
- **Pros:** High accuracy, extensible, domain-aligned, specialized insights
- **Cons:** Higher complexity, coordination overhead

### Option 3: External Language Services
- **Domain Impact:** Violates bounded context with external dependencies
- **Technical:** Delegate to external language-specific analysis services
- **Pros:** Reduced implementation burden, specialized expertise
- **Cons:** Domain boundary violation, latency, dependency complexity

## Decision Outcome

**Chosen Option:** Pluggable Language-Specific Analyzers with Unified Coordination

### Domain Architecture

```
Error Analysis Domain
├── Multi-Language Error Analyzer (Aggregate Root)
│   ├── Language Detector (Entity)
│   ├── Error Parser Coordinator (Entity)
│   └── Analysis Result Synthesizer (Entity)
├── Language Analyzers (Value Objects)
│   ├── JavaScript Analyzer
│   ├── Python Analyzer
│   ├── TypeScript Analyzer
│   ├── Java Analyzer
│   ├── Go Analyzer
│   └── Generic Analyzer (fallback)
└── Analysis Services (Domain Services)
    ├── Stack Trace Parser Service
    ├── Error Pattern Matcher Service
    └── Context Extraction Service
```

### Technical Implementation

```javascript
// Domain: Error Analysis
// Aggregate: Multi-Language Error Analyzer
class MultiLanguageErrorAnalyzer {
  constructor() {
    this.languageDetector = new LanguageDetector();
    this.parserCoordinator = new ErrorParserCoordinator();
    this.resultSynthesizer = new AnalysisResultSynthesizer();
    this.languageAnalyzers = new Map();
    
    this.initializeLanguageAnalyzers();
  }

  async analyzeError(errorData, projectContext) {
    // Domain Event: Language Detection Started
    const detectedLanguages = await this.languageDetector
      .detectLanguages(errorData, projectContext);
    
    // Domain Event: Multi-Language Analysis Started
    const analysisResults = await Promise.all(
      detectedLanguages.map(language => 
        this.analyzeWithLanguage(errorData, language, projectContext)
      )
    );
    
    // Domain Event: Analysis Results Synthesized
    const synthesizedResult = await this.resultSynthesizer
      .combineLanguageAnalyses(analysisResults);
    
    return {
      primaryLanguage: detectedLanguages[0],
      supportedLanguages: detectedLanguages,
      analysis: synthesizedResult,
      confidence: this.calculateOverallConfidence(analysisResults),
      recommendations: this.generateCrossLanguageRecommendations(analysisResults)
    };
  }

  async analyzeWithLanguage(errorData, language, projectContext) {
    const analyzer = this.languageAnalyzers.get(language) || 
                    this.languageAnalyzers.get('generic');
    
    return await analyzer.analyzeError(errorData, projectContext);
  }
}

// Domain Service: Language-Specific Error Analysis
class JavaScriptErrorAnalyzer {
  constructor() {
    this.syntaxPatterns = new JavaScriptSyntaxPatterns();
    this.runtimePatterns = new JavaScriptRuntimePatterns();
    this.frameworkPatterns = new JavaScriptFrameworkPatterns();
  }

  async analyzeError(errorData, projectContext) {
    const analysis = {
      language: 'javascript',
      errorType: await this.classifyJSError(errorData),
      stackTrace: await this.parseJSStackTrace(errorData.stackTrace),
      syntaxIssues: await this.detectSyntaxIssues(errorData),
      runtimeContext: await this.extractRuntimeContext(errorData),
      frameworkSpecific: await this.analyzeFrameworkErrors(errorData, projectContext)
    };

    return {
      ...analysis,
      confidence: this.calculateConfidence(analysis),
      suggestions: await this.generateSuggestions(analysis, projectContext)
    };
  }

  async classifyJSError(errorData) {
    const patterns = [
      { pattern: /ReferenceError/, type: 'REFERENCE_ERROR', category: 'RUNTIME' },
      { pattern: /TypeError/, type: 'TYPE_ERROR', category: 'RUNTIME' },
      { pattern: /SyntaxError/, type: 'SYNTAX_ERROR', category: 'COMPILE_TIME' },
      { pattern: /RangeError/, type: 'RANGE_ERROR', category: 'RUNTIME' },
      { pattern: /Cannot read prop.*undefined/, type: 'NULL_POINTER', category: 'RUNTIME' }
    ];

    for (const { pattern, type, category } of patterns) {
      if (pattern.test(errorData.message)) {
        return { type, category, pattern: pattern.source };
      }
    }

    return { type: 'UNKNOWN', category: 'UNCLASSIFIED' };
  }
}
```

### Domain Benefits

1. **Enhanced Domain Clarity**
   - Clear separation between language-specific analysis and coordination logic
   - Ubiquitous language consistent with programming language domain concepts
   - Well-defined aggregate boundaries for multi-language error handling

2. **Improved Aggregate Consistency**
   - Unified interface for error analysis regardless of programming language
   - Consistent error classification taxonomy across all languages
   - Reliable synthesis of multi-language analysis results

3. **Better Domain Service Integration**
   - Seamless integration with CLI Command Processing for context gathering
   - Clean interfaces for LLM Integration Domain to consume analysis results
   - Efficient collaboration with Plugin Management for language-specific extensions

4. **Extensible Language Support**
   - Pluggable architecture for adding new programming languages
   - Consistent extension points for framework-specific error patterns
   - Standardized analysis result format across all language analyzers

## Language Analyzer Specifications

### Core Language Support (Phase 1)
```javascript
// JavaScript/TypeScript Analyzer
class JavaScriptErrorAnalyzer {
  supportedPatterns = [
    'ReferenceError', 'TypeError', 'SyntaxError', 'RangeError',
    'Promise rejection', 'Async/await issues', 'Module import errors'
  ];
  
  frameworkSupport = ['React', 'Vue', 'Angular', 'Node.js', 'Express'];
}

// Python Analyzer  
class PythonErrorAnalyzer {
  supportedPatterns = [
    'NameError', 'TypeError', 'ValueError', 'IndentationError',
    'ImportError', 'AttributeError', 'KeyError', 'IndexError'
  ];
  
  frameworkSupport = ['Django', 'Flask', 'FastAPI', 'Pandas', 'NumPy'];
}

// Java Analyzer
class JavaErrorAnalyzer {
  supportedPatterns = [
    'NullPointerException', 'ClassNotFoundException', 'IllegalArgumentException',
    'ArrayIndexOutOfBoundsException', 'ConcurrentModificationException'
  ];
  
  frameworkSupport = ['Spring', 'Hibernate', 'Maven', 'Gradle'];
}
```

### Extended Language Support (Phase 2)
```javascript
// Additional language analyzers
const extendedLanguages = [
  'GoErrorAnalyzer',      // Go specific patterns
  'RustErrorAnalyzer',    // Rust compiler and runtime errors
  'CSharpErrorAnalyzer',  // C# and .NET framework errors
  'RubyErrorAnalyzer',    // Ruby and Rails specific patterns
  'PHPErrorAnalyzer'      // PHP framework and runtime errors
];
```

## Implementation Strategy

### Phase 1: Core Language Foundation
```javascript
// Basic multi-language support
class CoreLanguageImplementation {
  async initializeFramework() {
    await this.loadCoreAnalyzers(['javascript', 'python', 'java']);
    await this.setupLanguageDetection();
    await this.initializePatternMatching();
  }

  async detectPrimaryLanguage(errorData, projectContext) {
    const indicators = [
      this.analyzeFileExtensions(projectContext),
      this.analyzeStackTrace(errorData.stackTrace),
      this.analyzeErrorMessage(errorData.message),
      this.analyzeProjectStructure(projectContext)
    ];
    
    return this.calculateLanguageProbabilities(indicators);
  }
}
```

### Phase 2: Advanced Pattern Recognition
```javascript
// Enhanced error pattern detection
class AdvancedPatternRecognition {
  async analyzeComplexErrors(errorData, projectContext) {
    const multiLanguageContext = await this.detectMixedLanguageContext(projectContext);
    
    // Handle polyglot applications
    if (multiLanguageContext.isPolyglot) {
      return await this.analyzePolyglotErrors(errorData, multiLanguageContext);
    }
    
    // Single language with framework complexity
    return await this.analyzeFrameworkSpecificErrors(errorData, projectContext);
  }

  async generateCrossLanguageInsights(analysisResults) {
    // Identify patterns that span multiple languages
    const crossLanguagePatterns = this.findCommonPatterns(analysisResults);
    
    return {
      patterns: crossLanguagePatterns,
      recommendations: this.generatePolyglotRecommendations(crossLanguagePatterns),
      migrations: this.suggestLanguageMigrationOpportunities(analysisResults)
    };
  }
}
```

### Phase 3: Intelligent Learning
```javascript
// Self-improving error analysis
class IntelligentErrorLearning {
  async improveAnalysisAccuracy(feedbackData) {
    await this.updateLanguagePatterns(feedbackData);
    await this.refineErrorClassification(feedbackData);
    await this.enhanceFrameworkSupport(feedbackData);
  }

  async predictErrorTrends(projectHistory) {
    const languageMetrics = await this.analyzeLanguageUsage(projectHistory);
    const errorPatterns = await this.identifyRecurringPatterns(projectHistory);
    
    return this.generatePreventionStrategies(languageMetrics, errorPatterns);
  }
}
```

## Language Detection Algorithms

### File-Based Detection
```javascript
class FileBasedLanguageDetector {
  detectionRules = {
    javascript: ['.js', '.mjs', '.cjs', 'package.json'],
    typescript: ['.ts', '.tsx', 'tsconfig.json'],
    python: ['.py', '.pyw', '.pyc', 'requirements.txt', 'setup.py'],
    java: ['.java', '.class', '.jar', 'pom.xml', 'build.gradle'],
    go: ['.go', 'go.mod', 'go.sum'],
    rust: ['.rs', 'Cargo.toml', 'Cargo.lock']
  };

  async detectFromProject(projectContext) {
    const fileExtensions = this.analyzeFileExtensions(projectContext.files);
    const configFiles = this.findConfigurationFiles(projectContext.files);
    
    return this.calculateLanguageProbabilities(fileExtensions, configFiles);
  }
}
```

### Error Message Pattern Detection
```javascript
class ErrorMessageLanguageDetector {
  languageSignatures = {
    javascript: [
      /at .+ \(.+:\d+:\d+\)/,  // V8 stack trace
      /ReferenceError|TypeError|SyntaxError/,
      /node_modules/
    ],
    python: [
      /File ".+", line \d+/,    // Python traceback
      /Traceback \(most recent call last\)/,
      /IndentationError|NameError|ValueError/
    ],
    java: [
      /at .+\(.+\.java:\d+\)/,   // Java stack trace
      /Exception in thread/,
      /\w+Exception:/
    ]
  };
}
```

## Monitoring and Observability

### Domain Events for Monitoring
- **Language Detected:** Track language detection accuracy and coverage
- **Error Parsed:** Monitor parsing success rates across languages
- **Pattern Matched:** Observe pattern matching effectiveness
- **Analysis Completed:** Track overall analysis quality and performance

### Key Performance Indicators
- **Language Detection Accuracy:** Percentage of correct language identifications
- **Error Classification Precision:** Accuracy of error type classification per language
- **Analysis Coverage:** Percentage of supported error patterns per language
- **Multi-Language Handling:** Success rate for polyglot applications

## Integration Patterns

### Cross-Domain Coordination
```javascript
// Integration with other domains
class MultiLanguageErrorIntegration {
  // Integration with Plugin Management Domain
  async loadLanguagePlugin(languageId) {
    const plugin = await this.pluginManager.loadLanguageAnalyzer(languageId);
    return this.validateLanguageAnalyzerContract(plugin);
  }

  // Integration with LLM Integration Domain
  async enhanceWithLLMAnalysis(errorAnalysis, projectContext) {
    const llmPrompt = this.buildLanguageAwareLLMPrompt(errorAnalysis, projectContext);
    return await this.llmRouterService.processLanguageSpecificAnalysis(llmPrompt);
  }

  // Integration with Knowledge Management Domain
  async retrieveLanguageContext(language, errorType) {
    const query = this.buildLanguageSpecificQuery(language, errorType);
    return await this.ragService.retrieveLanguagePatterns(query);
  }
}
```

## Consequences

### Positive
- **Comprehensive Language Support:** Accurate error analysis across multiple programming languages
- **Extensible Architecture:** Easy addition of new language analyzers without core changes
- **Consistent Analysis Quality:** Unified interface and quality standards across all languages
- **Polyglot Application Support:** Effective handling of mixed-language codebases

### Negative
- **Implementation Complexity:** Multiple language-specific analyzers require significant development
- **Maintenance Overhead:** Each language analyzer needs ongoing pattern updates
- **Resource Requirements:** Memory and processing overhead for multiple analyzers

### Neutral
- **Learning Curve:** Team needs expertise in multiple programming language error patterns
- **Testing Complexity:** Comprehensive testing across all supported languages and frameworks

## Compliance and Security

### Privacy Protection
- **Code Privacy:** Secure handling of source code across different language contexts
- **Error Context Filtering:** Language-aware filtering of sensitive information
- **Cross-Language Data Protection:** Consistent privacy controls across all analyzers

### Performance Standards
- **Language Detection:** < 100ms for primary language identification
- **Error Analysis:** < 500ms for single-language error analysis
- **Multi-Language Synthesis:** < 1000ms for polyglot application analysis

---

**Related ADRs:**
- ADR-004: Error Classification System Architecture (foundational framework)
- ADR-005: Error Context Extraction Strategy (context integration)
- ADR-010: Plugin Discovery and Loading Mechanism (language plugin support)
- ADR-007: LLM Provider Router Architecture (AI-enhanced analysis)

**Domain Integration Points:**
- Plugin Management → Language analyzer plugin loading
- LLM Integration → AI-enhanced error analysis
- Knowledge Management → Language-specific pattern retrieval
- CLI Command Processing → Multi-language project detection 