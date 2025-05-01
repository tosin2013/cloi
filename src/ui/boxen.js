/**
 * UI Box Display Module
 * 
 * Provides utilities for creating consistent, styled terminal boxes for various UI elements.
 * This module contains predefined box styles for different content types (outputs, errors,
 * prompts, etc.) and helper functions to create and display boxed content in the terminal.
 * It enhances the terminal UI by providing visually distinct areas for different types of information.
 */

import boxen from 'boxen';
import chalk from 'chalk';

/* ─────────────────────────────  Boxen Presets  ──────────────────────────── */
export const BOX = {
  WELCOME:  { padding: 0.5, margin: 0.5, borderStyle: 'round', width: 75 },
  PROMPT:   { padding: 0.2, margin: 0.5, borderStyle: 'round', width: 75 },
  OUTPUT:   { padding: 0.5, margin: 0.5, borderStyle: 'round', width: 75, title: 'Output' },
  ERROR:    { padding: 0.5, margin: 0.5, borderStyle: 'round', width: 75, title: 'Error' },
  ANALYSIS: { padding: 0.5, margin: 0.5, borderStyle: 'round', width: 75, borderColor: '#00AAFF', title: 'AI Error Analysis' }, 
  CONFIRM:  { padding: 0.5, margin: 0.5, borderStyle: 'round', width: 75, borderColor: 'yellow', title: 'Confirm' },
  PICKER:   { padding: 0.2, margin: 0.5, borderStyle: 'round', width: 75 }   // generic picker box
};

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