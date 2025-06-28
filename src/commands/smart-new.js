/**
 * Smart Project Creator
 * 
 * Uses ANY tools available on the system to create projects
 */

import { UniversalToolDiscovery } from '../core/tool-discovery/index.js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export class SmartProjectCreator {
  constructor() {
    this.discovery = new UniversalToolDiscovery();
  }

  async create(projectType, projectName) {
    console.log(chalk.blue(`🔍 Finding tools to create ${projectType} project: ${projectName}\n`));

    // Check if directory exists
    if (fs.existsSync(projectName)) {
      throw new Error(`Directory '${projectName}' already exists`);
    }

    // Discover available tools
    const tools = await this.discovery.discoverAll();
    
    // Find best tool for this project type
    const creator = await this.findProjectCreator(tools, projectType);
    
    if (!creator) {
      console.log(chalk.yellow(`❌ No tools found to create ${projectType} projects\n`));
      await this.suggestInstallation(projectType);
      return;
    }

    // Create the project
    await this.executeCreation(creator, projectType, projectName);
    
    // Enhance with available tools
    await this.enhanceProject(projectName, projectType, tools);
  }

  async findProjectCreator(tools, projectType) {
    // Define creation strategies for different project types
    const strategies = {
      'react': [
        { tool: 'create-react-app', command: (name) => `npx create-react-app ${name}` },
        { tool: 'vite', command: (name) => `npm create vite@latest ${name} -- --template react` },
        { tool: 'next', command: (name) => `npx create-next-app@latest ${name}` }
      ],
      'vue': [
        { tool: 'create-vue', command: (name) => `npm create vue@latest ${name}` },
        { tool: 'vue', command: (name) => `vue create ${name}` },
        { tool: 'vite', command: (name) => `npm create vite@latest ${name} -- --template vue` }
      ],
      'angular': [
        { tool: 'ng', command: (name) => `ng new ${name}` },
        { tool: 'angular', command: (name) => `npx @angular/cli new ${name}` }
      ],
      'node': [
        { tool: 'npm', command: (name) => `mkdir ${name} && cd ${name} && npm init -y` },
        { tool: 'yarn', command: (name) => `mkdir ${name} && cd ${name} && yarn init -y` },
        { tool: 'pnpm', command: (name) => `mkdir ${name} && cd ${name} && pnpm init` }
      ],
      'express': [
        { tool: 'express-generator', command: (name) => `npx express-generator ${name}` },
        { tool: 'express', command: (name) => `mkdir ${name} && cd ${name} && npm init -y && npm install express` }
      ],
      'python': [
        { tool: 'poetry', command: (name) => `poetry new ${name}` },
        { tool: 'cookiecutter', command: (name) => `cookiecutter gh:audreyr/cookiecutter-pypackage` },
        { tool: 'python', command: (name) => `mkdir ${name} && cd ${name} && python -m venv venv` }
      ],
      'rust': [
        { tool: 'cargo', command: (name) => `cargo new ${name}` }
      ],
      'go': [
        { tool: 'go', command: (name) => `mkdir ${name} && cd ${name} && go mod init ${name}` }
      ],
      'java': [
        { tool: 'mvn', command: (name) => `mvn archetype:generate -DgroupId=com.example -DartifactId=${name}` },
        { tool: 'gradle', command: (name) => `gradle init --type java-application --project-name ${name}` }
      ]
    };

    const projectStrategies = strategies[projectType] || strategies['node'];
    
    // Find first available tool
    for (const strategy of projectStrategies) {
      const foundTool = this.findToolInDiscovery(tools, strategy.tool);
      if (foundTool) {
        return {
          ...strategy,
          foundTool
        };
      }
    }

    return null;
  }

  findToolInDiscovery(tools, toolName) {
    // Search across all categories
    for (const category of Object.values(tools)) {
      const found = category.find(tool => 
        tool.name.toLowerCase().includes(toolName.toLowerCase()) ||
        (tool.executable && tool.executable.includes(toolName))
      );
      if (found) return found;
    }
    return null;
  }

  async executeCreation(creator, projectType, projectName) {
    console.log(chalk.green(`✅ Found ${creator.foundTool.name} (${creator.foundTool.source})`));
    console.log(chalk.gray(`Running: ${creator.command(projectName)}\n`));

    try {
      execSync(creator.command(projectName), { 
        stdio: 'inherit',
        shell: true 
      });
      console.log(chalk.green(`\n✅ ${projectType} project created successfully!`));
    } catch (error) {
      throw new Error(`Project creation failed: ${error.message}`);
    }
  }

  async enhanceProject(projectName, projectType, tools) {
    console.log(chalk.blue('\n🔧 Enhancing project with available tools...\n'));

    const enhancements = [];

    // Add version control
    if (this.findToolInDiscovery(tools, 'git')) {
      await this.addGit(projectName);
      enhancements.push('Git repository');
    }

    // Add linting
    const linter = this.findBestLinter(tools, projectType);
    if (linter) {
      await this.suggestLinter(projectName, linter);
      enhancements.push(`${linter.name} linting`);
    }

    // Add formatting
    const formatter = this.findBestFormatter(tools, projectType);
    if (formatter) {
      await this.suggestFormatter(projectName, formatter);
      enhancements.push(`${formatter.name} formatting`);
    }

    // Add testing
    const tester = this.findBestTester(tools, projectType);
    if (tester) {
      await this.suggestTesting(projectName, tester);
      enhancements.push(`${tester.name} testing`);
    }

    // Add Cloi configuration
    await this.addCloiConfig(projectName, projectType);
    enhancements.push('Cloi configuration');

    console.log(chalk.green('✨ Project enhanced with:'));
    enhancements.forEach(enhancement => {
      console.log(chalk.gray(`  ✓ ${enhancement}`));
    });
  }

  findBestLinter(tools, projectType) {
    const linters = tools['linters'] || [];
    
    const preferences = {
      'react': ['eslint'],
      'vue': ['eslint'],
      'angular': ['eslint', 'tslint'],
      'node': ['eslint'],
      'python': ['pylint', 'flake8'],
      'rust': ['clippy'],
      'go': ['golint', 'gofmt']
    };

    const preferred = preferences[projectType] || preferences['node'];
    
    for (const pref of preferred) {
      const found = linters.find(tool => tool.name.includes(pref));
      if (found) return found;
    }

    return linters[0]; // Return first available linter
  }

  findBestFormatter(tools, projectType) {
    const formatters = tools['formatters'] || [];
    
    const preferences = {
      'react': ['prettier'],
      'vue': ['prettier'],
      'angular': ['prettier'],
      'node': ['prettier'],
      'python': ['black', 'autopep8'],
      'rust': ['rustfmt'],
      'go': ['gofmt']
    };

    const preferred = preferences[projectType] || preferences['node'];
    
    for (const pref of preferred) {
      const found = formatters.find(tool => tool.name.includes(pref));
      if (found) return found;
    }

    return formatters[0];
  }

  findBestTester(tools, projectType) {
    const testers = tools['testing-tools'] || [];
    
    const preferences = {
      'react': ['jest', 'vitest', 'cypress'],
      'vue': ['vitest', 'jest', 'cypress'],
      'angular': ['jasmine', 'karma', 'jest'],
      'node': ['jest', 'mocha', 'tap'],
      'python': ['pytest', 'unittest'],
      'rust': ['cargo'], // cargo test
      'go': ['go'] // go test
    };

    const preferred = preferences[projectType] || preferences['node'];
    
    for (const pref of preferred) {
      const found = testers.find(tool => tool.name.includes(pref));
      if (found) return found;
    }

    return testers[0];
  }

  async addGit(projectName) {
    try {
      execSync('git init', { cwd: projectName, stdio: 'ignore' });
      
      // Create .gitignore if it doesn't exist
      const gitignorePath = path.join(projectName, '.gitignore');
      if (!fs.existsSync(gitignorePath)) {
        const gitignoreContent = `
node_modules/
.env
.env.local
.DS_Store
*.log
dist/
build/
coverage/
`.trim();
        fs.writeFileSync(gitignorePath, gitignoreContent);
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️ Failed to initialize git'));
    }
  }

  async suggestLinter(projectName, linter) {
    console.log(chalk.cyan(`💡 Linting available with ${linter.name}`));
    console.log(chalk.gray(`   Setup: cd ${projectName} && npm install -D ${linter.name}`));
  }

  async suggestFormatter(projectName, formatter) {
    console.log(chalk.cyan(`💡 Code formatting available with ${formatter.name}`));
    console.log(chalk.gray(`   Setup: cd ${projectName} && npm install -D ${formatter.name}`));
  }

  async suggestTesting(projectName, tester) {
    console.log(chalk.cyan(`💡 Testing available with ${tester.name}`));
    console.log(chalk.gray(`   Setup: cd ${projectName} && npm install -D ${tester.name}`));
  }

  async addCloiConfig(projectName, projectType) {
    const config = {
      project: {
        type: projectType,
        created: new Date().toISOString(),
        cloi: {
          autoAnalyze: true,
          sessionTracking: true,
          tools: {
            discovered: await this.discovery.discoverAll()
          }
        }
      }
    };

    const configPath = path.join(projectName, '.cloirc.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  async suggestInstallation(projectType) {
    console.log(chalk.cyan('📦 Installation suggestions:\n'));

    const suggestions = {
      'react': [
        'npm install -g create-react-app',
        'or use: npm create vite@latest my-app -- --template react'
      ],
      'vue': [
        'npm install -g @vue/cli',
        'or use: npm create vue@latest my-app'
      ],
      'angular': [
        'npm install -g @angular/cli'
      ],
      'python': [
        'pip install poetry',
        'or use: pip install cookiecutter'
      ],
      'rust': [
        'Install Rust from: https://rustup.rs/'
      ],
      'go': [
        'Install Go from: https://golang.org/dl/'
      ]
    };

    const projectSuggestions = suggestions[projectType] || [
      'Check the official documentation for your framework',
      'Search for project generators in your package manager'
    ];

    projectSuggestions.forEach(suggestion => {
      console.log(`   ${suggestion}`);
    });

    console.log(chalk.yellow('\n🔍 Run "cloi doctor" to see all available tools on your system'));
  }

  async showNextSteps(projectName, projectType) {
    console.log(chalk.cyan(`\n🎉 ${projectType} project '${projectName}' created successfully!\n`));
    console.log(chalk.white('Next steps:'));
    console.log(`   cd ${projectName}`);
    console.log('   npm install  # if needed');
    console.log('   npm start    # or your start command');
    console.log('\n💡 Cloi tips:');
    console.log('   cloi analyze <error>  # Get help with errors');
    console.log('   cloi doctor          # Check system tools');
    console.log('   cloi enhance         # Add more features');
  }
}

// CLI interface
export async function smartCreateProject(projectType, projectName) {
  const creator = new SmartProjectCreator();
  
  try {
    await creator.create(projectType, projectName);
    await creator.showNextSteps(projectName, projectType);
  } catch (error) {
    console.error(chalk.red(`\n❌ ${error.message}`));
    
    console.log(chalk.yellow('\n🤔 Need help?'));
    console.log('   cloi doctor          # Check available tools');
    console.log('   cloi tools discover  # Find all system tools');
    console.log('   cloi help new        # Get more information');
    
    process.exit(1);
  }
}