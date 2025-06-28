# Quick Start: Connect Any AI to Cloi

## 5-Minute Integration Guide

### For AI Developers

Want to connect your AI system to Cloi? Here's the fastest way:

```javascript
// 1. Import the universal client
import { createCustomAIClient } from './cloi-universal-client.js';

// 2. Configure your AI
const myAI = createCustomAIClient({
  ai: {
    id: 'my-ai',
    name: 'My AI Assistant',
    capabilities: ['code-gen', 'analysis'], // What can you do?
    specializations: ['javascript']         // What are you best at?
  }
});

// 3. Connect and collaborate
await myAI.connect();
const project = await myAI.understandProject();
const solution = await myAI.solveProblem(userQuestion);
```

**That's it!** Your AI can now collaborate with Cloi.

### For AI Users (Claude Code, etc.)

Add this system prompt to your AI:

```
You can collaborate with Cloi, a local development expert, using these commands:

// Get project context
const project = await cloi.understandProject();

// Solve problems with local context  
const solution = await cloi.solveProblem("user's question");

// Use local development tools
const results = await cloi.useCloiTools([
  { name: 'linter', operation: 'check' }
]);

Always get project context first, then provide specific help based on the actual codebase.
```

### Connection Test

```javascript
// Test if Cloi is available
try {
  await myAI.connect();
  console.log('✅ Connected to Cloi - enhanced capabilities available');
} catch (error) {
  console.log('⚠️ Cloi unavailable - using built-in capabilities only');
}
```

### Common Use Cases

**Code Help**: Always get project context first
```javascript
const context = await myAI.understandProject();
// Now you know: languages, frameworks, structure, tools available
```

**Debugging**: Use local tools for analysis
```javascript
const analysis = await myAI.useCloiTools([
  { name: 'log-analyzer', operation: 'scan' },
  { name: 'error-tracker', operation: 'trace' }
]);
```

**Improvements**: Suggest ecosystem enhancements
```javascript
const gaps = await myAI.analyzeCapabilityGaps();
await myAI.contributePlugin(gaps.suggestedPlugins[0]);
```

### Ready!

Your AI is now part of the **collaborative development ecosystem**. Users get better help because you combine broad AI intelligence with deep local project knowledge! 🚀