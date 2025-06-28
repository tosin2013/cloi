/**
 * Generate CI Workflows - Create project-specific GitHub Actions workflows
 * 
 * Analyzes the current project and generates appropriate CI/CD workflows
 * with Cloi auto-repair and code review features integrated.
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { environmentContext } from '../core/environment-context/index.js';

export class CIWorkflowGenerator {
  constructor() {
    this.workflowsDir = '.github/workflows';
    this.projectTypes = {
      nodejs: {
        packageManager: ['npm', 'yarn', 'pnpm'],
        testFrameworks: ['jest', 'mocha', 'vitest'],
        buildTools: ['webpack', 'vite', 'rollup']
      },
      python: {
        packageManager: ['pip', 'pipenv', 'poetry'],
        testFrameworks: ['pytest', 'unittest', 'nose2'],
        buildTools: ['setuptools', 'poetry', 'wheel']
      },
      react: {
        packageManager: ['npm', 'yarn', 'pnpm'],
        testFrameworks: ['jest', '@testing-library/react'],
        buildTools: ['create-react-app', 'vite', 'webpack']
      },
      vue: {
        packageManager: ['npm', 'yarn', 'pnpm'],
        testFrameworks: ['jest', 'vitest', '@vue/test-utils'],
        buildTools: ['vue-cli', 'vite', 'webpack']
      },
      go: {
        packageManager: ['go mod'],
        testFrameworks: ['go test'],
        buildTools: ['go build']
      },
      rust: {
        packageManager: ['cargo'],
        testFrameworks: ['cargo test'],
        buildTools: ['cargo build']
      }
    };
  }

  /**
   * Generate workflows for the current project
   */
  async generateWorkflows(options = {}) {
    try {
      console.log(chalk.blue('🔍 Analyzing project structure...'));
      
      // Initialize environment context
      await environmentContext.initialize();
      const envContext = await environmentContext.getContextForLLM();
      
      // Detect project configuration
      const projectConfig = await this.detectProjectConfiguration(envContext);
      
      console.log(chalk.green('✅ Project analysis complete'));
      console.log(`Detected: ${projectConfig.type} project with ${projectConfig.languages.join(', ')}`);
      
      // Generate workflow files
      const workflows = await this.generateWorkflowFiles(projectConfig, options);
      
      // Create .github/workflows directory
      await fs.mkdir(this.workflowsDir, { recursive: true });
      
      // Write workflow files
      for (const [filename, content] of workflows) {
        const filepath = path.join(this.workflowsDir, filename);
        await fs.writeFile(filepath, content);
        console.log(chalk.green(`✅ Generated: ${filepath}`));
      }
      
      console.log(chalk.cyan('\n🎉 CI workflows generated successfully!'));
      console.log(chalk.gray('Your project now has:'));
      workflows.forEach(([filename]) => {
        console.log(chalk.gray(`  - ${filename}`));
      });
      
      return Array.from(workflows.keys());
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to generate workflows:'), error.message);
      throw error;
    }
  }

  /**
   * Detect project configuration
   */
  async detectProjectConfiguration(envContext) {
    const config = {
      type: 'nodejs', // default
      languages: envContext.project.languages || ['javascript'],
      packageManager: this.detectPackageManager(envContext),
      testFramework: await this.detectTestFramework(),
      buildTool: await this.detectBuildTool(),
      hasDocker: envContext.tools.containerization.includes('docker'),
      hasKubernetes: envContext.tools.available.includes('kubectl'),
      deployment: this.detectDeploymentStrategy(envContext)
    };

    // Determine primary project type
    if (config.languages.includes('python')) {
      config.type = 'python';
    } else if (config.languages.includes('go')) {
      config.type = 'go';
    } else if (config.languages.includes('rust')) {
      config.type = 'rust';
    } else if (await this.isReactProject()) {
      config.type = 'react';
    } else if (await this.isVueProject()) {
      config.type = 'vue';
    }

    return config;
  }

  /**
   * Generate workflow files based on project configuration
   */
  async generateWorkflowFiles(projectConfig, options) {
    const workflows = new Map();

    // Main CI workflow
    workflows.set('ci.yml', await this.generateMainCIWorkflow(projectConfig, options));

    // Auto-repair workflow (always included)
    workflows.set('auto-repair.yml', await this.generateAutoRepairWorkflow(projectConfig, options));

    // Code review workflow (always included)
    workflows.set('code-review-assistant.yml', await this.generateCodeReviewWorkflow(projectConfig, options));

    // Deployment workflow (if applicable)
    if (projectConfig.hasDocker || projectConfig.deployment.length > 0) {
      workflows.set('deploy.yml', await this.generateDeploymentWorkflow(projectConfig, options));
    }

    // Security scan workflow
    workflows.set('security.yml', await this.generateSecurityWorkflow(projectConfig, options));

    return workflows;
  }

  /**
   * Generate main CI workflow
   */
  async generateMainCIWorkflow(projectConfig, options) {
    const { type, packageManager, testFramework } = projectConfig;
    
    let setupSteps = '';
    let testSteps = '';
    let buildSteps = '';

    switch (type) {
      case 'nodejs':
      case 'react':
      case 'vue':
        setupSteps = `
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: '${packageManager}'

      - name: Install dependencies
        run: ${packageManager} ${packageManager === 'npm' ? 'ci' : 'install'}`;

        testSteps = `
      - name: Run tests
        run: ${packageManager} test

      - name: Run linting
        run: ${packageManager} run lint || echo "No lint script found"`;

        buildSteps = `
      - name: Build project
        run: ${packageManager} run build || echo "No build script found"`;
        break;

      case 'python':
        setupSteps = `
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          ${packageManager === 'pip' ? 'pip install -r requirements.txt' : 
            packageManager === 'poetry' ? 'poetry install' : 'pipenv install'}`;

        testSteps = `
      - name: Run tests
        run: ${testFramework === 'pytest' ? 'pytest' : 'python -m unittest'}

      - name: Run linting
        run: |
          flake8 . || echo "flake8 not configured"
          black --check . || echo "black not configured"`;
        break;

      case 'go':
        setupSteps = `
      - name: Setup Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'

      - name: Download dependencies
        run: go mod download`;

        testSteps = `
      - name: Run tests
        run: go test -v ./...

      - name: Run vet
        run: go vet ./...`;

        buildSteps = `
      - name: Build
        run: go build -v ./...`;
        break;
    }

    return `name: CI
on:
  push:
    branches: [main, master, develop]
  pull_request:
    branches: [main, master, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
${setupSteps}
${testSteps}
${buildSteps}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            test-results.xml
            coverage/
            .coverage
          retention-days: 30

  quality:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
${setupSteps}

      - name: Run Cloi quality analysis
        run: |
          npm install -g @cloi/cli || echo "Installing from local build"
          cloi analyze "Quality check" --files . || echo "Quality analysis completed with warnings"

  lint:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
${setupSteps}

      - name: Run code formatting check
        run: |
          # Add project-specific formatting checks
          echo "Code formatting checks would run here"
`;
  }

  /**
   * Generate auto-repair workflow
   */
  async generateAutoRepairWorkflow(projectConfig, options) {
    const { packageManager } = projectConfig;
    const repoName = await this.getRepositoryName();

    return `name: Auto-Repair CI Failures
on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches: [main, master, develop]

jobs:
  auto-repair:
    if: \${{ github.event.workflow_run.conclusion == 'failure' }}
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: \${{ secrets.GITHUB_TOKEN }}
          fetch-depth: 0

      - name: Setup environment
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: '${packageManager}'

      - name: Install project dependencies
        run: ${packageManager} ${packageManager === 'npm' ? 'ci' : 'install'}

      - name: Install Cloi
        run: ${packageManager} install -g @cloi/cli

      - name: Download failure logs
        id: download-logs
        run: |
          gh run download \${{ github.event.workflow_run.id }} --dir ./failure-logs || true
          echo "log-dir=./failure-logs" >> $GITHUB_OUTPUT
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}

      - name: Run Cloi Auto-Repair
        id: auto-repair
        run: |
          cat > failure-context.json << EOF
          {
            "trigger": "ci-failure",
            "failureType": "test-failure",
            "workflowName": "\${{ github.event.workflow_run.name }}",
            "repository": "${repoName}",
            "branch": "\${{ github.event.workflow_run.head_branch }}",
            "commit": "\${{ github.event.workflow_run.head_sha }}",
            "runUrl": "\${{ github.event.workflow_run.html_url }}",
            "createPR": true,
            "local": false,
            "projectType": "${projectConfig.type}",
            "packageManager": "${packageManager}"
          }
          EOF
          
          cloi workflow auto-repair \\
            --context failure-context.json \\
            --build-log-file ./failure-logs \\
            --create-pr || echo "Auto-repair completed with issues"
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

      - name: Notify on completion
        if: always()
        run: |
          if [[ "\${{ steps.auto-repair.outcome }}" == "success" ]]; then
            echo "🤖 Auto-repair completed successfully"
          else
            echo "🚨 Auto-repair encountered issues"
          fi`;
  }

  /**
   * Generate code review workflow
   */
  async generateCodeReviewWorkflow(projectConfig, options) {
    const { packageManager } = projectConfig;

    return `name: Code Review Assistant
on:
  pull_request_review:
    types: [submitted]
  issue_comment:
    types: [created]

jobs:
  process-review:
    if: |
      (github.event_name == 'pull_request_review' && github.event.review.state == 'changes_requested') ||
      (github.event_name == 'issue_comment' && github.event.issue.pull_request && contains(github.event.comment.body, '@cloi'))
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      
    steps:
      - name: Get PR information
        id: pr-info
        run: |
          if [[ "\${{ github.event_name }}" == "pull_request_review" ]]; then
            echo "pr-number=\${{ github.event.pull_request.number }}" >> $GITHUB_OUTPUT
            echo "pr-ref=\${{ github.event.pull_request.head.ref }}" >> $GITHUB_OUTPUT
          else
            echo "pr-number=\${{ github.event.issue.number }}" >> $GITHUB_OUTPUT
            # Get PR ref from issue
            PR_REF=\$(gh api repos/\${{ github.repository }}/pulls/\${{ github.event.issue.number }} --jq .head.ref)
            echo "pr-ref=\${PR_REF}" >> $GITHUB_OUTPUT
          fi
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}

      - name: Checkout PR branch
        uses: actions/checkout@v4
        with:
          token: \${{ secrets.GITHUB_TOKEN }}
          ref: \${{ steps.pr-info.outputs.pr-ref }}
          fetch-depth: 0

      - name: Setup environment
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: '${packageManager}'

      - name: Install dependencies
        run: ${packageManager} ${packageManager === 'npm' ? 'ci' : 'install'}

      - name: Install Cloi
        run: ${packageManager} install -g @cloi/cli

      - name: Process code review
        run: |
          cloi workflow code-review \\
            --pr-number \${{ steps.pr-info.outputs.pr-number }} \\
            --repository \${{ github.repository }}
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}`;
  }

  /**
   * Generate deployment workflow
   */
  async generateDeploymentWorkflow(projectConfig, options) {
    const { hasDocker, hasKubernetes, packageManager } = projectConfig;

    let deploySteps = '';
    
    if (hasDocker) {
      deploySteps = `
      - name: Build Docker image
        run: docker build -t \${{ github.repository }}:\${{ github.sha }} .

      - name: Run deployment checks
        run: |
          cloi workflow run deployment-check \\
            --context '{"target": "production", "image": "\${{ github.repository }}:\${{ github.sha }}"}'`;
    } else {
      deploySteps = `
      - name: Build for production
        run: ${packageManager} run build

      - name: Run deployment checks
        run: |
          cloi workflow run deployment-check \\
            --context '{"target": "production", "buildDir": "./dist"}'`;
    }

    return `name: Deploy
on:
  push:
    branches: [main, master]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: '${packageManager}'

      - name: Install dependencies
        run: ${packageManager} ${packageManager === 'npm' ? 'ci' : 'install'}

      - name: Install Cloi
        run: ${packageManager} install -g @cloi/cli
${deploySteps}

      # Add your specific deployment steps here
      - name: Deploy to production
        run: |
          echo "Add your deployment commands here"
          # Examples:
          # - Deploy to Heroku, Vercel, Netlify
          # - Push to container registry
          # - Deploy to Kubernetes
`;
  }

  /**
   * Generate security workflow
   */
  async generateSecurityWorkflow(projectConfig, options) {
    const { type, packageManager } = projectConfig;

    let securitySteps = '';

    switch (type) {
      case 'nodejs':
      case 'react':
      case 'vue':
        securitySteps = `
      - name: Run npm audit
        run: ${packageManager} audit || echo "Security issues found"

      - name: Run security scan
        run: |
          cloi workflow run security-scan \\
            --context '{"type": "nodejs", "packageManager": "${packageManager}"}'`;
        break;

      case 'python':
        securitySteps = `
      - name: Run safety check
        run: |
          pip install safety
          safety check || echo "Security issues found"

      - name: Run security scan
        run: |
          cloi workflow run security-scan \\
            --context '{"type": "python", "packageManager": "${packageManager}"}'`;
        break;
    }

    return `name: Security Scan
on:
  schedule:
    - cron: '0 2 * * 1' # Weekly on Monday at 2 AM
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup environment
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install Cloi
        run: npm install -g @cloi/cli
${securitySteps}

      - name: Upload security results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: security-results
          path: security-results.json
          retention-days: 90`;
  }

  /**
   * Helper methods
   */
  detectPackageManager(envContext) {
    const packageManagers = envContext.runtime.packageManagers || [];
    
    // Prefer based on lock files present
    if (packageManagers.includes('pnpm')) return 'pnpm';
    if (packageManagers.includes('yarn')) return 'yarn';
    return 'npm'; // default
  }

  async detectTestFramework() {
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps.jest) return 'jest';
      if (deps.vitest) return 'vitest';
      if (deps.mocha) return 'mocha';
      if (deps.pytest) return 'pytest';
      
      return 'jest'; // default for Node.js
    } catch {
      return 'jest';
    }
  }

  async detectBuildTool() {
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      const scripts = packageJson.scripts || {};
      
      if (scripts.build) return 'npm run build';
      return null;
    } catch {
      return null;
    }
  }

  detectDeploymentStrategy(envContext) {
    const deployment = [];
    
    if (envContext.tools.containerization.includes('docker')) {
      deployment.push('docker');
    }
    if (envContext.tools.available.includes('kubectl')) {
      deployment.push('kubernetes');
    }
    
    return deployment;
  }

  async isReactProject() {
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      return !!deps.react;
    } catch {
      return false;
    }
  }

  async isVueProject() {
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      return !!deps.vue;
    } catch {
      return false;
    }
  }

  async getRepositoryName() {
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      return packageJson.repository?.url?.replace(/.*github\.com[\/:]/, '').replace(/\.git$/, '') || 'unknown/repo';
    } catch {
      return 'unknown/repo';
    }
  }
}

/**
 * Command interface
 */
export async function generateCIWorkflows(options = {}) {
  const generator = new CIWorkflowGenerator();
  return await generator.generateWorkflows(options);
}