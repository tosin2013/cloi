/**
 * UI Box Display and Interactive Prompt Module
 * 
 * Provides utilities for:
 * 1. Creating consistent, styled terminal boxes for various UI elements
 * 2. Interactive terminal UI components for user input
 * 
 * This module contains predefined box styles, helper functions for boxed content,
 * readline management, yes/no confirmations, and an interactive item picker.
 * It enhances the terminal UI by providing visually distinct areas and intuitive
 * ways for users to interact with the application.
 */

import boxen from 'boxen';
import chalk from 'chalk';
import readline from 'readline';

/* ─────────────────────────────  Boxen Presets  ──────────────────────────── */
export const BOX = {
  WELCOME:  { padding: 0.5, margin: 0.5, borderStyle: 'round', width: 75 },
  PROMPT:   { padding: 0.2, margin: 0.5, borderStyle: 'round', width: 75 },
  OUTPUT:   { padding: 0.5, margin: 0.5, borderStyle: 'round', width: 75, title: 'Output' },
  ERROR:    { padding: 0.5, margin: 0.5, borderStyle: 'round', width: 75, title: 'Error' },
  ANALYSIS: { padding: 0.5, margin: 0.5, borderStyle: 'round', width: 75, borderColor: '#00AAFF', title: 'AI Error Analysis' }, 
  CONFIRM:  { padding: 0.5, margin: 0.5, borderStyle: 'round', width: 75, borderColor: 'yellow', title: 'Confirm' },
  PICKER:   { padding: 0.2, margin: 0.5, borderStyle: 'round', width: 75 },   // generic picker box
  OUTPUT_DARK: { padding: 0.5, margin: 0.5, borderStyle: 'round', width: 75, title: 'Reasoning', borderColor: 'gray' }
};

/* ─────────────────────────  Command Display Utilities  ─────────────────────────── */
/**
 * Prints a shell command styled within a box for visual clarity.
 * @param {string} cmd - The command string to display.
 */
export function echoCommand(cmd) {
  console.log('');
  console.log(`  ${chalk.blueBright.bold('$')} ${chalk.blueBright.bold(cmd)}`);
  console.log('');
}

/**
 * Creates a string for displaying a command with a $ prefix.
 * @param {string} cmd - The command to display.
 * @param {object} [options] - Additional options (kept for backward compatibility).
 * @returns {string} - A formatted string containing the command.
 */
export function createCommandBox(cmd, options = {}) {
  // Return just styled text, no boxen
  return `  ${chalk.blueBright.bold('$')} ${chalk.blueBright.bold(cmd)}`;
}

/**
 * Truncates a multi-line string to a maximum number of lines,
 * showing the last few lines prefixed with an ellipsis if truncated.
 * @param {string} output - The string to truncate.
 * @param {number} [maxLines=2] - The maximum number of lines to keep.
 * @returns {string} - The potentially truncated string.
 */
export function truncateOutput(output, maxLines = 2) {
  const lines = output.trimEnd().split(/\r?\n/);
  if (lines.length <= maxLines) return output;
  return lines.slice(-maxLines).join('\n');
}

/* ─────────────────────────  Event Listener Management  ─────────────────────────── */
let activeListeners = new Set();
let rl = /** @type {readline.Interface|null} */ (null);

function addListener(event, handler) {
  activeListeners.add({ event, handler });
  process.stdin.on(event, handler);
}

function removeListener(event, handler) {
  process.stdin.removeListener(event, handler);
  activeListeners.delete({ event, handler });
}

function cleanupAllListeners() {
  activeListeners.forEach(({ event, handler }) => {
    process.stdin.removeListener(event, handler);
  });
  activeListeners.clear();
}

/**
 * Ensures stdin is in a clean state by removing all listeners and resetting raw mode.
 * This should be called before and after any stdin operations.
 */
export function ensureCleanStdin() {
  if (rl) {
    rl.close();
    rl = null;
  }
  cleanupAllListeners();
  process.stdin.setRawMode(false);
  process.stdin.pause();
  while (process.stdin.read() !== null) { /* flush */ }
}

function checkForActiveListeners() {
  const listeners = process.stdin.listeners('keypress').length + 
                   process.stdin.listeners('data').length;
  if (listeners > 0) {
    console.warn(`Warning: Found ${listeners} active listeners`);
    cleanupAllListeners();
  }
}

/* ─────────────────────────  Readline Management  ─────────────────────────── */
/**
 * Lazily creates and returns a singleton readline interface instance.
 * Ensures that only one interface is active at a time.
 */
export function getReadline() {
  ensureCleanStdin(); // Ensure clean state before creating new readline
  if (rl) return rl;
  rl = readline.createInterface({ 
    input: process.stdin, 
    output: process.stdout,
    terminal: true
  });
  rl.on('close', () => { 
    rl = null;
    ensureCleanStdin();
  });
  return rl;
}

