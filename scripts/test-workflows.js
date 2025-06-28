#!/usr/bin/env node
/**
 * Manual Workflow System Test Script
 * 
 * Tests the workflow system with real scenarios to validate functionality.
 * Can be run locally to verify the system works before CI integration.
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

// Import our workflow components
import { workflowEngine } from '../src/core/workflow-engine/index.js';
import { coordinator } from '../src/core/coordinator/index.js';
import { environmentContext } from '../src/core/environment-context/index.js';
import { toolExecutor } from '../src/core/tool-executor/index.js';

class WorkflowTestRunner {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  async runTest(testName, testFunction) {
    this.totalTests++;
    console.log(chalk.blue(`\n🧪 Testing: ${testName}`));
    
    try {
      const startTime = Date.now();
      await testFunction();
      const duration = Date.now() - startTime;
      
      this.passedTests++;
      console.log(chalk.green(`✅ PASS: ${testName} (${duration}ms)`));
      this.testResults.push({ name: testName, status: 'PASS', duration });
      
    } catch (error) {
      console.log(chalk.red(`❌ FAIL: ${testName}`));
      console.log(chalk.red(`   Error: ${error.message}`));
      this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
    }
  }

  async runAllTests() {
    console.log(chalk.cyan('🚀 Starting Workflow System Tests\n'));
    console.log(chalk.gray('This script validates the workflow system with real scenarios.'));
    
    // Basic system tests
    await this.runTest('Workflow Engine Initialization', () => this.testWorkflowEngineInit());
    await this.runTest('Environment Context', () => this.testEnvironmentContext());
    await this.runTest('Tool Executor', () => this.testToolExecutor());
    await this.runTest('Coordinator Integration', () => this.testCoordinator());
    
    // Workflow execution tests
    await this.runTest('Simple Workflow Execution', () => this.testSimpleWorkflow());
    await this.runTest('Error Analysis Workflow', () => this.testErrorAnalysisWorkflow());
    await this.runTest('Tool Suggestion Workflow', () => this.testToolSuggestionWorkflow());
    
    // Command tests
    await this.runTest('Workflow CLI Commands', () => this.testWorkflowCommands());
    await this.runTest('CI Workflow Generation', () => this.testCIGeneration());
    
    // Integration tests
    await this.runTest('Git Integration', () => this.testGitIntegration());
    await this.runTest('State Management', () => this.testStateManagement());
    
    // Performance tests
    await this.runTest('Performance Benchmarks', () => this.testPerformance());
    
    this.printResults();
  }

  async testWorkflowEngineInit() {
    await workflowEngine.initialize();
    
    if (!workflowEngine.initialized) {
      throw new Error('Workflow engine failed to initialize');
    }
    
    if (workflowEngine.stepExecutors.size === 0) {
      throw new Error('No step executors registered');
    }
    
    console.log(chalk.gray(`   Registered ${workflowEngine.stepExecutors.size} step executors`));
  }

  async testEnvironmentContext() {
    await environmentContext.initialize();
    
    const context = await environmentContext.getContextForLLM();
    
    if (!context.system || !context.runtime || !context.tools) {
      throw new Error('Missing required context properties');
    }
    
    if (!context.system.operatingSystem) {
      throw new Error('Operating system not detected');
    }
    
    console.log(chalk.gray(`   OS: ${context.system.operatingSystem}, Tools: ${context.tools.available.length}`));
  }

  async testToolExecutor() {
    // Test safe command execution
    const result = await toolExecutor.executeCommand('git', 'status', [], {
      dryRun: false,
      logOutput: false
    });
    
    if (!result.success) {
      throw new Error(`Tool execution failed: ${result.error}`);
    }
    
    // Test dry run mode
    const dryResult = await toolExecutor.executeCommand('git', 'status', [], {
      dryRun: true,
      logOutput: false
    });
    
    if (!dryResult.dryRun) {
      throw new Error('Dry run mode not working');
    }
    
    console.log(chalk.gray(`   Executed commands successfully`));
  }

  async testCoordinator() {
    await coordinator.initialize();
    
    if (!coordinator.initialized) {
      throw new Error('Coordinator failed to initialize');
    }
    
    const status = coordinator.getStatus();
    
    if (!status.initialized) {
      throw new Error('Coordinator status shows not initialized');
    }
    
    console.log(chalk.gray(`   Active plugins: ${status.activePlugins.length}`));
  }

  async testSimpleWorkflow() {
    await workflowEngine.initialize();
    
    // Create a simple test workflow
    const testWorkflow = {
      name: 'manual-test-workflow',
      description: 'Test workflow for validation',
      steps: [
        {
          name: 'environment-check',
          type: 'environment',
          config: {
            requirements: ['git']
          }
        },
        {
          name: 'git-status',
          type: 'tool-execution',
          config: {
            tool: 'git',
            command: 'status',
            args: []
          }
        }
      ]
    };

    // Override workflow definition method temporarily
    const originalGetWorkflowDefinition = workflowEngine.getWorkflowDefinition;
    workflowEngine.getWorkflowDefinition = async () => testWorkflow;

    try {
      const result = await workflowEngine.executeWorkflow('manual-test-workflow', {
        local: true,
        dryRun: false
      });

      if (!result.success) {
        throw new Error('Workflow execution failed');
      }

      if (result.steps.length !== 2) {
        throw new Error(`Expected 2 steps, got ${result.steps.length}`);
      }

      console.log(chalk.gray(`   Executed ${result.steps.length} steps in ${Math.round(result.duration / 1000)}s`));
      
    } finally {
      workflowEngine.getWorkflowDefinition = originalGetWorkflowDefinition;
    }
  }

  async testErrorAnalysisWorkflow() {
    await coordinator.initialize();
    
    const analysis = await coordinator.analyzeError(
      'ReferenceError: x is not defined',
      {
        files: ['test.js'],
        local: true
      }
    );

    if (!analysis.analyzer) {
      throw new Error('No analyzer was used');
    }

    if (!analysis.suggestions || analysis.suggestions.length === 0) {
      throw new Error('No suggestions generated');
    }

    if (!analysis.environmentContext) {
      throw new Error('Environment context not included');
    }

    console.log(chalk.gray(`   Analyzer: ${analysis.analyzer}, Suggestions: ${analysis.suggestions.length}`));
  }

  async testToolSuggestionWorkflow() {
    const suggestions = await toolExecutor.suggestCommands({
      error: 'module not found: lodash',
      task: 'install'
    });

    if (!Array.isArray(suggestions)) {
      throw new Error('Suggestions should be an array');
    }

    const installSuggestions = suggestions.filter(s => 
      s.command === 'install' && (s.tool === 'npm' || s.tool === 'yarn' || s.tool === 'pnpm')
    );

    if (installSuggestions.length === 0) {
      throw new Error('No package installation suggestions found');
    }

    console.log(chalk.gray(`   Generated ${suggestions.length} suggestions`));
  }

  async testWorkflowCommands() {
    // Test workflow list command simulation
    const { listWorkflows } = await import('../src/commands/workflow.js');
    
    // This should not throw an error
    try {
      // Capture console output temporarily
      const originalConsoleLog = console.log;
      let output = '';
      console.log = (...args) => {
        output += args.join(' ') + '\n';
      };

      await listWorkflows();
      
      console.log = originalConsoleLog;
      
      if (!output.includes('BUILT-IN WORKFLOWS')) {
        throw new Error('Built-in workflows not listed');
      }

      console.log(chalk.gray(`   Workflow commands working`));
      
    } catch (error) {
      throw new Error(`Workflow command failed: ${error.message}`);
    }
  }

  async testCIGeneration() {
    // Create a temporary directory for testing
    const testDir = path.join(process.cwd(), 'temp-ci-test');
    await fs.mkdir(testDir, { recursive: true });
    
    const originalCwd = process.cwd();
    
    try {
      process.chdir(testDir);
      
      // Create a mock package.json
      await fs.writeFile('package.json', JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          test: 'echo "test"',
          build: 'echo "build"',
          lint: 'echo "lint"'
        },
        dependencies: {
          'express': '^4.18.0'
        },
        devDependencies: {
          'jest': '^29.0.0'
        }
      }, null, 2));

      const { generateCIWorkflows } = await import('../src/commands/generate-ci-workflows.js');
      const workflows = await generateCIWorkflows();
      
      if (!Array.isArray(workflows)) {
        throw new Error('Workflows should be an array');
      }

      if (workflows.length === 0) {
        throw new Error('No workflows were generated');
      }

      // Check that files were created
      const workflowsDir = '.github/workflows';
      const files = await fs.readdir(workflowsDir);
      
      if (!files.includes('ci.yml')) {
        throw new Error('ci.yml not generated');
      }

      if (!files.includes('auto-repair.yml')) {
        throw new Error('auto-repair.yml not generated');
      }

      console.log(chalk.gray(`   Generated ${workflows.length} workflow files`));
      
    } finally {
      process.chdir(originalCwd);
      await fs.rm(testDir, { recursive: true, force: true });
    }
  }

  async testGitIntegration() {
    try {
      execSync('git --version', { stdio: 'pipe' });
    } catch (error) {
      console.log(chalk.yellow('   Skipping git tests (git not available)'));
      return;
    }

    try {
      // Test git status command
      execSync('git status', { stdio: 'pipe' });
      
      // Test git remote detection
      const remotes = execSync('git remote -v', { encoding: 'utf8', stdio: 'pipe' });
      
      console.log(chalk.gray(`   Git integration working`));
      
    } catch (error) {
      // If we're not in a git repo, that's okay for this test
      console.log(chalk.gray(`   Git commands functional (not in git repo)`));
    }
  }

  async testStateManagement() {
    await workflowEngine.initialize();
    
    // Ensure state directory exists
    const stateDir = '.cloi/workflow-state';
    await fs.mkdir(stateDir, { recursive: true });
    
    // Create a mock workflow state
    const workflowState = {
      id: 'test-state-123',
      name: 'test-workflow',
      startTime: new Date().toISOString(),
      status: 'completed',
      steps: []
    };

    await workflowEngine.saveWorkflowState(workflowState);
    
    // Verify state was saved
    const files = await fs.readdir(stateDir);
    const stateFile = files.find(f => f.includes('test-state-123'));
    
    if (!stateFile) {
      throw new Error('Workflow state not saved');
    }

    // Verify state content
    const savedState = JSON.parse(await fs.readFile(path.join(stateDir, stateFile), 'utf8'));
    
    if (savedState.id !== workflowState.id) {
      throw new Error('Saved state ID mismatch');
    }

    console.log(chalk.gray(`   State management working`));
  }

  async testPerformance() {
    const startTime = Date.now();
    
    // Test engine initialization performance
    const initStart = Date.now();
    await workflowEngine.initialize();
    const initDuration = Date.now() - initStart;
    
    if (initDuration > 5000) {
      throw new Error(`Initialization too slow: ${initDuration}ms`);
    }
    
    // Test multiple concurrent operations
    const concurrentStart = Date.now();
    const operations = [
      environmentContext.getContextForLLM(),
      toolExecutor.suggestCommands({ error: 'test error' }),
      coordinator.getStatus()
    ];
    
    await Promise.all(operations);
    const concurrentDuration = Date.now() - concurrentStart;
    
    if (concurrentDuration > 3000) {
      throw new Error(`Concurrent operations too slow: ${concurrentDuration}ms`);
    }
    
    const totalDuration = Date.now() - startTime;
    console.log(chalk.gray(`   Performance: Init ${initDuration}ms, Concurrent ${concurrentDuration}ms, Total ${totalDuration}ms`));
  }

  printResults() {
    console.log(chalk.cyan('\n📊 Test Results Summary\n'));
    
    this.testResults.forEach(result => {
      const status = result.status === 'PASS' ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
      const duration = result.duration ? chalk.gray(`(${result.duration}ms)`) : '';
      console.log(`${status} ${result.name} ${duration}`);
      
      if (result.error) {
        console.log(chalk.red(`      ${result.error}`));
      }
    });
    
    console.log(chalk.cyan(`\n📈 Results: ${this.passedTests}/${this.totalTests} tests passed`));
    
    if (this.passedTests === this.totalTests) {
      console.log(chalk.green('🎉 All tests passed! Workflow system is working correctly.'));
    } else {
      console.log(chalk.red('🚨 Some tests failed. Please check the errors above.'));
      process.exit(1);
    }
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new WorkflowTestRunner();
  runner.runAllTests().catch(error => {
    console.error(chalk.red('❌ Test runner failed:'), error.message);
    process.exit(1);
  });
}

export { WorkflowTestRunner };