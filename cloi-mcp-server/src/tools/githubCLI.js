import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitHubCLI {
  constructor() {
    this.maxBuffer = 10 * 1024 * 1024; // 10MB buffer for large outputs
  }

  async executeCommand(command, args = [], repository = null) {
    try {
      // Validate command to prevent dangerous operations
      const dangerousCommands = ['rm', 'delete', 'destroy'];
      const commandParts = command.toLowerCase().split(' ');
      
      if (dangerousCommands.some(cmd => commandParts.includes(cmd))) {
        throw new Error(`Potentially dangerous command blocked: ${command}`);
      }

      // Add repository flag if provided
      let commandArgs = [...args];
      if (repository) {
        commandArgs.unshift('-R', repository);
      }

      // Build the full gh command
      const fullCommand = commandArgs.length > 0 
        ? `gh ${command} ${commandArgs.join(' ')}` 
        : `gh ${command}`;

      console.log(`Executing GitHub CLI command: ${fullCommand}`);

      // Determine working directory - use CLOI_PROJECT_ROOT if available
      const cwd = process.env.CLOI_PROJECT_ROOT || process.cwd();
      console.log(`Working directory: ${cwd}`);

      // Execute the command
      const { stdout, stderr } = await execAsync(fullCommand, {
        maxBuffer: this.maxBuffer,
        cwd: cwd, // Set working directory
        env: process.env // Inherit environment variables including GitHub token
      });

      if (stderr && !stdout) {
        throw new Error(`GitHub CLI error: ${stderr}`);
      }

      // Try to parse JSON output if possible
      let result;
      try {
        result = JSON.parse(stdout);
      } catch {
        // If not JSON, return as plain text
        result = stdout;
      }

      return {
        success: true,
        command: fullCommand,
        output: result,
        warnings: stderr || null
      };

    } catch (error) {
      console.error('GitHub CLI execution error:', error);
      
      // Check for common issues
      if (error.message.includes('command not found')) {
        throw new Error('GitHub CLI (gh) is not installed. Please install it from https://cli.github.com/');
      }
      
      if (error.message.includes('authentication')) {
        throw new Error('GitHub CLI authentication required. Run "gh auth login" first.');
      }

      throw error;
    }
  }

  async checkAuthentication() {
    try {
      const { stdout } = await execAsync('gh auth status');
      return {
        authenticated: true,
        details: stdout
      };
    } catch (error) {
      return {
        authenticated: false,
        error: error.message
      };
    }
  }
}