# ADR-035: Session State Architecture

**Status:** Accepted  
**Date:** 2024-12-14  
**Deciders:** CLOI Development Team  
**Technical Story:** [Configuration Management Domain Enhancement - Session State Management]

## Context and Problem Statement

The CLOI system requires sophisticated session state management to maintain context across user interactions, preserve command history, manage workflow states, and provide personalized experiences. The system must handle both short-term interaction state and long-term user preferences while operating within the Configuration Management Domain and providing state coordination across all system domains.

### Domain-Driven Design Context

**Bounded Context:** Configuration Management Domain  
**Aggregate Root:** Session State Manager  
**Domain Language:** Session Context, State Persistence, Interaction History, User Preferences, Workflow State  
**Core Domain Events:** Session Started, State Updated, Session Persisted, State Restored, Session Expired

## Decision Drivers

### Domain-Driven Considerations
- **Aggregate Consistency:** Unified session state representation across all system interactions
- **Ubiquitous Language:** Consistent terminology for session and state management concepts
- **Bounded Context Integrity:** Session state logic contained within configuration management domain
- **Domain Service Reliability:** Consistent state persistence and restoration across system restarts

### Technical Requirements
- **Multi-Layer State Management:** Support for interaction, session, and persistent user state
- **State Synchronization:** Consistent state across concurrent sessions and distributed components
- **Performance Optimization:** Efficient state storage and retrieval for interactive experiences
- **Data Privacy:** Secure handling of user data with appropriate retention policies

## Considered Options

### Option 1: Simple In-Memory State Storage
- **Domain Impact:** Oversimplified aggregate with limited state persistence capabilities
- **Technical:** Basic in-memory storage with no persistence across restarts
- **Pros:** Simple implementation, fast access, minimal storage requirements
- **Cons:** Data loss on restart, no cross-session continuity, limited scalability

### Option 2: Layered State Architecture with Hybrid Storage ⭐ (Chosen)
- **Domain Impact:** Rich aggregate with comprehensive state management capabilities
- **Technical:** Multi-tier storage combining memory, disk, and optional cloud persistence
- **Pros:** Comprehensive state management, performance optimization, data persistence
- **Cons:** Higher complexity, requires careful state synchronization

### Option 3: External State Management Service
- **Domain Impact:** Violates bounded context with external state dependencies
- **Technical:** Delegate state management to external services or databases
- **Pros:** Proven state management, reduced implementation complexity
- **Cons:** Domain boundary violation, latency overhead, dependency complexity

## Decision Outcome

**Chosen Option:** Layered State Architecture with Hybrid Storage and Privacy Controls

### Domain Architecture

```
Configuration Management Domain
├── Session State Manager (Aggregate Root)
│   ├── Session Controller (Entity)
│   ├── State Persistence Layer (Entity)
│   ├── State Synchronizer (Entity)
│   └── Privacy Controller (Entity)
├── State Layers (Value Objects)
│   ├── Interaction State
│   ├── Session State
│   ├── User Preferences
│   └── Workflow State
└── State Services (Domain Services)
    ├── State Serialization Service
    ├── State Encryption Service
    ├── State Cleanup Service
    └── State Migration Service
```

### Technical Implementation

