import { BaseProvider } from '../../../core/plugin-manager/interfaces.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

/**
 * MCPProvider - Model Context Protocol provider for Cloi
 * 
 * Enables Cloi to interact with external MCP servers, providing access to:
 * - External AI services via MCP
 * - Tools and capabilities from other MCP servers
 * - Dynamic context and resources
 * - Multi-server management
 */
export default class MCPProvider extends BaseProvider {
  constructor(manifest, config) {
    super(manifest, config);
    
    this.clients = new Map(); // Map of server name -> client instance
    this.servers = new Map(); // Map of server name -> server config
    this.eventEmitter = new EventEmitter();
    
    // Load server configurations
    this.loadServerConfigurations();
  }

  /**
   * Load MCP server configurations from config
   */
  loadServerConfigurations() {
    const serverConfigs = this.getConfig('servers', {});
    
    // Default Cloi MCP server configuration
    const defaultServers = {
      'cloi-mcp-server': {
        command: 'node',
        args: ['cloi-mcp-server/src/index.js'],
        description: 'Cloi development assistance server',
        enabled: true,
        timeout: 30000
      }
    };

    // Merge default and user-configured servers
    const allServers = { ...defaultServers, ...serverConfigs };
    
    for (const [name, config] of Object.entries(allServers)) {
      if (config.enabled !== false) {
        this.servers.set(name, {
          name,
          ...config,
          status: 'disconnected'
        });
      }
    }
  }

  /**
   * Check if MCP provider is available
   */
  async isAvailable() {
    return this.servers.size > 0;
  }

  /**
   * Connect to all configured MCP servers
   */
  async connect() {
    const connectionPromises = [];
    
    for (const [serverName, serverConfig] of this.servers) {
      connectionPromises.push(this.connectToServer(serverName, serverConfig));
    }
    
    const results = await Promise.allSettled(connectionPromises);
    
    // Log connection results
    results.forEach((result, index) => {
      const serverName = Array.from(this.servers.keys())[index];
      if (result.status === 'fulfilled') {
        console.log(`✅ Connected to MCP server: ${serverName}`);
      } else {
        console.warn(`⚠️ Failed to connect to MCP server: ${serverName}`, result.reason?.message);
      }
    });
    
    return this.getConnectedServers().length > 0;
  }

