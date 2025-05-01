/**
 * Patch Generation and Application Module
 * 
 * Provides utilities for creating, extracting, displaying, and applying code patches.
 * This module handles the core functionality of generating unified diff patches and
 * safely applying them to the codebase. It includes robust error handling and fallback 
 * mechanisms to ensure patches can be applied successfully across different environments.
 */

import { execSync, spawnSync } from 'child_process';
import { askYesNo } from '../ui/prompt.js';
import chalk from 'chalk';
import boxen from 'boxen';
import { BOX } from '../ui/boxen.js';
import fs from 'fs/promises';


/* ───────────────────────── Directory Creation Helper ────────────────────────────── */
async function ensureDir(dir) {
  try { await fs.mkdir(dir, { recursive: true }); } catch {}
}

/* ───────────────────────── Git Repository Detection ────────────────────────────── */
function inGitRepo() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/* ───────────────────────── Patch Level Detection ────────────────────────────── */
function detectStripLevel(firstPath) {
  if (firstPath.startsWith('/')) return 0;      // absolute → keep whole path
  if (firstPath.startsWith('a/'))  return 1;    // git-style a/ b/
  return 0;                                     // plain relative file
}

/* ────────────────────────────── Show Patch ─────────────────────────────────── */
/**
 * Displays a diff/patch in a formatted way.
 * @param {string} diff - The diff/patch text to display.
 */
export function showPatch(diff) {
  // Colorize diff: '+' lines are green, '-' lines are red
  const colorizedDiff = diff.split('\n').map(line => {
    if (line.startsWith('+')) {
      return chalk.green(line);
    } else if (line.startsWith('-')) {
      return chalk.red(line);
    } else {
      return line;
    }
  }).join('\n');
  
  console.log(boxen(colorizedDiff.trim() || '(empty diff)', { ...BOX.OUTPUT, title: 'Proposed Patch' }));
}

/* ───────────────────────── Unified Patch Application ────────────────────────────── */
/**
 * Applies a unified diff patch to the codebase.
 * Tries applying the patch using the standard `patch` command with different
 * strip levels (`-p`) for robustness. Falls back to `git apply --3way` if
 * inside a Git repository and initial attempts fail.
 * @param {string} diff - The unified diff content.
 * @param {string} [cwd=process.cwd()] - The working directory where paths are relative to.
 * @throws {Error} If the patch command fails after all attempts.
 */
function applyPatch(diff, cwd = process.cwd()) {
  // 1) Normalise line endings
  diff = diff.replace(/\r\n/g, '\n');

  // 2) Remove Git metadata lines that confuse patch(1)
  diff = diff.replace(/^index [0-9a-f]+\.\.[0-9a-f]+ [0-9]+$/gm, '');
  diff = diff.replace(/^diff --git .+$/gm, '');

  // 3) Ensure long header lines aren't wrapped
  diff = diff.replace(/^(---|\+\+\+)\s+([^\n]+)\n[ \t]+([^\n]+)/gm,
    (_, pfx, a, b) => `${pfx} ${a}${b}`);

  // 4) Quick fix: add missing "+" to comment lines inside hunks
  diff = fixMissingCommentPlusSign(diff).diff;

  // 5) Ensure diff ends with a newline
  if (!diff.endsWith('\n')) diff += '\n';

  // 6) Try patch(1) with a range of strip levels.
  //    Paths produced by LLMs can include deep prefixes like
  //    a/Users/<user>/Desktop/…/file.py which require -p3 or -p4.
  //    We therefore try a broader range (0-8) instead of just 0-2.
  const pLevels = Array.from({ length: 9 }, (_, i) => i); // [0,1,2,3,4,5,6,7,8]
  for (const p of pLevels) {
    const res = spawnSync('patch', [
      `-p${p}`, '--batch', '--forward', '--fuzz', '3', '--reject-file=-'
    ], { cwd, input: diff, stdio: ['pipe', 'inherit', 'inherit'] });
    if (res.status === 0) return;   // success
  }

  // 7) Fallback: git apply --3way if inside a repo
  if (inGitRepo()) {
    const git = spawnSync('git', ['apply', '--3way', '--whitespace=nowarn', '-'],
      { cwd, input: diff, stdio: ['pipe', 'inherit', 'inherit'] });
    if (git.status === 0) return;
  }

  throw new Error('Patch command failed');
}

/**
 * Fixes missing + signs on comment lines in the diff
 * @param {string} diff - The diff content to fix
 * @returns {Object} - Object containing fixed diff and whether it was fixed
 */
