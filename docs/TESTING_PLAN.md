# Cloi Testing Plan - External Project Integration

This document outlines the testing plan for using Cloi in external projects to validate its functionality and effectiveness.

## Overview

This plan covers testing Cloi's modular architecture, plugin system, and workflow capabilities in real-world scenarios using external projects.

## Phase 1: Local Development Testing

### Prerequisites

1. **Build Cloi Locally**
   ```bash
   cd /path/to/cloi
   npm install
   npm link  # or sudo npm link if needed
   ```

2. **Verify Installation**
   ```bash
   cloi --help              # Unified CLI with both legacy and enhanced features
   ```

3. **Ollama Setup and Validation**
   ```bash
   # Check if Ollama is installed
   ollama --version
   
   # If not installed, download from https://ollama.com/download
   # Or use package managers:
   # macOS: brew install ollama
   # Linux: curl -fsSL https://ollama.com/install.sh | sh
   
   # Download the default Cloi model (phi4)
   ollama pull phi4
   
   # Verify model is available
   ollama list
   
   # Test Ollama communication
   ollama run phi4 "Hello, can you help debug code?"
   
   # Alternative models if phi4 is not available:
   ollama pull phi4:latest      # Latest phi4 version
   ollama pull llama3.1:8b      # Alternative model
   ollama pull gemma3:4b        # Smaller alternative
   ```

4. **Configure Cloi for Ollama**
   ```bash
   # Set Ollama as default provider
   cloi config set providers.default ollama
   
   # Set default model (phi4 is default)
   cloi config set providers.ollama.defaultModel phi4:latest
   
   # Verify configuration
   cloi config show
   ```

### Test Projects Selection

Choose diverse projects to test different capabilities:

1. **JavaScript/Node.js Project** - Test JavaScript analyzer and package management
2. **Python Project** - Test Python linting and analysis
3. **Mixed Language Project** - Test multi-language support
4. **CI/CD Project** - Test workflow generation and auto-repair

## Phase 2: External Project Testing

### Test Case 1: JavaScript/Node.js Project

**Project Type**: React/Next.js application with existing issues

**Setup**:
```bash
# Navigate to test project
cd /path/to/test-project

# Initialize Cloi in project
cloi status
cloi config show
```

**Test Scenarios**:

1. **Error Analysis**
   ```bash
   # Simulate common errors
   cloi analyze "ReferenceError: variable is not defined"
   cloi analyze "TypeError: Cannot read property 'map' of undefined"
   ```

2. **Plugin Discovery**
   ```bash
   cloi plugins list
   cloi plugins load analyzers:javascript
   ```

3. **Configuration Management**
   ```bash
   cloi config set providers.default claude
   cloi config set plugins.autoLoad true
   ```

4. **Session Management**
   ```bash
   cloi session status
   cloi session history
   ```

### Test Case 2: Python Project

**Project Type**: Django or Flask application

**Setup**:
```bash
cd /path/to/python-project
cloi plugins load analyzers:python  # If available
```

**Test Scenarios**:

1. **Python Error Analysis**
   ```bash
   cloi analyze "NameError: name 'variable' is not defined"
   cloi analyze "IndentationError: expected an indented block"
   ```

2. **Code Quality Integration**
   ```bash
   cloi plugins load quality:code-quality
   # Test Python linting integration
   ```

### Test Case 3: CI/CD Integration

**Project Type**: Project with GitHub Actions

**Setup**:
```bash
cd /path/to/cicd-project
cloi plugins load integrations:cicd
```

**Test Scenarios**:

1. **Workflow Generation**
   ```bash
   # Generate project-specific workflows
   cloi workflow execute auto-repair --type auto-repair
   cloi workflow execute code-review --type code-review
   ```

2. **Auto-Repair Testing**
   ```bash
   # Simulate CI failure
   cloi workflow execute auto-repair --context '{"error": "Test failed", "buildLog": "..."}'
   ```

