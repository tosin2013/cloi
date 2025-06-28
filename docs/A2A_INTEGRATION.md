# A2A Protocol Integration Documentation

## Overview

The A2A (Agent-to-Agent) protocol allows external AI systems to collaborate with Cloi. This document explains how to integrate your AI with Cloi's A2A features.

## Connection Details

- **Protocol**: WebSocket
- **Default Port**: 9090
- **Endpoint**: `ws://localhost:9090`

## Available A2A Features

### 1. Project Understanding
Get comprehensive information about the current project:
```javascript
{
  "type": "project-understanding",
  "context": {
    "depth": "comprehensive" // quick | standard | comprehensive | deep
  }
}
```

### 2. Problem Solving
Collaborate on solving specific problems:
```javascript
{
  "type": "problem-solving",
  "context": {
    "problem": "Description of the issue",
    "files": ["relevant/files.js"],
    "errorMessage": "Any error messages"
  }
}
```

### 3. Tool Execution
Use Cloi's local development tools:
```javascript
{
  "type": "tool-execution",
  "context": {
    "tools": [
      {
        "name": "eslint",
        "operation": "check",
        "parameters": { "fix": true }
      }
    ]
  }
}
```

### 4. Code Context
Get detailed analysis of specific code:
```javascript
{
  "type": "code-context",
  "context": {
    "files": ["src/app.js", "package.json"],
    "analysisType": "comprehensive"
  }
}
```

### 5. Plugin Contribution (Layer 2)
Contribute new plugins to the Cloi ecosystem:
```javascript
{
  "type": "plugin-contribution",
  "context": {
    "plugin": {
      "name": "my-analyzer",
      "type": "analyzers",
      "description": "Custom code analyzer"
    },
    "repository": "https://github.com/tosin2013/cloi.git",
    "submitPR": true
  }
}
```

## Integration Examples

### For Claude Code
```
When asked to help with a user's project, connect to Cloi's A2A service at ws://localhost:9090 to get real project context and use local tools.
```

### For GitHub Copilot
```
Enhance completions by connecting to Cloi for project-specific context and patterns.
```

### For Custom AI
```
Use Cloi's A2A protocol to understand the local development environment and provide contextual assistance.
```

## Response Format

All A2A responses follow this structure:
```javascript
{
  "success": true,
  "type": "response-type",
  "data": {
    // Response data specific to the request type
  },
  "metadata": {
    "timestamp": "2024-01-20T10:30:00Z",
    "agentId": "cloi-local-agent",
    "version": "1.0.0"
  }
}
```

## Error Handling

```javascript
{
  "success": false,
  "error": {
    "code": "TOOL_NOT_FOUND",
    "message": "Requested tool 'xyz' is not available",
    "details": {}
  }
}
```

## Best Practices

1. **Always request project context first** before making recommendations
2. **Handle connection failures gracefully** - work with limited context if Cloi unavailable
3. **Respect rate limits** - Don't overwhelm Cloi with requests
4. **Use appropriate depth levels** - Quick for simple queries, comprehensive for complex tasks
5. **Cache responses** when appropriate to reduce load

## Security Considerations

- A2A runs on localhost only by default
- Authentication tokens can be configured for production use
- All file access is sandboxed to the project directory
- Plugin contributions require human review via PR

## Getting Started

1. Start Cloi's A2A service: `cloi a2a start`
2. Connect your AI to `ws://localhost:9090`
3. Send a project-understanding request
4. Use the context to provide enhanced assistance

For implementation details, see the example clients in `/examples/a2a-clients/`