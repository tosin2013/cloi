---
adr_id: "ADR-002"
title: "A2A Protocol Integration Architecture"
status: "Accepted"
date: "2024-01-XX"
authors: ["Development Team"]
reviewers: ["Architecture Team", "Protocol Specialists"]
domain_impact: ["A2A Protocol Domain (Primary)", "CLI Domain (Secondary)", "Error Analysis Domain (Secondary)"]

validation_metadata:
  constraints:
    - type: "resource-management"
      rule: "a2a-dynamic-port-allocation"
      description: "A2A server must use dynamic port allocation to prevent EADDRINUSE conflicts"
      pattern: "EADDRINUSE.*port.*\\d+"
      severity: "error"
      auto_repairable: true
      
    - type: "port-management" 
      rule: "no-hardcoded-ports"
      description: "A2A services should not use hardcoded ports in production"
      pattern: "port.*9090"
      severity: "warning"
      auto_repairable: true
      
  auto_repair_rules:
    - violation: "port-conflict"
      action: "suggest-dynamic-port"
      suggestion: "Use dynamic port allocation: new A2AProtocol({ networking: { port: 0 } })"
      workflow: "cloi a2a start --port 0"
      
  workflow_triggers:
    - error_pattern: "EADDRINUSE"
      suggested_action: "cloi workflow run auto-repair --scenario a2a-port-conflict"
      tool_call: "a2a-dynamic-port-setup"
      
  research_integration:
    - document: "docs/research/adr-driven-testing-research.md"
      relevance: "A2A port conflicts as architectural governance issues"
      
  # NEW: Implementation metadata for self-implementing capabilities
  implementation_metadata:
    feature_requirements:
      - name: "Dynamic Port Allocation Service"
        description: "Implement intelligent port allocation to prevent EADDRINUSE conflicts"
        complexity: "medium"
        estimated_effort: "4-6 hours"
        dependencies: ["ADR-001"]
        
      - name: "A2A Health Check System"
        description: "Create comprehensive health monitoring for A2A protocol services"
        complexity: "low"
        estimated_effort: "2-3 hours"
        dependencies: []
        
    implementation_strategy:
      approach: "incremental"
      test_driven: true
      rollback_required: true
      integration_points:
        - "src/protocols/a2a/http-server.js"
        - "src/protocols/a2a/index.js"
        - "src/cli/index.js"
        
    ai_generation_context:
      code_patterns:
        - "Dynamic port allocation"
        - "Service health monitoring"
        - "Error recovery patterns"
      architectural_constraints:
        - "Maintain A2A protocol compatibility"
        - "Follow existing error handling patterns"
        - "Use existing logging infrastructure"
      reference_implementations:
        - "src/core/workflow-engine/index.js"
        - "src/utils/networking.js"
        
    workflow_generation:
      github_actions_template: "a2a-enhancement"
      test_strategy: "unit-integration-e2e"
      deployment_approach: "staged"
      rollback_triggers:
        - "test_failure_rate > 5%"
        - "a2a_service_failure"
        
    success_criteria:
      - "All A2A services use dynamic port allocation"
      - "Zero EADDRINUSE conflicts in production"
      - "Health check system provides 99% uptime visibility"
      - "Implementation time < 10 hours"
---

# ADR-002: A2A Protocol Integration Architecture

**Status:** Accepted  
**Date:** 2024-01-XX  
**Authors:** Development Team  
**Reviewers:** Architecture Team, Protocol Specialists  
**Domain Impact:** A2A Protocol Domain (Primary), CLI Domain (Secondary), Error Analysis Domain (Secondary)

## Context and Problem Statement

The CLOI system requires standardized agent-to-agent (A2A) communication capabilities to enable interoperability with external AI systems, development tools, and automation platforms. Without a coherent **A2A Protocol Domain**, CLOI operates in isolation, limiting its effectiveness in multi-agent development environments and preventing integration with external systems that could benefit from CLOI's error analysis capabilities.

### Domain-Driven Design Context

