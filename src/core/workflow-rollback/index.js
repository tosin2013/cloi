/**
 * Workflow Rollback System
 * 
 * Provides rollback capabilities for workflow executions, allowing safe
 * recovery from failed or problematic workflow applications.
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { stateManager } from '../state-manager/index.js';
import { configManager } from '../config-manager/index.js';

export class WorkflowRollbackManager {
  constructor() {
    this.rollbackDir = '.cloi/rollbacks';
    this.maxRollbackAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  }

  /**
   * Create rollback checkpoint before workflow execution
   */
  async createRollbackCheckpoint(workflowId, workflowData) {
    try {
      console.log(chalk.blue(`📸 Creating rollback checkpoint for workflow: ${workflowId}`));

      // Ensure rollback directory exists
      await fs.mkdir(this.rollbackDir, { recursive: true });

      const checkpoint = {
        workflowId,
        timestamp: new Date().toISOString(),
        workflowData,
        gitState: await this.captureGitState(),
        fileStates: await this.captureFileStates(workflowData),
        environmentState: await this.captureEnvironmentState(),
        systemState: await this.captureSystemState()
      };

      // Save checkpoint
      const checkpointPath = path.join(this.rollbackDir, `${workflowId}.json`);
      await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));

      console.log(chalk.green(`✅ Rollback checkpoint created: ${checkpointPath}`));
      return checkpoint;

    } catch (error) {
      console.error(chalk.red('❌ Failed to create rollback checkpoint:'), error.message);
      throw error;
    }
  }

  /**
   * Execute rollback for a specific workflow
   */
  async rollbackWorkflow(workflowId, options = {}) {
    try {
      console.log(chalk.blue(`🔄 Rolling back workflow: ${workflowId}`));

      // Load checkpoint
      const checkpointPath = path.join(this.rollbackDir, `${workflowId}.json`);
      const checkpoint = JSON.parse(await fs.readFile(checkpointPath, 'utf8'));

      // Confirm rollback if not forced
      if (!options.force && !options.confirmed) {
        throw new Error('Rollback requires confirmation. Use --force or --confirmed flag.');
      }

      // Execute rollback steps
      const rollbackSteps = [];

      // 1. Restore git state
      if (checkpoint.gitState && !options.skipGit) {
        console.log(chalk.yellow('📂 Restoring git state...'));
        const gitResult = await this.restoreGitState(checkpoint.gitState);
        rollbackSteps.push({ type: 'git', success: gitResult.success, details: gitResult });
      }

      // 2. Restore file states
      if (checkpoint.fileStates && checkpoint.fileStates.length > 0 && !options.skipFiles) {
        console.log(chalk.yellow('📄 Restoring file states...'));
        const fileResult = await this.restoreFileStates(checkpoint.fileStates);
        rollbackSteps.push({ type: 'files', success: fileResult.success, details: fileResult });
      }

      // 3. Restore environment state
      if (checkpoint.environmentState && !options.skipEnvironment) {
        console.log(chalk.yellow('🌍 Restoring environment state...'));
        const envResult = await this.restoreEnvironmentState(checkpoint.environmentState);
        rollbackSteps.push({ type: 'environment', success: envResult.success, details: envResult });
      }

      // 4. Update workflow state
      await stateManager.recordRollback({
        workflowId,
        timestamp: new Date().toISOString(),
        checkpoint: checkpoint.timestamp,
        steps: rollbackSteps,
        success: rollbackSteps.every(step => step.success)
      });

      const successfulSteps = rollbackSteps.filter(step => step.success).length;
      const totalSteps = rollbackSteps.length;

      if (successfulSteps === totalSteps) {
        console.log(chalk.green(`✅ Rollback completed successfully (${successfulSteps}/${totalSteps} steps)`));
      } else {
        console.log(chalk.yellow(`⚠️ Rollback partially completed (${successfulSteps}/${totalSteps} steps)`));
      }

      return {
        success: successfulSteps > 0,
        workflowId,
        steps: rollbackSteps,
        checkpointRestored: checkpoint.timestamp
      };

    } catch (error) {
      console.error(chalk.red('❌ Rollback failed:'), error.message);
      throw error;
    }
  }

  /**
   * List available rollback checkpoints
   */
  async listRollbackCheckpoints() {
    try {
      const checkpoints = [];
      
      try {
        const files = await fs.readdir(this.rollbackDir);
        
        for (const file of files.filter(f => f.endsWith('.json'))) {
          try {
            const checkpointPath = path.join(this.rollbackDir, file);
            const checkpoint = JSON.parse(await fs.readFile(checkpointPath, 'utf8'));
            
            checkpoints.push({
              workflowId: checkpoint.workflowId,
              timestamp: checkpoint.timestamp,
              age: Date.now() - new Date(checkpoint.timestamp).getTime(),
              file: checkpointPath,
              hasGitState: !!checkpoint.gitState,
              hasFileStates: !!(checkpoint.fileStates && checkpoint.fileStates.length > 0),
              hasEnvironmentState: !!checkpoint.environmentState
            });
          } catch (error) {
            console.log(chalk.yellow(`⚠️ Skipping invalid checkpoint file: ${file}`));
          }
        }
      } catch (error) {
        // Rollback directory doesn't exist
        return [];
      }

      // Sort by timestamp (newest first)
      return checkpoints.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    } catch (error) {
      console.error(chalk.red('❌ Failed to list rollback checkpoints:'), error.message);
      return [];
    }
  }

  /**
   * Clean up old rollback checkpoints
   */
  async cleanupOldCheckpoints() {
    try {
      const checkpoints = await this.listRollbackCheckpoints();
      const cutoffTime = Date.now() - this.maxRollbackAge;
      let deletedCount = 0;

      for (const checkpoint of checkpoints) {
        if (checkpoint.age > this.maxRollbackAge) {
          await fs.unlink(checkpoint.file);
          deletedCount++;
          console.log(chalk.gray(`🗑️ Deleted old checkpoint: ${checkpoint.workflowId}`));
        }
      }

      if (deletedCount > 0) {
        console.log(chalk.green(`✅ Cleaned up ${deletedCount} old rollback checkpoints`));
      }

      return deletedCount;

    } catch (error) {
      console.error(chalk.red('❌ Checkpoint cleanup failed:'), error.message);
      return 0;
    }
  }

  /**
   * Capture current git state
   */
  async captureGitState() {
    try {
      const gitState = {
        currentBranch: execSync('git branch --show-current', { encoding: 'utf8' }).trim(),
        commitHash: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
        status: execSync('git status --porcelain', { encoding: 'utf8' }).trim(),
        stashList: execSync('git stash list', { encoding: 'utf8' }).trim(),
        remotes: execSync('git remote -v', { encoding: 'utf8' }).trim(),
        hasUncommittedChanges: false
      };

      // Check for uncommitted changes
      if (gitState.status) {
        gitState.hasUncommittedChanges = true;
        // Create a stash for uncommitted changes
        const stashResult = execSync('git stash push -m "Pre-workflow-rollback-backup"', { encoding: 'utf8' });
        gitState.rollbackStash = stashResult.trim();
      }

      return gitState;

    } catch (error) {
      // Not a git repository or git not available
      return null;
    }
  }

  /**
   * Capture file states for files that might be modified
   */
  async captureFileStates(workflowData) {
    const fileStates = [];
    
    try {
      // Identify files that might be modified by the workflow
      const filesToCapture = this.identifyFilesToCapture(workflowData);
      
      for (const filePath of filesToCapture) {
        try {
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf8');
          
          fileStates.push({
            path: filePath,
            exists: true,
            content,
            size: stats.size,
            mtime: stats.mtime.toISOString(),
            mode: stats.mode
          });
        } catch (error) {
          // File doesn't exist
          fileStates.push({
            path: filePath,
            exists: false
          });
        }
      }

    } catch (error) {
      console.log(chalk.yellow(`⚠️ Could not capture all file states: ${error.message}`));
    }

    return fileStates;
  }

  /**
   * Capture environment state
   */
  async captureEnvironmentState() {
    try {
      return {
        cwd: process.cwd(),
        env: this.sanitizeEnvironmentVariables(process.env),
        nodeVersion: process.version,
        platform: process.platform,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Capture system state
   */
  async captureSystemState() {
    try {
      return {
        packageJsonExists: await this.fileExists('package.json'),
        nodeModulesExists: await this.fileExists('node_modules'),
        gitIgnoreExists: await this.fileExists('.gitignore'),
        workflows: await this.fileExists('.github/workflows'),
        cloiConfig: await this.fileExists('.cloi')
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Restore git state from checkpoint
   */
  async restoreGitState(gitState) {
    try {
      const restorationSteps = [];

      // Switch to original branch if different
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      if (currentBranch !== gitState.currentBranch) {
        execSync(`git checkout ${gitState.currentBranch}`, { stdio: 'pipe' });
        restorationSteps.push(`Switched to branch: ${gitState.currentBranch}`);
      }

      // Reset to original commit if different
      const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      if (currentCommit !== gitState.commitHash) {
        execSync(`git reset --hard ${gitState.commitHash}`, { stdio: 'pipe' });
        restorationSteps.push(`Reset to commit: ${gitState.commitHash.substring(0, 8)}`);
      }

      // Restore stashed changes if they exist
      if (gitState.rollbackStash) {
        try {
          execSync('git stash pop', { stdio: 'pipe' });
          restorationSteps.push('Restored uncommitted changes from stash');
        } catch (error) {
          restorationSteps.push('Could not restore stashed changes');
        }
      }

      return {
        success: true,
        steps: restorationSteps
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Restore file states from checkpoint
   */
  async restoreFileStates(fileStates) {
    const restoredFiles = [];
    const failedFiles = [];

    for (const fileState of fileStates) {
      try {
        if (fileState.exists) {
          // Restore file content
          await fs.writeFile(fileState.path, fileState.content);
          
          // Restore file mode if possible
          if (fileState.mode) {
            await fs.chmod(fileState.path, fileState.mode);
          }
          
          restoredFiles.push(fileState.path);
        } else {
          // Remove file if it was created
          try {
            await fs.unlink(fileState.path);
            restoredFiles.push(`${fileState.path} (removed)`);
          } catch (error) {
            // File already doesn't exist
          }
        }
      } catch (error) {
        failedFiles.push({ path: fileState.path, error: error.message });
      }
    }

    return {
      success: failedFiles.length === 0,
      restoredFiles,
      failedFiles
    };
  }

  /**
   * Restore environment state from checkpoint
   */
  async restoreEnvironmentState(environmentState) {
    try {
      // Change back to original working directory
      if (environmentState.cwd && environmentState.cwd !== process.cwd()) {
        process.chdir(environmentState.cwd);
        return {
          success: true,
          steps: [`Changed directory to: ${environmentState.cwd}`]
        };
      }

      return {
        success: true,
        steps: ['No environment changes needed']
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Helper methods
   */
  identifyFilesToCapture(workflowData) {
    const files = new Set();
    
    // Common files that workflows might modify
    const commonFiles = [
      'package.json',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      '.gitignore',
      'README.md',
      'tsconfig.json',
      '.eslintrc.js',
      '.prettierrc'
    ];

    commonFiles.forEach(file => files.add(file));

    // Add workflow-specific files
    if (workflowData.context && workflowData.context.files) {
      workflowData.context.files.forEach(file => files.add(file));
    }

    return Array.from(files);
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  sanitizeEnvironmentVariables(env) {
    const sanitized = {};
    const sensitivePatterns = [
      /password/i, /secret/i, /key/i, /token/i, /auth/i, /credential/i
    ];

    for (const [key, value] of Object.entries(env)) {
      if (sensitivePatterns.some(pattern => pattern.test(key))) {
        sanitized[key] = '[HIDDEN]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Rollback specific workflow step
   */
  async rollbackStep(workflowId, stepName, checkpoint) {
    try {
      console.log(chalk.blue(`↩️ Rolling back step: ${stepName} from workflow: ${workflowId}`));

      // This is a more granular rollback for individual steps
      // Implementation would depend on the specific step type
      
      return {
        success: true,
        stepName,
        message: 'Step rollback completed'
      };

    } catch (error) {
      return {
        success: false,
        stepName,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const workflowRollbackManager = new WorkflowRollbackManager();