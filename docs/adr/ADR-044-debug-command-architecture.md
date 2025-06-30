# ADR-044: Debug Command Architecture

**Status:** Accepted  
**Date:** 2024-12-29  
**Deciders:** CLOI Development Team  
**Technical Story:** [CLI Unification Strategy - Debug Interface Component]

## Context and Problem Statement

The CLOI system requires sophisticated debug capabilities that span multiple interaction modes (CLI flags, interactive commands, A2A protocol) and integrate with various system components (error analysis, auto-repair, RAG system). Without a coherent **Debug Command Architecture**, users would face inconsistent debugging experiences and developers would struggle to maintain debugging functionality across the expanding system.

### Domain-Driven Design Context

**Bounded Context:** CLI Command Processing Domain  
**Aggregate Root:** Debug Command Processor  
**Domain Language:** Debug Sessions, Auto-Fix Loops, Error Analysis, Command Iteration, Patch Application, Debug History  
**Core Domain Events:** Debug Session Started, Error Analyzed, Fix Generated, Patch Applied, Session Completed

## Decision Drivers

### Domain-Driven Considerations
- **Aggregate Consistency:** Debug operations must maintain coherent state across interaction modes
- **Ubiquitous Language:** Clear terminology for debugging operations and session management
- **Bounded Context Integrity:** Debug functionality shouldn't leak implementation details
- **Domain Service Reliability:** Consistent debugging experience across CLI, interactive, and A2A modes

### Technical Requirements
- **Multi-Modal Interface:** Support CLI flags (`--debug`), interactive commands (`/debug`), and A2A protocol
- **Iterative Auto-Fix:** Intelligent loop for analyzing and fixing errors through multiple iterations
- **Context-Aware Analysis:** Integration with RAG system for project-specific debugging insights
- **Session Persistence:** Debug history tracking and replay capabilities
- **Graceful Degradation:** Functional debugging even when AI services unavailable

## Considered Options

### Option 1: Simple Error Display Debug Mode
- **Domain Impact:** Limited aggregate with basic error visibility
- **Technical:** CLI flag that shows verbose error output without auto-fix capabilities
- **Pros:** Simple implementation, minimal resource usage
- **Cons:** Poor user experience, no intelligent error resolution, limited domain value

### Option 2: AI-Powered Auto-Fix Debug System ⭐ (Chosen)
- **Domain Impact:** Rich aggregate with comprehensive debugging lifecycle management
- **Technical:** Multi-modal debug interface with iterative auto-fix loops and context-aware analysis
- **Pros:** Intelligent error resolution, excellent user experience, domain-aligned architecture
- **Cons:** Higher complexity, requires AI integration, resource overhead

### Option 3: External Debug Service Integration
- **Domain Impact:** Violates bounded context by delegating debug operations externally
- **Technical:** Integrate with external debugging services or IDEs
- **Pros:** Leverages existing tools, reduced implementation effort
- **Cons:** Domain boundary violation, loss of local control, dependency risks

## Decision Outcome

**Chosen Option:** AI-Powered Auto-Fix Debug System with Multi-Modal Interface

### Domain Architecture

```
CLI Command Processing Domain
├── Debug Command Processor (Aggregate Root)
│   ├── Debug Session Manager (Entity)
│   ├── Auto-Fix Loop Controller (Entity)
│   ├── Error Analysis Coordinator (Entity)
│   └── Debug History Tracker (Entity)
├── Debug Interface Adapters (Value Objects)
│   ├── CLI Debug Adapter (--debug flag)
│   ├── Interactive Debug Adapter (/debug command)
│   └── A2A Debug Adapter (protocol command)
├── Debug Session State (Value Objects)
│   ├── Session Context
│   ├── Iteration History
│   ├── Fix Attempts
│   └── Success Metrics
└── Debug Services (Domain Services)
    ├── Error Classification Service
    ├── Fix Generation Service
    ├── Patch Application Service
    └── Context Enrichment Service
```

### Technical Implementation

