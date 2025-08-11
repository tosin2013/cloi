# <div align="center">Cloi CLI (Beta Preview)</div>

<div align="center">A local, privacy-first AI debugging assistant for developers</div>
<br>
<div align="center">
  <img src="https://img.shields.io/badge/version-beta-yellow" alt="version" />
  <img src="https://img.shields.io/badge/license-GPL%203.0-green" alt="license" />
</div>
<br>
<div align="center"><img src="assets/finaldemo.gif" alt="Cloi CLI Demo" /></div>

## 🚀 **What is Cloi?**

Cloi is a revolutionary local debugging agent built for developers who value privacy and efficiency. It's designed to assist with diagnosing and fixing errors directly within your terminal, all while ensuring your data never leaves your device.

With Cloi, you can leverage cutting-edge AI models (like locally hosted Ollama models or cloud-based Anthropic APIs) without any intrusive setup. Cloi’s smart features—like automatic context retrieval, intelligent code indexing, and safe patching—make debugging faster, more intuitive, and entirely secure.

### **Why Cloi?**
- **Ultimate Privacy:** Cloi operates 100% on-device unless you opt for cloud models.
- **Built-in RAG System:** Automatically retrieves relevant code files for context-aware debugging.
- **Trustworthy Fixes:** All code suggestions are presented as diffs—giving you full control to review and approve.
- **Developer-Friendly:** Zero friction setup; simply install, run, and debug.
- **Open Source:** Modify and improve Cloi according to your needs—your contributions are welcome!
- **Versatile Model Support:** Easily switch between free local models and premium models like Claude Sonnet.

---

## 🛠️ **Installation**

### Prerequisites
Before installing Cloi, ensure your system meets these requirements:
- **Memory:** 8GB RAM minimum (16GB+ recommended)
- **Storage:** 10GB+ free space (local model support requires ~9.1GB)
- **OS:** macOS (Big Sur 11.0+)
- **Runtime:** Node.js 14+ and Python 3.6+
- **Shell:** Zsh, Fish, or Bash (limited)

### Installing Cloi
Install Cloi globally using `npm`:

```bash
npm install -g @cloi-ai/cloi
```

> 💡 **Note:** Cloi automatically sets up any required dependencies (like Ollama and RAG tools) the first time you run it.

---

## 📄 **Usage**

Navigate to your project directory and invoke Cloi whenever you encounter an error:

```bash
cloi
```

### **Interactive Mode Commands**
Cloi's interactive mode provides simple commands to enhance your debugging experience:
- `/debug` - Automatically identify and fix errors with context-aware AI suggestions.
- `/index` - Re-index your codebase to improve debugging accuracy.
- `/model` - Switch between AI models (e.g., local Ollama models or Claude).
- `/logging` - Enable automatic terminal output capture for easier debugging.
- `/help` - View the full list of available commands.

---

### **Example Scenarios**

#### Debugging a Python Codebase
1. Run into a stack trace when executing your Python script:
   ```bash
   python my_script.py
   ```
2. Call Cloi:
   ```bash
   cloi
   ```
   Cloi analyzes the traceback and retrieves relevant code files using its RAG system, then prompts you with AI-generated fixes.

---

#### Enhancing Debugging Accuracy with Re-Indexing
You recently added a new module to your codebase, but Cloi might not be aware of it. Re-index the codebase:
```bash
cloi /index
```
This ensures Cloi can retrieve the new files when debugging future errors.

---

#### Switching Models
Want to use Claude Sonnet 4 instead of a local model? Export your API key:
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
cloi /model
```
Select Claude Sonnet 4 from the available options in an interactive menu.

---

### **Advanced Features**  

#### Using Retrieval-Augmented Generation (RAG)
Cloi’s RAG system analyzes your entire codebase to find the most contextually relevant files for debugging errors. This is powered by:
- **CodeBERT embeddings** for semantic understanding.
- **BM25 search** for keyword matching.
- **FAISS vector store** for high-performance similarity search.

On your first `/debug`, Cloi installs a local HTTP-based CodeBERT service. It downloads ~500MB of dependencies automatically.

---

#### Terminal Logging
To automatically log terminal errors:
```bash
cloi /logging
```

This modifies your `~/.zshrc` file to store logs at `~/.cloi/terminal_output.log`.

> 💡 **Note:** Logs auto-rotate at 1MB to prevent disk bloat. Currently tested with Zsh shells.

---

## 📐 **Architecture Overview**

Cloi's architecture is modular and extensible, inspired by best practices in CLI tooling:
1. **Core Modules**:
   - Handles debugging via AI-powered generation.
   - Implements error parsing and context-aware retrieval using the RAG pipeline.
2. **AI Models**:
   - Supports local Ollama models and cloud-based Anthropic APIs.
   - Model selection is customizable with `/model` commands.
3. **RAG System**:
   - Built on BM25, FAISS, and CodeBERT for intelligent file retrieval.
4. **Extensibility**:
   - Designed for plugin support and easy customization.

---

## 🤝 **Contributing**

We love contributions! Whether you're fixing bugs, adding features, or suggesting improvements, your input is welcome. To contribute:
1. Fork the repository.
2. Create a new feature branch:
   ```bash
   git checkout -b feature/my-new-feature
   ```
3. Commit your changes and submit a pull request.

> Please ensure all contributions adhere to the project's **GPL-3.0** license. Derivative works must also maintain GPL-3.0 compatibility.

For more details, refer to the [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 🐞 **Troubleshooting Common Issues**

### Dependency Installation Fails
**Symptoms:** Error during first `/debug` run indicating missing Python dependencies.  
**Fix:** Ensure Python is installed and available in your `PATH`. If python version mismatches:
```bash
python3 --version
# Use Python version >= 3.6
```

### RAG Service Fails to Start
**Symptoms:** Port 3090 is already occupied.  
**Fix:** Identify the conflicting process:
```bash
lsof -i :3090
kill -9 <pid>
```
Then rerun Cloi.

### High Memory Usage
**Symptoms:** Crashes or slow performance.  
**Fix:** Switch to smaller models via `/model`, or free up system resources.

---

## 🎉 **Getting Started**

Start debugging with Cloi today:
```bash
cloi
```  

Happy debugging! 💻

--- 
