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

### High-level Architecture
Cloi is a Node.js-based Command Line Interface (CLI) tool augmented by ML services implemented in Python. It leverages Retrieval-Augmented Generation (RAG) techniques utilizing CodeBERT embeddings to analyze terminal errors and apply intelligent code fixes. Cloi supports both local and cloud large language models (LLMs) and integrates with two primary outputs: **Ollama** for local LLM execution and **Claude** for cloud-based model inference.

#### Key Features:
- Terminal error analysis and automated solutions.
- Local and cloud-based LLM support for versatile usage.
- Retrieval Augmented Generation (RAG) for code-context-aware suggestions.
- Modular architecture with extension capabilities.

---

## 2. Component Architecture

### Core Modules
Below is the list of all major components and their roles:

1. **Core Coordinators:**
   - `src/core/coordinator/index.js`: Orchestrates the execution of workflows and integration between components.

2. **RAG System:**
   - `src/core/rag.js`: Implements Retrieval Augmented Generation leveraging FAISS for similarity search and CodeBERT embeddings for representation.

3. **Executors:**
   - `src/core/executor/ollama.js`: Facilitates communication with the Ollama (local LLM) endpoint.
   - `src/core/executor/claude.js`: Bridges operations with Claude (cloud LLM).
   - `src/core/executor/router.js`: Routes queries to either local or cloud services based on the environment and user configuration.

4. **State Management:**
   - `src/core/state-manager/index.js`: Maintains the system’s state, including workflow progress, errors, and fixes.

5. **Plugin System:**
   - `src/core/plugin-manager`: Dynamically loads and manages developer-contributed plugins and hooks.

6. **ML Agent Implementations:**
   - `src/core/cloi-agent/implementations.js`: Defines ML-based agents for specific tasks such as error analysis and patch generation.

7. **Environment Context:**
   - `src/core/environment-context/index.js`: Manages contextual data relevant to the user's environment.

8. **Workflow Engine:**
   - `src/core/workflow-engine/index.js`: Drives workflows like error resolution or rollback procedures.

9. **UI Enhancements:**
   - `src/core/ui/thinking.js`: A user-friendly UI element showing progress or “thinking” animations.

10. **Prompt Templates:**
   - Located under `/src/core/promptTemplates/`: Predefined templates for various LLM prompts (e.g., Analyze, Command, Classify, Patch).

### Module Interaction
Modules are designed to interact via well-defined interfaces. For example:
- The `plugin-manager` communicates through abstraction layers in `interfaces.js`.
- Executors (e.g., `ollama.js` and `claude.js`) share data with the `rag` module through coordinator APIs.

---

## 3. Data Flow

### Data Flow Lifecycle
1. **Input Capture:**
   - User input (e.g., terminal error) is captured via CLI using `yargs`.

2. **Context Gathering:**
   - `environment-context` retrieves system information, file structure, and related data.
   - This data is passed to the `rag` module for relevant context retrieval.

3. **Embedding Generation:**
   - The RAG system leverages CodeBERT to generate embeddings for the collected context and queries FAISS for similarity search.

4. **LLM Execution:**
   - The `executor/router.js` determines whether to route requests to `ollama.js` (local) or `claude.js` (cloud).
   - The LLM processes the query and returns its response.

5. **Patch Generation:**
   - Prompt templates from `/src/core/promptTemplates/` (e.g., `patch.js`) structure the response into actionable code fixes.

6. **Output Delivery:**
   - The processed result is passed through the UI handler (`thinking.js`) for user-friendly visualization and delivered to the CLI.

---

## 4. Integration Points

### External Services
1. **Ollama (Local LLM):**
   - Used for resource-constrained environments.
   - Integration via `@ollama` Node.js SDK.

2. **Claude (Cloud-based LLM):**
   - Opted for its advanced reasoning capabilities.
   - Integration via `@anthropic-ai/sdk`.

3. **CodeBERT (Embedding Engine):**
   - Used for code context generation in RAG.
   - Integrated via `@huggingface/transformers`.

---

## 5. Security Architecture

### Security Principles
1. **Authentication and Authorization:**
   - External service credentials (Ollama and Claude) are securely stored in environment variables and accessed only via `config-manager`.

2. **Data Privacy:**
   - Sensitive data related to user code and error logs are not stored persistently. Transmitted data are encrypted.

3. **Input Validation:**
   - All user-supplied inputs are validated using `ajv` (schematic validation) to prevent injection attacks and malformed data.

4. **Transport Layer Security:**
   - All communication with cloud services uses TLS (HTTPS).

5. **Sandboxing:**
   - The execution environment for plugins is sandboxed to restrict access to sensitive file systems.

6. **Audit Logging:**
   - Actions and transactions are logged for auditing using UUID for user traceability.

---

## 6. Extension Points

### Developer Extension Tools
Cloi exposes several extension points, enabling developers to add custom functionality:
1. **Plugin Manager (`plugin-manager`):**
   - Developers can contribute plugins by adhering to defined API contracts in `interfaces.js`.

2. **Custom Executors:**
   - New LLMs or computational backends can be added by extending the executor framework and registering them with the router.

3. **Prompt Templates:**
   - Developers can define and add new templates for specific tasks in `src/core/promptTemplates/`.

4. **Workflow Engine Hooks:**
   - Hooks are supported in `workflow-engine/index.js` for inserting custom logic into predefined workflows.

5. **Command-Line Options:**
   - Add new arguments or flags to the CLI tool by modifying `yargs` configuration.

---

## File Structure Reference
The following is a sample file structure for Cloi:
```
src/
├── core/
│   ├── cloi-agent/
│   │   └── implementations.js
│   ├── config-manager/
│   │   └── index.js
│   ├── coordinator/
│   │   └── index.js
│   ├── environment-context/
│   │   └── index.js
│   ├── executor/
│   │   ├── claude.js
│   │   ├── ollama.js
│   │   └── router.js
│   ├── plugin-manager/
│   │   ├── index.js
│   │   └── interfaces.js
│   ├── rag.js
│   ├── state-manager/
│   │   └── index.js
│   ├── ui/
│   │   └── thinking.js
│   ├── workflow-engine/
│   │   └── index.js
│   ├── workflow-rollback/
│   │   └── index.js
│   ├── promptTemplates/
│   │   ├── analyze.js
│   │   ├── classify.js
│   │   ├── command.js
│   │   └── patch.js
│   └── index.js
```

---

## Acknowledgments
Dependencies used in the project include:
- `@anthropic-ai/sdk`
- `@huggingface/transformers`
- `ajv`
- `boxen`
- `chalk`
- `cors`
- `express`
- `faiss-node`
- `glob`
- `js-yaml`
- `lodash-es`
- `node-cron`
- `ollama`
- `seedrandom`
- `uuid`
- `ws`
- `yargs`
```
