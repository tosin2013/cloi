# ADR-013: Configuration Hierarchy and Precedence

**Status:** Accepted  
**Date:** 2024-01-XX  
**Authors:** Development Team  
**Reviewers:** Architecture Team, DevOps Team, User Experience Team  
**Domain Impact:** Configuration Management Domain (Primary), CLI Domain (Secondary), Plugin Management Domain (Secondary)

## Context and Problem Statement

The CLOI system requires sophisticated configuration management with clear hierarchy and precedence rules to support diverse deployment scenarios, user preferences, and environment-specific settings. Without a coherent **Configuration Hierarchy and Precedence System**, CLOI cannot provide predictable configuration behavior, flexible customization options, or maintainable configuration across different contexts.

### Domain-Driven Design Context

**Primary Bounded Context:** Configuration Management and Environment Context Domain  
**Secondary Contexts:** CLI Domain (command-line configuration), Plugin Management (plugin-specific settings)  
**Aggregate Root:** Configuration Manager  
**Domain Language:** Configuration Hierarchy, Precedence Rules, Configuration Sources, Environment Context, Setting Inheritance, Configuration Validation, Context Resolution  
**Domain Events:** Configuration Loaded, Setting Changed, Context Switched, Validation Failed, Configuration Merged, Environment Detected

### Problem Manifestation

1. **Inconsistent Configuration Sources:**
   ```javascript
   // Before: Ad-hoc configuration loading
   const config = {
     ...require('./default-config.json'),
     ...process.env.NODE_ENV === 'production' ? prodConfig : devConfig,
     ...fs.existsSync('.cloirc') ? JSON.parse(fs.readFileSync('.cloirc')) : {},
     ...argv
   };
   
   // No clear precedence, validation, or context awareness
   ```

2. **Unclear Precedence Rules:**
   - No standardized configuration source priority
   - Missing context-aware configuration resolution
   - Lack of environment-specific configuration inheritance
   - No validation or schema enforcement across configuration layers

3. **Poor Configuration Experience:**
   - Difficult to understand which configuration values are active
   - No configuration debugging or inspection tools
   - Missing configuration documentation and schema validation
   - Limited configuration templating and dynamic resolution

4. **Management Complexity:**
   - Hard to manage configuration across different deployment environments
   - No configuration versioning or rollback capabilities
   - Missing configuration change tracking and audit trails
   - Limited configuration sharing and reuse patterns

## Decision Drivers

### Domain Requirements

1. **Clear Hierarchy:** Must define unambiguous configuration source precedence
2. **Context Awareness:** Must adapt configuration based on environment and context
3. **Validation:** Must validate configuration integrity and schema compliance
4. **Flexibility:** Must support diverse configuration patterns and customization needs

### Technical Constraints

1. **Performance:** Must load and resolve configuration efficiently
2. **Security:** Must protect sensitive configuration data appropriately
3. **Compatibility:** Must support existing configuration patterns and migration
4. **Reliability:** Must handle configuration errors gracefully without system failure

### User Experience Requirements

1. **Predictability:** Must provide predictable configuration resolution behavior
2. **Debuggability:** Must enable easy configuration inspection and troubleshooting
3. **Documentation:** Must provide clear configuration documentation and examples
4. **Migration Support:** Must facilitate easy migration from existing configuration patterns

## Considered Options

### Option 1: Simple Configuration Merging
**Domain Impact:** Basic configuration support but limited flexibility and clarity
**Pros:**
- Simple implementation with minimal complexity
- Fast configuration loading and resolution
- Easy migration from existing patterns
**Cons:**
- No clear precedence rules or documentation
- Limited context awareness and environment support
- Poor validation and error handling
- Difficult configuration debugging and inspection

### Option 2: Layered Configuration System
**Domain Impact:** Improved organization but limited intelligence and context awareness
**Pros:**
- Clear configuration layers with basic precedence
- Better organization and maintainability
- Support for environment-specific configuration
**Cons:**
- Limited dynamic configuration resolution
- Basic validation and schema support
- No advanced context awareness
- Manual configuration management