function fixMissingCommentPlusSign(diff) {
  const lines = diff.split('\n');
  let inHunk = false;
  let wasModified = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if we're in a hunk
    if (line.startsWith('@@')) {
      inHunk = true;
      continue;
    }
    
    // If we're in a hunk and find a line that looks like a comment
    // but doesn't have a prefix (-, +, or space), assume it should be a + line
    if (inHunk && !line.startsWith('-') && !line.startsWith('+') && !line.startsWith(' ') && line.trim().startsWith('#')) {
      lines[i] = '+ ' + line.trim();
      wasModified = true;
    }
  }
  
  return {
    diff: lines.join('\n'),
    fixed: wasModified
  };
}

/* ───────────────────────── Diff Text Extraction ────────────────────────────── */
/**
 * Extracts the unified diff portion from a larger text that may contain explanations or other text.
 * @param {string} diffText - The text containing a diff.
 * @returns {string} - The cleaned diff text.
 */
export function extractDiff(diffText) {
  // Handle the new format with FINAL DIFF marker
  const finalDiffMatch = diffText.match(/FINAL DIFF\s*([\s\S]+?)(?:```\s*\n\n|$)/i);
  if (finalDiffMatch) {
    // Capture everything after FINAL DIFF but before the closing code block if present
    let diffContent = finalDiffMatch[1].trim();
    
    // Remove any trailing markdown code block markers and text after them
    diffContent = diffContent.replace(/```[\s\S]*$/, '').trim();
    
    // For debugging
    //console.log(chalk.gray('[extractDiff] Found FINAL DIFF marker, extracting content'));
    
    return diffContent;
  }

  // Handle markdown code block format with diff language
  const markdownMatch = diffText.match(/```(?:diff)?\n([\s\S]+?)```/);
  if (markdownMatch) {
    const content = markdownMatch[1].trim();
    
    // For debugging
    //console.log(chalk.gray('[extractDiff] Extracted content from markdown code block'));
    
    return content;
  }
  
  // Handle plain diff format that might include explanation text
  const diffMatch = diffText.match(/^(---[\s\S]+?(?:\n\+\+\+[\s\S]+?)(?:\n@@[\s\S]+?))/m);
  if (diffMatch) {
    // For debugging
    //console.log(chalk.gray('[extractDiff] Extracted content matching unified diff pattern'));
    
    return diffMatch[1].trim();
  }
  
  // If the response already seems to be a clean diff, return it as is
  if (diffText.trim().startsWith('---') && diffText.includes('+++')) {
    // For debugging
    //console.log(chalk.gray('[extractDiff] Content already appears to be a clean diff'));
    
    // Extract just the unified diff part
    const endOfDiffIndex = diffText.indexOf('```', diffText.indexOf('+++'));
    if (endOfDiffIndex > 0) {
      // For debugging
      //console.log(chalk.gray('[extractDiff] Trimming trailing content after unified diff'));
      return diffText.substring(0, endOfDiffIndex).trim();
    }
    
    return diffText.trim();
  }
  
  // Additional handling for specific formats we've seen
  if (diffText.includes('```') && diffText.includes('@@ -')) {
    // Extract the content between the first @@ and the closing ```
    const match = diffText.match(/(@@[\s\S]+?)(?:```|$)/);
    if (match) {
      // Get everything from the file paths before @@ to the match
      const headerMatch = diffText.match(/(---[\s\S]+?\+\+\+[\s\S]+?)(@@)/);
      if (headerMatch) {
        return (headerMatch[1] + match[1]).trim();
      }
      return match[1].trim();
    }
  }
  
  // Fall back to returning as is after trimming
  //console.log(chalk.gray('[extractDiff] No specific format detected, returning trimmed content'));
  return diffText.trim();
}

/* ───────────────────────── Patch Confirmation And Apply ────────────────────────────── */
/**
 * Displays a generated patch, asks the user for confirmation, and applies it if confirmed.
 * @param {string} diff - The unified diff patch content.
 * @param {string} [cwd=process.cwd()] - The working directory for applying the patch.
 * @returns {Promise<boolean>} - True if the patch was successfully applied, false otherwise.
 */
export async function confirmAndApply(diff, cwd = process.cwd()) {
  // Display the patch
  showPatch(diff);
  
  // Ask for confirmation
  if (!(await askYesNo('Apply this patch?'))) return false;
  
  try {
    // Apply the patch if confirmed
    applyPatch(diff, cwd);
    console.log(chalk.green('✓ Patch applied\n'));
    return true;
  } catch (e) {
    console.error(chalk.red(`Patch failed: ${e.message}`));
    return false;
  }
} 