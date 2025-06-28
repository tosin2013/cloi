/**
 * Workflow Commands - CLI interface for workflow operations
 * 
 * Provides commands for running, creating, and managing workflows
 * both locally and in CI/CD environments.
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { workflowEngine } from '../core/workflow-engine/index.js';
import { environmentContext } from '../core/environment-context/index.js';
import { DeprecatedActionsRepair } from './fix-deprecated-actions.js';

/**
 * Run a workflow
 */
export async function runWorkflow(workflowName, options = {}) {
  try {
    console.log(chalk.blue(`🚀 Running workflow: ${workflowName}`));
    
    // Parse context from options
    let context = {};
    if (options.context) {
      try {
        context = typeof options.context === 'string' 
          ? JSON.parse(options.context) 
          : options.context;
      } catch (error) {
        console.log(chalk.yellow('⚠️  Failed to parse context, using empty context'));
      }
    }

    // Add CLI options to context
    context.local = !workflowEngine.detectCIEnvironment();
    context.interactive = options.interactive || context.local;
    context.dryRun = options.dryRun || false;

    // Execute workflow
    const result = await workflowEngine.executeWorkflow(workflowName, context, {
      dryRun: options.dryRun,
      interactive: options.interactive
    });

    console.log(chalk.green(`✅ Workflow completed successfully`));
    console.log(`Workflow ID: ${result.workflowId}`);
    console.log(`Steps executed: ${result.steps.length}`);
    console.log(`Duration: ${Math.round(result.duration / 1000)}s`);

    return result;

  } catch (error) {
    console.error(chalk.red('❌ Workflow execution failed:'), error.message);
    throw error;
  }
}

/**
 * Run auto-repair workflow for CI failures
 */
export async function runAutoRepair(options = {}) {
  try {
    console.log(chalk.blue('🔧 Starting auto-repair workflow...'));

    // Build failure context
    const context = {
      trigger: 'ci-failure',
      buildLog: options.buildLog,
      error: options.error,
      failureType: options.failureType || 'unknown',
      repository: options.repository,
      branch: options.branch,
      commit: options.commit,
      local: options.local || !workflowEngine.detectCIEnvironment(),
      createPR: options.createPr && !options.local
    };

    // Add build log from file if provided
    if (options.buildLogFile) {
      try {
        context.buildLog = await fs.readFile(options.buildLogFile, 'utf8');
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Could not read build log file: ${error.message}`));
      }
    }

    // Add environment context
    await environmentContext.initialize();
    const envContext = await environmentContext.getContextForLLM();
    context.environment = envContext;

    const result = await workflowEngine.executeAutoRepairWorkflow(context);

    console.log(chalk.green('✅ Auto-repair workflow completed'));
    
    if (result.steps) {
      const failedSteps = result.steps.filter(step => !step.result.success);
      if (failedSteps.length > 0) {
        console.log(chalk.yellow(`⚠️  ${failedSteps.length} steps had issues:`));
        failedSteps.forEach(step => {
          console.log(`  - ${step.name}: ${step.result.error}`);
        });
      }
    }

    return result;

  } catch (error) {
    console.error(chalk.red('❌ Auto-repair failed:'), error.message);
    throw error;
  }
}

/**
 * Run code review workflow
 */
export async function runCodeReview(options = {}) {
  try {
    console.log(chalk.blue('👥 Starting code review workflow...'));

    const context = {
      trigger: 'code-review',
      prNumber: options.prNumber,
      reviewComments: options.reviewComments || [],
      changedFiles: options.changedFiles || [],
      repository: options.repository,
      local: options.local || !workflowEngine.detectCIEnvironment()
    };

    // Parse review comments from file if provided
    if (options.commentsFile) {
      try {
        const commentsData = await fs.readFile(options.commentsFile, 'utf8');
        context.reviewComments = JSON.parse(commentsData);
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Could not read comments file: ${error.message}`));
      }
    }

    const result = await workflowEngine.executeCodeReviewWorkflow(context);

    console.log(chalk.green('✅ Code review workflow completed'));
    return result;

  } catch (error) {
    console.error(chalk.red('❌ Code review workflow failed:'), error.message);
    throw error;
  }
}

