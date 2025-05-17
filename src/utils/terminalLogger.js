/**
 * Terminal Logger Module (Revised)
 *
 * Provides functionality to set up automatic terminal output logging by modifying
 * the user's .zshrc file (with explicit user permission). This enables capturing
 * runtime errors even when the application is not running, while attempting
 * to preserve terminal formatting and colors.
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
const START_MARKER = '# >>> cloi initialize >>>';
const END_MARKER = '# <<< cloi initial <<<';

// Generate the ZSH script for terminal logging (Revised)
function generateZshLoggingScript() {
  return [
    START_MARKER,
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
    '  if command -v stat &>/dev/null; then',
    '    if [[ "$(uname)" == "Darwin" ]]; then # macOS',
    '      file_size=$(stat -f%z "$_cloi_log_file_path")',
    '    elif [[ "$(uname)" == "Linux" ]]; then # Linux',
    '      file_size=$(stat -c%s "$_cloi_log_file_path")',
    '    else',
    '      return 0',
    '    fi',
    '  else',
    '    return 0',
    '  fi',
    '',
    '  if (( file_size > 102400 )); then',
    '    local lines=$(wc -l < "$_cloi_log_file_path" | tr -d \' \')',
    '    if (( lines > 10 )); then',
    '        local half=$((lines / 2))',
    '        tail -n "$half" "$_cloi_log_file_path" > "${_cloi_log_file_path}.tmp" && \\',
    '        mv "${_cloi_log_file_path}.tmp" "$_cloi_log_file_path" && \\',
    '        printf "[%s] === Log file rotated by Cloi ===\\n" "$(date \'+%Y-%m-%d %H:%M:%S\')" >> "$_cloi_log_file_path"',
    '    fi',
    '  fi',
    '}',
    '',
    '_cloi_current_command_string=""',
    '',
    '_cloi_log_preexec() {',
    '  _cloi_current_command_string="$1"',
    '',
    '  if [[ -z "$_cloi_current_command_string" ]] ||',
    '     [[ "$_cloi_current_command_string" == *"_cloi_"* ]] ||',
    '     [[ "$_cloi_current_command_string" == "cloi"* ]] ||',
    '     [[ "$_cloi_current_command_string" == "source "*".zshrc"* ]] ||',
    '     [[ "$_cloi_current_command_string" == *"$_cloi_log_file_path"* ]]; then',
    '    return',
    '  fi',
    '',
    '  {',
    '    printf "===================================================\\n"',
    '    printf "[%s] COMMAND: %s\\n" "$(date \'+%Y-%m-%d %H:%M:%S\')" "$_cloi_current_command_string"',
    '    printf "[%s] DIRECTORY: %s\\n" "$(date \'+%Y-%m-%d %H:%M:%S\')" "$(pwd)"',
    '    printf "[%s] OUTPUT BEGINS BELOW:\\n" "$(date \'+%Y-%m-%d %H:%M:%S\')"',
    '    printf -- "---------------------------------------------------\\n"',
    '  } >> "$_cloi_log_file_path"',
    '}',
    '',
    '_cloi_log_precmd() {',
    '  if [[ -z "$_cloi_current_command_string" ]]; then',
    '    return',
    '  fi',
    '',
    '  local last_cmd_status=$?',
    '  local output',
    '',
    '  # Execute the previous command and capture its output',
    '  output=$(eval "$_cloi_current_command_string" 2>&1)',
    '',
    '  # Append the output to the log file',
    '  printf "%s\\n" "$output" >> "$_cloi_log_file_path"',
    '',
    '  # Log command footer (status)',
    '  {',
    '    printf -- "---------------------------------------------------\\n"',
    '    printf "[%s] EXIT STATUS: %s\\n" "$(date \'+%Y-%m-%d %H:%M:%S\')" "$last_cmd_status"',
    '    printf "===================================================\\n\\n"',
    '  } >> "$_cloi_log_file_path"',
    '',
    '  _cloi_current_command_string=""',
    '  _cloi_rotate_logs',
    '}',
    '',
    'typeset -ga preexec_functions precmd_functions',
    'preexec_functions=("${preexec_functions[@]}")',
    'precmd_functions=("${precmd_functions[@]}")',
    '',
    'if ! (($preexec_functions[(Ie)_cloi_log_preexec])); then',
    '  preexec_functions+=(_cloi_log_preexec)',
    'fi',
    'if ! (($precmd_functions[(Ie)_cloi_log_precmd])); then',
    '  precmd_functions+=(_cloi_log_precmd)',
    'fi',
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
    console.log(boxen(
      `Terminal logging is only supported for zsh shell.\nYour current shell is: ${process.env.SHELL || 'unknown'}\n\nCLOI will still work but without auto-logging capabilities.`,
      { ...BOX.OUTPUT, title: 'Shell Not Supported' }
    ));
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
    console.log(`\n`)
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