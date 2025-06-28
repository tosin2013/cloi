# MCPProvider - Model Context Protocol Integration

A provider plugin that enables Cloi to interact with external MCP (Model Context Protocol) servers, providing access to distributed AI capabilities, tools, and resources.

## Overview

The MCPProvider transforms Cloi into a powerful MCP client that can:

- **Connect to Multiple MCP Servers**: Manage connections to various MCP servers simultaneously
- **Intelligent Routing**: Automatically select the best server for each query
- **Tool Integration**: Access tools from external MCP servers seamlessly
- **Resource Management**: Retrieve and manage resources from MCP servers
- **Load Balancing**: Distribute queries across available servers
- **Fault Tolerance**: Automatic failover to backup servers

## Features

### 🔗 **Multi-Server Management**
- Connect to multiple MCP servers concurrently
- Automatic connection management and health monitoring
- Graceful handling of server disconnections and reconnections

### 🎯 **Intelligent Query Routing**
- Smart server selection based on query type and server capabilities
- Load balancing across available servers
- Automatic failover to backup servers

### 🛠️ **Tool Integration**
- Seamless access to tools from external MCP servers
- Automatic tool discovery and enumeration
- Context-aware tool selection for queries

### 📚 **Resource Access**
- Retrieve resources from MCP servers
- Dynamic context building from external sources
- Resource caching and management

### 📊 **Monitoring & Analytics**
- Real-time server status monitoring
- Usage analytics and performance metrics
- Connection health tracking

## Installation

The plugin is installed in the Cloi plugin directory:

```bash
# Plugin is located at: src/plugins/providers/mcp/
# Load the plugin:
node src/cli/modular.js plugins load providers:mcp
```

## Configuration

Add MCP server configurations to your Cloi config file:

```json
{
  "plugins": {
    "providers": {
      "mcp": {
        "timeout": 60000,
        "retries": 3,
        "servers": {
          "cloi-development": {
            "command": "node",
            "args": ["cloi-mcp-server/src/index.js"],
            "description": "Cloi development assistance server",
            "enabled": true,
            "timeout": 30000,
            "env": {
              "CLOI_PROJECT_ROOT": "/path/to/cloi"
            }
          },
          "custom-tools": {
            "command": "python",
            "args": ["custom-mcp-server.py"],
            "description": "Custom tools and analyzers",
            "enabled": true,
            "timeout": 45000
          },
          "ai-assistant": {
            "command": "node",
            "args": ["ai-mcp-server/index.js"],
            "description": "Advanced AI assistance",
            "enabled": true,
            "env": {
              "OPENAI_API_KEY": "${OPENAI_API_KEY}"
            }
          }
        }
      }
    }
  }
}
```

## Usage

### Basic Query Routing
```bash
# Use MCP provider for analysis (automatically routes to best server)
node src/cli/modular.js config set providers.default mcp
node src/cli/modular.js analyze "ReferenceError: variable is not defined"
```

### Direct Tool Access
```bash
# Call specific tools from MCP servers
node src/cli/modular.js analyze "Error message" --provider mcp --tool analyze_cloi_module --arguments '{"module": "core"}'
```

### Server-Specific Queries
```bash
# Target a specific MCP server
node src/cli/modular.js analyze "Generate documentation" --provider mcp --server cloi-development
```

### Resource Retrieval
```bash
# Get resources from MCP servers
node src/cli/modular.js analyze "Get project context" --provider mcp --resource "file://project-context.md"
```

## MCP Server Development

The MCPProvider makes it easy to extend Cloi with custom MCP servers:

### Creating a Custom MCP Server

```javascript
// custom-server.js
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'custom-tools-server',
  version: '1.0.0'
}, {
  capabilities: { tools: {} }
});

// Add your custom tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'custom_analyzer',
        description: 'Custom analysis tool',
        inputSchema: {
          type: 'object',
          properties: {
            input: { type: 'string', description: 'Input to analyze' }
          }
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'custom_analyzer') {
    return {
      content: [{
        type: 'text',
        text: `Custom analysis result for: ${request.params.arguments.input}`
      }]
    };
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Adding to Configuration

```json
{
  "plugins": {
    "providers": {
      "mcp": {
        "servers": {
          "custom-tools": {
            "command": "node",
            "args": ["custom-server.js"],
            "description": "My custom tools",
            "enabled": true
          }
        }
      }
    }
  }
}
```

## API Reference

### MCPProvider

#### Constructor
```javascript
new MCPProvider(manifest, config)
```

#### Methods

##### `async isAvailable()`
Checks if the MCP provider is available (has configured servers).

##### `async connect()`
Connects to all configured MCP servers.

##### `async disconnect()`
Disconnects from all MCP servers.

##### `async query(prompt, options)`
Queries MCP servers with intelligent routing.

**Options:**
- `server`: Target specific server
- `tool`: Call specific tool
- `resource`: Retrieve specific resource
- `arguments`: Tool arguments
- `model`: Model preference

##### `async listAllTools()`
Lists all available tools across all connected servers.

##### `getServerStatus()`
Returns status of all configured servers.

##### `getSupportedModels()`
Returns list of supported models.

##### `getCapabilities()`
Returns provider capabilities.

### Events

The MCPProvider emits the following events:

- `server-connected`: When a server connects successfully
- `server-disconnected`: When a server disconnects
- `query-completed`: When a query is completed
- `error`: When an error occurs

```javascript
provider.on('server-connected', ({ serverName, serverConfig }) => {
  console.log(`Connected to ${serverName}`);
});

