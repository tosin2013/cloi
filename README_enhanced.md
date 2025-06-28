# <div align="center">Cloi CLI (beta preview)</div>

<div align="center">A local debugging agent designed to make your terminal experience smarter and more productive</div>
<br>
<div align="center">
  <img src="https://img.shields.io/badge/version-beta-yellow" alt="version" />
  <img src="https://img.shields.io/badge/license-GPL%203.0-green" alt="license" />
</div>
<br>
<div align="center"><img src="assets/finaldemo.gif" alt="Cloi CLI Demo"></div>

## 🚀 Project Overview

Cloi is a **privacy-first, local debugging assistant** purpose-built for developers who live in the terminal. Powered by state-of-the-art AI models, Cloi analyzes errors contextually and recommends actionable solutions—all while ensuring your code and data never leave your machine.

With features like automatic context retrieval, AI-powered debugging suggestions, and safe diffs that you can control, Cloi aims to reduce cognitive load so you can focus on building, not debugging.

### Key Features:
- **Secure by Design**: Works locally, ensuring your source code and personal data stay private.
- **Context-Aware Debugging**: Harnesses the power of AI models like Ollama or Anthropic models (Claude).
- **Automatic Fixes with Review**: Generate fixes for errors with full transparency—review diffs before applying changes.
- **Seamless Setup**: Zero upfront configuration—all dependencies, indexing, and tools are auto-installed as you go, saving hours of setup.
- **Free & Open Source**: Customize Cloi to fit your workflow or contribute back to the community.

---

## 🛠 Installation

Getting started with Cloi is as simple as a one-line installation. Make sure you have [Node.js](https://nodejs.org/) (v14 or higher) and Python (v3.6 or higher) installed.

1. **Install Cloi globally via NPM**:
   ```bash
   npm install -g @cloi-ai/cloi
   ```

2. **Verify the installation**:
   ```bash
   cloi --version
   ```

3. **Navigate to your project directory** and run the agent whenever you encounter an error:
   ```bash
   cloi
   ```

**Note**: Cloi works with your existing Ollama models out of the box and doesn’t require an API key to get started.

---

## 📖 Usage Examples

### **Scenario 1: Auto-Debugging an Error**
Imagine you have an error in your application and want Cloi to analyze and produce potential fixes:
1. Execute Cloi in your terminal:
   ```bash
   cloi
   ```
2. Cloi analyzes your logs, retrieves relevant code, and suggests a patch.
3. Review the patch via an interactive interface and decide whether to apply, reject, or modify it.

---

### **Scenario 2: Switching AI Models**
Want to use a more powerful Anthropic Claude model instead of default local Ollama models? Switch easily:
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
cloi /model
```
Select your preferred model from the interactive prompt and get started—zero additional setup required.

---

### **Scenario 3: RAG-Powered Debugging**
Use Cloi’s **Retrieval-Augmented Generation** (RAG) engine to auto-identify files relevant to your error:
1. Run Cloi:
   ```bash
   cloi /debug
   ```
2. Cloi creates an automatic index for your project, ranks relevant files, and helps produce contextually accurate fixes.

---

### **Scenario 4: Enhancing Error Logging**
Want to track errors over time? Enable Cloi's terminal logging:
```bash
cloi /logging
```
This modifies your shell’s configuration file (e.g., `.zshrc`) to capture terminal output automatically for later debugging.

---

## 🏗 Architecture Overview

<div align="center"><img src="assets/architecture.png" alt="Cloi Architecture Overview"></div>

At its core, Cloi combines local AI capabilities with a modular, extensible architecture:

1. **CLI Entry Point**:
   - Commands (`/debug`, `/index`, `/model`) trigger different workflows.

2. **RAG Engine**:
   - Combines **BM25** keyword search and **CodeBERT** embeddings for smart file retrieval.
   - Uses **FAISS** for vector storage and similarity search.

3. **AI Model Layer**:
   - Supports **local Ollama models** out of the box.
   - Optional integration with **Anthropic Claude-4 (Sonnet, Opus)** for richer model capabilities.
   - Cloi handles all model interactions, whether local or remote.

4. **Codebase Interaction**:
   - Acts on your local file system to read, analyze, and suggest changes.
   - Generates diffs interactively so you can approve or reject modifications.

5. **Terminal Logging Service**:
   - Captures terminal output in real-time for deeper contextual debugging.

Cloi is designed with extensibility in mind—its modular design allows contributors to add new commands or support additional AI models with minimal effort.

---

## 🤝 Contributing to Cloi

We’re building Cloi in the open and welcome contributions from developers of all skill levels. To get started:

1. Check out the [CONTRIBUTING.md](CONTRIBUTING.md) file for detailed guidelines.
2. File bug reports or suggest features by opening an issue on [GitHub](https://github.com/cloi-ai/cloi).
3. Submit pull requests for anything—whether it’s fixing typos or adding entire features.

### Contribution Guidelines:
- Keep contributions focused on enhancing **developer productivity**, while preserving Cloi’s **privacy-first** principles.
- Ensure compatibility across supported environments (macOS + Zsh as a priority).
- All submissions must adhere to the **GNU General Public License v3.0**.

We can’t wait to see what you’ll bring to Cloi!

---

## ⚡ Troubleshooting Common Issues

| **Issue**                                      | **Solution**                                                                                  |
|------------------------------------------------|----------------------------------------------------------------------------------------------|
| Node.js not recognized during installation     | Ensure Node.js v14+ is installed: `node -v`. Download from [Node.js](https://nodejs.org/).    |
| Cloi command not found                         | Ensure Cloi is installed globally with `npm install -g @cloi-ai/cloi`. Check PATH variables.  |
| API key required for Claude models             | Export your key: `export ANTHROPIC_API_KEY="your-key"`. Add this to `.zshrc` for persistence. |
| Error: “Could not retrieve relevant code files”| Re-run `/index` to refresh the RAG engine’s index of your project.                           |
| Debugging too slow or crashes on large projects| Increase available memory: restart Cloi with more system resources.                          |

If you encounter an issue not listed here, please [submit an issue](https://github.com/cloi-ai/cloi/issues) with as much detail as possible.

---

## 📜 License

Cloi is licensed under the **GNU General Public License v3.0**. By using Cloi or contributing to it, you agree to comply with its terms. See [LICENSE](LICENSE) for more information.

---

<div align="center">
  <sub>Made with ❤️ for developers who love the terminal</sub>
</div>
