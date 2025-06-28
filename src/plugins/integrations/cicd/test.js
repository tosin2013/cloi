#!/usr/bin/env node
/**
 * CI/CD Integration Plugin Tests
 * Comprehensive test suite for the CI/CD integration plugin
 */

import assert from 'assert';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple test framework
class CICDTestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🏗️ Running CI/CD Integration Plugin Tests...\n');
    
    for (const { name, fn } of this.tests) {
      try {
        console.log(`Testing: ${name}`);
        await fn();
        console.log(`✅ ${name} - PASSED\n`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name} - FAILED`);
        console.log(`   Error: ${error.message}\n`);
        this.failed++;
      }
    }

    console.log('📊 CI/CD Plugin Test Results:');
    console.log(`   Passed: ${this.passed}`);
    console.log(`   Failed: ${this.failed}`);
    console.log(`   Total:  ${this.tests.length}`);

    if (this.failed > 0) {
      process.exit(1);
    } else {
      console.log('\n🎉 All CI/CD integration tests passed!');
    }
  }
}

const runner = new CICDTestRunner();

// Test: Plugin Loading and Interface
runner.test('CI/CD plugin loading and interface validation', async () => {
  const { default: CICDIntegration } = await import('./index.js');
  
  const manifest = {
    name: 'cicd',
    version: '1.0.0',
    type: 'integrations'
  };
  
  const config = {
    platforms: {
      github: {
        enabled: true,
        token: 'test-token',
        owner: 'test-owner',
        repo: 'test-repo'
      }
    }
  };
  
  const plugin = new CICDIntegration(manifest, config);
  
  // Validate required methods exist
  const requiredMethods = [
    'connect', 'disconnect', 'isConnected', 'execute', 'isConfigured',
    'triggerWorkflow', 'getWorkflowStatus', 'listWorkflows', 'createWorkflow',
    'updateWorkflow', 'getArtifacts', 'deploy', 'getDeployments', 'getStatus'
  ];
  
  for (const method of requiredMethods) {
    assert(typeof plugin[method] === 'function', `Missing method: ${method}`);
  }
  
  console.log('   ✅ All required methods present');
  
  // Test platform initialization
  assert(plugin.platforms.github, 'GitHub platform not initialized');
  assert(plugin.platforms.gitlab, 'GitLab platform not initialized');
  assert(plugin.platforms.jenkins, 'Jenkins platform not initialized');
  
  console.log('   ✅ Platform clients initialized');
});

// Test: Configuration Validation
runner.test('Configuration validation and platform detection', async () => {
  const { default: CICDIntegration } = await import('./index.js');
  
  const manifest = { name: 'cicd', version: '1.0.0' };
  
  // Test with minimal GitHub config
  const githubConfig = {
    platforms: {
      github: {
        enabled: true,
        token: 'gh_test123',
        owner: 'testorg',
        repo: 'testrepo'
      }
    }
  };
  
  const plugin = new CICDIntegration(manifest, githubConfig);
  assert(plugin.platforms.github.isConfigured(), 'GitHub should be configured');
  assert(!plugin.platforms.gitlab.isConfigured(), 'GitLab should not be configured');
  assert(!plugin.platforms.jenkins.isConfigured(), 'Jenkins should not be configured');
  
  console.log('   ✅ GitHub configuration validated');
  
  // Test enabled platforms detection
  const enabledPlatforms = plugin.getEnabledPlatforms();
  assert(enabledPlatforms.includes('github'), 'GitHub should be enabled');
  assert(enabledPlatforms.length === 1, 'Only GitHub should be enabled');
  
  console.log('   ✅ Enabled platforms detected correctly');
});

// Test: Workflow Generation
runner.test('Workflow generation for all platforms', async () => {
  const { default: CICDIntegration } = await import('./index.js');
  
  const manifest = { name: 'cicd', version: '1.0.0' };
  const config = {
    quality: { runQualityChecks: true }
  };
  
  const plugin = new CICDIntegration(manifest, config);
  
  // Test GitHub workflow generation
  const githubWorkflow = plugin.generateGitHubWorkflow({
    name: 'Test Workflow',
    nodeVersion: '18',
    branches: ['main', 'develop']
  });
  
  assert(typeof githubWorkflow === 'string', 'GitHub workflow should be string');
  assert(githubWorkflow.includes('name: Test Workflow'), 'Workflow name not found');
  assert(githubWorkflow.includes('node-version: \'18\''), 'Node version not found');
  assert(githubWorkflow.includes('npx cloi quality analyze'), 'Quality analysis not found');
  
  console.log('   ✅ GitHub workflow generated correctly');
  
  // Test GitLab pipeline generation
  const gitlabPipeline = plugin.generateGitLabPipeline({
    name: 'Test Pipeline',
    nodeVersion: '18'
  });
  
  assert(typeof gitlabPipeline === 'string', 'GitLab pipeline should be string');
  assert(gitlabPipeline.includes('NODE_VERSION: \'18\''), 'Node version not found');
  assert(gitlabPipeline.includes('npx cloi quality analyze'), 'Quality analysis not found');
  
  console.log('   ✅ GitLab pipeline generated correctly');
  
  // Test Jenkins pipeline generation
  const jenkinsfile = plugin.generateJenkinsfile({
    name: 'Test Build',
    nodeVersion: '18'
  });
  
  assert(typeof jenkinsfile === 'string', 'Jenkinsfile should be string');
  assert(jenkinsfile.includes('nodejs \'18\''), 'Node version not found');
  assert(jenkinsfile.includes('npx cloi quality analyze'), 'Quality analysis not found');
  
  console.log('   ✅ Jenkinsfile generated correctly');
});

// Test: Quality Workflow Template
runner.test('Quality-focused workflow template generation', async () => {
  const { default: CICDIntegration } = await import('./index.js');
  
  const manifest = { name: 'cicd', version: '1.0.0' };
  const config = {};
  
  const plugin = new CICDIntegration(manifest, config);
  
  const qualityWorkflow = await plugin.generateQualityWorkflowTemplate('github', {
    nodeVersion: '20'
  });
  
  assert(typeof qualityWorkflow === 'string', 'Quality workflow should be string');
  assert(qualityWorkflow.includes('Run ESLint'), 'ESLint step not found');
  assert(qualityWorkflow.includes('Run Prettier Check'), 'Prettier step not found');
  assert(qualityWorkflow.includes('Run Python Quality Checks'), 'Python checks not found');
  assert(qualityWorkflow.includes('Run Comprehensive Quality Analysis'), 'Comprehensive analysis not found');
  
  console.log('   ✅ Quality workflow template generated correctly');
});

// Test: Platform Client Initialization
runner.test('Platform client configuration and validation', async () => {
  const { default: CICDIntegration } = await import('./index.js');
  
  const manifest = { name: 'cicd', version: '1.0.0' };
  
  // Test GitHub client
  const githubConfig = {
    platforms: {
      github: {
        enabled: true,
        token: 'gh_test123',
        owner: 'testorg',
        repo: 'testrepo',
        apiUrl: 'https://api.github.com'
      }
    }
  };
  
  const plugin = new CICDIntegration(manifest, githubConfig);
  const githubClient = plugin.platforms.github;
  
  assert(githubClient.token === 'gh_test123', 'GitHub token not set');
  assert(githubClient.owner === 'testorg', 'GitHub owner not set');
  assert(githubClient.repo === 'testrepo', 'GitHub repo not set');
  assert(githubClient.apiUrl === 'https://api.github.com', 'GitHub API URL not set');
  
  console.log('   ✅ GitHub client configured correctly');
  
  // Test GitLab client
  const gitlabConfig = {
    platforms: {
      gitlab: {
        enabled: true,
        token: 'glpat-test123',
        projectId: '12345',
        apiUrl: 'https://gitlab.com/api/v4'
      }
    }
  };
  
  const gitlabPlugin = new CICDIntegration(manifest, gitlabConfig);
  const gitlabClient = gitlabPlugin.platforms.gitlab;
  
  assert(gitlabClient.token === 'glpat-test123', 'GitLab token not set');
  assert(gitlabClient.projectId === '12345', 'GitLab project ID not set');
  assert(gitlabClient.apiUrl === 'https://gitlab.com/api/v4', 'GitLab API URL not set');
  
  console.log('   ✅ GitLab client configured correctly');
  
  // Test Jenkins client
  const jenkinsConfig = {
    platforms: {
      jenkins: {
        enabled: true,
        url: 'http://jenkins.example.com',
        username: 'admin',
        apiToken: 'test-token',
        crumbIssuer: true
      }
    }
  };
  
  const jenkinsPlugin = new CICDIntegration(manifest, jenkinsConfig);
  const jenkinsClient = jenkinsPlugin.platforms.jenkins;
  
  assert(jenkinsClient.url === 'http://jenkins.example.com', 'Jenkins URL not set');
  assert(jenkinsClient.username === 'admin', 'Jenkins username not set');
  assert(jenkinsClient.apiToken === 'test-token', 'Jenkins API token not set');
  assert(jenkinsClient.crumbIssuer === true, 'Jenkins crumb issuer not set');
  
  console.log('   ✅ Jenkins client configured correctly');
});

// Test: Available Operations
runner.test('Available operations and status reporting', async () => {
  const { default: CICDIntegration } = await import('./index.js');
  
  const manifest = { name: 'cicd', version: '1.0.0' };
  const config = {};
  
  const plugin = new CICDIntegration(manifest, config);
  
  const operations = plugin.getAvailableOperations();
  const expectedOps = [
    'trigger-workflow',
    'get-workflow-status', 
    'list-workflows',
    'create-workflow',
    'update-workflow',
    'get-artifacts',
    'deploy',
    'get-deployments',
    'setup-quality-workflow'
  ];
  
  for (const op of expectedOps) {
    assert(operations.includes(op), `Missing operation: ${op}`);
  }
  
  console.log('   ✅ All expected operations available');
  
  // Test status reporting
  const status = await plugin.getStatus();
  assert(typeof status === 'object', 'Status should be object');
  assert(typeof status.connected === 'boolean', 'Status should have connected boolean');
  assert(Array.isArray(status.operations), 'Status should have operations array');
  assert(typeof status.platforms === 'object', 'Status should have platforms object');
  
  console.log('   ✅ Status reporting working correctly');
});

// Test: Configuration Retrieval
runner.test('Configuration retrieval and defaults', async () => {
  const { default: CICDIntegration } = await import('./index.js');
  
  const manifest = { name: 'cicd', version: '1.0.0' };
  const config = {
    defaultPlatform: 'gitlab',
    platforms: {
      github: { enabled: false },
      gitlab: { enabled: true },
      jenkins: { enabled: false }
    },
    quality: {
      runQualityChecks: false,
      failOnQualityIssues: true
    }
  };
  
  const plugin = new CICDIntegration(manifest, config);
  
  // Test nested configuration access
  assert(plugin.getConfig('defaultPlatform') === 'gitlab', 'Default platform not retrieved');
  assert(plugin.getConfig('platforms.gitlab.enabled') === true, 'GitLab enabled not retrieved');
  assert(plugin.getConfig('quality.runQualityChecks') === false, 'Quality checks setting not retrieved');
  assert(plugin.getConfig('nonexistent.key', 'default') === 'default', 'Default value not returned');
  
  console.log('   ✅ Configuration retrieval working correctly');
  
  // Test enabled platforms
  const enabledPlatforms = plugin.getEnabledPlatforms();
  assert(enabledPlatforms.includes('gitlab'), 'GitLab should be enabled');
  assert(!enabledPlatforms.includes('github'), 'GitHub should not be enabled');
  assert(!enabledPlatforms.includes('jenkins'), 'Jenkins should not be enabled');
  
  console.log('   ✅ Enabled platforms detection working correctly');
});

// Test: Error Handling
runner.test('Error handling and validation', async () => {
  const { default: CICDIntegration } = await import('./index.js');
  
  const manifest = { name: 'cicd', version: '1.0.0' };
  const config = {};
  
  const plugin = new CICDIntegration(manifest, config);
  
  // Test invalid platform error
  try {
    await plugin.execute('trigger-workflow', { platform: 'invalid' });
    assert(false, 'Should have thrown error for invalid platform');
  } catch (error) {
    assert(error.message.includes('Unsupported platform'), 'Wrong error message');
  }
  
  console.log('   ✅ Invalid platform error handled correctly');
  
  // Test invalid operation error
  try {
    await plugin.execute('invalid-operation');
    assert(false, 'Should have thrown error for invalid operation');
  } catch (error) {
    assert(error.message.includes('Unknown operation'), 'Wrong error message');
  }
  
  console.log('   ✅ Invalid operation error handled correctly');
});

// Run all tests
console.log('🚀 Starting CI/CD Integration Plugin Tests...\n');

// Add environment info
console.log('Environment Info:');
console.log(`   Node.js: ${process.version}`);
console.log(`   Platform: ${process.platform}`);
console.log(`   Working Directory: ${process.cwd()}`);
console.log('');

runner.run().catch(error => {
  console.error('Fatal error running CI/CD tests:', error);
  process.exit(1);
});