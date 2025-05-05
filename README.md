# <div align="center">Cloi CLI (beta preview)</div>

<div align="center">Local debugging agent that runs in your terminal</div>
<br>
<div align="center">
  <img src="https://img.shields.io/badge/version-beta-yellow" alt="version" />
  <img src="https://img.shields.io/badge/license-CC%20BY--NC%204.0-green" alt="license" />
</div>
<br>
<div align="center"><img src="demo.gif" alt="Cloi CLI Demo" /></div>

## Overview

Cloi is a local, context-aware agent designed to streamline your debugging process. Operating entirely on your machine, it ensures that your code and data remain private and secure. With your permission, Cloi can analyze errors and apply fixes directly to your codebase.

**Disclaimer:** Cloi is an experimental project under beta development. It may contain bugs, and we recommend reviewing all changes before accepting agentic suggestions. That said, help us improve Cloi by filing issues or submitting PRs, see down below for more info.

## Installation

Install globally: 

```bash
npm install -g @cloi-ai/cloi
```

**No API key needed, runs completely locally.**

Navigate to your project directory and call Cloi when you run into an error.

```bash
cloi
```

### Interactive Mode Commands
```
/debug    - Auto-patch errors iteratively using LLM
/model    - Pick Ollama model
/history  - Pick from recent shell commands
/help     - Show this help
/exit     - Quit
```

### Why use Cloi?

Cloi is built for developers who live in the terminal and value privacy:

- **100% Local** – Your code never leaves your machine. No API key needed.
- **Automates Fixes (Beta)** – Analyze errors and apply patches with a single command.
- **Safe Changes** – Review all diffs before applying. Full control to accept or reject.
- **Customizable** – Ships with Phi-4 model. Swap models as needed via Ollama.
- **Free to Use** – Extensible architecture. Fork, contribute, and customize to your needs.

### System Requirements

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
    • <b>OS:</b> macOS (Big Sur 11.0+), Linux and Windows (limited testing)<br>
    • <b>Runtime:</b> Node.js 14+ and Python 3.6+<br>
    • <b>Shell:</b> Zsh, Fish, Bash (limited testing)<br>
    • <b>Dependencies:</b> Ollama (automatically installed if needed)
  </td>
</tr>
</table>

### Beta Features

> **Beta Feature Notice:** The Automate Fix feature is currently in beta. While it can automatically apply fixes to your code, we strongly recommend:
> - Reviewing all suggested changes before accepting them
> - Testing the changes in a development environment first
> - Keeping backups of your code before using automated fixes

### Contributing

We welcome contributions from the community! By contributing to this project, you agree to the following guidelines:

- **Scope:** Contributions should align with the project's goals of providing a secure, local AI debugging assistant
- **Non-Commercial Use:** All contributions must adhere to the CC BY-NC 4.0 license
- **Attribution:** Please ensure proper attribution for any third-party work
- **Code of Conduct:** Be respectful and considerate in all interactions

For more detailed information on contributing, please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file.

---

### Patches 

#### [1.0.5] - May 4th, 2025 @ 9:10pm PST

- **Bug Fix**: Resolved dependency issue in package.json
  - Updated Ollama dependency from deprecated version 0.1.1 to 0.5.15 which resolved ollama.chat API endpoints

#### [1.0.2] - May 4th, 2025 @ 12:20pm PST

- **Feature:** Integrated [structured outputs](https://ollama.com/blog/structured-outputs) from Ollama's latest API
  - Creates more robust patches with JSON-based formatting
  - Falls back to traditional LLM calls if the structured API isn't available
- **Feature:** Implemented CLI model selection via `--model` flag
  - Specify your preferred Ollama model right from the command line
  - Credit to [@canadaduane](https://github.com/canadaduane) for the insightful suggestion!
- **UI Enhancement:** The `/model` command now displays your locally installed Ollama models 
- **Refactor:** Internal architecture adjustments to maintain conceptual integrity
  - Migrated `history.js` to the utils directory where it semantically belongs
  - Repositioned `traceback.js` to core since it's foundational to the debugging pipeline
- **Improvements:** Purged lingering references to our project's original name "FigAI" and cleaned the CLI `--help` interface
