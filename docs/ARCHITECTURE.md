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

### Description
Cloi is a Node.js-based CLI tool augmented by underlying Python services to deliver advanced capabilities for automating and fixing terminal errors. It employs **Retrieval-Augmented Generation (RAG)** using **CodeBERT** embeddings for intelligent code processing. Cloi leverages both **local models (Ollama)** and **cloud-based LLMs (Claude)** for natural language understanding and code generation.

Key Features:
- Analyze terminal error logs.
- Suggest + apply automated code fixes.
- Support local/offline AI (Ollama) and cloud-based AI (Claude).
- RAG with FAISS for efficient retrieval augmented queries.
- Extensible plugin architecture.

### Tech Stack
- **Primary Language**: Node.js (CLI and integrations).
- **Secondary Language**: Python (military-grade ML capabilities).
- **Core Dependencies**:
  - **Machine Learning**: `@anthropic-ai/sdk`, `@huggingface/transformers`, `faiss-node`.
  - **CLI Framework**: `yargs`, `chalk`, `boxen`.
  - **Web/Server**: `express`, `cors`, `ws`.
  - **Filesystem & Parsing**: `glob`, `js-yaml`.
  - **Other Utilities**: `lodash-es`, `seedrandom`, `uuid`, `node-cron`, `ajv`.

### Deployment
1. **Local Setup**: CLI + local Ollama model (private, offline capabilities).
2. **Cloud-Enhanced Mode**: Claude integration for large-scale cloud LLM processing.

---

## 2. Component Architecture

### High-level Diagram
```plaintext
+-----------------------------+
|         User CLI            |
+-------------+---------------+
              |
+-------------v---------------+
|         Command Router      |
+-------------+---------------+
              |
     CLI Commands & Plugins
              |
+-------------v---------------+
|       Core System Logic     |
+-------------+---------------+
              |
+-------------v---------------+      +-------------------+
|    AI Integrations Layer    |<---->| External Services |
+-------------+---------------+      +-------------------+
              |
+-------------v---------------+
|     Retrieval+ML Engine     |
+-----------------------------+
```

### Modules
1. **Core CLI Commands**: Defined in `src/protocols` and indexed by `yargs`.
2. **Plugins**: Extensible modules in `src/plugins` (e.g., quality, CICD, analyzers).
3. **AI Integration Layer**:
   - Local AI (Ollama): Direct RAG operations using local models.
   - Cloud AI (Claude): HTTP/SDK-based operations for more complex tasks.
4. **Retrieval Engine**: RAG implementation using FAISS for embeddings and code retrieval.

---

## 3. Data Flow

### Overview
Cloi processes input errors and uses RAG pipelines with intelligence from multiple models for troubleshooting and code repair suggestions.

### Diagram
```plaintext
+---------------------+        Input        +---------------------+
|     User's System   |  CLI Command/Error |       Cloi CLI      |
+---------------------+-------------------->+---------------------+
                                   |
                          +--------v---------+
                          |   Retrieval Engine |
                          |   (FAISS + RAG)    |
                          +--------+---------+
                                   |
               +-------------------v-------------------+
               |    Code Analysis + Best Fix Model     |
               |      (e.g., CodeBERT embeddings)      |
               +-------------------+-------------------+
                                   |
                +------------------v------------------+
                |    Output: Generate Patches/Fixes   |
                +-------------------------------------+
```

### Step-by-Step
1. User provides terminal errors or runtime issues into the Cloi CLI.
2. Cloi uses **FAISS** to quickly retrieve relevant code snippets or prior knowledge from the RAG pipeline.
3. The **LLM (Ollama or Claude)** analyzes the retrieved content along with new embeddings generated using CodeBERT.
4. Suggested fixes, code patches, or steps forward are generated.
5. Cloi returns fixes to the user or optionally applies them.

---

## 4. Integration Points

### External Services
1. **Ollama** (Local Models):
   - Purpose: Offline LLM inference.
   - Integration: Python backend, embedded models for private use.
   - Location: `src/protocols/a2a/setup-ai-integration.js`.

2. **Claude** (Cloud AI):
   - Purpose: Higher complexity cloud-powered LLM.
   - Integration: Using `@anthropic-ai/sdk` for request/response workflows.
   - Location: `src/plugins/providers/claude`.

3. **CodeBERT**:
   - Purpose: Code embedding model used for RAG pipeline.
   - Integration: `@huggingface/transformers` and FAISS for embeddings.
   - Location: `src/plugins/analyzers/repository`.

### Notes on Interaction
- AI endpoints are managed through **express.js** lightweight servers (`src/protocols/a2a/http-server.js`).
- Information exchange happens in JSON format over HTTP.

---

## 5. Security Architecture

### Principles
Cloi adopts a security-first approach focusing on:
1. **Data Privacy**: No user/project data sent to external endpoints without explicit consent.
2. **Access Control**: Differentiate local (Ollama) vs. cloud (Claude) integrations.

### Implementation
1. **Token Management**: API keys for Claude are configured via environment variables.
2. **Data Sandboxing**:
   - Temporary files generated for RAG operations are sandboxed out of the CLI’s root.
3. **Validation**:
   - JSON Schema validation via `ajv`.
   - Strict input sanitization to minimize malformed input/data injection risks.
4. **Secure Embedding Storage**:
   - FAISS embeddings are stored locally, with no cloud sync.

---

## 6. Extension Points

### Overview
Cloi is designed to be modular and extensible. Developers can create plugins to extend core functionality without modifying the core codebase.

### Plugin Architecture
Plugins are located under `src/plugins/` and organized by categories:
1. **Code Quality**: E.g., `src/plugins/quality/code-quality`.
2. **Integrations**: E.g., `src/plugins/integrations/browser-testing`.
3. **Providers**: E.g., `src/plugins/providers/claude`.

### Creating a Plugin
1. Define a new module within the `src/plugins` directory.
   ```plaintext
   src/plugins/<plugin-category>/<plugin-name>
   ```
2. Include an `index.js` file exporting capabilities (commands, analyzers, etc.).
3. Register the plugin in the `Command Router`.

### Example: New CICD Plugin
```plaintext
src/plugins/integrations/cicd/index.js
```
```javascript
module.exports = {
  name: 'cicd-integration',
  execute: async () => {
    console.log('Running CICD checks...');
    // Add integration logic
  }
};
```

### API Integration for Developers
- Access Cloi’s core API by importing `src/protocols/a2a/universal-client.js`.
- Use helper libraries like `chalk` for styled CLI output.

---

## Summary
Cloi is a powerful RAG-driven CLI tool positioned at the intersection of machine learning and developer tools. Its modular architecture and secure design provide seamless error processing and code fixes for developers, while extensibility ensures it adapts to evolving needs.
```