### Option 3: Intelligent Configuration Hierarchy System (CHOSEN)
**Domain Impact:** Creates comprehensive configuration domain with intelligent hierarchy and context awareness
**Pros:**
- Sophisticated configuration hierarchy with clear precedence rules
- Context-aware configuration resolution with environment detection
- Comprehensive validation and schema enforcement
- Excellent configuration debugging and management tools
- Domain-driven design with clear configuration boundaries
**Cons:**
- More complex implementation requiring sophisticated resolution engine
- Potential performance overhead for complex configuration hierarchies
- Learning curve for understanding advanced configuration patterns

## Decision Outcome

### Chosen Solution

Implement an **Intelligent Configuration Hierarchy System** with domain-driven architecture that provides comprehensive configuration management, context-aware resolution, and excellent developer experience.

```javascript
// Configuration Management Domain Architecture
class ConfigurationManager {
  constructor() {
    this.sourceRegistry = new ConfigurationSourceRegistry();
    this.hierarchyResolver = new ConfigurationHierarchyResolver();
    this.contextDetector = new EnvironmentContextDetector();
    this.validator = new ConfigurationValidator();
    this.schema = new ConfigurationSchemaManager();
    this.cache = new ConfigurationCache();
    this.monitor = new ConfigurationMonitor();
    this.merger = new IntelligentConfigurationMerger();
  }

  async loadConfiguration(context = {}) {
    // 1. Detect environment and build context
    const environmentContext = await this.detectEnvironmentContext(context);
    
    // 2. Discover and prioritize configuration sources
    const sources = await this.discoverConfigurationSources(environmentContext);
    
    // 3. Load configuration from all sources
    const configurations = await this.loadFromSources(sources, environmentContext);
    
    // 4. Apply hierarchy and precedence rules
    const mergedConfiguration = await this.applyHierarchy(configurations, environmentContext);
    
    // 5. Validate against schema
    const validatedConfiguration = await this.validateConfiguration(mergedConfiguration);
    
    // 6. Apply post-processing and resolution
    const resolvedConfiguration = await this.resolveConfiguration(validatedConfiguration, environmentContext);
    
    // 7. Cache for future use
    await this.cacheConfiguration(resolvedConfiguration, environmentContext);
    
    return resolvedConfiguration;
  }

  async discoverConfigurationSources(context) {
    // Discover configuration sources based on context
    const allSources = await this.sourceRegistry.getAllSources();
    
    // Filter sources based on availability and context
    const availableSources = await Promise.all(
      allSources.map(async source => ({
        source,
        available: await source.isAvailable(context),
        priority: await source.getPriority(context),
        context: await source.getSourceContext(context)
      }))
    );
    
    // Sort by priority (higher priority = later in merge order)
    return availableSources
      .filter(s => s.available)
      .sort((a, b) => a.priority - b.priority);
  }

  async applyHierarchy(configurations, context) {
    // Apply intelligent configuration merging with hierarchy rules
    return await this.hierarchyResolver.resolve(configurations, context);
  }
}

// Configuration Source Registry and Types
class ConfigurationSource {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.priority = config.priority || 50;
    this.conditional = config.conditional || {};
  }

  async load(context) {
    if (!await this.isAvailable(context)) {
      return null;
    }
    
    const rawConfig = await this.loadRaw(context);
    const processedConfig = await this.processConfiguration(rawConfig, context);
    
    return {
      source: this.name,
      priority: await this.getPriority(context),
      configuration: processedConfig,
      metadata: {
        loadedAt: new Date(),
        context: context,
        checksum: this.calculateChecksum(processedConfig)
      }
    };
  }

  async isAvailable(context) {
    // Check if source is available in current context
    return await this.checkAvailability(context);
  }

  async getPriority(context) {
    // Dynamic priority based on context
    let basePriority = this.priority;
    
    // Apply context-specific priority adjustments
    if (this.conditional.environment && context.environment) {
      if (this.conditional.environment[context.environment]) {
        basePriority += this.conditional.environment[context.environment].priorityAdjustment || 0;
      }
    }
    
    return basePriority;
  }

  abstract async loadRaw(context);
  abstract async checkAvailability(context);
  abstract async processConfiguration(config, context);
}

// Specific Configuration Sources
class DefaultConfigurationSource extends ConfigurationSource {
  constructor() {
    super('defaults', { priority: 10 });
    this.defaultConfig = this.loadDefaults();
  }

  async loadRaw(context) {
    return this.defaultConfig;
  }

  async checkAvailability(context) {
    return true; // Always available
  }

  async processConfiguration(config, context) {
    // Apply context-specific default overrides
    return await this.applyContextualDefaults(config, context);
  }

  loadDefaults() {
    return {
      llm: {
        provider: 'ollama',
        model: 'llama2',
        temperature: 0.7,
        maxTokens: 4000
      },
      analysis: {
        contextLines: 10,
        includeStackTrace: true,
        includeDependencies: true
      },
      ui: {
        colorOutput: true,
        verbose: false,
        interactive: true
      },
      plugins: {
        autoLoad: true,
        discoveryPaths: ['./plugins', '~/.cloi/plugins'],
        enableCommunity: true
      }
    };
  }
}

class EnvironmentVariableSource extends ConfigurationSource {
  constructor() {
    super('environment', { priority: 70 });
    this.prefix = 'CLOI_';
  }

  async loadRaw(context) {
    const envConfig = {};
    
    // Extract CLOI-specific environment variables
    Object.entries(process.env).forEach(([key, value]) => {
      if (key.startsWith(this.prefix)) {
        const configKey = key.substring(this.prefix.length).toLowerCase();
        const configPath = configKey.split('_');
        this.setNestedValue(envConfig, configPath, this.parseValue(value));
      }
    });
    
    return envConfig;
  }

  async checkAvailability(context) {
    // Check if any CLOI environment variables exist
    return Object.keys(process.env).some(key => key.startsWith(this.prefix));
  }

  async processConfiguration(config, context) {
    // Validate environment variable values
    return await this.validateEnvironmentValues(config);
  }

  parseValue(value) {
    // Smart parsing of environment variable values
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (/^\\d+$/.test(value)) return parseInt(value);
    if (/^\\d*\\.\\d+$/.test(value)) return parseFloat(value);
    if (value.startsWith('[') || value.startsWith('{')) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }

  setNestedValue(obj, path, value) {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    current[path[path.length - 1]] = value;
  }
}

class FileConfigurationSource extends ConfigurationSource {
  constructor(filePath, options = {}) {
    super(`file:${filePath}`, {
      priority: options.priority || 50,
      conditional: options.conditional || {}
    });
    this.filePath = filePath;
    this.format = options.format || this.detectFormat(filePath);
    this.optional = options.optional || false;
  }

  async loadRaw(context) {
    const fs = require('fs').promises;
    
    try {
      const content = await fs.readFile(this.resolveFilePath(context), 'utf-8');
      return await this.parseContent(content);
    } catch (error) {
      if (this.optional && error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async checkAvailability(context) {
    const fs = require('fs').promises;
    
    try {
      await fs.access(this.resolveFilePath(context));
      return true;
    } catch {
      return this.optional;
    }
  }

  async processConfiguration(config, context) {
    if (!config) return config;
    
    // Apply file-specific processing (variable substitution, etc.)
    return await this.processVariableSubstitution(config, context);
  }

  resolveFilePath(context) {
    // Resolve file path with context variables
    return this.filePath
      .replace('{{cwd}}', context.cwd || process.cwd())
      .replace('{{home}}', context.home || require('os').homedir())
      .replace('{{env}}', context.environment || 'development');
  }

  detectFormat(filePath) {
    if (filePath.endsWith('.json')) return 'json';
    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) return 'yaml';
    if (filePath.endsWith('.toml')) return 'toml';
    if (filePath.endsWith('.js')) return 'javascript';
    return 'json';
  }

  async parseContent(content) {
    switch (this.format) {
      case 'json':
        return JSON.parse(content);
      case 'yaml':
        const yaml = require('yaml');
        return yaml.parse(content);
      case 'toml':
        const toml = require('@iarna/toml');
        return toml.parse(content);
      case 'javascript':
        // Evaluate JavaScript configuration (with security considerations)
        return await this.evaluateJavaScript(content);
      default:
        throw new Error(`Unsupported configuration format: ${this.format}`);
    }
  }
}

class CLIArgumentSource extends ConfigurationSource {
  constructor() {
    super('cli-arguments', { priority: 90 });
  }

  async loadRaw(context) {
    // Parse CLI arguments with configuration mapping
    const args = context.argv || process.argv.slice(2);
    return await this.parseArguments(args);
  }

  async checkAvailability(context) {
    return (context.argv || process.argv.slice(2)).length > 0;
  }

  async processConfiguration(config, context) {
    // Validate CLI argument values
    return await this.validateCliArguments(config);
  }

  async parseArguments(args) {
    const config = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--config-')) {
        const configKey = arg.substring(9); // Remove '--config-'
        const value = args[i + 1];
        if (value && !value.startsWith('-')) {
          this.setConfigValue(config, configKey, value);
          i++; // Skip next argument as it's the value
        }
      }
    }
    
    return config;
  }

  setConfigValue(config, key, value) {
    const path = key.split('.');
    let current = config;
    
    for (let i = 0; i < path.length - 1; i++) {
      const pathKey = path[i];
      if (!(pathKey in current)) {
        current[pathKey] = {};
      }
      current = current[pathKey];
    }
    
    current[path[path.length - 1]] = this.parseCliValue(value);
  }

  parseCliValue(value) {
    // Parse CLI values with type inference
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (/^\\d+$/.test(value)) return parseInt(value);
    if (/^\\d*\\.\\d+$/.test(value)) return parseFloat(value);
    return value;
  }
}

// Configuration Hierarchy Resolver
class ConfigurationHierarchyResolver {
  constructor() {
    this.mergingStrategies = new Map([
      ['replace', new ReplaceStrategy()],
      ['merge', new DeepMergeStrategy()],
      ['append', new AppendStrategy()],
      ['prepend', new PrependStrategy()],
      ['intelligent', new IntelligentMergeStrategy()]
    ]);
  }

  async resolve(configurations, context) {
    // Sort configurations by priority (lowest to highest)
    const sortedConfigs = configurations
      .filter(c => c && c.configuration)
      .sort((a, b) => a.priority - b.priority);

    // Apply hierarchical merging
    let resolvedConfig = {};
    const mergingHistory = [];
    
    for (const configItem of sortedConfigs) {
      const strategy = this.determineMergingStrategy(configItem, context);
      const mergeResult = await strategy.merge(resolvedConfig, configItem.configuration, context);
      
      resolvedConfig = mergeResult.result;
      mergingHistory.push({
        source: configItem.source,
        strategy: strategy.name,
        changes: mergeResult.changes,
        conflicts: mergeResult.conflicts
      });
    }

    return {
      configuration: resolvedConfig,
      metadata: {
        sources: sortedConfigs.map(c => c.source),
        mergingHistory,
        resolvedAt: new Date(),
        context
      }
    };
  }

  determineMergingStrategy(configItem, context) {
    // Determine optimal merging strategy based on source and content
    if (configItem.source === 'cli-arguments') {
      return this.mergingStrategies.get('replace');
    }
    
    if (configItem.source.startsWith('environment')) {
      return this.mergingStrategies.get('replace');
    }
    
    return this.mergingStrategies.get('intelligent');
  }
}

// Merging Strategies
class MergingStrategy {
  constructor(name) {
    this.name = name;
  }

  async merge(base, override, context) {
    throw new Error('Merging strategy must implement merge method');
  }
}

class IntelligentMergeStrategy extends MergingStrategy {
  constructor() {
    super('intelligent');
  }

  async merge(base, override, context) {
    const result = {};
    const changes = [];
    const conflicts = [];

    // Deep merge with intelligent conflict resolution
    await this.intelligentMerge(base, override, result, '', changes, conflicts, context);

    return { result, changes, conflicts };
  }

  async intelligentMerge(base, override, result, path, changes, conflicts, context) {
    // Merge objects intelligently based on key types and values
    const allKeys = new Set([...Object.keys(base || {}), ...Object.keys(override || {})]);
    
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const baseValue = base?.[key];
      const overrideValue = override?.[key];

      if (overrideValue === undefined) {
        // Key only in base
        result[key] = baseValue;
      } else if (baseValue === undefined) {
        // Key only in override
        result[key] = overrideValue;
        changes.push({ path: currentPath, action: 'added', value: overrideValue });
      } else if (this.shouldDeepMerge(baseValue, overrideValue)) {
        // Both are objects - deep merge
        result[key] = {};
        await this.intelligentMerge(baseValue, overrideValue, result[key], currentPath, changes, conflicts, context);
      } else {
        // Value replacement
        if (JSON.stringify(baseValue) !== JSON.stringify(overrideValue)) {
          changes.push({ 
            path: currentPath, 
            action: 'replaced', 
            oldValue: baseValue, 
            newValue: overrideValue 
          });
          
          if (this.isSignificantConflict(baseValue, overrideValue)) {
            conflicts.push({
              path: currentPath,
              baseValue,
              overrideValue,
              resolution: 'override-wins'
            });
          }
        }
        result[key] = overrideValue;
      }
    }
  }

  shouldDeepMerge(baseValue, overrideValue) {
    return (
      typeof baseValue === 'object' && 
      typeof overrideValue === 'object' &&
      baseValue !== null && 
      overrideValue !== null &&
      !Array.isArray(baseValue) && 
      !Array.isArray(overrideValue)
    );
  }

  isSignificantConflict(baseValue, overrideValue) {
    // Determine if this represents a significant configuration conflict
    return (
      typeof baseValue !== typeof overrideValue ||
      (typeof baseValue === 'boolean' && typeof overrideValue === 'boolean') ||
      (Array.isArray(baseValue) && !Array.isArray(overrideValue))
    );
  }
}

// Environment Context Detection
class EnvironmentContextDetector {
  async detectContext(explicitContext = {}) {
    const context = {
      ...explicitContext,
      environment: await this.detectEnvironment(explicitContext),
      runtime: await this.detectRuntime(),
      platform: await this.detectPlatform(),
      project: await this.detectProject(),
      user: await this.detectUser(),
      ci: await this.detectCI(),
      containerization: await this.detectContainerization()
    };

    return context;
  }

  async detectEnvironment(explicitContext) {
    // Environment detection with multiple sources
    if (explicitContext.environment) {
      return explicitContext.environment;
    }
    
    if (process.env.NODE_ENV) {
      return process.env.NODE_ENV;
    }
    
    if (process.env.CLOI_ENV) {
      return process.env.CLOI_ENV;
    }
    
    // Detect based on other indicators
    if (process.env.CI || process.env.GITHUB_ACTIONS) {
      return 'ci';
    }
    
    if (process.env.DOCKER_CONTAINER) {
      return 'container';
    }
    
    return 'development';
  }

  async detectProject() {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      // Look for package.json
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      
      return {
        name: packageJson.name,
        version: packageJson.version,
        type: 'node',
        root: process.cwd()
      };
    } catch {
      return {
        name: path.basename(process.cwd()),
        type: 'unknown',
        root: process.cwd()
      };
    }
  }
}

// Configuration Validation
class ConfigurationValidator {
  constructor() {
    this.schemaValidator = new ConfigurationSchemaValidator();
    this.semanticValidator = new SemanticConfigurationValidator();
    this.securityValidator = new SecurityConfigurationValidator();
  }

  async validate(configuration) {
    const validationResults = await Promise.all([
      this.schemaValidator.validate(configuration),
      this.semanticValidator.validate(configuration),
      this.securityValidator.validate(configuration)
    ]);

    return this.combineValidationResults(validationResults);
  }

  combineValidationResults(results) {
    const combined = {
      isValid: results.every(r => r.isValid),
      errors: [],
      warnings: [],
      suggestions: []
    };

    results.forEach(result => {
      combined.errors.push(...(result.errors || []));
      combined.warnings.push(...(result.warnings || []));
      combined.suggestions.push(...(result.suggestions || []));
    });

    return combined;
  }
}
```

