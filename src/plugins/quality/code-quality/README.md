# CodeQualityPlugin - Advanced Code Quality Management

A comprehensive quality plugin for the Cloi modular platform that provides multi-language code quality analysis, formatting, and security scanning.

## Overview

The CodeQualityPlugin integrates with popular code quality tools to provide:

- **Multi-Language Support**: JavaScript/TypeScript and Python
- **Comprehensive Analysis**: Linting, formatting, type checking, and security scanning
- **Auto-Fix Capabilities**: Automatically fix formatting and linting issues
- **Detailed Reporting**: Generate reports in multiple formats (JSON, HTML, Markdown, JUnit)
- **Intelligent Recommendations**: Get actionable suggestions for code improvement

## Supported Tools

### JavaScript/TypeScript
- **ESLint**: Comprehensive linting with configurable rules
- **Prettier**: Code formatting and style consistency

### Python
- **Black**: Uncompromising code formatting
- **Flake8**: Style guide enforcement and error detection
- **Pylint**: Advanced static analysis and code quality metrics
- **MyPy**: Static type checking

### Security & Analysis
- **Snyk**: Vulnerability scanning for dependencies
- **SonarQube**: Enterprise-grade code analysis (when configured)

## Installation

The plugin is installed in the Cloi plugin directory:

```bash
# Plugin is located at: src/plugins/quality/code-quality/
# Load the plugin:
node src/cli/modular.js plugins load quality:code-quality
```

## Configuration

Add quality tool configurations to your Cloi config file:

```json
{
  "plugins": {
    "quality": {
      "code-quality": {
        "enabled": true,
        "autoFix": false,
        "severity": "warning",
        "tools": {
          "eslint": {
            "enabled": true,
            "configFile": ".eslintrc.js",
            "extensions": [".js", ".jsx", ".ts", ".tsx"],
            "rules": {
              "no-console": "warn",
              "prefer-const": "error"
            }
          },
          "prettier": {
            "enabled": true,
            "configFile": ".prettierrc",
            "extensions": [".js", ".jsx", ".ts", ".tsx", ".json", ".md"],
            "options": {
              "singleQuote": true,
              "tabWidth": 2
            }
          },
          "black": {
            "enabled": true,
            "extensions": [".py"],
            "lineLength": 88,
            "targetVersions": ["py38", "py39", "py310", "py311"]
          },
          "flake8": {
            "enabled": true,
            "configFile": ".flake8",
            "extensions": [".py"],
            "maxLineLength": 88,
            "ignoreErrors": ["E203", "W503"]
          },
          "pylint": {
            "enabled": true,
            "configFile": ".pylintrc",
            "extensions": [".py"],
            "rcfile": "pyproject.toml"
          },
          "mypy": {
            "enabled": true,
            "configFile": "mypy.ini",
            "extensions": [".py"],
            "strictMode": false,
            "ignoreErrors": []
          },
          "snyk": {
            "enabled": false,
            "token": "your-snyk-token",
            "severity": "high"
          },
          "sonarqube": {
            "enabled": false,
            "serverUrl": "https://sonarqube.example.com",
            "token": "your-sonar-token",
            "projectKey": "your-project-key"
          }
        },
        "excludePatterns": [
          "node_modules/**",
          "dist/**",
          "build/**",
          "coverage/**",
          ".git/**"
        ],
        "reporting": {
          "format": "json",
          "outputFile": "quality-report.json",
          "includeMetrics": true
        }
      }
    }
  }
}
```

## Usage

### Basic Quality Analysis

```bash
# Analyze all supported files in current directory
node src/cli/modular.js quality analyze

# Analyze specific files
node src/cli/modular.js quality analyze src/components/App.js src/utils/helper.py

# Analyze with specific tools only
node src/cli/modular.js quality analyze --tools eslint,prettier

# Generate detailed report
node src/cli/modular.js quality analyze --report --format html
```

### Auto-Fix Issues

```bash
# Auto-fix all fixable issues
node src/cli/modular.js quality auto-fix

# Auto-fix specific files
node src/cli/modular.js quality auto-fix src/components/

# Auto-fix with specific tools
node src/cli/modular.js quality auto-fix --tools prettier,black
```

