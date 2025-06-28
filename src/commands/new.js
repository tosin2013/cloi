#!/usr/bin/env node
/**
 * Project Creation Command
 * 
 * Smart project creation that uses existing tools and guides users
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export class ProjectCreator {
  constructor() {
    this.supportedTypes = {
      'react': {
        tools: ['create-react-app', 'vite'],
        commands: {
          'create-react-app': (name) => `npx create-react-app ${name}`,
          'vite': (name) => `npm create vite@latest ${name} -- --template react`
        }
      },
      'vue': {
        tools: ['create-vue', 'vite'],
        commands: {
          'create-vue': (name) => `npm create vue@latest ${name}`,
          'vite': (name) => `npm create vite@latest ${name} -- --template vue`
        }
      },
      'node': {
        tools: ['npm', 'yarn'],
        commands: {
          'npm': (name) => `mkdir ${name} && cd ${name} && npm init -y`,
          'yarn': (name) => `mkdir ${name} && cd ${name} && yarn init -y`
        }
      },
      'express': {
        tools: ['express-generator', 'npm'],
        commands: {
          'express-generator': (name) => `npx express-generator ${name}`,
          'npm': (name) => `mkdir ${name} && cd ${name} && npm init -y && npm install express`
        }
      }
    };
  }

  async create(type, name) {
    console.log(chalk.blue(`🚀 Creating ${type} project: ${name}\n`));

    // Check if project type is supported
    if (!this.supportedTypes[type]) {
      throw new Error(`Project type '${type}' not supported. Available: ${Object.keys(this.supportedTypes).join(', ')}`);
    }

    // Check if directory already exists
    if (fs.existsSync(name)) {
      throw new Error(`Directory '${name}' already exists`);
    }

    const config = this.supportedTypes[type];
    
    // Find available tool
    let selectedTool = null;
    for (const tool of config.tools) {
      if (await this.checkTool(tool)) {
        selectedTool = tool;
        break;
      }
    }

    if (!selectedTool) {
      console.log(chalk.yellow('❌ No required tools found.\n'));
      console.log(chalk.cyan('📦 Install one of:'));
      config.tools.forEach(tool => {
        console.log(`   • ${tool}`);
      });
      
      // Provide specific installation instructions
      this.showInstallInstructions(type);
      return;
    }

    // Execute project creation
    console.log(chalk.green(`✅ Found ${selectedTool}, creating project...\n`));
    
    const command = config.commands[selectedTool](name);
    console.log(chalk.gray(`Running: ${command}\n`));
    
    try {
      execSync(command, { stdio: 'inherit' });
      console.log(chalk.green(`\n✅ Base project created with ${selectedTool}`));
      
      // Enhance with Cloi features
      await this.enhanceProject(name, type);
      
    } catch (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }
  }

  async enhanceProject(projectPath, type) {
    console.log(chalk.blue('\n🔧 Enhancing project with Cloi features...\n'));
    
    try {
      // Add .cloirc configuration
      await this.addCloiConfig(projectPath, type);
      
      // Initialize git if not already done
      await this.initGit(projectPath);
      
      // Add quality tools if wanted
      await this.offerQualityTools(projectPath);
      
      console.log(chalk.green('✨ Project enhanced successfully!'));
      
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Enhancement failed: ${error.message}`));
      console.log(chalk.gray('Project was created but some enhancements were skipped.'));
    }
  }

  async addCloiConfig(projectPath, type) {
    const config = {
      project: {
        type: type,
        created: new Date().toISOString(),
        cloi: {
          autoAnalyze: true,
          sessionTracking: true
        }
      }
    };

    const configPath = path.join(projectPath, '.cloirc.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.gray('  ✓ Added .cloirc.json'));
  }

  async initGit(projectPath) {
    try {
      // Check if git is available
      execSync('git --version', { stdio: 'ignore' });
      
      // Check if already a git repo
      const gitPath = path.join(projectPath, '.git');
      if (fs.existsSync(gitPath)) {
        console.log(chalk.gray('  ✓ Git already initialized'));
        return;
      }

      // Initialize git
      execSync('git init', { cwd: projectPath, stdio: 'ignore' });
      console.log(chalk.gray('  ✓ Initialized git repository'));
      
    } catch (error) {
      console.log(chalk.gray('  ⚠ Git not available, skipping'));
    }
  }

  async offerQualityTools(projectPath) {
    // For now, just suggest - in future, could prompt user
    console.log(chalk.cyan('\n💡 Recommended next steps:'));
    console.log('   • Add ESLint: npm install -D eslint');
    console.log('   • Add Prettier: npm install -D prettier');
    console.log('   • Add testing: npm install -D jest');
    console.log(`   • Start developing: cd ${path.basename(projectPath)}`);
  }

  showInstallInstructions(type) {
    const instructions = {
      'react': [
        'npm install -g create-react-app',
        'or use npx: npx create-react-app my-app'
      ],
      'vue': [
        'npm create vue@latest',
        'or install globally: npm install -g @vue/cli'
      ],
      'node': [
        'npm is required (comes with Node.js)',
        'Download from: https://nodejs.org'
      ],
      'express': [
        'npm install -g express-generator',
        'or use npx: npx express-generator my-app'
      ]
    };

    console.log(chalk.cyan('\n📚 Installation instructions:'));
    (instructions[type] || ['No specific instructions available']).forEach(instruction => {
      console.log(`   ${instruction}`);
    });
  }

  async checkTool(tool) {
    try {
      // Try common check commands
      const checkCommands = {
        'create-react-app': 'create-react-app --version',
        'vite': 'npm list -g vite',
        'create-vue': 'npm list -g @vue/cli',
        'express-generator': 'express --version',
        'npm': 'npm --version',
        'yarn': 'yarn --version'
      };

      const command = checkCommands[tool] || `${tool} --version`;
      execSync(command, { stdio: 'ignore' });
      return true;
    } catch {
      // Tool not available
      return false;
    }
  }

  async suggestAlternatives(type) {
    console.log(`\n🔄 Alternative approaches for ${type}:`);
    
    switch (type) {
      case 'react':
        console.log('   • Use Vite: npm create vite@latest my-app');
        console.log('   • Use Next.js: npx create-next-app@latest');
        break;
      case 'vue':
        console.log('   • Use Vite: npm create vite@latest my-app -- --template vue');
        console.log('   • Use Nuxt: npx nuxi@latest init my-app');
        break;
      case 'node':
        console.log('   • Manual setup: mkdir my-app && cd my-app && npm init');
        console.log('   • Use template: git clone <template-repo>');
        break;
      default:
        console.log('   • Check documentation for manual setup');
        console.log('   • Search for alternative tools');
    }
  }
}

// CLI interface
export async function createProject(type, name) {
  const creator = new ProjectCreator();
  
  try {
    await creator.create(type, name);
    
    console.log(chalk.green(`\n🎉 Success! Your ${type} project '${name}' is ready.`));
    console.log(chalk.cyan('\nNext steps:'));
    console.log(`   cd ${name}`);
    console.log('   npm install  # if needed');
    console.log('   npm start    # or your preferred start command');
    console.log('\n💡 Use "cloi analyze" to get help with any errors');
    
  } catch (error) {
    console.error(chalk.red(`\n❌ ${error.message}`));
    
    // Provide helpful suggestions
    await creator.suggestAlternatives(type);
    
    console.log(chalk.yellow('\n🤔 Need help? Try:'));
    console.log('   • cloi doctor    # Check your system');
    console.log('   • cloi help new  # Get more information');
    
    process.exit(1);
  }
}