**Primary Bounded Context:** A2A Protocol Communication Domain  
**Secondary Contexts:** CLI Command Exposure, Error Analysis Service Integration, Session Management  
**Aggregate Root:** A2A Communication Gateway  
**Domain Language:** Agent Discovery, Message Routing, Service Endpoints, Protocol Compliance, Inter-Agent Communication  
**Domain Events:** Agent Registered, Message Received, Service Requested, Protocol Negotiated, Communication Established

### Problem Manifestation

1. **Lack of Standardized Communication Interface:**
   ```javascript
   // Before: No external communication capability
   // CLOI could only operate through direct CLI interaction
   // No mechanism for other agents to request CLOI services
   // No discovery mechanism for CLOI capabilities
   ```

2. **Isolated Operation Model:**
   - No external API for error analysis requests
   - Unable to participate in multi-agent workflows
   - No standardized service discovery mechanism
   - Limited integration with external development tools

3. **Missing Domain Boundaries:**
   - No clear separation between internal operations and external communication
   - Unclear how to expose CLOI capabilities without compromising internal architecture
   - No protocol-specific error handling or message validation

4. **Integration Complexity:**
   - External systems need custom integration logic
   - No standardized request/response format
   - Inconsistent authentication and authorization patterns

## Decision Drivers

### Domain Requirements

1. **Standard Protocol Compliance:** Must follow established agent communication protocols (JSON-RPC 2.0, HTTP)
2. **Service Discovery:** Agents must be able to discover CLOI capabilities through well-known endpoints
3. **Domain Encapsulation:** A2A communication must not leak internal domain details
4. **Protocol Agnostic Design:** Support multiple communication protocols and message formats

### Technical Constraints

1. **Security Requirements:** All external communication must be authenticated and validated
2. **Performance Requirements:** Protocol overhead must not impact CLI performance
3. **Backward Compatibility:** A2A integration must not break existing CLI functionality
4. **Extensibility:** Must support future protocol versions and additional service endpoints

### Integration Requirements

1. **CLI Command Exposure:** Enable external agents to execute CLOI commands
2. **Error Analysis Services:** Provide API access to error analysis capabilities
3. **Session Management:** Handle multi-request conversations and context
4. **Real-time Communication:** Support both synchronous and asynchronous communication patterns

## Considered Options

### Option 1: Direct HTTP API
**Domain Impact:** Simple implementation but lacks agent communication standards
**Pros:**
- Simple to implement and test
- Wide compatibility with HTTP clients
- Easy debugging and monitoring
**Cons:**
- Not agent-communication-specific
- Lacks standardized service discovery
- No built-in message routing capabilities
- Missing agent identity and authentication patterns

### Option 2: JSON-RPC 2.0 over HTTP with Agent Extensions (CHOSEN)
**Domain Impact:** Creates proper A2A domain with standardized protocols
**Pros:**
- Standards-compliant agent communication
- Built-in method discovery and introspection
- Structured error handling and validation
- Support for batch operations
- Clear separation between protocol and business logic
**Cons:**
- More complex implementation
- Additional protocol overhead
- Need for comprehensive testing

### Option 3: Custom Binary Protocol
**Domain Impact:** High performance but reduces interoperability
**Pros:**
- Optimal performance characteristics
- Custom security and compression features
**Cons:**
- Poor interoperability with external systems
- High development and maintenance cost
- Limited tooling and debugging support

## Decision Outcome

### Chosen Solution

Implement **JSON-RPC 2.0 over HTTP with Agent-Specific Extensions** as the foundational A2A protocol, enhanced with standardized service discovery and agent identification mechanisms.

