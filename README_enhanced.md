Here is the revamped `README.md` with the requested improvements:

---

# <div align="center">Cloi CLI (Beta Preview)</div>

<div align="center">Your local, context-aware debugging agent — built for developers who value privacy and efficiency.</div>
<br>
<div align="center">
  <img src="https://img.shields.io/badge/version-beta-yellow" alt="version" />
  <img src="https://img.shields.io/badge/license-GPL%203.0-green" alt="license" />
</div>
<br>
<div align="center"><img src="assets/finaldemo.gif" alt="Cloi CLI Demo" /></div>

---

## 🔍 What is Cloi?

Cloi is a local, on-device debugging assistant that integrates seamlessly into your development workflow. Whether you encounter errors while coding or need better insights into debugging challenges, Cloi is designed to streamline the process. Unlike other agents, Cloi operates entirely on your system, ensuring your data stays private.

**Why Cloi?** Imagine having an always-available debugging assistant that parses errors, retrieves relevant code files, applies AI-powered suggestions, and lets you decide what changes to keep—all without sending your code or data to third-party servers.

---

## ⚡ Key Features

- **🌟 Privacy-Centric**: Cloi works entirely on your machine, with no external API calls (unless you explicitly choose a cloud-based model).
- **🔍 Context-Sensitive Debugging**: Automatically identifies relevant code files using Retrieval-Augmented Generation (RAG).
- **💡 AI-powered Fixes**: Debug errors using pre-trained local or cloud-based AI models.
- **🛠 Zero Setup**: Cloi autoinstalls dependencies like RAG models and code indexers on first use.
- **✔️ Safe and Transparent**: Review all AI-generated diffs before applying changes to your code.
- **🌐 Flexibility**: Use local Ollama models or cloud-based Anthropic Claude models, with a simple toggle through `/model`.

---

## 🚀 Installation

### Prerequisites

Ensure you have the following installed:
- **Node.js**: Version 14 or higher
- **Python**: Version 3.6 or higher
- **Shell**: Zsh, Fish, or Bash (limited testing with Fish/Bash)
- **OS**: macOS Big Sur (11.0+) or later

### Install Cloi CLI

To install Cloi globally, run:
```bash
npm install -g @cloi-ai/cloi
```

**Tip**: Works with preinstalled Ollama models—no API key or additional configuration required!

---

## 📖 Getting Started

### Debugging with Cloi

1. **Navigate to your project directory**:
   ```bash
   cd /path/to/your/project
   ```
2. **Run Cloi when you encounter an error**:
   ```bash
   cloi
   ```
3. **Choose an action from the interactive menu**:
   - `/debug`: Analyze errors and suggest fixes.
   - `/index`: Re-index your codebase for better debugging accuracy.
   - `/model`: Select your preferred AI model (local or cloud-based).
   - `/logging`: Enable automatic error logging directly from your terminal.

### Example Scenarios

Here’s how Cloi can assist in real-world scenarios:

#### Scenario 1: Debugging a JavaScript Function That Throws Errors
```bash
# After running your script, you encounter an error like:
node myscript.js
# Output: ReferenceError: x is not defined

# Call the Cloi CLI:
cloi

# Cloi analyzes the error, searches through related code files, 
# and offers you potential fixes. Review the suggestions and choose to apply or reject.
```

#### Scenario 2: Using Claude Sonnet 4 for Debugging
If you prefer leveraging Anthropic's cloud-based models:
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
cloi
# Select "Claude Sonnet 4" in the model menu and debug as usual. 
```

---

## 🛠 Architecture Overview

Cloi's architecture is centered around efficient debugging by leveraging local resources and providing AI-powered insights. Here's a high-level summary:

1. **Input Processing**: Cloi analyzes terminal errors or manual error descriptions entered via `/debug`.
2. **Context Retrieval**: 
    - Uses Retrieval-Augmented Generation (RAG) to find related files and code snippets.
    - Combines semantic search (CodeBERT embeddings) with keyword matching (BM25).
3. **Model Selection**:
    - Local models (Ollama) or cloud models (Claude Sonnet 4/Opus 4) provide intelligent debugging suggestions.
4. **Diff Generation**:
    - Cloi applies AI transformations and generates a clear `diff` for you to review.
5. **Code Indexing**:
    - Automatically indexes your codebase on first `/debug` run for faster future searches.
6. **Transparency and Safety**:
    - Changes are never applied without user approval.

---

## 🤝 Contributing

We’d love your help in making Cloi better! Whether it’s fixing bugs, adding new features, or improving documentation, contributions are welcome. Follow these guidelines to get started:

1. **Fork the repository**: Create your own copy of the project.
2. **Create a branch**: Work on your feature or fix in its own branch.
3. **Submit a Pull Request**: Once ready, open a pull request explaining your changes.

### Code of Conduct
By contributing, you agree to follow our [Contributor Covenant Code of Conduct](CONTRIBUTING.md).

### Licensing
All contributions will fall under the GPL-3.0 license, maintaining the open source ethos of the project.

---

## ❓ Troubleshooting

Here are solutions to common issues encountered by Cloi users:

### Issue: `Command not found: cloi`
**Solution**: Ensure that the `npm` global bin folder is part of your system's `PATH`. Add this to your shell configuration file (e.g., `.zshrc`):
```bash
export PATH=$(npm bin -g):$PATH
```

### Issue: `Error: Missing ANTHROPIC_API_KEY`
**Solution**: If you're using cloud-based models like Claude, make sure to set the `ANTHROPIC_API_KEY` environment variable:
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```
Add this line to your `.zshrc` or `.bashrc` and restart your terminal session.

### Issue: `High memory usage during debug runs`
**Solution**: Ensure your machine meets the minimum requirements. Consider closing other memory-intensive applications when running Cloi.

### Issue: `Model downloads taking too long`
**Solution**: Cloi auto-downloads dependencies like CodeBERT (~500MB). Ensure you have a stable internet connection. If issues persist, try downloading the models manually as a fallback.

For further assistance, please open an issue in our [GitHub repository](https://github.com/cloi-ai/cloi).

---

## 📜 Changelog

See the full changelog [here](CHANGELOG.md).

---

## 🛡️ License

Cloi is licensed under the GNU General Public License v3.0 (GPL-3.0). For more information, see the [LICENSE](LICENSE) file.

---

Made with ❤️ by the Cloi AI team. Feedback is always welcome—let’s build better debugging tools together!
