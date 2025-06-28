# CI/CD Integration Plugin

A comprehensive CI/CD platform integration plugin for Cloi that provides seamless workflow management, deployment automation, and pipeline monitoring across multiple platforms.

## Supported Platforms

- **GitHub Actions** - Complete workflow management with status checks and deployments
- **GitLab CI** - Pipeline management, merge requests, and deployment automation  
- **Jenkins** - Job management, build triggers, and artifact handling

## Features

### Workflow Management
- Create, update, and trigger workflows/pipelines
- Monitor workflow status and execution
- List and manage existing workflows
- Quality-focused workflow templates

### Deployment Automation
- Deploy to multiple environments
- Track deployment history
- Manage deployment artifacts
- Automated rollback capabilities

### Pipeline Monitoring
- Real-time status monitoring
- Artifact management
- Build result tracking
- Webhook handling for notifications

### Quality Integration
- Automatic integration with Cloi quality plugins
- ESLint, Prettier, and Python tool integration
- Quality gate enforcement
- Comprehensive reporting

## Installation

The CI/CD integration plugin is included with Cloi by default. No additional installation required.

## Configuration

### Basic Configuration

```json
{
  "platforms": {
    "github": {
      "enabled": true,
      "token": "your-github-token",
      "owner": "your-org-or-username", 
      "repo": "your-repository",
      "apiUrl": "https://api.github.com"
    },
    "gitlab": {
      "enabled": false,
      "token": "your-gitlab-token",
      "projectId": "your-project-id",
      "apiUrl": "https://gitlab.com/api/v4"
    },
    "jenkins": {
      "enabled": false,
      "url": "https://your-jenkins.com",
      "username": "your-username",
      "apiToken": "your-api-token",
      "crumbIssuer": true
    }
  },
  "defaultPlatform": "github",
  "quality": {
    "runQualityChecks": true,
    "failOnQualityIssues": false
  }
}
```

### Environment Variables

You can also configure using environment variables:

```bash
# GitHub
export CLOI_GITHUB_TOKEN="your-token"
export CLOI_GITHUB_OWNER="your-org"
export CLOI_GITHUB_REPO="your-repo"

# GitLab
export CLOI_GITLAB_TOKEN="your-token" 
export CLOI_GITLAB_PROJECT_ID="123456"

# Jenkins
export CLOI_JENKINS_URL="https://jenkins.example.com"
export CLOI_JENKINS_USERNAME="admin"
export CLOI_JENKINS_TOKEN="your-token"
```

## Usage

### CLI Usage

```bash
# Trigger a workflow
node src/cli/modular.js cicd trigger --platform github --workflow ci.yml --ref main

# Check workflow status
node src/cli/modular.js cicd status --platform github --run-id 123456

# List workflows
node src/cli/modular.js cicd list --platform github

# Create a new workflow
node src/cli/modular.js cicd create --platform github --name "New CI" --template quality

# Deploy to environment
node src/cli/modular.js cicd deploy --platform github --environment production --ref v1.2.3

# Get deployment history
node src/cli/modular.js cicd deployments --platform github

# Setup quality workflow
node src/cli/modular.js cicd setup-quality --platform github --node-version 18
```

### Programmatic Usage

```javascript
import { pluginManager } from './src/core/plugin-manager/index.js';

// Load the CI/CD plugin
const cicdPlugin = await pluginManager.loadPlugin('integrations', 'cicd');

// Connect to platforms
await cicdPlugin.connect();

// Trigger a workflow
const result = await cicdPlugin.execute('trigger-workflow', {
  platform: 'github',
  workflow: 'ci.yml',
  ref: 'main',
  inputs: {
    environment: 'staging'
  }
});

// Check status
const status = await cicdPlugin.execute('get-workflow-status', {
  platform: 'github',
  runId: result.runId
});

// Create a quality-focused workflow
await cicdPlugin.execute('setup-quality-workflow', {
  platform: 'github',
  nodeVersion: '18',
  branches: ['main', 'develop']
});
```

## Operations

### Available Operations

- `trigger-workflow` - Trigger a workflow/pipeline execution
- `get-workflow-status` - Get current status of a workflow run
- `list-workflows` - List all available workflows
- `create-workflow` - Create a new workflow from template
- `update-workflow` - Update an existing workflow
- `get-artifacts` - Download workflow artifacts
- `deploy` - Deploy to an environment
- `get-deployments` - Get deployment history
- `setup-quality-workflow` - Create a quality-focused workflow