/**
 * List available workflows
 */
export async function listWorkflows() {
  try {
    console.log(chalk.cyan('📋 Available Workflows:\n'));

    // Built-in workflows
    console.log(chalk.blue('BUILT-IN WORKFLOWS:'));
    console.log('  auto-repair       - Automatically repair CI/CD failures');
    console.log('  code-review       - Process and apply code review feedback');
    console.log('  deployment-check  - Validate deployment readiness');
    console.log('  quality-gate      - Run quality checks and tests');
    console.log();

    // User-defined workflows
    const workflowDir = path.join(process.cwd(), '.cloi', 'workflows');
    try {
      const files = await fs.readdir(workflowDir);
      const workflowFiles = files.filter(f => f.endsWith('.json') || f.endsWith('.yaml'));
      
      if (workflowFiles.length > 0) {
        console.log(chalk.blue('USER-DEFINED WORKFLOWS:'));
        for (const file of workflowFiles) {
          const name = path.parse(file).name;
          console.log(`  ${name.padEnd(18)} - ${file}`);
        }
        console.log();
      }
    } catch (error) {
      // No user workflows directory
    }

    console.log(chalk.gray('Use "cloi workflow run <name>" to execute a workflow'));

  } catch (error) {
    console.error(chalk.red('❌ Failed to list workflows:'), error.message);
  }
}

/**
 * Show workflow status and history
 */
export async function showWorkflowStatus() {
  try {
    console.log(chalk.cyan('📊 Workflow Status:\n'));

    // Check for active workflows
    const activeWorkflows = Array.from(workflowEngine.activeWorkflows.values());
    
    if (activeWorkflows.length > 0) {
      console.log(chalk.blue('ACTIVE WORKFLOWS:'));
      activeWorkflows.forEach(workflow => {
        const duration = Math.round((Date.now() - new Date(workflow.startTime)) / 1000);
        console.log(`  ${workflow.name} (${workflow.id})`);
        console.log(`    Status: ${workflow.status}`);
        console.log(`    Duration: ${duration}s`);
        console.log(`    Steps: ${workflow.steps.length}`);
        console.log();
      });
    } else {
      console.log(chalk.gray('No active workflows'));
    }

    // Show recent workflow history
    await showWorkflowHistory(5);

  } catch (error) {
    console.error(chalk.red('❌ Failed to show workflow status:'), error.message);
  }
}

/**
 * Show workflow execution history
 */
export async function showWorkflowHistory(limit = 10) {
  try {
    const stateDir = path.join(process.cwd(), '.cloi', 'workflow-state');
    
    try {
      const files = await fs.readdir(stateDir);
      const stateFiles = files.filter(f => f.endsWith('.json'))
        .sort((a, b) => {
          // Sort by modification time (newest first)
          return fs.stat(path.join(stateDir, b)).then(statB => 
            fs.stat(path.join(stateDir, a)).then(statA => 
              statB.mtime - statA.mtime
            )
          );
        })
        .slice(0, limit);

      if (stateFiles.length === 0) {
        console.log(chalk.gray('No workflow history found'));
        return;
      }

      console.log(chalk.blue(`RECENT WORKFLOWS (${stateFiles.length}):`));
      
      for (const file of stateFiles) {
        try {
          const statePath = path.join(stateDir, file);
          const state = JSON.parse(await fs.readFile(statePath, 'utf8'));
          
          const status = state.status === 'completed' ? chalk.green('✅') :
                        state.status === 'failed' ? chalk.red('❌') :
                        chalk.yellow('⏳');
          
          const duration = state.endTime 
            ? Math.round((new Date(state.endTime) - new Date(state.startTime)) / 1000)
            : 'ongoing';
          
          console.log(`  ${status} ${state.name}`);
          console.log(`    ID: ${state.id}`);
          console.log(`    Started: ${new Date(state.startTime).toLocaleString()}`);
          console.log(`    Duration: ${duration}s`);
          console.log(`    Steps: ${state.steps.length}`);
          console.log();
        } catch (error) {
          console.log(chalk.gray(`    Error reading ${file}: ${error.message}`));
        }
      }

    } catch (error) {
      console.log(chalk.gray('No workflow state directory found'));
    }

  } catch (error) {
    console.error(chalk.red('❌ Failed to show workflow history:'), error.message);
  }
}

