Below is the **enhanced README** for the Cloi project. This version is designed to offer clear guidance, better clarity, and a warm welcome to new users and contributors.

---

# <div align="center">Cloi CLI (beta preview)</div>

<div align="center">Your local, context-aware debugging agent powered by AI</div>
<br>
<div align="center">
  <img src="https://img.shields.io/badge/version-beta-yellow" alt="version" />
  <img src="https://img.shields.io/badge/license-GPL%203.0-green" alt="license" />
</div>
<br>
<div align="center"><img src="assets/finaldemo.gif" alt="Cloi CLI Demo" /></div>

## 💡 What is Cloi? (Project Overview)

Cloi is a **local debugging companion for developers**, designed to accelerate issue resolution in your codebase. Operating securely on your machine, Cloi uses cutting-edge AI models to understand errors and generate actionable fixes – all without compromising your privacy.

- **Why Cloi?**
    - Debugging can be tedious. Cloi empowers developers by offering **AI-guided insights** and suggestions while maintaining complete **privacy**. Whether you're navigating a cluttered codebase or wrangling elusive bugs, Cloi helps you streamline debugging with **context-aware analysis**.
    
- **Core Values:**
    1. **Local-first Privacy:** All operations are performed on your machine – no code or data is ever uploaded to the cloud.
    2. **Ease of Use:** Zero configuration required. Cloi integrates seamlessly with your terminal.
    3. **Developer-Centric:** Built for developers who value **convenience, flexibility, and control**.

**Disclaimer:**  
Cloi is experimental software (beta). Bugs may exist, and fixes might require review. Please report issues and share feedback through GitHub – we value your contributions to make Cloi even better!

---

## 🚀 Key Features

- **Local Execution:** Use **Ollama models** on your machine or opt for external LLMs like Anthropic's Claude (with API support).
- **RAG Debugging:** Cloi detects relevant files in your project using **Retrieval-Augmented Generation (RAG)** to offer more accurate fixes.
- **Interactive Commands:** Customize, debug, and iterate directly in your terminal.
- **Secure by Design:** All operations, from code indexing to debugging suggestions, remain on your local machine.
- **Extensible:** Modular architecture allows contributors to adapt and expand functionalities.

---

## 📦 Installation

### Requirements:
- **Hardware:**
    - Memory: 8GB RAM (minimum), 16GB+ recommended
    - Storage: 10GB free (especially if using large models such as `Phi-4`)
    - Processor: Optimized for Apple M2/M3 chips  
- **Software:**
    - OS: macOS (Big Sur 11.0+)
    - Runtime: Node.js 14+ and Python 3.6+
    - Shell: Zsh (primary), Fish/Bash (limited testing)

### Steps:
1. Install Cloi globally using npm:
   ```bash
   npm install -g @cloi-ai/cloi
   ```
2. Ensure you have **Ollama** installed (Cloi will handle this automatically if missing).

3. Navigate to your project directory and invoke Cloi:
   ```bash
   cloi
   ```

Want to use Anthropic's LLMs instead of local Ollama models? Add your API key:
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```
Then, restart your terminal.

---

## 🛠️ Usage

1. **Start Cloi:**  
   Inside a project directory, simply run:
   ```bash
   cloi
   ```

2. **Interactive Commands:**
   Use built-in commands in Cloi's interactive mode to debug or refine workflows:
   ```
   /debug    - Auto-fix errors using AI models (starts RAG automatically)
/index    - Re-index your codebase for accurate debugging
/model    - Switch AI models (e.g., Ollama's local models or Claude)
/logging  - Enable automatic terminal error logging
/help     - Show all available commands
   ```

3. **Common Debugging Workflow Example:**  
   - Encounter an error during development:
     ```bash
     npm run dev
     ```
     _(Error: Cannot read property 'x' of undefined)_  
   - Call Cloi for context-aware debugging:
     ```bash
     cloi
     ```
   - Let Cloi's `/debug` feature pinpoint the issue, suggest a fix, and review changes interactively.

4. **Customizing Models:**  
   Choose from pre-installed Ollama models or use external APIs like Anthropic’s Claude via the `/model` command.

---

## 🏗️ Architecture Overview

Cloi is built on a modular architecture designed to optimize local debugging:

- **Core Components:**
  1. **Retrieval-Augmented Generation (RAG):** Combines CodeBERT embeddings with BM25 keyword search for relevant code suggestions.
  2. **AI Models:**
      - Local (Ollama) models like Phi-4 and Qwen3.
      - External models such as Anthropic's Claude (via API).
  3. **Interactive CLI:** Enables developers to debug, re-index codebases, and manage workflows directly in the terminal.
  4. **Error Logging Service:** (Optional) Automatically logs errors for offline analysis (`~/.cloi/terminal_output.log`).

---

## 🤝 Contributing

We welcome contributions from developers passionate about AI and debugging tools! Here’s how you can get involved:

1. **Reporting Issues:**  
   Found a bug or have a feature request? Open an issue [here](https://github.com/Cloi/issues).

2. **Submitting Pull Requests:**  
   Fork this repository and submit a pull request. Please ensure adherence to the following:
   - **Scope:** Contributions should align with the project's goals of providing a secure, local-first debugging assistant.
   - **Documentation:** Include appropriate comments and README updates for your changes.
   - **Testing:** Provide a clear description of how your feature or fix can be tested.

3. **Licensing:** All contributions must comply with Cloi's licensing under GPL-3.0.

For more detailed guidelines, see our [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 🔧 Troubleshooting

1. **Command Not Found:**
   - Ensure `@cloi-ai/cloi` is properly installed globally using `npm install -g`.
   - Check if your `PATH` is correctly set to include global npm packages.

2. **Missing Dependencies:**
   - Cloi will auto-install most dependencies upon first use. If errors persist, verify:
     ```bash
     node --version
     python3 --version
     ```
     Ensure required versions are installed.

3. **Zsh-Specific Features Not Working:**
   - Cloi's `/logging` relies on `.zshrc`. Ensure Zsh is your active shell (`echo $SHELL`).

4. **Large Model Download Hanging:**
   - Ensure stable internet access for first-time downloads (e.g., CodeBERT, Phi-4 models).

5. **Anthropic Key Invalid:**
   - Double-check your API key setup for external Claude-based models:
     ```bash
     export ANTHROPIC_API_KEY="your-api-key-here"
     ```

Still stuck? Visit our [GitHub Issues page](https://github.com/Cloi/issues) for help.

---

## 📜 Changelog & Patches
See the latest updates and improvements in the [Changelog](CHANGELOG.md).

Thank you for supporting Cloi – together, we’re making debugging faster, smarter, and more privacy-conscious! 💻✨