### Test Case 4: A2A Protocol Inter-Project Communication Testing

**Overview**: Comprehensive testing of Agent-to-Agent (A2A) protocol for inter-project communication, allowing external projects to communicate with CLOI and leverage its analysis capabilities.

**⚠️ Important**: External projects should **NOT** require access to CLOI's source code. The A2A protocol is designed for black-box communication where external projects only need:
- The CLOI A2A server endpoint (HTTP URL)
- The A2A protocol specification (JSON-RPC 2.0)
- Agent discovery capabilities

**CLOI Deployment Scenarios for External Projects**:
1. **Remote Deployment**: CLOI hosted on a server (e.g., `https://cloi-api.company.com`)
2. **Local Installation**: CLOI installed via npm/package manager on developer machines
3. **Container Service**: CLOI running in Docker/Kubernetes for team access
4. **CI/CD Service**: CLOI as a service in continuous integration pipelines

#### 4.1 A2A Server Setup and Validation

**For CLOI Developers (Internal Testing)**:
```bash
# Ensure all dependencies are installed
cd /path/to/cloi
npm install

# Verify A2A module availability
node -e "import('./src/protocols/a2a/index.js').then(() => console.log('✅ A2A available')).catch(() => console.log('❌ A2A unavailable'))"

# Start CLOI A2A Server
node test-a2a-server-persistent.js
# OR
cloi a2a start --port 9090
```

**For External Projects (Production Usage)**:
```bash
# External projects assume CLOI is already deployed/running
# They only need to know the endpoint URL

# Option 1: Use a remote CLOI deployment
export CLOI_A2A_ENDPOINT="https://cloi-api.company.com"

# Option 2: Use local CLOI installation
export CLOI_A2A_ENDPOINT="http://localhost:9090"

# Option 3: Use containerized CLOI
export CLOI_A2A_ENDPOINT="http://cloi-service:9090"

# Verify CLOI is accessible
curl -f $CLOI_A2A_ENDPOINT/health
```

**Expected Output**:
```
🚀 Starting persistent A2A server for testing...
🤖 A2A HTTP Server initialized with agent ID: [uuid]
✅ A2A server started successfully on port 9090
🔗 Agent Card: http://localhost:9090/.well-known/agent.json
📡 JSON-RPC endpoint: http://localhost:9090/
💾 Health check: http://localhost:9090/health
📞 Press Ctrl+C to stop the server
```

#### 4.2 Basic A2A Server Validation

**Test 1: Agent Card Discovery**
```bash
# Test agent card endpoint
curl -X GET http://localhost:9090/.well-known/agent.json | jq

# Expected: JSON response with agent capabilities
```

**Test 2: Health Check**
```bash
# Test health endpoint
curl -X GET http://localhost:9090/health | jq

# Expected: Status, agent ID, uptime, metrics
```

**Test 3: JSON-RPC Interface**
```bash
# Test basic JSON-RPC communication
curl -X POST http://localhost:9090/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "message/send",
    "params": {
      "message": {
        "messageId": "test-1",
        "role": "user",
        "kind": "message",
        "parts": [{"kind": "text", "text": "Hello CLOI!"}]
      }
    },
    "id": 1
  }' | jq
```

#### 4.3 External Client Testing

