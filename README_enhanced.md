Here’s an enhanced and structured version of the README for the Cloi project, incorporating improved descriptions, detailed installation/usage instructions, architecture overview, and more.

---

# <div align="center">Cloi CLI (Beta Preview)</div>

<div align="center">A local AI-powered debugging agent that runs securely in your terminal.</div>
<br>
<div align="center">
  <img src="https://img.shields.io/badge/version-beta-yellow" alt="version" />
  <img src="https://img.shields.io/badge/license-GPL%203.0-green" alt="license" />
</div>
<br>
<div align="center"><img src="assets/finaldemo.gif" alt="Cloi CLI Demo" /></div>

---

## ✨ Project Overview

Cloi is a privacy-focused, AI-powered debugging tool designed for developers who work in the terminal. It operates locally, ensuring that your sensitive code and data never leave your machine. By leveraging powerful **context-aware AI models**, Cloi efficiently identifies and fixes errors in your codebase, streamlining your debugging process. 

### **Why Cloi?**
- **Privacy First:** All actions and analysis are securely handled on-device. Your code stays yours.
- **Frictionless Setup:** Works out of the box with zero configuration. It uses your existing Ollama models or lets you choose cloud-based ones like Anthropic’s Claude (if preferred).
- **Time-Saving Debugging:** With smart context retrieval and suggested autofixes, Cloi helps you spend less time diagnosing issues and more time building.
- **Full Control:** Review every code suggestion and approve only what you trust.
- **Open Source:** Community-driven and extensible. Contribute, customize, or fork your own version!

Whether it’s a tricky bug in production or managing dependencies in complex projects, Cloi reduces cognitive load, making debugging efficient and empowering.


---

## 🚀 Installation

### Prerequisites
- **Node.js 14+** (for Cloi runtime)
- **Python 3.6+** (for embedding support during Retrieval-Augmented Generation)
- **Compatible Terminal:** ZSH (recommended), Fish, or Bash
- **OS Support:** macOS (Big Sur 11.0+) tested, Linux support experimental
- [Ollama](https://ollama.com/) CLI installed (autodownload enabled in Cloi’s first run)

### Install Cloi CLI
To globally install Cloi using npm:
```bash
npm install -g @cloi-ai/cloi
```

Once installed, navigate to your project directory and call Cloi:
```bash
cd /your/project
cloi
```

#### Using with Anthropic’s Claude Models
If you want to use Claude Sonnet 4 instead of the default local models:
1. Obtain an Anthropic API key.
2. Add it to your environment:
   ```bash
   export ANTHROPIC_API_KEY=your-api-key-here
   ```
3. Update your `~/.zshrc` (or equivalent shell config) with this line and restart your terminal. When running Cloi, you can select Claude models via the `/model` command.

---

## 💡 Usage Guide

### Basic Command
```bash
cloi
```
Call Cloi when you encounter an issue. It will analyze the stack trace and suggest targeted fixes.

### Interactive Commands:
In interactive mode, you can use the following commands to control Cloi:
- `/debug` – Automatically analyze and resolve errors using AI.
- `/index` – Re-index your codebase to improve debugging accuracy.
- `/model` – Switch AI models to fit your debugging scenario (Ollama, Claude, etc.).
- `/logging` – Enable automatic error logging.
- `/help` – Display all available commands.

### Practical Use Case 1: Fixing a Syntax Error
```bash
cloi
```
- Cloi reads your error stack trace and identifies the problematic files.
- It locates relevant context using RAG (Retrieval-Augmented Generation) and suggests a fix.
- Review and apply the fix directly from your terminal.

### Practical Use Case 2: Debugging a Multi-File Dependency Issue
You suspect an issue spans across multiple files but don’t know where to start:
1. Run `cloi /debug`.
2. Cloi searches the codebase, identifies all related files, and suggests targeted changes.
3. Review each proposed fix and approve individually, ensuring no unexpected modifications.

---

## 🛠️ Architecture Overview

Cloi’s architecture centers around three key principles: privacy, context retrieval, and flexibility.

### **Core Components**
1. **Local Installation**: Cloi operates entirely locally, ensuring data privacy and eliminating the need for external servers (unless explicitly using cloud models like Claude).
2. **Retrieval-Augmented Generation (RAG)**:
   - Uses BM25 keyword search combined with CodeBERT embeddings for relevant file identification during debugging.
   - Runs a lightweight Python-based FAISS vector store on port `3090` for fast similarity search.
3. **Command-Line Interface (CLI)**: Offers a developer-focused, interactive debugging experience.
4. **Model Selection**: Default Ollama models for local use, with optional integration of Claude Sonnet 4 for enhanced capabilities.

---

## 🤝 Contribution Guidelines

Thank you for your interest in contributing to Cloi! We value participation from the community to continuously improve the project.

### How to Contribute
1. **Fork the Repository**: Start by forking Cloi's [GitHub repository](https://github.com/cloi-ai/cloi).
2. **Feature Additions or Bug Fixes**:
   - File an issue to discuss your idea or fix before development begins.
   - Make sure changes align with Cloi’s goal of being a secure, privacy-first local AI assistant.
3. **Submit a Pull Request (PR)**:
   - Include a clear description of the problem/feature and how your contribution addresses it.
   - Ensure all tests pass before submitting.
4. **Code Style**: Follow the existing codebase style to maintain uniformity.

By contributing, you agree that all contributions will be licensed under the GNU General Public License v3.0 (GPL-3.0).

For more details, refer to our [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 🩹 Troubleshooting Common Issues

### Issue 1: "Command not found: cloi"
Make sure the CLI is properly installed and included in your PATH.
- Run `npm install -g @cloi-ai/cloi` again.
- Check if the npm global bin directory is in your PATH:
  ```bash
  echo $PATH
  ```

### Issue 2: "Could not connect to RAG background service on port 3090"
- Verify that Python 3.6+ is installed correctly and accessible from your terminal.
- Ensure no firewall or process is blocking port `3090`.

### Issue 3: "Model not found in `/model` selection"
- Confirm that Ollama or the required models are installed locally.
- For Claude, double-check that the `ANTHROPIC_API_KEY` is set correctly in your environment.

### Issue 4: Debug Suggestions Are Inaccurate
- Re-run `/index` to ensure your codebase is indexed correctly.
- Check for errors in the logs at `~/.cloi/terminal_output.log`.

If problems persist, file an issue in our [GitHub repository](https://github.com/cloi-ai/cloi/issues) with detailed steps to reproduce.

---

## 📜 Patch Notes

For the detailed list of recent changes and improvements, refer to the **Patches** section in the repository or [CHANGELOG.md](CHANGELOG.md).

---

<p align="center">🛠️ Developed with love for developers who want smarter debugging. Let’s make debugging effortless with Cloi! ⭐</p>
