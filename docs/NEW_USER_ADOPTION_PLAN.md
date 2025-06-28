# Cloi New User Adoption Plan

This document outlines the plan for new users to successfully adopt and integrate Cloi into their development workflow.

## Overview

Cloi is a security-first agentic debugging tool that transforms terminal error handling through AI-powered analysis, modular plugins, and intelligent workflows. This plan guides new users from installation to advanced usage.

## Installation Methods

### Method 1: NPM Global Installation (Recommended)

```bash
# Install globally
npm install -g @cloi-ai/cloi

# Verify installation
cloi --help
```

#### Ollama Setup (Required for Local AI)

```bash
# 1. Install Ollama
# macOS:
brew install ollama

# Linux:
curl -fsSL https://ollama.com/install.sh | sh

# Windows: Download from https://ollama.com/download

# 2. Start Ollama service
ollama serve  # Or it may start automatically

# 3. Download Cloi's default model (phi4)
ollama pull phi4

# 4. Verify setup
ollama list
ollama run phi4 "Hello, test message"

# 5. Configure Cloi to use Ollama
cloi config set providers.default ollama
cloi config set providers.ollama.defaultModel phi4:latest
```

### Method 2: Local Development Installation

```bash
# Clone repository
git clone https://github.com/cloi-ai/cloi.git
cd cloi

# Install dependencies
npm install

# Link globally (requires sudo on some systems)
npm link

# Verify installation
cloi --help
```

### Method 3: Direct Usage (No Installation)

```bash
# Clone and run directly
git clone https://github.com/cloi-ai/cloi.git
cd cloi
npm install

# Use directly
./bin/cloi --help
```

## Getting Started Journey

### Phase 1: Initial Setup (10 minutes)

1. **Install Cloi**
   ```bash
   npm install -g @cloi-ai/cloi
   ```

2. **Setup Ollama (Local AI)**
   ```bash
   # Install Ollama
   brew install ollama  # macOS
   # or curl -fsSL https://ollama.com/install.sh | sh  # Linux
   
   # Download default model
   ollama pull phi4
   
   # Verify Ollama works
   ollama run phi4 "Hello, can you help debug code?"
   ```

3. **Verify Installation**
   ```bash
   cloi --help
   ```

4. **Check System Status**
   ```bash
   cloi status
   ```

5. **View Available Plugins**
   ```bash
   cloi plugins list
   ```

### Phase 2: Basic Usage (15 minutes)

1. **Error Analysis**
   ```bash
   # Navigate to your project
   cd /path/to/your/project
   
   # Analyze a simple error
   cloi analyze "ReferenceError: variable is not defined"
   
   # Analyze with file context
   cloi analyze "Cannot read property of undefined" --files package.json src/app.js
   ```

2. **Session Management**
   ```bash
   # Check session status
   cloi session status
   
   # View session history
   cloi session history
   ```

3. **Configuration**
   ```bash
   # View current configuration
   cloi config show
   
   # Set AI provider preference (if you have API keys)
   cloi config set providers.default claude
   ```

### Phase 3: Intermediate Usage (30 minutes)

1. **Plugin System**
   ```bash
   # Load specific analyzers for your project type
   cloi plugins load analyzers:javascript  # For JS/TS projects
   cloi plugins load analyzers:repository  # For repo analysis
   
   # Load quality tools
   cloi plugins load quality:code-quality
   ```

2. **Project-Specific Configuration**
   ```bash
   # In your project directory, create .cloi directory
   mkdir .cloi
   
   # Create project-specific config
   cloi config set plugins.autoLoad true --scope project
   cloi config set analysis.maxTokens 1024 --scope project
   ```

3. **Advanced Error Analysis**
   ```bash
   # Analyze with rich context
   cloi analyze "Build failed: Module not found" --context '{"buildTool": "webpack", "nodeVersion": "18.x"}'
   ```

### Phase 4: Advanced Features (60 minutes)

1. **Workflow System**
   ```bash
   # Execute auto-repair workflows
   cloi workflow execute auto-repair --context '{"error": "Tests failing", "framework": "jest"}'
   
   # View workflow status
   cloi status
   ```

2. **CI/CD Integration**
   ```bash
   # Generate project-specific CI workflows
   cloi workflow generate --type auto-repair
   cloi workflow generate --type code-review
   ```

3. **A2A Protocol (Advanced)**
   ```bash
   # Start agent-to-agent server for AI collaboration
   cloi a2a start --port 9090
   
   # Check A2A status
   cloi a2a status
   ```

## Integration Workflows

### For JavaScript/TypeScript Projects

1. **Setup**
   ```bash
   cd your-js-project
   cloi plugins load analyzers:javascript
   cloi plugins load quality:code-quality
   cloi config set providers.default claude  # If available
   ```

