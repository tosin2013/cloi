# Cloi Documentation

Welcome to the Cloi documentation! Cloi is a modular platform for AI-powered development assistance that combines local expertise with AI intelligence.

## 📚 Documentation Index

### Getting Started
- [Installation Guide](../README.md#installation)
- [Quick Start](../README.md#quick-start)
- [CLAUDE.md](../CLAUDE.md) - Instructions for Claude Code and development

### Core Concepts
- [Architecture Overview](../ARCHITECTURE.md)
- [Plugin System](./PLUGIN_DEVELOPMENT.md)
- [Configuration Management](./CONFIGURATION.md)

### Workflows & Usage
- 🆕 **[Workflow Guide](./WORKFLOWS.md)** - Four key workflows for different scenarios
  - Human + Cloi workflows
  - Human + LLM + Cloi workflows
  - New project workflows
  - Existing project workflows
- 🆕 **[Workflow Diagrams](./WORKFLOW_DIAGRAMS.md)** - Visual representations and decision trees

### A2A Protocol (Agent-to-Agent)
- 🤖 **[A2A Integration Guide](./A2A_INTEGRATION.md)** - Technical API specification
- [A2A Architecture Summary](../A2A_ARCHITECTURE_SUMMARY.md)
- [Integration Examples](../src/protocols/a2a/integration.md)

### Development
- [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md)
- [Testing Guide](./TESTING.md)
- [Contributing](../CONTRIBUTING.md)

### API Reference
- [CLI Commands](./CLI_REFERENCE.md)
- [Plugin APIs](./PLUGIN_API.md)
- [A2A Protocol API](./A2A_INTEGRATION.md)

## 🚀 Quick Links

### For Users
1. **New to Cloi?** Start with [Workflows](./WORKFLOWS.md)
2. **Debugging help?** See Workflow 1 & 3 in the guide
3. **New project?** See Workflow 2 & 4 in the guide

### For AI Systems
1. **Want to integrate?** Read [A2A Integration](./A2A_INTEGRATION.md)
2. **Need prompts?** Run `cloi a2a prompt universal`
3. **Quick setup?** Run `cloi a2a setup`

### For Developers
1. **Build a plugin?** See [Plugin Development](./PLUGIN_DEVELOPMENT.md)
2. **Contribute?** Check [Contributing](../CONTRIBUTING.md)
3. **Understand architecture?** Read [Architecture](../ARCHITECTURE.md)

## 🎯 Choose Your Path

```
Are you a...
│
├─▶ Developer using Cloi?
│   └─▶ Start with: Workflows Guide
│
├─▶ AI wanting to integrate?
│   └─▶ Start with: A2A Integration Guide
│
└─▶ Contributor?
    └─▶ Start with: Plugin Development Guide
```

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/tosin2013/cloi/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tosin2013/cloi/discussions)
- **Security**: See [SECURITY.md](../SECURITY.md)