#!/usr/bin/env node
/**
 * AI Integration Setup Script
 * 
 * Provides prompts and setup instructions for integrating external AIs with Cloi
 */

import { getIntegrationPrompt, displayPrompt as displayEmbeddedPrompt, getAvailablePromptTypes } from './embedded-prompts.js';

class AIIntegrationSetup {
  constructor() {
    // Use embedded prompts that work with compiled builds
    this.availablePrompts = getAvailablePromptTypes();
  }

  async getPrompt(aiType = 'universal') {
    return getIntegrationPrompt(aiType);
  }

  async displayPrompt(aiType = 'universal') {
    displayEmbeddedPrompt(aiType);
  }

  async generateIntegrationCode(aiConfig) {
    const { name, type, capabilities, specializations, layers } = aiConfig;
    
    const code = `
// ${name} Integration with Cloi A2A Protocol
import { createCustomAIClient } from './src/protocols/a2a/universal-client.js';

const ${name.toLowerCase().replace(/[^a-z0-9]/g, '')}AI = createCustomAIClient({
  ai: {
    id: '${name.toLowerCase().replace(/\s+/g, '-')}',
    name: '${name}',
    type: '${type}',
    capabilities: ${JSON.stringify(capabilities, null, 4)},
    specializations: ${JSON.stringify(specializations, null, 4)}
  },
  layers: {
    collaboration: ${layers.collaboration},
    ecosystem: ${layers.ecosystem}
  }
});

// Connect to Cloi
await ${name.toLowerCase().replace(/[^a-z0-9]/g, '')}AI.connect();

// Example usage:
async function handleUserRequest(userMessage) {
  // Get project context
  const project = await ${name.toLowerCase().replace(/[^a-z0-9]/g, '')}AI.understandProject();
  
  // Solve problem with context
  const solution = await ${name.toLowerCase().replace(/[^a-z0-9]/g, '')}AI.solveProblem(userMessage, {
    projectContext: project
  });
  
  return solution;
}

export { ${name.toLowerCase().replace(/[^a-z0-9]/g, '')}AI, handleUserRequest };
`;

    return code;
  }

  async savePromptToFile(aiType, outputPath) {
    const prompt = await this.getPrompt(aiType);
    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, prompt, 'utf8');
    console.log(`✅ Prompt saved to: ${outputPath}`);
  }

  displayMenu() {
    console.log('🤖 Cloi A2A Integration Setup');
    console.log('=' .repeat(40));
    console.log('');
    console.log('Available prompts:');
    console.log('1. claude-code    - Specific instructions for Claude Code');
    console.log('2. universal      - Works with any AI system');
    console.log('3. quick-start    - 5-minute integration guide');
    console.log('');
    console.log('Usage:');
    console.log('  node setup-ai-integration.js [prompt-type]');
    console.log('  node setup-ai-integration.js claude-code');
    console.log('  node setup-ai-integration.js universal');
    console.log('  node setup-ai-integration.js quick-start');
    console.log('');
  }

  async interactiveSetup() {
    console.log('🚀 Interactive AI Integration Setup\n');
    
    // This would normally use a proper CLI library like inquirer
    // For now, showing the concept
    
    console.log('Which AI system are you integrating?');
    console.log('1. Claude Code');
    console.log('2. GitHub Copilot'); 
    console.log('3. Cursor');
    console.log('4. Local LLM');
    console.log('5. Custom AI');
    
    // Simulate selection (in real implementation, would prompt user)
    const selection = '1'; // Claude Code for demo
    
    let aiConfig;
    switch (selection) {
      case '1':
        aiConfig = {
          name: 'Claude Code',
          type: 'code-assistant',
          capabilities: ['code-generation', 'analysis', 'refactoring', 'debugging'],
          specializations: ['multi-language', 'context-aware'],
          layers: { collaboration: true, ecosystem: true }
        };
        break;
      case '2':
        aiConfig = {
          name: 'GitHub Copilot',
          type: 'code-completion',
          capabilities: ['code-completion', 'pattern-recognition'],
          specializations: ['code-completion'],
          layers: { collaboration: true, ecosystem: false }
        };
        break;
      default:
        aiConfig = {
          name: 'Custom AI',
          type: 'general-ai',
          capabilities: ['analysis'],
          specializations: [],
          layers: { collaboration: true, ecosystem: false }
        };
    }
    
    console.log('\n📋 Generated configuration:');
    console.log(JSON.stringify(aiConfig, null, 2));
    
    console.log('\n🔧 Generated integration code:');
    const code = await this.generateIntegrationCode(aiConfig);
    console.log(code);
    
    console.log('\n📖 System prompt for your AI:');
    const promptType = selection === '1' ? 'claude-code' : 'universal';
    await this.displayPrompt(promptType);
  }

  async checkCloiStatus() {
    console.log('🔍 Checking Cloi A2A status...\n');
    
    try {
      // Try to connect to Cloi's A2A port
      const { WebSocket } = await import('ws');
      const ws = new WebSocket('ws://localhost:9090');
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Connection timeout'));
        }, 5000);
        
        ws.on('open', () => {
          clearTimeout(timeout);
          ws.close();
          resolve();
        });
        
        ws.on('error', reject);
      });
      
      console.log('✅ Cloi A2A service is running on port 9090');
      console.log('🔗 External AIs can connect immediately');
      
    } catch (error) {
      console.log('❌ Cloi A2A service not detected');
      console.log('📝 To start Cloi A2A service:');
      console.log('   node src/cli/modular.js a2a start');
      console.log('   # Or start Cloi with A2A enabled');
    }
  }
}

// CLI interface
async function main() {
  const setup = new AIIntegrationSetup();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    setup.displayMenu();
    await setup.checkCloiStatus();
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'status':
      await setup.checkCloiStatus();
      break;
      
    case 'interactive':
      await setup.interactiveSetup();
      break;
      
    case 'claude-code':
    case 'universal':
    case 'quick-start':
      await setup.displayPrompt(command);
      break;
      
    case 'save':
      const promptType = args[1] || 'universal';
      const outputPath = args[2] || `${promptType}-prompt.md`;
      await setup.savePromptToFile(promptType, outputPath);
      break;
      
    default:
      console.log(`Unknown command: ${command}`);
      setup.displayMenu();
  }
}

// Example configurations for common AI systems
export const commonConfigurations = {
  claudeCode: {
    name: 'Claude Code',
    type: 'code-assistant',
    capabilities: ['code-generation', 'analysis', 'refactoring', 'debugging', 'documentation'],
    specializations: ['multi-language', 'context-aware', 'best-practices'],
    layers: { collaboration: true, ecosystem: true }
  },
  
  githubCopilot: {
    name: 'GitHub Copilot',
    type: 'code-completion',
    capabilities: ['code-completion', 'pattern-recognition', 'context-inference'],
    specializations: ['code-completion', 'pattern-matching'],
    layers: { collaboration: true, ecosystem: false }
  },
  
  cursor: {
    name: 'Cursor',
    type: 'code-editor',
    capabilities: ['code-editing', 'refactoring', 'analysis'],
    specializations: ['editor-integration', 'real-time-assistance'],
    layers: { collaboration: true, ecosystem: false }
  },
  
  localLLM: {
    name: 'Local LLM',
    type: 'local-llm',
    capabilities: ['text-generation', 'analysis', 'reasoning'],
    specializations: ['privacy-focused', 'offline-capable'],
    layers: { collaboration: true, ecosystem: false }
  }
};

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Setup error:', error.message);
    process.exit(1);
  });
}

export default AIIntegrationSetup;