Here's the enhanced `README.md` for the Cloi CLI project. It addresses the areas that were requested for improvement:

---

# <div align="center">Cloi CLI (beta preview)</div>

<div align="center">A local debugging agent that empowers developers with AI-assisted fixes while ensuring privacy.</div>
<br>
<div align="center">
  <img src="https://img.shields.io/badge/version-beta-yellow" alt="version" />
  <img src="https://img.shields.io/badge/license-GPL%203.0-green" alt="license" />
</div>
<br>
<div align="center"><img src="assets/finaldemo.gif" alt="Cloi CLI Demo" /></div>

## Overview

Cloi CLI is an intelligent, local debugging agent for developers. Operating entirely on your machine, Cloi uses state-of-the-art AI to troubleshoot errors in your codebase while prioritizing your privacy and control.

### Key Benefits

- **Privacy First:** Debugging operations and AI models run locally, ensuring your code and data never leave your machine.
- **Seamless Integration:** Works with your existing development flow in the terminal, requiring zero modification to your setup.
- **Enhance Productivity:** Automates tedious debugging tasks and provides precise suggestions with clear explanations.
- **Full Control:** Review every code change before applying—nothing happens without your approval.

Whether you're debugging a small script or a large, complex codebase, Cloi is designed to simplify the process with smart context-aware recommendations.

**Disclaimer:** Cloi is currently in beta development. There may be bugs, and we strongly advise you to review all changes suggested by the AI agent. Your feedback can help us make Cloi better—please file issues or submit pull requests (see the [Contributing](#contributing) section for details).

---

## Installation

You can install the Cloi CLI globally using `npm`:

```bash
npm install -g @cloi-ai/cloi
```

Once installed, it requires zero additional setup! Cloi automatically configures all dependencies, such as resource-efficient models, retrieval augmentation, and indexing, upon first use.

---

### System Requirements

Before using Cloi, confirm that your system meets these requirements:

#### Hardware:
- **Memory:** Minimum 8GB RAM (16GB+ recommended for larger codebases).
- **Storage:** At least 10GB free space (Phi-4 model: ~9.1GB).
- **Processor:** Optimized for Intel, M1, M2, and M3 chipsets.

#### Software:
- **Operating System:** macOS (Big Sur 11.0+).
- **Runtime:** Node.js (14+) and Python (3.6+).
- **Shells Supported:** Zsh (fully supported); Fish and Bash (limited testing).
- **Dependencies:** Ollama (installed automatically).

**Note:** Cloi is not yet tested on Windows or Linux systems, but contributions for compatibility are welcome.

---

## Usage

Navigate to your project directory and simply run:

```bash
cloi
```

This will activate the AI debugging assistant. You can interact with Cloi CLI through various commands in its interactive mode:

### Interactive Commands

- `/debug` – Automatically analyze and suggest fixes for errors in your code.
- `/index` – Re-index your codebase for better context during debugging.
- `/model` – Switch between different AI models, such as local Ollama or cloud-based Claude Sonnet 4.
- `/logging` – Configure automatic error logging for your terminal (zsh only).
- `/help` – List all available interactive commands.

**Switching Models:**  
If you'd like to use the Claude Sonnet 4 or Opus-4 models instead of local Ollama models, set up your API key:

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

For convenience, add this to your `~/.zshrc`, then restart your terminal. The new models will appear under `/model` selection.

---

### Usage Example: Debugging a Runtime Error

1. Imagine you're running a Python script that throws a `KeyError`.
2. Simply navigate to the project directory and type `cloi`.
3. Cloi will:
    - Analyze the error message and traceback.
    - Automatically retrieve and analyze relevant files using RAG (Retrieval-Augmented Generation).
    - Suggest a fix, such as initializing a missing key in your data structure.
4. Review the suggested changes, approve or reject them, and continue coding.

**Pro Tip:** Enable `/logging` to automatically capture error logs for debugging sessions without needing to re-run commands.

---

## Architecture Overview

Cloi combines modern AI techniques and local development tooling into a cohesive and lightweight architecture:

- **Retrieval-Augmented Generation (RAG):** Powers Cloi's context-aware debugging by combining keyword search (BM25 algorithm) with semantic vector search (via CodeBERT).
- **Local AI Models:** Cloi uses Ollama for on-device inference, but can seamlessly switch to internet-based models like Claude Sonnet 4 if an API key is provided.
- **Embeddings Service:** Utilizes a local FAISS vector store for efficient similarity searches across large codebases.
- **Interactive CLI:** Users can interact, select models, and tweak options directly from their terminal.

Behind the scenes, Cloi orchestrates this workflow using tightly integrated services with minimal resource overhead.

---

## Contributing

We appreciate and encourage contributions of all kinds to Cloi, whether you're reporting bugs, submitting features, or improving documentation!

Here’s how you can help:

1. **Fork the Repository:** Create your own fork of Cloi from the [GitHub repository](https://github.com/cloi-ai).
2. **Develop Your Changes:** Follow coding standards and ensure your code aligns with project goals.
3. **Write Tests:** If applicable, add tests for your new feature or bug fix.
4. **License Agreement:** Contributions are licensed under the GNU General Public License v3.0 (GPL-3.0).
5. **Submit a Pull Request:** Clearly document the problem your change solves in the PR description.

Don’t forget to check out the `CONTRIBUTING.md` file for detailed guidelines.

**Looking for ideas?** Check out our [Issues](https://github.com/cloi-ai/issues) page for features or bugs you can work on.

---

## Troubleshooting

Running into issues? Here are some common problems and solutions:

### Installation Fails on macOS
- **Problem:** `npm install -g @cloi-ai/cloi` throws a permission error.
- **Solution:** Use `sudo npm install -g @cloi-ai/cloi` to resolve permission issues.

### ERR: Model Not Found
- **Problem:** Cloi cannot find the required AI model.
- **Solution:** Ensure the Ollama runtime was installed properly by running:
  ```bash
  cloi --setup
  ```
  Alternatively, try re-installing Cloi.

### FAISS Service Error on `debug`
- **Problem:** FAISS vector store fails to start.
- **Solution:** Ensure Python 3.6+ is installed and reachable via your `$PATH`.

### Terminal Logging Doesn't Activate
- **Problem:** `/logging` doesn't modify the `.zshrc` file.
- **Solution:** Verify that you're using the Zsh shell. Currently, logging only supports Zsh.

---

Thank you for using Cloi CLI! If you have more questions, suggestions, or ideas, drop by our [GitHub repository](https://github.com/cloi-ai) or open an issue.

---

**Happy Debugging!** 🚀 
