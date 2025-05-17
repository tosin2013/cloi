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
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

// Import from our modules
import { BOX, echoCommand, truncateOutput, createCommandBox, askYesNo, getReadline, closeReadline, askInput } from '../ui/terminalUI.js';
import { runCommand, ensureDir, writeDebugLog } from '../utils/cliTools.js';
import { readHistory, lastRealCommand, selectHistoryItem } from '../utils/history.js';
import { 
  analyzeWithLLM, 
  determineErrorType, 
  generateTerminalCommandFix, 
  generatePatch, 
  summarizeCodeWithLLM, 
  getInstalledModels as readModels, 
  getAllAvailableModels as getAvailableModels,
  installModelIfNeeded as installModel
} from '../core/index.js';
import { extractDiff, confirmAndApply } from '../utils/patch.js';
import { displaySnippetsFromError, readFileContext, extractFilesFromTraceback, buildErrorContext, getErrorLines } from '../utils/traceback.js';
import { startThinking } from '../core/ui/thinking.js';
import { FrontierClient } from '../core/executor/frontier.js';
import { KeyManager } from '../utils/keyManager.js';
// Import prompt builders for debugging
import { buildAnalysisPrompt, buildSummaryPrompt } from '../core/promptTemplates/analyze.js';
import { buildErrorTypePrompt } from '../core/promptTemplates/classify.js';
import { buildCommandFixPrompt } from '../core/promptTemplates/command.js';
import { buildPatchPrompt } from '../core/promptTemplates/patch.js';

// Get directory references
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* ───────────────────────── Interactive Loop ────────────────────────────── */
/**
 * Runs the main interactive loop of the FigAI CLI.
 * Presents a prompt allowing the user to execute commands like /analyze, /debug, /history, /model.
 * Manages the state (last command, current model) between interactions.
 * @param {string|null} initialCmd - The initial command to have ready for analysis/debugging.
 * @param {number} limit - The history limit to use for /history selection.
 * @param {string} [initialModel='phi4:latest'] - The initial model to use.
 */
async function interactiveLoop(initialCmd, limit, initialModel = 'phi4:latest') {
    let lastCmd = initialCmd;
    let currentModel = initialModel;
  
    while (true) {
      console.log(boxen(
        `${chalk.gray('Type a command')} (${chalk.blue('/debug')}, ${chalk.blue('/model')}, ${chalk.blue('/history')}, ${chalk.blue('/logging')}, ${chalk.blue('/help')}, ${chalk.blue('/exit')})`,
        BOX.PROMPT
      ));
  
      const input = await new Promise(r =>
        getReadline().question('> ', t => r(t.trim().toLowerCase()))
      );
  
      switch (input) {
  
        case '/debug': {
          // Skip command confirmation prompt and directly run debug loop
          process.stdout.write('\n');
          await debugLoop(lastCmd, limit, currentModel);
          // Reset terminal state and readline
          process.stdout.write('\n');
          closeReadline();
          getReadline();
          break;
        }
  
        case '/history': {
          const sel = await selectHistoryItem(limit);
          if (sel) {
            lastCmd = sel;
            console.log(boxen(`Selected command: ${lastCmd}`, { ...BOX.OUTPUT, title: 'History Selection' }));
            // Skip running the command and just continue the loop with updated lastCmd
          }
          // Reset terminal state and readline
          process.stdout.write('\n');
          closeReadline();
          getReadline();
          break;
        }
  
        case '/model': {
          const newModel = await selectModelFromList();
          if (newModel) {
            currentModel = newModel;
            process.stdout.write('\n');
            console.log(boxen(`Using model: ${currentModel}`, BOX.PROMPT));
          }
          // Reset terminal state and readline
          // process.stdout.write('\n');
          closeReadline();
          getReadline();
          break;
        }
        
        case '/logging': {
          // Only applicable for zsh users
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
            await setupTerminalLogging();
          }
          
          // Reset terminal state and readline
          closeReadline();
          getReadline();
          break;
        }

        case '/help':
          console.log(boxen(
            [
              '/debug    – auto-patch errors using chosen LLM',
              '/model    – pick from installed Ollama models',
              '/history  – pick from recent shell commands',
              '/logging  – enable/disable terminal output logging (zsh only)',
              '/help     – show this help',
              '/exit     – quit'
            ].join('\n'),
            BOX.PROMPT
          ));
          break;
  
        case '/exit': {
          // Find all running event listeners and active handles
          const activeHandles = process._getActiveHandles();
          console.log(chalk.blue('bye, for now...'));
          
          // Close any open resources
          closeReadline();
          
          // Force process exit with no delay
          setImmediate(() => {
            activeHandles.forEach(handle => {
              // Try to close any type of handle that supports it
              if (handle && typeof handle.close === 'function') {
                try {
                  handle.close();
                } catch (e) {
                  // Ignore errors during cleanup
                }
              }
            });
            
            // Exit the process
            process.exit(0);
          });
          break;
        }
  
        case '':
          break;
  
        default:
          console.log(chalk.red('Unknown command. Type'), chalk.bold('/help'));
      }
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
 * @param {string} [currentModel='phi4:latest'] - The Ollama model to use.
 */
async function debugLoop(initialCmd, limit, currentModel = 'phi4:latest') {
    const iterations = [];
    const ts = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 15);
    const logDir = join(__dirname, 'debug_history');
    await ensureDir(logDir);
    const logPath = join(logDir, `${ts}.txt`);
  
    // Get current working directory for context
    console.log(chalk.gray('  Locating current working directory...'));
    echoCommand('pwd');
    const { output: currentDir } = runCommand('pwd');
    
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
  console.log(chalk.gray('  Looking for recent errors in terminal logs...\n'));
  
  // Import and use the terminal log reader and logger
  const { readTerminalLogs, extractRecentError, isLikelyRuntimeError } = await import('../utils/terminalLogs.js');
  const { isLoggingEnabled } = await import('../utils/terminalLogger.js');
  
  // Check if terminal logging is enabled (for zsh users)
  const loggingEnabled = process.env.SHELL?.includes('zsh') ? await isLoggingEnabled() : false;
  
  // Try to get error from logs first
  const { error: logError, files: logFiles } = await extractRecentError();
  
  // Variables to store final error output
  let ok = true;
  let output = '';
  
  // If we found a likely runtime error in logs
  if (logError && logFiles.size > 0) {
    console.log(chalk.gray(`  Detected error when running: ${initialCmd}\n`));
    
    
    // // List all files that caused the error
    // if (logFiles.size > 0) {
    //   console.log(chalk.gray('Files with errors:'));
    //   for (const file of logFiles.keys()) {
    //     console.log(chalk.gray(`  - ${file}`));
    //   }
    // }
    
    // Show the last 5 lines of the traceback error
    const errorLines = logError.split('\n');
    const lastFiveLines = errorLines.slice(Math.max(0, errorLines.length - 10));
    lastFiveLines.forEach(line => console.log(chalk.gray(`    ${line}`)));
    console.log(chalk.gray(`\n`));

    
    output = logError;
    ok = false; // Mark as error since we found one
  } else {
    // If logging is not enabled and this is a zsh shell, suggest enabling it
    if (!loggingEnabled && process.env.SHELL?.includes('zsh')) {
      console.log(boxen(
        chalk.gray('Tip: For better error detection, enable terminal logging using the /logging command.\nThis only works with zsh shell and requires a terminal restart to take effect.'),
        { ...BOX.OUTPUT_DARK, title: 'Suggestion' }
      ));
    }
    
    // Fall back to running the command if no clear error found in logs
    console.log(chalk.gray('  Terminal logging is disabled. Running command instead...'));
    echoCommand(cmd);
    ({ ok, output } = runCommand(cmd));
  }
  
  if (ok && !/error/i.test(output)) {
    console.log(boxen(chalk.green('No errors detected.'), { ...BOX.OUTPUT, title: 'Success' }));
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
        
        // If not a file, try as absolute path
        if (!isValidSourceFile && filePath && !filePath.startsWith('/')) {
        filePath = join(currentDir.trim(), filePath);
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
      
      // If not a file, try as absolute path
      if (!isValidSourceFile && filePath && !filePath.startsWith('/')) {
        filePath = join(currentDir.trim(), filePath);
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
        console.log(chalk.gray(`  Analyzing file content...`));
        // Show the sed command that will be used
        const start = 1; // Since we want first 200 lines, starting from line 1
        const end = 200; // Read first 200 lines
        const sedCmd = `sed -n '${start},${end}p' ${filePath}`;
        echoCommand(sedCmd);
        
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
        codeSummary = await summarizeCodeWithLLM(fileContentWithLineNumbers, currentModel);
        // Display summary as indented gray text instead of boxen
        console.log('\n' +'  ' + chalk.gray(codeSummary) + '\n');
      }
    } catch (error) {
      console.log(chalk.yellow(`  Note: Could not analyze file content: ${error.message}`));
    }
  
    // Display snippets from error traceback
    if (!ok || /error/i.test(output)) {
      displaySnippetsFromError(output);
    }
    
    /* eslint-disable no-await-in-loop */
    while (true) {
      // First, run analysis like /analyze would do, but pass additional context
      // Build the analysis prompt but don't display it
      
      const { analysis, reasoning: analysisReasoning } = await analyzeWithLLM(
        output, 
        currentModel, 
        fileInfo || { 
          content: fileContentRaw, 
          withLineNumbers: fileContentWithLineNumbers, 
          start: 1, 
          end: fileContentRaw.split('\n').length, 
          path: filePath 
        },
        codeSummary, 
        filePath
      );
      
      // Display reasoning if available
      if (analysisReasoning) {
        console.log(boxen(analysisReasoning, { ...BOX.OUTPUT_DARK, title: 'Reasoning' }));
      }
      // Display analysis as indented gray text instead of boxen
      console.log('\n' +'  ' + chalk.gray(analysis.replace(/\n/g, '\n  ')) + '\n');
      
      // Determine if this is a terminal command issue using LLM
      // Determine error type without displaying the prompt
      
      const errorType = await determineErrorType(output, analysis, currentModel);
      // Display error type as indented gray text
      console.log('  ' + chalk.gray(errorType) + '\n');
      
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
          console.log(chalk.yellow('Debug loop aborted by user.'));
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
          currentDir.trim(),
          currentModel,
          fileInfo || { 
            content: fileContentRaw, 
            withLineNumbers: fileContentWithLineNumbers, 
            start: 1, 
            end: fileContentRaw ? fileContentRaw.split('\n').length : 0, 
            path: filePath 
          },
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
          console.error(chalk.red('LLM did not return a valid diff. Aborting debug loop.'));
          break;
        }
  
        const applied = await confirmAndApply(cleanDiff, currentDir.trim());
        
        if (!applied) {
          console.log(chalk.yellow('Debug loop aborted by user.'));
          break;
        }
  
        iterations.push({ error: output, patch: cleanDiff, analysis: analysis });
        
        // Write the debug log
        await writeDebugLog(iterations, logPath);
        console.log(chalk.gray(`Debug session saved to ${logPath}`));
        
        // Exit the loop after applying the patch instead of running the command again
        console.log(chalk.green('Patch applied. Returning to main loop.'));
        break;
      }
      
      await writeDebugLog(iterations, logPath);
      console.log(chalk.gray(`Debug session saved to ${logPath}`));
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
      .option('model', {
        alias: 'm',
        describe: 'Ollama model to use for completions',
        default: 'phi4:14b',
        type: 'string'
      })
      .option('setup-logging', {
        describe: 'Set up automatic terminal logging',
        type: 'boolean'
      })
      .help().alias('help', '?')
      .epilog('CLOI - Open source and completely local debugging agent.')
      .parse();
    
    // Check if user explicitly requested to set up terminal logging
    if (argv.setupLogging) {
      const { setupTerminalLogging } = await import('../utils/terminalLogger.js');
      const setupResult = await setupTerminalLogging();
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
  
    // Check if the specified model is installed, install if not
    let currentModel = argv.model;
    
    if (currentModel) {
      const isOnline = checkNetwork();
      const installedModels = await readModels();
      
      if (!installedModels.includes(currentModel)) {
        console.log(boxen(
          `Model ${currentModel} is not installed. Install now?\nThis may take a few minutes.\n\nProceed (y/N):`,
          { ...BOX.CONFIRM, title: 'Model Installation' }
        ));
        
        const response = await askYesNo('', true);
        console.log(response ? 'y' : 'N');
        
        if (response) {
          console.log(chalk.blue(`Installing ${currentModel}...`));
          const success = await installModel(currentModel);
          
          if (!success) {
            console.log(chalk.yellow(`Failed to install ${currentModel}. Using default model instead.`));
            currentModel = 'phi4:latest';
          } else {
            console.log(chalk.green(`Successfully installed ${currentModel}.`));
          }
        } else {
          console.log(chalk.yellow(`Using default model instead.`));
          currentModel = 'phi4:latest';
        }
      }
    }
    
    const banner = chalk.blueBright.bold('Cloi') + ' — secure agentic debugging tool!!';
    console.log(boxen(
      `${banner}\n↳ model: ${currentModel}\n↳ completely local and secure`,
      BOX.WELCOME
    ));
    
    // Check if terminal logging should be set up (only for zsh users)
    if (process.env.SHELL && process.env.SHELL.includes('zsh')) {
      const { isLoggingEnabled, setupTerminalLogging } = await import('../utils/terminalLogger.js');
      // Only prompt if logging is not already enabled
      if (!(await isLoggingEnabled())) {
        const setupResult = await setupTerminalLogging();
        // If user gave permission to set up logging, exit and ask them to restart terminal
        if (setupResult) {
          console.log(boxen(
            chalk.green('Please restart your terminal or run: source ~/.zshrc\n Run `cloi` when you encounter the next error.'),
            { ...BOX.OUTPUT, title: 'Action Required' }
          ));
          process.exit(0);
        }
      }
    }
  
    const lastCmd = await lastRealCommand();
    if (!lastCmd) {
      console.log(chalk.yellow('No commands found in history.'));
      return;
    }

    console.log(boxen(lastCmd, { ...BOX.WELCOME, title: 'Last Command'}));
    await interactiveLoop(lastCmd, 15, currentModel);
  })().catch(err => {
    console.error(chalk.red(`Fatal: ${err.message}`));
    process.exit(1);
  });

