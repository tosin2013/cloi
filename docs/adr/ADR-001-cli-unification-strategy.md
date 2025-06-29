# ADR-001: CLI Unification Strategy

**Status:** Accepted  
**Date:** 2024-01-XX  
**Authors:** Development Team  
**Reviewers:** Architecture Team  
**Domain Impact:** CLI Domain (Primary), Configuration Management Domain (Secondary)

## Context and Problem Statement

The CLOI system originally had fragmented command-line interfaces with separate entry points for different functionalities. This architectural fragmentation created significant challenges in the **CLI Domain**, violating the principle of unified command management and creating inconsistent user experiences across different command execution paths.

### Domain-Driven Design Context

**Primary Bounded Context:** CLI Command Processing Domain  
**Secondary Contexts:** Configuration Management, Error Analysis Integration  
**Aggregate Root:** Unified CLI Command Router  
**Domain Language:** Command Processing, Interactive Mode, Command Routing, User Intent Recognition  
**Domain Events:** Command Parsed, Mode Selected, Interactive Session Started, Command Executed, Session Terminated

### Problem Manifestation

1. **Multiple Entry Points Creating Domain Fragmentation:**
   ```javascript
   // Before: Fragmented approach
   bin/cloi          // Main binary router
   bin/index.js      // Legacy entry point  
   src/cli/modular.js    // Enhanced CLI implementation
   src/cli/legacy-backup/index.js  // Backward compatibility
   ```

2. **Inconsistent Domain Language:**
   - Different command syntaxes across entry points
   - Inconsistent option naming and behavior
   - Fragmented help system and documentation
   - Conflicting configuration precedence

3. **Violated Aggregate Boundaries:**
   - Command processing logic scattered across multiple files
   - No single source of truth for command definition
   - Inconsistent error handling patterns
   - Duplicated validation logic

4. **User Experience Inconsistencies:**
   - Different response formats for similar operations
   - Inconsistent interactive behavior
   - Fragmented session management
   - Unpredictable command availability

## Decision Drivers

### Domain Requirements

1. **Single Aggregate Root:** All CLI commands must flow through unified command processor
2. **Ubiquitous Language Consistency:** Standardized command terminology and behavior
3. **Domain Service Integration:** Seamless interaction with Error Analysis, Configuration, and Session Management domains
4. **User Intent Recognition:** Clear mapping from user commands to domain operations

### Technical Constraints

1. **Backward Compatibility:** Existing command interfaces must continue functioning
2. **Performance Requirements:** Unified approach must not degrade command execution speed
3. **Extensibility:** Architecture must support future command additions without breaking changes
4. **Integration Points:** Must work with A2A Protocol, Plugin System, and Workflow Engine domains

## Considered Options

### Option 1: Maintain Separate Entry Points
**Domain Impact:** Continues domain fragmentation, violates single responsibility
**Pros:** 
- No migration required
- Maintains existing functionality exactly
**Cons:**
- Perpetuates domain boundary violations
- Increases maintenance complexity
- Poor user experience consistency
- Blocks evolution toward unified domain model

### Option 2: Unified CLI with Router Pattern (CHOSEN)
**Domain Impact:** Creates cohesive CLI domain with clear aggregate boundaries
**Pros:**
- Establishes single aggregate root for CLI domain
- Enables consistent domain language across all commands
- Simplifies domain service integration
- Provides clear extensibility patterns
**Cons:**
- Requires careful migration strategy
- Temporary complexity during transition
- Need for comprehensive testing

### Option 3: Complete Rewrite
**Domain Impact:** Clean domain design but breaks existing integrations
**Pros:**
- Perfect domain design from scratch
- No legacy constraints
**Cons:**
- High risk of breaking existing workflows
- Significant development time
- Loss of institutional knowledge

## Decision Outcome

### Chosen Solution

Implement a **Unified CLI Router Pattern** that consolidates all command processing through a single entry point (`src/cli/index.js`) while maintaining the modular architecture underneath.

```javascript
// Unified CLI Architecture
/**
 * CLI Domain Aggregate Root
 * Responsible for all command processing and routing
 */
class UnifiedCLIProcessor {
  constructor() {
    this.commandRegistry = new CommandRegistry();
    this.sessionManager = new SessionManager();
    this.configurationContext = new ConfigurationContext();
  }

  async processCommand(args) {
    // 1. Parse and validate command (Domain Language)
    const command = await this.parseCommand(args);
    
    // 2. Establish session context (Session Management Domain)
    const session = await this.sessionManager.initializeSession(command);
    
    // 3. Load configuration (Configuration Management Domain)
    const config = await this.configurationContext.getConfig(command.scope);
    
    // 4. Route to appropriate domain service
    return await this.routeCommand(command, session, config);
  }
}
```

### Domain-Driven Reasoning

