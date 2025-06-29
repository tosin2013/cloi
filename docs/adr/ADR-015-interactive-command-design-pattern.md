# ADR-015: Interactive Command Design Pattern

**Status:** Accepted  
**Date:** 2024-12-14  
**Deciders:** CLOI Development Team  
**Technical Story:** [CLI Command Processing Domain Enhancement - Interactive Command Design]

## Context and Problem Statement

The CLOI system requires sophisticated interactive command patterns to provide intuitive, user-friendly command-line experiences. The system must support various interaction modes including guided workflows, progressive disclosure, contextual prompts, and adaptive interfaces that respond to user expertise levels. This capability must operate within the CLI Command Processing Domain while providing consistent interaction patterns across all commands.

### Domain-Driven Design Context

**Bounded Context:** CLI Command Processing Domain  
**Aggregate Root:** Interactive Command Processor  
**Domain Language:** Command Flow, User Interaction, Progressive Disclosure, Contextual Guidance, Adaptive Interface  
**Core Domain Events:** Command Initiated, User Prompted, Input Validated, Command Completed, Flow Interrupted

## Decision Drivers

### Domain-Driven Considerations
- **Aggregate Consistency:** Unified interaction patterns across all command types
- **Ubiquitous Language:** Consistent terminology for command interaction concepts
- **Bounded Context Integrity:** Command interaction logic contained within CLI domain
- **Domain Service Reliability:** Predictable and intuitive command experiences across all operations

### Technical Requirements
- **Multi-Modal Interaction:** Support for guided, expert, and hybrid interaction modes
- **Progressive Disclosure:** Gradual exposure of complex options based on user needs
- **Context Awareness:** Adaptive prompts based on environment and user history
- **Error Recovery:** Graceful handling of invalid inputs and interrupted workflows

## Considered Options

### Option 1: Simple Flag-Based Commands
- **Domain Impact:** Oversimplified aggregate with limited user interaction capabilities
- **Technical:** Traditional CLI with static flags and parameters
- **Pros:** Simple implementation, familiar to experienced users
- **Cons:** Poor discoverability, steep learning curve, limited guidance

### Option 2: Interactive Command Flow Engine ⭐ (Chosen)
- **Domain Impact:** Rich aggregate with sophisticated interaction orchestration
- **Technical:** Multi-modal command engine with adaptive interaction patterns
- **Pros:** Excellent user experience, progressive disclosure, context-aware guidance
- **Cons:** Higher complexity, requires careful UX design

### Option 3: External Interactive Framework
- **Domain Impact:** Violates bounded context with external UI dependencies
- **Technical:** Delegate interaction design to external CLI frameworks
- **Pros:** Reduced implementation effort, proven interaction patterns
- **Cons:** Domain boundary violation, limited customization, integration complexity

## Decision Outcome

**Chosen Option:** Interactive Command Flow Engine with Adaptive User Experience

### Domain Architecture

```
CLI Command Processing Domain
├── Interactive Command Processor (Aggregate Root)
│   ├── Command Flow Orchestrator (Entity)
│   ├── User Interaction Manager (Entity)
│   ├── Input Validator (Entity)
│   └── Context Adapter (Entity)
├── Interaction Patterns (Value Objects)
│   ├── Guided Workflow Pattern
│   ├── Expert Mode Pattern
│   ├── Contextual Prompt Pattern
│   └── Progressive Disclosure Pattern
└── Interaction Services (Domain Services)
    ├── User Experience Personalization Service
    ├── Command Suggestion Service
    ├── Input Completion Service
    └── Error Recovery Service
```

### Technical Implementation