```javascript
// A2A Protocol Domain Architecture
class A2AProtocolGateway {
  constructor() {
    this.serviceRegistry = new ServiceRegistry();
    this.messageRouter = new MessageRouter();
    this.securityContext = new SecurityContext();
    this.sessionManager = new A2ASessionManager();
  }

  // Service Discovery Endpoint
  async getAgentCapabilities() {
    return {
      agent: {
        id: this.agentId,
        name: "CLOI Error Analysis Agent",
        version: "1.0.0",
        capabilities: ["error-analysis", "environment-analysis", "fix-generation"]
      },
      services: this.serviceRegistry.getAvailableServices(),
      protocols: ["jsonrpc-2.0", "http"],
      endpoints: {
        "jsonrpc": "/jsonrpc",
        "skills": "/skill/*",
        "discovery": "/.well-known/agent.json"
      }
    };
  }

  // Skill-based Service Endpoints
  async handleSkillRequest(skillName, input) {
    const skill = this.serviceRegistry.getSkill(skillName);
    const session = await this.sessionManager.getOrCreateSession();
    return await skill.execute(input, session);
  }

  // JSON-RPC 2.0 Standard Interface  
  async handleJsonRpcRequest(request) {
    const { method, params, id } = request;
    
    try {
      const result = await this.messageRouter.route(method, params);
      return { jsonrpc: "2.0", result, id };
    } catch (error) {
      return { 
        jsonrpc: "2.0", 
        error: this.formatRpcError(error), 
        id 
      };
    }
  }
}
```

### Domain-Driven Reasoning

1. **Protocol Domain Integrity:** Clear separation between communication protocol concerns and business logic
2. **Service Contract Definition:** Well-defined interfaces for external agent interaction
3. **Domain Service Exposure:** Controlled exposure of internal capabilities through standardized endpoints
4. **Agent Identity Management:** Proper agent identification and capability advertising

## Consequences

### Positive Domain Outcomes

1. **Standardized Agent Communication:**
   - JSON-RPC 2.0 compliance enables interoperability with standard agent frameworks
   - Well-known service discovery endpoint (`/.well-known/agent.json`)
   - Consistent message format and error handling across all A2A interactions
   - Support for agent capability negotiation and discovery

2. **Domain Boundary Protection:**
   - A2A Gateway acts as controlled access point to internal domains
   - Protocol concerns separated from business logic
   - Input validation and sanitization at protocol boundary
   - Session isolation between A2A and CLI interactions

3. **Enhanced Integration Capabilities:**
   - External development tools can integrate with CLOI services
   - Multi-agent workflows can include CLOI error analysis
   - CI/CD systems can programmatically request error analysis
   - IDE plugins can access CLOI capabilities through standard protocols

4. **Flexible Service Exposure:**
   - Skill-based endpoints for domain-specific operations (`/skill/environment-analysis`)
   - JSON-RPC methods for structured API access
   - Batch operation support for multiple analysis requests
   - Real-time and asynchronous communication patterns

### Domain Risks and Mitigations

1. **Security Boundary Risk:**
   - **Risk:** External agents accessing sensitive internal state or operations
   - **Mitigation:** Comprehensive input validation, authentication, and authorization layers
   - **Domain Protection:** Whitelist of exposed services and strict parameter validation

2. **Performance Impact Risk:**
   - **Risk:** A2A communication overhead affecting CLI performance
   - **Mitigation:** Separate process/thread for A2A server with resource isolation
   - **Monitoring:** Performance metrics for A2A request processing

3. **Protocol Complexity Risk:**
   - **Risk:** JSON-RPC implementation complexity affecting maintainability
   - **Mitigation:** Use established JSON-RPC libraries and comprehensive testing
   - **Standards Compliance:** Regular validation against JSON-RPC 2.0 specification

4. **Domain Coupling Risk:**
   - **Risk:** A2A requirements driving inappropriate changes to internal domains
   - **Mitigation:** Adapter pattern for domain integration with clear boundaries
   - **Architecture Review:** Regular assessment of domain coupling and cohesion

### Implementation Impact

1. **New Domain Components:**
   - A2A HTTP Server with JSON-RPC 2.0 support
   - Service Registry for capability management
   - Message Router for method dispatch
   - A2A-specific Session Manager
   - Security and Authentication layer

2. **Integration Points:**
   - CLI Domain: Command execution through A2A interface
   - Error Analysis Domain: API access to analysis capabilities
   - Configuration Domain: A2A-specific configuration management
   - Session Management: Cross-protocol session handling

