#!/usr/bin/env node
/**
 * Main CLI Application Entry Point
 * 
 * This is the core entry point for the CLOI application, providing an interactive
 * command-line interface for error analysis and automatic debugging.
 * 
 * The module integrates all other components (LLM, UI, patch application, etc.)
 * to provide a seamless experience for users to analyze and fix errors in their
 * terminal commands and code files. It handles command-line arguments, manages the
 * interactive loop, and coordinates the debugging workflow.
 */

/* ----------------------------------------------------------------------------
 *  CLOI — Secure Agentic Debugger
 *  ----------------------------------------------------------------------------
 */

import chalk from 'chalk';
import boxen from 'boxen';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path, { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
// import { execSync } from 'child_process';

// Import from our modules
import { 
  BOX, 
  echoCommand, 
  truncateOutput, 
  createCommandBox, 
  askYesNo, 
  getReadline, 
  closeReadline, 
  askInput,
  ensureCleanStdin 
} from '../ui/terminalUI.js';
import { runCommand, ensureDir, writeDebugLog } from '../utils/cliTools.js';
import { readHistory, lastRealCommand, selectHistoryItem } from '../utils/history.js';
import { 
  analyzeWithLLM, 
  determineErrorType, 
  generateTerminalCommandFix, 
  generatePatch, 
  summarizeCodeWithLLM, 
  getInstalledModels as readModels, 
  getAllAvailableModels,
  installModelIfNeeded as installModel
} from '../core/index.js';
// RAG imports are loaded dynamically to allow CLI to work without dependencies
import { extractDiff, confirmAndApply } from '../utils/patch.js';
import { displaySnippetsFromError, readFileContext, extractFilesFromTraceback, buildErrorContext, getErrorLines } from '../utils/traceback.js';
import { startThinking } from '../core/ui/thinking.js';
// Import prompt builders for debugging
import { buildAnalysisPrompt, buildSummaryPrompt } from '../core/promptTemplates/analyze.js';
import { buildErrorTypePrompt } from '../core/promptTemplates/classify.js';
import { buildCommandFixPrompt } from '../core/promptTemplates/command.js';
import { buildPatchPrompt } from '../core/promptTemplates/patch.js';

// Import model configuration utilities
import { getDefaultModel } from '../utils/modelConfig.js';

// Import plugin manager for environment command
import { pluginManager } from '../core/plugin-manager/index.js';

// Get directory references
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* ───────────────────────── Interactive Loop ────────────────────────────── */
/**
 * Enhanced error detection function that recognizes various failure patterns
 * @param {string} output - The command output to analyze
 * @returns {boolean} - True if an error/failure is detected
 */
function detectFailure(output) {
  if (!output || typeof output !== 'string') return false;
  
  // Common failure patterns (case-insensitive)
  const failurePatterns = [
    /error/i,                    // Original pattern
    /failed/i,                   // "Failed to start", "Build failed", etc.
    /exception/i,                // JavaScript/Java exceptions
    /traceback/i,                // Python tracebacks
    /fatal/i,                    // Fatal errors
    /warning.*not found/i,       // Warnings about missing things
    /cannot find/i,              // "Cannot find module", etc.
    /no such file/i,            // File not found errors
    /permission denied/i,        // Permission issues
    /command not found/i,        // Command errors
    /syntax error/i,            // Code syntax issues
    /reference error/i,         // JavaScript reference errors
    /type error/i,              // Type errors
    /import error/i,            // Import/require errors
    /module.*not found/i,       // Module resolution failures
    /connection.*refused/i,     // Network connection issues
    /timeout/i,                 // Timeout errors
    /compilation.*failed/i,     // Build/compilation failures
    /abort/i,                   // Aborted operations
    /crash/i,                   // Application crashes
    /segmentation fault/i,      // Low-level crashes
    /stack overflow/i,          // Stack overflow errors
    /out of memory/i,           // Memory issues
    /invalid/i,                 // Invalid configurations, arguments, etc.
    /unauthorized/i,            // Auth failures
    /forbidden/i,               // Access denied
    /not implemented/i,         // Unimplemented features
    /deprecated/i,              // Deprecated warnings (often indicate issues)
    /unsupported/i             // Unsupported operations
  ];
  
  return failurePatterns.some(pattern => pattern.test(output));
}

/**
 * Runs the main interactive loop of the FigAI CLI.
 * Presents a prompt allowing the user to execute commands like /analyze, /debug, /history, /model.
 * Manages the state (last command, current model) between interactions.
 * @param {string|null} initialCmd - The initial command to have ready for analysis/debugging.
 * @param {number} limit - The history limit to use for /history selection.
 * @param {string} initialModel - The model to use.
 */
async function interactiveLoop(initialCmd, limit, initialModel) {
    let lastCmd = initialCmd;
    let currentModel = initialModel;
  
    while (true) {
      closeReadline(); // Ensure clean state before each iteration
      console.log(boxen(
        `${chalk.gray('Type a command: ')}
${chalk.blue('/debug')} - Auto-fix the last command
${chalk.blue('/analyze')} - Analyze an error
${chalk.blue('/index')} - Index codebase (RAG)
${chalk.blue('/model')} - Select AI model
${chalk.blue('/history')} - Browse command history
${chalk.blue('/environment')} - Show environment info
${chalk.blue('/status')} - System status
${chalk.blue('/workflow')} - Workflow management
${chalk.blue('/plugins')} - Plugin management
${chalk.blue('/session')} - Session management
${chalk.blue('/config')} - Configuration
${chalk.blue('/a2a')} - Agent-to-Agent protocol
${chalk.blue('/logging')} - Setup logging
${chalk.blue('/help')} - Show help`,
        BOX.PROMPT
      ));
      // Add improved gray text below the boxen prompt for exit instructions and /debug info
      console.log(chalk.gray('  Run /debug to auto-fix the last command, or ctrl+c when you\'re done.'));
  
      const input = await new Promise(r => {
        const rl = getReadline();
        rl.question('> ', t => {
          closeReadline(); // Clean up after getting input
          r(t.trim().toLowerCase());
        });
      });
  
      switch (input) {
        case '/debug': {
          process.stdout.write('\n');
          await debugLoop(lastCmd, limit, currentModel);
          process.stdout.write('\n');
          break;
        }

        case '/index': {
          process.stdout.write('\n');
          await indexCommand(currentModel);
          process.stdout.write('\n');
          break;
        }
  
        case '/history': {
          const sel = await selectHistoryItem(limit);
          if (sel) {
            lastCmd = sel;
            console.log(boxen(`Selected command: ${lastCmd}`, { ...BOX.OUTPUT, title: 'History Selection' }));
          }
          process.stdout.write('\n');
          break;
        }
  
        case '/model': {
          const newModel = await selectModelFromList();
          if (newModel) {
            currentModel = newModel;
            process.stdout.write('\n');
            
            const { setDefaultModel } = await import('../utils/modelConfig.js');
            const saveResult = await setDefaultModel(newModel);
            
            if (saveResult) {
              console.log(boxen(`Model ${currentModel} is now set as default`, { ...BOX.OUTPUT, title: 'Success' }));
            } else {
              console.log(boxen(`Using model: ${currentModel} for this session only`, BOX.PROMPT));
              console.log(chalk.gray('Failed to save as default model'));
            }
          }
          break;
        }
        
        case '/logging': {
          if (!process.env.SHELL || !process.env.SHELL.includes('zsh')) {
            console.log(boxen(
              `Terminal logging is only supported for zsh shell.\nYour current shell is: ${process.env.SHELL || 'unknown'}\n\nCLOI will still work but without auto-logging capabilities.`,
              { ...BOX.OUTPUT, title: 'Shell Not Supported' }
            ));
            break;
          }
          
          const { isLoggingEnabled, setupTerminalLogging, disableLogging } = await import('../utils/terminalLogger.js');
          const loggingEnabled = await isLoggingEnabled();
          
          if (loggingEnabled) {
            console.log(boxen(
              `Terminal logging is currently enabled.\nDo you want to disable it?`,
              { ...BOX.CONFIRM, title: 'Logging Status' }
            ));
            
            const shouldDisable = await askYesNo('Disable terminal logging?');
            if (shouldDisable) {
              const success = await disableLogging();
              console.log('\n');
              if (success) {
                console.log(boxen(
                  `Terminal logging has been disabled.\nPlease restart your terminal or run 'source ~/.zshrc' for changes to take effect.`,
                  { ...BOX.OUTPUT, title: 'Success' }
                ));
              } else {
                console.log(chalk.red('Failed to disable terminal logging.'));
              }
            }
          } else {
            const uiTools = { askYesNo, askInput, closeReadline };
            await setupTerminalLogging(uiTools, false);
          }
          break;
        }

        case '/analyze': {
          console.log(chalk.gray('Enter the error message to analyze:'));
          const errorMsg = await askInput('Error: ');
          if (errorMsg) {
            await runEnhancedCommand('analyze', errorMsg, { error: errorMsg, files: [] });
          }
          break;
        }

        case '/environment': {
          try {
            console.log(chalk.gray('  Discovering environment context...'));
            await pluginManager.discoverPlugins();
            const analyzer = await pluginManager.loadPlugin('analyzers', 'environment');
            if (analyzer && analyzer.instance) {
              // Initialize if needed
              if (analyzer.instance.initialize) {
                await analyzer.instance.initialize();
              }
              const env = await analyzer.instance.getEnvironment();
              console.log(chalk.cyan('\n🌍 Environment Context:\n'));
              
              // Format the output nicely
              console.log(chalk.blue('System:'));
              console.log(`  Platform: ${env.system?.platform || 'unknown'}`);
              console.log(`  Architecture: ${env.system?.arch || 'unknown'}`);
              console.log(`  Node Version: ${env.system?.nodeVersion || 'unknown'}`);
              
              if (env.project) {
                console.log(chalk.blue('\nProject:'));
                console.log(`  Directory: ${env.project.cwd}`);
                console.log(`  Has Git: ${env.project.hasGit ? 'Yes' : 'No'}`);
                console.log(`  Has package.json: ${env.project.hasPackageJson ? 'Yes' : 'No'}`);
              }
              
              if (env.tools) {
                console.log(chalk.blue('\nDevelopment Tools:'));
                Object.entries(env.tools).forEach(([tool, info]) => {
                  if (info && typeof info === 'object' && info.version) {
                    console.log(`  ${tool}: ${info.version}`);
                  }
                });
              }
              
              // Show full JSON if debug mode
              if (process.env.DEBUG) {
                console.log(chalk.gray('\nFull environment data:'));
                console.log(JSON.stringify(env, null, 2));
              }
            } else {
              console.log(chalk.yellow('Environment analyzer not available.'));
            }
          } catch (error) {
            console.log(chalk.red('Failed to load environment context:'), error.message);
          }
          break;
        }

        case '/status': {
          await runEnhancedCommand('status', null, {});
          break;
        }

        case '/workflow': {
          console.log(chalk.cyan('\n🔄 Workflow Management\n'));
          console.log('Available workflows:');
          console.log('  ' + chalk.green('auto-repair') + ' - Automatically fix failing tests and builds');
          console.log('  ' + chalk.green('code-review') + ' - AI-powered code review');
          console.log('  ' + chalk.green('deployment') + ' - Deployment workflow');
          console.log('  ' + chalk.green('test-debug') + ' - Debug failing tests');
          
          console.log(chalk.cyan('\nCommands:'));
          console.log('  execute <workflow> - Execute a workflow');
          console.log('  rollback <id>      - Rollback a workflow');
          
          console.log(chalk.gray('\nExamples:'));
          console.log(chalk.gray('  cloi workflow execute auto-repair'));
          console.log(chalk.gray('  cloi workflow execute code-review --context \'{"pr": 123}\''));
          console.log(chalk.gray('  cloi workflow rollback abc123'));
          
          const action = await askInput('\nWorkflow action (execute/rollback/cancel): ');
          if (action === 'execute') {
            const workflow = await askInput('Workflow name: ');
            if (workflow) {
              await runEnhancedCommand('workflow', 'execute', { workflow });
            }
          } else if (action === 'rollback') {
            const workflowId = await askInput('Workflow ID: ');
            if (workflowId) {
              await runEnhancedCommand('workflow', 'rollback', { 'workflow-id': workflowId });
            }
          }
          break;
        }

        case '/plugins': {
          console.log(chalk.cyan('\n📦 Plugin Management\n'));
          const action = await askInput('Plugin action (list/load/install/cancel): ');
          
          if (action === 'list') {
            await runEnhancedCommand('plugins', 'list', {});
          } else if (action === 'load') {
            console.log(chalk.gray('\nAvailable plugin types: analyzers, providers, quality, integrations'));
            console.log(chalk.gray('Example: analyzers:javascript'));
            const plugin = await askInput('Plugin to load (type:name): ');
            if (plugin) {
              await runEnhancedCommand('plugins', 'load', { plugin });
            }
          } else if (action === 'install') {
            console.log(chalk.gray('\nInstall plugins from npm (e.g., @cloi/plugin-python)'));
            const packageName = await askInput('NPM package name: ');
            if (packageName) {
              await runEnhancedCommand('plugins', 'install', { package: packageName });
            }
          }
          break;
        }

        case '/session': {
          console.log(chalk.cyan('\n📝 Session Management\n'));
          const action = await askInput('Session action (status/history/restore/export/cancel): ');
          
          if (action === 'status') {
            await runEnhancedCommand('session', 'status', {});
          } else if (action === 'history') {
            const limit = await askInput('Number of sessions to show (default: 10): ') || '10';
            await runEnhancedCommand('session', 'history', { limit: parseInt(limit) });
          } else if (action === 'restore') {
            console.log(chalk.yellow('⚠️  This will restore a previous session'));
            const force = await askYesNo('Force restore even if current session exists?');
            await runEnhancedCommand('session', 'restore', { force });
          } else if (action === 'export') {
            const sessionId = await askInput('Session ID to export: ');
            if (sessionId) {
              const output = await askInput('Output file (optional): ');
              await runEnhancedCommand('session', 'export', { sessionId, output });
            }
          }
          break;
        }

        case '/config': {
          console.log(chalk.cyan('\n⚙️  Configuration Management\n'));
          const action = await askInput('Config action (show/set/cancel): ');
          
          if (action === 'show') {
            await runEnhancedCommand('config', 'show', {});
          } else if (action === 'set') {
            console.log(chalk.gray('\nExample keys: providers.default, plugins.autoLoad, analysis.maxTokens'));
            const key = await askInput('Configuration key: ');
            if (key) {
              const value = await askInput('Value: ');
              if (value) {
                const scope = await askInput('Scope (user/project/system) [default: user]: ') || 'user';
                await runEnhancedCommand('config', 'set', { key, value, scope });
              }
            }
          }
          break;
        }

        case '/a2a': {
          console.log(chalk.cyan('\n🤖 Agent-to-Agent Protocol\n'));
          console.log('The A2A protocol enables multi-AI collaboration for complex debugging tasks.');
          
          console.log(chalk.cyan('\nCommands:'));
          console.log('  ' + chalk.green('start') + '  - Start A2A server for external AI connections');
          console.log('  ' + chalk.green('stop') + '   - Stop the running A2A server');
          console.log('  ' + chalk.green('status') + ' - Show current A2A server status');
          console.log('  ' + chalk.green('setup') + '  - Setup A2A integration with external AIs');
          
          console.log(chalk.gray('\nExamples:'));
          console.log(chalk.gray('  cloi a2a start --port 9090'));
          console.log(chalk.gray('  cloi a2a start --port 9090 --ai claude-code'));
          console.log(chalk.gray('  cloi a2a setup --ai github-copilot'));
          
          console.log(chalk.blue('\nSupported AI Integrations:'));
          console.log('  • Claude Code (claude-code)');
          console.log('  • GitHub Copilot (github-copilot)');
          console.log('  • Universal (universal) - Works with any A2A-compatible AI');
          
          const action = await askInput('\nA2A action (start/stop/status/setup/cancel): ');
          if (action === 'start') {
            const port = await askInput('Port (default: 9090): ') || '9090';
            const ai = await askInput('AI integration (default: universal): ') || 'universal';
            await runEnhancedCommand('a2a', 'start', { port: parseInt(port), ai });
          } else if (action === 'stop') {
            await runEnhancedCommand('a2a', 'stop', {});
          } else if (action === 'status') {
            await runEnhancedCommand('a2a', 'status', {});
          } else if (action === 'setup') {
            const ai = await askInput('AI to setup (claude-code/github-copilot/universal): ') || 'universal';
            await runEnhancedCommand('a2a', 'setup', { ai });
          }
          break;
        }

        case '/help':
          console.log(boxen(
            [
              '/debug       – let me fix that error for you',
              '/analyze     – analyze an error message',
              '/index       – scan your codebase for better debugging',
              '/model       – pick a different AI model',
              '/history     – browse and debug from history',
              '/environment – show environment context',
              '/status      – show system status',
              '/workflow    – workflow management',
              '/plugins     – plugin management',
              '/session     – session management',
              '/config      – configuration settings',
              '/a2a         – agent-to-agent protocol',
              '/logging     – set up automatic error logging',
              '/help        – show this menu',
            ].join('\n'),
            BOX.PROMPT
          ));
          break;
  
        case '':
          break;
  
        default:
          console.log(chalk.red('Not sure what that means! Try'), chalk.bold('/help'));
      }
    }
  }

/* ───────────────  Index command  ─────────────── */
/**
 * Command to index the current codebase for RAG
 * @param {string} currentModel - The current model for user feedback
 */
async function indexCommand(currentModel) {
  console.log(chalk.gray('  Let me scan your codebase for better debugging...\n'));
  await echoCommand('pwd');
  const { output: currentDir } = runCommand('pwd');
  
  // Check if indexing is enabled for this project
  console.log(chalk.gray('  Checking if enhanced indexing is ready for this project...'));
  
  try {
    // Check for CodeBERT model and offer download if missing
    const { installed: codeBertInstalled } = await checkCodeBERTModel();

    if (!codeBertInstalled) {
      console.log(boxen(
        `Enhanced codebase analysis requires the CodeBERT model.\n\n` +
        `This will enable me to:\n` +
        `• Understand semantic relationships in your code\n` +
        `• Find relevant files during debugging\n` +
        `• Provide better context-aware suggestions\n\n` +
        `Would you like to download it now?`,
        { ...BOX.CONFIRM, title: 'Enhanced Codebase Analysis' }
      ));
      
      const shouldDownload = await askYesNo('Download CodeBERT for enhanced analysis?');
      
      if (!shouldDownload) {
        console.log(boxen(
          `No problem! You can run /index again anytime to set up enhanced analysis.\n\n` +
          `For now, you'll get basic error analysis without codebase context.`,
          { ...BOX.OUTPUT_DARK, title: 'Basic Analysis Mode' }
        ));
        return;
      }
      
      // Offer to download the model
      const downloadSuccess = await downloadCodeBERTModel();
      
      if (!downloadSuccess) {
        console.log(boxen(
          `Model download didn't complete, but that's okay!\n\n` +
          `You can try again later with /index or continue with basic debugging.`,
          { ...BOX.OUTPUT_DARK, title: 'No Worries' }
        ));
        return;
      }
    }
    
    console.log(boxen(
      `Time to scan your codebase for better debugging!\nThis might take a few minutes for bigger projects.`,
      { ...BOX.CONFIRM, title: 'Codebase Indexing' }
    ));
    
    // Initialize RAG which will also do the indexing
    const { initializeRAGIfNeeded } = await import('../core/rag.js');
    const rootInfo = await initializeRAGIfNeeded(currentDir.trim());
    
    console.log(chalk.gray(`  Nice! Detected a ${rootInfo.type} project: ${path.basename(rootInfo.root)} (${rootInfo.confidence} confidence)`));
    
    // Ensure CodeBERT service is running before indexing (indexing requires embeddings)
    console.log(chalk.gray('  Starting up the AI service for code analysis...'));
    
    // Check if CodeBERT service is running, and start it if needed
    const { execSync } = await import('child_process');
    try {
      execSync('curl -s http://localhost:3090/health > /dev/null 2>&1', { timeout: 2000 });
      console.log(chalk.gray('  AI service is already running, perfect!'));
    } catch (error) {
      // Service not running, try to start it
      console.log(chalk.gray('  Firing up the AI service...'));
      
      try {
        // Import and start the service
        const { startCodeBERTService } = await import('../rag/embeddings.js');
        await startCodeBERTService();
        
        // Wait for service to start
        console.log(chalk.gray('  Waiting for CodeBERT service to start...'));
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Verify it started
        try {
          execSync('curl -s http://localhost:3090/health > /dev/null 2>&1', { timeout: 3000 });
          console.log(chalk.gray('  CodeBERT service started successfully'));
        } catch (verifyError) {
          console.log(chalk.gray('  CodeBERT service may still be starting...'));
          return false;
        }
      } catch (startError) {
        console.log(chalk.gray(`  Could not start CodeBERT service: ${startError.message}`));
        return false;
      }
    }
    
    // Force re-index regardless of existing state
    const { indexCodebase } = await import('../rag/index.js');
    console.log(chalk.gray('  Re-indexing codebase...'));
    
    const results = await indexCodebase(rootInfo.root, {
      maxFilesToProcess: 500, // More files for manual indexing
      batchSize: 20,
      forceReindex: true
    });
    
    console.log(boxen(
      `Indexing complete!\n` +
      `Project: ${path.basename(rootInfo.root)}\n` +
      `Files processed: ${results.fileCount}\n` +
      `Code chunks: ${results.chunkCount}\n` +
      `Vector embeddings: ${results.vectorStats?.vectorCount || 0}\n` +
      `BM25 documents: ${results.bm25Stats?.documentCount || 0}\n\n` +
      `Your codebase is now supercharged for debugging!`,
      { ...BOX.OUTPUT, title: 'Indexing Complete' }
    ));
    
  } catch (error) {
    console.log(boxen(
      `Indexing failed: ${error.message}\n\n` +
      `Common solutions:\n` +
      `• Ensure Python 3.7+ is installed\n` +
      `• Check your internet connection for model download\n` +
      `• Verify you're in a valid project directory\n` +
      `• Try running /index again to retry download\n\n` +
      `Cloi will continue to work with basic error analysis.`,
      { ...BOX.OUTPUT_DARK, title: 'Indexing Failed' }
    ));
  }
}

/* ───────────────────────── RAG Helper Functions ────────────────────────────── */
/**
 * Check if CodeBERT model is installed
 * @returns {Promise<{installed: boolean, modelPath: string}>}
 */
async function checkCodeBERTModel() {
  try {
    const path = await import('path');
    const fs = await import('fs');
    
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    const modelFilesDir = path.join(homeDir, '.cloi', 'models', 'codebert-base');
    
    // Check if model directory exists
    if (!fs.existsSync(modelFilesDir)) {
      return { installed: false, modelPath: modelFilesDir };
    }
    
    // Check for required files
    const requiredFiles = [
      'pytorch_model.bin',
      'tokenizer.json',
      'config.json',
      'vocab.json'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(modelFilesDir, file);
      if (!fs.existsSync(filePath)) {
        return { installed: false, modelPath: modelFilesDir };
      }
    }
    
    return { installed: true, modelPath: modelFilesDir };
  } catch (error) {
    return { installed: false, modelPath: '' };
  }
}

/**
 * Download CodeBERT model with user permission and progress feedback
 * @returns {Promise<boolean>} Whether download was successful
 */
async function downloadCodeBERTModel() {
  try {
    console.log(boxen(
      `CodeBERT model not found. This model enables enhanced error analysis with RAG.\n\n` +
      `Download details:\n` +
      `• Model: microsoft/codebert-base (~500MB)\n` +
      `• Location: ~/.cloi/models/codebert-base/\n` +
      `• Required for: Enhanced context retrieval\n\n` +
      `Would you like to download it now?`,
      { ...BOX.CONFIRM, title: 'CodeBERT Model Download' }
    ));
    
    const shouldDownload = await askYesNo('Download CodeBERT model?');
    
    if (!shouldDownload) {
      console.log(chalk.gray('\nSkipping CodeBERT download. Continuing with basic error analysis.'));
      return false;
    }
    
    console.log(boxen(
      `Starting CodeBERT model download...\nThis may take a few minutes depending on your internet connection.`,
      { ...BOX.OUTPUT, title: 'Downloading' }
    ));
    
    console.log(chalk.gray('  Initializing download process...'));
    
    // Try multiple approaches to run the setup script
    
    // Approach 1: Try npm run if we're in a project with cloi
    const approach1Success = await tryNpmRunApproach();
    if (approach1Success) return true;
    
    // Approach 2: Try finding global cloi installation
    const approach2Success = await tryGlobalCliApproach();
    if (approach2Success) return true;
    
    // Approach 3: Try direct Python script execution
    const approach3Success = await tryDirectPythonSetup();
    return approach3Success;
    
  } catch (error) {
    console.log(chalk.red(`Error during CodeBERT download: ${error.message}`));
    return false;
  }
}

/**
 * Try using npm run codebert-setup approach
 * @returns {Promise<boolean>} Whether setup was successful
 */
async function tryNpmRunApproach() {
  try {
    console.log(chalk.gray(`   Trying: npm run codebert-setup`));
    
    const { spawn } = await import('child_process');
    
    return new Promise((resolve) => {
      const downloadProcess = spawn('npm', ['run', 'codebert-setup'], {
        stdio: ['inherit', 'pipe', 'pipe'],
        cwd: process.cwd()
      });
      
      // Handle stdout with progress indicators
      downloadProcess.stdout.on('data', (data) => {
        const output = data.toString();
        
        if (output.includes('Found Python')) {
          console.log(chalk.gray('  Python environment detected'));
        } else if (output.includes('Downloading CodeBERT') || output.includes('downloaded successfully')) {
          console.log(chalk.gray('  Downloading CodeBERT model files...'));
        } else if (output.includes('setup completed')) {
          console.log(chalk.gray('  CodeBERT model setup completed'));
        } else if (output.trim() && !output.includes('npm WARN')) {
          console.log(chalk.gray(`   ${output.trim()}`));
        }
      });
      
      downloadProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('npm WARN') && !error.includes('UserWarning')) {
          console.log(chalk.gray(`   ${error.trim()}`));
        }
      });
      
      downloadProcess.on('close', (code) => {
        if (code === 0) {
          console.log(boxen(
            chalk.green('CodeBERT model downloaded successfully!\nEnhanced error analysis is now available.'),
            { ...BOX.OUTPUT, title: 'Download Complete' }
          ));
          resolve(true);
        } else {
          console.log(chalk.gray(`   npm approach failed with code ${code}, trying alternative...`));
          resolve(false);
        }
      });
      
      downloadProcess.on('error', (error) => {
        console.log(chalk.gray(`   npm approach failed: ${error.message}, trying alternative...`));
        resolve(false);
      });
      
      // Set timeout for npm approach
      setTimeout(() => {
        downloadProcess.kill();
        console.log(chalk.gray('   npm approach timed out, trying alternative...'));
        resolve(false);
      }, 30000); // 30 second timeout
    });
  } catch (error) {
    console.log(chalk.gray(`   npm approach error: ${error.message}, trying alternative...`));
    return false;
  }
}