/* ───────────────────────── Model Selection ────────────────────────────── */
/**
 * Allows the user to select a model using an interactive picker.
 * @returns {Promise<string|null>} - Selected model or null if canceled
 */
async function selectModelFromList() {
  const { makePicker } = await import('../ui/terminalUI.js');
  const { FrontierClient } = await import('../core/executor/frontier.js');
  const { KeyManager } = await import('../utils/keyManager.js');
  
  const isOnline = checkNetwork();
  let models;
  let title;

  if (isOnline) {
    models = getAvailableModels();
    title = 'Available Models';
    // Get installed models to check status
    const installedModels = await readModels();
    
    // To ensure we don't miss any models, create a combined list
    const allModels = [...new Set([...models, ...installedModels])];
    
    // Create display-friendly versions with installation status
    const displayNames = allModels.map(model => {
      const isInstalled = installedModels.includes(model);
      const isFrontier = FrontierClient.isFrontierModel(model);
      const displayName = model.replace(/:latest$/, '');
      
      // Color frontier models green, installed models with checkmark
      if (isFrontier) {
        return `${chalk.green(displayName)} ${chalk.gray('(Frontier)')}`;
      }
      return `${displayName} ${isInstalled ? chalk.green('✓') : chalk.gray('-')}`;
    });
    
    // Create pairs with install status for sorting
    const modelPairs = displayNames.map((display, i) => {
      const isInstalled = installedModels.includes(allModels[i]);
      const isFrontier = FrontierClient.isFrontierModel(allModels[i]);
      return [display, allModels[i], isInstalled, isFrontier];
    });
    
    // Sort: frontier models first, then installed, then alphabetically
    modelPairs.sort((a, b) => {
      if (a[3] !== b[3]) return b[3] - a[3]; // Frontier models first
      if (a[2] !== b[2]) return b[2] - a[2]; // Then installed models
      return a[0].localeCompare(b[0]); // Then alphabetically
    });
    
    // Extract sorted display names and original models
    const sortedDisplayNames = modelPairs.map(pair => pair[0]);
    const sortedModels = modelPairs.map(pair => pair[1]);
    
    // Create picker with sorted display names
    const picker = makePicker(sortedDisplayNames, title);
    const selected = await picker();
    
    if (!selected) return null;
    
    // Extract the actual model name from the display name by removing color codes and (Frontier) suffix
    const cleanSelected = selected.replace(/\u001b\[\d+m/g, '').replace(/\s*\(Frontier\)\s*$/, '').trim();
    const selectedModel = sortedModels[sortedDisplayNames.indexOf(selected)];
    const isFrontier = FrontierClient.isFrontierModel(selectedModel);
    
    console.log(chalk.gray(`Selected model: ${selectedModel} (isFrontier: ${isFrontier})`));
    
    if (isFrontier) {
      // Check if we already have an API key
      const hasKey = await KeyManager.hasKey(selectedModel);
      
      if (!hasKey) {
        console.log(boxen(
          `Please enter your API key for ${selectedModel}:`,
          { ...BOX.CONFIRM, title: 'API Key Required' }
        ));
        
        const apiKey = await askInput('API Key: ');
        if (!apiKey) {
          console.log(chalk.yellow('API key is required for frontier models.'));
          return null;
        }
        
        const stored = await KeyManager.storeKey(selectedModel, apiKey);
        if (!stored) {
          console.log(chalk.red('Failed to store API key securely.'));
          return null;
        }
      }

      // Test the API key to make sure it works
      try {
        const client = new FrontierClient(selectedModel);
        await client.getCredentials();
      } catch (error) {
        console.log(chalk.red(`Invalid or missing API key: ${error.message}`));
        // Delete the invalid key
        await KeyManager.deleteKey(selectedModel);
        return null;
      }
      
      return selectedModel;
    }
    
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
    
    return selectedModel;
  } else {
    models = await readModels();
    title = 'Installed Models';
    
    // Create display-friendly versions of model names (strip ":latest" suffix)
    const displayNames = models.map(model => {
      const isFrontier = FrontierClient.isFrontierModel(model);
      const displayName = model.replace(/:latest$/, '');
      return isFrontier ? chalk.green(displayName) : displayName;
    });
    
    // Create sorted pairs of [displayName, originalModel] for sorting and maintaining mapping
    const modelPairs = displayNames.map((display, i) => [display, models[i]]);
    modelPairs.sort((a, b) => a[0].localeCompare(b[0]));
    
    // Extract sorted display names and original models
    const sortedDisplayNames = modelPairs.map(pair => pair[0]);
    const sortedModels = modelPairs.map(pair => pair[1]);
    
    // Create picker with sorted display names
    const picker = makePicker(sortedDisplayNames, title);
    const selected = await picker();
    // Map back to the original model name if something was selected
    return selected ? sortedModels[sortedDisplayNames.indexOf(selected)] : null;
  }
}

/**
 * Checks if network is available by checking if DNS resolution works
 * @returns {boolean} - True if network is available
 */
function checkNetwork() {
  try {
    execSync('ping -c 1 -W 1 1.1.1.1 > /dev/null 2>&1', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}