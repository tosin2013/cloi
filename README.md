# <div align="center">Cloi CLI (beta preview)</div>

<div align="center">Local debugging agent that runs in your terminal</div>

<br>

<div align="center"><img src="demo.gif" alt="Cloi CLI Demo" /></div>

## Overview

Cloi is a local, context-aware agent designed to streamline your debugging process. Operating entirely on your machine, it ensures that your code and data remain private and secure. With your permission, cloi can analyze errors and apply fixes directly to your codebase.

**Disclaimer:** Cloi is an experimental project under beta development. It may contain bugs, and we recommend reviewing all changes before accepting agentic suggestions. That said, help us improve Cloi by filing issues or submitting PRs, see down below for more info.

## Installation

Install globaly: 

```bash
npm install -g @cloi-ai/cloi
```

**No API key needed, runs completely locally.**

Navigate to your project directory and call cloi when you run into an error.

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

- **Local-first & Private** – All LLM calls run through Ollama on *your* machine. Your source code and command history never leave your laptop and no API key is required.
- **Agentic Debugging Loop** – Invoke `/debug` to let Cloi run the failing command, analyze the traceback, and iteratively propose terminal fixes *or* code patches until the error disappears.
- **Safe by Design** – Every code change is surfaced as a unified diff. You decide whether to apply it or roll it back.
- **Lightweight Models** – Ships with the Phi-4 model for fast, offline reasoning. Swap in any other Ollama model when you need extra horsepower.
- **Open Source & Extensible** – Written in Node.js/ESM with a modular architecture (LLM, UI, patch pipeline). Fork it, add your own commands, and help shape the future of local AI debugging.

### System Requirements

<table>
<tr>
  <td><b>🖥️ Hardware</b></td>
  <td>
    • <b>Memory:</b> 8GB RAM minimum (16GB+ recommended)<br>
    • <b>Storage:</b> 10GB+ free space (Phi-4 model: ~9.1GB)<br>
    • <b>Processor:</b> Multi-core CPU (M1/M2/M3/Intel i5+ recommended)
  </td>
</tr>
<tr>
  <td><b>💻 Software</b></td>
  <td>
    • <b>OS:</b> macOS (Big Sur 11.0+), Linux and Windows (limited testing)<br>
    • <b>Runtime:</b> Node.js 14+ and Python 3.6+<br>
    • <b>Dependencies:</b> Ollama (automatically installed if needed)
  </td>
</tr>
</table>

### Beta Features

> **Beta Feature Notice:** The `/debug` command is currently in beta. While it can automatically apply fixes to your code, we strongly recommend:
> - Reviewing all suggested changes before accepting them
> - Testing the changes in a development environment first
> - Keeping backups of your code before using automated fixes

### Contributing

We welcome contributions from the community! By contributing to this project, you agree to the following guidelines:

- **Scope:** Contributions should align with the project's goals of providing a secure, local AI debugging assistant
- **Non-Commercial Use:** All contributions must adhere to the CC BY-NC 4.0 license
- **Attribution:** Please ensure proper attribution for any third-party work
- **Code of Conduct:** Be respectful and considerate in all interactions

### How to Contribute
1. Fork the Repository
2. Create a Branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make Changes: Implement your changes with clear commit messages
4. Push to Your Fork:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Submit a Pull Request
6. Review Process: Your PR will be reviewed, and feedback may be provided

For more detailed information on contributing, please refer to the CONTRIBUTING.md file.
