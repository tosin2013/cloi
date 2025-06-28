# Enhanced Cloi MCP Server - Plugin Development Assistance

The Cloi MCP Server has been enhanced with comprehensive plugin development assistance functions that make it easier for users to create, install, and manage plugins for the Cloi modular platform.

## New Plugin Management Functions

### 1. `generate_plugin_template`
**Purpose**: Generate a complete plugin template with all necessary files

**Usage**:
```json
{
  "name": "generate_plugin_template",
  "arguments": {
    "pluginType": "analyzers",
    "pluginName": "python",
    "description": "Python error analyzer with Django and Flask support",
    "author": "Your Name",
    "extensions": [".py", ".pyx"],
    "errorPatterns": ["NameError", "IndentationError", "SyntaxError"]
  }
}
```

**What it creates**:
- `plugin.json` - Complete plugin manifest
- `index.js` - Fully functional plugin code with base class extension
- `python.test.js` - Comprehensive test suite
- `README.md` - Complete documentation with usage examples

**Supported Plugin Types**:
- **analyzers**: Language-specific error analyzers (Python, Rust, Go, etc.)
- **providers**: AI/LLM service providers (OpenAI, Gemini, local models)
- **fixers**: Fix application strategies (patch, template, interactive)
- **quality**: Code quality tools (ESLint, SonarQube, Prettier)
- **integrations**: External tool integrations (GitHub, Jira, Slack)

### 2. `install_plugin`
**Purpose**: Install plugins from local directories or git repositories

**Usage**:
```json
{
  "name": "install_plugin",
  "arguments": {
    "source": "https://github.com/user/cloi-python-analyzer.git"
  }
}
```

**Features**:
- Installs from git repositories or local directories
- Automatically detects plugin type from manifest
- Installs NPM dependencies if needed
- Places plugin in correct directory structure
- Validates plugin structure before installation

### 3. `list_plugin_templates`
**Purpose**: Show available plugin types and examples

**Returns**:
- All available plugin types with descriptions
- Examples for each plugin type
- Template usage examples
- Plugin architecture overview

### 4. `validate_plugin`
**Purpose**: Validate plugin structure and code quality

**Usage**:
```json
{
  "name": "validate_plugin",
  "arguments": {
    "pluginPath": "/path/to/your/plugin"
  }
}
```

**Validation Checks**:
- Required files present (plugin.json, index.js)
- Valid manifest structure
- Proper base class extension
- Method implementation completeness
- Code syntax validation

### 5. `analyze_cloi_plugins`
**Purpose**: Analyze existing plugins to understand patterns

**Usage**:
```json
{
  "name": "analyze_cloi_plugins", 
  "arguments": {
    "pluginType": "analyzers",
    "detailed": true
  }
}
```

**Analysis Includes**:
- Plugin completeness statistics
- Code complexity metrics
- Common patterns identification
- Development recommendations
- Best practices guidance

## Plugin Template Features

### Complete Code Generation
Generated plugins include:

**For Analyzers**:
```javascript
export default class PythonAnalyzer extends BaseAnalyzer {
  supports(context) {
    // Intelligent context detection
  }
  
  async analyze(errorOutput, context) {
    // Complete error analysis implementation
  }
  
  classifyError(errorOutput) {
    // Language-specific error classification
  }
  
  calculateConfidence(errorOutput, context) {
    // Confidence scoring algorithm
  }
}
```

**For Providers**:
```javascript
export default class OpenAIProvider extends BaseProvider {
  async isAvailable() {
    // Availability checking
  }
  
  async query(prompt, options) {
    // Complete API integration
  }
  
  getSupportedModels() {
    // Model enumeration
  }
}
```

### Test Suite Generation
Automatically generates comprehensive tests:
```javascript
describe('PythonAnalyzer', () => {
  it('should support Python contexts', () => {
    const context = { files: ['test.py'], error: 'NameError' };
    expect(plugin.supports(context)).toBe(true);
  });
  
  it('should analyze errors correctly', async () => {
    const result = await plugin.analyze('NameError: name not defined');
    expect(result.language).toBe('python');
    expect(result.errorType).toBe('type');
  });
});
```

### Documentation Generation
Creates complete README with:
- Plugin overview and features
- Installation instructions
- Configuration examples
- Usage examples
- API reference
- Development guidelines

## Integration with Cloi Modular Platform