### Domain-Driven Reasoning

1. **Configuration Domain Encapsulation:** Each configuration source encapsulates domain knowledge about its loading and processing patterns
2. **Hierarchy-Driven Resolution:** Resolver embodies domain expertise about configuration precedence and merging strategies
3. **Context-Aware Architecture:** Domain language focuses on environment detection and context-sensitive configuration
4. **Validation-First Design:** Clear domain boundaries enable comprehensive configuration validation and security

## Consequences

### Positive Domain Outcomes

1. **Predictable Configuration Behavior:**
   - Clear configuration hierarchy with documented precedence rules
   - Context-aware configuration resolution based on environment detection
   - Comprehensive validation ensuring configuration integrity and security
   - Intelligent merging strategies preventing configuration conflicts

2. **Excellent Developer Experience:**
   - Configuration debugging tools with source tracing and conflict resolution
   - Comprehensive configuration documentation with examples and schemas
   - Configuration templating and variable substitution capabilities
   - Easy migration from existing configuration patterns

3. **Flexible Configuration Management:**
   - Multiple configuration sources with dynamic priority adjustment
   - Environment-specific configuration inheritance and overrides
   - Plugin-specific configuration namespacing and isolation
   - Configuration versioning and rollback capabilities

4. **Operational Excellence:**
   - Configuration change tracking and audit trails
   - Security validation preventing sensitive data exposure
   - Performance optimization with configuration caching and lazy loading
   - Configuration monitoring and alerting for production environments

