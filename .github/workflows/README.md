# GitHub Actions Workflows for Enhanced Cloi

This directory contains comprehensive CI/CD workflows for testing both the legacy Cloi system and the new enhanced modular platform. These workflows leverage AI for code analysis, documentation generation, and provide extensive testing coverage for the plugin-based architecture.

## Workflows Overview

### 1. CI Pipeline (`ci.yml`)
**Trigger**: Push to main/develop, Pull Requests, Manual dispatch
**Purpose**: Ensures code quality and functionality for both legacy and enhanced systems

**Jobs**:
- **Changes Detection**: Optimizes workflow by detecting which files changed
- **JavaScript Linting**: ESLint and Prettier checks (auto-configured)
- **Python Linting**: Black, isort, and flake8 checks
- **Setup Tests**: Validates installation process across Node.js versions (20, 22, 24)
  - ✅ **NEW**: Enhanced modular system tests (`npm run test:enhanced`)
  - ✅ **NEW**: Enhanced CLI help and status commands
- **CodeBERT Integration Tests**: Ensures the ML service starts and responds correctly
- **Dependency Checks**: Scans for known vulnerabilities
- **Documentation Validation**: Checks markdown links and spelling

### 🚀 Enhanced Cloi Tests (`enhanced-cloi.yml`) - **NEW**
**Trigger**: Changes to modular architecture files (`src/core/**`, `src/plugins/**`, `src/cli/modular.js`)
**Purpose**: Comprehensive testing of new modular platform

**Test Suites**:
1. **Modular Architecture**: Core systems (plugin manager, config manager, state manager, coordinator)
2. **Plugin System**: Plugin discovery, loading, and validation
3. **Enhanced CLI**: New CLI interface and commands
4. **Plugin Interfaces**: Interface contracts and validation
5. **Analysis Accuracy**: Error classification and confidence testing
6. **Legacy Compatibility**: Ensures backward compatibility

### 2. Security Scanning (`security.yml`)
**Trigger**: Push to main/develop, Pull Requests, Weekly schedule, Manual dispatch
**Purpose**: Comprehensive security analysis

**Jobs**:
- **CodeQL Analysis**: Static analysis for JavaScript and Python
- **Snyk Scanning**: Vulnerability detection in dependencies
- **OWASP Dependency Check**: Additional vulnerability scanning
- **Secret Scanning**: Prevents accidental credential commits
- **License Compliance**: Ensures compatible open-source licenses
- **Container Security**: Trivy scanning for future Docker support

### 3. Build and Release (`release.yml`)
**Trigger**: Git tags (v*), Manual dispatch with version input
**Purpose**: Automated release process

**Jobs**:
- **Multi-platform Builds**: Linux, macOS, Windows
- **NPM Publishing**: Automated package publishing
- **GitHub Release Creation**: With auto-generated release notes
- **Docker Image Building**: Prepared for future containerization
- **Documentation Updates**: Automatic PR for version updates

### 4. CodeBERT Health Check (`codebert-health.yml`)
**Trigger**: Every 6 hours, Changes to RAG system, Manual dispatch
**Purpose**: Monitors the critical ML service

**Jobs**:
- **Service Health Check**: Validates CodeBERT service startup
- **Performance Benchmarking**: Monitors embedding generation speed
- **Memory Usage Monitoring**: Alerts on high memory consumption
- **Model Availability Check**: Ensures Hugging Face model access
- **Automated Issue Creation**: Opens GitHub issue on failures

## AI-Enhanced Workflows

### 5. AI Code Review (`ai-code-review.yml`)
**Trigger**: Pull Requests to main/develop
**Purpose**: AI-powered code analysis and review assistance

**Jobs**:
- **AI Code Review**: Analyzes code changes with focus on core logic protection
- **AI Security Analysis**: Deep security review for sensitive file changes
- **AI Test Suggestions**: Recommends test coverage improvements

### 6. AI Documentation (`ai-documentation.yml`)
**Trigger**: Push to main, Weekly schedule, Manual dispatch
**Purpose**: Automated documentation generation and enhancement

**Jobs**:
- **AI API Documentation**: Generates comprehensive API docs from code structure
- **Architecture Documentation**: Creates system architecture overviews
- **README Enhancement**: Improves project documentation
- **Code Comments**: Adds helpful comments to underdocumented code

### 7. AI Workflow Optimizer (`ai-workflow-optimizer.yml`)
**Trigger**: Weekly schedule, Workflow completion, Manual dispatch
**Purpose**: Continuous improvement of CI/CD processes

**Jobs**:
- **Performance Analysis**: Identifies slow or failing workflows
- **Dependency Analysis**: Reviews and optimizes project dependencies
- **Error Pattern Analysis**: Analyzes failure patterns and suggests fixes

## Required Secrets

Configure these in your repository settings under Settings → Secrets and variables → Actions:

1. **ANTHROPIC_API_KEY**: Required for Claude API integration
2. **NPM_TOKEN**: Required for publishing to NPM registry
3. **SNYK_TOKEN**: Required for Snyk security scanning (optional but recommended)

**Note**: AI-enhanced workflows use the built-in `GITHUB_TOKEN` with `models: read` permission to access GitHub Models. No additional API keys are required for AI features.

## Branch Protection Recommendations

To leverage these workflows effectively, configure branch protection rules:

1. **For `main` branch**:
   - Require pull request reviews (at least 1)
   - Require status checks to pass:
     - `CI Pipeline / Setup Tests`
     - `CI Pipeline / CodeBERT Integration Tests`
     - `Security Scanning / CodeQL Analysis`
   - Require branches to be up to date
   - Include administrators in restrictions

2. **For `develop` branch**:
   - Require status checks to pass:
     - `CI Pipeline / Setup Tests`
   - Require branches to be up to date