/**
 * Try using global cloi binary approach  
 * @returns {Promise<boolean>} Whether setup was successful
 */
async function tryGlobalCliApproach() {
  try {
    console.log(chalk.gray(`   Trying: cloi codebert-setup (global CLI)`));
    
    const { spawn, execSync } = await import('child_process');
    
    // Check if cloi is available globally
    try {
      execSync('which cloi 2>/dev/null || where cloi 2>nul', { stdio: 'ignore' });
    } catch (error) {
      console.log(chalk.gray('   Global cloi command not found, trying direct approach...'));
      return false;
    }
    
    return new Promise((resolve) => {
      // Try to run cloi with a hypothetical setup command
      // Since cloi doesn't have a setup subcommand, this will likely fail
      // But we'll keep this for future extensibility
      const setupProcess = spawn('cloi', ['--setup-codebert'], {
        stdio: ['inherit', 'pipe', 'pipe']
      });
      
      setupProcess.on('close', (code) => {
        if (code === 0) {
          console.log(boxen(
            chalk.gray('CodeBERT model downloaded successfully!'),
            { ...BOX.OUTPUT, title: 'Download Complete' }
          ));
          resolve(true);
        } else {
          console.log(chalk.gray('   Global CLI approach failed, trying direct Python...'));
          resolve(false);
        }
      });
      
      setupProcess.on('error', (error) => {
        console.log(chalk.gray('   Global CLI approach failed, trying direct Python...'));
        resolve(false);
      });
      
      // Quick timeout since this approach likely won't work
      setTimeout(() => {
        setupProcess.kill();
        resolve(false);
      }, 5000);
    });
  } catch (error) {
    return false;
  }
}

/**
 * Alternative method to set up CodeBERT using direct Python execution
 * @returns {Promise<boolean>} Whether setup was successful
 */
async function tryDirectPythonSetup() {
  try {
    console.log(chalk.gray('   Trying: Direct Python script execution'));
    
    const { spawn, execSync } = await import('child_process');
    const path = await import('path');
    const fs = await import('fs');
    
    // Try multiple methods to find the CLOI installation directory
    let cloiPackagePath = null;
    let setupScriptPath = null;
    
    // Method 1: Try npm list to find global package
    try {
      const globalPath = execSync('npm list -g @cloi-ai/cloi --parseable 2>/dev/null', { encoding: 'utf-8' }).trim();
      if (globalPath && fs.existsSync(globalPath)) {
        cloiPackagePath = globalPath;
        setupScriptPath = path.join(cloiPackagePath, 'bin', 'codebert_setup.py');
        console.log(chalk.gray(`   Found CLOI at: ${cloiPackagePath}`));
      }
    } catch (error) {
      // Continue to next method
    }
    
    // Method 2: Try npm root global + package name
    if (!setupScriptPath) {
      try {
        const npmRoot = execSync('npm root -g 2>/dev/null', { encoding: 'utf-8' }).trim();
        if (npmRoot) {
          cloiPackagePath = path.join(npmRoot, '@cloi-ai/cloi');
          if (fs.existsSync(cloiPackagePath)) {
            setupScriptPath = path.join(cloiPackagePath, 'bin', 'codebert_setup.py');
            console.log(chalk.gray(`   Found CLOI at: ${cloiPackagePath}`));
          }
        }
      } catch (error) {
        // Continue to next method
      }
    }
    
    // Method 3: Try to find cloi binary and derive path
    if (!setupScriptPath) {
      try {
        const cloiPath = execSync('which cloi 2>/dev/null || where cloi 2>nul', { encoding: 'utf-8' }).trim();
        if (cloiPath) {
          // cloi binary is typically in bin/ directory, so go up one level
          const binDir = path.dirname(cloiPath);
          cloiPackagePath = path.dirname(binDir);
          setupScriptPath = path.join(cloiPackagePath, 'bin', 'codebert_setup.py');
          console.log(chalk.gray(`   Derived CLOI path from binary: ${cloiPackagePath}`));
        }
      } catch (error) {
        // Continue to next method
      }
    }
    
    // Method 4: Check if we're running from within cloi source
    if (!setupScriptPath) {
      // Get the directory where this CLI script is located
      const currentScriptDir = path.dirname(fileURLToPath(import.meta.url));
      const possibleCloiRoot = path.resolve(currentScriptDir, '..', '..');
      const possibleSetupScript = path.join(possibleCloiRoot, 'bin', 'codebert_setup.py');
      
      if (fs.existsSync(possibleSetupScript)) {
        cloiPackagePath = possibleCloiRoot;
        setupScriptPath = possibleSetupScript;
        console.log(chalk.gray(`   Using local CLOI installation: ${cloiPackagePath}`));
      }
    }
    
    // Final check: verify the setup script exists
    if (!setupScriptPath || !fs.existsSync(setupScriptPath)) {
      console.log(chalk.gray(`   Could not locate CodeBERT setup script. Searched:`));
      console.log(chalk.gray(`   - npm global packages`));
      console.log(chalk.gray(`   - cloi binary location`)); 
      console.log(chalk.gray(`   - local source directory`));
      console.log(chalk.gray(`   Please try running: npm install -g @cloi-ai/cloi`));
      return false;
    }
    
    console.log(chalk.gray(`   Running: python3 ${setupScriptPath}`));
    
    return new Promise((resolve) => {
      const pythonProcess = spawn('python3', [setupScriptPath], {
        stdio: ['inherit', 'pipe', 'pipe']
      });
      
      // Handle stdout
      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Found Python')) {
          console.log(chalk.gray('  Python environment detected'));
        } else if (output.includes('Downloading CodeBERT') || output.includes('downloaded successfully')) {
          console.log(chalk.gray('  Downloading CodeBERT model files...'));
        } else if (output.includes('setup completed') || output.includes('CodeBERT model setup complete')) {
          console.log(chalk.gray('  CodeBERT model setup completed'));
        } else if (output.trim()) {
          console.log(chalk.gray(`   ${output.trim()}`));
        }
      });
      
      // Handle stderr
      pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('UserWarning') && !error.includes('WARNING:')) {
          console.log(chalk.gray(`   ${error.trim()}`));
        }
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log(boxen(
            chalk.green('CodeBERT model downloaded successfully!\nEnhanced error analysis is now available.'),
            { ...BOX.OUTPUT, title: 'Download Complete' }
          ));
          resolve(true);
        } else {
          console.log(boxen(
            chalk.red(`Python setup failed with exit code ${code}.\nContinuing with basic error analysis.`),
            { ...BOX.OUTPUT_DARK, title: 'Setup Failed' }
          ));
          resolve(false);
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.log(chalk.gray(`   Python setup error: ${error.message}`));
        console.log(chalk.gray('   Make sure Python 3.7+ is installed and available.'));
        resolve(false);
      });
    });
  } catch (error) {
    console.log(chalk.gray(`   Direct Python setup failed: ${error.message}`));
    return false;
  }
}

/**
 * Check if RAG indices are populated for a project
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<{isPopulated: boolean, vectorCount: number, documentCount: number}>}
 */
async function isRAGPopulated(projectRoot) {
  try {
    const { getRAGStats } = await import('../rag/index.js');
    const stats = await getRAGStats(projectRoot);
    
    const vectorCount = stats.vectorStats?.vectorCount || 0;
    const documentCount = stats.bm25Stats?.documentCount || 0;
    
    return {
      isPopulated: vectorCount > 0 && documentCount > 0,
      vectorCount,
      documentCount
    };
  } catch (error) {
    // If we can't get stats, assume not populated
    return {
      isPopulated: false,
      vectorCount: 0,
      documentCount: 0
    };
  }
}

/**
 * Start CodeBERT service in background if RAG is populated but service isn't running
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<boolean>} Whether service was started or already running
 */
async function ensureCodeBERTServiceRunning(projectRoot) {
  try {
    // First check if RAG is populated
    const ragStatus = await isRAGPopulated(projectRoot);
    
    if (!ragStatus.isPopulated) {
      console.log(chalk.gray('  RAG indices not populated, skipping CodeBERT service startup'));
      return false;
    }
    
    // Check if CodeBERT service is already running
    const { execSync } = await import('child_process');
    try {
      execSync('curl -s http://localhost:3090/health > /dev/null 2>&1', { timeout: 2000 });

      return true;
    } catch (error) {
      // Service not running, try to start it
      console.log(chalk.gray('  Starting CodeBERT service in background...'));
      
      try {
        // Import and start the service
        const { startCodeBERTService } = await import('../rag/embeddings.js');
        await startCodeBERTService();
        
        // Wait a moment for service to start
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify it started
        try {
          execSync('curl -s http://localhost:3090/health > /dev/null 2>&1', { timeout: 3000 });
          console.log(chalk.green('  ✓ CodeBERT service started successfully'));
          return true;
        } catch (verifyError) {
          console.log(chalk.gray('  CodeBERT service may still be starting...'));
          return false;
        }
      } catch (startError) {
        console.log(chalk.gray(`  Could not start CodeBERT service: ${startError.message}`));
        return false;
      }
    }
  } catch (error) {
    console.log(chalk.gray(`  Error checking CodeBERT service: ${error.message}`));
    return false;
  }
}

/* ───────────────  Debug loop  ─────────────── */
/**
 * Main debugging loop that analyzes errors and fixes them.
 * 1. Runs the current command (`cmd`).
 * 2. If successful, breaks the loop.
 * 3. If error, analyzes the error (`analyzeWithLLM`).
 * 4. Determines error type (`determineErrorType`).
 * 5. If Terminal Issue: generates a new command (`generateTerminalCommandFix`), confirms with user, updates `cmd`.
 * 6. If Code Issue: generates a patch (`generatePatch`), confirms and applies (`confirmAndApply`).
 * 7. Logs the iteration details (`writeDebugLog`).
 * Continues until the command succeeds or the user cancels.
 * @param {string} initialCmd - The command to start debugging.
 * @param {number} limit - History limit (passed down from interactive loop/args).
 * @param {string} currentModel - The Ollama model to use.
 */
async function debugLoop(initialCmd, limit, currentModel) {
    const iterations = [];
    const ts = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 15);
    const logDir = join(__dirname, 'debug_history');
    await ensureDir(logDir);
    const logPath = join(logDir, `${ts}.txt`);
  
    // Get current working directory for context
    console.log(chalk.gray('  Let me see where we are first...'));
    await echoCommand('pwd');
    const { output: currentDir } = runCommand('pwd');
    
    // Check for CodeBERT model and offer download if missing
    const { installed: codeBertInstalled } = await checkCodeBERTModel();
    
    if (!codeBertInstalled) {
      // Offer to download the model
      const downloadSuccess = await downloadCodeBERTModel();
      
      if (!downloadSuccess) {
        console.log(chalk.gray('  No worries, we can still figure this out without the fancy AI stuff...'));
      }
    }
    
    // Initialize RAG system with enhanced messaging and capture project root
    let projectRoot = currentDir.trim(); // Default to current directory
    try {
      const { initializeRAGIfNeeded } = await import('../core/rag.js');
      const rootInfo = await initializeRAGIfNeeded(currentDir.trim());
      
      // Success - Show what was detected and use the detected project root
      console.log(chalk.gray(`  Sweet! I've got enhanced context for ${path.basename(rootInfo.root)} ready to go\n`));
      projectRoot = rootInfo.root; // Use the detected project root for patch application
      
      // Auto-start CodeBERT service if RAG is populated
      await ensureCodeBERTServiceRunning(rootInfo.root);
      
    } catch (error) {
      // Special handling for CodeBERT model issues - offer automatic setup
      console.log(boxen(
        `I see the CodeBERT model isn't set up yet.\n\n` +
        `Would you like me to download it now for enhanced debugging?\n` +
        `This will enable me to understand your codebase better.`,
        { ...BOX.CONFIRM, title: 'Enhanced Analysis Available' }
      ));
      
      const shouldSetupNow = await askYesNo('Download CodeBERT model for enhanced debugging?');
      
      if (shouldSetupNow) {
        console.log(chalk.blue('Great! Setting up enhanced analysis...'));
        const setupSuccess = await downloadCodeBERTModel();
        
        if (setupSuccess) {
          // Retry RAG initialization after successful model download
          try {
            const { initializeRAGIfNeeded } = await import('../core/rag.js');
            // Clear cache to force re-initialization
            const { clearRAGCache } = await import('../core/rag.js');
            clearRAGCache();
            
            const rootInfo = await initializeRAGIfNeeded(currentDir.trim());
            console.log(chalk.green(`  Enhanced context for ${path.basename(rootInfo.root)} is now ready!\n`));
            projectRoot = rootInfo.root;
            
            // Start CodeBERT service if needed
            await ensureCodeBERTServiceRunning(rootInfo.root);
          } catch (retryError) {
            console.log(chalk.gray(`  Setup completed, but indexing will happen in the background: ${retryError.message}`));
          }
        } else {
          console.log(chalk.gray('  No problem! I can still help you debug this the traditional way.'));
        }
      } else if (error.message.includes('project structure')) {
        console.log(boxen(
          `Hmm, this doesn't look like a typical project structure, but that's totally fine!\n\n` +
          `I'll just use my basic debugging skills instead...`,
          { ...BOX.OUTPUT_DARK, title: 'No Problem!' }
        ));
      } else if (error.message.includes('git repository')) {
        console.log(boxen(
          `I notice this isn't a git repo yet.\n\n` +
          `Pro tip: Running 'git init' helps me understand your project better,\n` +
          `but I can definitely work with what we have here!`,
          { ...BOX.OUTPUT_DARK, title: 'Just a Thought' }
        ));
      } else if (error.message.includes('Python') || error.message.includes('requirements')) {
        console.log(boxen(
          `Looks like we're missing some Python dependencies for the advanced stuff.\n\n` +
          `That's cool though - I've debugged plenty of code the old-fashioned way!\n` +
          `If you want the full experience later, just install Python 3.7+`,
          { ...BOX.OUTPUT_DARK, title: 'Python Missing' }
        ));
      } else {
        console.log(chalk.gray(`  Heads up: ${error.message}`));
        console.log(chalk.gray(`  But hey, I've got other tricks up my sleeve!`));
      }
    }
    
    // Initialize file content and summary variables outside try-catch scope
    let fileContentRaw = '';
    let fileContentWithLineNumbers = '';
    let codeSummary = '';
    let filePath = '';
    let isValidSourceFile = false; // Track if we have a valid source file
    // Initialize fileInfo with default values
    let fileInfo = null;
    
    // First, try to extract recent errors from terminal logs
    let cmd = initialCmd;
    console.log(chalk.gray('  Let me check if you\'ve got any recent errors logged...\n'));
    
    // Import and use the terminal log reader and logger
    const { readTerminalLogs, extractRecentError, isLikelyRuntimeError } = await import('../utils/terminalLogs.js');
    const { isLoggingEnabled } = await import('../utils/terminalLogger.js');
    
    // Check if terminal logging is enabled (for zsh users)
    const loggingEnabled = process.env.SHELL?.includes('zsh') ? await isLoggingEnabled() : false;
    
    // Show the equivalent command for reading terminal logs
    if (loggingEnabled) {
      await echoCommand('tail -n 750 ~/.cloi/terminal_output.log');
    }
    
    // Try to get error from logs first
    const { error: logError, files: logFiles } = await extractRecentError();
    
    // Variables to store final error output
    let ok = true;
    let output = '';
    
    // If we found a likely runtime error in logs
    if (logError && logFiles.size > 0) {
      console.log(chalk.gray(`  Ah, found something! Looks like this happened when you ran: ${initialCmd}\n`));
      
      
      // // List all files that caused the error
      // if (logFiles.size > 0) {
      //   console.log(chalk.gray('Files with errors:'));
      //   for (const file of logFiles.keys()) {
      //     console.log(chalk.gray(`  - ${file}`));
      //   }
      // }
      
      // Show the last 5 lines of the traceback error
      const errorLines = logError.split('\n');
      const lastFiveLines = errorLines.slice(Math.max(0, errorLines.length - 3));
      
      // Add simple dividers to indicate error section
      console.log(chalk.gray('  Here\'s what went wrong:'));
      lastFiveLines.forEach(line => console.log(chalk.gray(`  ${line}`)));
      
      output = logError;
      ok = false; // Mark as error since we found one
    } else {
      // If logging is not enabled and this is a zsh shell, suggest enabling it
      if (!loggingEnabled && process.env.SHELL?.includes('zsh')) {
        console.log(boxen(
          chalk.gray('Quick tip: Enable terminal logging with /logging and I can catch errors automatically!\nJust needs a terminal restart to work its magic.'),
          { ...BOX.OUTPUT_DARK, title: 'Tip' }
        ));
      }
      
      // Fall back to running the command - show appropriate message based on logging status
      if (!loggingEnabled) {
        console.log(chalk.gray('  No logging setup, so let me run this and see what happens...'));
      } else {
        console.log(chalk.gray('  Nothing in the logs, so let me try running this fresh...'));
      }
      await echoCommand(cmd);
      ({ ok, output } = runCommand(cmd));
    }
    
    if (ok && !detectFailure(output)) {
      console.log(boxen(chalk.green('Wait... this actually worked fine! No errors here.'), { ...BOX.OUTPUT, title: 'All Good!' }));
      return;
    }
      
    // Extract possible file paths from the command or error logs
      try {
    // If we extracted error from logs and have file paths already, use those
    if (logError && logFiles && logFiles.size > 0) {
      // Use the first file from the logs
      filePath = Array.from(logFiles.keys())[0];

      
              // Check if it's a valid file
        isValidSourceFile = filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile();
        
        // If not a file, try as absolute path relative to project root
        if (!isValidSourceFile && filePath && !filePath.startsWith('/')) {
        filePath = join(projectRoot, filePath);
        isValidSourceFile = fs.existsSync(filePath) && fs.statSync(filePath).isFile();
      }
    } else {
      // Extract possible filename from commands like "python file.py", "node script.js", etc.
      let possibleFile = initialCmd;
      
      // Common command prefixes to check for
      const commandPrefixes = ['python', 'python3', 'node', 'ruby', 'perl', 'php', 'java', 'javac', 'bash', 'sh'];
      
      // Check if the command starts with any of the common prefixes
      for (const prefix of commandPrefixes) {
        if (initialCmd.startsWith(prefix + ' ')) {
          // Extract everything after the prefix and a space
          possibleFile = initialCmd.substring(prefix.length + 1).trim();
          break;
        }
      }
      
      // Further extract arguments if present (get first word that doesn't start with -)
      possibleFile = possibleFile.split(' ').find(part => part && !part.startsWith('-')) || '';
      
      // First check relative path
      filePath = possibleFile;
      isValidSourceFile = filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile();
      
      // If not a file, try as absolute path relative to project root
      if (!isValidSourceFile && filePath && !filePath.startsWith('/')) {
        filePath = join(projectRoot, filePath);
        isValidSourceFile = fs.existsSync(filePath) && fs.statSync(filePath).isFile();
      }
    }
    
    // Check if we need additional context from the file
          // We'll read file content only if:
      // 1. It's a valid file AND
      // 2. There are NO clear error lines in the traceback
      const filesWithErrors = extractFilesFromTraceback(output);
      const hasErrorLineInfo = filesWithErrors.size > 0;
      
      if (isValidSourceFile && !hasErrorLineInfo) {
        console.log(chalk.gray(`  Let me take a look at your code to understand what's going on...`));
        // Show the sed command that will be used
        const start = 1; // Since we want first 200 lines, starting from line 1
        const end = 200; // Read first 200 lines
        const sedCmd = `sed -n '${start},${end}p' ${filePath}`;
        await echoCommand(sedCmd);
        
        // Use readFileContext to get the first 200 lines (using line 100 as center with ctx=100)
        const fileContentInfo = readFileContext(filePath, 100, 100);
        fileContentRaw = fileContentInfo.content;
        
        // Create a version with line numbers for analysis
        fileContentWithLineNumbers = fileContentRaw.split('\n')
          .map((line, index) => `${fileContentInfo.start + index}: ${line}`)
          .join('\n');
        
        // Create file info object with content and line range
        fileInfo = {
          content: fileContentRaw,
          withLineNumbers: fileContentWithLineNumbers,
          start: fileContentInfo.start,
          end: fileContentInfo.end,
          path: filePath
        };
        
        // Summarize code without displaying the prompt
        
        // Summarize the content - use the version with line numbers for better context
        const { summary, wasStreamed } = await summarizeCodeWithLLM(fileContentWithLineNumbers, currentModel);
        codeSummary = summary;
        
        // Only display summary if it wasn't already streamed
        if (!wasStreamed) {
          console.log('\n' +'  ' + chalk.gray(codeSummary) + '\n');
        }
      }
    } catch (error) {
      console.log(chalk.gray(`  Couldn't get the enhanced context this time: ${error.message}`));
    }
  
    // Skip displaying snippets to avoid spacing issues - analysis will handle context
    
    /* eslint-disable no-await-in-loop */
    while (true) {
      // First, run analysis like /analyze would do, but pass additional context
      // Build the analysis prompt but don't display it
      
      // Enhance file info with RAG context
      const currentFileInfo = fileInfo || { 
        content: fileContentRaw, 
        withLineNumbers: fileContentWithLineNumbers, 
        start: 1, 
        end: fileContentRaw ? fileContentRaw.split('\n').length : 0, 
        path: filePath 
      };
      
      // Enhance with RAG context
      let enhancedFileInfo = currentFileInfo;
      try {
        const { enhanceWithRAG } = await import('../core/rag.js');
        enhancedFileInfo = await enhanceWithRAG(output, currentFileInfo, projectRoot);
        
        // If we have RAG context, display a clean summary
        if (enhancedFileInfo.ragContext) {
          const rootFile = enhancedFileInfo.ragContext.rootCauseFile;
          const relatedFiles = enhancedFileInfo.ragContext.relatedFiles || [];
          
          // Add spacing before RAG context
          console.log();
          
          if (rootFile) {
            const lineInfo = rootFile.startLine && rootFile.endLine ? 
              ` (lines ${rootFile.startLine}-${rootFile.endLine})` : '';
            
            console.log(chalk.gray(`  I think I found the main culprit in ${path.basename(rootFile.path)}${lineInfo}`));
            
            // Show sed command for root cause file after the description
            if (rootFile.startLine && rootFile.endLine) {
              const start = Math.max(1, rootFile.startLine - 30);
              const end = rootFile.endLine + 30;
              await echoCommand(`sed -n '${start},${end}p' ${path.basename(rootFile.path)}`);
            }
          }
          
          if (relatedFiles.length > 0) {
            console.log(chalk.gray(`  Also found ${relatedFiles.length} other files that might be connected:`));
            
            // Show sed commands for related files after the description
            for (const file of relatedFiles) {
              if (file.startLine && file.endLine) {
                const startRel = Math.max(1, file.startLine - 30);
                const endRel = file.endLine + 30;
                await echoCommand(`sed -n '${startRel},${endRel}p' ${path.basename(file.path)}`);
              }
            }
          }
          
          // Add spacing after RAG context to separate from analysis
          console.log();
        }
      } catch (error) {
        console.log(chalk.gray(`  Note: RAG enhancement skipped: ${error.message}`));
      }
      
      const { analysis, reasoning: analysisReasoning, wasStreamed } = await analyzeWithLLM(
        output, 
        currentModel, 
        enhancedFileInfo,
        codeSummary, 
        filePath
      );
      
      // Display reasoning if available
      if (analysisReasoning) {
        console.log(boxen(analysisReasoning, { ...BOX.OUTPUT_DARK, title: 'Reasoning' }));
      }
      
      // Only display analysis if it wasn't already streamed
      if (!wasStreamed) {
        console.log('  ' + chalk.gray(analysis.replace(/\n/g, '\n  ')));
      }
      
      // Determine if this is a terminal command issue using LLM
      // Determine error type without displaying the prompt
      
      const errorType = await determineErrorType(output, analysis, currentModel);
      // Display error type as indented gray text
      console.log('  ' + chalk.gray(errorType));
      
      if (errorType === "TERMINAL_COMMAND_ERROR") {
        // Generate a new command to fix the issue
        const prevCommands = iterations.map(i => i.patch).filter(Boolean);
        
        // Generate command fix without displaying the prompt
        
        const { command: newCommand, reasoning: cmdReasoning } = await generateTerminalCommandFix(prevCommands, analysis, currentModel);
        
        // Display command reasoning if available
        if (cmdReasoning) {
          console.log(boxen(cmdReasoning, { ...BOX.OUTPUT_DARK, title: 'Command Reasoning' }));
        }
        // Show the proposed command
        console.log(boxen(newCommand, { ...BOX.OUTPUT, title: 'Proposed Command' }));
        
        // Ask for confirmation
        if (!(await askYesNo('Run this command?'))) {
          console.log(chalk.gray('\nNo worries! Let me know if you want to try something else.'));
          break;
        }
        
        // Update the command for the next iteration
        cmd = newCommand;
        iterations.push({ error: output, patch: newCommand, analysis: analysis });
      } else {
        // Original code file patching logic
        const prevPatches = iterations.map(i => i.patch);
        
        // Extract file paths and line numbers from the traceback
        const filesWithErrors = extractFilesFromTraceback(output);
        const errorFiles = Array.from(filesWithErrors.keys()).join('\n');
        const errorLines = Array.from(filesWithErrors.values()).join('\n');
        
        // Get the exact lines of code where errors occur
        const exactErrorCode = getErrorLines(output);
        
        // Get the code context with reduced context size (±3 lines)
        const context = buildErrorContext(output, 3, false);
        
        // Generate patch without displaying the prompt
        
        const { diff: rawDiff, reasoning: patchReasoning } = await generatePatch(
          output,
          prevPatches,
          analysis,
          projectRoot,
          currentModel,
          enhancedFileInfo, // Use the RAG-enhanced file info
          codeSummary
        );
        
        // Display patch reasoning if available
        if (patchReasoning) {
          console.log(boxen(patchReasoning, { ...BOX.OUTPUT_DARK, title: 'Patch Reasoning' }));
        }
                
        // Just extract the diff without displaying it
        const cleanDiff = extractDiff(rawDiff);
        
        // Check if we have a valid diff
        const isValidDiff = 
          // Standard unified diff format
          (cleanDiff.includes('---') && cleanDiff.includes('+++')) || 
          // Path with @@ hunks and -/+ changes
          (cleanDiff.includes('@@') && cleanDiff.includes('-') && cleanDiff.includes('+')) ||
          // File path and -/+ lines without @@ marker (simpler format)
          (cleanDiff.includes('/') && cleanDiff.includes('-') && cleanDiff.includes('+'));
        
        if (!isValidDiff) {
          console.error(chalk.red('  Hmm, I couldn\'t generate a proper fix for this one. The error might be trickier than I thought.'));
          break;
        }
  
        const applied = await confirmAndApply(cleanDiff, projectRoot);
        
        if (!applied) {
          console.log(chalk.gray('\n  No problem! Feel free to try /debug again anytime.'));
          break;
        }
  
        iterations.push({ error: output, patch: cleanDiff, analysis: analysis });
        
        // Write the debug log
        await writeDebugLog(iterations, logPath);
        //console.log(chalk.gray(`Saved our debugging session to ${logPath} for your records`));
        
        // Exit the loop after applying the patch instead of running the command again
        console.log(chalk.green('\n  Patch applied! You should be good to go now.'));
        break;
      }
      
      await writeDebugLog(iterations, logPath);
      //console.log(chalk.gray(`  Saved our debugging session to ${logPath} for your records`));
    }
  }
  

/* ───────────────  Enhanced command delegation  ─────────────── */

/**
 * Delegate enhanced commands to the modular CLI
 */
async function runEnhancedCommand(command, subcommand, argv) {
  try {
    // Import the modular CLI functions
    const modularModule = await import('./modular.js');
    
    // Map commands to their handlers
    switch (command) {
      case 'plugins':
        if (subcommand === 'list') {
          const { listPlugins } = modularModule;
          await listPlugins(argv);
        } else if (subcommand === 'load') {
          const { loadPlugin } = modularModule;
          await loadPlugin(argv);
        }
        break;
        
      case 'analyze':
        const { analyzeError } = modularModule;
        await analyzeError(argv);
        break;
        
      case 'session':
        if (subcommand === 'status') {
          const { sessionStatus } = modularModule;
          await sessionStatus(argv);
        } else if (subcommand === 'history') {
          const { sessionHistory } = modularModule;
          await sessionHistory(argv);
        } else if (subcommand === 'restore') {
          const { restoreSession } = modularModule;
          await restoreSession(argv);
        }
        break;
        
      case 'workflow':
        if (subcommand === 'execute') {
          const { executeWorkflow } = modularModule;
          await executeWorkflow(argv);
        } else if (subcommand === 'rollback') {
          const { rollbackWorkflow } = modularModule;
          await rollbackWorkflow(argv);
        }
        break;
        
      case 'config':
        if (subcommand === 'show') {
          const { showConfig } = modularModule;
          await showConfig(argv);
        } else if (subcommand === 'set') {
          const { setConfig } = modularModule;
          await setConfig(argv);
        }
        break;
        
      case 'status':
        const { systemStatus } = modularModule;
        await systemStatus(argv);
        break;
        
      case 'a2a':
        if (subcommand === 'start') {
          const { startA2AServer } = modularModule;
          await startA2AServer(argv);
        } else if (subcommand === 'stop') {
          const { stopA2AServer } = modularModule;
          await stopA2AServer(argv);
        } else if (subcommand === 'status') {
          const { getA2AStatus } = modularModule;
          await getA2AStatus(argv);
        } else if (subcommand === 'setup') {
          const { setupA2A } = modularModule;
          await setupA2A(argv);
        }
        break;
        
      default:
        console.error(chalk.red(`Unknown enhanced command: ${command}`));
        process.exit(1);
    }
    
    // Exit after enhanced command execution to prevent legacy loop
    process.exit(0);
    
  } catch (error) {
    console.error(chalk.red('Enhanced command failed:'), error.message);
    process.exit(1);
  }
}