**Setup External Test Client**:
```javascript
// external-test-client.js
import { v4 as uuidv4 } from 'uuid';

class CloiA2AClient {
  constructor(baseUrl = 'http://localhost:9090') {
    // External projects can point to any CLOI deployment:
    // - Local: 'http://localhost:9090'
    // - Remote: 'https://cloi-api.company.com'
    // - Container: 'http://cloi-service:9090'
    this.baseUrl = baseUrl;
  }

  async getAgentCard() {
    const response = await fetch(`${this.baseUrl}/.well-known/agent.json`);
    return await response.json();
  }

  async sendMessage(text, options = {}) {
    const request = {
      jsonrpc: '2.0',
      method: 'message/send',
      params: {
        message: {
          messageId: uuidv4(),
          role: 'user',
          kind: 'message',
          parts: [{ kind: 'text', text }]
        },
        configuration: {
          blocking: true,
          acceptedOutputModes: ['text/plain'],
          ...options
        }
      },
      id: Date.now()
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    return await response.json();
  }

  async getHealth() {
    const response = await fetch(`${this.baseUrl}/health`);
    return await response.json();
  }
}

// Test usage
const client = new CloiA2AClient();

// Test 1: Agent Discovery
console.log('Agent Card:', await client.getAgentCard());

// Test 2: Error Analysis
const errorResponse = await client.sendMessage(
  'Analyze this error: ReferenceError: x is not defined'
);
console.log('Analysis:', errorResponse);

// Test 3: Code Review Request
const codeResponse = await client.sendMessage(`
  Review this code for issues:
  function processData(data) {
    return data.map(item => item.value);
  }
`);
console.log('Code Review:', codeResponse);
```

**Run External Client Test**:
```bash
# Run the external client test
node external-test-client.js
```

#### 4.4 Inter-Project Communication Scenarios

**Scenario 1: Error Analysis Integration**
```javascript
// external-project/src/error-handler.js
// Note: External projects create their own A2A client library
// They don't import from CLOI's source code

// external-project/lib/cloi-client.js (external project's own library)
import { v4 as uuidv4 } from 'uuid';

export class CloiA2AClient {
  constructor(baseUrl = process.env.CLOI_A2A_ENDPOINT || 'http://localhost:9090') {
    this.baseUrl = baseUrl;
  }

  async sendMessage(text, options = {}) {
    const request = {
      jsonrpc: '2.0',
      method: 'message/send',
      params: {
        message: {
          messageId: uuidv4(),
          role: 'user',
          kind: 'message',
          parts: [{ kind: 'text', text }]
        },
        configuration: {
          blocking: true,
          acceptedOutputModes: ['text/plain'],
          ...options
        }
      },
      id: Date.now()
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`CLOI A2A request failed: ${response.status}`);
    }

    return await response.json();
  }
}

// external-project/src/error-handler.js
import { CloiA2AClient } from '../lib/cloi-client.js';

class ErrorAnalyzer {
  constructor() {
    this.cloi = new CloiA2AClient('http://localhost:9090');
  }

  async analyzeError(error, context = {}) {
    const prompt = `
Analyze this error and provide solutions:

Error: ${error.message}
Stack: ${error.stack}
Context: ${JSON.stringify(context)}

Please provide:
1. Root cause analysis
2. Potential fixes
3. Prevention strategies
    `;

    try {
      const response = await this.cloi.sendMessage(prompt);
      return {
        analysis: response.result?.message?.parts?.[0]?.text,
        confidence: response.result?.confidence || 0.8,
        taskId: response.result?.taskId
      };
    } catch (error) {
      console.error('CLOI analysis failed:', error);
      return { analysis: null, error: error.message };
    }
  }
}

// Usage in external project
const analyzer = new ErrorAnalyzer();

try {
  throw new ReferenceError('x is not defined');
} catch (error) {
  const analysis = await analyzer.analyzeError(error, {
    file: 'src/app.js',
    line: 42,
    function: 'processData'
  });
  
  console.log('CLOI Analysis:', analysis.analysis);
}
```

