# Documentation Analyzer Plugin

An intelligent documentation management and analysis system that provides comprehensive insights into your project's documentation coverage, quality, and opportunities for improvement across all documentation types and formats.

## Features

### Documentation Discovery and Analysis
- **Multi-Format Support** - Markdown, HTML, PDF, JSON, YAML, RST, AsciiDoc, JSDoc, TypeDoc, Sphinx
- **Comprehensive Scanning** - Discovers documentation in standard and custom directories
- **Type Classification** - Automatically categorizes documentation by type (API, README, guides, etc.)
- **Content Analysis** - Analyzes structure, quality, and completeness of documentation files

### Coverage Tracking and Analysis
- **Code Documentation Coverage** - Tracks inline documentation across all programming languages
- **Documentation Gap Identification** - Identifies missing or incomplete documentation
- **Language-Specific Analysis** - Supports JSDoc, TypeDoc, Python docstrings, and more
- **Area-Based Coverage** - Tracks documentation by codebase areas (frontend, backend, infrastructure)

### Quality Assessment
- **Comprehensive Quality Scoring** - Multi-factor quality assessment for documentation files
- **Consistency Analysis** - Ensures consistent documentation standards across the project
- **Accessibility Checking** - Validates accessibility features in documentation
- **Freshness Analysis** - Identifies outdated or stale documentation

### Intelligent Generation Opportunities
- **API Documentation** - Identifies opportunities for automated API documentation generation
- **Code Documentation** - Suggests inline documentation improvements
- **User Guide Generation** - Recommends user guides and tutorials based on code analysis
- **Template Management** - Manages and suggests documentation templates

### Integration and Automation
- **Repository Integration** - Works seamlessly with repository analyzer for comprehensive insights
- **CI/CD Integration** - Supports integration with continuous integration workflows
- **Multi-Platform Support** - Works with GitHub, GitLab, and other development platforms
- **Automated Reporting** - Generates comprehensive documentation reports

## Installation

The documentation analyzer plugin is included with Cloi by default. For enhanced documentation processing capabilities, install optional dependencies:

```bash
# Install documentation processing dependencies
npm install markdown-it gray-matter jsdoc typedoc remark remark-parse remark-stringify

# These provide enhanced features but are not required for basic analysis
```

## Configuration

### Basic Configuration

```json
{
  "enabled": true,
  "analysis": {
    "scanDirectories": ["docs", "documentation", "wiki"],
    "trackCoverage": true,
    "validateLinks": true,
    "analyzeStructure": true
  },
  "generation": {
    "enabled": true,
    "autoGenerate": false,
    "formats": ["markdown", "html"]
  }
}
```

### Advanced Configuration

```json
{
  "analysis": {
    "scanDirectories": ["docs", "documentation", "wiki", "guides"],
    "includeCodeComments": true,
    "trackCoverage": true,
    "validateLinks": true,
    "analyzeStructure": true,
    "detectOutdated": true,
    "extractTodos": true
  },
  "generation": {
    "enabled": true,
    "autoGenerate": false,
    "formats": ["markdown", "html", "pdf"],
    "templates": {
      "useCustomTemplates": true,
      "templateDirectory": "templates/docs",
      "defaultTemplate": "standard"
    },
    "apiDocs": {
      "enabled": true,
      "includeFunctions": true,
      "includeClasses": true,
      "includeModules": true,
      "includeTypes": true
    }
  },
  "organization": {
    "autoOrganize": true,
    "categoryByType": true,
    "sortByPriority": true,
    "createIndexes": true,
    "linkRelated": true,
    "suggestStructure": true
  },
  "quality": {
    "enforceStyle": true,
    "requireHeaders": true,
    "checkCompleteness": true,
    "validateExamples": true
  },
  "caching": {
    "enabled": true,
    "ttl": 7200000,
    "cacheAnalysis": true,
    "cacheGeneration": true
  }
}
```

### Environment Variables

```bash
# Documentation analysis configuration
export CLOI_DOCS_SCAN_DIRS="docs,documentation,wiki"
export CLOI_DOCS_TRACK_COVERAGE=true

# Quality settings
export CLOI_DOCS_ENFORCE_STYLE=true
export CLOI_DOCS_REQUIRE_HEADERS=true

# Generation settings
export CLOI_DOCS_AUTO_GENERATE=false
export CLOI_DOCS_DEFAULT_FORMAT=markdown

# Performance settings
export CLOI_DOCS_CACHE_TTL=7200000
export CLOI_DOCS_MAX_FILE_SIZE=50MB
```

