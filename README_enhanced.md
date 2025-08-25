# <div align="center">Cloi CLI (beta preview)</div>

<div align="center">Your local debugging agent for seamless error resolution in your terminal.</div>
<br>
<div align="center">
  <img src="https://img.shields.io/badge/version-beta-yellow" alt="version" />
  <img src="https://img.shields.io/badge/license-GPL%203.0-green" alt="license" />
</div>
<br>
<div align="center"><img src="assets/finaldemo.gif" alt="Cloi CLI Demo" /></div>

---

## 🧐 What is Cloi?

Cloi is a **local**, **context-aware debugging assistant** designed to make fixing code easier and faster—right from your terminal. It uses advanced AI models to analyze errors and offer actionable fixes. Unlike cloud-powered assistants, Cloi runs entirely on your device, ensuring **privacy** and **security** of your codebase. 

Cloi supports **zero setup** debugging, Retrieval-Augmented Generation (RAG) for smarter error analysis, and seamless integration with popular local LLMs like **Ollama**. Whether you're a solo developer or part of a team, Cloi empowers you to quickly resolve errors while staying in full control of your code.

---

## 🌟 Why Use Cloi?

Cloi is uniquely designed for developers who:

- 💻 **Work in the Terminal**: Debug directly in your CLI without context-switching between tools.
- 🔐 **Value Privacy**: Operates locally with no external API calls unless you choose to share data (e.g., using Anthropic models).
- 🚀 **Want Smarter Debugging**: Automatically finds relevant files using RAG and proposes safe, reviewable fixes.
- 🛠️ **Prefer Minimal Setup**: Installs dependencies and setups RAG models automatically on first run.
- ♾️ **Need Flexibility**: Works with **local Ollama or Claude (Anthropic) models**, supporting both developers without GPUs and those with external AI resources.

---

## 🚀 Installation

### Prerequisites

Ensure your system meets the following requirements:

- **Node.js**: 14+ (Check with `node -v`)
- **Python**: 3.6+ (Check with `python3 --version`)
- **Shell**: Zsh, Fish, or Bash (limited testing)
- **Operating System**: macOS (Big Sur 11.0+ recommended)
  
Hardware requirements:
- Minimum 8 GB RAM (16 GB recommended)
- Storage: 10 GB+ free space (models like Phi-4 may require ~9.1 GB)

> :bulb: **Note**: Cloi automatically installs dependencies, including Ollama, the first time it's used.

### Install Globally with `npm`

```bash
npm install -g @cloi-ai/cloi
```

To verify the installation, run:
```bash
cloi --version
```

### Setting Up (First-Time Use)

1. Navigate to your project directory:
   ```bash
   cd /path/to/your/project
   ```

2. Simply invoke Cloi when you encounter an error:
   ```bash
   cloi
   ```

---

## 🛠️ Usage Examples

Here's how Cloi can transform your debugging process:

### 1. Automatic Debugging

When you encounter an error in your project, run:
```bash
cloi
```
Cloi will:
- Detect recent errors in your terminal logs.
- Use RAG to locate and analyze related files in your codebase.
- Propose AI-generated fixes (with full diffs for review).

### 2. Switching Models (`/model`)

If you'd like to switch to another model like Claude Sonnet 4:
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```
Restart your terminal and select the model:
```bash
/model
```

Choose between locally-installed Ollama models (no API key needed) or Anthropic models—Claude Sonnet 4, Opus.

### 3. Re-Indexing Your Codebase (`/index`)

If you've added new files or made major changes to your project:
```bash
/index
```
This command refreshes Cloi's embedding index for smarter debugging.

---

## 🛠️ Architecture Overview

Cloi is a modular CLI application built around modern AI-assisted debugging principles:

- **Embedding-Based RAG Search**: Combines semantic analysis (via CodeBERT embeddings) with keyword-based methods (BM25) for relevant file discovery.
- **Local Models with Extensibility**: Uses packaged models (like Phi-4) for fast on-device AI processing. Extensible to external APIs like Anthropic Claude.
- **Modular Commands**: `/debug`, `/index`, `/model`, etc., provide clear and structured workflows.
- **Automated Setup**: Installs all necessary dependencies, including Python libraries and model files, during its first run.
- **Logging**:
   - Error logs and terminal output (via `/logging`) ensure better debugging history.
   - Outputs saved to `~/.cloi/terminal_output.log`.

The system is designed to optimize performance without taxing system resources unnecessarily, providing a smooth and responsive developer experience.

---

## 🤝 Contributing to Cloi

We welcome contributions of all kinds! Whether it's fixing bugs, writing documentation, or proposing new features, we'd love your help.

### 📝 Guidelines

1. **Open Source Commitment**: Contributors agree that all submissions will follow the GNU General Public License v3.0 (GPL-3.0). Any derivative works must also be made available under the same license.
2. **Code Quality**: Focus on maintainable, modular code. Lint before opening a Pull Request.
3. **Documentation**: Provide clear and well-structured updates to code and feature documentation.

### 💡 How to Get Started

1. Fork the Cloi repository and clone it locally:
   ```bash
   git clone https://github.com/your-username/cloi
   cd cloi
   ```

2. Install dependencies (ensure `npm` is installed):
   ```bash
   npm install
   ```

3. Make changes and test your code locally:
   ```bash
   npm run dev
   ```

4. Open a Pull Request with a descriptive title and details.

For more details, refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file.

---

## 🐞 Troubleshooting & Common Issues

### 1. **Installation Fails**
- **Symptom**: `npm` throws errors during installation.
- **Fix**: Ensure Node.js version >= 14. Use `nvm` to manage versions if needed:
  ```bash
  nvm install 14
  ```

### 2. **Missing Python Libraries**
- **Symptom**: Errors related to Python dependencies (e.g., `faiss`).
- **Fix**: Run:
  ```bash
  python3 -m pip install -r requirements.txt
  ```
  
  Or ensure `pip` is installed and updated:
  ```bash
  python3 -m ensurepip --upgrade
  ```

### 3. **No Debug Suggestions**
- **Symptom**: `/debug` returns no fixes.
- **Fix**:
  - Ensure your project is properly indexed with `/index`.
  - Increase log verbosity and check output:
    ```bash
    cloi --verbose
    ```

### 4. **Model Not Listed**
- **Symptom**: Your desired Ollama or Claude model isn't available.
- **Fix**:
  - Reinstall local models by running:
    ```bash
    /model
    ```
  - For Claude, ensure `ANTHROPIC_API_KEY` is properly set in your environment.

---

## 📜 License

Cloi is licensed under the [GNU General Public License v3.0 (GPL-3.0)](LICENSE).

---

## 📢 Stay Updated

- Star our [GitHub project](https://github.com/cloi-ai/cloi) and join discussions!
- Follow us for updates: [@cloi_ai](https://twitter.com/cloi_ai).

Happy debugging! ✨