/**
 * Closes the active readline interface and performs necessary cleanup.
 */
export function closeReadline() {
  if (rl) {
    rl.close();
    rl = null;
  }
  ensureCleanStdin();
}

/* ─────────────────────────  Yes/No Prompt  ─────────────────────────── */
/**
 * Prompts the user for a yes/no confirmation in the terminal.
 * Uses raw mode to capture single key presses (y/n).
 * @param {string} [question=''] - The question to display before the prompt.
 * @param {boolean} [silent=false] - If true, don't print the question text.
 * @returns {Promise<boolean>} - Resolves true for 'y'/'Y', false for 'n'/'N'.
 */
export async function askYesNo(question = '', silent = false) {
  closeReadline();
  if (!silent) process.stdout.write(`${question} (y/N): `);
  process.stdout.write('> ');
  
  return new Promise(res => {
    const cleanup = () => {
      ensureCleanStdin();
    };

    const onKeypress = (str) => {
      if (/^[yYnN]$/.test(str)) {
        cleanup();
        res(/^[yY]$/.test(str));
      }
    };

    process.stdin.setRawMode(true);
    process.stdin.resume();
    readline.emitKeypressEvents(process.stdin);
    addListener('keypress', onKeypress);
  });
}

/* ─────────────────────────  Generic Picker UI  ─────────────────────────── */
/**
 * Factory function to create an interactive terminal picker UI.
 * Allows selecting an item from a list using arrow keys/vim keys.
 * @param {string[]} items - The list of strings to choose from.
 * @param {string} [title='Picker'] - The title displayed on the picker box.
 * @returns {function(): Promise<string|null>} - An async function that, when called,
 * displays the picker and returns the selected item or null if cancelled.
 */
export function makePicker(items, title = 'Picker') {
  return async function picker() {
    closeReadline();
    if (!items.length) return null;
  
    let idx = items.length - 1;
    const render = () => {
      const lines = items.map((it,i) => `${i===idx?chalk.cyan('➤'): ' '} ${it}`);
      const help  = chalk.gray('\nUse ↑/↓ or k/j, Enter to choose, Esc/q to cancel');
      const boxed = boxen([...lines, help].join('\n'), { ...BOX.PICKER, title });
  
      if (render.prevLines) {
        process.stdout.write(`\x1B[${render.prevLines}F`);
        process.stdout.write('\x1B[J');
      }
      process.stdout.write(boxed + '\n');
      render.prevLines = boxed.split('\n').length;
    };
    render.prevLines = 0;
    render();
  
    return new Promise(resolve => {
      const cleanup = () => {
        ensureCleanStdin();
        process.stdout.write('\x1B[J');
      };
  
      const onKey = (str, key) => {
        if (key.name === 'up'   || str === 'k') { idx = Math.max(0, idx-1); render(); }
        if (key.name === 'down' || str === 'j') { idx = Math.min(items.length-1, idx+1); render(); }
        if (key.name === 'return') { cleanup(); resolve(items[idx]); }
        if (key.name === 'escape' || str === 'q') { cleanup(); resolve(null); }
      };
  
      process.stdin.setRawMode(true);
      process.stdin.resume();
      readline.emitKeypressEvents(process.stdin);
      addListener('keypress', onKey);
    });
  };
}

/**
 * Prompts for input (API Key) with optional masking for sensitive data
 * @param {string} prompt - The prompt to display
 * @param {boolean} [mask=false] - Whether to mask the input
 * @returns {Promise<string>} - The user's input
 */
export async function askInput(prompt, mask = true) {
  closeReadline();
  return new Promise((resolve) => {
    const rl = getReadline();
    
    if (mask) {
      const stdin = process.stdin;
      const stdout = process.stdout;
      let input = '';
      
      const cleanup = () => {
        removeListener('data', onData);
        stdin.setRawMode(false);
        stdin.pause();
      };
      
      const onData = (data) => {
        const char = data.toString();
        
        switch (char) {
          case '\u0003': // Ctrl+C
            cleanup();
            stdout.write('\n');
            process.exit();
            break;
          case '\u000D': // Enter
            cleanup();
            stdout.write('\n');
            resolve(input);
            break;
          case '\u007F': // Backspace
            if (input.length > 0) {
              input = input.slice(0, -1);
              stdout.write('\b \b');
            }
            break;
          default:
            if (char >= ' ') { // Printable characters
              input += char;
              stdout.write('*');
            }
        }
      };
      
      stdin.setRawMode(true);
      stdin.resume();
      addListener('data', onData);
    } else {
      rl.question(prompt, (answer) => {
        resolve(answer);
      });
    }
  });
} 