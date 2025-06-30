# ADR-040: MCP Server Integration Architecture

## Status
Proposed

## Context

Research into portable workflow systems revealed that Model Context Protocol (MCP) servers represent a critical external integration pattern missing from CLOI's architecture. MCP servers enable AI systems like Claude Desktop, VS Code extensions, and Cursor to access external tools and services through a standardized protocol.

### MCP Protocol Overview

MCP (Model Context Protocol) is a standardized way for AI systems to:
- Discover available tools and capabilities
- Execute commands with proper context
- Maintain secure communication boundaries
- Enable cross-system collaboration

### Current State Analysis

CLOI's existing architecture has components that could support MCP integration:
- **ADR-007**: LLM Provider Router (provider abstraction foundation)
- **ADR-002**: A2A Protocol (inter-system communication patterns)
- **ADR-038**: External Project Integration (federated architecture vision)
- **ADR-039**: Portable Workflow Specification (execution framework)

### Gap Identification

Missing MCP integration capabilities:
- No MCP server discovery mechanisms
- No standardized MCP client implementation
- Missing capability negotiation protocols
- No MCP-aware workflow execution
- Lack of MCP server deployment patterns

## Decision

Implement **MCP Server Integration Architecture** that enables CLOI to:
- Discover and connect to existing MCP servers
- Act as an MCP server for external AI systems
- Route workflow execution through MCP-enabled tools
- Provide secure capability negotiation
- Support both local and remote MCP deployments

## Architecture Specification

### Core Components

#### 1. MCP Client Integration

**MCP Discovery Service**:
```typescript
interface McpDiscoveryService {
  // Automatic discovery from common locations
  discoverLocalServers(): Promise<McpServerConfig[]>;
  discoverProjectServers(projectPath: string): Promise<McpServerConfig[]>;
  
  // Manual registration
  registerServer(config: McpServerConfig): Promise<void>;
  unregisterServer(serverId: string): Promise<void>;
  
  // Health monitoring
  validateServerHealth(serverId: string): Promise<HealthStatus>;
  monitorServers(): Promise<void>;
}

interface McpServerConfig {
  id: string;
  name: string;
  url: string;
  protocol: 'http' | 'websocket' | 'stdio';
  capabilities: string[];
  authentication?: AuthConfig;
  metadata?: Record<string, any>;
}
```

**MCP Client Implementation**:
```typescript
interface McpClient {
  // Connection management
  connect(serverConfig: McpServerConfig): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Capability discovery
  listCapabilities(): Promise<McpCapability[]>;
  getCapability(name: string): Promise<McpCapability>;
  
  // Tool execution
  executeTool(toolName: string, params: any): Promise<McpToolResult>;
  executeWorkflow(workflow: McpWorkflow): Promise<McpWorkflowResult>;
  
  // Event handling
  onEvent(eventType: string, handler: McpEventHandler): void;
  removeEventHandler(eventType: string, handler: McpEventHandler): void;
}
```

#### 2. MCP Server Implementation

**CLOI as MCP Server**:
```typescript
interface CloiMcpServer {
  // Server lifecycle
  start(config: McpServerConfig): Promise<void>;
  stop(): Promise<void>;
  getStatus(): McpServerStatus;
  
  // Capability advertisement
  advertiseCapabilities(): McpCapability[];
  
  // Tool handlers
  registerTool(tool: McpToolHandler): void;
  unregisterTool(toolName: string): void;
  
  // Request handling
  handleRequest(request: McpRequest): Promise<McpResponse>;
}

// CLOI MCP Tool Definitions
const CloiMcpTools = {
  'codebase_search': {
    description: 'Search through codebase using RAG system',
    parameters: {
      query: { type: 'string', required: true },
      file_patterns: { type: 'array', items: 'string' },
      max_results: { type: 'number', default: 10 }
    }
  },
  
  'error_analysis': {
    description: 'Analyze errors using CLOI error classification',
    parameters: {
      error_message: { type: 'string', required: true },
      context_files: { type: 'array', items: 'string' },
      language: { type: 'string' }
    }
  },
  
  'workflow_execute': {
    description: 'Execute CLOI workflows',
    parameters: {
      workflow_name: { type: 'string', required: true },
      parameters: { type: 'object' },
      async: { type: 'boolean', default: false }
    }
  },
  
  'adr_validate': {
    description: 'Validate ADR compliance',
    parameters: {
      adr_path: { type: 'string', default: 'docs/adr' },
      rules: { type: 'array', items: 'string' }
    }
  }
};
```