```javascript
// Domain: CLI Command Processing
// Aggregate: Interactive Command Processor
class InteractiveCommandProcessor {
  constructor() {
    this.flowOrchestrator = new CommandFlowOrchestrator();
    this.interactionManager = new UserInteractionManager();
    this.inputValidator = new InputValidator();
    this.contextAdapter = new ContextAdapter();
  }

  async processCommand(commandDefinition, userContext, args = []) {
    // Domain Event: Command Initiated
    const command = await this.initializeCommand(commandDefinition, userContext);
    
    // Determine interaction mode
    const interactionMode = await this.determineInteractionMode(command, args, userContext);
    
    try {
      switch (interactionMode) {
        case 'guided':
          return await this.executeGuidedWorkflow(command, userContext);
        case 'expert':
          return await this.executeExpertMode(command, args, userContext);
        case 'hybrid':
          return await this.executeHybridMode(command, args, userContext);
        default:
          throw new UnknownInteractionModeError(interactionMode);
      }
    } catch (error) {
      // Domain Event: Command Error
      return await this.handleCommandError(error, command, userContext);
    }
  }

  async executeGuidedWorkflow(command, userContext) {
    const workflow = await this.flowOrchestrator.buildGuidedWorkflow(command, userContext);
    
    for (const step of workflow.steps) {
      // Domain Event: User Prompted
      const userInput = await this.interactionManager.promptUser(step, userContext);
      
      // Domain Event: Input Validated
      const validatedInput = await this.inputValidator.validate(userInput, step);
      
      // Update command state
      await this.updateCommandState(command, step, validatedInput);
    }

    // Domain Event: Command Completed
    return await this.executeCommand(command);
  }
}

// Domain Service: User Experience Personalization
class UserExperiencePersonalizationService {
  constructor() {
    this.userProfiles = new UserProfileRepository();
    this.interactionHistory = new InteractionHistoryRepository();
  }

  async personalizeInteraction(command, userContext) {
    const userProfile = await this.userProfiles.getUserProfile(userContext.userId);
    const recentHistory = await this.interactionHistory.getRecentInteractions(userContext.userId);
    
    return {
      expertiseLevel: this.assessExpertiseLevel(userProfile, recentHistory),
      preferredInteractionMode: this.determinePreferredMode(userProfile),
      contextualHints: await this.generateContextualHints(command, userProfile),
      shortcuts: this.identifyApplicableShortcuts(command, recentHistory)
    };
  }

  assessExpertiseLevel(userProfile, recentHistory) {
    const factors = {
      commandFrequency: this.analyzeCommandFrequency(recentHistory),
      errorRate: this.calculateErrorRate(recentHistory),
      completionTime: this.analyzeCompletionTimes(recentHistory),
      helpUsage: this.analyzeHelpUsage(recentHistory)
    };

    return this.calculateExpertiseScore(factors);
  }
}
```

### Domain Benefits

1. **Enhanced Domain Clarity**
   - Clear separation between command logic and interaction orchestration
   - Ubiquitous language consistent with CLI interaction concepts
   - Well-defined aggregate boundaries for command processing operations

2. **Improved Aggregate Consistency**
   - Unified interaction patterns across all command types
   - Consistent validation and error handling across all interaction modes
   - Reliable state management throughout command execution lifecycle

3. **Better Domain Service Integration**
   - Seamless integration with Configuration Management for context-aware interactions
   - Clean interfaces for Error Analysis Domain to provide meaningful error guidance
   - Efficient collaboration with Plugin Management for plugin-specific interaction patterns

4. **Adaptive User Experience**
   - Intelligent adaptation to user expertise levels and preferences
   - Context-aware command suggestions and auto-completion
   - Progressive disclosure of advanced features based on user needs

## Interaction Pattern Specifications

### Guided Workflow Pattern
```javascript
class GuidedWorkflowPattern {
  constructor() {
    this.stepGenerator = new InteractiveStepGenerator();
    this.progressTracker = new WorkflowProgressTracker();
  }

  async buildWorkflow(commandDefinition, userContext) {
    const steps = await this.stepGenerator.generateSteps(commandDefinition, userContext);
    
    return {
      id: this.generateWorkflowId(),
      command: commandDefinition.name,
      steps: steps.map(step => this.enrichStep(step, userContext)),
      totalSteps: steps.length,
      estimatedDuration: this.estimateWorkflowDuration(steps),
      canSkipSteps: this.identifySkippableSteps(steps),
      rollbackPoints: this.identifyRollbackPoints(steps)
    };
  }

  enrichStep(step, userContext) {
    return {
      ...step,
      guidance: this.generateStepGuidance(step, userContext),
      validation: this.defineStepValidation(step),
      examples: this.generateStepExamples(step),
      shortcuts: this.identifyStepShortcuts(step, userContext)
    };
  }
}
```

