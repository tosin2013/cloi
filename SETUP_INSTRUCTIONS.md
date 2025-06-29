# Using Cloi in Another Project

## Installation Options

### Option 1: Direct npm install from GitHub
```bash
npm install github:tosin2013/cloi
```

### Option 2: Local linking
```bash
# From the cloi directory
npm link

# From your project directory
npm link @cloi-ai/cloi
```

### Option 3: Copy the project
1. Copy the entire cloi directory to your project
2. Install dependencies:
```bash
cd cloi
npm install
```

## Usage

### As a global command
```bash
# After installation
cloi

# Or use the unified CLI directly
node /path/to/cloi/src/cli/index.js
```

### As a module in your project
```javascript
// Import specific modules
import { PluginManager } from '@cloi-ai/cloi/src/core/plugin-manager/index.js';
import { ConfigManager } from '@cloi-ai/cloi/src/core/config-manager/index.js';
import { Coordinator } from '@cloi-ai/cloi/src/core/coordinator/index.js';

// Initialize the platform
const coordinator = new Coordinator();
await coordinator.initialize();

// Analyze an error
const result = await coordinator.analyzeError('ReferenceError: x is not defined', {
  files: ['app.js']
});
```

### Using specific features

#### Error Analysis
```javascript
import { Coordinator } from '@cloi-ai/cloi/src/core/coordinator/index.js';

const coordinator = new Coordinator();
await coordinator.initialize();

const analysis = await coordinator.analyzeError(errorMessage, {
  files: ['file1.js', 'file2.js'],
  projectPath: process.cwd()
});
```

#### Plugin System
```javascript
import { PluginManager } from '@cloi-ai/cloi/src/core/plugin-manager/index.js';

const pluginManager = new PluginManager();
await pluginManager.discover();
await pluginManager.loadPlugin('analyzers:javascript');
```

## Configuration

Create a `.cloi.json` file in your project root:
```json
{
  "providers": {
    "default": "claude",
    "claude": {
      "apiKey": "your-api-key"
    }
  },
  "plugins": {
    "enabled": ["analyzers:javascript", "providers:claude"]
  }
}
```

Or set environment variables:
```bash
export CLOI_PROVIDERS_CLAUDE_APIKEY=your-api-key
export CLOI_PROVIDERS_DEFAULT=claude
```

## Requirements

- Node.js >= 14.0.0
- Python 3 (for CodeBERT service, optional)
- Ollama (optional, for local LLM support)

## Notes

- The project has been rebuilt with fresh dependencies
- All enhanced modular tests are passing
- The CodeBERT service is optional but provides better code understanding
- API keys for Claude or other providers need to be configured separately