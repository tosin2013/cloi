# <div align="center">Cloi CLI (beta preview)</div>

<div align="center">Local debugging agent that runs in your terminal</div>

<br>
<div align="center">
  <img src="https://img.shields.io/badge/version-beta-yellow" alt="version" />
  <img src="https://img.shields.io/badge/license-GPL%203.0-green" alt="license" />
</div>
<br>
<div align="center"><img src="assets/finaldemo.gif" alt="Cloi CLI Demo" /></div>

---

## Overview

**Cloi** is a local, context-aware debugging assistant designed to empower developers with a secure, private, and efficient way to debug code errors. It works entirely on your machine, ensuring that your code and sensitive data never leave your local environment.

By integrating AI with retrieval-augmented generation (RAG), Cloi intelligently identifies root causes of errors, suggests fixes, and even automates the application of changes—all while putting you firmly in control of your codebase. It's like having an expert developer constantly by your side, guiding you within your terminal.

### **Key Benefits of Cloi**:
- **Privacy First**: Operates on-device with no data leaving your system.
- **Effortless Debugging**: Quickly fixes errors with AI-powered suggestions tailored to your codebase.
- **Smart Code Contextualization**: Automatically retrieves relevant files using state-of-the-art code embeddings.
- **Seamless Integration**: Works with your existing Ollama or Anthropic (Claude) models with no additional setup.
- **Free and Open Source**: Fully extensible for your workflows, with contributions welcome from the developer community.

---

## Installation

### Prerequisites
Before you begin, ensure your system meets the following requirements:
- **Node.js**: Version 14.0 or later
- **Python**: Version 3.6 or later
- **Shell**: Zsh (most tested), Fish, or Bash
- **macOS**: Big Sur (11.0) or later
- **RAM**: Minimum 8GB (16GB+ recommended)
- **Storage**: At least 10GB free

Other dependencies, such as the Ollama runtime and Python libraries, will be installed automatically.

### Installation Instructions
1. **Install Cloi globally via npm:**
   ```bash
   npm install -g @cloi-ai/cloi
   ```

2. **Navigate to your project directory:**
   ```bash
   cd /path/to/your/project
   ```

3. **Run Cloi whenever you encounter an error:**
   ```bash
   cloi
   ```

That’s it! Cloi will guide you through the steps to analyze and fix errors.

> **Note**: For developers using Anthropic models like Claude-4, see the [Using Claude-4 Model](#using-claude-4-model) section below for additional setup.

---

## Usage Examples

### Debugging Scenario: Fixing Errors on the Fly
Suppose you're working on a Node.js project and encounter a runtime error like `TypeError: undefined is not a function`. Instead of manually scouring your codebase for the problem:
```bash
cloi
```
- Cloi will analyze the error, identify the most relevant parts of your codebase using its RAG system, and suggest a fix.
- Review the proposed code changes in an interactive diff, then choose to accept or reject them.

### Re-indexing Your Codebase
After adding new files or making large refactors:
```bash
/index
```
This updates Cloi's code embeddings, improving its ability to debug accurately.

### Switching AI Models
Want to switch from an Ollama local model to Claude-4?
```bash
/model
```
Choose the desired model from the interactive menu or set an environment variable for Claude:
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

### Interactive Commands
Here are additional commands you can use in Cloi's interactive mode:
```
/debug    - Analyze and fix errors automatically
/index    - Rebuild the codebase index
/model    - Select or switch AI models
/logging  - Enable terminal output logging for error diagnostics
/help     - View help menu with available commands
```

---

## Architecture Overview

At its core, Cloi is built with modularity and enabling developer productivity in mind. Here's a brief walkthrough of its architecture:

- **Command-Line Interface (CLI)**: Developed with Node.js to provide an intuitive terminal experience.
- **Retrieval-Augmented Generation (RAG)**: Combines CodeBERT embeddings with BM25 keyword search to extract relevant files for error debugging.
- **AI Integration**:
  - **Local Models**: Ollama integration allows you to run language models on your machine without API keys.
  - **Cloud Models**: Optional support for Anthropic's Claude models with simple API key configuration.
- **Background Services**:
  - CodeBERT Embedder (Python): Runs as a local HTTP service to create file embeddings for semantic search.
  - Logging Service: Captures and manages terminal outputs for improved diagnostics.
- **Security and Privacy**: All operations are local to your machine, ensuring your data never leaves your workspace.

---

## Contributing

We welcome contributions to Cloi from developers, testers, and enthusiasts alike! Here’s how you can help:

### Contribution Steps
1. **Fork the Repo**: Clone our repository to your GitHub account.
2. **Branch Off**: Create a feature branch (`feature/your-feature-name`).
3. **Code and Test**: Make your improvements or fixes. Don’t forget to test thoroughly!
4. **Submit a Pull Request**: Submit your changes with a clear description of your contribution.

### Contribution Guidelines
- **Scope**: Contributions should enhance Cloi’s core mission as a local AI-powered debugging assistant.
- **Compatibility**: Ensure changes are compatible with our supported systems and dependencies.
- **License**: All contributions must align with the GPL-3.0 license. Any derivative works must also adhere to the same license.

For details, see our [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Troubleshooting

Having trouble? Here are some common issues and solutions:

### 1. Installation Fails
Ensure Node.js (14.0+) and Python (3.6+) are installed. Run:
```bash
node -v
python --version
```
Reinstall dependencies with:
```bash
npm install -g @cloi-ai/cloi
```

### 2. Python Errors During RAG Setup
Ensure `pip` is working correctly. Manually install Cloi's Python dependencies:
```bash
pip install -r requirements.txt
```

### 3. Issues with AI Models (Claude or Ollama)
- **Claude Models**: Ensure you’ve exported a valid API key:
  ```bash
  export ANTHROPIC_API_KEY="your-api-key"
  ```
- **Ollama Runtime**: Verify the runtime is installed. Run:
  ```bash
  ollama list
  ```

### 4. Debugging Slow Performance
Re-index the project to ensure embeddings are up-to-date:
```bash
/index
```

### 5. Logging Not Working
Limited to zsh users. Ensure your `.zshrc` is updated:
```bash
/logging
source ~/.zshrc
```

Still stuck? Check out the [GitHub Issues](https://github.com/cloi-ai/cloi/issues) page or create a new issue with your error details.

---

## Stay Connected
Help make Cloi better! File issues, submit PRs, or star us on GitHub. We'd love your feedback. ❤️

<div align="center">
<b>Happy Debugging!</b>
</div>