### Quality Metrics

```bash
# Get quality metrics
node src/cli/modular.js quality metrics

# Get metrics for specific files
node src/cli/modular.js quality metrics src/

# Include complexity analysis
node src/cli/modular.js quality metrics --include-complexity
```

### Report Generation

```bash
# Generate JSON report
node src/cli/modular.js quality report --format json

# Generate HTML report
node src/cli/modular.js quality report --format html --output quality-report.html

# Generate Markdown report
node src/cli/modular.js quality report --format markdown

# Generate JUnit XML for CI/CD
node src/cli/modular.js quality report --format junit --output test-results.xml
```

## Tool Setup

### JavaScript/TypeScript Setup

```bash
# Install ESLint and Prettier
npm install --save-dev eslint prettier eslint-config-prettier

# Create ESLint config
echo 'module.exports = { extends: ["eslint:recommended"] };' > .eslintrc.js

# Create Prettier config
echo '{ "singleQuote": true, "tabWidth": 2 }' > .prettierrc
```

### Python Setup

```bash
# Install Python tools
pip install black flake8 pylint mypy

# Create flake8 config
cat > .flake8 << EOF
[flake8]
max-line-length = 88
extend-ignore = E203, W503
EOF

# Create pylint config
pylint --generate-rcfile > .pylintrc
```

### Security Setup

```bash
# Install Snyk
npm install -g snyk

# Authenticate with Snyk
snyk auth

# Test for vulnerabilities
snyk test
```

## API Reference

### CodeQualityPlugin

#### Methods

##### `async analyze(files, options)`
Analyzes code quality for the specified files.

**Parameters:**
- `files` (Array|string): Files to analyze
- `options` (Object): Analysis options
  - `tools` (Array): Specific tools to use
  - `severity` (string): Minimum severity level
  - `excludePatterns` (Array): Patterns to exclude

**Returns:** Analysis results object

##### `async autoFix(files, options)`
Automatically fixes quality issues in the specified files.

**Parameters:**
- `files` (Array|string): Files to fix
- `options` (Object): Fix options
  - `tools` (Array): Specific tools to use for fixing
  - `backup` (boolean): Create backup before fixing

**Returns:** Fix results object

##### `async getMetrics(files, options)`
Calculates quality metrics for the specified files.

**Parameters:**
- `files` (Array|string): Files to analyze
- `options` (Object): Metrics options
  - `includeComplexity` (boolean): Include complexity metrics
  - `includeduplication` (boolean): Include duplication analysis

**Returns:** Quality metrics object

##### `async generateReport(analysisResults, options)`
Generates a formatted report from analysis results.

**Parameters:**
- `analysisResults` (Object): Results from analyze()
- `options` (Object): Report options
  - `format` (string): Report format ('json', 'html', 'markdown', 'junit')
  - `includeMetrics` (boolean): Include quality metrics
  - `outputFile` (string): Output file path

**Returns:** Formatted report object

### Configuration Options

#### Tool-Specific Options

**ESLint:**
- `configFile`: Path to ESLint configuration file
- `rules`: Override rules
- `extensions`: File extensions to process

**Prettier:**
- `configFile`: Path to Prettier configuration file
- `options`: Prettier formatting options

**Black:**
- `lineLength`: Maximum line length
- `targetVersions`: Python versions to target

**Flake8:**
- `configFile`: Path to Flake8 configuration file
- `maxLineLength`: Maximum line length
- `ignoreErrors`: Error codes to ignore

**Pylint:**
- `configFile`: Path to Pylint configuration file
- `rcfile`: Path to pylintrc file

**MyPy:**
- `configFile`: Path to MyPy configuration file
- `strictMode`: Enable strict type checking

## Integration Examples

### CI/CD Pipeline Integration

```yaml
# GitHub Actions example
name: Code Quality
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
          
      - name: Install dependencies
        run: |
          npm install
          pip install black flake8 pylint mypy
          
      - name: Run Cloi Quality Analysis
        run: |
          node src/cli/modular.js plugins load quality:code-quality
          node src/cli/modular.js quality analyze --report --format junit --output test-results.xml
          
      - name: Upload test results
        uses: actions/upload-artifact@v2
        with:
          name: quality-results
          path: test-results.xml
```

