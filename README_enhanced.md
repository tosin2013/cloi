Here's a polished and comprehensive version of the Cloi README:

---

# <div align="center">🛠️ Cloi CLI (Beta Preview)</div>

<div align="center">An intelligent, local debugging agent built for developers who love their terminal</div>

<div align="center">
  <img src="https://img.shields.io/badge/version-beta-yellow" alt="version" />
  <img src="https://img.shields.io/badge/license-GPL%203.0-green" alt="license" />
</div>

<div align="center"><img src="assets/finaldemo.gif" alt="Cloi CLI Demo" /></div>

---

## 📖 Overview 

Cloi CLI is a **local, AI-powered debugging tool** that helps developers pinpoint and resolve issues faster directly in their terminal. Designed with **privacy** and **developer-first principles** in mind, Cloi never sends your code or data to third-party servers unless explicitly configured. 

Its superpower lies in its Retrieval-Augmented Generation (RAG) and context-aware troubleshooting. Cloi gathers all relevant code, analyzes errors, and suggests fixes you can review and apply with a single command.

🚀 **Key Value Proposition**:
- **Privacy First:** Everything runs locally or on supported private models (e.g., Ollama).
- **Seamless Integration:** Drop it into your development workflow without disrupting your tools.
- **Control:** No blind trust. Review every change Cloi suggests before committing.
- **Free & Extensible:** Build on Cloi’s open-source foundation to meet your exact needs!

> **Note:** Cloi is currently in beta development. Expect some bugs and occasional rough edges, but your feedback can help refine it! 🚧 Submit issues through GitHub or contribute directly by creating pull requests.

---

## ⚙️ Installation Instructions

### Requirements:
Before getting started, ensure your system meets the following requirements:

#### Hardware:
- **Memory:** 8GB+ RAM (16GB recommended)
- **Storage:** 10GB free disk space (Phi-4 model: ~9.1GB)
- **Processor:** Optimal performance on Apple Silicon (M2/M3)

#### Software:
- **Operating System:** macOS (11.0+ Big Sur)
- **Runtime Environments:**
  - [Node.js](https://nodejs.org/) v14+
  - [Python](https://www.python.org/) 3.6+
- **Shell:** Optimized for Zsh (limited testing on Fish/Bash)

---

### Installation:

Run the following command to install Cloi globally:

```bash
npm install -g @cloi-ai/cloi
```

### First-Time Setup:
- Navigate to your project directory.
- Run `cloi` whenever you encounter an error! Cloi will automatically index your code and prompt for assistance.

> **No API key required:** Cloi seamlessly integrates with **Ollama models** and uses on-device intelligence.

---

## 💡 Usage 

After installation, Cloi integrates into your everyday debugging workflow. Use the following practical examples to get started:

### **Debugging an Error**
1. Navigate to the directory where the error occurred.
2. Run the Cloi CLI:
   ```bash
   cloi
   ```
3. Cloi automatically fetches error traces, analyzes relevant files, and provides patch suggestions:
   ```bash
   [Cloi Suggestions]
   - Found the root cause in `app.js` (Line 42). Likely issue: undefined variable `userID`.
   - Suggested fix: Initialize `userID` variable in the constructor.

   --- Diff Preview ---
    Line 42: const userID = this.getUserID();
   ---------------------
   ```
4. Choose to **apply**, **edit**, or **discard** the fix.

---

### **Interactive Commands**
Enter interactive mode for advanced operations:
```bash
cloi
```
Then run:
- `/debug` – Automatically analyze and fix errors with context-aware RAG.
- `/index` – Re-index your codebase for improved debugging.
- `/model` – Change AI models (e.g., switch to Claude-4 or other Ollama models).
- `/logging` – Set up terminal output logging for continuous error monitoring.
- `/help` – View all available commands.

---

### **Switching to Claude-4 Models**
If you’d like to use Anthropic’s Claude models (Sonnet-4/Opus-4):
1. Add your Anthropic API key:
   ```bash
   export ANTHROPIC_API_KEY="your-api-key-here"
   ```
2. Add this line to your `~/.zshrc` file for persistence and restart your terminal:
   ```bash
   source ~/.zshrc
   ```

Now choose Claude-4 models via the `/model` command!

---

## 🛠️ Architecture Overview (High-Level)

Cloi’s architecture is designed for simplicity and powerful debugging workflows:

1. **Input:** User invokes `cloi` or interactive commands.
2. **Error Analysis:** Built-in parsers (e.g., StackTrace.js) find errors in logs or terminal output.
3. **Context Retrieval:**
   - Implements RAG via **CodeBERT embeddings** + **BM25 keyword search**.
   - Efficiently locates code files relevant to debugging.
4. **AI Models:**
   - Local AI models (Ollama’s Phi-4, etc.).
   - Optional cloud-based models (Claude-4/Opus).
   - All suggestions are contextually relevant.
5. **Change Suggestion:**
   - Diff preview provided for the user to accept/review.

---

## 🙌 Contributing

Cloi CLI is an open-source project – we welcome contributions to improve its capabilities and user experience! Here’s how you can get involved:

1. **Fork the repo** and clone a local copy.
2. Create a feature branch for your changes:
   ```bash
   git checkout -b feature/my-new-feature
   ```
3. Ensure your changes align with the project’s:
   - **Goals:** Secure, local AI-driven debugging.
   - **Licensing:** GNU General Public License v3.0.
4. Open a Pull Request for review.

See our full [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

---

## 🔧 Troubleshooting

Here are some common issues users encounter and how to resolve them:

### "Command not found: cloi"
- Ensure you’ve installed Cloi globally:
  ```bash
  npm install -g @cloi-ai/cloi
  ```
- Double-check your `$PATH` configuration.

---

### "Error: No AI models found"
- Install Ollama from https://ollama.com/.
- Ensure the required model (`Phi-4`) is downloaded and ready for use.

---

### "Cloi freezes when analyzing large projects"
- Cloi performs indexing on the first run. Wait patiently or exclude unnecessary directories:
  - Create a `.cloiignore` file in your project:
    ```
    node_modules
    dist
    ```

---

## 📣 Feedback and Support

Stuck? Have ideas? Open an issue or reach out via GitHub discussions. Every suggestion helps us make Cloi better!  

Let Cloi make debugging simpler, faster, and a little more fun. 😄  

---
