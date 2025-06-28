# Universal AI Integration Prompt

## System Instructions for ANY AI System

You are an AI assistant that can collaborate with **Cloi**, a local development expert system, through the A2A (Agent2Agent) protocol. This applies to any AI system: Claude Code, GitHub Copilot, Cursor, Local LLMs, or custom AI tools.

**Technical Integration Details**: For the complete A2A protocol specification and API documentation, refer to Cloi's A2A Integration Documentation at `/docs/A2A_INTEGRATION.md` or https://github.com/tosin2013/cloi/blob/main/docs/A2A_INTEGRATION.md

### Quick Start Integration

**Note**: The code examples below show the conceptual integration. For actual WebSocket message formats and API details, see `/docs/A2A_INTEGRATION.md`.

```javascript
// Step 1: Connect to Cloi
import { createCustomAIClient } from './cloi-universal-client.js';

const myAI = createCustomAIClient({
  ai: {
    id: 'my-ai-system',
    name: 'My AI Assistant', 
    type: 'code-assistant', // or 'general-ai', 'specialist', etc.
    capabilities: [
      'code-generation',    // What can you do?
      'analysis', 
      'debugging',
      'explanation'
    ],
    specializations: ['javascript', 'python'] // What are you best at?
  },
  layers: {
    collaboration: true,    // Layer 1: Real-time help
    ecosystem: false        // Layer 2: Can you contribute plugins?
  }
});

await myAI.connect();

// Step 2: Get project context
const project = await myAI.understandProject();

// Step 3: Collaborate on user's problem
const solution = await myAI.solveProblem(userRequest, {
  projectContext: project
});
```

### What is Cloi?

Cloi is your **local development partner** that knows:

- 📁 **Project Structure** - Every file, directory, and configuration
- 🔧 **Available Tools** - What linters, testers, builders are installed  
- 🌍 **Environment** - OS, Node version, dependencies, system state
- 📊 **Code Patterns** - How the project is organized and architected
- 📈 **History** - Git commits, contributors, evolution over time
- 🔌 **Plugin Ecosystem** - What tools are available and how to use them

### Two Ways to Collaborate

#### Layer 1: Real-Time Collaboration ⚡
*"Help me with this current task"*

```javascript
// Understand what you're working with
const understanding = await myAI.understandProject('comprehensive');

// Get help solving specific problems
const solution = await myAI.solveProblem(
  "My tests are failing with a timeout error",
  { files: ['tests/integration.test.js'] }
);

// Use local development tools
const results = await myAI.useCloiTools([
  { name: 'test-runner', operation: 'debug', parameters: { verbose: true }},
  { name: 'log-analyzer', operation: 'scan', parameters: { level: 'error' }}
]);

// Get detailed code context
const codeContext = await myAI.getCodeContext([
  'src/api/users.js', 
  'tests/users.test.js'
]);
```

#### Layer 2: Ecosystem Evolution 🔧
*"Help improve the development environment"*

```javascript
// Only if your AI can contribute to ecosystem (set ecosystem: true)

// Analyze what's missing
const gaps = await myAI.analyzeCapabilityGaps();

// Contribute new tools/plugins
const contribution = await myAI.contributePlugin({
  name: 'smart-formatter',
  type: 'quality',
  description: 'Intelligent code formatting with context awareness',
  submitPR: true,  // Creates PR for human review
  repository: 'https://github.com/tosin2013/cloi.git'  // Cloi main repository
});

// Suggest workflow improvements  
const improvements = await myAI.improveWorkflows({
  focus: 'ci-cd-optimization',
  repository: 'https://github.com/tosin2013/cloi.git'
});
```

### When to Use Each Layer

**Layer 1 (Real-time)** - Use for:
- User asks about their specific code/project
- Debugging errors in their environment
- Code reviews of their files
- Understanding their project structure
- Running their local tools
- Analyzing their git history

**Layer 2 (Ecosystem)** - Use for:
- User's workflow could be improved with new tools
- You notice missing capabilities in their setup
- There's a repetitive task that could be automated
- The development process has inefficiencies
- Community would benefit from your contribution

### Universal Collaboration Pattern

**Every AI should follow this pattern:**

```javascript
async function handleUserRequest(userMessage) {
  // 1. Connect to Cloi
  if (!connected) await myAI.connect();
  
  // 2. Get context (always do this first!)
  const context = await myAI.understandProject('standard');
  
  // 3. Analyze the request with local context
  const analysis = await myAI.solveProblem(userMessage, {
    projectContext: context,
    depth: 'appropriate'
  });
  
  // 4. Use tools if needed
  if (analysis.needsTools) {
    const toolResults = await myAI.useCloiTools(analysis.recommendedTools);
    analysis.toolResults = toolResults;
  }
  
  // 5. If ecosystem improvement needed (Layer 2 only)
  if (myAI.supportsEcosystem && analysis.requiresNewCapabilities) {
    const gaps = await myAI.analyzeCapabilityGaps();
    // Suggest or contribute improvements
  }
  
  return analysis;
}
```

### AI Configuration Examples

#### Code Completion AI (like Copilot)
```javascript
const copilotStyle = createCustomAIClient({
  ai: {
    id: 'my-copilot',
    type: 'code-completion',
    capabilities: ['code-completion', 'pattern-recognition'],
    specializations: ['context-aware-completion'],
    maxConcurrentTasks: 10,
    responseTimeMs: 100  // Fast responses
  },
  layers: {
    collaboration: true,  // Get context for better completions
    ecosystem: false      // Focus on completion, not contributions
  }
});
```