### Pre-commit Hook Integration

```bash
#!/bin/sh
# .git/hooks/pre-commit

# Run quality checks before commit
node src/cli/modular.js quality analyze --tools eslint,black,flake8

# Exit with error code if issues found
if [ $? -ne 0 ]; then
  echo "Quality checks failed. Run 'cloi quality auto-fix' to fix issues."
  exit 1
fi
```

### VSCode Integration

```json
{
  "tasks": [
    {
      "label": "Cloi Quality Check",
      "type": "shell",
      "command": "node",
      "args": ["src/cli/modular.js", "quality", "analyze", "${file}"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    }
  ]
}
```

## Quality Metrics

The plugin provides comprehensive quality metrics:

### Code Complexity
- Cyclomatic complexity per function/method
- Average complexity across files
- Maximum complexity identification

### Maintainability
- Maintainability index calculation
- Code duplication detection
- Technical debt assessment

### Coverage
- Line coverage percentage
- Branch coverage analysis
- Uncovered code identification

### Language-Specific Metrics

**JavaScript/TypeScript:**
- Function complexity
- Import/export analysis
- React component complexity

**Python:**
- Class and method complexity
- Import dependency analysis
- PEP 8 compliance score

## Performance Optimization

### Caching
The plugin caches tool availability checks and configuration parsing to improve performance:

```javascript
// Tool availability is cached per session
const isESLintAvailable = await plugin.isToolAvailable('eslint');
```

### Parallel Execution
Multiple tools can run in parallel for faster analysis:

```javascript
// Tools run concurrently when analyzing large codebases
const results = await plugin.analyze(files, { parallel: true });
```

### Incremental Analysis
Only analyze changed files in CI/CD environments:

```bash
# Analyze only files changed in last commit
git diff --name-only HEAD~1 | xargs node src/cli/modular.js quality analyze
```

## Troubleshooting

### Common Issues

1. **Tool not found errors**
   ```bash
   # Install missing tools
   npm install -g eslint prettier
   pip install black flake8 pylint mypy
   ```

2. **Configuration file not found**
   ```bash
   # Create default configuration files
   npx eslint --init
   echo '{}' > .prettierrc
   ```

3. **Permission errors**
   ```bash
   # Fix file permissions
   chmod +x node_modules/.bin/eslint
   ```

### Debug Mode

Enable debug logging:

```bash
DEBUG=cloi:quality:* node src/cli/modular.js quality analyze
```

### Tool Conflicts

If tools conflict (e.g., ESLint and Prettier), configure them to work together:

```javascript
// .eslintrc.js
module.exports = {
  extends: ['eslint:recommended', 'prettier'],
  rules: {
    // Disable conflicting rules
    'prettier/prettier': 'error'
  }
};
```

## Best Practices

### Configuration Management
1. **Use project-specific configs**: Keep tool configurations in your project root
2. **Version control configs**: Include `.eslintrc.js`, `.prettierrc`, etc. in git
3. **Team consistency**: Ensure all team members use the same configurations

### CI/CD Integration
1. **Fail fast**: Run quality checks early in the pipeline
2. **Cache dependencies**: Cache tool installations between runs
3. **Parallel execution**: Run different tools in parallel for speed

### Code Quality Workflow
1. **Local development**: Run quality checks before committing
2. **Pre-commit hooks**: Automatically run checks on commit
3. **PR reviews**: Include quality reports in pull request reviews
4. **Continuous improvement**: Regularly review and update quality rules

## Contributing

To contribute to the code quality plugin:

1. **Add new tools**: Implement new tool integrations following existing patterns
2. **Improve metrics**: Enhance quality metric calculations
3. **Add formats**: Support additional report formats
4. **Performance**: Optimize tool execution and caching

## License

GPL-3.0

## Support

For issues with the code quality plugin:
1. Check tool installations and configurations
2. Review exclude patterns and file paths
3. Verify tool compatibility with your codebase
4. Check plugin logs for detailed error information

The CodeQualityPlugin provides a comprehensive foundation for maintaining high code quality across JavaScript/TypeScript and Python projects, with extensible architecture for adding additional languages and tools.