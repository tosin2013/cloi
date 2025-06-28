/**
 * Upstream Sync Workflow - Handle upstream repository synchronization
 * 
 * Fetches upstream changes, resolves merge conflicts with AI assistance,
 * runs tests, and creates pull requests for upstream updates.
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { workflowEngine } from '../core/workflow-engine/index.js';
import { environmentContext } from '../core/environment-context/index.js';
import { coordinator } from '../core/coordinator/index.js';

export class UpstreamSyncWorkflow {
  constructor() {
    this.upstreamRemote = 'upstream';
    this.conflictMarkers = ['<<<<<<<', '=======', '>>>>>>>'];
  }

  /**
   * Execute upstream sync workflow
   */
  async executeUpstreamSync(options = {}) {
    try {
      console.log(chalk.blue('🔄 Starting upstream synchronization workflow...'));

      // Initialize systems
      await coordinator.initialize();
      await environmentContext.initialize();

      // Detect upstream configuration
      const upstreamConfig = await this.detectUpstreamConfiguration();
      
      if (!upstreamConfig.hasUpstream) {
        throw new Error('No upstream remote configured. Run: git remote add upstream <upstream-repo-url>');
      }

      console.log(chalk.green(`✅ Upstream detected: ${upstreamConfig.upstreamUrl}`));

      // Build workflow context
      const context = {
        trigger: 'upstream-sync',
        upstream: upstreamConfig,
        branch: options.branch || upstreamConfig.defaultBranch,
        createPR: options.createPr !== false,
        runTests: options.runTests !== false,
        strategy: options.strategy || 'merge', // merge, rebase, squash
        local: options.local || false
      };

      // Generate and execute workflow
      const workflow = await this.generateUpstreamSyncWorkflow(context);
      const result = await workflowEngine.executeWorkflow('upstream-sync', context, {
        type: 'upstream-sync',
        interactive: context.local
      });

      console.log(chalk.green('✅ Upstream sync workflow completed'));
      return result;

    } catch (error) {
      console.error(chalk.red('❌ Upstream sync failed:'), error.message);
      throw error;
    }
  }

  /**
   * Generate upstream sync workflow
   */
  async generateUpstreamSyncWorkflow(context) {
    return {
      name: 'upstream-sync',
      description: 'Synchronize with upstream repository and resolve conflicts',
      steps: [
        {
          name: 'validate-git-state',
          type: 'git-validation',
          config: {
            checkClean: true,
            checkBranch: true
          }
        },
        {
          name: 'fetch-upstream',
          type: 'git-operations',
          config: {
            action: 'fetch-upstream',
            remote: context.upstream.remote,
            branch: context.branch
          }
        },
        {
          name: 'detect-changes',
          type: 'git-operations', 
          config: {
            action: 'compare-branches',
            baseBranch: `${context.upstream.remote}/${context.branch}`,
            headBranch: 'HEAD'
          }
        },
        {
          name: 'create-sync-branch',
          type: 'git-operations',
          condition: 'steps.detect-changes.result.hasChanges',
          config: {
            action: 'create-branch',
            name: `sync-upstream-${Date.now()}`,
            from: 'HEAD'
          }
        },
        {
          name: 'merge-upstream',
          type: 'git-operations',
          config: {
            action: 'merge-upstream',
            strategy: context.strategy,
            upstream: `${context.upstream.remote}/${context.branch}`
          }
        },
        {
          name: 'detect-conflicts',
          type: 'conflict-detection',
          config: {
            checkFiles: true,
            analyzeConflicts: true
          }
        },
        {
          name: 'resolve-conflicts',
          type: 'conflict-resolution',
          condition: 'steps.detect-conflicts.result.hasConflicts',
          config: {
            useAI: true,
            strategy: 'smart-merge',
            preserveLocal: false
          }
        },
        {
          name: 'run-tests',
          type: 'validation',
          condition: 'context.runTests',
          config: {
            runTests: true,
            runLinting: true,
            checkBuild: true
          }
        },
        {
          name: 'commit-sync',
          type: 'git-operations',
          config: {
            action: 'commit',
            message: 'sync: Merge upstream changes\n\nAutomatically synchronized with upstream repository.\nConflicts resolved with AI assistance where needed.',
            allowEmpty: false
          }
        },
        {
          name: 'create-pr',
          type: 'git-operations',
          condition: 'context.createPR && !context.local',
          config: {
            action: 'create-pr',
            title: 'sync: Merge upstream changes',
            description: 'Automatically synchronized with upstream repository',
            labels: ['upstream-sync', 'automated']
          }
        }
      ]
    };
  }

  /**
   * Detect upstream repository configuration
   */
  async detectUpstreamConfiguration() {
    try {
      // Check if we're in a git repository
      const isGitRepo = await this.checkGitRepository();
      if (!isGitRepo) {
        throw new Error('Not a git repository');
      }

      // Get remote information
      const remotes = await this.getGitRemotes();
      
      // Find upstream remote
      const upstreamRemote = remotes.find(r => r.name === 'upstream') || 
                           remotes.find(r => r.name === 'origin');

      if (!upstreamRemote) {
        return { hasUpstream: false };
      }

      // Get default branch
      const defaultBranch = await this.getDefaultBranch(upstreamRemote.name);

      // Get current branch
      const currentBranch = await this.getCurrentBranch();

      return {
        hasUpstream: true,
        remote: upstreamRemote.name,
        upstreamUrl: upstreamRemote.url,
        defaultBranch,
        currentBranch,
        remotes
      };

    } catch (error) {
      return { hasUpstream: false, error: error.message };
    }
  }

  /**
   * Register upstream sync step executors with workflow engine
   */
  async registerStepExecutors() {
    // Git validation executor
    workflowEngine.stepExecutors.set('git-validation', async (step, context) => {
      const { checkClean, checkBranch } = step.config;
      const issues = [];

      if (checkClean) {
        const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
        if (status) {
          issues.push('Working directory is not clean');
        }
      }

      if (checkBranch) {
        const currentBranch = await this.getCurrentBranch();
        if (currentBranch === context.branch) {
          issues.push(`Currently on target branch ${context.branch}. Switch to a different branch first.`);
        }
      }

      return {
        success: issues.length === 0,
        issues,
        error: issues.length > 0 ? issues.join(', ') : null
      };
    });

    // Enhanced git operations executor
    const originalGitExecutor = workflowEngine.stepExecutors.get('git-operations');
    workflowEngine.stepExecutors.set('git-operations', async (step, context) => {
      const { action } = step.config;

      switch (action) {
        case 'fetch-upstream':
          return await this.fetchUpstream(step.config, context);
        case 'compare-branches':
          return await this.compareBranches(step.config, context);
        case 'merge-upstream':
          return await this.mergeUpstream(step.config, context);
        default:
          // Fall back to original git executor
          return await originalGitExecutor(step, context);
      }
    });

    // Conflict detection executor
    workflowEngine.stepExecutors.set('conflict-detection', async (step, context) => {
      const conflicts = await this.detectMergeConflicts();
      
      return {
        success: true,
        result: {
          hasConflicts: conflicts.length > 0,
          conflicts,
          conflictFiles: conflicts.map(c => c.file)
        }
      };
    });

    // Conflict resolution executor
    workflowEngine.stepExecutors.set('conflict-resolution', async (step, context) => {
      const { useAI, strategy } = step.config;
      
      if (useAI) {
        return await this.resolveConflictsWithAI(context);
      } else {
        return await this.resolveConflictsManually(strategy);
      }
    });
  }

  /**
   * Git operation implementations
   */
  async fetchUpstream(config, context) {
    try {
      const { remote, branch } = config;
      
      console.log(chalk.blue(`📡 Fetching from ${remote}...`));
      execSync(`git fetch ${remote} ${branch}`, { stdio: 'pipe' });
      
      return { success: true, message: `Fetched ${remote}/${branch}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async compareBranches(config, context) {
    try {
      const { baseBranch, headBranch } = config;
      
      // Check if there are differences
      const diff = execSync(`git rev-list --count ${headBranch}..${baseBranch}`, { encoding: 'utf8' }).trim();
      const hasChanges = parseInt(diff) > 0;
      
      // Get commit summary
      let commits = [];
      if (hasChanges) {
        const commitList = execSync(`git log --oneline ${headBranch}..${baseBranch}`, { encoding: 'utf8' });
        commits = commitList.trim().split('\n').filter(line => line);
      }

      return {
        success: true,
        result: {
          hasChanges,
          commitCount: parseInt(diff),
          commits
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async mergeUpstream(config, context) {
    try {
      const { strategy, upstream } = config;
      
      console.log(chalk.blue(`🔀 Merging ${upstream} using ${strategy} strategy...`));
      
      let command;
      switch (strategy) {
        case 'rebase':
          command = `git rebase ${upstream}`;
          break;
        case 'squash':
          command = `git merge --squash ${upstream}`;
          break;
        default: // merge
          command = `git merge ${upstream} --no-edit`;
      }
      
      execSync(command, { stdio: 'pipe' });
      
      return { success: true, strategy, upstream };
    } catch (error) {
      // Check if it's a merge conflict
      if (error.message.includes('CONFLICT') || error.status === 1) {
        return {
          success: false,
          error: 'Merge conflicts detected',
          hasConflicts: true
        };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Conflict detection and resolution
   */
  async detectMergeConflicts() {
    try {
      // Get list of files with conflicts
      const conflictFiles = execSync('git diff --name-only --diff-filter=U', { encoding: 'utf8' })
        .trim().split('\n').filter(file => file);

      const conflicts = [];
      
      for (const file of conflictFiles) {
        try {
          const content = await fs.readFile(file, 'utf8');
          const conflictSections = this.parseConflictMarkers(content);
          
          conflicts.push({
            file,
            conflictCount: conflictSections.length,
            conflicts: conflictSections
          });
        } catch (error) {
          conflicts.push({
            file,
            error: `Could not read file: ${error.message}`
          });
        }
      }

      return conflicts;
    } catch (error) {
      return [];
    }
  }

  parseConflictMarkers(content) {
    const lines = content.split('\n');
    const conflicts = [];
    let currentConflict = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('<<<<<<<')) {
        currentConflict = {
          startLine: i,
          localBranch: line.substring(7).trim(),
          localContent: [],
          upstreamContent: []
        };
      } else if (line.startsWith('=======') && currentConflict) {
        currentConflict.separatorLine = i;
      } else if (line.startsWith('>>>>>>>') && currentConflict) {
        currentConflict.endLine = i;
        currentConflict.upstreamBranch = line.substring(7).trim();
        conflicts.push(currentConflict);
        currentConflict = null;
      } else if (currentConflict) {
        if (currentConflict.separatorLine === undefined) {
          currentConflict.localContent.push(line);
        } else {
          currentConflict.upstreamContent.push(line);
        }
      }
    }

    return conflicts;
  }

  async resolveConflictsWithAI(context) {
    try {
      console.log(chalk.blue('🤖 Resolving conflicts with AI assistance...'));

      const conflicts = await this.detectMergeConflicts();
      if (conflicts.length === 0) {
        return { success: true, message: 'No conflicts to resolve' };
      }

      let resolvedCount = 0;
      const resolutionSummary = [];

      for (const conflict of conflicts) {
        if (conflict.error) {
          resolutionSummary.push(`${conflict.file}: ${conflict.error}`);
          continue;
        }

        const resolution = await this.resolveFileConflictWithAI(conflict);
        
        if (resolution.success) {
          await fs.writeFile(conflict.file, resolution.resolvedContent);
          execSync(`git add ${conflict.file}`);
          resolvedCount++;
          resolutionSummary.push(`${conflict.file}: Resolved ${conflict.conflictCount} conflicts`);
        } else {
          resolutionSummary.push(`${conflict.file}: ${resolution.error}`);
        }
      }

      return {
        success: resolvedCount > 0,
        resolvedCount,
        totalConflicts: conflicts.length,
        summary: resolutionSummary,
        error: resolvedCount === 0 ? 'No conflicts could be automatically resolved' : null
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async resolveFileConflictWithAI(conflict) {
    try {
      // Read the full file content
      const fileContent = await fs.readFile(conflict.file, 'utf8');
      
      // Build context for AI
      const prompt = this.buildConflictResolutionPrompt(conflict, fileContent);
      
      // Query AI provider
      const provider = coordinator.getAvailableProvider();
      if (!provider) {
        throw new Error('No AI provider available for conflict resolution');
      }

      const response = await provider.query(prompt, {
        max_tokens: 2048,
        temperature: 0.1  // Low temperature for more deterministic resolution
      });

      // Parse AI response
      const resolvedContent = this.parseAIConflictResolution(response.response, fileContent);
      
      return {
        success: true,
        resolvedContent,
        aiReasoning: response.response
      };

    } catch (error) {
      return {
        success: false,
        error: `AI resolution failed: ${error.message}`
      };
    }
  }

  buildConflictResolutionPrompt(conflict, fileContent) {
    let prompt = `Please resolve the merge conflict in the following file:

File: ${conflict.file}
Conflicts: ${conflict.conflictCount}

CONFLICT CONTEXT:
`;

    conflict.conflicts.forEach((conf, index) => {
      prompt += `
Conflict ${index + 1}:
Local version (${conf.localBranch}):
${conf.localContent.join('\n')}

Upstream version (${conf.upstreamBranch}):
${conf.upstreamContent.join('\n')}
`;
    });

    prompt += `

FULL FILE CONTENT:
${fileContent}

Please provide the resolved file content. Consider:
1. Preserve the intent of both versions where possible
2. Maintain code consistency and style
3. Ensure the result is syntactically correct
4. Prefer upstream changes for dependencies/tooling
5. Prefer local changes for business logic/features

Return only the resolved file content without conflict markers.`;

    return prompt;
  }

  parseAIConflictResolution(aiResponse, originalContent) {
    // Extract code block if AI wrapped it
    const codeBlockMatch = aiResponse.match(/```[\w]*\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1];
    }

    // If no code block, try to find content that looks like resolved file
    const lines = aiResponse.split('\n');
    
    // Look for content that doesn't contain conflict markers
    const resolvedLines = lines.filter(line => 
      !line.includes('<<<<<<<') && 
      !line.includes('=======') && 
      !line.includes('>>>>>>>')
    );

    return resolvedLines.join('\n');
  }

  /**
   * Helper methods
   */
  async checkGitRepository() {
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  async getGitRemotes() {
    try {
      const remoteOutput = execSync('git remote -v', { encoding: 'utf8' });
      const remotes = [];
      
      remoteOutput.split('\n').forEach(line => {
        const match = line.match(/^(\w+)\s+(.+)\s+\((fetch|push)\)$/);
        if (match && match[3] === 'fetch') {
          remotes.push({
            name: match[1],
            url: match[2]
          });
        }
      });

      return remotes;
    } catch {
      return [];
    }
  }

  async getDefaultBranch(remote) {
    try {
      const branch = execSync(`git symbolic-ref refs/remotes/${remote}/HEAD`, { encoding: 'utf8' })
        .trim().replace(`refs/remotes/${remote}/`, '');
      return branch;
    } catch {
      // Fallback to common default branches
      const commonBranches = ['main', 'master', 'develop'];
      
      for (const branch of commonBranches) {
        try {
          execSync(`git show-ref --verify --quiet refs/remotes/${remote}/${branch}`);
          return branch;
        } catch {
          continue;
        }
      }
      
      return 'main'; // final fallback
    }
  }

  async getCurrentBranch() {
    try {
      return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch {
      return 'HEAD';
    }
  }

  async resolveConflictsManually(strategy) {
    // Placeholder for manual resolution strategies
    return {
      success: false,
      error: 'Manual conflict resolution not implemented yet'
    };
  }
}

/**
 * Command interface
 */
export async function runUpstreamSync(options = {}) {
  const syncWorkflow = new UpstreamSyncWorkflow();
  
  // Register step executors
  await syncWorkflow.registerStepExecutors();
  
  // Execute workflow
  return await syncWorkflow.executeUpstreamSync(options);
}