```javascript
// Domain: Configuration Management
// Aggregate: Session State Manager
class SessionStateManager {
  constructor() {
    this.sessionController = new SessionController();
    this.persistenceLayer = new StatePersistenceLayer();
    this.stateSynchronizer = new StateSynchronizer();
    this.privacyController = new PrivacyController();
  }

  async initializeSession(userId, sessionOptions = {}) {
    // Domain Event: Session Started
    const sessionId = this.generateSessionId();
    const session = await this.sessionController.createSession(
      sessionId, userId, sessionOptions
    );

    // Load existing user state
    const userState = await this.persistenceLayer.loadUserState(userId);
    
    // Initialize session with user preferences
    await this.initializeSessionState(session, userState);

    // Domain Event: State Restored
    return {
      sessionId,
      session,
      restored: userState !== null,
      timestamp: new Date().toISOString()
    };
  }

  async updateSessionState(sessionId, stateUpdate, options = {}) {
    const session = await this.sessionController.getSession(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    // Domain Event: State Update Started
    const updatedState = await this.mergeStateUpdate(session.state, stateUpdate);
    
    // Apply privacy controls
    const sanitizedState = await this.privacyController
      .sanitizeState(updatedState, session.userId);

    // Update session state
    await this.sessionController.updateSessionState(sessionId, sanitizedState);

    // Persist if required
    if (options.persist || this.shouldAutoPersist(stateUpdate)) {
      // Domain Event: State Persisted
      await this.persistenceLayer.persistState(session.userId, sanitizedState);
    }

    // Synchronize with other sessions
    if (options.sync !== false) {
      await this.stateSynchronizer.synchronizeUserSessions(session.userId, sanitizedState);
    }

    return updatedState;
  }
}

// Domain Service: State Persistence Layer
class StatePersistenceLayer {
  constructor() {
    this.memoryStore = new MemoryStateStore();
    this.diskStore = new DiskStateStore();
    this.encryptionService = new StateEncryptionService();
  }

  async persistState(userId, state) {
    const persistenceStrategy = this.determinePersistenceStrategy(state);
    
    switch (persistenceStrategy.type) {
      case 'memory-only':
        await this.memoryStore.store(userId, state);
        break;
      case 'disk-persistent':
        const encryptedState = await this.encryptionService.encrypt(state, userId);
        await this.diskStore.store(userId, encryptedState);
        break;
      case 'hybrid':
        await this.memoryStore.store(userId, state);
        const encryptedPersistent = await this.encryptionService
          .encrypt(persistenceStrategy.persistentData, userId);
        await this.diskStore.store(userId, encryptedPersistent);
        break;
    }
  }

  async loadUserState(userId) {
    const diskState = await this.diskStore.load(userId);
    const memoryState = await this.memoryStore.load(userId);

    if (diskState) {
      const decryptedState = await this.encryptionService.decrypt(diskState, userId);
      return this.mergeStates(decryptedState, memoryState);
    }

    return memoryState;
  }
}
```

### Domain Benefits

1. **Enhanced Domain Clarity**
   - Clear separation between session management and configuration persistence
   - Ubiquitous language consistent with state management concepts
   - Well-defined aggregate boundaries for session state operations

2. **Improved Aggregate Consistency**
   - Unified session state representation across all system components
   - Consistent state synchronization across concurrent sessions
   - Reliable state persistence and restoration mechanisms

3. **Better Domain Service Integration**
   - Seamless integration with CLI Command Processing for command context preservation
   - Clean interfaces for Error Analysis Domain to maintain diagnostic history
   - Efficient collaboration with Workflow Engine for workflow state management

4. **Privacy-First State Management**
   - Built-in privacy controls for sensitive user data
   - Configurable data retention and cleanup policies
   - Secure state encryption and access controls

## State Layer Specifications

### Interaction State Layer
```javascript
class InteractionStateLayer {
  constructor() {
    this.currentCommand = null;
    this.commandHistory = [];
    this.contextStack = [];
    this.temporaryVariables = new Map();
  }

  updateInteractionState(interaction) {
    return {
      currentCommand: interaction.command,
      commandHistory: this.addToHistory(interaction),
      contextStack: this.updateContextStack(interaction),
      temporaryVariables: this.updateTemporaryVariables(interaction),
      timestamp: new Date().toISOString()
    };
  }

  getInteractionContext() {
    return {
      current: this.currentCommand,
      history: this.commandHistory.slice(-10), // Last 10 commands
      context: this.contextStack.slice(-5),    // Last 5 context items
      variables: Object.fromEntries(this.temporaryVariables)
    };
  }
}
```

### Session State Layer
```javascript
class SessionStateLayer {
  constructor() {
    this.sessionId = null;
    this.userId = null;
    this.startTime = null;
    this.lastActivity = null;
    this.preferences = new Map();
    this.workflowStates = new Map();
  }

  initializeSession(sessionId, userId, preferences = {}) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.startTime = new Date().toISOString();
    this.lastActivity = this.startTime;
    this.preferences = new Map(Object.entries(preferences));
    
    return this.getSessionSnapshot();
  }

  updateActivity() {
    this.lastActivity = new Date().toISOString();
  }

  getSessionSnapshot() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      startTime: this.startTime,
      lastActivity: this.lastActivity,
      duration: this.calculateSessionDuration(),
      preferences: Object.fromEntries(this.preferences),
      workflowStates: Object.fromEntries(this.workflowStates)
    };
  }
}
```

### User Preferences Layer
```javascript
class UserPreferencesLayer {
  constructor() {
    this.interface = new Map();
    this.ai = new Map();
    this.privacy = new Map();
    this.workflows = new Map();
  }

  setPreference(category, key, value) {
    if (!this[category]) {
      throw new InvalidPreferenceCategoryError(category);
    }
    
    this[category].set(key, {
      value,
      timestamp: new Date().toISOString(),
      source: 'user'
    });
  }

  getPreferences(category = null) {
    if (category) {
      return Object.fromEntries(this[category] || new Map());
    }
    
    return {
      interface: Object.fromEntries(this.interface),
      ai: Object.fromEntries(this.ai),
      privacy: Object.fromEntries(this.privacy),
      workflows: Object.fromEntries(this.workflows)
    };
  }
}
```

### Workflow State Layer
```javascript
class WorkflowStateLayer {
  constructor() {
    this.activeWorkflows = new Map();
    this.completedWorkflows = [];
    this.pausedWorkflows = new Map();
  }

  startWorkflow(workflowId, definition, initialState = {}) {
    const workflow = {
      id: workflowId,
      definition,
      state: initialState,
      startTime: new Date().toISOString(),
      status: 'active',
      currentStep: 0,
      stepHistory: []
    };
    
    this.activeWorkflows.set(workflowId, workflow);
    return workflow;
  }

  updateWorkflowState(workflowId, stateUpdate) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new WorkflowNotFoundError(workflowId);
    }
    
    workflow.state = { ...workflow.state, ...stateUpdate };
    workflow.lastUpdate = new Date().toISOString();
    
    return workflow;
  }

  completeWorkflow(workflowId, result) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow) {
      workflow.status = 'completed';
      workflow.endTime = new Date().toISOString();
      workflow.result = result;
      
      this.activeWorkflows.delete(workflowId);
      this.completedWorkflows.push(workflow);
    }
  }
}
```

## Implementation Strategy

### Phase 1: Core State Management
```javascript
// Basic state management implementation
class CoreStateManagement {
  async initializeBasicStateManagement() {
    await this.setupMemoryStorage();
    await this.initializeSessionTracking();
    await this.loadBasicPreferences();
  }

  async createBasicSession(userId) {
    const sessionId = this.generateSessionId();
    const session = {
      id: sessionId,
      userId,
      startTime: new Date().toISOString(),
      state: this.createInitialState()
    };
    
    await this.memoryStore.store(sessionId, session);
    return session;
  }
}
```

### Phase 2: Advanced State Persistence
```javascript
// Comprehensive state management
class AdvancedStateManagement {
  async implementAdvancedStatePersistence() {
    await this.setupHybridStorage();
    await this.initializeStateEncryption();
    await this.implementStateSynchronization();
  }

  async createAdvancedSession(userId, options) {
    const session = await this.createBasicSession(userId);
    
    // Load user preferences
    const preferences = await this.loadUserPreferences(userId);
    session.preferences = preferences;
    
    // Initialize workflow states
    session.workflows = await this.loadUserWorkflows(userId);
    
    // Setup state synchronization
    await this.setupSessionSynchronization(session);
    
    return session;
  }
}
```

