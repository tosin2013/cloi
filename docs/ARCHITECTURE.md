# Cloi Project Architecture Documentation

## 1. System Overview

Cloi is a Node.js Command-Line Interface (CLI) tool designed to analyze terminal errors and automatically suggest or apply code fixes using Machine Learning (ML). It employs Retrieval Augmented Generation (RAG), integrating local and cloud-based Large Language Models (LLMs) to process contextual embeddings generated through CodeBERT. Cloi operates as a hybrid system where a Node.js CLI tool interacts with Python-based ML services for high-performance AI workloads.

The architecture is modular, extensible, and integrates various external services (Ollama and Claude for LLMs, CodeBERT for embeddings), enabling efficient debugging and issue resolution in diverse development environments.

---

## 2. Component Architecture

Cloi's system is composed of several interrelated modules. Key functional areas include:

### **CLI** 
The Command-Line Interface is the user's entry point to Cloi. It provides various commands and UI elements to process errors.  
- **Primary Modules**: `index.js`, `modular.js`, `legacy-backup`, `terminalUI.js`

### **Protocol Layer (A2A)** 
Handles communication between local services, Python-based ML systems, and external APIs.  
- **Primary Modules**: `setup-ai-integration.js`, `http-server.js`, `universal-client.js`

### **Core** 
The core layer powers Cloi's logic, decision-making, and workflow coordination.
- **RAG Engine**: Implements Retrieval Augmented Generation using Faiss and CodeBERT.
- **Tool Discovery**: Dynamically identifies and integrates debugging tools.
- **Workflow Engine**: Coordinates multi-step workflows for error resolution.
- **Plugin Manager**: Manages extensions and third-party integrations.

### **ML Services** 
Python services host machine learning models (e.g., CodeBERT for embeddings) and RAG implementations.

---

## 3. Data Flow

1. **Error Analysis**:
   - Terminal errors are ingested via CLI commands.
   - `core/workflow-engine` triggers workflows to process incoming errors.

2. **Code Embedding**:
   - Source code and error text are transformed into embeddings using CodeBERT (via RAG).

3. **LLM Query**:
   - Based on embedding data, prompts are sent to either **Ollama** (local LLM) or **Claude** (cloud LLM) for code-fix suggestions. The **protocols/a2a** layer facilitates LLM integration.

4. **Result Processing**:
   - Suggested fixes from LLMs are displayed via the terminal UI (`src/core/ui`).
   - If approved by the developer, fixes are applied to the codebase.

5. **Feedback Loop**:
   - LLM responses and developer actions are stored to improve model performance.

---

## 4. Integration Points

Cloi relies on the following external services:

### **Local LLM (Ollama)** 
- Embedded LLM model hosted locally for low-latency inference.
- Integrated through the `ollama` NPM package.

### **Cloud LLM (Claude)** 
- Cloud-based inference powered by Anthropic Claude models.
- Integrated via the `@anthropic-ai/sdk`.

### **Code Embedding (CodeBERT)** 
- Generates embeddings for contextual document retrieval.
- Integrated via `faiss-node` and underlying Python services.

---

## 5. Security Architecture

Cloi is designed with multiple layers of security to ensure integrity and privacy:

1. **Transport Encryption**:
   - The **protocol layer (A2A)** uses HTTPS and WebSocket Secure (WSS) for all communications between the CLI, local Python services, and external APIs.

2. **Sandboxing for Fix Application**:
   - Suggested fixes are applied in an isolated, temporary directory for developer review before merging into the actual codebase.

3. **Authentication**:
   - LLM APIs like Claude and Ollama require API keys securely stored in encrypted settings files.

4. **Data Privacy**:
   - User code and logs are only transmitted to cloud services with explicit consent to ensure compliance with data privacy standards.

5. **Input Validation**:
   - Utilizes `ajv` for strict JSON schema validation of inputs/outputs across all modules.

6. **Rate Limiting**:
   - Limits outgoing API requests to prevent abuse.

---

## 6. Extension Points

Cloi's extensible architecture enables developers to add custom functionality:

### **Plugin System**:
Developers can create plugins through the **core/plugin-manager** interface. Plugins can:
   - Hook into workflows.
   - Customize data pipelines.
   - Add new CLI commands.

### **Custom AI Models**:
Additional LLMs or embedding models can be integrated by extending the **protocols/a2a** layer with new clients.

### **Workflow Customization**:
The **core/workflow-engine** supports the addition of new workflows. These can manage custom error-processing pipelines.

### **Tool Discovery**:
Developers can inject support for new external tools by augmenting configurations in the **core/tool-discovery** module.

---

## File Structure (Key Locations)

```plaintext
src/
├── cli/
│   ├── index.js            # CLI entrypoint
│   ├── modular.js          # Modular commands implementation
│   └── legacy-backup/      # Legacy CLI commands
├── protocols/
│   ├── a2a/                # Protocol layer for API and LLM integration
│   │   ├── setup-ai-integration.js
│   │   ├── http-server.js
│   └── universal-client.js
├── core/
│   ├── rag.js              # RAG implementation using CodeBERT and Faiss
│   ├── workflow-engine/    # Workflow management
│   ├── plugin-manager/     # Dynamically loadable plugin system
│   └── tool-discovery/     # Auto-discovery for debugging tools
└── ui/
    └── terminalUI.js       # Terminal-based user interface
```

---

## Dependencies

The following dependencies are essential for Cloi's operation:

| Dependency                      | Purpose                                      |
|----------------------------------|----------------------------------------------|
| `@anthropic-ai/sdk`             | Cloud-based LLM integration (Claude)         |
| `@huggingface/transformers`     | Model management for ML tasks                |
| `ajv`                           | Input/output validation with JSON schemas    |
| `boxen`                         | Styled terminal output                       |
| `chalk`                         | Terminal string styling                      |
| `cors`                          | Middleware for cross-origin resource sharing |
| `express`                       | HTTP server                                  |
| `faiss-node`                    | Efficient similarity searches for embeddings |
| `glob`                          | File pattern matching                        |
| `js-yaml`                       | YAML processing                              |
| `lodash-es`                     | Utility functions                            |
| `node-cron`                     | Scheduled periodic workflows                 |
| `ollama`                        | Local inference with Ollama LLM              |
| `seedrandom`                    | Deterministic testing                        |
| `uuid`                          | ID generation                                |
| `ws`                            | WebSocket-based communication                |
| `yargs`                         | CLI command-line argument parsing            |

--- 

**End of Documentation**