### Operation Parameters

#### trigger-workflow
```javascript
{
  platform: 'github|gitlab|jenkins',
  workflow: 'workflow-name',
  ref: 'branch-or-tag',
  inputs: { key: 'value' }
}
```

#### get-workflow-status
```javascript
{
  platform: 'github|gitlab|jenkins',
  runId: 'workflow-run-id'
}
```

#### create-workflow
```javascript
{
  platform: 'github|gitlab|jenkins',
  name: 'Workflow Name',
  template: 'quality|basic|deployment',
  nodeVersion: '18',
  branches: ['main']
}
```

#### deploy
```javascript
{
  platform: 'github|gitlab|jenkins',
  environment: 'production',
  ref: 'v1.2.3',
  description: 'Release v1.2.3'
}
```

## Workflow Templates

### Quality Template

Automatically includes:
- ESLint code analysis
- Prettier formatting checks  
- Python quality tools (Flake8, Black, Pylint, MyPy)
- Comprehensive Cloi quality analysis
- Artifact upload for reports

### Basic Template

Standard CI/CD workflow with:
- Dependency installation
- Build process
- Basic testing
- Artifact generation

### Deployment Template

Production deployment workflow with:
- Environment-specific configuration
- Pre-deployment validation
- Deployment execution
- Post-deployment verification

## Platform-Specific Features

### GitHub Actions

- Full GitHub API integration
- Workflow dispatch support
- Pull request status checks
- GitHub deployment API
- Artifact management
- Webhook integration

### GitLab CI

- GitLab API integration
- Pipeline variable support
- Merge request pipelines
- Environment deployments
- Job artifact handling
- GitLab Pages integration

### Jenkins

- Jenkins REST API
- Parameterized builds
- Build artifact management
- Pipeline as Code support
- Blue Ocean integration
- Distributed builds

## Quality Integration

The CI/CD plugin automatically integrates with the Cloi quality system:

```yaml
# Auto-generated quality steps
- name: Run Cloi Quality Analysis
  run: npx cloi quality analyze --report --format junit

- name: Upload Quality Report  
  uses: actions/upload-artifact@v4
  with:
    name: quality-report
    path: quality-report.xml
```

## Error Handling

The plugin includes comprehensive error handling:

- Platform connectivity issues
- Authentication failures
- Workflow execution errors
- API rate limiting
- Network timeouts

## Security

- Secure token management
- API key encryption
- Webhook signature verification
- CSRF protection (Jenkins)
- Audit logging

## Troubleshooting

### Common Issues

#### Authentication Errors
```bash
# Check token validity
node src/cli/modular.js cicd status --platform github
```

#### Workflow Not Found
- Verify workflow file exists in repository
- Check branch/ref specification
- Validate workflow syntax

#### Permission Denied
- Ensure tokens have required permissions
- Check repository access rights
- Verify organization settings

### Debug Mode

Enable debug logging:
```bash
export CLOI_DEBUG=true
node src/cli/modular.js cicd trigger --platform github --workflow ci.yml
```

## Examples

### Complete GitHub Actions Workflow

```yaml
name: Cloi Quality CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run Cloi Quality Analysis
        run: npx cloi quality analyze --report --format junit
        
      - name: Upload Quality Report
        uses: actions/upload-artifact@v4
        with:
          name: quality-report
          path: quality-report.xml
```

### GitLab CI Pipeline

```yaml
stages:
  - build
  - quality
  - deploy

variables:
  NODE_VERSION: "18"

build:
  stage: build
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

quality:
  stage: quality
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npx cloi quality analyze --report --format junit
  artifacts:
    reports:
      junit: quality-report.xml
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    tools {
        nodejs '18'
    }
    
    stages {
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Quality Analysis') {
            steps {
                sh 'npx cloi quality analyze --report --format junit'
                publishTestResults testResultsPattern: 'quality-report.xml'
            }
        }
    }
}
```

## Contributing

To contribute to the CI/CD integration plugin:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Run the test suite: `node src/plugins/integrations/cicd/test.js`
5. Submit a pull request

## License

This plugin is part of the Cloi project and is licensed under GPL-3.0.