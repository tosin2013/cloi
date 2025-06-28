/**
 * Auto-repair command for fixing deprecated GitHub Actions
 * 
 * This command automatically detects and fixes deprecated GitHub Actions
 * in workflow files, demonstrating CLOI's self-healing capabilities.
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Map of deprecated actions to their updated versions
const ACTION_UPGRADES = {
  'actions/upload-artifact@v3': 'actions/upload-artifact@v4',
  'actions/download-artifact@v3': 'actions/download-artifact@v4',
  'actions/checkout@v3': 'actions/checkout@v4',
  'actions/setup-node@v3': 'actions/setup-node@v4',
  'actions/setup-python@v4': 'actions/setup-python@v5',
  'actions/cache@v3': 'actions/cache@v4',
  // Add more mappings as GitHub deprecates actions
};

// Actions that require special handling
const SPECIAL_UPGRADES = {
  'actions/upload-artifact@v4': {
    changes: [
      {
        description: 'upload-artifact@v4 has breaking changes for artifact names',
        pattern: /name:\s*([^-\n]+)-([^-\n]+)/g,
        replacement: 'name: $1_$2'
      }
    ]
  }
};

export class DeprecatedActionsRepair {
  constructor(options = {}) {
    this.options = {
      workflowDir: '.github/workflows',
      createBackup: true,
      autoCommit: false,
      ...options
    };
    this.foundIssues = [];
    this.fixedIssues = [];
  }

  /**
   * Main repair function
   */
  async repairDeprecatedActions() {
    console.log(chalk.blue('🔍 Scanning for deprecated GitHub Actions...'));
    
    try {
      const workflowFiles = await this.findWorkflowFiles();
      
      if (workflowFiles.length === 0) {
        console.log(chalk.yellow('No workflow files found in .github/workflows/'));
        return { success: true, issues: [], fixes: [] };
      }

      // Scan all workflow files
      for (const filePath of workflowFiles) {
        await this.scanWorkflowFile(filePath);
      }

      if (this.foundIssues.length === 0) {
        console.log(chalk.green('✅ No deprecated actions found!'));
        return { success: true, issues: [], fixes: [] };
      }

      // Report found issues
      console.log(chalk.yellow(`\n⚠️  Found ${this.foundIssues.length} deprecated action(s):`));
      this.foundIssues.forEach(issue => {
        console.log(`  ${chalk.red('→')} ${issue.file}:${issue.line} - ${issue.deprecated} → ${issue.updated}`);
      });

      // Apply fixes
      console.log(chalk.blue('\n🔧 Applying fixes...'));
      await this.applyFixes();

      console.log(chalk.green(`\n✅ Fixed ${this.fixedIssues.length} deprecated action(s)!`));
      
      // Create commit if requested
      if (this.options.autoCommit) {
        await this.createAutoCommit();
      }

      return {
        success: true,
        issues: this.foundIssues,
        fixes: this.fixedIssues
      };

    } catch (error) {
      console.error(chalk.red('❌ Error during auto-repair:'), error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Find all YAML workflow files
   */
  async findWorkflowFiles() {
    try {
      const workflowDir = this.options.workflowDir;
      const files = await fs.readdir(workflowDir);
      
      return files
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
        .map(file => path.join(workflowDir, file));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Scan a single workflow file for deprecated actions
   */
  async scanWorkflowFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Look for 'uses:' lines with deprecated actions
      const usesMatch = line.match(/uses:\s*([^\s#]+)/);
      if (usesMatch) {
        const action = usesMatch[1];
        const updated = ACTION_UPGRADES[action];
        
        if (updated) {
          this.foundIssues.push({
            file: filePath,
            line: index + 1,
            deprecated: action,
            updated: updated,
            originalLine: line,
            lineIndex: index
          });
        }
      }
    });
  }

  /**
   * Apply all fixes to workflow files
   */
  async applyFixes() {
    const fileGroups = this.groupIssuesByFile();
    
    for (const [filePath, issues] of Object.entries(fileGroups)) {
      await this.fixWorkflowFile(filePath, issues);
    }
  }

  /**
   * Group issues by file for batch processing
   */
  groupIssuesByFile() {
    const groups = {};
    this.foundIssues.forEach(issue => {
      if (!groups[issue.file]) {
        groups[issue.file] = [];
      }
      groups[issue.file].push(issue);
    });
    return groups;
  }

  /**
   * Fix a single workflow file
   */
  async fixWorkflowFile(filePath, issues) {
    // Create backup if requested
    if (this.options.createBackup) {
      await fs.copyFile(filePath, `${filePath}.backup`);
    }

    let content = await fs.readFile(filePath, 'utf8');
    let lines = content.split('\n');

    // Sort issues by line number (descending) to avoid index shifts
    issues.sort((a, b) => b.lineIndex - a.lineIndex);

    for (const issue of issues) {
      const oldLine = lines[issue.lineIndex];
      const newLine = oldLine.replace(issue.deprecated, issue.updated);
      lines[issue.lineIndex] = newLine;

      // Apply special handling if needed
      const specialHandling = SPECIAL_UPGRADES[issue.updated];
      if (specialHandling) {
        lines = this.applySpecialHandling(lines, specialHandling, issue.lineIndex);
      }

      this.fixedIssues.push({
        file: issue.file,
        line: issue.line,
        from: issue.deprecated,
        to: issue.updated,
        oldLine: oldLine.trim(),
        newLine: newLine.trim()
      });

      console.log(chalk.green(`  ✓ ${path.basename(issue.file)}:${issue.line} ${issue.deprecated} → ${issue.updated}`));
    }

    // Write the fixed content back
    await fs.writeFile(filePath, lines.join('\n'));
  }

  /**
   * Apply special handling for actions that have breaking changes
   */
  applySpecialHandling(lines, specialHandling, startIndex) {
    // This is where we'd implement specific logic for actions that need more than just version updates
    // For now, just return the lines unchanged
    return lines;
  }

  /**
   * Create an auto-commit with the fixes
   */
  async createAutoCommit() {
    const { execSync } = await import('child_process');
    
    try {
      execSync('git add .github/workflows/', { stdio: 'inherit' });
      
      const commitMessage = `fix: Update deprecated GitHub Actions\n\nAuto-fixed by CLOI:\n${
        this.fixedIssues.map(fix => `- ${fix.from} → ${fix.to}`).join('\n')
      }`;
      
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      console.log(chalk.green('✅ Created auto-commit with fixes'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not create auto-commit:', error.message));
    }
  }

  /**
   * CLI command handler
   */
  static async handleCommand(args, options = {}) {
    const repair = new DeprecatedActionsRepair({
      autoCommit: options.commit || false,
      createBackup: options.backup !== false
    });

    const result = await repair.repairDeprecatedActions();
    
    if (result.success && result.fixes.length > 0) {
      console.log(chalk.cyan('\n💡 Next steps:'));
      console.log('  1. Review the changes in .github/workflows/');
      console.log('  2. Test the workflows in a pull request');
      console.log('  3. Commit and push the fixes');
      
      if (!options.commit) {
        console.log(chalk.gray('\n  Use --commit to auto-commit these fixes'));
      }
    }

    return result;
  }
}

export default DeprecatedActionsRepair;