2. **Common Usage Patterns**
   ```bash
   # Analyze build errors
   npm run build 2>&1 | cloi analyze
   
   # Analyze test failures
   npm test 2>&1 | cloi analyze
   
   # Analyze linting issues
   npm run lint 2>&1 | cloi analyze
   ```

### For Python Projects

1. **Setup**
   ```bash
   cd your-python-project
   cloi plugins load analyzers:python  # When available
   cloi plugins load quality:code-quality
   ```

2. **Common Usage Patterns**
   ```bash
   # Analyze Python errors
   python app.py 2>&1 | cloi analyze
   
   # Analyze pip install issues
   pip install requirements.txt 2>&1 | cloi analyze
   ```

### For DevOps/Infrastructure

1. **Setup**
   ```bash
   cd your-infrastructure-project
   cloi plugins load integrations:cicd
   cloi plugins load analyzers:repository
   ```

2. **Common Usage Patterns**
   ```bash
   # Analyze deployment failures
   cloi analyze "Deployment failed: Pod CrashLoopBackOff"
   
   # Analyze CI/CD pipeline issues
   cloi workflow execute auto-repair --context '{"ciSystem": "github-actions"}'
   ```

## Project Types and Recommended Plugins

### Web Development
```bash
cloi plugins load analyzers:javascript
cloi plugins load quality:code-quality
cloi plugins load integrations:browser-testing
```

### Backend Development
```bash
cloi plugins load analyzers:javascript    # For Node.js
cloi plugins load analyzers:repository    # For codebase analysis
cloi plugins load quality:code-quality
```

### DevOps/Infrastructure
```bash
cloi plugins load integrations:cicd
cloi plugins load analyzers:repository
cloi plugins load analyzers:environment
```

### Open Source Projects
```bash
cloi plugins load analyzers:repository
cloi plugins load analyzers:documentation
cloi plugins load quality:code-quality
```

## Configuration Templates

### Basic Configuration (.cloi/config.json)

#### For Local-First Setup (Recommended for Beginners)
```json
{
  "providers": {
    "default": "ollama",
    "fallback": ["claude"],
    "ollama": {
      "defaultModel": "phi4:latest",
      "baseUrl": "http://localhost:11434"
    }
  },
  "plugins": {
    "autoLoad": true,
    "searchPaths": [".cloi/plugins"]
  },
  "analysis": {
    "maxTokens": 512,
    "temperature": 0.3
  },
  "session": {
    "autoSave": true,
    "maxAge": "7d"
  }
}
```

#### For Cloud-First Setup (Requires API Keys)
```json
{
  "providers": {
    "default": "claude",
    "fallback": ["ollama"],
    "claude": {
      "apiKey": "${ANTHROPIC_API_KEY}"
    },
    "ollama": {
      "defaultModel": "phi4:latest"
    }
  },
  "plugins": {
    "autoLoad": true,
    "searchPaths": [".cloi/plugins"]
  },
  "analysis": {
    "maxTokens": 512,
    "temperature": 0.3
  },
  "session": {
    "autoSave": true,
    "maxAge": "7d"
  }
}
```

### Advanced Configuration
```json
{
  "providers": {
    "default": "claude",
    "fallback": ["mcp", "ollama"],
    "apiKeys": {
      "claude": "${ANTHROPIC_API_KEY}"
    }
  },
  "plugins": {
    "autoLoad": true,
    "searchPaths": [
      ".cloi/plugins",
      "~/.cloi/plugins"
    ],
    "enabled": [
      "analyzers:javascript",
      "analyzers:repository",
      "quality:code-quality",
      "integrations:cicd"
    ]
  },
  "workflows": {
    "autoRepair": {
      "enabled": true,
      "createPR": false,
      "runTests": true
    }
  },
  "a2a": {
    "enabled": true,
    "port": 9090,
    "allowedAIs": ["claude-code", "github-copilot"]
  }
}
```

## Best Practices

### 1. Project Organization
- Create `.cloi/` directory in project root
- Use project-specific configuration files
- Version control `.cloi/config.json` but not session data

### 2. Error Analysis
- Provide context with `--files` and `--context` flags
- Use meaningful error messages
- Include relevant log snippets

### 3. Plugin Management
- Load only necessary plugins for your project type
- Keep plugins updated
- Create custom plugins for project-specific needs

### 4. Session Management
- Use `cloi session restore` after interruptions
- Export sessions for important debugging sessions
- Clean up old sessions periodically

### 5. Security
- Never commit API keys to version control
- Use environment variables for sensitive configuration
- Review auto-generated fixes before applying

## Troubleshooting Guide

### Common Issues

1. **Installation Problems**
   ```bash
   # Permission issues
   sudo npm install -g @cloi-ai/cloi
   
   # Or use npx
   npx @cloi-ai/cloi --help
   ```

