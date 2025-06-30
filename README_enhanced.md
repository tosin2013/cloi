Here’s the improved `README.md` for the Cloi project. It incorporates clearer descriptions, installation instructions, usage examples, an architecture overview, troubleshooting tips, and a friendly space for contributors. The content is structured to welcome new users and developers alike.

---

# <div align="center">Cloi CLI (Beta Preview)</div>

<div align="center">A smart, local debugging agent that runs directly in your terminal</div>
<br>
<div align="center">
  <img src="https://img.shields.io/badge/version-beta-yellow" alt="version" />
  <img src="https://img.shields.io/badge/license-GPL%203.0-green" alt="license" />
</div>

<div align="center"><img src="assets/finaldemo.gif" alt="Cloi CLI Demo" /></div>

---

## 🛠️ What is Cloi?

Cloi is a **local-first, context-aware debugging assistant** built to streamline your development workflow. By leveraging the power of AI models such as local Ollama models or advanced APIs like Claude Sonnet 4, Cloi identifies coding errors, retrieves relevant file context, and suggests automated fixes—all while keeping your code private and secure on your machine.

Say goodbye to endless stack traces. Cloi analyzes errors, fetches relevant information, and recommends **safe, reviewable fixes** to your codebase—all without requiring cloud services or exposing sensitive data. Built for developers who value their privacy and efficiency, Cloi integrates seamlessly into your terminal.

---

## 🌟 Why Cloi?

- **💻 Local-First Privacy:** Debug directly on your machine—your code never leaves your environment.
- **🔮 Context-Aware Debugging:** Dynamically identifies and retrieves relevant files using Retrieval-Augmented Generation (RAG).
- **💾 Zero Setup:** Automatically configures models and dependencies with no configuration headaches.
- **👀 Reviewable Fixes:** Suggests safe patches with complete control over applying changes.
- **🎛️ Flexible AI Models:** Supports local Ollama models or Claude Sonnet/Opus models—switch with one command.
- **📂 Free & Open Source:** Transparent, extensible architecture—contribute, share, or customize to your needs.

---

## 🚀 Installation

Cloi is simple to install and use. You'll need [Node.js](https://nodejs.org/) (14+) and Python (3.6+) before proceeding.

1. Install Cloi globally using npm:
   ```bash
   npm install -g @cloi-ai/cloi
   ```

2. Navigate to your project directory:
   ```bash
   cd /path/to/your/codebase
   ```

3. Run Cloi when you encounter an error:
   ```bash
   cloi
   ```

That’s it! Cloi will guide you step-by-step to analyze and debug your code. First-time users can follow the on-screen prompts to configure dependencies automatically.

---

## 🧩 Example Usage

### Scenario 1: Debugging with Cloi
1. You encounter an error in your project. Run:
   ```bash
   cloi
   ```
2. Cloi analyzes the error, retrieves relevant files, and suggests potential fixes.
3. Review the suggested code changes—apply or reject them, ensuring you have full control.

### Scenario 2: Switching AI Models
Prefer to debug with Claude Sonnet 4 powered by Anthropic? Add your API key:
   ```bash
   export ANTHROPIC_API_KEY="your-api-key-here"
   ```
Restart your terminal, and select the model with the `/model` command.

### Scenario 3: Re-indexing Your Project
After adding new files or making significant changes to the project, re-index:
   ```bash
   cloi /index
   ```

---

## 📌 Key Commands

Commands available in Cloi's interactive mode:
```
/debug    - Analyze the current error and suggest fixes
/index    - Re-index the codebase for enhanced context-awareness
/model    - Switch between local Ollama and cloud models (like Claude)
/logging  - Enable automatic terminal logging (zsh only)
/help     - Show all available commands
```

---

## ⚙️ Architecture Overview

Cloi's architecture is optimized for **local, private debugging**:
- **Retrieval-Augmented Generation (RAG):** Combines CodeBERT embeddings with BM25 keyword search to identify relevant files.
- **AI Models:** Supports local (Ollama) models for privacy-first debugging, while also offering API-based Claude models for more advanced capabilities.
- **Embeddings Service:** Runs a local REST service (FAISS-backed) on `localhost` to generate semantic embeddings.
- **Safe Changes:** Reviewable diffs to ensure complete control of applied fixes.

**Architecture Diagram:**
1. **Input:** Developer defines the specific error they want to debug.
2. **Error Analysis:** Processes stack traces or error codes to determine context.
3. **File Retrieval (RAG):** Identifies relevant files using a hybrid of semantic search (CodeBERT) and keyword search (BM25).
4. **Code Transformation:** Uses models like Phi-4 or Claude to generate suggestions.
5. **Output:** Presents safely reviewable patches for developer approval.

---

## 🔍 Troubleshooting

### Common Issues
#### **1. Cloi Fails to Start**
   - Ensure you have the correct Node.js and Python versions installed:
     ```
     node -v  # Should be 14+
     python3 --version  # Should be 3.6+
     ```

#### **2. Missing Dependencies**
   - If dependencies fail to install automatically, try reinstalling manually:
     ```bash
     npm install -g @cloi-ai/cloi
     ```

#### **3. Claude API Not Configured**
   - Ensure your API key is exported correctly:
     ```bash
     export ANTHROPIC_API_KEY="your-api-key-here"
     ```
   - Restart your shell and confirm with `/model`.

#### **4. File Indexing Issues**
   - Run `/index` in interactive mode to rebuild the project's code index:
     ```bash
     cloi /index
     ```

#### **5. Terminal Logging Not Enabled**
   - Rerun `/logging` to apply logging changes to `.zshrc`:
     ```bash
     cloi /logging
     ```

For more assistance, file an issue on our [GitHub Issues](https://github.com/cloi-ai/cloi/issues) page.

---

## 🤝 Contributing

Cloi is an open-source project, and we value contributions from the community! Here’s how to get started:

### Steps to Contribute:
1. Fork this repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Implement your changes and write meaningful commit messages.
4. Open a pull request and describe the changes you've made.

### Guidelines:
- Contributions should align with the project's goal of creating a **local-first debugging assistant**.
- All contributions must comply with the [GPL-3.0 license](LICENSE).
- Write tests for new features wherever applicable to ensure stability.

For more details, visit our [Contribution Guide](./CONTRIBUTING.md).

---

## 📜 Changelog

Refer to the latest feature updates in the **Patches** section for new additions or improvements.

---

## 🌈 Join the Community

- Submit ideas or feedback by opening a discussion on our [GitHub Discussions](https://github.com/cloi-ai/cloi/discussions).
- Follow us on social media for updates on new features and releases.

---

Thank you for exploring Cloi! Whether you’re debugging solo or contributing to its development, we’re excited to have you aboard. 🎉  
