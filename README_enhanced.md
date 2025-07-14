# <div align="center">Cloi CLI (Beta Preview)</div>

<div align="center">Your local AI assistant for streamlined debugging</div>
<br>
<div align="center">
  <img src="https://img.shields.io/badge/version-beta-yellow" alt="version" />
  <img src="https://img.shields.io/badge/license-GPL%203.0-green" alt="license" />
</div>
<br>
<div align="center"><img src="assets/finaldemo.gif" alt="Cloi CLI Demo" /></div>

---

# Overview

Cloi is an innovative, local-first AI debugging assistant designed for developers who work in the terminal. Powered by Retrieval-Augmented Generation (RAG) and pre-trained models like CodeBERT, Cloi automatically retrieves relevant code, diagnoses errors, and generates fixes—all while keeping your data private and secure on your local machine.

**Key Features:**
- **Privacy First:** Operates entirely on-device with no external data sharing.
- **Error Simplified:** Debugging made easy through contextual AI analysis.
- **Smart Code Search:** Automatically finds relevant files across your codebase for better debugging.
- **Model Flexibility:** Supports local Ollama models and Claude API (Sonnet 4, Opus).
- **Zero Friction:** No complicated setup—just install and start debugging.

Whether you're patching a bug or optimizing your workflow, Cloi simplifies your debugging process and puts you in control of your code.

---

## Installation

To use Cloi, ensure you meet the [System Requirements](#system-requirements) below, then install Cloi globally with npm:

```bash
npm install -g @cloi-ai/cloi
```

Cloi works seamlessly with your existing Ollama models and doesn't require API keys for local usage. It auto-configures dependencies upon first use, so there's no extra setup.

---

## Getting Started

### Basic Usage
Cloi is designed to work instantly in your project directory. Whenever you encounter an error during development, simply run:

```bash
cloi
```

You'll enter **Interactive Mode**, where Cloi will analyze errors, index your codebase, and suggest fixes.

### Interactive Mode Commands
Here are some frequently used commands in Cloi's interactive mode:

```
/debug    - Automatically fix errors using AI models (sets up RAG indexing)
/index    - Re-index your codebase to enhance debugging accuracy
/model    - Select your preferred AI model (e.g., Ollama or Claude)
/logging  - Enable automatic terminal output logging (zsh only)
/help     - Show available commands and explanations
```

### Using Claude's Models (Optional API Key)
You can use Anthropic's powerful Claude Sonnet or Opus models by setting your API key:

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

Add this line to your `~/.zshrc` file for automatic inclusion on terminal startup. Cloi will detect your API key and make these models available via `/model`.

---

## Practical Scenarios

### Scenario 1: Debugging Error Logs
Imagine you're working on a Node.js server and encounter cryptic error logs. Simply run `cloi` in your terminal:
```bash
cloi
```
Cloi will identify the issue, retrieve relevant files, and suggest possible fixes. You can then review the proposed changes and apply them interactively.

### Scenario 2: Navigating Large Codebases
If you're debugging a massive monolithic repository with thousands of files, Cloi automatically indexes your codebase using RAG so it can narrow down files relevant to the current error. You might run a command like:
```
/debug
```
Cloi's retrieval system will analyze and focus its suggestions on related files.

### Scenario 3: Model Swap for Specific Tasks
Suppose you're debugging code that requires advanced reasoning. Switch to a Claude model for a more nuanced analysis:
```
/model
```
Follow on-screen prompts to switch between supported models, optimizing Cloi for your unique needs.

---

## Architecture Overview

At a high level, Cloi's architecture consists of:

1. **Command-Line Interface:** The interactive CLI enables direct debugging workflows. Built with Node.js.
2. **AI-Driven Debugging:** Utilizes Retrieval-Augmented Generation (RAG) for contextual code-based suggestions.
3. **Model Integration:** Supports local and cloud-based AI models for flexible debugging options.
4. **Robust Indexing System:** Built on FAISS vector search and BM25 keyword matching for efficient file retrieval.
5. **Local Services:** CodeBERT embeddings are powered by a lightweight Python HTTP service running locally.

---

## Contributing to Cloi

We welcome contributions from developers of all skill levels! Cloi is an open-source project licensed under [GPL-3.0](./LICENSE), and contributions should align with our mission to provide secure, private debugging solutions.

### How to Contribute
1. **Fork the Repository:** Clone this project to your local machine.
2. **Create a Feature or Fix Branch:** Follow good Git practices.
3. **Submit a Pull Request (PR):** Include a detailed description of your changes.
4. **Ensure Compliance:** Make sure contributions align with the [GPL-3.0 license](https://www.gnu.org/licenses/gpl-3.0.en.html).

Refer to the [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines on how to get started.

---

## Troubleshooting Common Issues

### Problem: CLI Not Found After Installation
Solution:
Ensure Node.js is properly installed and the `npm` bin directory is added to your PATH environment variable:
```bash
export PATH=$PATH:$(npm config get prefix)/bin
```

Restart your terminal and try again.

---

### Problem: Models Not Displaying
Solution:
Verify model availability within `/model`. If using Claude, ensure `ANTHROPIC_API_KEY` is correctly set in `~/.zshrc`.

---

### Problem: Cloi Process Fails to Run
Solution:
Check system requirements. Cloi needs at least:
- **Node.js v14+** for CLI
- **Python 3.6+** for local services
- **macOS Big Sur (11.0+)** for full functionality

---

### Problem: Large Codebases Take Time to Index
Solution:
Cloi automatically downloads and configures CodeBERT embeddings (~500MB). Future runs will speed up after initial setup.

---

## System Requirements

<table>
<tr>
  <td><b>🖥️ Hardware</b></td>
  <td>
    • <b>Memory:</b> 8GB RAM minimum (16GB+ recommended)<br>
    • <b>Storage:</b> 10GB+ free space (Phi-4 model: ~9.1GB)<br>
    • <b>Processor:</b> Tested on M2 and M3
  </td>
</tr>
<tr>
  <td><b>💻 Software</b></td>
  <td>
    • <b>OS:</b> macOS (Big Sur 11.0+)<br>
    • <b>Runtime:</b> Node.js 14+ and Python 3.6+<br>
    • <b>Shell:</b> Zsh, Fish, Bash (limited testing)<br>
    • <b>Dependencies:</b> Ollama (auto-install available)
  </td>
</tr>
</table>

---

## Feedback and Support

Having trouble? Want to share feedback or suggest features? Submit an issue in our [GitHub repository](https://github.com/cloi-ai/cloi/issues). We also encourage discussions and PRs—your ideas make Cloi better for everyone!

---

*(Cloi CLI Demo and images proudly created by the Cloi team.)*
