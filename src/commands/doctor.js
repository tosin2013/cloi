/**
 * System Doctor Command
 * 
 * Analyzes the system and shows all available tools
 */

import { UniversalToolDiscovery } from '../core/tool-discovery/index.js';
import chalk from 'chalk';
import { execSync } from 'child_process';

export class SystemDoctor {
  constructor() {
    this.discovery = new UniversalToolDiscovery();
  }

  async diagnose() {
    console.log(chalk.blue('🏥 Cloi System Doctor\n'));
    console.log(chalk.gray('Analyzing your development environment...\n'));

    // Core system check
    await this.checkCoreTools();
    
    // Discover all tools
    const tools = await this.discovery.discoverAll();
    
    // Show categorized tools
    await this.showToolsByCategory(tools);
    
    // Provide recommendations
    await this.provideRecommendations(tools);
  }

  async checkCoreTools() {
    console.log(chalk.cyan('🔧 Core Development Tools:\n'));

    const coreTools = [
      { name: 'Node.js', command: 'node --version', required: true },
      { name: 'npm', command: 'npm --version', required: true },
      { name: 'Git', command: 'git --version', required: true },
      { name: 'Python', command: 'python --version', required: false },
      { name: 'Python3', command: 'python3 --version', required: false },
      { name: 'Java', command: 'java -version', required: false },
      { name: 'Go', command: 'go version', required: false },
      { name: 'Rust', command: 'rustc --version', required: false },
      { name: 'Docker', command: 'docker --version', required: false }
    ];

    for (const tool of coreTools) {
      try {
        const version = execSync(tool.command, { encoding: 'utf8', stdio: 'pipe' });
        const versionLine = version.split('\n')[0];
        const status = tool.required ? chalk.green('✅') : chalk.blue('ℹ️');
        console.log(`${status} ${tool.name}: ${chalk.gray(versionLine)}`);
      } catch {
        const status = tool.required ? chalk.red('❌') : chalk.gray('⚪');
        const message = tool.required ? 'REQUIRED - Please install' : 'Not installed';
        console.log(`${status} ${tool.name}: ${chalk.gray(message)}`);
      }
    }
    console.log();
  }

  async showToolsByCategory(tools) {
    console.log(chalk.cyan('📦 Discovered Tools by Category:\n'));

    // Show summary first
    const categories = Object.keys(tools);
    const totalTools = Object.values(tools).reduce((sum, cat) => sum + cat.length, 0);
    
    console.log(chalk.white(`Found ${totalTools} tools across ${categories.length} categories:\n`));

    // Show each category
    for (const [category, categoryTools] of Object.entries(tools)) {
      if (categoryTools.length === 0) continue;

      const categoryName = this.formatCategoryName(category);
      console.log(chalk.yellow(`${categoryName} (${categoryTools.length}):`));

      // Group by source for cleaner display
      const bySource = this.groupBySource(categoryTools);
      
      for (const [source, sourceTools] of Object.entries(bySource)) {
        const sourceLabel = this.formatSourceName(source);
        console.log(chalk.gray(`  ${sourceLabel}:`));
        
        sourceTools.slice(0, 10).forEach(tool => { // Limit to 10 per source
          const version = tool.version ? chalk.gray(`v${tool.version}`) : '';
          console.log(`    • ${tool.name} ${version}`);
        });

        if (sourceTools.length > 10) {
          console.log(chalk.gray(`    ... and ${sourceTools.length - 10} more`));
        }
      }
      console.log();
    }
  }

  groupBySource(tools) {
    const grouped = {};
    tools.forEach(tool => {
      const source = tool.source || 'unknown';
      if (!grouped[source]) grouped[source] = [];
      grouped[source].push(tool);
    });
    return grouped;
  }

  formatCategoryName(category) {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  formatSourceName(source) {
    const sourceNames = {
      'PATH': 'System PATH',
      'npm-global': 'npm (global)',
      'npm-local': 'npm (local)',
      'homebrew': 'Homebrew',
      'apt': 'APT packages',
      'snap': 'Snap packages',
      'flatpak': 'Flatpak apps',
      'pip': 'Python packages',
      'cargo': 'Rust packages',
      'go': 'Go packages'
    };
    return sourceNames[source] || source;
  }

  async provideRecommendations(tools) {
    console.log(chalk.cyan('💡 Recommendations:\n'));

    const recommendations = [];

    // Check for project creators
    const creators = tools['project-creators'] || [];
    if (creators.length === 0) {
      recommendations.push({
        priority: 'high',
        category: 'Project Creation',
        suggestion: 'Install create-react-app or similar project generators',
        command: 'npm install -g create-react-app @vue/cli'
      });
    }

    // Check for linters
    const linters = tools['linters'] || [];
    if (linters.length === 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Code Quality',
        suggestion: 'Install ESLint for JavaScript/TypeScript linting',
        command: 'npm install -g eslint'
      });
    }

