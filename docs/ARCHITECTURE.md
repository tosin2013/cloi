# Cloi Project Architecture Document

---

## 1. System Overview

**Cloi** is a Node.js-based Command Line Interface (CLI) tool with integrated Python machine learning (ML) services. It leverages **Retrieval Augmented Generation (RAG)** powered by CodeBERT embeddings to perform effective analysis and generation tasks for code. The primary function of Cloi is to process terminal errors, diagnose issues, and propose or apply code fixes.

The system integrates both **local LLMs** (Ollama) for offline functionality and **cloud-based LLMs** (Claude) for enhanced capabilities. By enabling a seamless data flow between retrieval, processing, and generation engines, Cloi aids developers in debugging and optimizing their code efficiently.

---

## 2. Component Architecture

The system is modular, divided into key components that interact through well-defined interfaces. Below is an overview of major modules and their responsibilities:

### Core Components:
- **Plugin Manager**: Handles dynamic plugins and external integrations (`src/core/plugin-manager`).
- **Executor**: Executes local (Ollama) and cloud-based (Claude) LLM calls (`src/core/executor`).
- **RAG Module**: Implements Retrieval-Augmented Generation for querying CodeBERT embeddings (`src/core/rag.js`).
- **Environment Context**: Resolves runtime environmental information for decision-making (`src/core/environment-context`).
- **State Manager**: Tracks system state and intermediate operation results (`src/core/state-manager`).
- **Cloi Agent**: Implements core functionalities using Coordinators and Executors (`src/core/cloi-agent/implementations.js`).
- **Workflow Engine**: Maps high-level user commands to executable workflows (`src/core/workflow-engine`).
- **Workflow Rollback**: Enables rollback of changes in workflows for safety (`src/core/workflow-rollback`).
- **UI Module**: Renders thoughtful CLI feedback, such as loading indicators (`src/core/ui/thinking.js`).
- **Prompt Templates**: Stores reusable prompt templates for LLM queries (`src/core/promptTemplates`).
- **Config Manager**: Manages system and user-provided configuration files (`src/core/config-manager/index.js`).

---

## 3. Data Flow

### Data Flow Lifecycle:

1. **Input**: The user provides input (e.g., terminal error, command) via the CLI.
2. **Preprocessing**:
    - The **Workflow Engine** parses the input and selects the appropriate workflow.
    - The **Environment Context** loads the runtime parameters.
3. **Data Retrieval**:
    - Via **RAG Module**, the system retrieves contextual code snippets using CodeBERT embeddings stored in a **Faiss Index**.
4. **LLM Execution**:
    - The **Executor** routes the request to either the local model (Ollama) or the cloud-based model (Claude) based on environmental factors.
    - LLMs process the query and return results (e.g., diagnosis or code fixes).
5. **Postprocessing**:
    - Results are evaluated in the **Cloi Agent** for actionable suggestions.
    - Results include classified errors, proposed fixes, or applied fixes.
6. **Output**: The **UI Module** renders the processed results back to the user.

---

## 4. Integration Points

Cloi interacts with various external services for model-based inference and embeddings:

### LLM Engines:
- **Ollama** (Local LLM):
  - Integrated via the `ollama` package.
  - Offline capability with reduced latency.
  - Used in environments disconnected from the internet.
- **Claude** (Cloud-based LLM):
  - Integrated using `@anthropic-ai/sdk`.
  - Cloud-powered model for more complex queries.

### Retrieval Module:
- **CodeBERT**:
  - Integrated via `@huggingface/transformers` and `faiss-node`.
  - Responsible for embedding generation and similarity-based code retrieval.

### Dependencies:
- Core packages include high-performance libraries such as `lodash-es`, `ajv` (schema validation), and `faiss-node` for indexing.

---

## 5. Security Architecture

Cloi incorporates multiple layers of security to protect user data and system functionality.

### Key Security Measures:
1. **Input Validation**:
   - Utilizes **AJV** for ensuring all user-provided inputs (e.g., CLI flags) conform to predefined schemas.

2. **Data Privacy**:
   - **Local Execution (via Ollama)** ensures no data is transmitted outside the host machine.
   - For **cloud execution (Claude)**, only minimal, anonymized context is sent.

3. **Environment Restrictions**:
   - Sensitive operations like applying code patches execute in a sandboxed environment to prevent harm.
   - Uses `Environment Context` to verify runtime safety.

4. **Communication Security**:
   - All communication with cloud services (e.g., Claude) happens over **secure HTTPS channels**.
   - Authentication keys are securely stored via environment variables.

5. **Audit Logging**:
   - Critical actions are logged by the **State Manager** for maintaining an audit trail.

6. **Rollback Capabilities**:
   - Provides a robust undo feature via the **Workflow Rollback** module to reverse unintended changes.

---

## 6. Extension Points

Cloi allows developers to extend its functionality through a well-defined plugin system and modular design.

### Plugin System:
- **Plugin Manager** (`src/core/plugin-manager`):
  - Dynamically loads external plugins at runtime.
  - Provides an interface for third-party developers to enhance or replace core functionalities.

### Custom LLM Executors:
Developers can add support for new local or cloud-based LLMs by implementing the **Executor Interface** in `src/core/executor/interfaces.js`.

### Custom Prompts:
- Developers can create additional prompt templates for LLM tasks by adding files to `src/core/promptTemplates/`.

### Workflow Extensions:
- Extend or customize workflows in `src/core/workflow-engine/` by defining new CLI commands or automations.

---

## Dependencies

The project's core dependencies are outlined below:

| Dependency                         | Purpose                                                                 |
|------------------------------------|-------------------------------------------------------------------------|
| `@anthropic-ai/sdk`                | Enables Claude integration for cloud-based LLM functionality.           |
| `ollama`                           | Supports local LLM inference and execution.                             |
| `@huggingface/transformers`        | Implements CodeBERT for embedding generation in RAG.                   |
| `faiss-node`                       | Provides high-performance similarity search for data retrieval.         |
| `ajv`                              | JSON schema validation for robust input handling.                       |
| `boxen`, `chalk`                   | Powers CLI aesthetics and feedback design.                              |
| `node-cron`                        | Schedules background tasks and periodic maintenance activities.         |
| `uuid`                             | Generates universally unique identifiers.                               |
| `lodash-es`, `glob`                | Utility libraries for functional programming and file matching.         |
| `cors`, `express`, `ws`            | Backbone libraries for server communication when needed.                |

---

This architecture document serves as a guide for engineers and contributors to understand, develop, and maintain the Cloi project effectively.
