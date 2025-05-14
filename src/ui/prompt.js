/**
 * Interactive Terminal Prompt Module
 * 
 * Provides utilities for creating interactive terminal UI components for user input.
 * This module handles readline management, yes/no confirmations, and an interactive
 * item picker with keyboard navigation. These components enhance the terminal user 
 * experience by providing intuitive ways to interact with the application.
 */

import readline from 'readline';
import chalk from 'chalk';
import boxen from 'boxen';
import { BOX } from './boxen.js';

/* Global readline instance */
let rl = /** @type {readline.Interface|null} */ (null);

/* ─────────────────────────  Readline Management  ─────────────────────────── */
/**
 * Lazily creates and returns a singleton readline interface instance.
 * Ensures that only one interface is active at a time.
 */
export function getReadline() {
  if (rl) return rl;
  rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.on('close', () => { 
    rl = null;
    process.stdin.removeAllListeners('keypress');
    process.stdin.setRawMode(false);
    process.stdin.pause();
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
    process.stdin.removeAllListeners('keypress');
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }
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
  if (!silent) process.stdout.write(`${question} (y/N): `);
  return new Promise(res => {
    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeAllListeners('keypress');
      while (process.stdin.read() !== null) { /* flush */ }
    };

    const onKeypress = (str) => {
      if (/^[yYnN]$/.test(str)) {
        cleanup();
        const response = str.toUpperCase() === 'Y' ? 'y' : 'N';
        // process.stdout.write(`${response}\n`);
        res(/^[yY]$/.test(str));
      }
    };

    process.stdin.setRawMode(true);
    process.stdin.resume();
    readline.emitKeypressEvents(process.stdin);
    process.stdin.on('keypress', onKeypress);
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
          process.stdout.write(`\x1B[${render.prevLines}F`);  // cursor up
          process.stdout.write('\x1B[J');                     // clear to end
        }
        process.stdout.write(boxed + '\n');
        render.prevLines = boxed.split('\n').length;
      };
      render.prevLines = 0;
      render();
  
      return new Promise(resolve => {
        const cleanup = () => {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeAllListeners('keypress');
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
        process.stdin.on('keypress', onKey);
      });
    };
  }

/**
 * Prompts for input with optional masking for sensitive data
 * @param {string} prompt - The prompt to display
 * @param {boolean} [mask=false] - Whether to mask the input
 * @returns {Promise<string>} - The user's input
 */
export async function askInput(prompt, mask = true) {
  return new Promise((resolve) => {
    const rl = getReadline();
    
    if (mask) {
      // Use raw mode to handle character input manually
      const stdin = process.stdin;
      const stdout = process.stdout;
      let input = '';
      
      // Save current raw state
      const wasRaw = stdin.isRaw;
      
      // Enter raw mode
      stdin.setRawMode(true);
      stdin.resume();
      
      // Write prompt
      stdout.write(prompt);
      
      const onData = (data) => {
        const char = data.toString();
        
        // Handle special keys
        switch (char) {
          case '\u0003': // Ctrl+C
            stdout.write('\n');
            process.exit();
            break;
          case '\u000D': // Enter
            stdout.write('\n');
            stdin.removeListener('data', onData);
            stdin.setRawMode(wasRaw);
            stdin.pause();
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
      
      stdin.on('data', onData);
    } else {
      rl.question(prompt, (answer) => {
        resolve(answer);
      });
    }
  });
}