## Usage

### CLI Usage

```bash
# Analyze documentation coverage and quality
node src/cli/modular.js documentation analyze

# Analyze specific aspects
node src/cli/modular.js documentation coverage
node src/cli/modular.js documentation quality
node src/cli/modular.js documentation structure

# Generate missing documentation
node src/cli/modular.js documentation generate --type api
node src/cli/modular.js documentation generate --type user-guide

# Generate comprehensive reports
node src/cli/modular.js documentation report --format html
node src/cli/modular.js documentation report --format markdown
node src/cli/modular.js documentation report --include-recommendations

# Validate documentation
node src/cli/modular.js documentation validate
node src/cli/modular.js documentation validate --check-links
node src/cli/modular.js documentation validate --check-structure

# Organize documentation
node src/cli/modular.js documentation organize
node src/cli/modular.js documentation organize --create-index
node src/cli/modular.js documentation organize --suggest-structure
```

### Programmatic Usage

```javascript
import { pluginManager } from './src/core/plugin-manager/index.js';

// Load the documentation analyzer
const docAnalyzer = await pluginManager.loadPlugin('analyzers', 'documentation');

// Perform comprehensive documentation analysis
const analysis = await docAnalyzer.analyze('', {
  includeCoverage: true,
  includeQuality: true,
  includeStructure: true,
  includeOpportunities: true
});

console.log('Documentation Analysis Results:', analysis);

// Access specific analysis components
const coverage = analysis.coverage;
const quality = analysis.quality;
const structure = analysis.structure;
const opportunities = analysis.opportunities;
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
  "coverage": {
    "overall": {
      "documented": 45,
      "total": 100,
      "percentage": 45.0
    },
    "byLanguage": {
      "javascript": {
        "documented": 30,
        "total": 60,
        "percentage": 50.0
      },
      "python": {
        "documented": 15,
        "total": 40,
        "percentage": 37.5
      }
    },
    "byArea": {
      "frontend": { "documented": 20, "total": 40, "percentage": 50.0 },
      "backend": { "documented": 15, "total": 35, "percentage": 42.9 },
      "infrastructure": { "documented": 10, "total": 25, "percentage": 40.0 }
    },
    "missingDocs": [
      {
        "file": "src/api/users.js",
        "reasons": ["No inline documentation found"],
        "priority": "high"
      }
    ],
    "wellDocumented": [
      {
        "file": "src/components/App.js",
        "score": 85,
        "types": ["jsdoc", "inline"]
      }
    ]
  },
  "structure": {
    "directories": [
      {
        "path": "/docs",
        "files": ["README.md", "api.md", "guide.md"],
        "organization": "topic-based",
        "hasIndex": true,
        "coverage": 75
      }
    ],
    "files": [
      {
        "path": "README.md",
        "type": "readme",
        "quality": 90,
        "lastModified": "2024-01-10T00:00:00Z"
      }
    ],
    "navigation": {
      "hasIndex": true,
      "linkage": "good",
      "breadcrumbs": false
    }
  },
  "quality": {
    "overallScore": 75.5,
    "files": [
      {
        "file": "/docs/README.md",
        "score": 85,
        "issues": [],
        "strengths": ["Good header structure", "Includes examples"],
        "metadata": {
          "title": "Project Documentation",
          "author": "Team"
        }
      }
    ],
    "consistency": {
      "score": 80,
      "issues": ["Inconsistent header styles in 3 files"]
    },
    "accessibility": {
      "score": 70,
      "features": ["Alt text for images", "Semantic headers"]
    },
    "freshness": {
      "score": 65,
      "outdated": ["docs/old-api.md"]
    }
  },
  "opportunities": {
    "apiDocumentation": [
      {
        "file": "src/api/users.js",
        "methods": ["createUser", "getUser", "updateUser"],
        "priority": "high"
      }
    ],
    "codeDocumentation": [
      {
        "file": "src/utils/helpers.js",
        "functions": 15,
        "coverage": 20,
        "priority": "medium"
      }
    ],
    "userGuides": [
      {
        "topic": "Getting Started",
        "complexity": "beginner",
        "estimatedPages": 5
      }
    ],
    "automation": {
      "score": 85,
      "opportunities": [
        "API documentation from OpenAPI specs",
        "Code documentation from JSDoc comments"
      ]
    }
  },
  "recommendations": [
    {
      "type": "coverage",
      "priority": "high",
      "title": "Improve API documentation coverage",
      "description": "Only 30% of API endpoints have documentation",
      "action": "Add JSDoc comments to API endpoint functions"
    },
    {
      "type": "structure",
      "priority": "medium",
      "title": "Create user guide section",
      "description": "No user-facing documentation found",
      "action": "Create docs/user-guide/ directory with getting started content"
    }
  ],
  "metrics": {
    "totalDocuments": 25,
    "coveragePercentage": 45.0,
    "qualityScore": 75.5,
    "missingDocs": 55,
    "recommendationCount": 8
  },
  "duration": 2450
}
```