**Scenario 2: CI/CD Integration**
```javascript
// external-project/.github/workflows/cloi-analysis.yml
name: CLOI Error Analysis

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
             - name: Assume CLOI A2A Server is Running
         run: |
           # External projects assume CLOI A2A server is already running
           # This could be:
           # 1. A deployed CLOI instance (e.g., https://cloi-api.company.com)
           # 2. A local CLOI installation managed separately
           # 3. A containerized CLOI service
           
           # Wait for CLOI server to be available
           timeout 30 bash -c 'until curl -f http://localhost:9090/health; do sleep 2; done'
      
      - name: Run tests with CLOI analysis
        run: |
          npm test 2>&1 | tee test-output.log || true
          
          # Send test failures to CLOI for analysis
          node -e "
            const fs = require('fs');
            const testOutput = fs.readFileSync('test-output.log', 'utf8');
            if (testOutput.includes('FAIL')) {
              // Send to CLOI A2A server for analysis
              fetch('http://localhost:9090/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'message/send',
                  params: {
                    message: {
                      messageId: 'ci-analysis',
                      role: 'user',
                      kind: 'message',
                      parts: [{ kind: 'text', text: 'Analyze test failures: ' + testOutput }]
                    }
                  },
                  id: 1
                })
              }).then(r => r.json()).then(console.log);
            }
          "
```

**Scenario 3: Real-time Development Assistant**
```javascript
// external-project/src/dev-assistant.js
import { CloiA2AClient } from './cloi-client.js';
import chokidar from 'chokidar';
import { exec } from 'child_process';

class DevAssistant {
  constructor() {
    this.cloi = new CloiA2AClient('http://localhost:9090');
    this.isAnalyzing = false;
  }

  start() {
    console.log('🤖 Starting development assistant with CLOI integration...');
    
    // Watch for file changes
    chokidar.watch('src/**/*.js').on('change', async (path) => {
      if (this.isAnalyzing) return;
      
      console.log(`📁 File changed: ${path}`);
      await this.analyzeFile(path);
    });

    // Watch for git commits
    chokidar.watch('.git/COMMIT_EDITMSG').on('change', async () => {
      await this.analyzeCommit();
    });
  }

  async analyzeFile(filePath) {
    this.isAnalyzing = true;
    
    try {
      // Run linter/tests and capture output
      exec(`npm run lint ${filePath}`, async (error, stdout, stderr) => {
        if (error) {
          const analysis = await this.cloi.sendMessage(`
            Analyze this linting error and suggest fixes:
            File: ${filePath}
            Error: ${stderr}
            
            Provide specific code fixes.
          `);
          
          console.log('🔍 CLOI Analysis:', analysis.result?.message?.parts?.[0]?.text);
        }
      });
    } finally {
      this.isAnalyzing = false;
    }
  }

  async analyzeCommit() {
    try {
      exec('git diff --cached', async (error, stdout) => {
        if (stdout) {
          const analysis = await this.cloi.sendMessage(`
            Review this code diff before commit:
            ${stdout}
            
            Check for:
            1. Potential bugs
            2. Code quality issues
            3. Security concerns
            4. Performance issues
          `);
          
          console.log('📝 Pre-commit Review:', analysis.result?.message?.parts?.[0]?.text);
        }
      });
    } catch (error) {
      console.error('Commit analysis failed:', error);
    }
  }
}

// Start the assistant
const assistant = new DevAssistant();
assistant.start();
```

#### 4.5 A2A Method Testing

**Test JSON-RPC Methods**:
```bash
# Test message/send
curl -X POST http://localhost:9090/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"message/send","params":{"message":{"messageId":"test","role":"user","kind":"message","parts":[{"kind":"text","text":"test"}]}},"id":1}'

# Test tasks/get (if task exists)
curl -X POST http://localhost:9090/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tasks/get","params":{"taskId":"test-task-id"},"id":2}'

# Test message/stream (Server-Sent Events)
curl -X POST http://localhost:9090/ \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"message/stream","params":{"message":{"messageId":"stream-test","role":"user","kind":"message","parts":[{"kind":"text","text":"Stream test"}]}},"id":3}'
```

#### 4.6 Performance and Monitoring Validation

**Test Enhanced Monitoring**:
```bash
# Run validation with monitoring
node src/cli/index.js validate interactive-commands --timeout 5

# Check timeout metrics
node src/cli/index.js validate timeout-metrics

# Run health check
node src/cli/index.js validate health-check --verbose

# Check for performance regressions
node src/cli/index.js validate performance-regression
```

