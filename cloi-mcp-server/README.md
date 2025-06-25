# Cloi MCP Server

A comprehensive Model Context Protocol (MCP) server designed specifically for Cloi development assistance. This server provides intelligent tools for understanding the Cloi codebase, implementing new features, debugging test failures, and generating comprehensive documentation.

## Overview

The Cloi MCP Server is a development assistant that understands the Cloi codebase deeply and provides context-aware assistance for:

- **Feature Development**: Get implementation suggestions following Cloi patterns
- **Test Failure Analysis**: Debug errors with full codebase context  
- **Documentation Generation**: Create BRD, FSD, HLD, LLD, API docs, and guides
- **Codebase Navigation**: Understand architecture, dependencies, and patterns
- **Test Scenario Generation**: Create comprehensive test scenarios for CLI features

## Key Features

### 🔍 Codebase Analysis
- Deep analysis of Cloi's modular architecture
- Pattern recognition and code understanding
- Dependency mapping and relationship analysis

### 🛠️ Feature Development Support
- Implementation suggestions based on existing patterns
- Boilerplate code generation following Cloi conventions
- Integration guidance for new features

### 🐛 Test Failure Debugging
- Context-aware error analysis
- Auto-repair suggestions based on codebase patterns
- Prevention tips and best practices

### 📚 Documentation Generation
- Business Requirements Documents (BRD)
- Functional Specifications (FSD)
- High-Level Design (HLD) and Low-Level Design (LLD)
- API documentation and developer guides

### 🧪 Test Scenario Generation
- CLI-specific test scenarios
- Unit, integration, and end-to-end test templates
- Test fixtures and mock data generation

## Installation

### Prerequisites

- Node.js 18+
- Access to the Cloi repository
- MCP-compatible client (Claude Desktop, etc.)

### Setup

1. **Install dependencies**
   ```bash
   cd cloi-mcp-server
   npm install
   ```

2. **Configure MCP client**
   
   For Claude Desktop, add to your `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "cloi-development": {
         "command": "node",
         "args": ["/path/to/cloi/cloi-mcp-server/src/index.js"],
         "cwd": "/path/to/cloi/cloi-mcp-server"
       }
     }
   }
   ```

3. **Start using the server**
   
   The server will automatically analyze the Cloi codebase and provide context-aware assistance.

## Available Tools

### Codebase Analysis
- `analyze_cloi_module` - Analyze specific Cloi modules (core, rag, cli, utils)
- `find_code_patterns` - Search for patterns and examples in the codebase
- `get_cloi_context` - Get comprehensive context about the codebase

### Feature Development
- `suggest_feature_implementation` - Get implementation suggestions for new features
- `generate_cloi_boilerplate` - Generate boilerplate code following Cloi patterns
- `trace_execution_flow` - Trace execution flow through components

### Test & Debug
- `analyze_test_failure` - Analyze test failures with codebase context
- `suggest_fix` - Get fix suggestions based on Cloi patterns
- `generate_test_scenarios` - Generate CLI test scenarios
- `create_test_suite` - Create comprehensive test suites

### Documentation
- `generate_brd` - Generate Business Requirements Document
- `generate_fsd` - Generate Functional Specification Document
- `generate_hld` - Generate High-Level Design document
- `generate_lld` - Generate Low-Level Design document
- `generate_api_docs` - Generate API documentation
- `generate_developer_guide` - Generate developer guides

## Usage Examples

### Analyzing a Module
```
Use the analyze_cloi_module tool with:
- module: "core"
- depth: "detailed"
```

### Getting Feature Implementation Suggestions
```
Use the suggest_feature_implementation tool with:
- feature: "Add support for new LLM provider"
- type: "llm-integration"
```

### Debugging Test Failures
```
Use the analyze_test_failure tool with:
- error: "TypeError: Cannot read property 'x' of undefined"
- context: "Occurred during error analysis testing"
- file: "src/core/index.js"
```

### Generating Documentation
```
Use the generate_brd tool with:
- feature: "Enhanced error analysis with ML"
- scope: "enhancement"
```

### Creating Test Scenarios
```
Use the generate_test_scenarios tool with:
- feature: "error analysis"
- scenarioType: "all"
```

## Architecture

The MCP server is built with the following components:

```
src/
├── index.js                 # Main MCP server implementation
├── analyzers/
│   ├── codebaseAnalyzer.js  # Deep codebase analysis engine
│   └── testFailure.js       # Test failure analysis with context
├── assistants/
│   └── featureDevelopment.js # Feature development assistance
├── generators/
│   └── documentation.js     # Comprehensive documentation generator
└── context/
    └── contextBuilder.js    # Cloi-specific context builder
```

### Key Design Principles

1. **Codebase Awareness**: Every tool understands Cloi's specific architecture and patterns
2. **Context-Driven**: Responses are based on actual code analysis, not generic templates
3. **Developer-Focused**: Designed specifically for developers working on Cloi
4. **Extensible**: Easy to add new tools and capabilities

## Configuration

The server automatically detects Cloi's structure and configures itself with:

- **Repository Type**: CLI Tool / Terminal Debugger
- **Architecture**: Modular ES Modules
- **Key Technologies**: Node.js, LLMs (Ollama/Claude), RAG (CodeBERT/FAISS)
- **Patterns**: Executor pattern, Prompt templates, Hybrid search

## Development

### Adding New Tools

1. Define the tool in the `tools` array in `index.js`
2. Implement the handler in the appropriate component
3. Add the case to `handleToolCall`
4. Test with a sample query

### Extending Analysis

The codebase analyzer can be extended to detect new patterns by:

1. Adding pattern recognition logic in `codebaseAnalyzer.js`
2. Updating the `identifyModulePatterns` method
3. Adding new analysis methods as needed

## Troubleshooting

### Common Issues

1. **Server won't start**
   - Check Node.js version (18+ required)
   - Verify MCP client configuration
   - Check file permissions

2. **Analysis incomplete**
   - Ensure you're running from the Cloi project directory
   - Check that all Cloi modules are present

3. **Tools not appearing**
   - Restart MCP client
   - Check server logs for errors
   - Verify configuration file syntax

### Debug Mode

Enable verbose logging by setting the environment variable:
```bash
DEBUG=cloi-mcp npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add new tools or improve existing ones
4. Test with real Cloi development scenarios
5. Submit a pull request

## License

This MCP server is designed specifically for Cloi development and follows the same license as the Cloi project.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review MCP documentation
3. Open an issue in the Cloi repository