/**
 * Terminal Logger Module
 * 
 * Provides functionality to set up automatic terminal output logging by modifying
 * the user's .zshrc file (with explicit user permission). This enables capturing
 * runtime errors even when the application is not running.
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { askYesNo } from '../ui/terminalUI.js';
import chalk from 'chalk';
import boxen from 'boxen';
import { BOX } from '../ui/terminalUI.js';

// Markers used to identify the code block in .zshrc
const START_MARKER = '# === CLOI TERMINAL LOGGING START ===';
const END_MARKER = '# === CLOI TERMINAL LOGGING END ===';

// Generate the ZSH script for terminal logging
// Breaking it up to avoid JavaScript string escaping issues
function generateZshLoggingScript() {
  return [
    START_MARKER,
    '# Cloi CLI - Automatic Terminal Output Logging (Zsh)',
    '# This block is managed by Cloi CLI. Do not modify it manually.',
    '',
    '_cloi_log_file_path="$HOME/.cloi/terminal_output.log"',
    '_cloi_log_dir_path="$HOME/.cloi"',
    '',
    '# Ensure log directory and file exist',
    'mkdir -p "$_cloi_log_dir_path"',
    'touch "$_cloi_log_file_path"',
    '',
    '_cloi_rotate_logs() {',
    '  if [[ ! -f "$_cloi_log_file_path" ]]; then',
    '    return 0',
    '  fi',
    '',
    '  local file_size',
    '  # Get file size (macOS and Linux compatible)',
    '  if command -v stat &>/dev/null; then',
    '    if [[ "$(uname)" == "Darwin" ]]; then # macOS',
    '      file_size=$(stat -f%z "$_cloi_log_file_path")',
    '    elif [[ "$(uname)" == "Linux" ]]; then # Linux',
    '      file_size=$(stat -c%s "$_cloi_log_file_path")',
    '    else # Other OS or stat not behaving as expected',
    '      return 0 # Skip rotation',
    '    fi',
    '  else',
    '    return 0 # stat command not found, skip rotation',
    '  fi',
    '',
    '  # Rotate if > 1MB (1024 * 1024 bytes)',
    '  if (( file_size > 1048576 )); then',
    '    local lines=$(wc -l < "$_cloi_log_file_path" | tr -d \' \') # Get line count, remove spaces',
    '    if (( lines > 10 )); then # Only rotate if there\'s a decent number of lines',
    '        local half=$((lines / 2))',
    '        tail -n "$half" "$_cloi_log_file_path" > "${_cloi_log_file_path}.tmp" && \\',
    '        mv "${_cloi_log_file_path}.tmp" "$_cloi_log_file_path" && \\',
    '        printf "[%s] === Log file rotated by Cloi ===\\n" "$(date \'+%Y-%m-%d %H:%M:%S\')" >> "$_cloi_log_file_path"',
    '    fi',
    '  fi',
    '}',
    '',
    '# Variables to store command and temporary output file',
    '_cloi_current_command_string=""',
    '_cloi_temp_output_file=""',
    '_cloi_original_stdout_fd=""',
    '_cloi_original_stderr_fd=""',
    '_cloi_logging_active_for_command=0 # Flag',
    '',
    '_cloi_log_preexec() {',
    '  # $1 is the command string being executed',
    '  _cloi_current_command_string="$1"',
    '  _cloi_logging_active_for_command=0 # Reset flag',
    '',
    '  # Conditions to SKIP logging for this command:',
    '  # 1. Empty command string',
    '  # 2. Command is part of Cloi\'s own operations (includes _cloi_ functions or the cloi cli itself)',
    '  # 3. Command is \'source ~/.zshrc\' or similar shell reloads',
    '  # 4. Command involves the log file itself to prevent feedback loops',
    '  if [[ -z "$_cloi_current_command_string" ]] || \\',
    '     [[ "$_cloi_current_command_string" == *"_cloi_"* ]] || \\',
    '     [[ "$_cloi_current_command_string" == "cloi"* ]] || \\',
    '     [[ "$_cloi_current_command_string" == "source "*".zshrc"* ]] || \\',
    '     [[ "$_cloi_current_command_string" == *"$_cloi_log_file_path"* ]]; then',
    '    return',
    '  fi',
    '',
    '  _cloi_logging_active_for_command=1',
    '  _cloi_temp_output_file=$(mktemp "${TMPDIR:-/tmp}/cloi_output.XXXXXX")',
    '',
    '  # Log command metadata BEFORE execution',
    '  {',
    '    printf "===================================================\\n"',
    '    printf "[%s] COMMAND: %s\\n" "$(date \'+%Y-%m-%d %H:%M:%S\')" "$_cloi_current_command_string"',
    '    printf "[%s] DIRECTORY: %s\\n" "$(date \'+%Y-%m-%d %H:%M:%S\')" "$(pwd)"',
    '    printf "[%s] OUTPUT BEGINS BELOW:\\n" "$(date \'+%Y-%m-%d %H:%M:%S\')"',
    '    printf -- "---------------------------------------------------\\n"',
    '  } >> "$_cloi_log_file_path"',
    '',
    '  # Save original stdout and stderr FDs.',
    '  # Using numeric FDs above 9 to avoid common ones, though Zsh might manage this.',
    '  exec {_cloi_original_stdout_fd}>&1',
    '  exec {_cloi_original_stderr_fd}>&2',
    '',
    '  # Redirect current command\'s stdout and stderr to tee,',
    '  # which writes to both the temp file and the original (now saved) FDs.',
    '  exec > >(tee -a "$_cloi_temp_output_file" >&$_cloi_original_stdout_fd) \\',
    '       2> >(tee -a "$_cloi_temp_output_file" >&$_cloi_original_stderr_fd)',
    '}',
    '',
    '_cloi_log_precmd() {',
    '  if [[ "$_cloi_logging_active_for_command" -ne 1 ]]; then',
    '    return',
    '  fi',
    '',
    '  local last_cmd_status=$?',
    '',
    '  # CRITICAL: Restore stdout and stderr',
    '  if [[ -n "$_cloi_original_stdout_fd" ]]; then',
    '    exec 1>&$_cloi_original_stdout_fd {_cloi_original_stdout_fd}>&-',
    '  fi',
    '  if [[ -n "$_cloi_original_stderr_fd" ]]; then',
    '    exec 2>&$_cloi_original_stderr_fd {_cloi_original_stderr_fd}>&-',
    '  fi',
    '',
    '  if [[ -f "$_cloi_temp_output_file" ]]; then',
    '    # The temp file already contains the live output mirrored by tee.',
    '    # We just need to log the footer.',
    '    cat "$_cloi_temp_output_file" >> "$_cloi_log_file_path"',
    '    rm -f "$_cloi_temp_output_file"',
    '  fi',
    '',
    '  # Log command footer (status)',
    '  {',
    '    printf -- "---------------------------------------------------\\n"',
    '    printf "[%s] EXIT STATUS: %s\\n" "$(date \'+%Y-%m-%d %H:%M:%S\')" "$last_cmd_status"',
    '    printf "===================================================\\n\\n"',
    '  } >> "$_cloi_log_file_path"',
    '',
    '  # Reset for next command',
    '  _cloi_current_command_string=""',
    '  _cloi_temp_output_file=""',
    '  _cloi_original_stdout_fd=""',
    '  _cloi_original_stderr_fd=""',
    '  _cloi_logging_active_for_command=0',
    '',
    '  _cloi_rotate_logs',
    '}',
    '',
    '# Add functions to Zsh hook arrays if not already present',
    '# This is a robust way to add hooks without overriding existing ones.',
    '# First ensure the arrays exist',
    'typeset -ga preexec_functions precmd_functions',
    'preexec_functions=("${preexec_functions[@]}")',
    'precmd_functions=("${precmd_functions[@]}")',
    '',
    '# Then check if our functions are already in the arrays',
    '# Use Zsh\'s array contains check: (($array[(Ie)$item])) returns 1 if not found',
    'if ! (($preexec_functions[(Ie)_cloi_log_preexec])); then',
    '  preexec_functions+=(_cloi_log_preexec)',
    'fi',
    'if ! (($precmd_functions[(Ie)_cloi_log_precmd])); then',
    '  precmd_functions+=(_cloi_log_precmd)',
    'fi',
    '',
    END_MARKER
  ].join('\n');
}

/**
 * Gets the path to the user's .zshrc file
 * @returns {string} Path to the user's .zshrc file
 */