**Expected Monitoring Output**:
```
📊 Timeout and Performance Metrics

📈 Overall Statistics:
  Total Commands Executed: 10
  Successful Commands: 10
  Timed Out Commands: 0
  Timeout Rate: 0.00%
  Average Execution Time: 296ms

🔍 Command Performance Breakdown:
  interactive_command_help: 2 runs, 180ms avg, 100.00% success
  validate_interactive_commands: 2 runs, 742ms avg, 100.00% success
```

#### 4.7 A2A Troubleshooting

**Common Issues and Solutions**:

1. **Port Conflicts**
   ```bash
   # Check if port is in use
   lsof -i :9090
   
   # Kill existing processes
   pkill -f "a2a-server"
   
   # Use different port
   node test-a2a-server-persistent.js --port 9091
   ```

2. **Connection Errors**
   ```bash
   # Check server status
   curl -f http://localhost:9090/health || echo "Server not responding"
   
   # Check A2A module
   node -e "import('./src/protocols/a2a/index.js').then(console.log)"
   ```

3. **JSON-RPC Errors**
   ```bash
   # Validate JSON-RPC request format
   echo '{"jsonrpc":"2.0","method":"message/send","params":{},"id":1}' | jq
   
   # Check response format
   curl -s http://localhost:9090/ -d '{"jsonrpc":"2.0","method":"message/send","params":{"message":{"messageId":"test","role":"user","kind":"message","parts":[{"kind":"text","text":"test"}]}},"id":1}' -H "Content-Type: application/json" | jq
   ```

**Performance Issues**:
```bash
# Monitor A2A server resources
ps aux | grep node
htop # Check CPU/memory usage

# Test A2A response times
time curl -X POST http://localhost:9090/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"message/send","params":{"message":{"messageId":"perf-test","role":"user","kind":"message","parts":[{"kind":"text","text":"Quick test"}]}},"id":1}'
```

#### 4.8 Success Criteria for A2A Testing

**✅ Agent Discovery**:
- Agent card accessible at `/.well-known/agent.json`
- Contains valid capabilities, skills, and metadata
- Returns proper JSON format

**✅ JSON-RPC Communication**:
- All standard A2A methods respond correctly
- Error responses follow JSON-RPC 2.0 specification
- Request/response IDs match properly

**✅ Inter-Project Integration**:
- External projects can successfully communicate with CLOI
- Error analysis provides meaningful results
- CI/CD integration works without blocking pipelines

**✅ Performance Benchmarks**:
- Agent card response: < 100ms
- Simple message/send: < 2 seconds
- Complex analysis: < 30 seconds
- Memory usage: < 200MB for A2A server

**✅ Monitoring Integration**:
- Timeout metrics collected for A2A operations
- Health checks include A2A server status
- Performance regression detection works for A2A methods

## Phase 3: Advanced Features Testing

### Workflow System Testing

1. **Dynamic Workflow Generation**
   ```bash
   cloi-enhanced workflow execute deployment --context '{"env": "staging"}'
   cloi-enhanced workflow execute test-debug --context '{"testFile": "failing-test.js"}'
   ```

2. **Rollback Capabilities**
   ```bash
   cloi-enhanced workflow rollback <workflow-id>
   cloi-enhanced workflow list-rollbacks
   ```

### Environment Context Testing

1. **Context Awareness**
   ```bash
   cloi-enhanced analyze --context '{"files": ["package.json", "src/app.js"]}'
   ```

2. **Tool Discovery**
   ```bash
   # Verify Cloi discovers project-specific tools
   cloi-enhanced status  # Should show detected tools and environment
   ```

## Phase 4: Integration Testing

### MCP Integration