### Phase 3: Intelligent State Management
```javascript
// Self-optimizing state management
class IntelligentStateManagement {
  async optimizeStateManagement(usagePatterns, performanceMetrics) {
    await this.optimizeStorageStrategy(usagePatterns);
    await this.refineStateRetentionPolicies(performanceMetrics);
    await this.enhanceStatePrediction(usagePatterns);
  }

  async predictUserNeeds(sessionHistory, currentContext) {
    const predictions = await this.analyzeStatePatterns(sessionHistory, currentContext);
    return this.generateProactiveStatePreparation(predictions);
  }
}
```

## Monitoring and Observability

### Domain Events for Monitoring
- **Session Started:** Track session creation patterns and user engagement
- **State Updated:** Monitor state change frequency and patterns
- **State Persisted:** Observe persistence success rates and performance
- **Session Expired:** Track session duration and expiration reasons

### Key Performance Indicators
- **Session Duration:** Average and distribution of user session lengths
- **State Update Frequency:** Rate of state changes per session
- **Persistence Success Rate:** Percentage of successful state saves
- **Memory Usage Efficiency:** Memory consumption per active session

## Integration Patterns

### Cross-Domain Coordination
```javascript
// Integration with other domains
class SessionStateIntegration {
  // Integration with CLI Command Processing Domain
  async enrichCommandWithSessionContext(command, sessionId) {
    const session = await this.getSession(sessionId);
    
    return {
      ...command,
      sessionContext: {
        history: session.commandHistory,
        preferences: session.preferences,
        workflowState: session.activeWorkflows
      }
    };
  }

  // Integration with Workflow Management Domain
  async synchronizeWorkflowState(workflowId, workflowState, sessionId) {
    const session = await this.getSession(sessionId);
    session.workflowStates.set(workflowId, workflowState);
    
    await this.updateSessionState(sessionId, {
      workflowStates: session.workflowStates
    });
  }

  // Integration with Error Analysis Domain
  async preserveErrorContext(error, sessionId) {
    const session = await this.getSession(sessionId);
    const errorContext = {
      error,
      timestamp: new Date().toISOString(),
      sessionContext: session.getContextSnapshot()
    };
    
    session.errorHistory.push(errorContext);
    await this.updateSessionState(sessionId, session);
  }
}
```

## Consequences

### Positive
- **Enhanced User Experience:** Consistent context and preferences across sessions
- **Improved Workflow Continuity:** Preserved workflow states enable resumption of complex operations
- **Better Error Recovery:** Session context helps in error diagnosis and recovery
- **Personalized Interactions:** User preferences enable customized system behavior

### Negative
- **Implementation Complexity:** Sophisticated state management requires significant development effort
- **Memory and Storage Overhead:** State persistence consumes system resources
- **Data Privacy Concerns:** User state storage requires careful privacy protection

### Neutral
- **State Synchronization Challenges:** Managing state across concurrent sessions requires coordination
- **Performance Tuning:** Optimal state management requires careful performance optimization

## Compliance and Security

### Privacy Protection
- **Data Minimization:** Store only necessary state information
- **Encryption at Rest:** Encrypt persistent state data
- **Access Controls:** Restrict state access to authorized sessions
- **Data Retention:** Implement appropriate state cleanup policies

### Performance Standards
- **State Access:** < 10ms for memory-cached state access
- **State Persistence:** < 100ms for state save operations
- **Session Initialization:** < 50ms for session startup with existing state

---

**Related ADRs:**
- ADR-013: Configuration Hierarchy and Precedence (configuration state integration)
- ADR-012: Workflow Engine Architecture (workflow state coordination)
- ADR-015: Interactive Command Design Pattern (session-aware interactions)
- ADR-014: Environment Context Detection Strategy (context-aware state management)

**Domain Integration Points:**
- CLI Command Processing → Session-aware command execution
- Workflow Management → Workflow state persistence
- Error Analysis → Error context preservation
- LLM Integration → Personalized AI interactions 