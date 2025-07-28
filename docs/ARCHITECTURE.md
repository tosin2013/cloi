```markdown
# **Cloi Project Architecture Document**

---

## **1. System Overview**

Cloi is a Command-Line Interface (CLI) tool that integrates machine learning (ML) features to automatically process terminal errors and suggest or directly apply code fixes. Cloi is designed as a hybrid system combining **local** and **cloud-based** language models (LLMs) to provide robust and scalable functionality. It leverages **Retrieval Augmented Generation (RAG)** utilizing **CodeBERT embeddings** to identify, retrieve, and generate contextually relevant fixes.

### Core Features:
- **Error Diagnosis:** Extracts error logs and runs analysis against a corpus of relevant developer knowledge.
- **Code Fix Generation:** Uses a combination of Rule-Based Suggestions and Retrieval Augmented Generation (RAG) models.
- **Local and Cloud-Based LLM**: Supports **Ollama** for local LLM inference and **Claude** (cloud-based service) for broader contextual understanding.
- **Extensible Plugin Architecture:** Enables developers to add custom workflows or augment existing capabilities.

---

## **2. Component Architecture**

### Key Modules and Responsibilities:
- **CLI Subsystem (`src/cli`)**:
  - Manages the command-line interface.
  - Serves as the entry point for user commands.
  - Responsible for invoking terminal output and coordinating user actions.

- **Core System (`src/core`)**:
  - **RAG Engine (`rag.js`)**: Central to Cloi's error analysis and fix suggestion mechanism. Retrieves relevant data embeddings using CodeBERT and enriches responses through LLM-generated explanations.
  - **Workflow Engine (`workflow-engine`)**: Orchestrates execution of coordinated workflows.
  - **Coordinator (`coordinator`)**: Manages operational concurrency and supervises task execution.
  - **Plugin Manager (`plugin-manager`)**: Allows dynamic loading of developer-created plugins or extensions.

- **Protocols Subsystem (`src/protocols/a2a`)**:
  - Handles cross-process and language integration between JavaScript CLI and Python-based ML backend.
  - Provides HTTP server functionalities, embedded prompt processing, and client integration for API communication.

- **Python ML Service**:
  - Implements CodeBERT embeddings for RAG and other deep learning techniques.
  - Responsible for model inference using both Ollama and Claude.

---

## **3. Data Flow**

### System Data Lifecycle:
1. **Error Input**:
   - The CLI captures stack traces or error logs directly from the user's terminal.

2. **Error Analysis**:
   - Error logs are transmitted to the RAG engine (`src/core/rag.js`), which processes them using CodeBERT embeddings. Relevant metadata and context are retrieved from a pre-indexed knowledge base supported by **faiss-node**.

3. **LLM Inference**:
   - The prepared embeddings and context are forwarded for inference via:
     - **Ollama** (local LLM) for faster, lightweight suggestions.
     - **Claude** (cloud-based LLM) for deeper contextual interpretation or broader knowledge base.

4. **Fix Generation**:
   - The results from the LLMs are synthesized to create user-friendly suggestions or code fixes.
   - Any uncertainty in the result may trigger a **thinking UI** prompt.

5. **User Output**:
   - Fix suggestions are displayed using customized terminal UI styles (`src/ui/terminalUI.js`).

6. **User Action**:
   - The user selects the fix to be applied, which triggers corresponding workflows via the **workflow engine**.

---

## **4. Integration Points**

### External Dependencies:
1. **Ollama**:
   - Local LLM for performing on-device inference.
   - Provides low-latency, efficient generation to ensure privacy and offline usability.

2. **Claude**:
   - Cloud-based LLM by Anthropic for enhanced contextual understanding and broader language inference.
   - Integrated using the `@anthropic-ai/sdk`.

3. **CodeBERT**:
   - Retrieval-based model used for embedding source code and related artifacts.
   - Deployed in conjunction with **Python ML services** and **faiss-node** for embedding similarity queries.

### Libraries and Frameworks:
- **Node.js** (runtime platform).
- **Express** and **cors** for HTTP APIs between CLI and ML services.
- **HuggingFace Transformers** for model management.
- **faiss-node** for efficient vector search.

---

## **5. Security Architecture**

### Key Security Considerations:
1. **Data Privacy**:
   - Local **Ollama** model ensures sensitive data can be processed offline without leaving the development environment.

2. **Cloud Integration**:
   - **Claude** uses authenticated API calls via `@anthropic-ai/sdk`.
   - Encrypted HTTP (HTTPS) for all data transfers to maintain security during communication with external services.

3. **Sandboxed Execution**:
   - Any code execution suggested by Cloi runs in a sandbox-like environment to mitigate potential risks, preventing unintentional system file modifications.

4. **Validation**:
   - User and system inputs are validated with **ajv** (JSON Schema Validation) to prevent malformed requests.

5. **Security Practices**:
   - Secure plugin scaffolding ensures that third-party extensions cannot tamper with core functionality.
   - Communication between JavaScript and Python backends is isolated at the network level with authentication gates.

---

## **6. Extension Points**

Cloi is designed to be extensible, enabling developers to build custom plugins or augment existing functionality.

### Plugin Architecture:
- **Plugin Manager (`src/core/plugin-manager`)**: Facilitates dynamic loading and interaction of plugins with the Cloi ecosystem.
  - Utilizes `interfaces.js` to define standardized hooks for interoperability.

### How Developers Extend Cloi:
1. **Plugin Creation**:
   - Developers define new plugins conforming to the interface specified in `plugin-manager/interfaces.js`.
   - Plugins can register workflows, RAG processors, or custom UI components.

2. **Workflow Augmentation**:
   - New workflows can be defined in the `workflow-engine`, allowing developers to address non-standard terminal errors or integrate additional tools.

3. **Custom Knowledge Base**:
   - Developers can add domain-specific documentation (e.g., private APIs) to the RAG system by extending the knowledge base indexed by `faiss-node`.

4. **Protocol Enhancements**:
   - Modify existing `src/protocols/a2a` components to integrate new ML models or enhance API interconnectivity.

---

## **File Structure Overview**

Organized to ensure modularity and maintainability:

```
src/
├── ui/
│   └── terminalUI.js             # Terminal user interface logic
├── cli/
│   ├── index.js                  # CLI entry point
│   ├── modular.js
│   ├── legacy-backup/
│       ├── index.js
│       ├── modular.js
├── protocols/a2a/
│   ├── setup-ai-integration.js   # AI service bootstrap
│   ├── index.js
│   ├── http-server.js            # Manages HTTP APIs
│   ├── embedded-prompts.js       # Predefined LLM prompts
│   ├── universal-client.js       # Client abstraction for cloud/local LLMs
│   ├── test.js
├── core/
│   ├── rag.js                    # Retrieval Augmented Generation
│   ├── tool-discovery/           # Error-pattern tool discovery
│   ├── ui/thinking.js            # "Thinking" intermediate UI
│   ├── coordinator/              # Orchestration engine
│   ├── plugin-manager/           # Extendable plugin system
│       ├── interfaces.js
│   ├── workflow-rollback/        # Undo manager for workflows
│   ├── workflow-engine/          # Workflow definition/engine
```

---

### Versioning Control:
- Use **Semantic Versioning (SEMVER)** for tracking changes across the system.
```