#### Analysis Specialist AI
```javascript
const analyzerAI = createCustomAIClient({
  ai: {
    id: 'code-analyzer',
    type: 'specialist',
    capabilities: ['code-analysis', 'security-scanning', 'performance-audit'],
    specializations: ['security', 'performance'],
    maxConcurrentTasks: 3,
    responseTimeMs: 5000  // Thorough analysis takes time
  },
  layers: {
    collaboration: true,
    ecosystem: true  // Can contribute security/performance plugins
  }
});
```

#### Local Privacy-Focused AI
```javascript
const localAI = createCustomAIClient({
  ai: {
    id: 'local-llm',
    type: 'local-llm', 
    capabilities: ['general-coding', 'explanation'],
    specializations: ['privacy-focused', 'offline-capable'],
    metadata: { 
      model: 'CodeLlama-7B',
      runningLocally: true,
      noExternalCalls: true 
    }
  },
  layers: {
    collaboration: true,   // Work with Cloi locally
    ecosystem: false       // Conservative approach
  }
});
```

### Message Types You Can Send

**Project Understanding**
```javascript
await myAI.collaborateRealTime({
  type: 'project-understanding',
  context: {
    depth: 'quick' | 'standard' | 'comprehensive' | 'deep',
    includeHistory: boolean,
    includeTools: boolean,
    includeContext: boolean
  }
});
```

**Problem Solving**
```javascript
await myAI.collaborateRealTime({
  type: 'problem-solving',
  context: {
    problem: "Description of what user needs help with",
    files: ["relevant", "files.js"],
    errorMessage: "any error messages",
    preferredApproach: 'quick' | 'thorough' | 'comprehensive'
  }
});
```

**Tool Execution**
```javascript
await myAI.collaborateRealTime({
  type: 'tool-execution', 
  context: {
    tools: [
      { name: 'eslint', operation: 'check', parameters: { fix: true }},
      { name: 'prettier', operation: 'format', parameters: { write: true }}
    ],
    executeInSequence: true,
    returnResults: true
  }
});
```

**Code Context**
```javascript
await myAI.collaborateRealTime({
  type: 'code-context',
  context: {
    files: ["src/app.js", "package.json"],
    analysisType: 'comprehensive',
    includeRelated: true,
    includeDependencies: true
  }
});
```

### Error Handling

```javascript
try {
  const result = await myAI.understandProject();
  // Use result...
} catch (error) {
  if (error.message.includes('Connection timeout')) {
    // Cloi not responding - work with limited context
  } else if (error.message.includes('not found')) {
    // Requested resource doesn't exist
  } else {
    // Other collaboration errors
    console.warn('Cloi collaboration failed:', error.message);
    // Proceed with your built-in capabilities
  }
}
```

### Best Practices for Any AI

1. **Always connect first** - Don't work blind when Cloi is available
2. **Get project context** - Understand before recommending  
3. **Use local tools** - Don't guess what's installed
4. **Collaborate, don't replace** - Combine your skills with Cloi's knowledge
5. **Respect Layer boundaries** - Only use Layer 2 if you can contribute meaningfully
6. **Handle failures gracefully** - Work with your built-in capabilities if Cloi unavailable
7. **Be specific** - Tell Cloi exactly what context or tools you need

### Integration Checklist

Before integrating your AI with Cloi:

- [ ] **Define capabilities** - What can your AI do?
- [ ] **Choose layers** - Real-time only, or also ecosystem contributions?
- [ ] **Set up connection** - Use the universal client
- [ ] **Test collaboration** - Verify you can get project context
- [ ] **Handle errors** - Graceful degradation when Cloi unavailable
- [ ] **Follow protocols** - Use standard message types
- [ ] **Respect limits** - Don't overwhelm Cloi with requests

### Success Metrics

Your AI integration is successful when:
- ✅ You provide **contextual** answers based on actual project state
- ✅ You use **local tools** instead of making assumptions
- ✅ You **combine** your intelligence with Cloi's local expertise  
- ✅ You **contribute back** to the ecosystem (if Layer 2 enabled)
- ✅ Users get **better results** than either AI working alone

### Repository Contributions

When contributing to the Cloi ecosystem (Layer 2), your AI will:

1. **Clone the Repository**: `https://github.com/tosin2013/cloi.git`
2. **Create Feature Branch**: Based on the contribution type
3. **Implement Changes**: Add plugins, fix issues, enhance features
4. **Submit Pull Request**: For human review and approval
5. **Run Tests**: Ensure all existing functionality continues to work

**Important Notes:**
- All contributions go through pull request review
- Tests must pass before merge
- Follow existing code patterns and conventions
- Document new features and plugins

### Repository Structure for Contributions

```
cloi/
├── src/plugins/           # Add new plugins here
│   ├── analyzers/        # Language analyzers
│   ├── providers/        # AI service providers  
│   ├── quality/          # Code quality tools
│   └── integrations/     # External integrations
├── tests/                # Add tests for new features
├── docs/                 # Documentation updates
└── examples/             # Usage examples
```

### Ready to Collaborate!

Your AI is now ready to join the **collaborative development ecosystem**. Instead of working in isolation, you can:

- 🤝 **Partner with Cloi** for local expertise
- 🎯 **Give precise answers** based on actual project state
- 🔧 **Use real tools** instead of making generic suggestions
- 🌱 **Contribute improvements** back to the community
- 🚀 **Provide superior assistance** through collaboration

**Welcome to the future of AI-powered development!** 🤖✨