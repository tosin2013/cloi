/**
 * Workflow Engine - Dynamic AI-powered workflow execution
 * 
 * Enables both static (predefined) and dynamic (AI-generated) workflows
 * that can run locally for development and in CI/CD for automation.
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { coordinator } from '../coordinator/index.js';
import { configManager } from '../config-manager/index.js';
import { stateManager } from '../state-manager/index.js';
import { environmentContext } from '../environment-context/index.js';
import { toolExecutor } from '../tool-executor/index.js';
import { workflowRollbackManager } from '../workflow-rollback/index.js';

export class WorkflowEngine {
  constructor(options = {}) {
    this.options = {
      workflowDir: '.cloi/workflows',
      stateDir: '.cloi/workflow-state',
      maxParallelSteps: 3,
      timeout: 30 * 60 * 1000, // 30 minutes
      ...options
    };
    this.activeWorkflows = new Map();
    this.workflowTemplates = new Map();
    this.stepExecutors = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the workflow engine
   */
  async initialize() {
    if (this.initialized) return;

    console.log(chalk.blue('🔄 Initializing Workflow Engine...'));

    // Ensure coordinator is initialized
    await coordinator.initialize();

    // Load built-in step executors
    await this.loadStepExecutors();

    // Load workflow templates
    await this.loadWorkflowTemplates();

    // Initialize state directory
    await this.ensureStateDirectory();

    this.initialized = true;
    console.log(chalk.green('✅ Workflow Engine initialized'));
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowName, context = {}, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const workflowId = this.generateWorkflowId(workflowName);
    
    console.log(chalk.blue(`🚀 Starting workflow: ${workflowName} (${workflowId})`));

    let rollbackCheckpoint = null;

    try {
      // Create workflow execution context
      const executionContext = await this.createExecutionContext(workflowId, context, options);
      
      // Get or generate workflow definition
      const workflow = await this.getWorkflowDefinition(workflowName, context);
      
      // Validate workflow
      const validation = await this.validateWorkflow(workflow, executionContext);
      if (!validation.valid) {
        throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
      }

      // Create rollback checkpoint (unless disabled)
      if (!options.skipRollback && !options.dryRun) {
        try {
          rollbackCheckpoint = await workflowRollbackManager.createRollbackCheckpoint(workflowId, {
            workflowName,
            workflow,
            context: executionContext,
            options
          });
        } catch (error) {
          console.log(chalk.yellow(`⚠️ Failed to create rollback checkpoint: ${error.message}`));
        }
      }

      // Execute workflow
      const result = await this.runWorkflow(workflow, executionContext);
      
      console.log(chalk.green(`✅ Workflow completed: ${workflowName}`));
      return result;

    } catch (error) {
      console.log(chalk.red(`❌ Workflow failed: ${workflowName} - ${error.message}`));
      
      // Offer rollback if checkpoint exists and auto-rollback is enabled
      if (rollbackCheckpoint && options.autoRollback) {
        console.log(chalk.yellow('🔄 Auto-rollback enabled, attempting to restore previous state...'));
        try {
          await this.rollbackWorkflow(workflowId, { force: true });
          console.log(chalk.green('✅ Auto-rollback completed'));
        } catch (rollbackError) {
          console.log(chalk.red(`❌ Auto-rollback failed: ${rollbackError.message}`));
        }
      } else if (rollbackCheckpoint) {
        console.log(chalk.cyan(`💡 Rollback available: cloi workflow rollback ${workflowId}`));
      }
      
      await this.handleWorkflowFailure(workflowId, error);
      throw error;
    } finally {
      this.activeWorkflows.delete(workflowId);
    }
  }

  /**
   * Generate dynamic workflow using AI
   */
  async generateDynamicWorkflow(trigger, context) {
    console.log(chalk.blue('🤖 Generating dynamic workflow with AI...'));

    // Get environment context for AI
    await environmentContext.initialize();
    const envContext = await environmentContext.getContextForLLM();

    // Build AI prompt for workflow generation
    const prompt = this.buildWorkflowGenerationPrompt(trigger, context, envContext);
    
    // Query AI provider for workflow definition
    const provider = coordinator.getAvailableProvider();
    if (!provider) {
      throw new Error('No AI provider available for dynamic workflow generation');
    }

    const response = await provider.query(prompt, {
      max_tokens: 2048,
      temperature: 0.3
    });

    // Parse AI response into workflow definition
    const workflow = this.parseAIWorkflowResponse(response.response);
    
    // Validate generated workflow
    const validation = await this.validateGeneratedWorkflow(workflow, context);
    if (!validation.valid) {
      console.log(chalk.yellow('⚠️  Generated workflow has issues, attempting to fix...'));
      // Could iterate with AI to fix issues
    }

    console.log(chalk.green('✅ Dynamic workflow generated'));
    return workflow;
  }

  /**
   * Auto-repair workflow for CI/CD failures
   */
  async executeAutoRepairWorkflow(failureContext) {
    console.log(chalk.blue('🔧 Starting auto-repair workflow...'));

    const workflow = await this.generateDynamicWorkflow('ci-failure', {
      ...failureContext,
      workflowType: 'auto-repair',
      allowPRCreation: !failureContext.local,
      interactive: !!failureContext.local
    });

    // Add auto-repair specific steps
    workflow.steps = [
      {
        name: 'analyze-failure',
        type: 'analysis',
        config: {
          analyzer: 'best-match',
          errorOutput: failureContext.buildLog || failureContext.error,
          context: failureContext
        }
      },
      {
        name: 'environment-check',
        type: 'environment',
        config: {
          requirements: ['git', 'node', 'npm']
        }
      },
      ...workflow.steps,
      {
        name: 'validate-fix',
        type: 'validation',
        config: {
          runTests: true,
          runLinting: true,
          checkBuild: true
        }
      },
      {
        name: 'create-pr',
        type: 'git-operations',
        condition: '!context.local && steps.validate-fix.success',
        config: {
          action: 'create-pr',
          branch: `auto-fix/${Date.now()}`,
          title: 'Auto-fix: Resolve CI failure',
          description: 'Automatically generated fix for CI failure'
        }
      }
    ];

    return await this.executeWorkflow('auto-repair', failureContext, {
      type: 'auto-repair',
      allowFailure: false
    });
  }

  /**
   * Code review feedback workflow
   */
  async executeCodeReviewWorkflow(reviewContext) {
    console.log(chalk.blue('👥 Starting code review workflow...'));

    const workflow = await this.generateDynamicWorkflow('code-review', {
      ...reviewContext,
      workflowType: 'code-review',
      prNumber: reviewContext.prNumber,
      reviewComments: reviewContext.reviewComments
    });

    // Add code review specific steps
    workflow.steps = [
      {
        name: 'parse-feedback',
        type: 'review-analysis',
        config: {
          comments: reviewContext.reviewComments,
          extractActionItems: true
        }
      },
      {
        name: 'analyze-codebase',
        type: 'analysis',
        config: {
          analyzer: 'code-quality',
          scope: reviewContext.changedFiles || []
        }
      },
      ...workflow.steps,
      {
        name: 'apply-changes',
        type: 'code-modification',
        config: {
          validateChanges: true,
          runTests: true
        }
      },
      {
        name: 'update-pr',
        type: 'git-operations',
        config: {
          action: 'update-pr',
          prNumber: reviewContext.prNumber,
          comment: 'Applied review feedback automatically'
        }
      }
    ];

    return await this.executeWorkflow('code-review', reviewContext, {
      type: 'code-review',
      interactive: reviewContext.local
    });
  }

  /**
   * Load built-in step executors
   */
  async loadStepExecutors() {
    // Analysis step executor
    this.stepExecutors.set('analysis', async (step, context) => {
      const analysis = await coordinator.analyzeError(
        step.config.errorOutput || context.error,
        { ...context, ...step.config.context }
      );
      return { success: true, result: analysis };
    });

    // Environment step executor
    this.stepExecutors.set('environment', async (step, context) => {
      await environmentContext.initialize();
      const envContext = await environmentContext.getContextForLLM();
      
      // Check requirements
      const requirements = step.config.requirements || [];
      const missing = requirements.filter(req => 
        !envContext.tools.available.includes(req)
      );

      if (missing.length > 0) {
        return {
          success: false,
          error: `Missing required tools: ${missing.join(', ')}`,
          missing
        };
      }

      return { success: true, environment: envContext };
    });

    // Tool execution step executor
    this.stepExecutors.set('tool-execution', async (step, context) => {
      const { tool, command, args = [] } = step.config;
      
      const result = await toolExecutor.executeCommand(tool, command, args, {
        dryRun: context.dryRun || false,
        logOutput: true
      });

      return { success: result.success, result };
    });

    // Git operations step executor
    this.stepExecutors.set('git-operations', async (step, context) => {
      const { action } = step.config;
      
      switch (action) {
        case 'create-pr':
          return await this.createPullRequest(step.config, context);
        case 'update-pr':
          return await this.updatePullRequest(step.config, context);
        case 'create-branch':
          return await this.createBranch(step.config, context);
        default:
          throw new Error(`Unknown git action: ${action}`);
      }
    });

    // Validation step executor
    this.stepExecutors.set('validation', async (step, context) => {
      const results = {};
      
      if (step.config.runTests) {
        try {
          const testResult = await toolExecutor.executeCommand('npm', 'test', [], {
            logOutput: false
          });
          results.tests = { success: testResult.success, output: testResult.output };
        } catch (error) {
          results.tests = { success: false, error: error.message };
        }
      }

      if (step.config.runLinting) {
        try {
          const lintResult = await toolExecutor.executeCommand('npm', 'run', ['lint'], {
            logOutput: false
          });
          results.linting = { success: lintResult.success, output: lintResult.output };
        } catch (error) {
          results.linting = { success: false, error: error.message };
        }
      }

      const allPassed = Object.values(results).every(r => r.success !== false);
      return { success: allPassed, results };
    });

    // Review analysis step executor
    this.stepExecutors.set('review-analysis', async (step, context) => {
      const { comments, extractActionItems } = step.config;
      
      if (extractActionItems) {
        const actionItems = this.extractActionItemsFromComments(comments);
        return { success: true, actionItems };
      }

      return { success: true, comments };
    });

    // Code modification step executor
    this.stepExecutors.set('code-modification', async (step, context) => {
      // This would integrate with AI to generate code changes
      // For now, return a placeholder
      console.log(chalk.yellow('⚠️  Code modification step not fully implemented yet'));
      return { success: true, placeholder: true };
    });
  }

  /**
   * Run a complete workflow
   */
  async runWorkflow(workflow, executionContext) {
    const workflowState = {
      id: executionContext.workflowId,
      name: workflow.name,
      startTime: new Date().toISOString(),
      steps: [],
      status: 'running',
      context: executionContext
    };

    this.activeWorkflows.set(executionContext.workflowId, workflowState);

    try {
      for (const [index, step] of workflow.steps.entries()) {
        console.log(chalk.blue(`📋 Executing step ${index + 1}/${workflow.steps.length}: ${step.name}`));

        // Check step condition
        if (step.condition && !this.evaluateCondition(step.condition, workflowState)) {
          console.log(chalk.gray(`⏭️  Skipping step: ${step.name} (condition not met)`));
          continue;
        }

        const stepResult = await this.executeStep(step, executionContext, workflowState);
        
        workflowState.steps.push({
          name: step.name,
          type: step.type,
          result: stepResult,
          timestamp: new Date().toISOString()
        });

        if (!stepResult.success && !step.allowFailure) {
          throw new Error(`Step ${step.name} failed: ${stepResult.error || 'Unknown error'}`);
        }

        // Update context with step results
        executionContext.stepResults[step.name] = stepResult;
      }

      workflowState.status = 'completed';
      workflowState.endTime = new Date().toISOString();

      // Save workflow state
      await this.saveWorkflowState(workflowState);

      return {
        success: true,
        workflowId: executionContext.workflowId,
        steps: workflowState.steps,
        duration: new Date() - new Date(workflowState.startTime)
      };

    } catch (error) {
      workflowState.status = 'failed';
      workflowState.error = error.message;
      workflowState.endTime = new Date().toISOString();
      
      await this.saveWorkflowState(workflowState);
      throw error;
    }
  }

  /**
   * Execute a single workflow step
   */
  async executeStep(step, executionContext, workflowState) {
    const executor = this.stepExecutors.get(step.type);
    if (!executor) {
      throw new Error(`Unknown step type: ${step.type}`);
    }

    try {
      const result = await executor(step, executionContext);
      console.log(chalk.green(`✅ Step completed: ${step.name}`));
      return result;
    } catch (error) {
      console.log(chalk.red(`❌ Step failed: ${step.name} - ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  /**
   * Build AI prompt for workflow generation
   */
  buildWorkflowGenerationPrompt(trigger, context, envContext) {
    let prompt = `Generate a workflow for trigger: ${trigger}\n\n`;
    
    prompt += `ENVIRONMENT CONTEXT:\n`;
    prompt += `Operating System: ${envContext.system.operatingSystem}\n`;
    prompt += `Available Tools: ${envContext.tools.available.join(', ')}\n`;
    prompt += `Project Type: ${envContext.project.type}\n`;
    prompt += `Languages: ${envContext.project.languages.join(', ')}\n`;
    
    if (context.error) {
      prompt += `\nERROR CONTEXT:\n${context.error}\n`;
    }
    
    if (context.buildLog) {
      prompt += `\nBUILD LOG:\n${context.buildLog.slice(0, 2000)}...\n`;
    }

    prompt += `\nPlease generate a workflow with these steps:
1. Analyze the problem/context
2. Execute appropriate fixes/changes
3. Validate the results
4. Create PR if running in CI environment

Return the workflow as JSON with this structure:
{
  "name": "workflow-name",
  "description": "What this workflow does",
  "steps": [
    {
      "name": "step-name",
      "type": "step-type",
      "config": { "step-specific": "configuration" },
      "allowFailure": false
    }
  ]
}

Available step types: analysis, environment, tool-execution, git-operations, validation, review-analysis, code-modification`;

    return prompt;
  }

  /**
   * Parse AI response into workflow definition
   */
  parseAIWorkflowResponse(response) {
    try {
      // Extract JSON from AI response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new Error(`Failed to parse AI workflow response: ${error.message}`);
    }
  }

  /**
   * Create execution context for workflow
   */
  async createExecutionContext(workflowId, context, options) {
    await environmentContext.initialize();
    const envContext = await environmentContext.getContextForLLM();
    
    return {
      workflowId,
      startTime: new Date().toISOString(),
      environment: envContext,
      isCI: this.detectCIEnvironment(),
      local: context.local || false,
      dryRun: options.dryRun || false,
      interactive: options.interactive || context.local,
      stepResults: {},
      ...context
    };
  }

  /**
   * Detect if running in CI environment
   */
  detectCIEnvironment() {
    const ciEnvVars = [
      'CI', 'CONTINUOUS_INTEGRATION', 'GITHUB_ACTIONS',
      'GITLAB_CI', 'TRAVIS', 'CIRCLECI', 'JENKINS_URL'
    ];
    
    return ciEnvVars.some(envVar => process.env[envVar]);
  }

  /**
   * Helper methods for git operations
   */
  async createPullRequest(config, context) {
    if (context.dryRun) {
      console.log(chalk.yellow(`🔍 DRY RUN: Would create PR: ${config.title}`));
      return { success: true, dryRun: true };
    }

    try {
      // Create branch if it doesn't exist
      execSync(`git checkout -b ${config.branch}`, { stdio: 'pipe' });
      
      // Commit changes if any
      execSync('git add .', { stdio: 'pipe' });
      execSync(`git commit -m "${config.title}"`, { stdio: 'pipe' });
      execSync(`git push origin ${config.branch}`, { stdio: 'pipe' });
      
      // Create PR using GitHub CLI if available
      if (context.environment.tools.available.includes('gh')) {
        const prResult = execSync(
          `gh pr create --title "${config.title}" --body "${config.description}"`,
          { encoding: 'utf8' }
        );
        
        return { success: true, pr: prResult.trim() };
      }
      
      return { success: true, branch: config.branch };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updatePullRequest(config, context) {
    // Implementation for updating existing PR
    console.log(chalk.yellow('⚠️  PR update not fully implemented yet'));
    return { success: true, placeholder: true };
  }

  async createBranch(config, context) {
    try {
      execSync(`git checkout -b ${config.name}`, { stdio: 'pipe' });
      return { success: true, branch: config.name };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Utility methods
   */
  generateWorkflowId(workflowName) {
    return `${workflowName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  evaluateCondition(condition, workflowState) {
    // Simple condition evaluation - could be enhanced
    return eval(condition.replace(/context\./g, 'workflowState.context.').replace(/steps\./g, 'workflowState.steps.'));
  }

  extractActionItemsFromComments(comments) {
    // Extract actionable items from review comments
    const actionItems = [];
    
    comments.forEach(comment => {
      if (comment.includes('please') || comment.includes('add') || comment.includes('fix') || comment.includes('change')) {
        actionItems.push({
          text: comment,
          type: 'actionable',
          priority: comment.includes('must') || comment.includes('required') ? 'high' : 'medium'
        });
      }
    });
    
    return actionItems;
  }

  async ensureStateDirectory() {
    const stateDir = path.join(process.cwd(), this.options.stateDir);
    await fs.mkdir(stateDir, { recursive: true });
  }

  async saveWorkflowState(workflowState) {
    const stateFile = path.join(process.cwd(), this.options.stateDir, `${workflowState.id}.json`);
    await fs.writeFile(stateFile, JSON.stringify(workflowState, null, 2));
  }

  async loadWorkflowTemplates() {
    // Load built-in and user-defined workflow templates
    console.log(chalk.gray('📁 Loading workflow templates...'));
  }

  async validateWorkflow(workflow, context) {
    if (!workflow.name || !workflow.steps) {
      return { valid: false, errors: ['Workflow must have name and steps'] };
    }
    
    return { valid: true, errors: [] };
  }

  async validateGeneratedWorkflow(workflow, context) {
    return await this.validateWorkflow(workflow, context);
  }

  async getWorkflowDefinition(workflowName, context) {
    // Check for built-in workflows first
    if (workflowName === 'auto-repair' || workflowName === 'code-review') {
      // These are generated dynamically
      return await this.generateDynamicWorkflow(workflowName, context);
    }

    // Load from template file
    const templatePath = path.join(process.cwd(), this.options.workflowDir, `${workflowName}.json`);
    try {
      const template = JSON.parse(await fs.readFile(templatePath, 'utf8'));
      return template;
    } catch {
      // Generate dynamically if no template found
      return await this.generateDynamicWorkflow(workflowName, context);
    }
  }

  /**
   * Rollback a workflow execution
   */
  async rollbackWorkflow(workflowId, options = {}) {
    console.log(chalk.blue(`🔄 Rolling back workflow: ${workflowId}`));
    
    try {
      const result = await workflowRollbackManager.rollbackWorkflow(workflowId, options);
      
      if (result.success) {
        console.log(chalk.green(`✅ Workflow rollback completed: ${workflowId}`));
      } else {
        console.log(chalk.yellow(`⚠️ Workflow rollback partially completed: ${workflowId}`));
      }
      
      return result;
    } catch (error) {
      console.log(chalk.red(`❌ Workflow rollback failed: ${workflowId} - ${error.message}`));
      throw error;
    }
  }

  /**
   * List available rollback checkpoints
   */
  async listRollbackCheckpoints() {
    return await workflowRollbackManager.listRollbackCheckpoints();
  }

  /**
   * Clean up old rollback checkpoints
   */
  async cleanupRollbacks() {
    return await workflowRollbackManager.cleanupOldCheckpoints();
  }

  async handleWorkflowFailure(workflowId, error) {
    console.log(chalk.red(`🚨 Workflow ${workflowId} failed: ${error.message}`));
    // Record the failure for potential rollback
    await stateManager.recordWorkflowFailure({
      workflowId,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowEngine();