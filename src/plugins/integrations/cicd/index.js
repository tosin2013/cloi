import { BaseIntegration } from '../../../core/plugin-manager/interfaces.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

const execAsync = promisify(exec);

/**
 * CICDIntegration - Comprehensive CI/CD platform integration
 * 
 * Supports multiple CI/CD platforms:
 * - GitHub Actions: Workflow management, status checks, deployments
 * - GitLab CI: Pipeline management, merge requests, deployments
 * - Jenkins: Job management, build triggers, artifact handling
 */
export default class CICDIntegration extends BaseIntegration {
  constructor(manifest, config) {
    super(manifest, config);
    
    this.supportedPlatforms = ['github', 'gitlab', 'jenkins'];
    this.connections = new Map();
    this.webhookHandlers = new Map();
    
    // Initialize platform clients
    this.initializePlatforms();
  }

  /**
   * Initialize platform-specific clients
   */
  initializePlatforms() {
    this.platforms = {
      github: new GitHubActionsClient(this.getConfig('platforms.github', {})),
      gitlab: new GitLabCIClient(this.getConfig('platforms.gitlab', {})),
      jenkins: new JenkinsClient(this.getConfig('platforms.jenkins', {}))
    };
  }

  /**
   * Check if integration is properly configured
   */
  async isConfigured() {
    const enabledPlatforms = this.getEnabledPlatforms();
    return enabledPlatforms.length > 0 && enabledPlatforms.some(platform => 
      this.platforms[platform].isConfigured()
    );
  }

  /**
   * Connect to configured CI/CD platforms
   */
  async connect(options = {}) {
    const results = {
      success: true,
      connections: {},
      errors: []
    };

    const enabledPlatforms = this.getEnabledPlatforms();
    
    for (const platform of enabledPlatforms) {
      try {
        console.log(`Connecting to ${platform}...`);
        const connection = await this.platforms[platform].connect();
        this.connections.set(platform, connection);
        results.connections[platform] = {
          status: 'connected',
          details: connection
        };
        console.log(`✅ Connected to ${platform}`);
      } catch (error) {
        console.warn(`⚠️ Failed to connect to ${platform}: ${error.message}`);
        results.connections[platform] = {
          status: 'failed',
          error: error.message
        };
        results.errors.push(`${platform}: ${error.message}`);
      }
    }

    results.success = results.errors.length === 0;
    return results;
  }

  /**
   * Disconnect from all platforms
   */
  async disconnect() {
    const results = {};
    
    for (const [platform, connection] of this.connections) {
      try {
        await this.platforms[platform].disconnect();
        results[platform] = 'disconnected';
      } catch (error) {
        results[platform] = `disconnect failed: ${error.message}`;
      }
    }
    
    this.connections.clear();
    return results;
  }

  /**
   * Check if connected to platforms
   */
  async isConnected() {
    const enabledPlatforms = this.getEnabledPlatforms();
    return enabledPlatforms.some(platform => this.connections.has(platform));
  }

  /**
   * Execute CI/CD operations
   */
  async execute(operation, params = {}) {
    const platform = params.platform || this.getConfig('defaultPlatform', 'github');
    
    if (!this.platforms[platform]) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    if (!this.connections.has(platform)) {
      await this.connect();
    }

    const client = this.platforms[platform];
    
    switch (operation) {
      case 'trigger-workflow':
        return await this.triggerWorkflow(platform, params);
      case 'get-workflow-status':
        return await this.getWorkflowStatus(platform, params);
      case 'list-workflows':
        return await this.listWorkflows(platform, params);
      case 'create-workflow':
        return await this.createWorkflow(platform, params);
      case 'update-workflow':
        return await this.updateWorkflow(platform, params);
      case 'get-artifacts':
        return await this.getArtifacts(platform, params);
      case 'deploy':
        return await this.deploy(platform, params);
      case 'get-deployments':
        return await this.getDeployments(platform, params);
      case 'setup-quality-workflow':
        return await this.setupQualityWorkflow(platform, params);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Trigger a workflow/pipeline
   */
  async triggerWorkflow(platform, params) {
    const client = this.platforms[platform];
    
    const workflowParams = {
      workflow: params.workflow || 'ci.yml',
      ref: params.ref || 'main',
      inputs: params.inputs || {},
      ...params
    };

    return await client.triggerWorkflow(workflowParams);
  }

  /**
   * Get workflow/pipeline status
   */
  async getWorkflowStatus(platform, params) {
    const client = this.platforms[platform];
    return await client.getWorkflowStatus(params);
  }

  /**
   * List available workflows/pipelines
   */
  async listWorkflows(platform, params) {
    const client = this.platforms[platform];
    return await client.listWorkflows(params);
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(platform, params) {
    const client = this.platforms[platform];
    
    // Generate workflow based on template and requirements
    const workflowContent = await this.generateWorkflow(platform, params);
    
    return await client.createWorkflow({
      name: params.name,
      content: workflowContent,
      path: params.path,
      ...params
    });
  }

  /**
   * Update an existing workflow
   */
  async updateWorkflow(platform, params) {
    const client = this.platforms[platform];
    return await client.updateWorkflow(params);
  }

  /**
   * Get workflow artifacts
   */
  async getArtifacts(platform, params) {
    const client = this.platforms[platform];
    return await client.getArtifacts(params);
  }

  /**
   * Deploy to environment
   */
  async deploy(platform, params) {
    const client = this.platforms[platform];
    
    const deploymentParams = {
      environment: params.environment || 'production',
      ref: params.ref || 'main',
      description: params.description || 'Automated deployment via Cloi',
      ...params
    };

    return await client.deploy(deploymentParams);
  }

  /**
   * Get deployment history
   */
  async getDeployments(platform, params) {
    const client = this.platforms[platform];
    return await client.getDeployments(params);
  }

  /**
   * Setup quality-focused workflow
   */
  async setupQualityWorkflow(platform, params) {
    const workflowTemplate = await this.generateQualityWorkflowTemplate(platform, params);
    
    return await this.createWorkflow(platform, {
      name: 'Code Quality',
      path: '.github/workflows/quality.yml',
      content: workflowTemplate,
      ...params
    });
  }

  /**
   * Generate workflow content based on platform and requirements
   */
  async generateWorkflow(platform, params) {
    const templates = {
      github: this.generateGitHubWorkflow,
      gitlab: this.generateGitLabPipeline,
      jenkins: this.generateJenkinsfile
    };

    const generator = templates[platform];
    if (!generator) {
      throw new Error(`No workflow generator for platform: ${platform}`);
    }

    return generator.call(this, params);
  }

  /**
   * Generate GitHub Actions workflow
   */
  generateGitHubWorkflow(params) {
    const workflow = {
      name: params.name || 'CI/CD Pipeline',
      on: {
        push: {
          branches: params.branches || ['main', 'develop']
        },
        pull_request: {
          branches: ['main']
        }
      },
      jobs: {
        build: {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              uses: 'actions/checkout@v4'
            },
            {
              name: 'Setup Node.js',
              uses: 'actions/setup-node@v4',
              with: {
                'node-version': params.nodeVersion || '18',
                cache: 'npm'
              }
            },
            {
              name: 'Install dependencies',
              run: 'npm ci'
            }
          ]
        }
      }
    };

    // Add quality checks if enabled
    if (this.getConfig('quality.runQualityChecks', true)) {
      workflow.jobs.build.steps.push(
        {
          name: 'Run Cloi Quality Analysis',
          run: 'npx cloi quality analyze --report --format junit'
        },
        {
          name: 'Upload Quality Report',
          uses: 'actions/upload-artifact@v4',
          with: {
            name: 'quality-report',
            path: 'quality-report.xml'
          }
        }
      );
    }

    // Add custom steps
    if (params.steps) {
      workflow.jobs.build.steps.push(...params.steps);
    }

    return yaml.dump(workflow);
  }

  /**
   * Generate GitLab CI pipeline
   */
  generateGitLabPipeline(params) {
    const pipeline = {
      stages: ['build', 'test', 'quality', 'deploy'],
      variables: {
        NODE_VERSION: params.nodeVersion || '18'
      },
      build: {
        stage: 'build',
        image: 'node:$NODE_VERSION',
        script: [
          'npm ci',
          'npm run build'
        ],
        artifacts: {
          paths: ['dist/']
        }
      }
    };

    // Add quality stage if enabled
    if (this.getConfig('quality.runQualityChecks', true)) {
      pipeline.quality = {
        stage: 'quality',
        image: 'node:$NODE_VERSION',
        script: [
          'npm ci',
          'npx cloi quality analyze --report --format junit'
        ],
        artifacts: {
          reports: {
            junit: 'quality-report.xml'
          }
        }
      };
    }

    // Add custom jobs
    if (params.jobs) {
      Object.assign(pipeline, params.jobs);
    }

    return yaml.dump(pipeline);
  }

  /**
   * Generate Jenkinsfile
   */
  generateJenkinsfile(params) {
    const nodeVersion = params.nodeVersion || '18';
    
    const jenkinsfile = `
pipeline {
    agent any
    
    tools {
        nodejs '${nodeVersion}'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        
        ${this.getConfig('quality.runQualityChecks', true) ? `
        stage('Quality Analysis') {
            steps {
                sh 'npx cloi quality analyze --report --format junit'
                publishTestResults testResultsPattern: 'quality-report.xml'
            }
        }
        ` : ''}
        
        ${params.customStages || ''}
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}`;

    return jenkinsfile.trim();
  }

  /**
   * Generate quality-focused workflow template
   */
  async generateQualityWorkflowTemplate(platform, params) {
    const qualityParams = {
      ...params,
      name: 'Code Quality Check',
      steps: [
        {
          name: 'Run ESLint',
          run: 'npx eslint . --ext .js,.jsx,.ts,.tsx --format json --output-file eslint-report.json'
        },
        {
          name: 'Run Prettier Check',
          run: 'npx prettier --check "**/*.{js,jsx,ts,tsx,json,md}"'
        },
        {
          name: 'Run Python Quality Checks',
          run: 'python -m flake8 . --format=json --output-file flake8-report.json'
        },
        {
          name: 'Run Comprehensive Quality Analysis',
          run: 'npx cloi quality analyze --report --format json --output quality-report.json'
        }
      ]
    };

    return await this.generateWorkflow(platform, qualityParams);
  }

  /**
   * Get available operations
   */
  getAvailableOperations() {
    return [
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
  }

  /**
   * Get integration status
   */
  async getStatus() {
    const enabledPlatforms = this.getEnabledPlatforms();
    const status = {
      connected: await this.isConnected(),
      platforms: {},
      workflows: {},
      lastUsed: this.lastUsed || null,
      operations: this.getAvailableOperations()
    };

    for (const platform of enabledPlatforms) {
      try {
        const client = this.platforms[platform];
        status.platforms[platform] = {
          enabled: true,
          configured: client.isConfigured(),
          connected: this.connections.has(platform)
        };

        if (this.connections.has(platform)) {
          status.workflows[platform] = await client.getWorkflowSummary();
        }
      } catch (error) {
        status.platforms[platform] = {
          enabled: true,
          configured: false,
          error: error.message
        };
      }
    }

    return status;
  }

  /**
   * Helper methods
   */
  getEnabledPlatforms() {
    return this.supportedPlatforms.filter(platform => 
      this.getConfig(`platforms.${platform}.enabled`, false)
    );
  }
}

/**
 * GitHub Actions Client
 */
class GitHubActionsClient {
  constructor(config) {
    this.config = config;
    this.apiUrl = config.apiUrl || 'https://api.github.com';
    this.token = config.token;
    this.owner = config.owner;
    this.repo = config.repo;
  }

  isConfigured() {
    return !!(this.token && this.owner && this.repo);
  }

  async connect() {
    if (!this.isConfigured()) {
      throw new Error('GitHub Actions not configured');
    }

    // Test connection by getting repository info
    const response = await this.makeRequest(`/repos/${this.owner}/${this.repo}`);
    return {
      platform: 'github',
      repository: response.full_name,
      permissions: response.permissions
    };
  }

  async disconnect() {
    // No explicit disconnect needed for GitHub API
    return true;
  }

  async triggerWorkflow(params) {
    const response = await this.makeRequest(
      `/repos/${this.owner}/${this.repo}/actions/workflows/${params.workflow}/dispatches`,
      'POST',
      {
        ref: params.ref,
        inputs: params.inputs
      }
    );

    return {
      success: true,
      workflow: params.workflow,
      ref: params.ref,
      status: 'triggered'
    };
  }

  async getWorkflowStatus(params) {
    const response = await this.makeRequest(
      `/repos/${this.owner}/${this.repo}/actions/runs/${params.runId}`
    );

    return {
      id: response.id,
      status: response.status,
      conclusion: response.conclusion,
      workflow: response.name,
      branch: response.head_branch,
      commit: response.head_sha.substring(0, 7),
      url: response.html_url
    };
  }

  async listWorkflows(params) {
    const response = await this.makeRequest(
      `/repos/${this.owner}/${this.repo}/actions/workflows`
    );

    return {
      workflows: response.workflows.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        path: workflow.path,
        state: workflow.state,
        url: workflow.html_url
      }))
    };
  }

  async createWorkflow(params) {
    // Create workflow file via Contents API
    const content = Buffer.from(params.content).toString('base64');
    
    const response = await this.makeRequest(
      `/repos/${this.owner}/${this.repo}/contents/${params.path}`,
      'PUT',
      {
        message: `Add ${params.name} workflow`,
        content: content,
        branch: params.branch || 'main'
      }
    );

    return {
      success: true,
      path: params.path,
      sha: response.content.sha,
      url: response.content.html_url
    };
  }

  async updateWorkflow(params) {
    // Update workflow file via Contents API
    const content = Buffer.from(params.content).toString('base64');
    
    const response = await this.makeRequest(
      `/repos/${this.owner}/${this.repo}/contents/${params.path}`,
      'PUT',
      {
        message: `Update ${params.name} workflow`,
        content: content,
        sha: params.sha,
        branch: params.branch || 'main'
      }
    );

    return {
      success: true,
      path: params.path,
      sha: response.content.sha
    };
  }

  async getArtifacts(params) {
    const response = await this.makeRequest(
      `/repos/${this.owner}/${this.repo}/actions/runs/${params.runId}/artifacts`
    );

    return {
      artifacts: response.artifacts.map(artifact => ({
        id: artifact.id,
        name: artifact.name,
        size: artifact.size_in_bytes,
        url: artifact.archive_download_url,
        expired: artifact.expired
      }))
    };
  }

  async deploy(params) {
    const response = await this.makeRequest(
      `/repos/${this.owner}/${this.repo}/deployments`,
      'POST',
      {
        ref: params.ref,
        environment: params.environment,
        description: params.description,
        auto_merge: false
      }
    );

    return {
      id: response.id,
      environment: response.environment,
      ref: response.ref,
      status: 'created',
      url: response.url
    };
  }

  async getDeployments(params) {
    const response = await this.makeRequest(
      `/repos/${this.owner}/${this.repo}/deployments`
    );

    return {
      deployments: response.map(deployment => ({
        id: deployment.id,
        environment: deployment.environment,
        ref: deployment.ref,
        description: deployment.description,
        created_at: deployment.created_at
      }))
    };
  }

  async getWorkflowSummary() {
    const workflows = await this.listWorkflows();
    return {
      total: workflows.workflows.length,
      active: workflows.workflows.filter(w => w.state === 'active').length
    };
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
    const url = `${this.apiUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Cloi-CICD-Integration'
      }
    };

    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
}

/**
 * GitLab CI Client
 */
class GitLabCIClient {
  constructor(config) {
    this.config = config;
    this.apiUrl = config.apiUrl || 'https://gitlab.com/api/v4';
    this.token = config.token;
    this.projectId = config.projectId;
  }

  isConfigured() {
    return !!(this.token && this.projectId);
  }

  async connect() {
    if (!this.isConfigured()) {
      throw new Error('GitLab CI not configured');
    }

    const response = await this.makeRequest(`/projects/${this.projectId}`);
    return {
      platform: 'gitlab',
      project: response.name_with_namespace,
      permissions: response.permissions
    };
  }

  async disconnect() {
    return true;
  }

  async triggerWorkflow(params) {
    const response = await this.makeRequest(
      `/projects/${this.projectId}/pipeline`,
      'POST',
      {
        ref: params.ref,
        variables: params.inputs ? Object.entries(params.inputs).map(([key, value]) => ({
          key,
          value: String(value)
        })) : []
      }
    );

    return {
      success: true,
      pipeline_id: response.id,
      ref: response.ref,
      status: response.status
    };
  }

  async getWorkflowStatus(params) {
    const response = await this.makeRequest(
      `/projects/${this.projectId}/pipelines/${params.pipelineId}`
    );

    return {
      id: response.id,
      status: response.status,
      ref: response.ref,
      sha: response.sha.substring(0, 7),
      url: response.web_url
    };
  }

  async listWorkflows(params) {
    const response = await this.makeRequest(
      `/projects/${this.projectId}/pipelines`
    );

    return {
      pipelines: response.map(pipeline => ({
        id: pipeline.id,
        status: pipeline.status,
        ref: pipeline.ref,
        sha: pipeline.sha.substring(0, 7),
        url: pipeline.web_url
      }))
    };
  }

  async createWorkflow(params) {
    // Create .gitlab-ci.yml file
    const response = await this.makeRequest(
      `/projects/${this.projectId}/repository/files/.gitlab-ci.yml`,
      'POST',
      {
        branch: params.branch || 'main',
        content: params.content,
        commit_message: `Add ${params.name} pipeline`
      }
    );

    return {
      success: true,
      file_path: '.gitlab-ci.yml',
      branch: response.branch
    };
  }

  async updateWorkflow(params) {
    const response = await this.makeRequest(
      `/projects/${this.projectId}/repository/files/.gitlab-ci.yml`,
      'PUT',
      {
        branch: params.branch || 'main',
        content: params.content,
        commit_message: `Update ${params.name} pipeline`
      }
    );

    return {
      success: true,
      file_path: '.gitlab-ci.yml',
      branch: response.branch
    };
  }

  async getArtifacts(params) {
    const response = await this.makeRequest(
      `/projects/${this.projectId}/jobs/${params.jobId}/artifacts`
    );

    return {
      artifacts: response || []
    };
  }

  async deploy(params) {
    const response = await this.makeRequest(
      `/projects/${this.projectId}/deployments`,
      'POST',
      {
        environment: params.environment,
        ref: params.ref,
        deployable: {
          name: params.description || 'Deployment via Cloi'
        }
      }
    );

    return {
      id: response.id,
      environment: response.environment.name,
      ref: response.ref,
      status: response.status
    };
  }

  async getDeployments(params) {
    const response = await this.makeRequest(
      `/projects/${this.projectId}/deployments`
    );

    return {
      deployments: response.map(deployment => ({
        id: deployment.id,
        environment: deployment.environment.name,
        ref: deployment.ref,
        status: deployment.status,
        created_at: deployment.created_at
      }))
    };
  }

  async getWorkflowSummary() {
    const pipelines = await this.listWorkflows();
    return {
      total: pipelines.pipelines.length,
      running: pipelines.pipelines.filter(p => p.status === 'running').length
    };
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
    const url = `${this.apiUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Private-Token': this.token,
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
}

/**
 * Jenkins Client
 */
class JenkinsClient {
  constructor(config) {
    this.config = config;
    this.url = config.url;
    this.username = config.username;
    this.apiToken = config.apiToken;
    this.crumbIssuer = config.crumbIssuer !== false;
    this.crumb = null;
  }

  isConfigured() {
    return !!(this.url && this.username && this.apiToken);
  }

  async connect() {
    if (!this.isConfigured()) {
      throw new Error('Jenkins not configured');
    }

    // Get crumb if CSRF protection is enabled
    if (this.crumbIssuer) {
      await this.getCrumb();
    }

    // Test connection
    const response = await this.makeRequest('/api/json');
    return {
      platform: 'jenkins',
      version: response.version,
      mode: response.mode
    };
  }

  async disconnect() {
    this.crumb = null;
    return true;
  }

  async getCrumb() {
    try {
      const response = await this.makeRequest('/crumbIssuer/api/json');
      this.crumb = {
        field: response.crumbRequestField,
        value: response.crumb
      };
    } catch (error) {
      console.warn('Could not get Jenkins crumb:', error.message);
    }
  }

  async triggerWorkflow(params) {
    const jobName = params.job || params.workflow;
    const endpoint = params.parameters 
      ? `/job/${jobName}/buildWithParameters`
      : `/job/${jobName}/build`;

    const response = await this.makeRequest(endpoint, 'POST', params.parameters);
    
    return {
      success: true,
      job: jobName,
      status: 'triggered'
    };
  }

  async getWorkflowStatus(params) {
    const response = await this.makeRequest(
      `/job/${params.job}/${params.buildNumber}/api/json`
    );

    return {
      id: response.id,
      number: response.number,
      status: response.building ? 'running' : 'completed',
      result: response.result,
      url: response.url
    };
  }

  async listWorkflows(params) {
    const response = await this.makeRequest('/api/json');
    
    return {
      jobs: response.jobs.map(job => ({
        name: job.name,
        url: job.url,
        color: job.color
      }))
    };
  }

  async createWorkflow(params) {
    const configXml = this.generateJenkinsJobConfig(params);
    
    await this.makeRequest(
      `/createItem?name=${params.name}`,
      'POST',
      configXml,
      'application/xml'
    );

    return {
      success: true,
      job: params.name
    };
  }

  async updateWorkflow(params) {
    const configXml = this.generateJenkinsJobConfig(params);
    
    await this.makeRequest(
      `/job/${params.name}/config.xml`,
      'POST',
      configXml,
      'application/xml'
    );

    return {
      success: true,
      job: params.name
    };
  }

  async getArtifacts(params) {
    const response = await this.makeRequest(
      `/job/${params.job}/${params.buildNumber}/api/json`
    );

    return {
      artifacts: response.artifacts || []
    };
  }

  async deploy(params) {
    // Trigger deployment job
    return await this.triggerWorkflow({
      job: params.deploymentJob || 'deploy',
      parameters: {
        ENVIRONMENT: params.environment,
        REF: params.ref,
        DESCRIPTION: params.description
      }
    });
  }

  async getDeployments(params) {
    // Get builds from deployment job
    const response = await this.makeRequest(
      `/job/${params.deploymentJob || 'deploy'}/api/json`
    );

    return {
      deployments: response.builds.map(build => ({
        id: build.number,
        url: build.url,
        timestamp: build.timestamp
      }))
    };
  }

  async getWorkflowSummary() {
    const jobs = await this.listWorkflows();
    return {
      total: jobs.jobs.length,
      active: jobs.jobs.filter(j => !j.color.includes('disabled')).length
    };
  }

  generateJenkinsJobConfig(params) {
    return `<?xml version='1.1' encoding='UTF-8'?>
<project>
  <description>${params.description || 'Job created by Cloi'}</description>
  <keepDependencies>false</keepDependencies>
  <properties/>
  <scm class="hudson.plugins.git.GitSCM">
    <configVersion>2</configVersion>
    <userRemoteConfigs>
      <hudson.plugins.git.UserRemoteConfig>
        <url>${params.repository}</url>
      </hudson.plugins.git.UserRemoteConfig>
    </userRemoteConfigs>
    <branches>
      <hudson.plugins.git.BranchSpec>
        <name>*/${params.branch || 'main'}</name>
      </hudson.plugins.git.BranchSpec>
    </branches>
  </scm>
  <builders>
    <hudson.tasks.Shell>
      <command>${params.script || 'echo "No script provided"'}</command>
    </hudson.tasks.Shell>
  </builders>
</project>`;
  }

  async makeRequest(endpoint, method = 'GET', body = null, contentType = 'application/json') {
    const url = `${this.url}${endpoint}`;
    const auth = Buffer.from(`${this.username}:${this.apiToken}`).toString('base64');
    
    const options = {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': contentType
      }
    };

    if (this.crumb) {
      options.headers[this.crumb.field] = this.crumb.value;
    }

    if (body) {
      if (contentType === 'application/json') {
        options.body = JSON.stringify(body);
      } else {
        options.body = body;
      }
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`Jenkins API error: ${response.status} ${response.statusText}`);
    }

    if (response.headers.get('content-type')?.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  }
}