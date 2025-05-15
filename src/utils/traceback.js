/**
 * Error Traceback Analysis Module
 * 
 * Provides utilities for analyzing error logs, extracting file paths and line numbers,
 * and displaying relevant code snippets. This module is crucial for error diagnosis,
 * as it locates and highlights the code sections where errors originate, providing
 * essential context for both users and the LLM analysis functions.
 */

import { existsSync } from 'fs';
import { runCommand } from './cliTools.js'; // Updated import path
import boxen from 'boxen';
import { BOX } from '../ui/terminalUI.js';
import { basename } from 'path';
import { echoCommand, truncateOutput} from '../ui/terminalUI.js';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

/* ───────────────────────────── User File Check ────────────────────────── */
/**
 * Checks if a given file path likely belongs to user code rather than system/library code.
 * Used to filter traceback entries to focus on relevant files.
 * @param {string} p - The file path to check.
 * @returns {boolean} - True if the path seems to be user code.
 */
export function isUserFile(p) {
  const skip = [
    'site-packages','dist-packages','node_modules',
    'lib/python','/usr/lib/','/system/','<frozen','<string>',
    '__pycache__','<__array_function__>'
  ];
  const low = p.toLowerCase();
  return !skip.some(m => low.includes(m)) && existsSync(p);
}

/* ───────────────────────────── Extract Traceback Files ────────────────────────── */
/**
 * Parses a log string (typically stderr output) to extract file paths and line numbers
 * from Python-style traceback lines ("File \"path\", line num"). Filters for user files.
 * @param {string} log - The log output containing tracebacks.
 * @returns {Map<string, number>} - A map of user file paths to the most relevant line number found.
 */
export function extractFilesFromTraceback(log) {
  const re = /File \"([^\"]+)\", line (\d+)/g;
  const stackFrames = [];
  let m;
  
  // Extract all stack frames with file paths and line numbers
  while ((m = re.exec(log)) !== null) {
    const file = m[1], line = parseInt(m[2], 10);
    stackFrames.push({ file, line, position: m.index });
  }
  
  // Sort by position in the trace (deeper frames appear first in the trace)
  stackFrames.sort((a, b) => a.position - b.position);
  
  // Filter to user files only
  const userFrames = stackFrames.filter(frame => isUserFile(frame.file));
  
  const result = new Map();
  
  // We want to find the deepest frame for each file, which is typically
  // the most relevant line where the error actually occurs
  if (userFrames.length > 0) {
    // Group by file path
    const fileGroups = {};
    for (const frame of userFrames) {
      if (!fileGroups[frame.file]) {
        fileGroups[frame.file] = [];
      }
      fileGroups[frame.file].push(frame);
    }
    
    // For each file, get the deepest frame (last in the stack trace)
    for (const file in fileGroups) {
      const frames = fileGroups[file];
      // The last frame in the group is typically the actual error line
      const deepestFrame = frames[frames.length - 1];
      result.set(file, deepestFrame.line);
    }
  }
  
  return result;
}

/* ───────────────────────────── Read File Context ────────────────────────── */
/**
 * Reads and formats a section of a file around a specific line number.
 * Used to provide context around errors identified in tracebacks.
 * @param {string} file - The path to the file.
 * @param {number} line - The central line number.
 * @param {number} [ctx=30] - The number of lines to include before and after the target line.
 * @returns {string} - Raw code snippet from the file.
 */
export function readFileContext(file, line, ctx = 30) {
  const start = Math.max(1, line - ctx);
  const end   = line + ctx;
  const cmd   = `sed -n '${start},${end}p' ${file}`; // sed is faster than cat

  const { ok, output } = runCommand(cmd, 5_000);
  if (!ok) return { content: `Error reading ${file}: ${output.trim()}`, start: 0, end: 0 };

  return { content: output, start, end };
}

/* ───────────────────────────── Build Error Context ────────────────────────── */
/**
 * Builds a consolidated code context string based on files extracted from a traceback log.
 * @param {string} log - The error log containing tracebacks.
 * @param {number} [contextSize=30] - The number of lines to include before and after each error line.
 * @param {boolean} [includeHeaders=true] - Whether to include file path and line number headers.
 * @returns {string} - A string containing formatted code snippets from relevant files,
 *                     or an empty string if no user files are found in the traceback.
 */
export function buildErrorContext(log, contextSize = 30, includeHeaders = true) {
  const files = extractFilesFromTraceback(log);
  if (!files.size) return '';
  
  const ctx = [];
  for (const [file, line] of files) {
    if (includeHeaders) {
      ctx.push(`\n--- ${file} (line ${line}) ---`);
    }
    const fileContext = readFileContext(file, line, contextSize);
    ctx.push(fileContext.content);
  }
  
  return ctx.join('\n');
}

/* ───────────────────────────── Show Code Snippet ────────────────────────── */
/**
 * Displays a code snippet from a file around a specific line, fetched using `sed`.
 * Shows only the error line plus one line before and after.
 * @param {string} file - Path to the file.
 * @param {number} line - Target line number.
 * @param {number} [ctx=1] - Lines of context before and after (default is 1).
 */
export function showSnippet(file, line, ctx = 30) {
  const start = Math.max(1, line - ctx), end = line + ctx;
  const cmd   = `sed -n '${start},${end}p' ${basename(file)}`;
  console.log(chalk.gray(`  Retrieving file context ${basename(file)}...`));
  echoCommand(cmd);
  const { ok, output } = runCommand(cmd, 5000);
  // Not using readFileContext here as we want to run the command directly for output display
}

/* ───────────────────────────── Display Error Snippets ────────────────────────── */
/**
 * Iterates through files identified in an error log's traceback and displays
 * relevant code snippets using `showSnippet`.
 * @param {string} log - The error log content.
 */
export function displaySnippetsFromError(log) {
  for (const [file, line] of extractFilesFromTraceback(log)) {
    showSnippet(file, line);
  }
}

/**
 * Extracts the exact line of code where the error occurs.
 * @param {string} file - Path to the file containing the error.
 * @param {number} line - Line number where the error occurs.
 * @returns {string} - The exact line of code that has the error.
 */
export function extractErrorLine(file, line) {
  const cmd = `sed -n '${line}p' ${file}`;
  const { ok, output } = runCommand(cmd, 1000);
  if (!ok || !output.trim()) {
    return `Unable to read line ${line} from ${file}`;
  }
  return output.trim();
}

/**
 * Gets all error lines from files mentioned in a traceback.
 * @param {string} log - The error log containing tracebacks.
 * @returns {string} - A string with all error lines, one per line.
 */
export function getErrorLines(log) {
  const files = extractFilesFromTraceback(log);
  if (!files.size) return '';
  
  const errorLines = [];
  for (const [file, line] of files) {
    errorLines.push(extractErrorLine(file, line));
  }
  
  return errorLines.join('\n');
} 