  /**
   * Connect to a specific MCP server
   */
  async connectToServer(serverName, serverConfig) {
    try {
      // Spawn the MCP server process
      const serverProcess = spawn(serverConfig.command, serverConfig.args || [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...serverConfig.env }
      });

      // Create transport and client
      const transport = new StdioClientTransport({
        reader: serverProcess.stdout,
        writer: serverProcess.stdin
      });

      const client = new Client(
        {
          name: `cloi-mcp-client-${serverName}`,
          version: '1.0.0'
        },
        {
          capabilities: {
            tools: {},
            resources: {}
          }
        }
      );

      // Connect to the server
      await client.connect(transport);
      
      // Store client and update server status
      this.clients.set(serverName, {
        client,
        process: serverProcess,
        transport,
        config: serverConfig,
        connectedAt: new Date(),
        lastUsed: new Date()
      });

      serverConfig.status = 'connected';
      
      // Set up error handling
      serverProcess.on('error', (error) => {
        console.error(`MCP server ${serverName} process error:`, error);
        this.handleServerDisconnection(serverName);
      });

      serverProcess.on('exit', (code) => {
        console.warn(`MCP server ${serverName} exited with code ${code}`);
        this.handleServerDisconnection(serverName);
      });

      this.eventEmitter.emit('server-connected', { serverName, serverConfig });
      
      return client;
      
    } catch (error) {
      serverConfig.status = 'error';
      serverConfig.lastError = error.message;
      throw new Error(`Failed to connect to MCP server ${serverName}: ${error.message}`);
    }
  }

  /**
   * Handle server disconnection
   */
  handleServerDisconnection(serverName) {
    const clientInfo = this.clients.get(serverName);
    if (clientInfo) {
      this.clients.delete(serverName);
      
      const serverConfig = this.servers.get(serverName);
      if (serverConfig) {
        serverConfig.status = 'disconnected';
      }
      
      this.eventEmitter.emit('server-disconnected', { serverName });
    }
  }

  /**
   * Disconnect from all MCP servers
   */
  async disconnect() {
    const disconnectionPromises = [];
    
    for (const [serverName, clientInfo] of this.clients) {
      disconnectionPromises.push(this.disconnectFromServer(serverName));
    }
    
    await Promise.allSettled(disconnectionPromises);
    this.clients.clear();
  }

  /**
   * Disconnect from a specific MCP server
   */
  async disconnectFromServer(serverName) {
    const clientInfo = this.clients.get(serverName);
    if (!clientInfo) return;
    
    try {
      await clientInfo.client.close();
      clientInfo.process.kill();
      this.clients.delete(serverName);
      
      const serverConfig = this.servers.get(serverName);
      if (serverConfig) {
        serverConfig.status = 'disconnected';
      }
      
    } catch (error) {
      console.warn(`Error disconnecting from MCP server ${serverName}:`, error.message);
    }
  }

  /**
   * Query MCP servers with intelligent routing
   */
  async query(prompt, options = {}) {
    if (!await this.isAvailable()) {
      throw new Error('MCP provider is not available');
    }

    const connectedServers = this.getConnectedServers();
    if (connectedServers.length === 0) {
      // Try to connect first
      const connected = await this.connect();
      if (!connected) {
        throw new Error('No MCP servers are available');
      }
    }

    // Determine best server for the query
    const targetServer = this.selectServerForQuery(prompt, options);
    
    try {
      const result = await this.queryServer(targetServer, prompt, options);
      
      // Update last used time
      const clientInfo = this.clients.get(targetServer);
      if (clientInfo) {
        clientInfo.lastUsed = new Date();
      }
      
      return {
        response: result.response || result.content?.[0]?.text || 'No response',
        server: targetServer,
        model: options.model || 'mcp-default',
        usage: result.usage || {
          promptTokens: Math.floor(prompt.length / 4),
          responseTokens: result.response ? Math.floor(result.response.length / 4) : 0,
          totalTokens: Math.floor(prompt.length / 4) + (result.response ? Math.floor(result.response.length / 4) : 0)
        },
        metadata: {
          server: targetServer,
          timestamp: new Date().toISOString(),
          tools: result.tools || []
        }
      };
      
    } catch (error) {
      // Try fallback servers if available
      const fallbackServers = connectedServers.filter(s => s !== targetServer);
      
      for (const fallbackServer of fallbackServers) {
        try {
          console.warn(`Trying fallback server: ${fallbackServer}`);
          const result = await this.queryServer(fallbackServer, prompt, options);
          
          return {
            response: result.response || result.content?.[0]?.text || 'No response',
            server: fallbackServer,
            model: options.model || 'mcp-fallback',
            usage: result.usage || {
              promptTokens: Math.floor(prompt.length / 4),
              responseTokens: result.response ? Math.floor(result.response.length / 4) : 0,
              totalTokens: Math.floor(prompt.length / 4) + (result.response ? Math.floor(result.response.length / 4) : 0)
            },
            metadata: {
              server: fallbackServer,
              timestamp: new Date().toISOString(),
              fallbackUsed: true,
              originalError: error.message
            }
          };
          
        } catch (fallbackError) {
          console.warn(`Fallback server ${fallbackServer} also failed:`, fallbackError.message);
        }
      }
      
      throw new Error(`All MCP servers failed. Last error: ${error.message}`);
    }
  }

  /**
   * Query a specific MCP server
   */
  async queryServer(serverName, prompt, options = {}) {
    const clientInfo = this.clients.get(serverName);
    if (!clientInfo) {
      throw new Error(`MCP server ${serverName} is not connected`);
    }

    const { client } = clientInfo;
    
    try {
      // Check if this is a tool call request
      if (options.tool) {
        return await this.callTool(serverName, options.tool, options.arguments || {});
      }
      
      // Check if this is a resource request
      if (options.resource) {
        return await this.getResource(serverName, options.resource);
      }
      
      // For general queries, try to find appropriate tools
      const tools = await this.listServerTools(serverName);
      
      // Simple heuristic to select appropriate tool based on prompt
      const selectedTool = this.selectToolForPrompt(prompt, tools);
      
      if (selectedTool) {
        // Use the selected tool
        return await this.callTool(serverName, selectedTool.name, {
          prompt,
          ...options.arguments
        });
      } else {
        // If no specific tool, return a general response
        return {
          response: `Query processed by MCP server ${serverName}`,
          tools: tools.map(t => t.name),
          server: serverName
        };
      }
      
    } catch (error) {
      throw new Error(`MCP server ${serverName} query failed: ${error.message}`);
    }
  }

  /**
   * Call a tool on an MCP server
   */
  async callTool(serverName, toolName, arguments_) {
    const clientInfo = this.clients.get(serverName);
    if (!clientInfo) {
      throw new Error(`MCP server ${serverName} is not connected`);
    }

    try {
      const result = await clientInfo.client.callTool({
        name: toolName,
        arguments: arguments_
      });
      
      return {
        response: result.content?.[0]?.text || 'Tool executed successfully',
        tool: toolName,
        server: serverName,
        result
      };
      
    } catch (error) {
      throw new Error(`Tool ${toolName} call failed on server ${serverName}: ${error.message}`);
    }
  }

  /**
   * Get a resource from an MCP server
   */
  async getResource(serverName, resourceUri) {
    const clientInfo = this.clients.get(serverName);
    if (!clientInfo) {
      throw new Error(`MCP server ${serverName} is not connected`);
    }

    try {
      const result = await clientInfo.client.readResource({ uri: resourceUri });
      
      return {
        response: result.contents?.[0]?.text || 'Resource retrieved successfully',
        resource: resourceUri,
        server: serverName,
        result
      };
      
    } catch (error) {
      throw new Error(`Resource ${resourceUri} retrieval failed from server ${serverName}: ${error.message}`);
    }
  }

  /**
   * List tools available on an MCP server
   */
  async listServerTools(serverName) {
    const clientInfo = this.clients.get(serverName);
    if (!clientInfo) {
      return [];
    }

    try {
      const result = await clientInfo.client.listTools();
      return result.tools || [];
    } catch (error) {
      console.warn(`Failed to list tools from server ${serverName}:`, error.message);
      return [];
    }
  }

  /**
   * List all available tools across all connected servers
   */
  async listAllTools() {
    const allTools = {};
    
    for (const serverName of this.getConnectedServers()) {
      const tools = await this.listServerTools(serverName);
      allTools[serverName] = tools;
    }
    
    return allTools;
  }

  /**
   * Select the best server for a query based on server capabilities and load
   */
  selectServerForQuery(prompt, options) {
    const connectedServers = this.getConnectedServers();
    
    if (connectedServers.length === 0) {
      throw new Error('No connected MCP servers available');
    }
    
    // If specific server requested
    if (options.server && connectedServers.includes(options.server)) {
      return options.server;
    }
    
    // Simple load balancing - prefer least recently used server
    let selectedServer = connectedServers[0];
    let oldestUsage = new Date();
    
    for (const serverName of connectedServers) {
      const clientInfo = this.clients.get(serverName);
      if (clientInfo && clientInfo.lastUsed < oldestUsage) {
        oldestUsage = clientInfo.lastUsed;
        selectedServer = serverName;
      }
    }
    
    return selectedServer;
  }

  /**
   * Select appropriate tool for a prompt
   */
  selectToolForPrompt(prompt, tools) {
    if (!tools || tools.length === 0) return null;
    
    const promptLower = prompt.toLowerCase();
    
    // Simple heuristics for tool selection (order matters - more specific first)
    const toolSelectionRules = [
      { keywords: ['github', 'git'], tools: ['github_cli_command'] },
      { keywords: ['plugin'], tools: ['generate_plugin_template', 'analyze_cloi_plugins'] },
      { keywords: ['analyze', 'analysis', 'error'], tools: ['analyze_cloi_module', 'analyze_test_failure'] },
      { keywords: ['test', 'testing'], tools: ['create_test_suite', 'generate_test_scenarios'] },
      { keywords: ['document', 'docs'], tools: ['generate_api_docs', 'generate_developer_guide'] },
      { keywords: ['generate', 'create'], tools: ['generate_cloi_boilerplate', 'generate_test_scenarios'] }
    ];
    
    for (const rule of toolSelectionRules) {
      if (rule.keywords.some(keyword => promptLower.includes(keyword))) {
        const matchingTool = tools.find(tool => rule.tools.includes(tool.name));
        if (matchingTool) return matchingTool;
      }
    }
    
    // Default to first available tool if no specific match
    return tools[0];
  }

  /**
   * Get list of connected server names
   */
  getConnectedServers() {
    return Array.from(this.clients.keys());
  }

  /**
   * Get server status information
   */
  getServerStatus() {
    const status = {};
    
    for (const [serverName, serverConfig] of this.servers) {
      const clientInfo = this.clients.get(serverName);
      
      status[serverName] = {
        name: serverName,
        status: serverConfig.status,
        description: serverConfig.description,
        connected: !!clientInfo,
        connectedAt: clientInfo?.connectedAt,
        lastUsed: clientInfo?.lastUsed,
        lastError: serverConfig.lastError
      };
    }
    
    return status;
  }

  /**
   * Get supported models (delegated to connected servers)
   */
  getSupportedModels() {
    const models = ['mcp-default'];
    
    for (const serverName of this.getConnectedServers()) {
      models.push(`mcp-${serverName}`);
    }
    
    return models;
  }

  /**
   * Get provider capabilities
   */
  getCapabilities() {
    return {
      streaming: false,
      functionCalling: true,
      tools: true,
      resources: true,
      multiServer: true,
      dynamicContext: true,
      maxTokens: 32768
    };
  }

  /**
   * Add event listener for MCP events
   */
  on(event, listener) {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Remove event listener
   */
  off(event, listener) {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Cleanup when provider is destroyed
   */
  async destroy() {
    await this.disconnect();
    this.eventEmitter.removeAllListeners();
  }
}