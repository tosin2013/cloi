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

Cloi is a **Node.js-based Command Line Interface (CLI)** tool with integral **Python ML services**. It leverages **Retrieval Augmented Generation (RAG)**, augmented by **CodeBERT embeddings**, to analyze terminal errors, propose code fixes, and handle AI-driven guidance. 

It supports:
- **Local language models (LLMs)** via Ollama
- **Cloud-based LLMs**, such as Claude by Anthropic

Cloi uses a modular plugin-based architecture, enabling integration with testing frameworks, CI/CD pipelines, and external analysis tools. Its file structure is organized based on **protocols**, **plugins**, and **providers**.

---

## 2. Component Architecture

The major components of Cloi are as follows:

### **Core Modules**
- **Protocol Handlers**: Support communication protocols like HTTP, A2A (App-to-App), and WebSocket for interaction and data exchange.
  - Files: `src/protocols/a2a/*`
- **AI Integration**: Interfaces with local and cloud-based LLMs using `setup-ai-integration` and `universal-client`.
  - Files: `src/protocols/a2a/setup-ai-integration.js`

### **Plugins**
- **Quality Plugins**: Analyze code quality, environment diagnostics, and documentation.
  - Examples: `src/plugins/quality/code-quality`
- **Integration Plugins**: Provide hooks for external systems like browser testing and CI/CD pipelines.
  - Examples: `src/plugins/integrations/cicd`
- **Provider Plugins**: Define how Cloi interacts with specific providers like Claude or MCP (an internal provider).
  - Examples: `src/plugins/providers/claude`
  
### **Embeddings Engine**
Powered by **Python ML services** and integrates Python models with **faiss-node** for vector search tasks (e.g., querying CodeBERT embeddings).

### **Error Processing Engine**
- Errors are processed by analyzing stack traces from terminal inputs and suggesting actionable fixes via RAG workflows.

### **Dependency Services**
Core JS libraries (`chalk`, `boxen`, etc.) enhance CLI interactivity and formatting, while dependencies like `faiss-node` and `@huggingface/transformers` manage ML tasks.

---

## 3. Data Flow

### **Overview**
1. **Input**: A terminal error string or a code snippet.
2. **Preprocessing**: Tokenization and embedding using **CodeBERT**.
3. **RAG Workflow**:
   - Retrieve related knowledge from local/vector stores (using `faiss-node`).
   - Pass context to LLMs (Ollama/Claude) for enhanced completion.
4. **Output**: Suggest fixes, insights, or diagnostics.

### **Detailed Data Flow**
```plaintext
User Input --> CLI --> Error Preprocessing Engine --> Embedding System
                --> Knowledge Retrieval (faiss-node) --> Relevant Context
                --> AI Integration (Ollama/Claude) --> Generated Fix/Solution
                --> CLI Output
```

### **File Mapping**
- Input Handling: `src/protocols/a2a/index.js`
- Embeddings Logic: `src/plugins/analyzers/repository/index.js`
- AI Calls: `src/plugins/providers/claude/index.js`

---

## 4. Integration Points

Cloi integrates with the following external services:

### **1. Ollama**
- **Purpose**: Use local machine learning models for low-latency inference.
- **Integration**: Through the `ollama` module with custom API hooks in `setup-ai-integration.js`.

### **2. Claude (Anthropic's LLMs)**
- **Purpose**: Cloud-based LLMs for more advanced and resource-intensive completions.
- **Integration**: Utilizes `@anthropic-ai/sdk` for authenticated cloud communication.

### **3. CodeBERT**
- **Purpose**: Extraction of code-level embeddings for similarity search and retrieval.
- **Integration**: Managed via `@huggingface/transformers` and `faiss-node` for vector search.

---

## 5. Security Architecture

### **Authentication**
- API keys are required for accessing external LLM services like **Claude** (managed through environment variables).

### **Data Privacy**
- No sensitive user data is stored permanently.
- All processed inputs are transient and cleared from memory on task completion.

### **Sandboxing**
- Local model (Ollama) runs within a restricted scope without direct access to system files beyond user-provided input.

### **Dependencies**
- Dependencies are actively scanned for vulnerabilities using tools like `npm audit`.
- Data exchange between components is validated using `ajv` (schema validation).

### **Endpoint Security**
- REST and WebSocket endpoints leverage **CORS** and encrypted authentication tokens where applicable.

---

## 6. Extension Points

### **Plugin System**
Cloi's architecture is **plugin-based**, allowing developers to add new functionality without modifying the core system.

#### Adding a Plugin
- **Step 1**: Create a new directory, e.g., `src/plugins/custom/new-plugin/`
- **Step 2**: Implement a plugin `index.js` exposing lifecycle methods (`init`, `process`, etc.)
- **Step 3**: Register plugins in Cloi's configuration (`plugins.json` or similar configuration file).

#### Example Plugin File
```javascript
module.exports = {
  name: 'my-custom-plugin',
  version: '1.0.0',
  init(context) {
    console.log('My Custom Plugin initialized', context);
  },
  process(input) {
    return `Processed: ${input}`;
  }
};
```

### **Protocol Extensions**
Developers can define additional protocols (e.g., new interfaces) by adding modules under `src/protocols/`.

### **AI Service Integration**
Developers can integrate additional AI services by:
1. Creating a new provider under `src/plugins/providers/`.
2. Adding integration logic to `setup-ai-integration.js`.

---

## File Organization
```plaintext
src/
  protocols/
    a2a/
      embedded-prompts.js
      http-server.js
      ...
  plugins/
    quality/
      code-quality/
    integrations/
      cicd/
    providers/
      claude/
      mcp/
    analyzers/
      documentation/
      environment/
  ...
```

---

## Conclusion

The Cloi project is designed to be highly modular, extensible, and secure, enabling developers to collaboratively expand its capabilities while leveraging advanced AI and retrieval technologies to analyze and fix code issues efficiently.
```
