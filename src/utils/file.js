/**
 * File System Utilities Module
 * 
 * Provides basic file system utilities for the application.
 * Handles creating directories and writing debug logs.
 * These functions support error logging and debugging
 * by ensuring necessary directories exist and recording
 * detailed information about debugging sessions.
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';

/* ──────────────── Check Debug Directory Existence ─────────────────────── */
/**
 * Ensures that a directory exists, creating it if necessary.
 * @param {string} dir - The directory path to ensure.
 * @returns {Promise<void>}
 */
export async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    // Ignore error if directory already exists
    if (err.code !== 'EEXIST') throw err;
  }
}

/* ───────────────────────── Write Debug Log ────────────────────────────── */
/**
 * Writes a debug log file with the history of iterations in a debug session.
 * @param {Array} historyArr - Array of objects with error, patch, and analysis data.
 * @param {string} logPath - The path to write the log file.
 * @returns {Promise<void>}
 */
export async function writeDebugLog(historyArr, logPath) {
  // Ensure the parent directory exists
  await ensureDir(dirname(logPath));
  
  const content = historyArr.map((iteration, i) => {
    return `=== ITERATION ${i + 1} ===\n\n` +
           `ERROR:\n${iteration.error}\n\n` +
           `ANALYSIS:\n${iteration.analysis}\n\n` +
           `PATCH:\n${iteration.patch}\n\n` +
           '='.repeat(50) + '\n\n';
  }).join('');
  
  await fs.writeFile(logPath, content, 'utf8');
} 