### Implementation Impact

1. **Configuration Source Registration:**
   ```javascript
   // Register configuration sources with hierarchy
   const configManager = new ConfigurationManager();
   
   await configManager.registerSource(new DefaultConfigurationSource());
   await configManager.registerSource(new FileConfigurationSource('./.cloirc.json', { priority: 40 }));
   await configManager.registerSource(new FileConfigurationSource('~/.cloi/config.yaml', { priority: 50 }));
   await configManager.registerSource(new EnvironmentVariableSource());
   await configManager.registerSource(new CLIArgumentSource());
   ```

2. **Configuration Schema Definition:**
   ```json
   {
     "llm": {
       "type": "object",
       "properties": {
         "provider": { "type": "string", "enum": ["ollama", "claude", "openai"] },
         "model": { "type": "string" },
         "temperature": { "type": "number", "minimum": 0, "maximum": 2 },
         "maxTokens": { "type": "integer", "minimum": 1 }
       }
     },
     "analysis": {
       "type": "object",
       "properties": {
         "contextLines": { "type": "integer", "minimum": 0, "maximum": 50 },
         "includeStackTrace": { "type": "boolean" }
       }
     }
   }
   ```

## Verification Criteria

### Hierarchy Verification
- [ ] Configuration sources load in correct priority order
- [ ] Precedence rules resolve conflicts predictably
- [ ] Context-aware configuration adapts to environment changes
- [ ] Configuration merging preserves important settings appropriately

### Validation Verification
- [ ] Schema validation catches configuration errors effectively
- [ ] Security validation prevents sensitive data exposure
- [ ] Semantic validation ensures configuration makes sense
- [ ] Error messages provide clear guidance for fixing issues

### Performance Verification
- [ ] Configuration loading completes within acceptable time limits
- [ ] Configuration caching improves repeated access performance
- [ ] Memory usage remains bounded with large configuration hierarchies
- [ ] Configuration change detection operates efficiently

---

**Domain Maturity:** Core (essential domain with significant optimization potential)  
**Review Date:** 2024-03-XX  
**Impact Assessment:** High (enables flexible and maintainable configuration management) 