## Enhanced Testing Strategy

### Test Coverage for Modular Architecture

**Enhanced Modular Tests** (`/test/enhanced-modular.test.js`):
- ✅ Core module imports and functionality
- ✅ Plugin manager discovery and loading
- ✅ Configuration hierarchy and validation
- ✅ State management and session tracking
- ✅ Coordinator integration and error analysis
- ✅ Plugin interface contracts and validation
- ✅ JavaScript analyzer accuracy and framework detection

**Legacy Tests** (`/test/ollama.test.js`):
- ✅ Ollama connectivity and model availability
- ✅ Basic and JavaScript-specific error analysis
- ✅ Model compatibility across versions

### Running Tests Locally

```bash
# Run all tests (enhanced + legacy)
npm run test:all

# Run enhanced modular tests only
npm run test:enhanced

# Run legacy Ollama tests only
npm run test:ollama

# Test enhanced CLI features
node src/cli/modular.js status
node src/cli/modular.js plugins list
node src/cli/modular.js analyze "SyntaxError: test" --files test.js

# Install development dependencies
npm install --save-dev eslint prettier eslint-config-prettier eslint-plugin-import

# Install Python linting tools
pip install black flake8 isort mypy

# Run JavaScript linting
npx eslint . --ext .js,.cjs,.mjs

# Run Python linting
black --check bin/
flake8 bin/ --max-line-length=88 --extend-ignore=E203

# Run legacy tests
npm run test-rag
```

### Quality Gates

**For Enhanced Features:**
- All modular architecture tests must pass
- Plugin interface validation must succeed
- Configuration validation must pass
- Legacy compatibility must be maintained

**Test Execution Strategy:**
1. **Fast Feedback** (5-10 min): Enhanced tests run on modular changes
2. **Comprehensive** (10-15 min): Main CI tests all functionality
3. **Integration** (20-30 min): Ollama tests with actual LLM integration

## Workflow Customization

### Adding New Node.js Versions
Edit `.github/workflows/ci.yml` and update the matrix:
```yaml
strategy:
  matrix:
    node-version: [20, 22, 24, 26]  # Add new version here
```

### Adjusting Security Scan Severity
Edit `.github/workflows/security.yml` to change thresholds:
```yaml
- name: Run Snyk to check for vulnerabilities
  with:
    args: --severity-threshold=medium  # Change from 'high' to 'medium'
```

### Modifying Release Process
Edit `.github/workflows/release.yml` to customize release notes or add deployment steps.

## Troubleshooting

### Common Issues

1. **CodeBERT service fails to start**
   - Check Python dependencies are correctly installed
   - Verify port 5001 is not in use
   - Review service logs in workflow output

2. **Security scans fail**
   - Review the security report artifacts
   - Update dependencies with `npm update` or `pip install --upgrade`
   - Check for false positives and add suppressions if needed

3. **Release workflow fails**
   - Ensure NPM_TOKEN secret is correctly set
   - Verify version number follows semantic versioning
   - Check npm account has publish permissions

### Debugging Workflows

1. Enable debug logging:
   - Add `ACTIONS_RUNNER_DEBUG: true` to workflow env
   - Add `ACTIONS_STEP_DEBUG: true` for detailed step logs

2. Use workflow dispatch for testing:
   - Most workflows support manual triggering
   - Useful for debugging without creating commits

3. Check artifacts:
   - Failed workflows often upload diagnostic artifacts
   - Download and review for detailed error information

## AI-Enhanced Features

### Code Review Intelligence
- **Context-Aware Analysis**: AI understands the Cloi project context and focuses on relevant issues
- **Core Logic Protection**: Special attention to changes in `/src/core/` and `/src/rag/` directories
- **Security-First Approach**: Deep analysis of security-sensitive file changes
- **Test Coverage Recommendations**: Suggests specific tests based on code changes

### Documentation Automation
- **API Documentation**: Auto-generates comprehensive API docs from code structure
- **Architecture Diagrams**: Creates visual representations of system architecture
- **Release Notes**: AI-enhanced release notes with proper categorization
- **Code Comments**: Adds helpful comments to improve code maintainability

### Continuous Optimization
- **Performance Monitoring**: Tracks workflow performance and suggests optimizations
- **Dependency Management**: Analyzes dependencies for security and performance
- **Failure Analysis**: Provides root cause analysis for workflow failures
- **Cost Optimization**: Identifies opportunities to reduce CI/CD costs

## Best Practices

1. **Keep workflows DRY**: Use composite actions for repeated steps
2. **Cache aggressively**: Improves workflow speed significantly
3. **Fail fast**: Use `fail-fast: false` sparingly to see all failures
4. **Monitor costs**: GitHub Actions usage can add up with matrix builds
5. **Regular updates**: Keep action versions current with Dependabot
6. **Review AI suggestions**: Always review AI-generated content before merging
7. **Customize AI prompts**: Adjust prompts in workflows to match your specific needs

## Contributing to Workflows

When modifying workflows:
1. Test changes in a feature branch first
2. Use act (https://github.com/nektos/act) for local testing
3. Document any new secrets or requirements
4. Update this README with significant changes

## Performance Optimization

Current optimizations:
- Path filtering to skip unnecessary jobs
- Dependency caching for npm and pip
- Parallel job execution where possible
- Conditional steps based on file changes

Future improvements:
- Docker layer caching when Dockerfile is added
- Self-hosted runners for resource-intensive jobs
- Artifact sharing between workflows

## Monitoring and Alerts

- Health check runs every 6 hours
- Failed security scans create issues automatically
- Release failures require manual intervention
- Consider integrating with Slack/Discord for notifications

---

For questions or issues with the workflows, please open a GitHub issue or contact the DevOps team.