/* ───────────────────────────────  Main  ──────────────────────────────── */

/**
 * Main entry point for the Cloi CLI application.
 * Parses command line arguments using yargs, displays a banner,
 * and routes execution based on the provided flags (`--analyze`, `--debug`, `--history`, `model`).
 * Handles fetching the last command and initiating the appropriate loop (interactive or debug).
 */
(async function main() {
    const argv = yargs(hideBin(process.argv))
      .scriptName('cloi')
      .usage('$0 [command] [options]')
      
      // Legacy options (maintained for backward compatibility)
      .option('model', {
        alias: 'm',
        describe: 'Ollama model to use for completions',
        default: null,
        type: 'string'
      })
      .option('setup-logging', {
        describe: 'Set up automatic terminal logging',
        type: 'boolean'
      })
      
      // Legacy commands (for backward compatibility)
      .command('debug', 'Debug the last command from terminal history', {}, async (argv) => {
        // This starts the interactive loop which will handle /debug
        const lastCmd = await lastRealCommand();
        if (!lastCmd) {
          console.log(chalk.gray('No recent commands found in history.'));
          return;
        }
        console.log(boxen(lastCmd, { ...BOX.WELCOME, title: 'Last Command'}));
        await interactiveLoop(lastCmd, 15, argv.model || await getDefaultModel());
      })
      
      .command('index', 'Index codebase for enhanced analysis (RAG)', {}, async (argv) => {
        await indexCommand(argv.model || await getDefaultModel());
      })
      
      .command('history [limit]', 'Select and debug a command from history', {
        limit: {
          describe: 'Number of recent commands to show',
          type: 'number',
          default: 15
        }
      }, async (argv) => {
        const selectedCmd = await selectHistoryItem(argv.limit);
        if (selectedCmd) {
          console.log(boxen(selectedCmd, { ...BOX.WELCOME, title: 'Selected Command'}));
          await interactiveLoop(selectedCmd, argv.limit, argv.model || await getDefaultModel());
        } else {
          console.log(chalk.gray('No command selected.'));
        }
      })
      
      .command('model', 'Select AI model to use', {}, async () => {
        const selectedModel = await selectModelFromList();
        if (selectedModel) {
          console.log(chalk.green(`Selected model: ${selectedModel}`));
          // Save as default for future use
          const { saveDefaultModel } = await import('../utils/modelConfig.js');
          await saveDefaultModel(selectedModel);
          console.log(chalk.gray('Model saved as default.'));
        }
      })
      
      .command('logging', 'Setup automatic terminal logging', {}, async () => {
        const { setupTerminalLogging } = await import('../utils/terminalLogger.js');
        const { askYesNo, askInput, closeReadline } = await import('../ui/terminalUI.js');
        const uiTools = { askYesNo, askInput, closeReadline };
        const setupResult = await setupTerminalLogging(uiTools, true);
        if (!setupResult) {
          console.log(chalk.gray('Terminal logging setup was not completed.'));
        } else {
          console.log(boxen(
            chalk.green('Terminal logging has been enabled.\nRestart your terminal for changes to take effect.'),
            { ...BOX.OUTPUT, title: 'Success' }
          ));
        }
      })
      
      .command('environment', 'Show environment context and system information', {}, async () => {
        // This provides environmental awareness for better debugging
        try {
          await pluginManager.discoverPlugins();
          const analyzer = await pluginManager.loadPlugin('analyzers', 'environment');
          if (analyzer && analyzer.instance) {
            // Initialize if not already done
            if (analyzer.instance.initialize) {
              await analyzer.instance.initialize();
            }
            const env = await analyzer.instance.getEnvironment();
            console.log(chalk.cyan('🌍 Environment Context:\n'));
            console.log(JSON.stringify(env, null, 2));
          } else {
            console.log(chalk.yellow('Environment analyzer not available.'));
          }
        } catch (error) {
          console.log(chalk.yellow('Could not load environment analyzer.'));
          console.log(chalk.gray(error.message));
        }
      })

      // Enhanced modular commands
      .command('plugins', 'Plugin management commands', (yargs) => {
        return yargs
          .command('list', 'List all available plugins', {}, async (argv) => {
            await runEnhancedCommand('plugins', 'list', argv);
          })
          .command('load <plugin>', 'Load a specific plugin', {
            plugin: {
              describe: 'Plugin name in format type:name',
              type: 'string'
            }
          }, async (argv) => {
            await runEnhancedCommand('plugins', 'load', argv);
          })
          .command('install <package>', 'Install a plugin from npm', {
            package: {
              describe: 'npm package name',
              type: 'string'
            }
          }, async (argv) => {
            await runEnhancedCommand('plugins', 'install', argv);
          });
      })
      
      .command('analyze <error>', 'Analyze an error using the enhanced system', {
        error: {
          describe: 'Error message or file containing error',
          type: 'string'
        },
        files: {
          describe: 'Files related to the error',
          type: 'array',
          default: []
        },
        context: {
          describe: 'Additional context (JSON string)',
          type: 'string'
        }
      }, async (argv) => {
        await runEnhancedCommand('analyze', argv.error, argv);
      })
      
      .command('session', 'Session management', (yargs) => {
        return yargs
          .command('status', 'Show current session status', {}, async (argv) => {
            await runEnhancedCommand('session', 'status', argv);
          })
          .command('history [limit]', 'Show session history', {
            limit: {
              describe: 'Number of sessions to show',
              type: 'number',
              default: 10
            }
          }, async (argv) => {
            await runEnhancedCommand('session', 'history', argv);
          })
          .command('restore', 'Restore previous session', {
            force: {
              describe: 'Force restore even if current session exists',
              type: 'boolean',
              default: false
            }
          }, async (argv) => {
            await runEnhancedCommand('session', 'restore', argv);
          })
          .command('export <sessionId>', 'Export session data', {
            sessionId: {
              describe: 'Session ID to export',
              type: 'string'
            },
            output: {
              describe: 'Output file',
              type: 'string'
            }
          }, async (argv) => {
            await runEnhancedCommand('session', 'export', argv);
          })
          .command('recovery-info', 'Show session recovery information', {}, async (argv) => {
            await runEnhancedCommand('session', 'recovery-info', argv);
          });
      })
      
      .command('workflow', 'Workflow management', (yargs) => {
        return yargs
          .command('execute <workflow>', 'Execute a workflow', {
            workflow: {
              describe: 'Workflow name or type',
              type: 'string'
            },
            context: {
              describe: 'Workflow context (JSON string)',
              type: 'string'
            },
            'dry-run': {
              describe: 'Show what would be done without executing',
              type: 'boolean',
              default: false
            }
          }, async (argv) => {
            await runEnhancedCommand('workflow', 'execute', argv);
          })
          .command('rollback <workflow-id>', 'Rollback a workflow', {
            'workflow-id': {
              describe: 'Workflow ID to rollback',
              type: 'string'
            },
            force: {
              describe: 'Force rollback without confirmation',
              type: 'boolean',
              default: false
            }
          }, async (argv) => {
            await runEnhancedCommand('workflow', 'rollback', argv);
          });
      })
      
      .command('config', 'Configuration management', (yargs) => {
        return yargs
          .command('show', 'Show current configuration', {}, async (argv) => {
            await runEnhancedCommand('config', 'show', argv);
          })
          .command('set <key> <value>', 'Set configuration value', {
            key: { type: 'string' },
            value: { type: 'string' },
            scope: {
              describe: 'Configuration scope (user, project, system)',
              type: 'string',
              default: 'user'
            }
          }, async (argv) => {
            await runEnhancedCommand('config', 'set', argv);
          });
      })
      
      .command('status', 'Show enhanced system status', {}, async (argv) => {
        await runEnhancedCommand('status', null, argv);
      })
      
      .command('a2a', 'Agent-to-Agent protocol commands', (yargs) => {
        return yargs
          .command('start', 'Start A2A server', {
            port: {
              describe: 'Port to listen on',
              type: 'number',
              default: 9090
            },
            ai: {
              describe: 'AI integration type',
              type: 'string',
              default: 'universal'
            }
          }, async (argv) => {
            await runEnhancedCommand('a2a', 'start', argv);
          })
          .command('stop', 'Stop A2A server', {}, async (argv) => {
            await runEnhancedCommand('a2a', 'stop', argv);
          })
          .command('status', 'Show A2A server status', {}, async (argv) => {
            await runEnhancedCommand('a2a', 'status', argv);
          })
          .command('setup', 'Setup A2A integration', {
            ai: {
              describe: 'AI type to setup (claude-code, github-copilot, universal)',
              type: 'string',
              default: 'universal'
            }
          }, async (argv) => {
            await runEnhancedCommand('a2a', 'setup', argv);
          });
      })
      
      .help().alias('help', '?')
      .epilog('CLOI - Security-first agentic debugging tool with modular architecture.')
      .parse();
    
    // Check if user explicitly requested to set up terminal logging
    if (argv.setupLogging) {
      const { setupTerminalLogging } = await import('../utils/terminalLogger.js');
      const { askYesNo, askInput, closeReadline } = await import('../ui/terminalUI.js');
      const uiTools = { askYesNo, askInput, closeReadline };
      // Show model selection during explicit setup
      const setupResult = await setupTerminalLogging(uiTools, true);
      if (!setupResult) {
        console.log(chalk.gray('Terminal logging setup was not completed.'));
      } else {
        console.log(boxen(
          chalk.green('Terminal logging has been enabled.\nAfter restarting your terminal, ALL commands will be automatically logged without any prefix.'),
          { ...BOX.OUTPUT, title: 'Success' }
        ));
      }
      process.exit(0);
    }
  
    // Load default model from config or use command line argument if provided
    let currentModel;
    
    try {
      // First try to get the user's saved default model
      const savedModel = await getDefaultModel();
      
      // If command-line argument is provided, it overrides the saved default
      currentModel = argv.model || savedModel;
    } catch (error) {
      console.error(chalk.gray(`Error loading default model: ${error.message}`));
      currentModel = 'phi4:latest';
    }
    
    
    
    if (currentModel) {
      // Check if model is available based on its provider
      const { getModelProvider, PROVIDERS } = await import('../utils/providerConfig.js');
      const provider = getModelProvider(currentModel);
      
      if (provider === PROVIDERS.CLAUDE) {
        // For Claude models, check if API key is available
        const { isClaudeAvailable } = await import('../utils/apiKeyManager.js');
        const claudeAvailable = await isClaudeAvailable();
        
        if (!claudeAvailable) {
          console.log(boxen(
            `Claude API key not found. Please set your API key:\n\nexport ANTHROPIC_API_KEY="your-api-key-here"\n\nAdd this to your ~/.zshrc or ~/.bashrc file.\nAlternatively, select an Ollama model instead.`,
            { ...BOX.OUTPUT, title: 'Claude API Key Required' }
          ));
          
          console.log(chalk.gray('Falling back to default Ollama model.'));
          currentModel = 'phi4:latest';
        }
      } else {
        // For Ollama models, check if they're installed
        const installedModels = await readModels();
        
        if (!installedModels.includes(currentModel)) {
          console.log(boxen(
            `Looks like ${currentModel} isn't installed yet. Want me to grab it?\nThis might take a few minutes.\n\nProceed (y/N):`,
            { ...BOX.CONFIRM, title: 'Model Installation' }
          ));
          
          const response = await askYesNo('', true);
          console.log(response ? 'y' : 'N');
          
          if (response) {
            console.log(chalk.blue(`Getting ${currentModel} ready for you...`));
            const success = await installModel(currentModel);
            
            if (!success) {
              console.log(chalk.gray(`Couldn't install ${currentModel}. I'll use the default instead.`));
              currentModel = 'phi4:latest';
            } else {
              console.log(chalk.green(`Great! ${currentModel} is ready to go.`));
            }
          } else {
            console.log(chalk.gray(`No problem, I'll stick with the default.`));
            currentModel = 'phi4:latest';
          }
        }
      }
    }
    
    const banner = chalk.blueBright.bold('Cloi') + ' — secure agentic debugging tool';
    console.log(boxen(
      `${banner}\n↳ model: ${currentModel}\n↳ completely local and secure`,
      BOX.WELCOME
    ));
    
    // Check if terminal logging should be set up (only for zsh users)
    if (process.env.SHELL && process.env.SHELL.includes('zsh')) {
      const { isLoggingEnabled, setupTerminalLogging } = await import('../utils/terminalLogger.js');
      
      // Only prompt if logging is not already enabled
      if (!(await isLoggingEnabled())) {
        try {
          const uiTools = { askYesNo, askInput, closeReadline };
          // Show model selection during first-run setup
          const setupResult = await setupTerminalLogging(uiTools, true);
          
          // If user gave permission to set up logging, ensure clean exit
          if (setupResult) {
            // Process will exit in setupTerminalLogging
            return;
          }
        } catch (error) {
          console.error(chalk.red(`Oops, something went wrong during setup: ${error.message}`));
          // Continue with normal execution if setup fails
        }
      }
    }
  
    const lastCmd = await lastRealCommand();
    if (!lastCmd) {
      console.log(chalk.gray('Hmm, I don\'t see any recent commands in your history.'));
      return;
    }

    console.log(boxen(lastCmd, { ...BOX.WELCOME, title: 'Last Command I Saw'}));
    await interactiveLoop(lastCmd, 15, currentModel);
  })().catch(err => {
    console.error(chalk.red(`Uh oh, something went wrong: ${err.message}`));
    process.exit(1);
  });

