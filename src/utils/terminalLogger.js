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

// The zsh code block to be added to .zshrc
const ZSH_LOGGING_CODE = `
# CLOI automatic terminal output logging
# Create the log file directory if it doesn't exist
mkdir -p ~/.cloi

# Create or ensure the log file exists
touch ~/.cloi/terminal_output.log

# Log rotation function: keeps the log file under 1MB
function cloi_rotate_logs() {
  if [[ -f ~/.cloi/terminal_output.log && $(stat -f%z ~/.cloi/terminal_output.log) -gt 1048576 ]]; then
    # Get half the file
    local lines=$(wc -l < ~/.cloi/terminal_output.log)
    local half=$((lines / 2))
    # Keep only the newer half
    tail -n $half ~/.cloi/terminal_output.log > ~/.cloi/terminal_output.tmp
    mv ~/.cloi/terminal_output.tmp ~/.cloi/terminal_output.log
    # Log the rotation
    echo "[$(date)] === Log file rotated ===" >> ~/.cloi/terminal_output.log
  fi
}

# Variables for automatic output capture
CLOI_COMMAND_LOG=""
CLOI_OUTPUT_TMP=""

# Use preexec hook to capture the command before it runs
preexec() {
  # Skip internal commands to avoid infinite recursion
  if [[ "$1" == *"cloi_rotate_logs"* || "$1" == *"source ~/.zshrc"* || 
        "$1" == *"~/.cloi/terminal_output.log"* || "$1" == *"CLOI_COMMAND_LOG"* ]]; then
    return
  fi
  
  # Store the command for logging
  CLOI_COMMAND_LOG="$1"
  
  # Create temp file for output capture 
  CLOI_OUTPUT_TMP=$(mktemp /tmp/cloi_output.XXXXXX)
  
  # Redirect all output to both the terminal and our temp file
  # Using tee with process substitution to capture all output
  exec > >(tee -a $CLOI_OUTPUT_TMP)
  exec 2> >(tee -a $CLOI_OUTPUT_TMP >&2)
  
  # Log command info
  echo "===================================================" >> ~/.cloi/terminal_output.log
  echo "[$(date)] COMMAND: $CLOI_COMMAND_LOG" >> ~/.cloi/terminal_output.log
  echo "[$(date)] DIRECTORY: $(pwd)" >> ~/.cloi/terminal_output.log
  echo "[$(date)] OUTPUT BEGINS BELOW:" >> ~/.cloi/terminal_output.log
  echo "---------------------------------------------------" >> ~/.cloi/terminal_output.log
}

# Use precmd hook to finalize logging after command completes
precmd() {
  # Only process if we have a command to log
  if [[ -n "$CLOI_COMMAND_LOG" && -f "$CLOI_OUTPUT_TMP" ]]; then
    # Get command exit status
    local cmd_status=$?
    
    # Reset output redirection
    exec >&-
    exec 2>&-
    exec > /dev/tty
    exec 2> /dev/tty
    
    # Capture the output
    cat "$CLOI_OUTPUT_TMP" >> ~/.cloi/terminal_output.log
    rm -f "$CLOI_OUTPUT_TMP"
    
    # Log exit status
    echo "---------------------------------------------------" >> ~/.cloi/terminal_output.log
    echo "[$(date)] EXIT STATUS: $cmd_status" >> ~/.cloi/terminal_output.log
    echo "===================================================" >> ~/.cloi/terminal_output.log
    echo "" >> ~/.cloi/terminal_output.log
    
    # Clear command log
    CLOI_COMMAND_LOG=""
    CLOI_OUTPUT_TMP=""
    
    # Rotate logs if needed
    cloi_rotate_logs
  fi
}

# Manual logging command as a fallback (but not required for normal use)
function cloi() {
  # Log the command and context information
  echo "===================================================" >> ~/.cloi/terminal_output.log
  echo "[$(date)] MANUAL LOGGING COMMAND: $1" >> ~/.cloi/terminal_output.log
  echo "[$(date)] DIRECTORY: $(pwd)" >> ~/.cloi/terminal_output.log
  echo "[$(date)] OUTPUT BEGINS BELOW:" >> ~/.cloi/terminal_output.log
  echo "---------------------------------------------------" >> ~/.cloi/terminal_output.log
  
  # Use script command for most reliable output capture
  local tmpfile=$(mktemp /tmp/cloi_output.XXXXXX)
  script -q "$tmpfile" bash -c "$1"
  local cmd_status=$?
  
  # Append the output to our log file
  cat "$tmpfile" >> ~/.cloi/terminal_output.log
  rm "$tmpfile"
  
  # Log the exit status
  echo "---------------------------------------------------" >> ~/.cloi/terminal_output.log
  echo "[$(date)] EXIT STATUS: $cmd_status" >> ~/.cloi/terminal_output.log
  echo "===================================================" >> ~/.cloi/terminal_output.log
  echo "" >> ~/.cloi/terminal_output.log
  
  # Rotate if needed
  cloi_rotate_logs
}

# Print a message about logging
echo "CLOI terminal logging is ACTIVE."
echo "ALL terminal commands are now automatically logged to ~/.cloi/terminal_output.log"
echo "You don't need to do anything special - every command you run is captured."
echo "The manual 'cloi' command is also available as a fallback if needed."
# Added by CLOI for error detection
`;

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
    return content.includes('CLOI automatic terminal output logging') && content.includes('cloi_rotate_logs');
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
    // Check if .zshrc exists, create it if it doesn't
    if (!existsSync(zshrcPath)) {
      await fs.writeFile(zshrcPath, '', 'utf8');
    }
    
    // Append the logging code
    await fs.appendFile(zshrcPath, ZSH_LOGGING_CODE, 'utf8');
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
    
    // Remove the logging code
    content = content.replace(ZSH_LOGGING_CODE, '');
    
    await fs.writeFile(zshrcPath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error modifying .zshrc: ${error.message}`);
    return false;
  }
} 