#### 3. MCP-Aware Provider Router

**Extended LLM Provider with MCP Support**:
```typescript
class McpEnabledProvider extends BaseProvider {
  constructor(mcpClient: McpClient) {
    super();
    this.mcpClient = mcpClient;
  }
  
  async query(prompt: string, options: QueryOptions): Promise<ProviderResponse> {
    // Enhance context with MCP capabilities
    const mcpContext = await this.buildMcpContext(options.context);
    
    // Route through MCP server if available
    if (this.shouldUseMcpRouting(options)) {
      return await this.mcpClient.executeTool('llm_query', {
        prompt,
        context: mcpContext,
        options
      });
    }
    
    // Fallback to direct provider
    return await super.query(prompt, options);
  }
  
  private async buildMcpContext(context: any): Promise<McpContext> {
    const capabilities = await this.mcpClient.listCapabilities();
    return {
      available_tools: capabilities.map(c => c.name),
      context_data: context,
      integration_level: 'full'
    };
  }
}
```

### MCP Server Discovery Patterns

#### 1. Local Discovery

**Configuration File Locations**:
```yaml
# Search paths for MCP server configurations
discovery_paths:
  # Claude Desktop configuration
  - path: "~/.config/claude/claude_desktop_config.json"
    format: "claude_desktop"
    
  # VS Code MCP extensions
  - path: "~/.vscode/extensions/*/mcp-servers.json"
    format: "vscode_extension"
    
  # Project-specific MCP servers
  - path: ".cloi/mcp-servers.yml"
    format: "cloi_native"
    
  # Global CLOI MCP registry
  - path: "~/.cloi/mcp-servers.yml"
    format: "cloi_native"
```

**CLOI Native MCP Configuration**:
```yaml
# .cloi/mcp-servers.yml
mcp_servers:
  development:
    - name: "github-mcp-server"
      url: "http://localhost:3001"
      protocol: "http"
      capabilities: 
        - "github_cli"
        - "repo_management"
        - "pr_operations"
      health_check: "/health"
      
    - name: "filesystem-mcp-server"
      url: "stdio://./node_modules/.bin/filesystem-mcp-server"
      protocol: "stdio"
      capabilities:
        - "file_read"
        - "file_write"
        - "directory_list"
        
  testing:
    - name: "pytest-mcp-server"
      url: "http://localhost:3002"
      protocol: "http"
      capabilities:
        - "test_execution"
        - "coverage_analysis"
        - "failure_diagnosis"
        
  documentation:
    - name: "context7-mcp-server"
      url: "http://localhost:3003"
      protocol: "http"
      capabilities:
        - "library_docs"
        - "api_reference"
        - "code_examples"
```

#### 2. Dynamic Discovery

**Network Discovery**:
```typescript
class NetworkMcpDiscovery {
  async discoverNetworkServers(): Promise<McpServerConfig[]> {
    const discoveryMethods = [
      this.mdnsDiscovery(),      // mDNS/Bonjour
      this.consulDiscovery(),    // HashiCorp Consul
      this.etcdDiscovery(),      // etcd service discovery
      this.k8sDiscovery()        // Kubernetes service discovery
    ];
    
    const results = await Promise.allSettled(discoveryMethods);
    return results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);
  }
  
  private async mdnsDiscovery(): Promise<McpServerConfig[]> {
    // Discover MCP servers advertising via mDNS
    const services = await mdns.discover('_mcp._tcp');
    return services.map(this.convertMdnsToConfig);
  }
}
```

### Integration with Existing Systems

#### 1. Workflow Engine Integration (ADR-012)

**MCP-Aware Step Executors**:
```typescript
class McpStepExecutor implements PortableStepExecutor {
  constructor(private mcpClient: McpClient) {}
  
  async execute(step: WorkflowStep, context: ExecutionContext): Promise<StepResult> {
    // Check if step can be executed via MCP
    const mcpTool = await this.findMcpTool(step.type);
    
    if (mcpTool) {
      return await this.executeViaMcp(step, context, mcpTool);
    }
    
    // Fallback to native execution
    return await this.executeNatively(step, context);
  }
  
  private async executeViaMcp(
    step: WorkflowStep, 
    context: ExecutionContext, 
    tool: McpCapability
  ): Promise<StepResult> {
    const result = await this.mcpClient.executeTool(tool.name, {
      ...step.inputs,
      context: this.buildToolContext(context)
    });
    
    return {
      success: result.success,
      outputs: result.outputs,
      duration: result.duration,
      metadata: { 
        executed_via: 'mcp',
        mcp_server: tool.server_id,
        tool_name: tool.name
      }
    };
  }
}
```

