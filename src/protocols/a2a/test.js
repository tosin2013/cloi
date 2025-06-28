#!/usr/bin/env node
/**
 * Agent2Agent Protocol Tests
 * Comprehensive test suite for the A2A protocol implementation
 */

import assert from 'assert';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple test framework
class A2AProtocolTestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🤖 Running Agent2Agent Protocol Tests...\n');
    
    for (const { name, fn } of this.tests) {
      try {
        console.log(`Testing: ${name}`);
        await fn();
        console.log(`✅ ${name} - PASSED\n`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name} - FAILED`);
        console.log(`   Error: ${error.message}\n`);
        this.failed++;
      }
    }

    console.log('📊 A2A Protocol Test Results:');
    console.log(`   Passed: ${this.passed}`);
    console.log(`   Failed: ${this.failed}`);
    console.log(`   Total:  ${this.tests.length}`);

    if (this.failed > 0) {
      process.exit(1);
    } else {
      console.log('\n🎉 All A2A protocol tests passed!');
    }
  }
}

const runner = new A2AProtocolTestRunner();

// Test: Protocol Initialization
runner.test('A2A protocol initialization and configuration', async () => {
  const { default: A2AProtocol } = await import('./index.js');
  
  const config = {
    networking: {
      port: 9095, // Use different port for testing
      host: 'localhost'
    },
    discovery: {
      enabled: true,
      broadcastInterval: 5000
    },
    coordination: {
      defaultPattern: 'peer-to-peer'
    }
  };
  
  const protocol = new A2AProtocol(config);
  
  // Verify initialization
  assert(protocol.agentId, 'Agent ID should be generated');
  assert(protocol.config.networking.port === 9095, 'Config should be merged correctly');
  assert(protocol.agents instanceof Map, 'Agents map should be initialized');
  assert(protocol.tasks instanceof Map, 'Tasks map should be initialized');
  assert(protocol.isActive === false, 'Protocol should start inactive');
  
  console.log('   ✅ Protocol initialized successfully');
  console.log(`   Agent ID: ${protocol.agentId}`);
  console.log(`   Port: ${protocol.config.networking.port}`);
});

// Test: Agent Registration
runner.test('Agent registration and capability management', async () => {
  const { default: A2AProtocol } = await import('./index.js');
  
  const protocol = new A2AProtocol({
    networking: { port: 9096 },
    discovery: { enabled: false } // Disable discovery for this test
  });
  
  // Register agent with capabilities
  const capabilities = ['code-analysis', 'error-fixing', 'documentation'];
  const metadata = { version: '1.0.0', type: 'analyzer' };
  
  const agentInfo = await protocol.registerAgent(capabilities, metadata);
  
  assert(agentInfo.id === protocol.agentId, 'Agent ID should match protocol ID');
  assert(agentInfo.capabilities.length === 3, 'Should have 3 capabilities');
  assert(agentInfo.capabilities.includes('code-analysis'), 'Should include code-analysis capability');
  assert(agentInfo.metadata.version === '1.0.0', 'Metadata should be preserved');
  assert(agentInfo.status === 'active', 'Agent should be active');
  
  // Verify agent is in the agents map
  const storedAgent = protocol.agents.get(protocol.agentId);
  assert(storedAgent, 'Agent should be stored in agents map');
  assert(storedAgent.capabilities.includes('error-fixing'), 'Stored agent should have capabilities');
  
  console.log('   ✅ Agent registration working correctly');
  console.log(`   Capabilities: ${capabilities.join(', ')}`);
});

// Test: Task Creation and Management
runner.test('Task creation and management', async () => {
  const { default: A2AProtocol } = await import('./index.js');
  
  const protocol = new A2AProtocol({
    networking: { port: 9097 },
    discovery: { enabled: false }
  });
  
  // Register agent first
  await protocol.registerAgent(['code-analysis', 'testing']);
  
  // Create a task
  const taskData = {
    type: 'code-review',
    description: 'Review JavaScript code for errors',
    priority: 'high',
    files: ['app.js', 'utils.js']
  };
  
  const requiredCapabilities = ['code-analysis'];
  const task = await protocol.createTask(taskData, requiredCapabilities);
  
  assert(task.id, 'Task should have an ID');
  assert(task.type === 'code-review', 'Task type should be preserved');
  assert(task.status === 'failed', 'Task should fail when no suitable agents (except self)');
  assert(task.createdBy === protocol.agentId, 'Task should be created by this agent');
  assert(task.requiredCapabilities.includes('code-analysis'), 'Required capabilities should be preserved');
  assert(task.createdAt, 'Task should have creation timestamp');
  
  // Verify task is stored
  const storedTask = protocol.tasks.get(task.id);
  assert(storedTask, 'Task should be stored in tasks map');
  assert(storedTask.description === taskData.description, 'Task data should be preserved');
  
  console.log('   ✅ Task creation working correctly');
  console.log(`   Task ID: ${task.id}`);
  console.log(`   Status: ${task.status}`);
});

// Test: Message Validation
runner.test('Message validation and structure', async () => {
  const { default: A2AProtocol } = await import('./index.js');
  
  const protocol = new A2AProtocol({
    networking: { port: 9098 },
    messaging: { validateSchema: true }
  });
  
  // Test valid message
  const validMessage = {
    id: 'test-message-1',
    type: 'test:message',
    from: 'agent-1',
    to: 'agent-2',
    data: { test: true },
    timestamp: Date.now()
  };
  
  const isValid = protocol.validateMessage(validMessage);
  assert(isValid === true, 'Valid message should pass validation');
  
  // Test invalid message (missing required field)
  const invalidMessage = {
    id: 'test-message-2',
    type: 'test:message',
    from: 'agent-1',
    // Missing 'to' field
    data: { test: true },
    timestamp: Date.now()
  };
  
  const isInvalid = protocol.validateMessage(invalidMessage);
  assert(isInvalid === false, 'Invalid message should fail validation');
  
  console.log('   ✅ Message validation working correctly');
});

// Test: Coordination Patterns
runner.test('Coordination pattern implementation', async () => {
  const { default: A2AProtocol } = await import('./index.js');
  
  const protocol = new A2AProtocol({
    networking: { port: 9099 },
    coordination: { defaultPattern: 'peer-to-peer' }
  });
  
  // Verify coordination patterns are initialized
  assert(protocol.coordinationPatterns, 'Coordination patterns should be initialized');
  assert(protocol.coordinationPatterns['peer-to-peer'], 'Peer-to-peer pattern should exist');
  assert(protocol.coordinationPatterns['consensus'], 'Consensus pattern should exist');
  assert(protocol.coordinationPatterns['hierarchical'], 'Hierarchical pattern should exist');
  
  // Test pattern structure
  const p2pPattern = protocol.coordinationPatterns['peer-to-peer'];
  assert(typeof p2pPattern.coordinate === 'function', 'Pattern should have coordinate method');
  assert(typeof p2pPattern.mergeResults === 'function', 'Pattern should have mergeResults method');
  
  // Test result merging
  const mockResults = [
    { analysis: 'result1', confidence: 0.8 },
    { analysis: 'result2', confidence: 0.9 },
    { analysis: 'result3', confidence: 0.7 }
  ];
  
  const mergedResult = await p2pPattern.mergeResults(mockResults, protocol);
  assert(mergedResult.type === 'peer-to-peer-result', 'Result should have correct type');
  assert(mergedResult.results.length === 3, 'All results should be included');
  assert(typeof mergedResult.confidence === 'number', 'Should have confidence score');
  
  console.log('   ✅ Coordination patterns working correctly');
  console.log(`   Available patterns: ${Object.keys(protocol.coordinationPatterns).join(', ')}`);
});

// Test: Agent Discovery
runner.test('Agent discovery and suitable agent finding', async () => {
  const { default: A2AProtocol } = await import('./index.js');
  
  const protocol = new A2AProtocol({
    networking: { port: 9100 },
    discovery: { enabled: false }
  });
  
  // Register current agent
  await protocol.registerAgent(['code-analysis', 'testing']);
  
  // Manually add some mock agents
  protocol.agents.set('agent-2', {
    id: 'agent-2',
    capabilities: ['documentation', 'code-analysis'],
    status: 'active',
    lastSeen: Date.now()
  });
  
  protocol.agents.set('agent-3', {
    id: 'agent-3',
    capabilities: ['testing', 'deployment'],
    status: 'active',
    lastSeen: Date.now()
  });
  
  // Test finding suitable agents
  const suitableForCodeAnalysis = protocol.findSuitableAgents(['code-analysis']);
  assert(suitableForCodeAnalysis.length === 1, 'Should find 1 agent with code-analysis');
  assert(suitableForCodeAnalysis[0].id === 'agent-2', 'Should find agent-2');
  
  const suitableForTesting = protocol.findSuitableAgents(['testing']);
  assert(suitableForTesting.length === 1, 'Should find 1 agent with testing');
  assert(suitableForTesting[0].id === 'agent-3', 'Should find agent-3');
  
  const suitableForMultiple = protocol.findSuitableAgents(['code-analysis', 'documentation']);
  assert(suitableForMultiple.length === 1, 'Should find 1 agent with both capabilities');
  
  const suitableForNone = protocol.findSuitableAgents(['non-existent-capability']);
  assert(suitableForNone.length === 0, 'Should find no agents for non-existent capability');
  
  console.log('   ✅ Agent discovery working correctly');
  console.log(`   Total agents: ${protocol.agents.size}`);
  console.log(`   Suitable for code-analysis: ${suitableForCodeAnalysis.length}`);
});

// Test: Configuration Merging
runner.test('Configuration merging and defaults', async () => {
  const { default: A2AProtocol } = await import('./index.js');
  
  const customConfig = {
    networking: {
      port: 8080,
      maxConnections: 50
    },
    coordination: {
      defaultPattern: 'consensus'
    },
    newSection: {
      customValue: true
    }
  };
  
  const protocol = new A2AProtocol(customConfig);
  
  // Test that custom values override defaults
  assert(protocol.config.networking.port === 8080, 'Custom port should override default');
  assert(protocol.config.coordination.defaultPattern === 'consensus', 'Custom pattern should override default');
  
  // Test that defaults are preserved when not overridden
  assert(protocol.config.networking.host === 'localhost', 'Default host should be preserved');
  assert(protocol.config.discovery.enabled === true, 'Default discovery should be preserved');
  
  // Test that new sections are added
  assert(protocol.config.newSection.customValue === true, 'New config sections should be added');
  
  console.log('   ✅ Configuration merging working correctly');
  console.log(`   Final port: ${protocol.config.networking.port}`);
  console.log(`   Final pattern: ${protocol.config.coordination.defaultPattern}`);
});

// Test: Metrics and Status
runner.test('Metrics collection and status reporting', async () => {
  const { default: A2AProtocol } = await import('./index.js');
  
  const protocol = new A2AProtocol({
    networking: { port: 9101 },
    monitoring: { enabled: true }
  });
  
  // Register agent and create task
  await protocol.registerAgent(['testing']);
  await protocol.createTask({ type: 'test' }, ['non-existent']);
  
  // Get metrics
  const metrics = protocol.getMetrics();
  
  assert(typeof metrics.messagesProcessed === 'number', 'Should track messages processed');
  assert(typeof metrics.tasksCompleted === 'number', 'Should track tasks completed');
  assert(typeof metrics.agentsConnected === 'number', 'Should track agents connected');
  assert(typeof metrics.errors === 'number', 'Should track errors');
  assert(typeof metrics.startTime === 'number', 'Should track start time');
  assert(typeof metrics.uptime === 'number', 'Should calculate uptime');
  
  // Get status
  const status = protocol.getStatus();
  
  assert(status.agentId === protocol.agentId, 'Status should include agent ID');
  assert(typeof status.isActive === 'boolean', 'Status should include active state');
  assert(typeof status.connectedAgents === 'number', 'Status should include connected agents count');
  assert(typeof status.activeTasks === 'number', 'Status should include active tasks count');
  assert(status.metrics, 'Status should include metrics');
  
  console.log('   ✅ Metrics and status working correctly');
  console.log(`   Uptime: ${metrics.uptime}ms`);
  console.log(`   Active state: ${status.isActive}`);
});

// Test: Message History Management
runner.test('Message history management', async () => {
  const { default: A2AProtocol } = await import('./index.js');
  
  const protocol = new A2AProtocol({
    networking: { port: 9102 },
    messaging: { messageHistory: 5 } // Small history for testing
  });
  
  // Add messages to history
  for (let i = 0; i < 7; i++) {
    const message = {
      id: `msg-${i}`,
      type: 'test',
      from: 'agent-1',
      to: 'agent-2',
      data: { index: i },
      timestamp: Date.now()
    };
    protocol.addToMessageHistory(message);
  }
  
  // Verify history is limited
  assert(protocol.messageHistory.length === 5, 'Message history should be limited to configured size');
  assert(protocol.messageHistory[0].data.index === 2, 'Oldest messages should be removed');
  assert(protocol.messageHistory[4].data.index === 6, 'Newest messages should be preserved');
  
  console.log('   ✅ Message history management working correctly');
  console.log(`   History size: ${protocol.messageHistory.length}`);
});

// Test: Error Handling
runner.test('Error handling and edge cases', async () => {
  const { default: A2AProtocol } = await import('./index.js');
  
  const protocol = new A2AProtocol({
    networking: { port: 9103 }
  });
  
  // Test error handling for non-existent task
  try {
    await protocol.participateInTask('non-existent-task', { result: 'test' });
    assert(false, 'Should throw error for non-existent task');
  } catch (error) {
    assert(error.message.includes('not found'), 'Should throw appropriate error message');
  }
  
  // Test error handling for unauthorized task completion
  await protocol.registerAgent(['testing']);
  const task = await protocol.createTask({ type: 'test' }, ['non-existent']);
  
  // Manually add a task created by another agent
  protocol.tasks.set('other-task', {
    id: 'other-task',
    createdBy: 'other-agent',
    status: 'pending'
  });
  
  try {
    await protocol.completeTask('other-task');
    assert(false, 'Should throw error for unauthorized completion');
  } catch (error) {
    assert(error.message.includes('Only task creator'), 'Should throw authorization error');
  }
  
  console.log('   ✅ Error handling working correctly');
});

// Run all tests
console.log('🚀 Starting Agent2Agent Protocol Tests...\n');

// Add environment info
console.log('Environment Info:');
console.log(`   Node.js: ${process.version}`);
console.log(`   Platform: ${process.platform}`);
console.log(`   Working Directory: ${process.cwd()}`);
console.log('');

runner.run().catch(error => {
  console.error('Fatal error running A2A protocol tests:', error);
  process.exit(1);
});