    // Check for formatters
    const formatters = tools['formatters'] || [];
    if (formatters.length === 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Code Formatting',
        suggestion: 'Install Prettier for code formatting',
        command: 'npm install -g prettier'
      });
    }

    // Check for testing tools
    const testers = tools['testing-tools'] || [];
    if (testers.length === 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Testing',
        suggestion: 'Install Jest or similar testing framework',
        command: 'npm install -g jest'
      });
    }

    // Check for build tools
    const builders = tools['build-tools'] || [];
    if (builders.length === 0) {
      recommendations.push({
        priority: 'low',
        category: 'Build Tools',
        suggestion: 'Consider installing Vite or Webpack for building',
        command: 'npm install -g vite'
      });
    }

    // Display recommendations
    if (recommendations.length === 0) {
      console.log(chalk.green('✅ Your system is well-equipped for development!'));
      console.log(chalk.gray('All essential tool categories are covered.'));
    } else {
      recommendations.forEach(rec => {
        const priority = rec.priority === 'high' ? chalk.red('HIGH') :
                        rec.priority === 'medium' ? chalk.yellow('MED') :
                        chalk.gray('LOW');
        
        console.log(`[${priority}] ${chalk.cyan(rec.category)}: ${rec.suggestion}`);
        console.log(chalk.gray(`   Command: ${rec.command}`));
        console.log();
      });
    }

    // Show capabilities summary
    await this.showCapabilities(tools);
  }

  async showCapabilities(tools) {
    console.log(chalk.cyan('🎯 What You Can Create with Cloi:\n'));

    const capabilities = [];

    // Check React capabilities
    if (this.hasAnyTool(tools, ['create-react-app', 'vite'])) {
      capabilities.push('✅ React applications (cloi new react my-app)');
    } else {
      capabilities.push('❌ React applications (install create-react-app)');
    }

    // Check Vue capabilities
    if (this.hasAnyTool(tools, ['vue', 'create-vue', 'vite'])) {
      capabilities.push('✅ Vue applications (cloi new vue my-app)');
    } else {
      capabilities.push('❌ Vue applications (install @vue/cli)');
    }

    // Check Node.js capabilities
    if (this.hasAnyTool(tools, ['npm', 'yarn'])) {
      capabilities.push('✅ Node.js projects (cloi new node my-app)');
    } else {
      capabilities.push('❌ Node.js projects (install Node.js)');
    }

    // Check Python capabilities
    if (this.hasAnyTool(tools, ['python', 'python3', 'poetry'])) {
      capabilities.push('✅ Python projects (cloi new python my-app)');
    } else {
      capabilities.push('❌ Python projects (install Python)');
    }

    // Check other languages
    if (this.hasAnyTool(tools, ['cargo'])) {
      capabilities.push('✅ Rust projects (cloi new rust my-app)');
    }

    if (this.hasAnyTool(tools, ['go'])) {
      capabilities.push('✅ Go projects (cloi new go my-app)');
    }

    capabilities.forEach(capability => {
      console.log(`  ${capability}`);
    });

    console.log(chalk.cyan('\n🚀 Quick Commands:\n'));
    console.log('  cloi new <type> <name>  - Create new project');
    console.log('  cloi analyze <error>    - Debug errors');
    console.log('  cloi enhance           - Improve existing project');
    console.log('  cloi tools discover    - Detailed tool discovery');
  }

  hasAnyTool(tools, toolNames) {
    return Object.values(tools).some(category =>
      category.some(tool =>
        toolNames.some(name => tool.name.toLowerCase().includes(name.toLowerCase()))
      )
    );
  }

  async showDetailed() {
    console.log(chalk.blue('🔍 Detailed Tool Discovery\n'));
    
    const tools = await this.discovery.discoverAll();
    
    console.log(chalk.yellow('All discovered tools:\n'));
    
    for (const [category, categoryTools] of Object.entries(tools)) {
      if (categoryTools.length === 0) continue;
      
      console.log(chalk.cyan(`${this.formatCategoryName(category)}:`));
      
      categoryTools.forEach(tool => {
        const version = tool.version ? chalk.gray(`v${tool.version}`) : '';
        const source = chalk.blue(`[${tool.source}]`);
        const path = tool.path ? chalk.gray(`(${tool.path})`) : '';
        
        console.log(`  • ${tool.name} ${version} ${source} ${path}`);
      });
      console.log();
    }
  }
}

// CLI interfaces
export async function runSystemDoctor() {
  const doctor = new SystemDoctor();
  await doctor.diagnose();
}

export async function runDetailedDiscovery() {
  const doctor = new SystemDoctor();
  await doctor.showDetailed();
}