## Supported Documentation Types

### Documentation Formats

| Format | Extensions | Analysis Capabilities |
|--------|------------|---------------------|
| Markdown | .md, .markdown, .mdown | Full parsing, structure analysis, link validation |
| HTML | .html, .htm | Structure analysis, accessibility checking |
| RestructuredText | .rst | Full parsing, cross-references |
| AsciiDoc | .adoc, .asciidoc | Document structure, includes |
| Plain Text | .txt | Basic analysis, pattern detection |

### Documentation Types

| Type | Common Files | Analysis Focus |
|------|-------------|----------------|
| README | README.md, README.txt | Project overview, getting started |
| API Documentation | api.md, reference.md | Endpoint coverage, examples |
| User Guides | guide.md, tutorial.md | Step-by-step instructions |
| Developer Docs | dev.md, contributing.md | Development setup, guidelines |
| Architecture | architecture.md, design.md | System design, diagrams |
| Deployment | deployment.md, install.md | Installation, configuration |
| Troubleshooting | faq.md, troubleshooting.md | Problem resolution |

### Code Documentation Types

| Language | Documentation Style | Support Level |
|----------|-------------------|---------------|
| JavaScript | JSDoc comments | Full |
| TypeScript | TSDoc comments | Full |
| Python | Docstrings | Full |
| Java | JavaDoc comments | Full |
| C# | XML documentation | Full |
| Go | Go doc comments | Basic |
| Rust | Rust doc comments | Basic |
| PHP | PHPDoc comments | Full |
| Ruby | YARD comments | Basic |

## Coverage Analysis

### How Coverage is Calculated

1. **File-Level Coverage** - Presence of documentation files for code modules
2. **Function-Level Coverage** - Inline documentation for functions and methods
3. **Class-Level Coverage** - Documentation for classes and interfaces
4. **Module-Level Coverage** - Overview documentation for modules and packages

### Coverage Scoring

```javascript
coverageScore = (documentedItems / totalItems) * 100
```

### Coverage Categories

- **Excellent (90-100%)** - Comprehensive documentation
- **Good (70-89%)** - Well documented with minor gaps
- **Fair (50-69%)** - Adequate documentation with notable gaps
- **Poor (30-49%)** - Minimal documentation
- **Critical (<30%)** - Severely lacking documentation

## Quality Assessment

### Quality Metrics

1. **Structure Quality** - Header hierarchy, organization, navigation
2. **Content Quality** - Completeness, accuracy, examples
3. **Consistency** - Formatting, style, terminology
4. **Accessibility** - Alt text, semantic markup, readability
5. **Freshness** - Currency, maintenance, relevance

### Quality Scoring

```javascript
qualityScore = (
  structureScore * 0.25 +
  contentScore * 0.35 +
  consistencyScore * 0.20 +
  accessibilityScore * 0.10 +
  freshnessScore * 0.10
)
```

## Generation Opportunities

### API Documentation Generation

- **OpenAPI/Swagger** - Generate from API specifications
- **JSDoc/TypeDoc** - Extract from code comments
- **Route Analysis** - Discover endpoints from route definitions
- **Example Generation** - Create usage examples

### Code Documentation Generation