provider.on('server-disconnected', ({ serverName }) => {
  console.log(`Disconnected from ${serverName}`);
});
```

## Advanced Features

### Load Balancing

The provider automatically distributes queries across available servers:

```javascript
// Queries are automatically distributed
for (let i = 0; i < 10; i++) {
  await provider.query(`Query ${i}`);
}
```

### Fault Tolerance

Automatic failover to backup servers when primary servers fail:

```javascript
// If primary server fails, automatically tries backup servers
const result = await provider.query('Important query');
// Will try all available servers until one succeeds
```

### Tool Discovery

Automatic discovery and intelligent selection of tools:

```javascript
// Provider automatically selects best tool for the query
const result = await provider.query('analyze this error message');
// Might use 'analyze_cloi_module' tool from cloi-development server
```

### Dynamic Context

Build context from multiple MCP servers:

```javascript
// Gather context from multiple sources
const context = await provider.query('Get project analysis context', {
  tool: 'get_cloi_context',
  arguments: { area: 'full' }
});
```

## Integration Examples

### Development Workflow

```bash
# 1. Generate plugin template via MCP
node src/cli/modular.js analyze "generate plugin template for rust analyzer" --provider mcp

# 2. Analyze existing code patterns
node src/cli/modular.js analyze "analyze existing analyzer plugins" --provider mcp

# 3. Generate documentation
node src/cli/modular.js analyze "generate API documentation for the plugin system" --provider mcp

# 4. Create test scenarios
node src/cli/modular.js analyze "create comprehensive test scenarios for rust analyzer" --provider mcp
```

### CI/CD Integration

```bash
# Use MCP servers in CI/CD pipelines
node src/cli/modular.js analyze "validate all plugins" --provider mcp --tool validate_plugin
node src/cli/modular.js analyze "generate release documentation" --provider mcp --tool generate_api_docs
```

### Community Extensions

The MCP provider enables a rich ecosystem of community-developed MCP servers:

- **Language-specific servers**: Python, Rust, Go analysis servers
- **Tool integration servers**: GitHub, Jira, Slack integration
- **AI service servers**: OpenAI, Anthropic, local model servers
- **Custom workflow servers**: Company-specific tools and processes

## Performance Optimization

### Connection Pooling
```json
{
  "plugins": {
    "providers": {
      "mcp": {
        "connectionPool": {
          "maxConnections": 10,
          "idleTimeout": 300000,
          "retryDelay": 5000
        }
      }
    }
  }
}
```

### Caching
```json
{
  "plugins": {
    "providers": {
      "mcp": {
        "cache": {
          "enabled": true,
          "ttl": 300000,
          "maxSize": 100
        }
      }
    }
  }
}
```

## Security Considerations

- **Process Isolation**: Each MCP server runs in its own process
- **Environment Variables**: Secure handling of API keys and secrets
- **Input Validation**: All inputs are validated before forwarding to servers
- **Resource Limits**: Configurable timeouts and resource limits

## Troubleshooting

### Common Issues

1. **Server Connection Failures**
   ```bash
   # Check server status
   node src/cli/modular.js status
   
   # View detailed logs
   DEBUG=mcp:* node src/cli/modular.js analyze "test"
   ```

2. **Tool Not Found**
   ```bash
   # List available tools
   node src/cli/modular.js analyze "list all tools" --provider mcp
   ```

3. **Performance Issues**
   ```bash
   # Check server performance
   node src/cli/modular.js analyze "server performance" --provider mcp --tool analyze_performance
   ```

### Debug Mode

Enable debug logging:

```bash
export DEBUG=cloi:mcp:*
node src/cli/modular.js analyze "debug query" --provider mcp
```

## Contributing

1. **Adding New Servers**: Create MCP servers following the MCP specification
2. **Improving Routing**: Enhance the server selection algorithms
3. **Performance**: Optimize connection management and caching
4. **Documentation**: Improve examples and use cases

## License

GPL-3.0

## Support

For issues with the MCP provider:
1. Check server configurations and logs
2. Verify MCP server compatibility
3. Review network connectivity
4. Check environment variables and permissions
5. Consult MCP specification documentation

The MCPProvider enables Cloi to become a powerful orchestrator of distributed AI capabilities, making it easy to integrate with the growing ecosystem of MCP-compatible tools and services.