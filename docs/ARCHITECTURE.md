# Cloi Architecture Documentation

---

## **1. System Overview**

### **Purpose**
Cloi is a Node.js-based command-line interface (CLI) tool designed to process terminal errors, generate applicable code fixes, and suggest improvements using advanced AI techniques. Cloi leverages Python-based Machine Learning (ML) services for sophisticated natural language processing and Retrieval Augmented Generation (RAG). 

### **Key Features**
- Error detection and automated code fixes using Local or Cloud-based Language Models (LLMs).
- Integrates with CodeBERT for semantic code understanding using embeddings.
- Flexible architecture supporting multiple AI providers like Ollama (local) and Claude (cloud).
- Modular design for extensibility, enabling integration with various components such as CI/CD pipelines, browser testing tools, and repository/environment diagnostics.

### **High-Level Architecture**
Cloi operates as a hybrid system:
1. **Node.js Backend**: Provides the CLI tool, application logic, and middleware for communications.
2. **Python ML Services**: Manages ML-related tasks, including embedding extraction with CodeBERT and Retrieval Augmented Generation (RAG).
3. **External Integrations**: Collaborates with external services (e.g., LLM APIs) for generating responses, performing analyses, and suggesting corrections.

---

## **2. Component Architecture**

### **Component Diagram**
```plaintext
+--------------------------+        +--------------------------+
|      Node.js CLI Tool    |        | Python ML Engine         |
|                          |        | - Embedding Extraction   |
| - Command Parser         | <----> | - CodeBERT Integration   |
| - Execution Orchestrator |        | - RAG Logic              |
| - Plugin System          |        +--------------------------+
| - Error Processor        |
|     ↑        ↓                                                  .
| Local Logging | HTTP Gateway                                     ↓
+-----------+----+------+    Developer APIs         +------------------+
|  External Services      | <---------------------> | AI Service Layer |
| - Ollama (Local)        |                         | - Ollama         |
| - Claude (Cloud)        |                         | - Claude         |
+--------------------------+                         +------------------+
```

### **Key Modules**
1. **Protocols**:
   - **A2A** (App-to-AI) handles communication between the CLI and AI services for inference.
2. **Plugins**:
   - Provide modular extensions for CI/CD, browser testing, and environment analysis.
3. **Providers**:
   - Interface with third-party AI providers (Ollama, Claude).
4. **Analyzers**:
   - Perform diagnostics and quality checks.

### Sample File Structure
```plaintext
src/protocols/a2a/
  - embedded-prompts.js
  - index.js
  - setup-ai-integration.js
src/plugins/quality/
  - code-quality/
  - index.js
src/plugins/integrations/
src/plugins/providers/
src/plugins/analyzers/
```

---

## **3. Data Flow**

### **Flow Overview**
1. **Command Issuance**: The user executes a command in the Cloi CLI.
2. **Error Logging**: The Node.js backend processes the error (if any) and sends error metadata to the AI service.
3. **Retrieval Augmented Generation (RAG)**:
   - Code snippets are embedded using CodeBERT.
   - Relevant data is retrieved from the FAISS-based local vector store.
4. **Inference and Response**:
   - The AI service (local or cloud) produces code fixes or suggestions.
   - Results are sent back to the CLI.
5. **User Feedback & Iterative Improvement**:
   - The CLI displays suggested fixes, logs corrections locally, and allows for further iterations.

### **Data Flow Diagram**
```plaintext
[User CLI Input] --> [Node.js CLI Parser] 
      --> [Error Processor] --> [Embedding via CodeBERT + FAISS]
            --> [Local (Ollama) or Cloud (Claude) AI API]
                  --> [Generated Code Fix] 
                        --> [CLI Output to User]
```

### **Data Storage**
The primary dataset (code embeddings) is stored within a local FAISS node-based database, ensuring high-speed retrieval.

---

## **4. Integration Points**

### **External Services**
1. **Ollama (Local LLM)**:
   - Cloi integrates directly with Ollama for low-latency, local inference.
   - Communication is managed via a Node.js wrapper.
2. **Claude (Cloud LLM)**:
   - Supports complex reasoning tasks and generates refined suggestions.
   - Uses the `@anthropic-ai/sdk`.
3. **CodeBERT (Embedding Extraction)**:
   - Utilized for code understanding via a semantic embedding layer (HuggingFace library).

### **Dependencies**
- **AI SDKs**:
  - `@anthropic-ai/sdk`: For cloud LLM interaction (Claude).
  - `@huggingface/transformers`: For CodeBERT embeddings.
- **Storage**:
  - `faiss-node`: For vector similarity searches.
- **Auxiliary**:
  - `ajv`: For JSON schema validation.
  - `uuid`: For unique identifiers.
  - `express`: For HTTP interaction between modules.

---

## **5. Security Architecture**

### **Key Security Principles**
1. **Authentication**:
   - Secure API keys for Claude and Ollama services.
   - Keys are stored in environment variables and never hardcoded.
2. **Data Privacy**:
   - Local RAG workflows keep sensitive code data on-premises.
   - Communication with cloud services (Claude) is encrypted using HTTPS.
3. **Endpoint Protection**:
   - Express endpoints validate payloads via `ajv`.
   - CORS policies restrict unauthorized access.
4. **Rate Limiting**:
   - AI API calls to cloud LLMs are rate-limited to prevent misuse.

### **Directory Protection**
- The system enforces a strict directory/file organization to segregate sensitive provider configurations (`src/plugins/providers`) and limit unintentional access.

---

## **6. Extension Points**

### **Plugins**
Developers can enhance Cloi by creating plugins to address specific workflows such as:
1. **Custom Protocols**:
   - Create a new protocol under `src/protocols` for custom data flows.
2. **Integration Plugins**:
   - Add CI/CD, browser testing, or other integrations by extending `src/plugins/integrations` (following modular/plugin architecture).

### **Overriding Providers**
Developers can implement new AI provider integrations by:
1. Defining a new provider under `src/plugins/providers`.
2. Implementing their API interface (similar to `src/plugins/providers/claude`).

### **Custom Analyzers**
- Extend diagnostics by introducing new analyzers under `src/plugins/analyzers`. Each analyzer is a module with hooks into the core CLI lifecycle.

### **Setup Guide**
1. Clone the repository and navigate to the module types (e.g., `src/plugins/providers`).
2. Follow the template for creating plugins or providers.
3. Register the new module in the central registry (`src/protocols/a2a/index.js`).

---

## **Conclusion**

Cloi’s architecture is designed with a strong emphasis on modularity, security, and scalability. Combining local processing capabilities with cloud-based AI ensures flexibility, making it adaptable to diverse developer needs. Its extensibility framework empowers developers to tailor Cloi to their workflows, while robust security practices protect sensitive code routines.
