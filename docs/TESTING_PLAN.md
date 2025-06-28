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

### Test Case 4: A2A Protocol Testing

**Setup**:
```bash
# Start A2A server (when implemented)
cloi a2a start --port 9090

# Test with external AI (if available)
cloi a2a status
```

**Test Scenarios**:

1. **Agent Communication**
   - Test Claude Code integration
   - Test universal AI prompt effectiveness
   - Validate real-time collaboration

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