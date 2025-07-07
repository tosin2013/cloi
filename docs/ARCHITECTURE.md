# Cloi Project Architecture Documentation

---

## 1. System Overview

### Overview
**Cloi** is a Node.js Command-Line Interface (CLI) tool that leverages Python-based Machine Learning (ML) services to process terminal errors and suggest or apply automated code fixes. At its core, Cloi uses Retrieval-Augmented Generation (RAG) with embeddings produced by **CodeBERT**, combined with a choice of local or cloud-based Large Language Models (LLMs) like **Ollama** and **Claude**.

The system is modular, designed for extensibility, and integrates multiple components to handle error analysis, RAG-powered code suggestions, and interaction with third-party services. Its focus is on improving developer workflows through intelligent error handling.

**Key Features:**
- **Error Processing**: Identifies terminal errors and retrieves relevant context.
- **Code Fix Suggestions**: Suggests solutions or applies fixes using LLMs.
- **Local and Cloud Operations**: Supports local operation via Ollama and cloud-based queries with Claude.
- **Modularity**: Clear separation of concerns for easy extension and maintenance.

---

## 2. Component Architecture

### High-Level Components and Interaction

1. **Core Modules**:
   - **CLI Interface**: The main entry point for user interaction (`yargs` for CLI argument parsing).
   - **Protocol Implementations**: Defines transport layers for communication between modules (e.g., `http-server.js`, `universal-client.js`).
   - **AI Integration**: Mediates between the Node.js component and Python-based ML models (`setup-ai-integration.js`).

2. **Plugins**:
   - **Quality Plugins**: Enforce code quality standards and apply fixes (e.g., `code-quality/index.js`).
   - **Integration Plugins**: Enable CI/CD, browser testing, and third-party provider integrations (e.g., `cicd/index.js`, `browser-testing/index.js`).
   - **Analyzer Plugins**: Analyze software repositories, environments, and documentation (e.g., `repository/index.js`, `documentation/index.js`).

3. **ML Services**:
   - **Embeddings Service**: Extracts code embeddings with `CodeBERT`.
   - **RAG Pipeline**: Implements Retrieval-Augmented Generation for context-aware code suggestions.
   - **LLM Service**: Handles model inference via adjustable backends (Ollama local models or Claude cloud models).

4. **External Services**:
   - **Ollama API**: Local LLM service for efficient on-device processing.
   - **Claude API**: Cloud-based LLM for advanced natural language and context processing.

5. **Common Utilities**:
   - Utilities for configuration, logging, scheduling tasks, and state management.

**Interaction Overview**

    CLI Interface → Error Processing → RAG Pipeline → External AI Services (Ollama/Claude)
                               ↑
    Plugins (Quality/Analyzers) → Context and Enrichment Data

---

## 3. Data Flow

1. **Input from Error**:
   - The user invokes Cloi on terminal errors by passing the error details via the CLI.

2. **Error Analysis**:
   - The error is processed, categorized, and enriched with contextual information using Analyzer Plugins.

3. **Contextual Data Retrieval**:
   - Relevant embeddings are retrieved using **CodeBERT** and `faiss-node` for similarity-based matches.

4. **Querying the LLM**:
   - Context and code embeddings are sent to either **Ollama** (local) or **Claude** (cloud).

5. **Output Generation**:
   - The response is parsed, suggestions are generated or automatically applied, and output is displayed back to the user via `chalk` and `boxen`.

**Diagram:**

```
[User CLI Input]
       ↓
[Error Processing Module]
       ↓
[Context Enrichment (Analyzers + Plugins)]
       ↓
[RAG Pipeline with CodeBERT]
       ↓
[LLM Query (Ollama/Claude)]
       ↓
[Response to User + Suggested Fixes]
```

---

## 4. Integration Points

### External Services
Cloi integrates with the following external services:

1. **Ollama**:
   - Local LLM backend for low-latency inference.
   - Ensures privacy and offline capability.
   - Integrated via the `ollama` npm package.

2. **Claude**:
   - Cloud-based LLM with higher computation capacity.
   - Paid service queried via the `@anthropic-ai/sdk` library.
   - Used for advanced error understanding and extended context.

3. **CodeBERT with FAISS**:
   - Retrieves similar code snippets or documentation for contextualizing LLM queries.
   - Provides embeddings through the `@huggingface/transformers` library and efficient retrieval using `faiss-node`.

---

## 5. Security Architecture

### Security Principles
Cloi is designed with security as a top priority, considering sensitive user workflows and third-party integrations.

#### Key Security Measures:
1. **Data Transmission Security**:
   - All communication with Claude (cloud-based) or external APIs is encrypted using HTTPS.

2. **Local Privacy**:
   - When using Ollama, data processing is performed entirely on the user’s local system to ensure data privacy.

3. **Input Validation**:
   - User inputs are validated using `ajv`, a JSON schema validation tool.
   - Prevents malicious inputs such as code injection attacks.

4. **Dependency Auditing**:
   - `npm audit` is implemented as part of the CI/CD pipeline for periodic security checks on project dependencies.

5. **Authentication Control**:
   - For external APIs like Claude, access tokens and credentials are securely managed via encrypted environment variables.

6. **Sandboxing**:
   - Plugins are sandboxed to prevent arbitrary code execution from less trusted extensions.

---

## 6. Extension Points

### Extensibility Design
Cloi is built with modularity and extensibility in mind, making it easy for developers to add new features or adapt the tool to their workflows.

### Key Extension Points:
1. **Plugins**:
   - Add new functionality by extending the **Plugins Directory**.
   - Example:
     - To add a new integration (e.g., a GitLab analyzer), create a folder under `src/plugins/integrations` and implement `index.js` and any necessary logic.

2. **Protocol Implementations**:
   - Developers can add new communication protocols for AI integration in `src/protocols/a2a`.

3. **Custom Embeddings**:
   - Replace or augment the CodeBERT embedding model by updating the RAG pipeline in `setup-ai-integration.js`.

4. **Middleware**:
   - Add middlewares to preprocess user inputs or post-process outputs.

5. **Configuration**:
   - Use configuration files (YAML or JSON) to add support for custom workflows or dependency injection from external systems.

---

## 7. File Structure Overview

```
src/
├── protocols/
│   ├── a2a/
│   │   ├── embedded-prompts.js
│   │   ├── http-server.js
│   │   ├── index.js
│   │   ├── setup-ai-integration.js
│   │   ├── universal-client.js
│   │   └── test.js
├── plugins/
│   ├── analyzers/
│   │   ├── environment/index.js
│   │   ├── repository/index.js
│   │   ├── documentation/index.js
│   │   └── ...
│   ├── quality/
│   │   ├── code-quality/index.js
│   │   └── ...
│   ├── integrations/
│   │   ├── browser-testing/index.js
│   │   ├── cicd/index.js
│   │   └── ...
│   ├── providers/
│   │   ├── mcp/index.js
│   │   ├── claude/index.js
│   │   └── ...
└── ...
```

---

This concludes the Cloi project architecture documentation. Use this guide for development, maintenance, and extension of the Cloi system.
