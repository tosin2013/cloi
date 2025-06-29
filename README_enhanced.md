Below is an enhanced and comprehensive version of the README for the Cloi project, incorporating improvements in structure, content clarity, and user appeal:

---

# <div align="center">🛠️ Cloi CLI (Beta Preview)</div>
<div align="center">A local, context-aware debugging agent that empowers developers to fix errors efficiently and privately.</div>
<br>
<div align="center">
  <img src="https://img.shields.io/badge/version-beta-yellow" alt="version" />
  <img src="https://img.shields.io/badge/license-GPL%203.0-green" alt="license" />
</div>
<br>
<div align="center"><img src="assets/finaldemo.gif" alt="Cloi CLI Demo" /></div>

---

## 🚀 **What is Cloi?**

Cloi is a cutting-edge debugging tool that operates entirely on your local machine. It uses advanced Retrieval-Augmented Generation (RAG) and AI models to analyze your codebase, suggest fixes, and even apply patches — all while keeping your data private. Designed for developers who live in the terminal, Cloi works seamlessly with your existing tools to save you time, reduce friction, and maintain complete control over your workflow.

**Why Cloi?**  
- **Privacy First:** Cloi runs locally — no cloud, no external APIs by default — ensuring your code and errors stay private.  
- **Context-Aware Debugging:** Uses RAG to intelligently retrieve and analyze the most relevant parts of your code.  
- **Seamless Workflow:** Zero configuration required for local models. Works out of the box with Ollama models or the popular Anthropic Claude.  
- **Developer-Friendly:** Full control over suggested changes. Nothing is applied without your explicit approval.   
- **Free to Use & Open Source:** Customize it to your needs, contribute, or fork it entirely to align with your development requirements.  

---

## ⚡ **Getting Started**

### Installation

Install Cloi CLI globally using npm:

```bash
npm install -g @cloi-ai/cloi
```

### System Requirements

Before installation, ensure your system meets the following requirements:

#### **Hardware**
- **Memory:** Minimum 8GB RAM (16GB recommended for smoother performance).
- **Storage:** Approx. 10GB free (e.g., Phi-4 model is ~9.1GB).
- **Processor:** Optimized for Apple Silicon (M2/M3 tested). May work on other systems.

#### **Software**
- **OS:** macOS (Big Sur 11.0+). Other platforms are not officially supported yet.  
- **Runtime:** Node.js 14+ and Python 3.6+.  
- **Shell:** Zsh (preferred), Fish, Bash (limited testing).  
- **Dependencies:** Ollama (auto-installed on the first debug run).

---

## 🎯 **How to Use Cloi**

### Quick Start

1. **Navigate to Your Project Directory**  
   Open your terminal and `cd` into your project's root directory.

2. **Run Cloi**  
   Simply type `cloi` and press Enter when encountering an error in your project for debugging assistance:

   ```bash
   cloi
   ```

3. **Interactive Commands**  
   Use the following commands within Cloi's interactive mode:

   ```
   /debug    - Analyze and auto-fix errors using AI models
   /index    - Re-index your codebase for improved context
   /model    - Choose between local (Ollama) or external (Claude) models
   /logging  - Enable automatic logging for terminal errors (zsh)
   /help     - Show available commands
   ```
   Example:
   ```
   /debug
   ```

---

### Configuration for Advanced Models

#### Use Anthropic Models (e.g., Claude-4)

Add your API key for Claude models to your environment variables:

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

To persist this configuration, add it to your `~/.zshrc` file (or equivalent), then restart the terminal. Once configured, run `/model` to select Claude Sonnet 4 or Opus.

---

### Example Scenarios

#### **Real-World Use Case 1: Debugging Runtime Errors**
You're working on a Python project, and a `TypeError` is thrown. Run `cloi` in your terminal, allow Cloi to retrieve related files using RAG, and follow its guided suggestions to fix the bug.

#### **Real-World Use Case 2: Maintaining a Legacy Codebase**
Inherited a repo with no documentation? Use `/index` to build an optimized knowledge base of the code, then `/debug` to troubleshoot errors and `/model` to switch between AI models for exploration.

#### **Real-World Use Case 3: Working Offline**
Because Cloi supports offline, local models with no API keys needed, it’s perfect for debugging in disconnected environments, such as on flights or air-gapped systems.

---

## 🛠️ **Architecture Overview**

1. **Retrieval-Augmented Generation (RAG)**: 
   - Combines semantic search (via CodeBERT embeddings) with traditional keyword matching (BM25) for robust error context retrieval.
   - Uses FAISS vector storage for efficient similarity search.

2. **Model Integration**:
   - Local: Ollama models work out-of-the-box.
   - External: Anthropic Claude is supported (requires API key and configuration).

3. **Interactive Mode**:
   - Built with Node.js and designed to act as an intelligent CLI agent.

4. **Terminal Logging**:
   - Supports automatic error logging to `~/.cloi/terminal_output.log`.

---

## 👩‍💻 **Contributing**

We ❤️ contributors! Whether you're fixing bugs, improving documentation, or adding new features, your help is always welcome.

### How to Contribute

1. **Fork this Repository.**
2. **Create a Branch:**  
   ```bash
   git checkout -b feature/new-feature
   ```
3. **Make Your Changes** and Commit Them.  
4. **Submit a Pull Request** for Review.

For detailed guidelines, check our [CONTRIBUTING.md](CONTRIBUTING.md).

### Guidelines

- Contributions should align with Cloi's mission: **local debugging that’s privacy-first.**
- All PRs must comply with the GNU GPL 3.0 licensing requirements.

---

## 🐛 **Troubleshooting**

### Common Issues & Fixes

#### Issue: **Command Not Found**
- **Solution:** Ensure Node.js binaries are added to your `$PATH`. Try re-installing Cloi:
  ```bash
  npm uninstall -g @cloi-ai/cloi && npm install -g @cloi-ai/cloi
  ```

#### Issue: **RAG Fails to Initialize**
- **Solution:** Ensure Python dependencies are installed. Run:
  ```bash
  cloi --debug
  ```
  Look for missing Python modules and install them manually:
  ```bash
  pip install -r requirements.txt
  ```

#### Issue: **High RAM/CPU Usage**
- **Solution:** Reduce the size of the codebase Cloi indexes. Use `/index` selectively within specific subdirectories.

#### Still Stuck?
Feel free to submit an issue on our [GitHub Issues page](https://github.com/cloi-ai/cloi/issues).

---

## 📝 **Changelog**

Latest updates and patches can be found in the [CHANGELOG.md](CHANGELOG.md). Highlights include:
- **[1.0.8]**: Integrated RAG for smarter debugging
- **[1.0.7]**: Added automatic terminal output logging

---

## ❤️ **Feedback & Support**

We’re in beta, and your feedback is critical to Cloi’s success! Feel free to:
- Submit bugs or feature requests via [GitHub Issues](https://github.com/cloi-ai/cloi/issues)
- Join the conversation/contribute PRs to this evolving project.

Thank you for helping us build the future of seamless debugging! 🎉

---

*Happy Debugging with Cloi CLI!* 🚀