#### 2. A2A Protocol Integration (ADR-002)

**MCP-Enhanced A2A Communication**:
```json
{
  "method": "mcp.capability.discover",
  "params": {
    "server_filter": {
      "capabilities": ["code_analysis", "error_diagnosis"],
      "protocols": ["http", "websocket"]
    }
  }
}

{
  "method": "mcp.tool.execute",
  "params": {
    "server_id": "github-mcp-server",
    "tool_name": "create_pr",
    "parameters": {
      "title": "Fix: Add error handling to API calls",
      "body": "Generated by CLOI workflow",
      "base": "main",
      "head": "feature/error-handling"
    }
  }
}
```

#### 3. Provider Router Integration (ADR-007)

**MCP Provider Type**:
```typescript
class McpProvider extends BaseProvider {
  async isAvailable(): Promise<boolean> {
    return await this.mcpClient.isConnected();
  }
  
  async query(prompt: string, options: ProviderOptions): Promise<ProviderResponse> {
    // Route LLM queries through MCP servers that support them
    const llmCapableServers = await this.mcpClient.listCapabilities()
      .then(caps => caps.filter(c => c.type === 'llm_query'));
      
    if (llmCapableServers.length > 0) {
      return await this.routeViaMcp(prompt, options, llmCapableServers[0]);
    }
    
    throw new Error('No MCP servers with LLM capabilities available');
  }
}
```

## Security Considerations

### Authentication and Authorization

**MCP Authentication Patterns**:
```typescript
interface McpAuthConfig {
  type: 'none' | 'api_key' | 'oauth2' | 'jwt' | 'mutual_tls';
  credentials?: {
    api_key?: string;
    client_id?: string;
    client_secret?: string;
    token_endpoint?: string;
    cert_path?: string;
    key_path?: string;
  };
  scopes?: string[];
  refresh_strategy?: 'automatic' | 'manual';
}
```

**Capability-Based Security**:
```typescript
class McpSecurityManager {
  validateCapabilityAccess(
    capability: string, 
    context: SecurityContext
  ): boolean {
    // Check if the current context has permission to use capability
    const permissions = this.getPermissions(context);
    return permissions.includes(capability) || permissions.includes('*');
  }
  
  sanitizeParameters(
    toolName: string, 
    params: any
  ): any {
    // Remove sensitive parameters based on tool definition
    const toolDef = this.getToolDefinition(toolName);
    return this.filterSensitiveData(params, toolDef.sensitive_fields || []);
  }
}
```

### Network Security

**Secure Communication**:
- **TLS 1.3** for HTTP-based MCP servers
- **WSS** for WebSocket connections
- **Certificate validation** for mutual TLS
- **Rate limiting** per MCP server
- **Request timeout** enforcement

## Performance Considerations

### Connection Pooling

**Efficient MCP Client Management**:
```typescript
class McpConnectionPool {
  private connections = new Map<string, McpClient>();
  private connectionLimits = new Map<string, number>();
  
  async getConnection(serverId: string): Promise<McpClient> {
    if (this.connections.has(serverId)) {
      return this.connections.get(serverId)!;
    }
    
    const client = await this.createConnection(serverId);
    this.connections.set(serverId, client);
    return client;
  }
  
  async recycleConnections(): Promise<void> {
    // Recycle idle connections to maintain pool health
    for (const [serverId, client] of this.connections) {
      if (await this.isIdle(client)) {
        await client.disconnect();
        this.connections.delete(serverId);
      }
    }
  }
}
```

### Caching Strategy

**MCP Response Caching**:
```typescript
interface McpCacheStrategy {
  shouldCache(toolName: string, params: any): boolean;
  getCacheKey(toolName: string, params: any): string;
  getTtl(toolName: string): number;
  invalidatePattern(pattern: string): Promise<void>;
}
```

## Deployment Patterns

### Local Development

**IDE Integration**:
```typescript
// VS Code extension integration
class VsCodeMcpBridge {
  async registerCloiServer(): Promise<void> {
    const config = {
      name: 'CLOI Development Assistant',
      url: 'http://localhost:9090/mcp',
      capabilities: [
        'error_analysis',
        'workflow_execution', 
        'adr_validation',
        'codebase_search'
      ]
    };
    
    await vscode.workspace.getConfiguration('mcp').update('servers', [config]);
  }
}
```

### CI/CD Integration

**GitHub Actions MCP Server**:
```yaml
# .github/workflows/mcp-integration.yml
name: MCP Integration Testing
on: [push, pull_request]

jobs:
  test-mcp-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start CLOI MCP Server
        run: |
          npm install -g cloi
          cloi mcp-server start --port 3001 --background
          
      - name: Test MCP Capabilities
        run: |
          curl -X POST http://localhost:3001/mcp/capabilities
          curl -X POST http://localhost:3001/mcp/tools/error_analysis \
            -d '{"error": "TypeError: Cannot read property", "files": ["src/app.js"]}'
```

### Production Deployment

**Container-Based MCP Servers**:
```dockerfile
# Dockerfile.mcp-server
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
EXPOSE 3001

# Health check endpoint for discovery
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "src/mcp-server.js"]
```

## Validation Rules

```yaml
# Embedded validation for ADR-driven testing
validation_rules:
  mcp_server_structure:
    - pattern: "src/mcp/**/*.js"
      description: "MCP server implementations must be in src/mcp directory"
      violation_level: "error"
      
  mcp_capability_contracts:
    - pattern: "implements McpCapability"
      description: "All MCP capabilities must implement standard interface"
      violation_level: "error"
      
  mcp_security:
    - pattern: "validateCapabilityAccess"
      description: "All MCP tools must validate capability access"
      violation_level: "error"
      
  mcp_discovery:
    - pattern: "mcp-servers.yml"
      description: "Projects should define MCP server configurations"
      violation_level: "warning"

auto_repair_actions:
  - violation: "missing_mcp_config"
    action: "generate_mcp_config_template"
    template: "mcp_servers_template"
    
  - violation: "insecure_mcp_connection"
    action: "add_tls_configuration"
    template: "secure_mcp_config"
```

## Success Metrics

### Integration Metrics
- **Discovery Success Rate**: 95%+ automatic MCP server discovery
- **Connection Reliability**: 99%+ uptime for MCP connections
- **Tool Execution Success**: 90%+ successful tool executions
- **Response Time**: <2 seconds for typical MCP tool calls

### Compatibility Metrics
- **MCP Protocol Compliance**: 100% compliance with MCP specification
- **Server Compatibility**: Support for 10+ common MCP server types
- **Client Integration**: Compatible with Claude Desktop, VS Code, Cursor
- **Platform Support**: Linux, macOS, Windows compatibility

## Consequences

### Positive
- **Universal AI Integration**: Connect CLOI with any MCP-enabled AI system
- **Tool Ecosystem**: Access vast ecosystem of MCP tools and servers
- **Bidirectional Integration**: CLOI can both use and provide MCP services
- **Standard Compliance**: Following established protocol standards
- **Developer Experience**: Seamless integration with existing AI workflows

### Negative
- **Protocol Complexity**: Additional complexity in managing MCP connections
- **Version Compatibility**: Need to maintain MCP protocol version compatibility
- **Security Surface**: Expanded attack surface through external connections
- **Network Dependencies**: Reliability depends on MCP server availability
- **Configuration Overhead**: Additional configuration for MCP integrations

### Risk Mitigation
- **Graceful Degradation**: Fallback to native CLOI capabilities when MCP unavailable
- **Security Auditing**: Regular security review of MCP integrations
- **Connection Monitoring**: Proactive monitoring and alerting for MCP health
- **Protocol Versioning**: Support multiple MCP protocol versions
- **Documentation**: Comprehensive guides for MCP server setup and configuration

## References

### MCP Protocol Specification
- Model Context Protocol official documentation
- MCP server implementation examples
- Security best practices for MCP deployments

### Related ADRs
- ADR-007: LLM Provider Router Architecture (provider abstraction foundation)
- ADR-002: A2A Protocol Integration (inter-system communication patterns)
- ADR-038: External Project Integration (federated architecture)
- ADR-039: Portable Workflow Specification (execution framework)

### Industry Examples
- Claude Desktop MCP server integrations
- VS Code MCP extension patterns
- Cursor AI MCP implementations
- Open source MCP server libraries

---

**Date**: 2025-01-29
**Status**: Proposed → Under Review
**Dependencies**: ADR-007 (LLM Provider Router), ADR-039 (Portable Workflows)
**Next Steps**: Implement MCP discovery service and basic client integration