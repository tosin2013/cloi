# Cloi Project - Software Architecture Document

## 1. System Overview

**Cloi** is a Node.js-based Command Line Interface (CLI) tool augmented by Python-based Machine Learning (ML) services. Cloi's primary purpose is to process and fix terminal errors automatically via a Retrieval-Augmented Generation (RAG) mechanism utilizing CodeBERT embeddings. The system provides intelligent and contextual responses through the orchestration of both local and cloud-based LLMs, including **Ollama** for local inference and **Claude** for cloud-based capabilities. 

The system's architecture is modular, extensible, and built around clear separation of concerns. It integrates external services and libraries to provide robust ML-driven code analysis and fixing while ensuring smooth data flow, security, and developer customization opportunities.

---

## 2. Component Architecture

Cloi is designed with a modular architecture, breaking functionality into logical components:

- **CLI Interface**: User-facing command line interaction layer.
  - _Key files_: `src/cli/index.js`, `src/cli/modular.js`
  - Responsibilities: Command parsing, input validation, output formatting, and invoking core workflows.

- **Core Engine**: The heart of the system that manages workflows, tools, plugins, and error handling.
  - _Key files_: 
    - `src/core/index.js`
    - `src/core/rag.js` (RAG orchestration)
    - `src/core/workflow-engine/index.js` (execution of error-fixing workflows)
    - `src/core/plugin-manager/index.js` (dynamic plugin management)
    - `src/core/tool-discovery/index.js` (detects available tools for the error context)
    - `src/core/coordinator/index.js` (orchestrates modules and manages task coordination)

- **Protocol Adapters**: Handles interactions with external APIs and local services.
  - _Key files_: 
    - `src/protocols/a2a/index.js` (protocol layer)
    - `src/protocols/a2a/setup-ai-integration.js` (LLM integration setup)
    - `src/protocols/a2a/universal-client.js` (provides an abstraction over LLMs)
    - `src/protocols/a2a/http-server.js` (serves as a backend server proxy for nested workflows)

- **User Interface**: Terminal-based UI for displaying results and thinking progress.
  - _Key files_: 
    - `src/ui/terminalUI.js`
    - `src/core/ui/thinking.js`

- **Legacy Backup**: Supports backward compatibility for older workflows.
  - _Key files_: `src/cli/legacy-backup/*`

---

## 3. Data Flow

**Step-by-step Data Flow**:

1. **Input Capture**: User commands/errors are parsed by the CLI interface and routed for processing.
   - `src/cli/index.js` → `src/core/coordinator/index.js`

2. **RAG Workflow**:
   - Executes retrieval-augmented generation using `faiss-node` to vectorize input and query repositories of potential solutions via CodeBERT.
   - `src/core/rag.js` → Handles embeddings and retrieval.
   - Uses **external LLMs** where applicable through protocol integrations (`OLLAMA` locally/`Claude` over cloud).

3. **Error Context Analysis**:
   - Invokes `src/core/tool-discovery/index.js` to identify compatible tools/plugins for the specific input context, ensuring contextual code fixes.

4. **Workflow Execution**:
   - The core workflow engine (`src/core/workflow-engine/index.js`) orchestrates error resolution steps using plugins and external tools.
   - Plugins interact through standardized interfaces defined in `src/core/plugin-manager/interfaces.js`.

5. **Output Generation**:
   - Results of fixes are sent back to the CLI layer for user display (`src/ui/terminalUI.js`).

---

## 4. Integration Points

Cloi relies on external libraries and services for its advanced features:

### **Local Integration**
- **Ollama**: Provides inference capabilities for local machine learning models.
  - Integration via `ollama` package and `src/protocols/a2a/setup-ai-integration.js`.

### **Cloud Integration**
- **Claude**: A powerful cloud-based conversational LLM for more complex tasks and computationally expensive fixes.
  - Integration via `@anthropic-ai/sdk`.

### **ML Embedding and Retrieval**
- **CodeBERT**: Used to generate embeddings for code contexts and facilitate RAG workflows.
  - Integration via the `@huggingface/transformers` library.
  - Embedding storage and query is handled using `faiss-node`.

### **Other Notable Libraries**
- **Express**: For running lightweight APIs in `src/protocols/a2a/http-server.js`.
- **ajv**: Schema validation for plugin configurations.
- **lodash-es**, **glob**, **yargs**, and **boxen** for CLI utility and structural enhancements.

---

## 5. Security Architecture

Cloi incorporates multiple layers of security to ensure robust and safe functioning:

1. **Data Validation**:
   - `ajv` is used extensively to validate incoming user input, plugin configurations, and system interactions.

2. **Local-First Workflow**:
   - Preference for **Ollama** ensures sensitive code snippets are processed on the user’s local machine whenever possible, minimizing exposure.

3. **Secure API Communication**:
   - All cloud interactions with **Claude** or other APIs are encrypted using secure protocols (HTTPS).
   - API keys/secrets are managed securely via environment variables.

4. **Plugin Sandboxing**:
   - Plugins are isolated and operate within a restricted execution context to prevent unauthorized system changes or malicious behavior.

5. **Audit Logging**:
   - System actions and LLM queries are logged in an audit trail for debugging and monitoring.

---

## 6. Extension Points

Cloi is built to be flexible and extensible, enabling developers to add new tools, plugins, or workflows without modifying the core system.

### **Plugin System**
- Developers can create custom plugins through clearly defined `src/core/plugin-manager/interfaces.js`.
- Example Workflow Plugin Structure:
  ```js
  module.exports = {
    id: 'my-custom-plugin',
    setup: (config) => { /* Plugin initialization logic */ },
    execute: async (context) => { /* Execution logic for processing input */ }
  }
  ```

### **Tool Discovery**
- New tools can be added with metadata for the discovery engine in `src/core/tool-discovery/index.js`.

### **Custom Workflows**
- Define workflows by extending the `WorkflowCoordinator` in `src/core/coordinator/index.js`.

### **UI Enhancements**
- Modify or replace terminal UI components via `src/ui/terminalUI.js` or `src/core/ui/thinking.js`.

---

## 7. File Structure Summary

Here's an overview of the critical file organization:

```
src/
├── ui/
│   ├── terminalUI.js
├── cli/
│   ├── index.js
│   ├── modular.js
├── protocols/a2a/
│   ├── setup-ai-integration.js
│   ├── http-server.js
│   ├── universal-client.js
├── core/
│   ├── rag.js
│   ├── tool-discovery/
│   ├── plugin-manager/
│   ├── coordinator/
│   ├── workflow-engine/
│   ├── workflow-rollback/
```

---

This document serves as a comprehensive guide for understanding the architecture and design of the Cloi project. For implementation details, refer to specific code components.
