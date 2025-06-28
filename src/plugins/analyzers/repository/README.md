# Repository Analyzer Plugin

A comprehensive repository analysis and expertise tracking system that provides deep insights into your codebase, team expertise, and project structure across multiple programming languages and infrastructure technologies.

## Features

### Multi-Language Analysis
- **30+ Programming Languages** - JavaScript, TypeScript, Python, Java, C#, Go, Rust, PHP, Ruby, Swift, Kotlin, C/C++, Scala, Clojure, Elixir, Erlang, Haskell, Dart, Lua, Perl, R, and more
- **Language Detection** - Automatic identification of file types and languages
- **Framework Recognition** - React, Vue, Angular, Django, Flask, Spring, Express, Laravel, Rails, and more
- **Dependency Analysis** - Package managers, libraries, and external dependencies

### Infrastructure as Code Analysis
- **Ansible** - Playbooks, roles, tasks, variables, and inventory analysis
- **Terraform** - Resources, providers, modules, and state management
- **Kubernetes** - Deployments, services, ConfigMaps, secrets, and manifests
- **Docker** - Dockerfiles, compose files, images, and containerization
- **CloudFormation** - AWS infrastructure templates and resources
- **Helm** - Charts, templates, and Kubernetes package management

### Expertise Tracking
- **Contributor Analysis** - Git history-based expertise mapping
- **Code Ownership** - File-level ownership and responsibility tracking
- **Knowledge Areas** - Frontend, backend, infrastructure, testing, documentation
- **Activity Metrics** - Recent contributions, commit frequency, impact analysis
- **Team Insights** - Who knows what parts of the codebase

### Codebase Intelligence
- **Architecture Mapping** - Project structure and organization patterns
- **Complexity Analysis** - Code complexity and maintainability metrics
- **Pattern Detection** - Design patterns and architectural styles
- **Module Dependencies** - Import/export relationships and coupling
- **Quality Metrics** - Technical debt and code health indicators

## Installation

The repository analyzer plugin is included with Cloi by default. For enhanced Git analysis capabilities, install optional dependencies:

```bash
# Install Git analysis dependencies
npm install simple-git ignore semver yaml

# These provide enhanced features but are not required for basic analysis
```

## Configuration

### Basic Configuration

```json
{
  "enabled": true,
  "analysis": {
    "includeHistory": true,
    "maxHistoryDepth": 1000,
    "analyzeBranches": ["main", "master", "develop"]
  },
  "expertise": {
    "enabled": true,
    "trackContributors": true,
    "analyzeCommitMessages": true
  }
}
```

### Advanced Configuration

```json
{
  "analysis": {
    "includeHistory": true,
    "maxHistoryDepth": 1000,
    "includeDeletedFiles": false,
    "analyzeBranches": ["main", "master", "develop"],
    "excludePatterns": [
      "node_modules/**",
      ".git/**",
      "dist/**",
      "build/**",
      "*.log"
    ]
  },
  "expertise": {
    "enabled": true,
    "trackContributors": true,
    "analyzeCommitMessages": true,
    "trackFileOwnership": true,
    "expertiseThreshold": 0.1,
    "recentActivityWeight": 0.7,
    "codeOwnershipWeight": 0.3,
    "languageSpecialization": true,
    "infrastructureSpecialization": true
  },
  "intelligence": {
    "enabled": true,
    "extractPatterns": true,
    "trackDependencies": true,
    "analyzeArchitecture": true,
    "detectFrameworks": true,
    "mapModules": true,
    "analyzeInfrastructure": true
  },
  "caching": {
    "enabled": true,
    "ttl": 3600000,
    "persistCache": true
  }
}
```

### Environment Variables

```bash
# Analysis configuration
export CLOI_REPO_MAX_HISTORY=1000
export CLOI_REPO_INCLUDE_DELETED=false

# Expertise tracking
export CLOI_EXPERTISE_THRESHOLD=0.1
export CLOI_RECENT_ACTIVITY_WEIGHT=0.7

# Performance settings
export CLOI_REPO_MAX_CONCURRENT=4
export CLOI_REPO_CHUNK_SIZE=100
```

## Usage

### CLI Usage