/**
 * Create a new workflow template
 */
export async function createWorkflowTemplate(name, options = {}) {
  try {
    console.log(chalk.blue(`📝 Creating workflow template: ${name}`));

    const workflowDir = path.join(process.cwd(), '.cloi', 'workflows');
    await fs.mkdir(workflowDir, { recursive: true });

    const template = {
      name,
      description: options.description || `${name} workflow`,
      version: '1.0.0',
      steps: [
        {
          name: 'example-step',
          type: 'tool-execution',
          config: {
            tool: 'echo',
            command: 'Hello from workflow'
          }
        }
      ]
    };

    const templatePath = path.join(workflowDir, `${name}.json`);
    await fs.writeFile(templatePath, JSON.stringify(template, null, 2));

    console.log(chalk.green(`✅ Workflow template created: ${templatePath}`));
    console.log(chalk.gray('Edit the template file to customize the workflow steps'));

    return templatePath;

  } catch (error) {
    console.error(chalk.red('❌ Failed to create workflow template:'), error.message);
    throw error;
  }
}

/**
 * Validate a workflow definition
 */
export async function validateWorkflow(workflowPath) {
  try {
    console.log(chalk.blue(`🔍 Validating workflow: ${workflowPath}`));

    const workflowData = JSON.parse(await fs.readFile(workflowPath, 'utf8'));
    
    await workflowEngine.initialize();
    const validation = await workflowEngine.validateWorkflow(workflowData, {});

    if (validation.valid) {
      console.log(chalk.green('✅ Workflow is valid'));
    } else {
      console.log(chalk.red('❌ Workflow validation failed:'));
      validation.errors.forEach(error => {
        console.log(chalk.red(`  - ${error}`));
      });
    }

    return validation;

  } catch (error) {
    console.error(chalk.red('❌ Failed to validate workflow:'), error.message);
    throw error;
  }
}

/**
 * Generate a workflow using AI
 */
export async function generateWorkflow(trigger, context = {}, options = {}) {
  try {
    console.log(chalk.blue(`🤖 Generating workflow for trigger: ${trigger}`));

    await workflowEngine.initialize();
    const workflow = await workflowEngine.generateDynamicWorkflow(trigger, context);

    if (options.save) {
      const workflowDir = path.join(process.cwd(), '.cloi', 'workflows');
      await fs.mkdir(workflowDir, { recursive: true });
      
      const filename = options.name || `${trigger}-${Date.now()}`;
      const filepath = path.join(workflowDir, `${filename}.json`);
      
      await fs.writeFile(filepath, JSON.stringify(workflow, null, 2));
      console.log(chalk.green(`✅ Generated workflow saved: ${filepath}`));
    } else {
      console.log(chalk.cyan('Generated Workflow:'));
      console.log(JSON.stringify(workflow, null, 2));
    }

    return workflow;

  } catch (error) {
    console.error(chalk.red('❌ Failed to generate workflow:'), error.message);
    throw error;
  }
}

/**
 * Fix deprecated GitHub Actions
 */
export async function fixDeprecatedActions(options = {}) {
  try {
    console.log(chalk.blue('🔧 Running GitHub Actions deprecation repair...'));
    
    const repair = new DeprecatedActionsRepair({
      autoCommit: options.commit || false,
      createBackup: options.backup !== false
    });

    const result = await repair.repairDeprecatedActions();
    
    if (result.success && result.fixes.length > 0) {
      console.log(chalk.cyan('\n💡 Auto-repair completed successfully!'));
      console.log('Next steps:');
      console.log('  1. Review the changes in .github/workflows/');
      console.log('  2. Test the workflows in a pull request');
      console.log('  3. Commit and push the fixes');
      
      if (!options.commit) {
        console.log(chalk.gray('\n  Use --commit to auto-commit these fixes'));
      }
    } else if (result.success && result.fixes.length === 0) {
      console.log(chalk.green('✅ No deprecated actions found - your workflows are up to date!'));
    }

    return result;

  } catch (error) {
    console.error(chalk.red('❌ Failed to fix deprecated actions:'), error.message);
    throw error;
  }
}
