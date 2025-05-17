/**
 * Terminal Logs Module
 * 
 * Provides utilities for reading and analyzing terminal logs.
 * This module is used to extract recent errors from terminal logs,
 * which helps the application diagnose issues without re-running commands.
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { getTerminalLogPath } from './terminalLogger.js';

/**
 * Read recently logged terminal output
 * @param {number} [maxLines=500] Maximum number of lines to read
 * @returns {Promise<string>} Terminal log content
 */
export async function readTerminalLogs(maxLines = 750) {
  const terminalLogPath = getTerminalLogPath();
  
  if (!existsSync(terminalLogPath)) {
    return '';
  }
  
  try {
    // Read the file and get the last maxLines lines
    const content = await fs.readFile(terminalLogPath, 'utf8');
    const lines = content.split('\n');
    return lines.slice(-maxLines).join('\n');
  } catch (error) {
    console.error(`Error reading terminal logs: ${error.message}`);
    return '';
  }
}

/**
 * Determines if a log excerpt likely contains a runtime error
 * @param {string} log Log content to analyze
 * @returns {boolean} True if the log appears to contain a runtime error
 */
export function isLikelyRuntimeError(log) {
  const errorPatterns = [
    /error/i,
    /exception/i,
    /traceback/i,
    /fail/i,
    /crash/i,
    /stack trace/i
  ];
  
  return errorPatterns.some(pattern => pattern.test(log));
}

/**
 * Extract the most recent error from terminal logs
 * @returns {Promise<{error: string, files: Map<string, number>}>} Extracted error and related files
 */
export async function extractRecentError() {
  const logs = await readTerminalLogs();
  
  // No logs available
  if (!logs) {
    return { error: '', files: new Map() };
  }
  
  // Split into "command blocks" by looking for shell prompts
  const commandBlocks = logs.split(/\$\s+/).filter(Boolean);
  
  // Look through recent command blocks for errors, starting from the most recent
  for (let i = commandBlocks.length - 1; i >= 0; i--) {
    const block = commandBlocks[i];
    
    if (isLikelyRuntimeError(block)) {
      // We found a likely error block, now extract file references
      
      // Import the traceback analyzer
      const { extractFilesFromTraceback } = await import('./traceback.js');
      const files = extractFilesFromTraceback(block);
      
      return {
        error: block,
        files: files
      };
    }
  }
  
  return { error: '', files: new Map() };
} 