```javascript
// Domain: CLI Command Processing
// Aggregate: Debug Command Processor
class DebugCommandProcessor {
  constructor() {
    this.sessionManager = new DebugSessionManager();
    this.autoFixController = new AutoFixLoopController();
    this.errorAnalyzer = new ErrorAnalysisCoordinator();
    this.historyTracker = new DebugHistoryTracker();
  }

  async executeDebugCommand(command, mode, options = {}) {
    // Domain Event: Debug Session Started
    const session = await this.sessionManager.createSession({
      command,
      mode, // 'cli' | 'interactive' | 'a2a'
      timestamp: new Date(),
      context: await this.gatherDebugContext(options)
    });

    // Domain Event: Auto-Fix Loop Initiated
    const result = await this.autoFixController.executeAutoFixLoop(
      session, 
      command, 
      options
    );

    // Domain Event: Debug Session Completed
    await this.sessionManager.completeSession(session, result);
    
    return {
      success: result.success,
      iterations: result.iterations,
      finalCommand: result.finalCommand,
      sessionId: session.id,
      fixes: result.appliedFixes
    };
  }
}

// Entity: Auto-Fix Loop Controller
class AutoFixLoopController {
  async executeAutoFixLoop(session, initialCommand, options) {
    const iterations = [];
    let currentCommand = initialCommand;
    const maxIterations = options.maxIterations || 5;

    for (let i = 0; i < maxIterations; i++) {
      // Domain Event: Command Execution Attempted
      const result = await this.executeCommand(currentCommand);
      
      if (result.success) {
        // Domain Event: Debug Success Achieved
        return { success: true, iterations, finalCommand: currentCommand };
      }

      // Domain Event: Error Analysis Started
      const analysis = await this.errorAnalyzer.analyzeError(
        result.error, 
        session.context
      );

      // Domain Event: Fix Generation Attempted
      const fix = await this.generateFix(analysis, iterations, session.context);
      
      if (!fix.success) {
        break;
      }

      // Domain Event: Fix Application Attempted
      const applied = await this.applyFix(fix, session.context);
      
      iterations.push({
        iteration: i + 1,
        command: currentCommand,
        error: result.error,
        analysis: analysis,
        fix: fix,
        applied: applied
      });

      if (fix.type === 'TERMINAL_COMMAND_ERROR') {
        currentCommand = fix.newCommand;
      } else if (fix.type === 'CODE_ISSUE') {
        // Patch applied, retry original command
        // currentCommand remains the same
      }
    }

    return { success: false, iterations, reason: 'max_iterations_reached' };
  }
}
```

### Multi-Modal Interface Pattern

```javascript
// CLI Debug Flag Implementation
class CLIDebugAdapter {
  async handleDebugFlag(command, argv) {
    const options = {
      verbose: argv.debug,
      model: argv.model || await this.getDefaultModel(),
      maxIterations: argv.limit || 5,
      mode: 'cli'
    };

    return await this.debugProcessor.executeDebugCommand(command, 'cli', options);
  }
}

// Interactive Debug Command Implementation  
class InteractiveDebugAdapter {
  async handleDebugCommand(lastCommand, sessionContext) {
    if (!lastCommand) {
      throw new Error('No command to debug. Try running a command first.');
    }

    const options = {
      model: sessionContext.currentModel,
      interactive: true,
      confirmationRequired: true,
      mode: 'interactive'
    };

    return await this.debugProcessor.executeDebugCommand(
      lastCommand, 
      'interactive', 
      options
    );
  }
}

// A2A Protocol Debug Implementation
class A2ADebugAdapter {
  async handleDebugCommand(commandText, requestContext) {
    const options = {
      model: 'phi4:latest', // A2A preferred model
      timeout: 30000,
      mode: 'a2a',
      clientId: requestContext.clientId
    };

    const result = await this.debugProcessor.executeDebugCommand(
      commandText,
      'a2a', 
      options
    );

    return this.formatA2AResponse(result);
  }
}
```

### Debug Session Management