3. **Service Endpoints:**
   ```
   GET  /.well-known/agent.json     # Agent discovery
   POST /jsonrpc                    # JSON-RPC 2.0 interface
   POST /skill/environment-analysis # Environment analysis skill
   POST /skill/error-analysis       # Error analysis skill
   POST /skill/fix-generation       # Fix generation skill
   ```

## Compliance with Domain Principles

### Ubiquitous Language ✅
- Adopts standard agent communication terminology (JSON-RPC, service discovery, capabilities)
- Clear vocabulary for A2A concepts (agents, skills, protocols, endpoints)
- Consistent naming patterns for services and methods

### Bounded Context Integrity ✅
- A2A Protocol Domain has clear boundaries and responsibilities
- Protocol concerns separated from business logic domains
- Controlled integration points with other bounded contexts

### Aggregate Design ✅
- A2A Gateway serves as aggregate root for all external communication
- Maintains consistency for agent identity and capability exposure
- Encapsulates protocol-specific logic and state management

### Domain Service Collaboration ✅
- Clean integration patterns with CLI, Error Analysis, and Configuration domains
- Event-driven communication for cross-domain notifications
- Standardized service contracts for domain interaction

## Related Decisions

- **Depends On:** 
  - ADR-001: CLI Unification Strategy (command exposure foundation)
- **Influences:**
  - ADR-013: Configuration Hierarchy and Precedence (A2A configuration needs)
  - ADR-035: Session State Architecture (cross-protocol session management)
  - ADR-023: A2A Authentication and Security (security implementation)
- **Related:**
  - ADR-021: A2A Service Discovery Mechanism (service registry implementation)
  - ADR-022: A2A Message Format and Routing (message handling details)

## Verification Criteria

### Functional Verification
- [ ] JSON-RPC 2.0 compliance validated with standard test suites
- [ ] Service discovery endpoint returns valid agent capability document
- [ ] All exposed skills function correctly through A2A interface
- [ ] Error handling follows JSON-RPC 2.0 error response format
- [ ] Session management works across multiple A2A requests

### Domain Verification
- [ ] A2A Protocol Domain maintains clear boundaries with other contexts
- [ ] Service exposure follows controlled access patterns
- [ ] Protocol implementation doesn't leak internal domain details
- [ ] Agent identity and capabilities are properly managed
- [ ] Cross-domain communication follows established patterns

### Performance Verification
- [ ] A2A server startup time is acceptable (< 2 seconds)
- [ ] Request processing latency meets requirements (< 500ms for simple requests)
- [ ] Concurrent request handling performs within limits
- [ ] Memory usage remains bounded under load
- [ ] CLI performance unaffected by A2A server operation

### Integration Verification
- [ ] External agents can discover and connect to CLOI services
- [ ] Standard JSON-RPC clients can interact with CLOI
- [ ] Skill-based endpoints work with curl and similar tools
- [ ] Authentication and authorization work correctly
- [ ] Error scenarios return appropriate error responses

### Standards Compliance Verification
- [ ] JSON-RPC 2.0 specification compliance (method calls, notifications, batches)
- [ ] HTTP protocol compliance (status codes, headers, caching)
- [ ] Agent discovery specification compliance
- [ ] Security best practices implementation

## Future Considerations

1. **Additional Protocol Support:** WebSocket, gRPC, or other agent communication protocols
2. **Advanced Service Discovery:** Registry integration with external service discovery systems
3. **Agent Orchestration:** Support for multi-agent workflow coordination
4. **Protocol Versioning:** Backward compatibility and protocol evolution strategies
5. **Performance Optimization:** Protocol-level caching, compression, and optimization
6. **Enhanced Security:** Advanced authentication, authorization, and audit logging
7. **Monitoring and Observability:** Comprehensive metrics, tracing, and logging for A2A interactions

---

**Domain Maturity:** Evolving (new domain with growth potential)  
**Review Date:** 2024-03-XX  
**Impact Assessment:** High (enables external integration and multi-agent capabilities) 