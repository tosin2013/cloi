/**
 * Command Execution Module
 * 
 * Provides utilities for executing shell commands safely with timeouts,
 * both synchronously and asynchronously. Also includes network connectivity
 * checking functionality. This module serves as the foundation for all
 * terminal command interactions throughout the application.
 */

import { execSync } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';

// Promisify exec to use with async/await
const execAsync = promisify(exec);

// CHECK

/* ───────────────────────── Synchronous Command Execution ────────────────────────────── */
/**
 * Synchronously executes a shell command, capturing stdout and stderr.
 * Includes a timeout to prevent hanging processes.
 * @param {string} cmd - The command to execute.
 * @param {number} [timeout=5000] - Timeout in milliseconds.
 * @returns {{ok: boolean, output: string}} - An object indicating success and the combined output.
 */
export function runCommand(cmd, timeout = 10000) {
  try {
    const out = execSync(`${cmd} 2>&1`, { encoding: 'utf8', timeout });
    return { ok: true, output: out };
  } catch (e) {
    return { ok: false, output: e.stdout?.toString() || e.message };
  }
}

/* ───────────────────────── Asynchronous Command Execution ────────────────────────────── */
/**
 * Asynchronously executes a shell command, capturing stdout and stderr.
 * This version doesn't block the event loop, allowing UI updates during execution.
 * @param {string} cmd - The command to execute.
 * @param {number} [timeout=10000] - Timeout in milliseconds.
 * @returns {Promise<{ok: boolean, output: string}>} - A promise resolving to an object with success flag and output.
 */
export async function runCommandAsync(cmd, timeout = 10000) {
  try {
    const { stdout, stderr } = await execAsync(`${cmd} 2>&1`, { encoding: 'utf8', timeout });
    return { ok: true, output: stdout || '' };
  } catch (e) {
    return { ok: false, output: e.stdout?.toString() || e.message };
  }
}

/* ───────────────────────── Network Connectivity Check ────────────────────────────── */
/**
 * Checks for basic network connectivity by pinging a reliable host.
 * @returns {boolean} - True if the network seems reachable.
 */
export function checkNetwork() {
  try {
    // Try to connect to a reliable host
    execSync('ping -c 1 -t 1 8.8.8.8', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}