export function getZshrcPath() {
  return join(homedir(), '.zshrc');
}

/**
 * Gets the path to the terminal output log file
 * @returns {string} Path to the terminal output log file
 */
export function getTerminalLogPath() {
  return join(homedir(), '.cloi', 'terminal_output.log');
}

/**
 * Checks if the automatic logging function is already present in .zshrc
 * @returns {Promise<boolean>} True if the logging function exists
 */
export async function isLoggingEnabled() {
  const zshrcPath = getZshrcPath();
  
  // Check if .zshrc exists
  if (!existsSync(zshrcPath)) {
    return false;
  }
  
  try {
    const content = await fs.readFile(zshrcPath, 'utf8');
    return content.includes(START_MARKER) && content.includes('_cloi_log_preexec');
  } catch (error) {
    console.error(`Error checking .zshrc: ${error.message}`);
    return false;
  }
}

/**
 * Adds the logging function to the user's .zshrc file
 * @returns {Promise<boolean>} True if the function was added successfully
 */
export async function enableLogging() {
  const zshrcPath = getZshrcPath();
  
  try {
    let content = '';
    // Check if .zshrc exists, create it if it doesn't
    if (existsSync(zshrcPath)) {
      content = await fs.readFile(zshrcPath, 'utf8');
      
      // Remove existing block if present
      const startIndex = content.indexOf(START_MARKER);
      const endIndex = content.indexOf(END_MARKER);
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        content = content.substring(0, startIndex) + 
                 content.substring(endIndex + END_MARKER.length);
        // Clean up excessive newlines
        content = content.replace(/\n\s*\n/g, '\n').trim();
      }
    }
    
    // Generate the zsh logging script and append it
    const zshScript = generateZshLoggingScript();
    const finalContent = (content ? content + '\n\n' : '') + zshScript;
    await fs.writeFile(zshrcPath, finalContent, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error modifying .zshrc: ${error.message}`);
    return false;
  }
}

/**
 * Prompts the user for permission to enable automatic terminal output logging
 * @returns {Promise<boolean>} True if the user granted permission and logging was enabled
 */
export async function setupTerminalLogging() {
  // Check if logging is already enabled
  if (await isLoggingEnabled()) {
    return true;
  }
  
  // Only applicable for zsh users
  if (!process.env.SHELL || !process.env.SHELL.includes('zsh')) {
    return false;
  }
  
  console.log(boxen(
    `CLOI would like to set up automatic terminal output logging to help analyze runtime errors.\n\n` +
    `This will capture ALL your terminal commands and their output to ~/.cloi/terminal_output.log.\n\n` +
    `You won't need to type any special prefix - everything will be automatically logged.\n\n` +
    `The log captures ALL output including error messages and stack traces.\n\n` +
    `This helps CLOI diagnose issues without re-running potentially harmful commands.\n\n` +
    `Would you like to enable this feature?`,
    { ...BOX.CONFIRM, title: 'Enable Terminal Logging' }
  ));
  
  const consent = await askYesNo('Enable automatic terminal logging?');
  
  if (consent) {
    const success = await enableLogging();
    if (success) {
      console.log(boxen(
        `Terminal logging has been enabled!\n\n` +
        `Please restart your terminal or run 'source ~/.zshrc' for changes to take effect.\n\n` +
        `After restarting, ALL your terminal commands will be automatically logged.\n\n` +
        `You don't need to type any special prefix - everything is captured automatically.\n\n` +
        `All output will be logged to ~/.cloi/terminal_output.log`,
        { ...BOX.OUTPUT, title: 'Success' }
      ));
      return true;
    } else {
      console.log(chalk.red('Failed to enable terminal logging.'));
      return false;
    }
  } else {
    console.log(chalk.gray('Terminal logging will not be enabled.'));
    return false;
  }
}

/**
 * Removes the logging function from the user's .zshrc file
 * @returns {Promise<boolean>} True if the function was removed successfully
 */
export async function disableLogging() {
  const zshrcPath = getZshrcPath();
  
  // Check if .zshrc exists
  if (!existsSync(zshrcPath)) {
    return true; // Nothing to disable
  }
  
  try {
    let content = await fs.readFile(zshrcPath, 'utf8');
    
    // Remove the logging code block using start/end markers
    const startIndex = content.indexOf(START_MARKER);
    const endIndex = content.indexOf(END_MARKER);
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      content = content.substring(0, startIndex) + 
               content.substring(endIndex + END_MARKER.length + 1);
      // Clean up excessive newlines
      content = content.replace(/\n\s*\n/g, '\n').trim();
      await fs.writeFile(zshrcPath, content ? content + '\n' : '', 'utf8');
    }
    return true;
  } catch (error) {
    console.error(`Error modifying .zshrc during disable: ${error.message}`);
    return false;
  }
} 