### Expert Mode Pattern
```javascript
class ExpertModePattern {
  constructor() {
    this.completionEngine = new CommandCompletionEngine();
    this.shortcutManager = new ShortcutManager();
  }

  async enhanceExpertExperience(command, args, userContext) {
    return {
      autoCompletion: await this.completionEngine.generateCompletions(command, args),
      shortcuts: await this.shortcutManager.getApplicableShortcuts(command, userContext),
      quickActions: this.identifyQuickActions(command, args),
      batchOperations: this.suggestBatchOperations(command, userContext),
      pipelineIntegration: this.identifyPipelineOpportunities(command, args)
    };
  }

  async processExpertCommand(command, args, userContext) {
    // Minimal prompting, maximum efficiency
    const quickValidation = await this.performQuickValidation(args);
    if (quickValidation.isValid) {
      return await this.executeDirectly(command, args);
    }
    
    // Provide targeted assistance for invalid inputs
    const corrections = await this.suggestCorrections(quickValidation.errors);
    return await this.promptForCorrections(corrections, userContext);
  }
}
```

### Progressive Disclosure Pattern
```javascript
class ProgressiveDisclosurePattern {
  constructor() {
    this.complexityAnalyzer = new CommandComplexityAnalyzer();
    this.disclosureEngine = new ProgressiveDisclosureEngine();
  }

  async buildProgressiveInterface(command, userContext) {
    const complexity = await this.complexityAnalyzer.analyzeCommand(command);
    const userExpertise = await this.assessUserExpertise(userContext);
    
    return {
      initialView: this.buildInitialView(command, userExpertise),
      expandableOptions: this.identifyExpandableOptions(command, complexity),
      conditionalFields: this.buildConditionalFields(command),
      advancedSettings: this.groupAdvancedSettings(command, complexity),
      expertBypass: this.buildExpertBypass(command, userExpertise)
    };
  }

  buildInitialView(command, userExpertise) {
    const essentialOptions = this.identifyEssentialOptions(command);
    const commonOptions = this.identifyCommonOptions(command, userExpertise);
    
    return {
      title: command.description || command.name,
      essentialOptions,
      commonOptions,
      expandTriggers: this.buildExpandTriggers(command),
      helpContext: this.buildContextualHelp(command)
    };
  }
}
```

### Contextual Prompt Pattern
```javascript
class ContextualPromptPattern {
  constructor() {
    this.contextAnalyzer = new EnvironmentContextAnalyzer();
    this.promptPersonalizer = new PromptPersonalizer();
  }

  async generateContextualPrompt(step, userContext, environmentContext) {
    const contextFactors = {
      currentDirectory: environmentContext.workingDirectory,
      projectType: environmentContext.project?.type,
      recentCommands: userContext.recentCommands,
      userPreferences: userContext.preferences,
      errorHistory: userContext.recentErrors
    };

    const personalizedPrompt = await this.promptPersonalizer
      .personalizePrompt(step.basePrompt, contextFactors);

    return {
      message: personalizedPrompt.message,
      suggestions: await this.generateContextualSuggestions(step, contextFactors),
      validation: this.buildContextualValidation(step, contextFactors),
      examples: await this.generateContextualExamples(step, contextFactors),
      shortcuts: this.identifyContextualShortcuts(step, contextFactors)
    };
  }
}
```

## Implementation Strategy

### Phase 1: Core Interaction Foundation
```javascript
// Basic interactive command support
class CoreInteractiveImplementation {
  async initializeInteractiveCommands() {
    await this.setupBasicPrompting();
    await this.initializeInputValidation();
    await this.loadInteractionPatterns();
  }

  async executeBasicInteractiveCommand(commandDef, userContext) {
    const requiredInputs = this.identifyRequiredInputs(commandDef);
    const userInputs = {};

    for (const input of requiredInputs) {
      userInputs[input.name] = await this.promptForInput(input);
    }

    return await this.executeWithInputs(commandDef, userInputs);
  }
}
```

### Phase 2: Advanced Interaction Patterns
```javascript
// Sophisticated interaction orchestration
class AdvancedInteractionEngine {
  async executeAdaptiveWorkflow(commandDef, userContext) {
    const userProfile = await this.loadUserProfile(userContext);
    const interactionStrategy = await this.selectInteractionStrategy(commandDef, userProfile);
    
    switch (interactionStrategy.type) {
      case 'guided':
        return await this.executeGuidedWorkflow(commandDef, interactionStrategy);
      case 'progressive':
        return await this.executeProgressiveDisclosure(commandDef, interactionStrategy);
      case 'contextual':
        return await this.executeContextualPrompting(commandDef, interactionStrategy);
    }
  }

  async buildDynamicInterface(commandDef, userContext) {
    const interfaceComponents = await this.generateInterfaceComponents(commandDef, userContext);
    return this.assembleAdaptiveInterface(interfaceComponents);
  }
}
```

