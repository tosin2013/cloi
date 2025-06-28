/**
 * Workflow System Tests
 * 
 * Comprehensive tests for the workflow engine, commands, and integrations.
 * Tests both local execution and CI environment scenarios.
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { workflowEngine } from '../src/core/workflow-engine/index.js';
import { coordinator } from '../src/core/coordinator/index.js';
import { environmentContext } from '../src/core/environment-context/index.js';
import { toolExecutor } from '../src/core/tool-executor/index.js';
import { generateCIWorkflows } from '../src/commands/generate-ci-workflows.js';
import { runUpstreamSync } from '../src/commands/upstream-sync.js';

describe('Workflow System', function() {
  this.timeout(30000); // 30 seconds for workflow tests

  beforeEach(async function() {
    console.log(chalk.blue('🧪 Setting up test environment...'));
    
    // Clean up any existing workflow state
    try {
      await fs.rm('.cloi', { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist, that's okay
    }
  });

  afterEach(async function() {
    // Clean up after tests
    try {
      await workflowEngine.shutdown?.();
    } catch (error) {
      // Engine might not be running
    }
  });

  describe('Workflow Engine Core', function() {
    it('should initialize workflow engine successfully', async function() {
      const result = await workflowEngine.initialize();
      expect(workflowEngine.initialized).to.be.true;
      expect(workflowEngine.stepExecutors.size).to.be.greaterThan(0);
    });

    it('should register step executors', async function() {
      await workflowEngine.initialize();
      
      const expectedExecutors = [
        'analysis', 'environment', 'tool-execution', 
        'git-operations', 'validation', 'review-analysis'
      ];
      
      expectedExecutors.forEach(executor => {
        expect(workflowEngine.stepExecutors.has(executor)).to.be.true;
      });
    });

    it('should detect CI environment correctly', function() {
      const originalCI = process.env.CI;
      
      // Test CI detection
      process.env.CI = 'true';
      const isCI = workflowEngine.detectCIEnvironment();
      expect(isCI).to.be.true;
      
      // Test local detection
      delete process.env.CI;
      const isLocal = workflowEngine.detectCIEnvironment();
      expect(isLocal).to.be.false;
      
      // Restore original value
      if (originalCI) {
        process.env.CI = originalCI;
      }
    });

    it('should generate workflow IDs', function() {
      const id1 = workflowEngine.generateWorkflowId('test-workflow');
      const id2 = workflowEngine.generateWorkflowId('test-workflow');
      
      expect(id1).to.include('test-workflow');
      expect(id2).to.include('test-workflow');
      expect(id1).to.not.equal(id2); // Should be unique
    });
  });

  describe('Environment Integration', function() {
    it('should initialize environment context', async function() {
      await environmentContext.initialize();
      const context = await environmentContext.getContextForLLM();
      
      expect(context).to.have.property('system');
      expect(context).to.have.property('runtime');
      expect(context).to.have.property('tools');
      expect(context).to.have.property('project');
      expect(context.system).to.have.property('operatingSystem');
      expect(context.runtime).to.have.property('nodejs');
    });

    it('should detect available tools', async function() {
      await environmentContext.initialize();
      const context = await environmentContext.getContextForLLM();
      
      expect(context.tools.available).to.be.an('array');
      expect(context.tools.available).to.include('git'); // git should be available in most environments
    });

    it('should provide A2A context', async function() {
      await environmentContext.initialize();
      const context = await environmentContext.getContextForA2A();
      
      expect(context).to.have.property('system');
      expect(context).to.have.property('capabilities');
      expect(context).to.have.property('constraints');
    });
  });

  describe('Tool Executor', function() {
    it('should execute safe commands', async function() {
      const result = await toolExecutor.executeCommand('git', 'status', [], {
        dryRun: false,
        logOutput: false
      });
      
      expect(result).to.have.property('success');
      expect(result).to.have.property('output');
      expect(result).to.have.property('command');
    });

    it('should handle dry run mode', async function() {
      const result = await toolExecutor.executeCommand('git', 'status', [], {
        dryRun: true,
        logOutput: false
      });
      
      expect(result.success).to.be.true;
      expect(result.dryRun).to.be.true;
      expect(result.output).to.include('DRY RUN');
    });

    it('should suggest commands based on context', async function() {
      const suggestions = await toolExecutor.suggestCommands({
        error: 'module not found',
        task: 'test'
      });
      
      expect(suggestions).to.be.an('array');
      // Should suggest package manager commands for missing modules
      const packageSuggestions = suggestions.filter(s => 
        s.tool === 'npm' || s.tool === 'yarn' || s.tool === 'pnpm'
      );
      expect(packageSuggestions.length).to.be.greaterThan(0);
    });

    it('should validate command safety', function() {
      expect(toolExecutor.isCommandSafe('git', 'status')).to.be.true;
      expect(toolExecutor.isCommandSafe('git', 'reset-hard')).to.be.false;
      expect(toolExecutor.isCommandDangerous('npm', 'audit-fix')).to.be.true;
    });
  });

  describe('Simple Workflow Execution', function() {
    it('should execute a basic workflow', async function() {
      await workflowEngine.initialize();
      
      const simpleWorkflow = {
        name: 'test-workflow',
        description: 'A simple test workflow',
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

      // Mock workflow definition loading
      workflowEngine.getWorkflowDefinition = async () => simpleWorkflow;

      const result = await workflowEngine.executeWorkflow('test-workflow', {
        local: true,
        dryRun: false
      });

      expect(result.success).to.be.true;
      expect(result.steps).to.have.length(2);
      expect(result.steps[0].name).to.equal('environment-check');
      expect(result.steps[1].name).to.equal('git-status');
    });

    it('should handle workflow step failures', async function() {
      await workflowEngine.initialize();
      
      const failingWorkflow = {
        name: 'failing-workflow',
        description: 'A workflow that should fail',
        steps: [
          {
            name: 'invalid-command',
            type: 'tool-execution',
            config: {
              tool: 'nonexistent-tool',
              command: 'invalid',
              args: []
            }
          }
        ]
      };

      workflowEngine.getWorkflowDefinition = async () => failingWorkflow;

      try {
        await workflowEngine.executeWorkflow('failing-workflow', { local: true });
        expect.fail('Workflow should have failed');
      } catch (error) {
        expect(error.message).to.include('failed');
      }
    });
  });

  describe('CI Workflow Generator', function() {
    it('should analyze project and detect configuration', async function() {
      const generator = new (await import('../src/commands/generate-ci-workflows.js')).CIWorkflowGenerator();
      
      await environmentContext.initialize();
      const envContext = await environmentContext.getContextForLLM();
      
      const config = await generator.detectProjectConfiguration(envContext);
      
      expect(config).to.have.property('type');
      expect(config).to.have.property('languages');
      expect(config).to.have.property('packageManager');
      expect(config.languages).to.be.an('array');
    });

    it('should generate workflow files', async function() {
      // Create a temporary test directory
      const testDir = path.join(process.cwd(), 'test-temp-workflows');
      await fs.mkdir(testDir, { recursive: true });
      
      const originalCwd = process.cwd();
      
      try {
        process.chdir(testDir);
        
        // Create a mock package.json to make it look like a Node.js project
        await fs.writeFile('package.json', JSON.stringify({
          name: 'test-project',
          version: '1.0.0',
          scripts: {
            test: 'echo "test"',
            build: 'echo "build"'
          }
        }));

        const generator = new (await import('../src/commands/generate-ci-workflows.js')).CIWorkflowGenerator();
        const workflows = await generator.generateWorkflows();
        
        expect(workflows).to.be.an('array');
        expect(workflows.length).to.be.greaterThan(0);
        
        // Check that workflow files were created
        const workflowsDir = '.github/workflows';
        const files = await fs.readdir(workflowsDir);
        expect(files.length).to.be.greaterThan(0);
        expect(files).to.include('ci.yml');
        expect(files).to.include('auto-repair.yml');
        
      } finally {
        process.chdir(originalCwd);
        await fs.rm(testDir, { recursive: true, force: true });
      }
    });
  });

  describe('Error Analysis Integration', function() {
    it('should analyze errors with environment context', async function() {
      await coordinator.initialize();
      
      const analysis = await coordinator.analyzeError(
        'ReferenceError: x is not defined',
        {
          files: ['test.js'],
          local: true
        }
      );

      expect(analysis).to.have.property('analyzer');
      expect(analysis).to.have.property('language');
      expect(analysis).to.have.property('suggestions');
      expect(analysis).to.have.property('environmentContext');
      expect(analysis.suggestions).to.be.an('array');
    });

    it('should enhance analysis with tool suggestions', async function() {
      await coordinator.initialize();
      
      const analysis = await coordinator.analyzeError(
        'Module not found: lodash',
        {
          files: ['package.json'],
          local: true
        }
      );

      expect(analysis.suggestions).to.be.an('array');
      
      // Should include tool execution suggestions
      const toolSuggestions = analysis.suggestions.filter(s => 
        s.type === 'tool-execution'
      );
      expect(toolSuggestions.length).to.be.greaterThan(0);
      
      // Should include executable commands
      expect(analysis).to.have.property('executableCommands');
    });
  });

  describe('Workflow State Management', function() {
    it('should save workflow state', async function() {
      await workflowEngine.initialize();
      
      // Execute a simple workflow
      const result = await workflowEngine.executeWorkflow('test-state', {
        local: true
      }, { dryRun: true });

      // Check that state was saved
      const stateDir = '.cloi/workflow-state';
      const files = await fs.readdir(stateDir);
      expect(files.length).to.be.greaterThan(0);
      
      // Read and validate state file
      const stateFile = files.find(f => f.includes('test-state'));
      expect(stateFile).to.exist;
      
      const stateContent = await fs.readFile(path.join(stateDir, stateFile), 'utf8');
      const state = JSON.parse(stateContent);
      
      expect(state).to.have.property('id');
      expect(state).to.have.property('name');
      expect(state).to.have.property('startTime');
      expect(state).to.have.property('status');
    });
  });

  // Integration tests that require actual git setup
  describe('Git Integration Tests', function() {
    let testRepo;
    
    beforeEach(async function() {
      // Skip git tests if git is not available
      try {
        execSync('git --version', { stdio: 'pipe' });
      } catch (error) {
        this.skip();
      }

      // Create a temporary git repo for testing
      testRepo = path.join(process.cwd(), 'test-git-repo');
      await fs.mkdir(testRepo, { recursive: true });
      
      const originalCwd = process.cwd();
      process.chdir(testRepo);
      
      try {
        execSync('git init', { stdio: 'pipe' });
        execSync('git config user.name "Test User"', { stdio: 'pipe' });
        execSync('git config user.email "test@example.com"', { stdio: 'pipe' });
        
        // Create initial commit
        await fs.writeFile('README.md', '# Test Repo\n');
        execSync('git add README.md', { stdio: 'pipe' });
        execSync('git commit -m "Initial commit"', { stdio: 'pipe' });
        
      } finally {
        process.chdir(originalCwd);
      }
    });

    afterEach(async function() {
      if (testRepo) {
        await fs.rm(testRepo, { recursive: true, force: true });
      }
    });

    it('should detect git repository configuration', async function() {
      const originalCwd = process.cwd();
      process.chdir(testRepo);
      
      try {
        const { UpstreamSyncWorkflow } = await import('../src/commands/upstream-sync.js');
        const syncWorkflow = new UpstreamSyncWorkflow();
        
        const config = await syncWorkflow.detectUpstreamConfiguration();
        
        expect(config).to.have.property('hasUpstream');
        // Might not have upstream, but should detect git repo
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('Performance Tests', function() {
    it('should initialize workflow engine quickly', async function() {
      const start = Date.now();
      await workflowEngine.initialize();
      const duration = Date.now() - start;
      
      expect(duration).to.be.lessThan(5000); // Should initialize within 5 seconds
    });

    it('should handle multiple concurrent workflows', async function() {
      await workflowEngine.initialize();
      
      const workflows = Array.from({ length: 3 }, (_, i) => 
        workflowEngine.executeWorkflow(`concurrent-test-${i}`, {
          local: true
        }, { dryRun: true })
      );

      const results = await Promise.all(workflows);
      
      expect(results).to.have.length(3);
      results.forEach(result => {
        expect(result.success).to.be.true;
      });
    });
  });
});

// Helper function to run tests
export async function runWorkflowTests() {
  console.log(chalk.blue('🧪 Running Workflow System Tests...'));
  
  try {
    // This would integrate with the test runner
    console.log(chalk.green('✅ All workflow tests would run here'));
    console.log(chalk.gray('   Tests cover: engine, commands, integrations, git, performance'));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Workflow tests failed:'), error.message);
    return false;
  }
}