```bash
# Analyze the current repository
node src/cli/modular.js repository analyze

# Analyze specific aspects
node src/cli/modular.js repository analyze --languages
node src/cli/modular.js repository analyze --expertise
node src/cli/modular.js repository analyze --infrastructure

# Generate reports
node src/cli/modular.js repository report --format json
node src/cli/modular.js repository report --format html
node src/cli/modular.js repository report --format markdown

# Find experts for specific areas
node src/cli/modular.js repository experts --area frontend
node src/cli/modular.js repository experts --language python
node src/cli/modular.js repository experts --file src/components/App.js

# Analyze specific files or directories
node src/cli/modular.js repository analyze --path src/
node src/cli/modular.js repository analyze --files "*.js,*.py"
```

### Programmatic Usage

```javascript
import { pluginManager } from './src/core/plugin-manager/index.js';

// Load the repository analyzer
const repoAnalyzer = await pluginManager.loadPlugin('analyzers', 'repository');

// Perform comprehensive analysis
const analysis = await repoAnalyzer.analyze('', {
  includeLanguages: true,
  includeExpertise: true,
  includeInfrastructure: true,
  includeIntelligence: true
});

console.log('Repository Analysis Results:', analysis);

// Access specific analysis components
const languages = analysis.languages;
const expertise = analysis.expertise;
const infrastructure = analysis.infrastructure;
const intelligence = analysis.intelligence;
```

## Analysis Output

### Complete Analysis Structure

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "repository": {
    "path": "/path/to/repo",
    "name": "my-project"
  },
  "languages": {
    "javascript": {
      "files": ["src/app.js", "src/utils.js"],
      "totalLines": 1250,
      "totalBytes": 45000,
      "percentage": 45.2,
      "extensions": [".js", ".jsx"],
      "frameworks": ["react", "express"],
      "dependencies": ["lodash", "axios"]
    },
    "python": {
      "files": ["backend/main.py", "scripts/deploy.py"],
      "totalLines": 800,
      "totalBytes": 28000,
      "percentage": 28.5,
      "extensions": [".py"],
      "frameworks": ["django", "flask"],
      "dependencies": ["requests", "pandas"]
    }
  },
  "infrastructure": {
    "ansible": {
      "files": ["playbooks/deploy.yml"],
      "playbooks": ["deploy.yml"],
      "roles": ["webserver", "database"],
      "inventories": ["production", "staging"]
    },
    "terraform": {
      "files": ["infrastructure/main.tf"],
      "modules": ["vpc", "ec2", "rds"],
      "providers": ["aws", "cloudflare"],
      "resources": ["aws_instance", "aws_db_instance"]
    },
    "kubernetes": {
      "files": ["k8s/deployment.yaml"],
      "deployments": ["web-app", "api-server"],
      "services": ["web-service", "api-service"],
      "configmaps": ["app-config"]
    },
    "docker": {
      "files": ["Dockerfile", "docker-compose.yml"],
      "images": ["node:18", "postgres:14"],
      "services": ["web", "database", "redis"]
    }
  },
  "expertise": {
    "alice@example.com": {
      "email": "alice@example.com",
      "commits": 150,
      "linesAdded": 5000,
      "linesDeleted": 1200,
      "filesModified": ["src/components/*.js", "src/api/*.js"],
      "languages": ["javascript", "typescript"],
      "areas": ["frontend", "api"],
      "expertiseScore": 0.85,
      "recentActivity": 45,
      "firstCommit": "2023-01-15T00:00:00Z",
      "lastCommit": "2024-01-15T00:00:00Z"
    },
    "bob@example.com": {
      "email": "bob@example.com",
      "commits": 120,
      "linesAdded": 4200,
      "linesDeleted": 900,
      "filesModified": ["backend/*.py", "infrastructure/*.tf"],
      "languages": ["python", "terraform"],
      "areas": ["backend", "infrastructure"],
      "expertiseScore": 0.78,
      "recentActivity": 38
    }
  },
  "intelligence": {
    "architecture": {
      "type": "microservices",
      "patterns": ["mvc", "repository-pattern"],
      "layers": ["presentation", "business", "data"]
    },
    "patterns": ["singleton", "factory", "observer"],
    "dependencies": {
      "direct": ["react", "express", "postgresql"],
      "transitive": ["lodash", "moment", "babel"],
      "outdated": ["jquery@2.1.0"],
      "vulnerable": []
    },
    "modules": {
      "frontend": ["components", "pages", "utils"],
      "backend": ["controllers", "models", "services"],
      "shared": ["types", "constants", "helpers"]
    },
    "complexity": {
      "cyclomaticComplexity": 15.2,
      "cognitiveComplexity": 12.8,
      "maintainabilityIndex": 85.4
    }
  },
  "metrics": {
    "totalFiles": 245,
    "totalLines": 15420,
    "totalContributors": 8,
    "languageCount": 6,
    "frameworkCount": 4,
    "infrastructureTypes": 3
  },
  "duration": 2450
}
```

## Language Support

### Programming Languages

| Language | Extensions | Frameworks Detected |
|----------|------------|-------------------|
| JavaScript | .js, .mjs, .jsx | React, Vue, Angular, Express, Next.js |
| TypeScript | .ts, .tsx, .d.ts | Angular, React, NestJS |
| Python | .py, .pyw, .pyx | Django, Flask, FastAPI |
| Java | .java, .class | Spring, Spring Boot, Maven |
| C# | .cs, .csx, .csproj | ASP.NET, Entity Framework |
| Go | .go | Gin, Echo, Fiber |
| Rust | .rs, .toml | Cargo projects |
| PHP | .php, .phtml | Laravel, Symfony, Composer |
| Ruby | .rb, .rake, .gemspec | Rails, Sinatra, Gem |
| Swift | .swift | iOS, macOS, SwiftUI |
| Kotlin | .kt, .kts | Android, Spring |
| C/C++ | .c, .cpp, .h, .hpp | Make, CMake |
| Scala | .scala, .sc | SBT, Play Framework |
| And many more... | | |

### Infrastructure Technologies

| Technology | Files | Analysis Capabilities |
|-----------|-------|---------------------|
| Ansible | .yml, .yaml | Playbooks, roles, tasks, variables |
| Terraform | .tf, .tfvars | Resources, modules, providers |
| Kubernetes | .yml, .yaml | Deployments, services, configs |
| Docker | Dockerfile, compose | Images, services, networks |
| CloudFormation | .json, .yml | AWS resources, stacks |
| Helm | Chart.yaml, templates | Charts, releases |

## Expertise Analysis

### How Expertise is Calculated

1. **Git History Analysis** - Commits, authorship, file modifications
2. **Recent Activity Weight** - More recent contributions weighted higher
3. **Code Ownership** - Files primarily authored by contributor
4. **Language Specialization** - Expertise in specific programming languages
5. **Area Specialization** - Frontend, backend, infrastructure, testing
6. **Commit Impact** - Lines added/deleted, files modified

### Expertise Scoring

```javascript
expertiseScore = (recentActivity * recentWeight) + (codeOwnership * ownershipWeight)
```

Default weights:
- Recent Activity: 70%
- Code Ownership: 30%

### Finding Experts

```bash
# Find frontend experts
node src/cli/modular.js repository experts --area frontend