2. **Ollama Setup Issues**
   ```bash
   # Check if Ollama is installed
   which ollama
   ollama --version
   
   # Check if Ollama service is running
   ollama list
   
   # Start Ollama if not running
   ollama serve
   
   # Download required model
   ollama pull phi4
   
   # Test Ollama communication
   ollama run phi4 "Hello"
   
   # Check available models
   ollama list
   ```

3. **Model Download Problems**
   ```bash
   # Check disk space (models are 3-15GB)
   df -h
   
   # Clear Ollama cache if needed
   ollama rm phi4
   ollama pull phi4
   
   # Try smaller model if space is limited
   ollama pull gemma3:4b  # ~3GB instead of ~7GB
   cloi config set providers.ollama.defaultModel gemma3:4b
   ```

4. **Plugin Loading Failures**
   ```bash
   # Check plugin status
   cloi status
   
   # Reset plugin configuration
   cloi config set plugins.autoLoad false
   cloi config set plugins.autoLoad true
   ```

5. **AI Provider Issues**
   ```bash
   # Check available providers
   cloi config show
   
   # Test Ollama connection
   ollama run phi4 "test"
   
   # Set fallback provider if Ollama fails
   cloi config set providers.default claude  # Requires API key
   ```

6. **Session Problems**
   ```bash
   # Check session status
   cloi session status
   
   # Force new session
   cloi session restore --force
   ```

### Performance Optimization

1. **Reduce Analysis Time**
   ```bash
   # Limit token usage
   cloi config set analysis.maxTokens 256
   
   # Use faster, smaller models
   cloi config set providers.ollama.defaultModel gemma3:4b
   ```

2. **Ollama Performance Tuning**
   ```bash
   # Check current resource usage
   ollama ps
   
   # Use CPU-optimized models for slower machines
   ollama pull phi4:14b-medium   # Medium size
   ollama pull gemma3:4b         # Smallest option
   
   # Monitor GPU usage (if available)
   nvidia-smi  # For NVIDIA GPUs
   ```

3. **Model Selection Guide**
   ```bash
   # Performance vs Quality (fastest to most accurate):
   # gemma3:4b      - ~3GB, fastest, good for simple errors
   # phi4:latest    - ~7GB, balanced, default choice  
   # llama3.1:8b   - ~4.5GB, good quality, moderate speed
   # phi4:14b      - ~14GB, best quality, slower
   
   # Set based on your system:
   cloi config set providers.ollama.defaultModel gemma3:4b    # For limited resources
   cloi config set providers.ollama.defaultModel phi4:latest  # Default (recommended)
   cloi config set providers.ollama.defaultModel phi4:14b     # For best quality
   ```

4. **Optimize Plugin Loading**
   ```bash
   # Disable auto-loading
   cloi config set plugins.autoLoad false
   
   # Load specific plugins only
   cloi plugins load analyzers:javascript
   ```

## Learning Resources

### Documentation
- [CLAUDE.md](../CLAUDE.md) - Development guide
- [A2A Integration](A2A_INTEGRATION.md) - Agent collaboration
- [Workflows](WORKFLOWS.md) - Workflow system

### Examples
- [Testing Plan](TESTING_PLAN.md) - Real-world usage examples
- Plugin documentation in `src/plugins/*/README.md`

### Community
- GitHub Issues: Report bugs and request features
- Discussions: Share usage patterns and tips
- Contributing: Help improve Cloi

## Migration from Other Tools

### From Traditional Debugging
```bash
# Instead of manually analyzing errors
# OLD: google "ReferenceError variable not defined"
# NEW: cloi analyze "ReferenceError: variable is not defined"
```

### From Other AI Tools
```bash
# Cloi provides context-aware analysis
cloi analyze "Build error" --files package.json webpack.config.js --context '{"framework": "react"}'
```

### From Manual CI/CD Fixes
```bash
# Let Cloi generate and apply fixes
cloi workflow execute auto-repair --context '{"buildLog": "..."}'
```

## Success Metrics

Track your Cloi adoption success:

1. **Time Saved**
   - Compare debug time before/after Cloi
   - Track resolution rate for common errors

2. **Error Resolution**
   - Monitor successful fix applications
   - Track session completion rates

3. **Workflow Efficiency**
   - Measure CI/CD failure recovery time
   - Track auto-repair success rate

4. **Team Adoption**
   - Monitor plugin usage across team
   - Track configuration standardization

## Next Steps

After completing the adoption plan:

1. **Customize for Your Workflow**
   - Create project-specific plugins
   - Develop custom workflows
   - Integrate with existing tools

2. **Team Rollout**
   - Share configuration templates
   - Document team-specific practices
   - Train team members on advanced features

3. **Continuous Improvement**
   - Monitor usage patterns
   - Contribute improvements back to project
   - Stay updated with new releases

---

**Support**: For questions or issues, create an issue on [GitHub](https://github.com/cloi-ai/cloi/issues) or check the documentation.

**Version**: This guide is for Cloi v1.0.8+