/* ───────────────────────── Model Selection ────────────────────────────── */
/**
 * Allows the user to select a model using an interactive picker.
 * @returns {Promise<string|null>} - Selected model or null if canceled
 */
export async function selectModelFromList() {
  const { makePicker } = await import('../ui/terminalUI.js');
  
  try {
    console.log(boxen('Loading available models...', BOX.OUTPUT));
    
    // Get all models from both providers with proper categorization
    const { getAllProvidersModels, PROVIDERS } = await import('../utils/providerConfig.js');
    const allModels = await getAllProvidersModels();
    
    if (allModels.length === 0) {
      console.log(boxen(
        chalk.gray('No models found. Please install Ollama and at least one model, or configure your Claude API key.'),
        { ...BOX.OUTPUT, title: 'Error' }
      ));
      return null;
    }
    
    // Separate models by provider
    const ollamaModels = allModels.filter(m => m.provider === PROVIDERS.OLLAMA);
    const claudeModels = allModels.filter(m => m.provider === PROVIDERS.CLAUDE);
    
    // Create display options with proper categorization
    const displayOptions = [];
    const modelMapping = [];
    
    // Add Ollama section header and models
    if (ollamaModels.length > 0) {
      displayOptions.push(chalk.cyan('Ollama Models:'));
      modelMapping.push(null); // Section headers don't map to models
      
      for (const modelInfo of ollamaModels) {
        const cleanLabel = modelInfo.label.replace(' (Ollama)', '');
        displayOptions.push(`  ${cleanLabel}`);
        modelMapping.push(modelInfo.model);
      }
    }
    
    // Add Anthropic section header and models
    if (claudeModels.length > 0) {
      if (ollamaModels.length > 0) {
        displayOptions.push(''); // Empty line separator
        modelMapping.push(null);
      }
      
      displayOptions.push(chalk.cyan('Anthropic Models:'));
      modelMapping.push(null); // Section headers don't map to models
      
      for (const modelInfo of claudeModels) {
        const cleanLabel = modelInfo.label.replace(' (Anthropic)', '');
        displayOptions.push(`  ${cleanLabel}`);
        modelMapping.push(modelInfo.model);
      }
    }
    
    // Create the picker with categorized display
    const picker = makePicker(displayOptions, 'Select Model');
    const selected = await picker();
    
    if (!selected) return null;
    
    // Find the index of the selected option
    const selectedIndex = displayOptions.indexOf(selected);
    const selectedModel = modelMapping[selectedIndex];
    
    // Check if user selected a section header or empty line
    if (!selectedModel) {
      console.log(chalk.gray('Please select a specific model, not a section header.'));
      return await selectModelFromList(); // Recursively call to try again
    }
    
         // Check if this is an Ollama model that needs installation
     const { getModelProvider } = await import('../utils/providerConfig.js');
     const provider = getModelProvider(selectedModel);
     
     if (provider === PROVIDERS.OLLAMA) {
       const installedModels = await readModels();
      const isInstalled = installedModels.includes(selectedModel);
      
      if (!isInstalled) {
        console.log(boxen(
          `Install ${selectedModel}?\nThis may take a few minutes.\n\nProceed (y/N):`,
          { ...BOX.CONFIRM, title: 'Confirm Installation' }
        ));
        const response = await askYesNo('', true);
        console.log(response ? 'y' : 'N');
        if (response) {
          const success = await installModel(selectedModel);
          if (!success) return null;
        } else {
          return null;
        }
      }
    }
    
    return selectedModel;
  } catch (error) {
    console.error(chalk.red(`Error selecting model: ${error.message}`));
    return null;
  }
}

/**
 * Checks if network is available by checking if DNS resolution works
 * @returns {boolean} - True if network is available
 */
// function checkNetwork() {
//   try {
//     execSync('ping -c 1 -W 1 1.1.1.1 > /dev/null 2>&1', { stdio: 'ignore' });
//     return true;
//   } catch (error) {
//     return false;
//   }
// }

// askInput is already imported from terminalUI.js at the top of the file