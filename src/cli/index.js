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

// Import from our modules
import { BOX, echoCommand, truncateOutput, createCommandBox, askYesNo, getReadline, closeReadline } from '../ui/terminalUI.js';
import { startThinking } from '../core/llm.js';
import { runCommand } from '../utils/command.js';
import { readHistory, lastRealCommand, selectHistoryItem } from '../utils/history.js';
import { analyzeWithLLM, determineErrorType, generateTerminalCommandFix, generatePatch, selectModelItem, installModel, summarizeCodeWithLLM, readModels, getAvailableModels } from '../core/llm.js';
import { extractDiff, confirmAndApply } from '../utils/patch.js';
import { ensureDir, writeDebugLog } from '../utils/file.js';
import { displaySnippetsFromError, readFileContext, extractFilesFromTraceback } from '../utils/traceback.js';

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
        `${chalk.gray('Type a command')} (${chalk.blue('/debug')}, ${chalk.blue('/model')}, ${chalk.blue('/history')}, ${chalk.blue('/help')}, ${chalk.blue('/exit')})`,
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
          const newModel = await selectModelItem();
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
  
        case '/help':
          console.log(boxen(
            [
              '/debug    – auto-patch errors using chosen LLM',
              '/model    – pick from installed Ollama models',
              '/history  – pick from recent shell commands',
              '/help     – show this help',
              '/exit     – quit'
            ].join('\n'),
            BOX.PROMPT
          ));
          break;
  
        case '/exit':
          closeReadline();
          console.log(chalk.blue('bye, for now...'));
          return;
  
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
    // Initialize fileInfo with default values
    let fileInfo = null;
    
    // First, run the command to see the error
    let cmd = initialCmd;
    console.log(chalk.gray('  Reading errors...'));
    echoCommand(cmd);
    const { ok, output } = runCommand(cmd);
    
    if (ok && !/error/i.test(output)) {
      console.log(boxen(chalk.green('No errors detected.'), { ...BOX.OUTPUT, title: 'Success' }));
      return;
    }
    
    // Extract possible file paths from the command
    try {
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
      let isFile = filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile();
      
      // If not a file, try as absolute path
      if (!isFile && filePath && !filePath.startsWith('/')) {
        filePath = join(currentDir.trim(), filePath);
        isFile = fs.existsSync(filePath) && fs.statSync(filePath).isFile();
      }
      
      // Check if we need additional context from the file
      // We'll read file content only if:
      // 1. It's a valid file AND
      // 2. There are NO clear error lines in the traceback
      const filesWithErrors = extractFilesFromTraceback(output);
      const hasErrorLineInfo = filesWithErrors.size > 0;
      
      if (isFile && !hasErrorLineInfo) {
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
      const errorType = await determineErrorType(output, analysis, currentModel);
      // Display error type as indented gray text
      console.log('  ' + chalk.gray(errorType) + '\n');
      
      if (errorType === "TERMINAL_COMMAND_ERROR") {
        // Generate a new command to fix the issue
        const prevCommands = iterations.map(i => i.patch).filter(Boolean);
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
        const { diff: rawDiff, reasoning: patchReasoning } = await generatePatch(
          output,
          iterations.map(i => i.patch),
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
      .help().alias('help', '?')
      .epilog('CLOI - Open source and completely local debugging agent.')
      .parse();
  
    // Check if the specified model is installed, install if not
    let currentModel = argv.model;
    
    if (currentModel) {
      const installedModels = readModels();
      
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