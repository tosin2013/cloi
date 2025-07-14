Below is the comprehensive architecture document for the Cloi project in markdown format:

```markdown
# Cloi Project Architecture Document

## Table of Contents
1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [Integration Points](#integration-points)
5. [Security Architecture](#security-architecture)
6. [Extension Points](#extension-points)

---

## 1. System Overview

**Cloi** is a Node.js-based Command-Line Interface (CLI) tool that works in tandem with Python Machine Learning (ML) services to analyze terminal errors in software development workflows and propose code fixes. The architecture leverages Retrieval-Augmented Generation (RAG) workflows, employing CodeBERT embeddings to enhance retrieval processes for relevant context and solutions. The system supports both local Language Models (LLMs) like **Ollama** and cloud-based models such as **Claude** for code generation.

### High-Level Architecture Diagram
```plaintext
+---------------------------------------------------------------+
|                         Cloi CLI Interface                    |
|    (Handles user interaction and workflow execution)          |
+---------------------------------------------------------------+
        |                          |                        |
+----------------------+  +-------------------+  +-----------------------+
| Core Modules         |  | Protocols        |  | Third-Party Services  |
| (Central Logic)      |  | (Communication)  |  | (Ollama, Claude, etc.)|
+----------------------+  +-------------------+  +-----------------------+
        |                          |                        |
    +------------------------+       +-----------------+          +-----------+
    | Plugin Manager         |<->    | A2A Protocol    |<-------->| LLM APIs   |
    | (Extendable Modules)   |        | Layer (Local)  |          | (REST, WS) |
    +------------------------+        +-----------------+          +-----------+
```

The **core** is powered by RAG for retrieving contextualized fixes, while the **protocols** layer abstracts connectivity between the CLI and external APIs. The system is built with extensibility in mind.

---

## 2. Component Architecture

The system consists of modular components designed for specific roles. Below is an outline of key modules:

### CLI Layer
- Entry point for user interaction (`src/cli/index.js`).
- Features modular CLI workflows using `yargs` for argument parsing.
- Backup and compatibility support provided in `legacy-backup`.

### Core Layer
- **Tool Discovery**: Scans the environment (`src/core/tool-discovery/index.js`).
- **RAG Engine**: Implements Retrieval-Augmented Generation logic (`src/core/rag.js`).
- **Workflow Engine**: Executes workflows (`src/core/workflow-engine/index.js`).
- **Plugin Manager**: Interfaces for extensions (`src/core/plugin-manager/index.js`).

### Protocols
- Implements **Agent-to-Agent (A2A)** communication.
- Local HTTP server (`src/protocols/a2a/http-server.js`) enables external tool integrations.
- `universal-client.js` centralizes API interactions.

### User Interface Components
- Terminal-based UI (`src/ui/terminalUI.js`) built with `chalk` and `boxen` for dynamic visuals.
- Cognitive delay emulation (`thinking.js`) for asynchronous responses.

---

## 3. Data Flow

Data flow in Cloi primarily revolves around ingesting terminal errors and processing them through RAG mechanisms for solution retrieval. Below is the data flow pipeline:

1. **Error Ingestion**:
   - Terminal errors are captured and passed to the CLI as input.
   - Pre-processed using `glob` and `ajv` to normalize data.

2. **RAG Processing**:
   - **Retrieval**: The RAG module uses CodeBERT to generate embeddings and query relevant context from a local **FAISS** index.
   - **Augmentation**: Retrieved data is enriched with external database/API content.

3. **LLM Interaction**:
   - Local (Ollama) or cloud (Claude) LLMs are queried with the augmented input.
   - Responses are returned via the A2A `universal-client.js` to the CLI.

4. **Output Delivery**:
   - Fix suggestions are displayed via the **Terminal UI** for user confirmation.

### Data Flow Diagram
```plaintext
User Input --> CLI --> Core (RAG Engine) --> ML Services (Ollama/Claude) --> CLI Response
```

---

## 4. Integration Points

Cloi integrates with several external services to obtain and process results:

1. **Ollama (Local LLM)**:
   - Provides on-device code generation.
   - Integration via `ollama` npm package.

2. **Claude (Cloud LLM)**:
   - Cloud-based model for advanced reasoning.
   - Accessed through `@anthropic-ai/sdk`.

3. **CodeBERT (Embeddings)**:
   - Hugging Face Transformers library (`@huggingface/transformers`) used for embedding generation.

4. **FAISS (Vector Search)**:
   - Local index served via `faiss-node` for real-time retrieval during RAG.

Key protocols include REST API requests and WebSocket communication via `ws` for high-performance interactions.

---

## 5. Security Architecture

Security is paramount in Cloi to protect data and access to external services:

### Authentication
- **API Keys** for external LLMs (Claude, Ollama) are securely loaded via environment variables using `dotenv`.
- Local HTTP server enforces CORS policies using `cors`.

### Data Validation
- Inputs to the system are validated with `ajv` (JSON Schema validation).

### Sandboxing
- Terminal inputs are sanitized to prevent code injection attacks.
- Temporary files and logs are sandboxed within OS-specific directories.

### Secure Communication
- HTTPS and WebSocket (WSS) protocols are used to secure communication with cloud endpoints.

---

## 6. Extension Points

The Cloi project is built with extensibility in mind, allowing developers to add or modify functionality effortlessly.

### Plugin Manager
The Plugin Manager (`src/core/plugin-manager/index.js`) serves as the central hub for:
- Adding new modules or tools via `interfaces.js`.
- Customizing workflows through the Workflow Engine API.

### Local HTTP Server
Exposes RESTful endpoints (`src/protocols/a2a/http-server.js`) where:
- New AI services can be added for integration.
- Developers can test locally without modifying core logic.

### Embedding Replacement
Developers can swap CodeBERT with other embedding models by:
- Modifying `@huggingface/transformers` calls in `src/core/rag.js`.

### File Structure Flexibility
Developers can extend the CLI by adding new files/modules within the `src/cli` directory. Examples include:
- Custom commands in `modular.js`.
- Enhanced UI elements in `terminalUI.js`.

---

## Conclusion

Cloi is a robust and extensible CLI tool designed to process terminal errors and suggest fixes using cutting-edge ML models. Its modular architecture, secure communication, and well-defined extension points make it ideal for iterative development and integration into modern software workflows.
```
