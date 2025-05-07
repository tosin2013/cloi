# <div align="center">Cloi CLI (beta preview)</div>

<div align="center">Local debugging agent that runs in your terminal</div>
<br>
<div align="center">
  <img src="https://img.shields.io/badge/version-beta-yellow" alt="version" />
  <img src="https://img.shields.io/badge/license-GLP%203.0-green" alt="license" />
</div>
<br>
<div align="center"><img src="assets/demo.gif" alt="Cloi CLI Demo" /></div>

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
- **Customizable** – Ships with Phi-4. Swap between your locally installed Ollama models.
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

### Contributing

We welcome contributions from the community! By contributing to this project, you agree to the following guidelines:

- **Scope:** Contributions should align with the project's goals of providing a secure, local AI debugging assistant
- **License:** All contributions must be licensed under the GNU General Public License v3.0 (GPL-3.0)
- **Copyleft:** Any derivative works must also be distributed under the GPL-3.0 license

For more detailed information on contributing, please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file.

---

### Patches 

#### [1.0.6] - May 5th, 2025 @ 5:30pm PST
- **Feature:** Included new `phi4-reasoning:plus`,`qwen3`, and ALL your locally installed Ollama models into boxen `/model` for easy access.

<div align="center"><img src="assets/model.gif" alt="Cloi CLI Demo" width="600" /></div>

#### [1.0.5] - May 4th, 2025 @ 9:10pm PST

- **Bug Fix**: Resolved dependency issue in package.json
  - Updated Ollama dependency from deprecated version 0.1.1 to 0.5.15 which resolved ollama.chat API endpoints
  - Thank you [@kingkongfft](https://github.com/kingkongfft) and [@undecomposed](https://github.com/undecomposed) for alerting by submitting this issue. 

#### [1.0.2] - May 4th, 2025 @ 12:20pm PST

- **Feature:** Integrated [structured outputs](https://ollama.com/blog/structured-outputs) from Ollama's latest API
  - Creates more robust patches with JSON-based formatting
  - Falls back to traditional LLM calls if the structured API isn't available
- **Feature:** Implemented CLI model selection via `--model` flag
  - Specify your preferred Ollama model right from the command line
  - Credit to [@canadaduane](https://github.com/canadaduane) for the insightful suggestion!
- **UI Enhancement:** The `/model` command now displays ALL you locally installed Ollama models 
- **Refactor:** Internal architecture adjustments to maintain conceptual integrity
  - Migrated `history.js` to the utils directory where it semantically belongs
  - Repositioned `traceback.js` to core since it's foundational to the debugging pipeline
- **Improvements:** Purged lingering references to our project's original name "FigAI" and cleaned the CLI `--help` interface

