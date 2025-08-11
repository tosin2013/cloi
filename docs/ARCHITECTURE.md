```markdown
# Cloi Project Architecture Document

## **1. System Overview**
Cloi is a Node.js-based Command-Line Interface (CLI) tool augmented with Python-based Machine Learning (ML) services. It leverages Retrieval Augmented Generation (RAG) with CodeBERT embeddings to process terminal errors, classify issues, and apply code fixes intelligently.

The system integrates local and cloud-based language models (LLMs), such as Ollama (local execution) and Claude (Anthropic's API), to provide flexibility, scalability, and high-performance issue-resolution capabilities. Cloi's modular design and extensibility make it suitable for developers to troubleshoot and debug in real-time.

### High-Level Architecture:
- **Frontend**: CLI-based interface for user interaction
- **Backend**: Core logic, ML services, and state management
- **Integration**: Local (Ollama) and Cloud (Claude) LLMs via plugins
- **Data Layer**: Handles embeddings (CodeBERT) and uses Faiss for scalable vector search.

---

## **2. Component Architecture**
Cloi is composed of multiple loosely-coupled modules organized systematically. Below is a breakdown of the primary components and their responsibilities:

### Core Components:
1. **Plugin Manager (`src/core/plugin-manager`)**:
   - Handles dynamic plugin loading and management
   - Provides interfaces for extending functionality via custom plugins

2. **Environment Context (`src/core/environment-context`)**:
   - Fetches and provides runtime context such as terminal environment metadata

3. **Coordinator (`src/core/coordinator`)**:
   - Orchestrates workflows ensuring task delegation across components

4. **Workflow Engine & Rollbacks (`src/core/workflow-engine` / `src/core/workflow-rollback`)**:
   - Manages multi-step code-fix workflows
   - Supports rollback actions for error correction

5. **Executor (`src/core/executor`)**:
   - Connects to LLMs such as Ollama and Claude
   - Routes tasks to the appropriate execution engine based on the context

6. **RAG (`src/core/rag`)**:
   - Implements Retrieval Augmented Generation using CodeBERT embeddings
   - Faiss is utilized to efficiently retrieve relevant context from stored data

7. **State Manager (`src/core/state-manager`)**:
   - Stores and tracks session states of workflows and fixes

8. **Cloi Agent (`src/core/cloi-agent`)**:
   - Implements the core intelligence to deduce problems and recommend solutions

9. **Prompt Templates (`/src/core/promptTemplates`)**:
   - Predefined templates for LLM interactions (e.g., classify, patch)

10. **UI (`src/core/ui`)**:
    - Handles UI elements like "thinking" states and animations in the CLI

11. **Tool Executor (`src/core/tool-executor`)**:
    - Abstracts execution of external tools triggered within workflows

---

## **3. Data Flow**

1. **User Input (CLI)**:
   - User provides input via the terminal (e.g., error logs).
   
2. **Environment Data Collection**:
   - Environment Context module gathers metadata.

3. **Classification**:
   - Input is vectorized using CodeBERT embeddings and classified by RAG.

4. **Workflow Execution**:
   - Workflows orchestrated by the `Coordinator` trigger LLM requests to Ollama or Claude.

5. **LLM Communication**:
   - The `Executor` handles communication with local (Ollama) or cloud (Claude) models using prompts.

6. **Code Fixing**:
   - The result from the LLM is processed into actionable outputs and applied via workflows.

7. **User Feedback**:
   - Results are displayed to the CLI and the system state is updated in the `State Manager`.

---

## **4. Integration Points**

### **1. Ollama (Local LLM)**
- **Module**: `src/core/executor/ollama.js`
- Local lightweight inference on machines.

### **2. Claude (Cloud LLM from Anthropic)**
- **Module**: `src/core/executor/claude.js`
- Cloud-based integration via `@anthropic-ai/sdk`.

### **3. CodeBERT (Embeddings)**
- **Dependency**: `@huggingface/transformers`
- Embeddings are processed for query classification and relevant context retrieval.

---

## **5. Security Architecture**

### **Secure Data Handling**:
- Sensitive data (e.g., API keys) is managed via environment variables.
- Dependencies like `dotenv` can also be used for secure configuration loading.

### **Input Validation**:
- All user-provided inputs undergo schema validation using **`ajv`** (JSON schema validation).

### **Secure Integrations**:
- Claude integration via **`@anthropic-ai/sdk`** ensures secure and authenticated API usage.
- Communication with external APIs uses HTTPS.

### **Isolation of Python Services**:
- The Node.js services communicate with Python ML libraries in isolated processes, reducing the attack surface.

### **Error Logging**:
- Using secure logging practices with redacted sensitive information via plugins.

---

## **6. Extension Points**

Cloi is designed to be extensible and developer-friendly. Developers can extend the system in the following ways:

### **1. Plugins**:
- **Location**: `src/core/plugin-manager`
- Cloi supports dynamically-loadable plugins.
- Developers can implement new functionality and load it at runtime.

### **2. Executors**:
- **Location**: `src/core/executor`
- Integrate additional LLMs or tools by adhering to the executor interface.

### **3. Prompt Templates**:
- **Location**: `src/core/promptTemplates`
- Developers can extend or override predefined prompt templates for specific use-cases.

### **4. Workflows**:
- **Location**: `src/core/workflow-engine`
- Extend workflows by adding new sequences or integrating additional rollback mechanisms.

### **5. Tools**:
- **Location**: `src/core/tool-executor`
- Developers can register new tools to execute external programs required in custom workflows.

---

## **7. Dependencies**

Below is the list of dependencies Cloi leverages to enhance functionality:

- `@anthropic-ai/sdk`: Integration with Claude (cloud-based LLM).
- `@huggingface/transformers`: For processing CodeBERT embeddings.
- `ajv`: For input schema validation.
- `boxen`: Aesthetic CLI notifications.
- `chalk`: Rich text formatting in CLI.
- `cors`: Enables cross-origin functionality for debugging.
- `express`: Lightweight local server framework.
- `faiss-node`: For efficient similarity searches (RAG).
- `glob`: For file pattern matching.
- `js-yaml`: YAML configuration parsing.
- `lodash-es`: Utility library for improving functionality.
- `node-cron`: Scheduling workflows (e.g., periodic updates).
- `ollama`: Integration with Ollama LLM.
- `seedrandom`: Ensures deterministic random seeds.
- `uuid`: UUID generation for session and workflow tracking.
- `ws`: WebSocket facilitation.
- `yargs`: Command-line argument parsing.

---

This architecture documentation provides insights into the system’s design and enables seamless collaboration for developers and system architects working on the Cloi project.
```