# Find Python experts
node src/cli/modular.js repository experts --language python

# Find experts for specific file
node src/cli/modular.js repository experts --file src/api/users.js

# Find infrastructure experts
node src/cli/modular.js repository experts --area infrastructure
```

## Intelligence Features

### Architecture Detection

- **Monolithic** - Single deployable unit
- **Microservices** - Distributed service architecture
- **Serverless** - Function-based architecture
- **Layered** - N-tier architecture patterns

### Pattern Recognition

- **Design Patterns** - Singleton, Factory, Observer, Strategy
- **Architectural Patterns** - MVC, MVP, MVVM, Repository
- **Infrastructure Patterns** - Circuit Breaker, Bulkhead, Retry

### Dependency Analysis

```json
{
  "dependencies": {
    "direct": ["react@18.2.0", "express@4.18.2"],
    "transitive": ["lodash@4.17.21", "moment@2.29.4"],
    "outdated": ["jquery@2.1.0"],
    "vulnerable": ["serialize-javascript@3.0.0"],
    "devDependencies": ["jest@29.5.0", "eslint@8.42.0"]
  }
}
```

### Complexity Metrics

- **Cyclomatic Complexity** - Code path complexity
- **Cognitive Complexity** - Human readability complexity
- **Maintainability Index** - Overall code maintainability (0-100)
- **Technical Debt** - Estimated refactoring effort

## Performance and Caching

### Caching Strategy

- **Git-based Cache Keys** - Cache invalidated on new commits
- **Incremental Analysis** - Only analyze changed files
- **Persistent Cache** - Survives between runs
- **Memory Management** - Configurable cache size limits

### Performance Optimization

```json
{
  "performance": {
    "maxConcurrentAnalysis": 4,
    "chunkSize": 100,
    "timeout": 300000,
    "skipLargeFiles": true,
    "parallelLanguageAnalysis": true
  }
}
```

## Reports and Visualization

### Report Formats

```bash
# JSON report (detailed)
node src/cli/modular.js repository report --format json