1. **Aggregate Consistency:** Single CLI processor maintains consistency across all command operations
2. **Ubiquitous Language:** Standardized command parsing and vocabulary throughout CLI domain
3. **Domain Service Coordination:** Clear integration points with other bounded contexts
4. **Event-Driven Architecture:** Command processing triggers appropriate domain events

## Consequences

### Positive Domain Outcomes

1. **Enhanced Domain Clarity:**
   - Single source of truth for CLI command processing
   - Clear aggregate boundaries and responsibilities
   - Consistent domain language across all operations
   - Simplified domain service interactions

2. **Improved User Experience:**
   - Consistent command syntax and behavior
   - Unified help system and documentation
   - Predictable error handling and messaging
   - Seamless mode transitions (interactive ↔ command-line)

3. **Better Architecture Extensibility:**
   - Clear patterns for adding new commands
   - Standardized integration with other domains
   - Pluggable command processors for different contexts
   - Unified configuration and session management

4. **Simplified Maintenance:**
   - Single codebase for CLI logic
   - Centralized testing and validation
   - Consistent error handling patterns
   - Unified logging and monitoring

### Domain Risks and Mitigations

1. **Migration Complexity Risk:**
   - **Risk:** Breaking existing command workflows during transition
   - **Mitigation:** Phased migration with fallback mechanisms and comprehensive testing
   - **Domain Protection:** Maintain command contracts during transition

2. **Performance Impact Risk:**
   - **Risk:** Router overhead affecting command execution speed
   - **Mitigation:** Lightweight router implementation with direct command mapping
   - **Monitoring:** Performance metrics for command execution times

3. **Backward Compatibility Risk:**
   - **Risk:** Breaking existing scripts and integrations
   - **Mitigation:** Comprehensive command compatibility mapping and legacy support
   - **Validation:** Automated testing of all existing command patterns

### Implementation Impact

1. **Code Consolidation:**
   - Merge `src/cli/modular.js` functionality into `src/cli/index.js`
   - Implement command registry for extensible command definitions
   - Create unified session and configuration management

2. **Migration Strategy:**
   - Phase 1: Implement unified router with existing command support
   - Phase 2: Migrate enhanced commands to unified structure
   - Phase 3: Deprecate legacy entry points
   - Phase 4: Remove deprecated code after validation

3. **Testing Requirements:**
   - Comprehensive command compatibility testing
   - Integration testing with other domains
   - Performance regression testing
   - User acceptance testing for interactive flows

## Compliance with Domain Principles

### Ubiquitous Language ✅
- Establishes consistent CLI terminology across entire system
- Standardizes command naming, options, and help text
- Creates shared vocabulary for CLI operations

### Bounded Context Integrity ✅
- Clear boundaries between CLI domain and other contexts
- Well-defined integration points with other domains
- Prevents CLI logic leakage into other bounded contexts

### Aggregate Design ✅
- CLI Processor serves as clear aggregate root
- Maintains consistency for all CLI operations
- Encapsulates command processing logic and state

### Domain Service Collaboration ✅
- Clean integration patterns with Error Analysis, Configuration, and Session domains
- Event-driven communication with other bounded contexts
- Standardized domain service invocation patterns

## Related Decisions

- **Depends On:** None (foundational decision)
- **Influences:** 
  - ADR-003: CLI Entry Point Standardization (implementation detail)
  - ADR-013: Configuration Hierarchy and Precedence (domain interaction)
  - ADR-035: Session State Architecture (domain collaboration)
- **Related:** 
  - ADR-002: A2A Protocol Integration (CLI command exposure)
  - ADR-010: Plugin Discovery and Loading (CLI extensibility)

## Verification Criteria

### Functional Verification
- [ ] All existing commands work through unified entry point
- [ ] Interactive mode provides consistent experience
- [ ] Command help system shows unified documentation
- [ ] Error handling follows consistent patterns
- [ ] Session management works across all command types

### Domain Verification
- [ ] CLI domain has clear aggregate boundaries
- [ ] Command processing follows ubiquitous language
- [ ] Integration with other domains uses standard patterns
- [ ] Domain events are properly triggered and handled
- [ ] Domain services collaborate through defined interfaces

### Performance Verification
- [ ] Command execution time remains within acceptable bounds
- [ ] Memory usage is consistent across command types
- [ ] Interactive mode startup time is acceptable
- [ ] No performance regressions from unification

### Integration Verification
- [ ] A2A protocol commands work through unified CLI
- [ ] Plugin system integrates with command registry
- [ ] Configuration management works consistently
- [ ] Session state persists across unified interface

## Future Considerations

1. **Command Plugin Architecture:** Extension points for third-party command implementations
2. **Advanced Interactive Features:** Enhanced REPL with context awareness
3. **Command Composition:** Ability to chain and compose commands
4. **GraphQL-style Command Introspection:** Self-documenting command schema
5. **Command Authorization:** Role-based access control for different command sets

---

**Domain Maturity:** Stable (fundamental architectural pattern)  
**Review Date:** 2024-03-XX  
**Impact Assessment:** Critical (affects all CLI interactions and user experience) 