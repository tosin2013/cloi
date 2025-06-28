## Cloi API Documentation

### Overview
Cloi is a security-first agentic debugging tool designed to enhance the debugging experience for developers. Its architecture consists of several modules with distinct purposes:

- **Core Module**: Handles the main execution functions, configuration, and language model (LLM) integrations, including plugins and coordination logic.
- **RAG Module**: Focused on Retrieval-Augmented Generation (RAG), with functionality for chunking, embedding generation, and hybrid retrieval systems.
- **Utils Module**: Provides utility functions for common tasks like managing API keys, working with Git repositories, and handling patches.
- **UI Module**: Implements the terminal-based user interface, including input handling and visual feedback.

---

### Core Module

#### **1. ConfigManager (class)**  
Handles configuration management for the core system.  

- **File**: `src/core/config-manager/index.js`
- **Methods**: Not explicitly listed in the structure but supports loading and saving configurations.

```javascript
const config = new ConfigManager();
config.loadConfig("path/to/config.json");
config.saveConfig("path/to/save.json");
```

---

#### **2. Coordinator (class)**  
Coordinates actions and processes between different subsystems.  

- **File**: `src/core/coordinator/index.js`
- **Purpose**: Handles the orchestration between the agent's subsystems.

---

#### **3. LLM Integration (Claude)**  
Functions for interacting with the Claude LLM.

##### **getClaudeModels()**
- **File**: `src/core/executor/claude.js`
- **Parameters**: None
- **Returns**: List of available Claude models (`Array`).

##### **createClaudeClient(apiKey)**
- **Parameters**:
  - `apiKey` (string): Your Anthropic Claude API key.
- **Returns**: A Claude client instance.

```javascript
const client = createClaudeClient("your-api-key");
```

##### **queryClaudeStream(prompt, options)**
- **Parameters**:
  - `prompt` (string): Instruction or input for the model.
  - `options` (Object): Execution options, such as temperature, max tokens, etc.
- **Returns**: A streaming response from the Claude model.

---

#### **4. Plugins**
Extensive plugin-support architecture driven by base interfaces/classes.

- **BasePlugin (class)**: Common interface for plugins.
- **PluginManager (class)**: Manages registered plugins.

```javascript
const pluginManager = new PluginManager();
pluginManager.loadPluginsFromDirectory("./plugins");
```

---

### RAG Module

The RAG (Retrieval-Augmented Generation) module focuses on advanced code retrieval and embedding tasks, enabling intelligent debugging.

#### **1. Chunking**
Splits code into manageable chunks for embedding or indexing.

##### **createSemanticChunks(code, language)**
- **Parameters**:
  - `code` (string): Source code to chunk.
  - `language` (string): Language of the code to guide chunking.
- **Returns**: Array of semantic chunks.

```javascript
const chunks = createSemanticChunks("const x = 5;", "javascript");
```

##### **detectPythonBoundaries(code)**
- **Parameters**:
  - `code` (string): Source code to analyze.
- **Returns**: Semantic boundaries for Python code.

---

#### **2. BM25 Index**
BM25-based text retrieval system.

##### **createBM25Index(documents)**
- **Parameters**:
  - `documents` (Array<string>): Documents to index.
- **Returns**: BM25 index instance.

```javascript
const index = createBM25Index(["function test() {}", "const value = 42;"]);
```

##### **getOrCreateBM25Index(path)**
- **Parameters**:
  - `path` (string): Path for the cached BM25 index.
- **Returns**: BM25 index instance.

---

#### **3. Embeddings**
Supports generating embeddings using models like CodeBERT.

##### **generateEmbedding(code, language)**
- **Parameters**:
  - `code` (string): Source code to embed.
  - `language` (string): Language of the source code.
- **Returns**: Embedding vector (`Array<number>`).

```javascript
const embedding = generateEmbedding("const x = 5;", "javascript");
```

##### **batchGenerateEmbeddings(files)**
- **Parameters**:
  - `files` (Array<string>): List of file paths to batch process.
- **Returns**: Embeddings for all files.

---

#### **4. Hybrid Search**
Combines vector search and BM25 retrieval for robust hybrid retrieval.

##### **hybridSearch(query, options)**
- **Parameters**:
  - `query` (string): Search query.
  - `options` (Object): Hybrid search configuration.
- **Returns**: Combined search results.

---

### Utils Module

The Utils Module offers a range of helper functions for managing environments, repositories, and configurations.

#### **1. API Key Management**
- **getAnthropicApiKey()**: Retrieves the stored Anthropic API key.
- **validateApiKeyFormat(apiKey)**: Validates the format of an API key.
- **isClaudeAvailable()**: Checks if Claude services are reachable.

```javascript
const key = getAnthropicApiKey();
```

#### **2. Git Utilities**
- **isGitRepository(path)**: Verifies if a given directory is a Git repository.
- **getGitRepoInfo()**: Retrieves metadata about the current git repository.

```javascript
if (isGitRepository("./my/project")) {
  const repoInfo = getGitRepoInfo();
}
```

#### **3. Patching**
- **applyPatch(patch)**: Applies a provided patch to the project.
- **showPatch()**: Displays the contents of a patch.

```javascript
applyPatch(patchData);
```

---

### UI Module

The UI Module delivers terminal-based interactivity.

#### **1. Terminal Input/Output**
- **echoCommand(command)**: Outputs a command to the terminal.
- **askYesNo(question)**: Prompts user input for a yes/no question.
- **askInput(question)**: Prompts user input for freeform text.

```javascript
const answer = await askYesNo("Proceed? [y/n]");
```

#### **2. Command Interaction**
- **createCommandBox(commandHandler)**: Creates an interactive terminal box for command input.

---

### Extending the Codebase

#### Adding a Custom Plugin
1. Extend the `BasePlugin` class.
2. Implement required methods (e.g., `run`, `initialize`).
3. Add the plugin to the `PluginManager`.

```javascript
class MyCustomPlugin extends BasePlugin {
  initialize() {
    console.log("Initializing MyCustomPlugin...");
  }
  
  run(input) {
    return `Processed: ${input}`;
  }
}

const myPlugin = new MyCustomPlugin();
pluginManager.registerPlugin(myPlugin);
```

#### Implementing a New LLM Integration
1. Create a new handler in `executor/`.
2. Add a routing function in `router.js`.

```javascript
function queryMyLLM(prompt) {
  // Implement your model's logic here
}
```

#### Adding New UI Components
1. Add your logic to `terminalUI.js`.
2. Create new render or interaction helpers.

```javascript
function makeCustomPicker(options) {
  // Implement a UI picker with options
}
```

---

End of Documentation.