# HTML report (visual)
node src/cli/modular.js repository report --format html

# Markdown report (documentation)
node src/cli/modular.js repository report --format markdown
```

### HTML Report Features

- **Interactive Charts** - Language distribution, contributor activity
- **Expertise Matrix** - Visual representation of team knowledge
- **Dependency Graph** - Module and library relationships
- **Timeline View** - Repository evolution over time

## Integration with Other Plugins

### CI/CD Integration

```yaml
# GitHub Actions
- name: Repository Analysis
  run: node src/cli/modular.js repository analyze --output analysis.json
  
- name: Upload Analysis
  uses: actions/upload-artifact@v4
  with:
    name: repository-analysis
    path: analysis.json
```

### Quality Integration

```bash
# Combined quality and repository analysis
node src/cli/modular.js quality analyze --include-repo-insights
```

### Documentation Integration

```bash
# Generate documentation with expertise mapping
node src/cli/modular.js docs generate --include-experts
```

## Use Cases

### Team Onboarding

```bash
# Help new team members understand the codebase
node src/cli/modular.js repository analyze --newcomer-guide

# Find experts to contact for specific areas
node src/cli/modular.js repository experts --area authentication
```

### Code Review Assignment

```bash
# Find best reviewers for changes
node src/cli/modular.js repository experts --files "src/api/*.js,src/components/*.jsx"
```

### Technical Debt Analysis

```bash
# Identify areas needing attention
node src/cli/modular.js repository analyze --technical-debt

# Find experts who can help with refactoring
node src/cli/modular.js repository experts --area "high-complexity-modules"
```

### Architecture Documentation

```bash
# Generate architecture overview
node src/cli/modular.js repository report --format markdown --include-architecture

# Create team knowledge map
node src/cli/modular.js repository report --format html --include-expertise-matrix
```

## Best Practices

### Configuration

1. **Exclude Irrelevant Files** - Configure exclude patterns for build artifacts
2. **Set Appropriate History Depth** - Balance between accuracy and performance
3. **Enable Caching** - Improve performance for large repositories
4. **Configure Branch Analysis** - Focus on relevant branches

### Team Usage

1. **Regular Analysis** - Run weekly analysis for team insights
2. **Onboarding Integration** - Include in new developer onboarding
3. **Code Review Process** - Use expert identification for reviewer assignment
4. **Knowledge Sharing** - Share expertise reports with the team

### Performance

1. **Incremental Updates** - Use caching for large repositories
2. **Parallel Processing** - Configure concurrent analysis threads
3. **File Size Limits** - Skip very large binary files
4. **Selective Analysis** - Analyze specific paths when needed

## Troubleshooting

### Common Issues

#### Git Analysis Fails
```bash
# Check Git repository status
git status

# Verify Git history
git log --oneline -10
```

#### Performance Issues
```bash
# Reduce history depth
export CLOI_REPO_MAX_HISTORY=500

# Enable file size limits
export CLOI_REPO_MAX_FILE_SIZE=1MB
```

#### Missing Dependencies
```bash
# Install optional dependencies
npm install simple-git ignore semver yaml
```

### Debug Mode

```bash
# Enable verbose logging
export CLOI_DEBUG=true
node src/cli/modular.js repository analyze
```

## Contributing

To contribute to the repository analyzer:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Run the test suite: `node src/plugins/analyzers/repository/test.js`
5. Submit a pull request

### Adding Language Support

```javascript
// Add to languagePatterns in index.js
newLanguage: ['.ext1', '.ext2', '.ext3']

// Add framework detection patterns
newFramework: ['framework-keyword', 'import-pattern']
```

### Adding Infrastructure Support

```javascript
// Add to infrastructurePatterns
newInfra: {
  files: ['.config', '.yaml'],
  keywords: ['keyword1:', 'keyword2:'],
  directories: ['config-dir', 'templates-dir']
}
```

## License

This plugin is part of the Cloi project and is licensed under GPL-3.0.