### Seamless Plugin Loading
```bash
# Generate a new plugin
# MCP: generate_plugin_template analyzers rust

# Load the plugin
node src/cli/modular.js plugins load analyzers:rust

# Use the plugin
node src/cli/modular.js analyze "error[E0382]: borrow of moved value" --files main.rs
```

### Configuration Integration
Generated plugins automatically integrate with Cloi's configuration system:
```json
{
  "plugins": {
    "analyzers": {
      "rust": {
        "enabled": true,
        "priority": 1,
        "timeout": 30000
      }
    }
  }
}
```

### State Management Integration
Plugins automatically integrate with session tracking and rollback capabilities.

## Developer Experience Improvements

### 1. **Rapid Prototyping**
Create a functional plugin in seconds:
```
MCP: generate_plugin_template providers gemini --description "Google Gemini integration"
```

### 2. **Best Practices Built-in**
- Proper error handling
- Configuration management
- Interface compliance
- Test coverage
- Documentation standards

### 3. **Learning from Existing Plugins**
```
MCP: analyze_cloi_plugins analyzers --detailed true
```
Learn patterns from existing high-quality plugins.

### 4. **Easy Installation**
```
MCP: install_plugin https://github.com/cloi-community/python-advanced-analyzer.git
```

### 5. **Quality Assurance**
```
MCP: validate_plugin /path/to/my/plugin
```
Ensure plugin meets quality standards before deployment.

## Community Plugin Ecosystem

### Plugin Sharing
The enhanced MCP server enables:
- Easy plugin sharing via git repositories
- Standardized plugin structure
- Consistent quality across community plugins
- Simple installation process

### Plugin Registry (Future)
Foundation for:
- Centralized plugin registry
- Version management
- Dependency resolution
- Plugin ratings and reviews

## Examples

### Creating a Go Analyzer
```json
{
  "name": "generate_plugin_template",
  "arguments": {
    "pluginType": "analyzers",
    "pluginName": "go",
    "description": "Go error analyzer with module support",
    "extensions": [".go", ".mod"],
    "errorPatterns": ["cannot find package", "undefined:", "syntax error"]
  }
}
```

### Creating an OpenAI Provider
```json
{
  "name": "generate_plugin_template", 
  "arguments": {
    "pluginType": "providers",
    "pluginName": "openai",
    "description": "OpenAI GPT integration",
    "baseUrl": "https://api.openai.com/v1",
    "defaultModel": "gpt-4",
    "models": ["gpt-4", "gpt-3.5-turbo", "gpt-4-turbo"]
  }
}
```

### Installing a Community Plugin
```json
{
  "name": "install_plugin",
  "arguments": {
    "source": "https://github.com/cloi-community/typescript-advanced.git"
  }
}
```

## Benefits

### For Plugin Developers
- **Faster Development**: Template generation eliminates boilerplate
- **Better Quality**: Built-in best practices and validation
- **Easy Testing**: Comprehensive test suites generated automatically
- **Documentation**: Complete README and API docs generated

### For Plugin Users
- **Easy Discovery**: Analyze existing plugins to find what you need
- **Simple Installation**: One-command installation from any source
- **Quality Assurance**: Validation ensures plugins meet standards
- **Consistent Experience**: All plugins follow same patterns

### For the Cloi Ecosystem
- **Rapid Growth**: Lower barrier to plugin creation
- **Higher Quality**: Consistent standards and validation
- **Better Maintenance**: Standardized structure improves maintainability
- **Community Building**: Easy sharing encourages contributions

## Getting Started

1. **Explore Available Templates**:
   ```
   MCP: list_plugin_templates
   ```

2. **Generate Your First Plugin**:
   ```
   MCP: generate_plugin_template analyzers javascript --description "Enhanced JavaScript analyzer"
   ```

3. **Validate Your Plugin**:
   ```
   MCP: validate_plugin /path/to/your/plugin
   ```

4. **Install Community Plugins**:
   ```
   MCP: install_plugin https://github.com/user/awesome-cloi-plugin.git
   ```

5. **Learn from Existing Plugins**:
   ```
   MCP: analyze_cloi_plugins all --detailed true
   ```

The enhanced Cloi MCP Server transforms plugin development from a complex process requiring deep knowledge of the codebase into a simple, guided experience that enables anyone to extend Cloi's capabilities.