- **Function Documentation** - Generate from function signatures
- **Class Documentation** - Extract class and method information
- **Module Documentation** - Create module overviews
- **Type Documentation** - Document interfaces and types

### User Guide Generation

- **Getting Started** - Basic setup and first steps
- **Feature Guides** - Detailed feature explanations
- **Tutorials** - Step-by-step learning paths
- **Examples** - Code samples and use cases

## Integration with Other Plugins

### Repository Analyzer Integration

```bash
# Combined repository and documentation analysis
node src/cli/modular.js analyze --include-docs
```

### Quality Plugin Integration

```bash
# Documentation quality as part of overall code quality
node src/cli/modular.js quality analyze --include-docs
```

### CI/CD Integration

```yaml
# GitHub Actions workflow
- name: Documentation Analysis
  run: node src/cli/modular.js documentation analyze --output docs-analysis.json
  
- name: Generate Documentation Report
  run: node src/cli/modular.js documentation report --format html --output docs-report.html

- name: Upload Documentation Artifacts
  uses: actions/upload-artifact@v4
  with:
    name: documentation-analysis
    path: |
      docs-analysis.json
      docs-report.html
```

## Use Cases

### Team Onboarding

```bash
# Generate comprehensive documentation overview for new team members
node src/cli/modular.js documentation analyze --newcomer-friendly
node src/cli/modular.js documentation report --format html --include-getting-started
```

### Documentation Audit

```bash
# Comprehensive documentation audit
node src/cli/modular.js documentation analyze --comprehensive
node src/cli/modular.js documentation validate --strict
node src/cli/modular.js documentation report --format pdf --include-recommendations
```

### Content Management

```bash
# Organize and structure documentation
node src/cli/modular.js documentation organize --auto-categorize
node src/cli/modular.js documentation structure --create-navigation
```

### Automated Improvement

```bash
# Generate missing documentation
node src/cli/modular.js documentation generate --missing-only
node src/cli/modular.js documentation generate --type api --auto-examples
```

## Best Practices

### Documentation Organization

1. **Consistent Structure** - Use standard directory layouts and naming conventions
2. **Clear Hierarchy** - Organize by audience and complexity
3. **Navigation** - Provide clear paths through documentation
4. **Index Files** - Create comprehensive tables of contents

### Content Quality

1. **Clear Writing** - Use simple, direct language
2. **Examples** - Include practical, working examples
3. **Visual Aids** - Use diagrams, screenshots, and code blocks
4. **Maintenance** - Keep documentation current with code changes

### Integration

1. **CI/CD Integration** - Automate documentation checks and generation
2. **Code Reviews** - Include documentation in review process
3. **Version Control** - Track documentation changes with code
4. **Metrics** - Monitor documentation coverage and quality over time

## Troubleshooting

### Common Issues

#### Documentation Not Found
```bash
# Check scan directories
node src/cli/modular.js documentation analyze --verbose

# Verify directory configuration
node src/cli/modular.js config show | grep documentation
```

#### Low Quality Scores
```bash
# Detailed quality analysis
node src/cli/modular.js documentation quality --detailed

# Check specific files
node src/cli/modular.js documentation validate --file docs/README.md
```

#### Missing Dependencies
```bash
# Install optional dependencies for enhanced features
npm install markdown-it gray-matter jsdoc typedoc remark
```

### Performance Issues
```bash
# Reduce scan scope
export CLOI_DOCS_SCAN_DIRS="docs"

# Enable caching
export CLOI_DOCS_CACHE_ENABLED=true
```

### Debug Mode
```bash
# Enable verbose logging
export CLOI_DEBUG=true
node src/cli/modular.js documentation analyze
```

## Contributing

To contribute to the documentation analyzer:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Run the test suite: `node src/plugins/analyzers/documentation/test.js`
5. Submit a pull request

### Adding Format Support

```javascript
// Add to supported formats in plugin.json
"supportedFormats": ["new-format"]

// Implement format detection in index.js
isNewFormatFile(filePath) {
  return filePath.endsWith('.newformat');
}
```

### Adding Quality Checks

```javascript
// Implement new quality check
checkNewQualityMetric(content) {
  return {
    score: 0-100,
    issues: [],
    strengths: []
  };
}
```

## License

This plugin is part of the Cloi project and is licensed under GPL-3.0.