1. **MCP Server Testing**
   ```bash
   cd /path/to/cloi/cloi-mcp-server
   npm install
   npm start
   
   # Test MCP functionality
   cloi-enhanced plugins load providers:mcp
   ```

### Plugin Development Testing

1. **Custom Plugin Creation**
   - Create a simple analyzer plugin
   - Test plugin loading and execution
   - Verify plugin discovery in project-specific `.cloi/plugins`

## Expected Results

### Success Criteria

1. **Core Functionality**
   - ✅ CLI commands work in external projects
   - ✅ Error analysis provides relevant suggestions
   - ✅ Session persistence works across interruptions

2. **Plugin System**
   - ✅ Plugins load correctly in different environments
   - ✅ Plugin discovery finds appropriate analyzers
   - ✅ Configuration persists per project

3. **Workflow System**
   - ✅ Dynamic workflows generate appropriate steps
   - ✅ Auto-repair workflows can fix simple issues
   - ✅ Rollback system restores previous state

4. **A2A Protocol**
   - ✅ External AIs can connect and collaborate
   - ✅ Context sharing works effectively
   - ✅ Real-time assistance improves development workflow

### Performance Benchmarks

1. **Response Time**: Error analysis < 5 seconds
2. **Memory Usage**: < 100MB baseline consumption
3. **Plugin Loading**: < 2 seconds for full plugin discovery
4. **Session Restore**: < 1 second for session restoration

## Troubleshooting Common Issues

### Installation Issues

1. **Permission Errors**
   ```bash
   sudo npm link  # If global linking fails
   # Or use local execution: node /path/to/cloi/src/cli/modular.js
   ```

2. **Missing Dependencies**
   ```bash
   cd /path/to/cloi
   npm install --production
   ```

### Runtime Issues

1. **Plugin Loading Failures**
   - Check plugin.json syntax
   - Verify plugin dependencies
   - Review plugin search paths

2. **Configuration Issues**
   - Reset config: `cloi config set --scope user`
   - Check config file permissions

3. **Ollama Communication Issues**
   ```bash
   # Check if Ollama service is running
   ollama list
   
   # If service not running, start it
   ollama serve
   
   # Check available models
   ollama list
   
   # Test model communication
   ollama run phi4 "test"
   
   # Check Ollama logs
   # macOS: ~/Library/Logs/Ollama/
   # Linux: /var/log/ollama/
   
   # Restart Ollama service if needed
   # macOS: brew services restart ollama
   # Linux: sudo systemctl restart ollama
   ```

4. **Model Download Issues**
   ```bash
   # Check available disk space (models are large)
   df -h
   
   # Re-download model if corrupted
   ollama rm phi4
   ollama pull phi4
   
   # Try alternative model
   ollama pull llama3.1:8b
   cloi config set providers.ollama.defaultModel llama3.1:8b
   ```

### Performance Issues

1. **Slow Analysis**
   - Check AI provider availability
   - Verify network connectivity (for Claude)
   - Review context size
   - Check Ollama model size (smaller models are faster)

2. **Ollama Performance Optimization**
   ```bash
   # Use smaller models for faster responses
   ollama pull gemma3:4b    # 4B parameter model
   cloi config set providers.ollama.defaultModel gemma3:4b
   
   # Check system resources
   # Ollama uses GPU if available, falls back to CPU
   ollama ps  # Show running models and resource usage
   ```

## Documentation Updates

Based on testing results, update:

1. **README.md** - Installation and quick start
2. **CLAUDE.md** - Development workflow integration
3. **Plugin Documentation** - Plugin creation and usage
4. **A2A Integration Guide** - External AI setup

## Next Steps

After completing external project testing:

1. Identify and fix any discovered issues
2. Optimize performance bottlenecks
3. Enhance plugin ecosystem based on real usage
4. Create project-specific templates and examples
5. Document best practices from testing experience

---

**Note**: This testing plan should be executed iteratively, with each phase building on the previous one's learnings and fixes.