### Phase 3: Intelligent Personalization
```javascript
// Self-improving interaction system
class IntelligentInteractionPersonalization {
  async improveInteractionExperience(interactionFeedback) {
    await this.updateUserProfiles(interactionFeedback);
    await this.refineInteractionPatterns(interactionFeedback);
    await this.enhancePromptGeneration(interactionFeedback);
  }

  async predictUserIntentions(partialInput, userContext) {
    const intentionPredictions = await this.analyzeInputPatterns(partialInput, userContext);
    return this.generateProactiveAssistance(intentionPredictions);
  }
}
```

## Monitoring and Observability

### Domain Events for Monitoring
- **Command Initiated:** Track command initiation patterns and user entry points
- **User Prompted:** Monitor prompting frequency and user response patterns
- **Input Validated:** Observe validation success rates and common error patterns
- **Command Completed:** Track completion rates and user satisfaction scores

### Key Performance Indicators
- **Interaction Completion Rate:** Percentage of started commands that complete successfully
- **User Satisfaction Score:** User-reported satisfaction with command interactions
- **Error Recovery Success:** Rate of successful error recovery during interactions
- **Efficiency Metrics:** Time-to-completion and steps-to-completion per command type

## Integration Patterns

### Cross-Domain Coordination
```javascript
// Integration with other domains
class InteractiveCommandIntegration {
  // Integration with Configuration Management Domain
  async enrichWithEnvironmentContext(prompt, environmentContext) {
    return {
      ...prompt,
      contextualHints: this.generateEnvironmentHints(environmentContext),
      defaultValues: this.deriveContextualDefaults(environmentContext),
      validationRules: this.adaptValidationToContext(prompt.validation, environmentContext)
    };
  }

  // Integration with Error Analysis Domain
  async enhanceErrorGuidance(error, userContext, commandContext) {
    const errorAnalysis = await this.errorAnalysisService.analyzeCommandError(error, commandContext);
    
    return {
      errorMessage: this.humanizeErrorMessage(errorAnalysis),
      suggestions: this.generateRecoverySuggestions(errorAnalysis),
      alternatives: this.suggestAlternativeApproaches(errorAnalysis, userContext),
      learningResources: this.recommendLearningResources(errorAnalysis)
    };
  }

  // Integration with Plugin Management Domain
  async loadPluginInteractionPatterns(pluginId) {
    const plugin = await this.pluginManager.loadPlugin(pluginId);
    return this.extractInteractionPatterns(plugin.interactionDefinition);
  }
}
```

## Consequences

### Positive
- **Enhanced User Experience:** Intuitive, adaptive command-line interactions
- **Reduced Learning Curve:** Progressive disclosure and contextual guidance
- **Improved Productivity:** Efficient workflows for both novice and expert users
- **Consistent Interaction Patterns:** Unified experience across all commands

### Negative
- **Implementation Complexity:** Sophisticated interaction logic requires significant development
- **Performance Overhead:** Interactive prompting and validation can slow command execution
- **Testing Complexity:** Comprehensive testing of interaction flows and user scenarios

### Neutral
- **User Preference Variability:** Different users prefer different interaction styles
- **Platform Dependencies:** Different interaction capabilities across terminal environments

## Compliance and Security

### User Experience Standards
- **Accessibility Compliance:** Support for screen readers and accessibility tools
- **Responsive Design:** Adaptive layouts for different terminal sizes
- **Internationalization:** Support for multiple languages and locales

### Performance Standards
- **Prompt Response Time:** < 100ms for prompt generation and display
- **Input Validation:** < 50ms for input validation and feedback
- **Workflow Completion:** < 5000ms for typical guided workflow completion

---

**Related ADRs:**
- ADR-001: CLI Unification Strategy (command processing foundation)
- ADR-014: Environment Context Detection Strategy (context-aware interactions)
- ADR-004: Error Classification System Architecture (error guidance integration)
- ADR-013: Configuration Hierarchy and Precedence (configuration-aware prompting)

**Domain Integration Points:**
- Configuration Management → Context-aware prompting
- Error Analysis → Intelligent error guidance and recovery
- Plugin Management → Plugin-specific interaction patterns
- LLM Integration → AI-powered command suggestions and assistance 