```javascript
// Debug Session State Management
class DebugSessionManager {
  async createSession(sessionData) {
    const session = {
      id: this.generateSessionId(),
      ...sessionData,
      iterations: [],
      status: 'active',
      createdAt: new Date(),
      context: await this.contextService.enrichDebugContext(sessionData.context)
    };

    await this.persistSession(session);
    return session;
  }

  async completeSession(session, result) {
    session.status = result.success ? 'completed' : 'failed';
    session.completedAt = new Date();
    session.result = result;

    // Generate debug log for history
    const debugLog = this.generateDebugLog(session);
    await this.saveDebugLog(session.id, debugLog);
    
    return session;
  }

  generateDebugLog(session) {
    return {
      sessionId: session.id,
      command: session.command,
      mode: session.mode,
      duration: session.completedAt - session.createdAt,
      iterations: session.result.iterations,
      success: session.result.success,
      context: {
        projectRoot: session.context.projectRoot,
        environment: session.context.environment.summary,
        ragAvailable: session.context.ragAvailable
      }
    };
  }
}
```

## Implementation Strategy

### Phase 1: Core Debug Architecture
```javascript
// Basic debug command implementation with session management
class Phase1DebugImplementation {
  async initializeDebugSystem() {
    await this.setupSessionManager();
    await this.configureAutoFixLoop();
    await this.integrateWithErrorAnalysis();
  }
}
```

### Phase 2: Multi-Modal Interface Integration
```javascript
// Enhanced debug with CLI, interactive, and A2A support
class Phase2DebugImplementation {
  async enhanceDebugInterfaces() {
    await this.implementCLIDebugAdapter();
    await this.enhanceInteractiveDebugCommand();
    await this.integrateA2ADebugProtocol();
  }
}
```

### Phase 3: Advanced Debug Features
```javascript
// Context-aware debugging with RAG and advanced analysis
class Phase3DebugImplementation {
  async deployAdvancedDebug() {
    await this.integrateRAGContextEnrichment();
    await this.implementAdvancedSessionManagement();
    await this.addDebugAnalyticsAndMetrics();
  }
}
```

## Consequences

### Positive
- **Comprehensive Debug Experience:** Unified debugging across all interaction modes
- **Intelligent Error Resolution:** AI-powered auto-fix capabilities with iterative improvement
- **Context-Aware Analysis:** Integration with RAG system for project-specific insights
- **Session Persistence:** Debug history tracking enables learning and troubleshooting
- **Domain Alignment:** Clear separation of debug concerns within CLI Command Processing

### Negative
- **Implementation Complexity:** Multi-modal interface requires careful state management
- **Resource Overhead:** AI integration and context enrichment increase computational requirements
- **Learning Curve:** Advanced debug features require user education

## Compliance and Security

### Debug Data Privacy
- **Context Filtering:** Secure handling of sensitive debug context and error information
- **Session Isolation:** Proper isolation of debug sessions and history
- **Audit Logging:** Comprehensive logging of debug operations for troubleshooting

### Performance Standards
- **Debug Session Startup:** < 500ms for debug command initiation
- **Auto-Fix Iteration Time:** < 30 seconds per iteration including AI analysis
- **Context Enrichment:** < 2 seconds for RAG and environment context gathering

---

**Related ADRs:**
- ADR-001: CLI Unification Strategy (debug interface integration)
- ADR-003: CLI Entry Point Standardization (debug flag implementation)
- ADR-004: Error Classification System Architecture (error analysis integration)
- ADR-005: Error Context Extraction Strategy (debug context gathering)
- ADR-006: Multi-Language Error Analysis Framework (language-aware debugging)
- ADR-009: RAG System Architecture (context-aware debug analysis)
- ADR-012: Workflow Engine Architecture (auto-repair integration)
- ADR-015: Interactive Command Design Pattern (interactive debug commands)

**Domain Integration Points:**
- Error Analysis → Debug error classification and context extraction
- RAG System → Context-aware debugging with project-specific insights
- Workflow Engine → Auto-repair workflow coordination for complex fixes
- Session Management → Debug session persistence and history tracking 