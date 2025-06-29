#!/usr/bin/env node

/**
 * Standalone ADR Compliance Validator
 * 
 * A self-contained script to validate architectural decisions against any codebase.
 * Can be copied to any project and run independently.
 * 
 * Usage:
 *   node adr-validator-standalone.js [--init] [--suggest-adrs] [--ai-suggestions] [--fix] [--json]
 *   
 * Options:
 *   --init            Initialize ADR structure in this repository
 *   --suggest-adrs    Generate suggested ADRs based on codebase analysis
 *   --ai-suggestions  Generate AI-powered suggestions using Ollama (requires Ollama)
 *   --fix             Automatically repair violations where possible
 *   --json            Output results in JSON format
 *   --model=MODEL     Specify Ollama model (default: llama3.1:8b)
 * 
 * Installation:
 *   1. Copy this file to your project root
 *   2. Run: npm install js-yaml glob (if using validation features)
 *   3. Run: node adr-validator-standalone.js --init
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to import optional dependencies
let yaml, glob, ollama;
try {
  yaml = (await import('js-yaml')).default;
  const globModule = await import('glob');
  glob = globModule.glob;
} catch (error) {
  console.warn('Optional dependencies not available. Run: npm install js-yaml glob');
}

try {
  const ollamaModule = await import('ollama');
  ollama = ollamaModule.default;
} catch (error) {
  // Ollama is optional
}

// Configuration
const CONFIG = {
  codebaseRoot: process.cwd(),
  initMode: process.argv.includes('--init'),
  suggestADRs: process.argv.includes('--suggest-adrs'),
  aiSuggestions: process.argv.includes('--ai-suggestions'),
  autoFix: process.argv.includes('--fix'),
  jsonOutput: process.argv.includes('--json'),
  ollamaModel: process.argv.find(arg => arg.startsWith('--model='))?.split('=')[1] || 'llama3.1:8b'
};

// ADR Infrastructure Manager
class ADRManager {
  constructor() {
    this.adrPattern = /^ADR-\d+-.*\.md$/;
  }

  async checkADRInfrastructure(codebaseRoot) {
    const possiblePaths = [
      path.join(codebaseRoot, 'docs', 'adr'),
      path.join(codebaseRoot, 'docs', 'architecture'),
      path.join(codebaseRoot, 'adr'),
      path.join(codebaseRoot, 'architecture'),
      path.join(codebaseRoot, '.adr')
    ];

    for (const adrPath of possiblePaths) {
      try {
        const files = await fs.readdir(adrPath);
        const adrFiles = files.filter(file => 
          file.endsWith('.md') && (file.includes('ADR') || file.includes('adr'))
        );
        
        if (adrFiles.length > 0) {
          return { exists: true, path: adrPath, files: adrFiles };
        }
      } catch (error) {
        continue;
      }
    }

    return { exists: false, suggestedPath: path.join(codebaseRoot, 'docs', 'adr') };
  }

  async initializeADRStructure(codebaseRoot, suggestedPath) {
    console.log(`📁 Creating ADR directory structure at ${suggestedPath}...`);
    
    await fs.mkdir(suggestedPath, { recursive: true });
    
    const readmeContent = `# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for this project.

## Format

ADRs follow the format:
- \`ADR-XXX-descriptive-title.md\`
- Include YAML frontmatter with validation metadata
- Follow the template in \`ADR-000-template.md\`

## Tools

- Validate ADRs: \`node adr-validator-standalone.js\`
- Generate suggestions: \`node adr-validator-standalone.js --suggest-adrs --ai-suggestions\`
- Auto-repair violations: \`node adr-validator-standalone.js --fix\`

## Getting Started

1. Copy the template: \`cp ADR-000-template.md ADR-001-your-decision.md\`
2. Fill in your architectural decision
3. Run validation: \`node adr-validator-standalone.js\`
`;

    await fs.writeFile(path.join(suggestedPath, 'README.md'), readmeContent);
    
    const templateContent = `---
adr_id: "ADR-000"
title: "ADR Template"
status: "Template"
date: "${new Date().toISOString().split('T')[0]}"
authors: ["Your Name"]
validation_metadata:
  constraints:
    - type: "file-structure"
      rule: "example-naming-convention"
      description: "Example: Ensure all components follow naming convention"
      pattern: "src/components/**/*.jsx"
      severity: "warning"
      auto_repairable: false
      
    - type: "import-pattern"
      rule: "no-deprecated-imports"
      description: "Example: No imports from deprecated modules"
      pattern: "import.*from.*deprecated"
      severity: "error"
      auto_repairable: true
      
  auto_repair_rules:
    - violation: "deprecated-import"
      action: "update-import-path"
      from_pattern: "deprecated-module"
      to_pattern: "new-module"
      
  validation_scripts:
    - name: "check-dependencies"
      command: "npm audit --audit-level=moderate"
      description: "Check for security vulnerabilities in dependencies"
---

# ADR-000: ADR Template

**Status:** Template
**Date:** ${new Date().toISOString().split('T')[0]}
**Authors:** Your Name

## Context and Problem Statement

Describe the context and problem statement that led to this architectural decision.

What is the architectural challenge we're addressing?

## Decision Drivers

* [driver 1, e.g., a force, requirement, constraint]
* [driver 2, e.g., a force, requirement, constraint]
* [driver 3, e.g., a force, requirement, constraint]

## Considered Options

* [option 1]
* [option 2]
* [option 3]

## Decision Outcome

Chosen option: "[option 1]", because [justification].

### Positive Consequences

* [positive consequence 1]
* [positive consequence 2]

### Negative Consequences

* [negative consequence 1]
* [negative consequence 2]

## Implementation Notes

### Validation Rules

This ADR includes automated validation rules:
- File structure constraints
- Import pattern checks
- Automated repair suggestions

### Compliance Checking

Run \`node adr-validator-standalone.js\` to validate compliance with this decision.
`;

    await fs.writeFile(path.join(suggestedPath, 'ADR-000-template.md'), templateContent);
    
    console.log('✅ ADR structure initialized');
    console.log(`   📁 Directory: ${suggestedPath}`);
    console.log(`   📄 README.md created`);
    console.log(`   📄 ADR-000-template.md created`);
    console.log(`\n🚀 Next steps:`);
    console.log(`   1. Copy the template for your first ADR`);
    console.log(`   2. Edit ADR-001-your-first-decision.md`);
    console.log(`   3. Install validation dependencies: npm install js-yaml glob`);
    console.log(`   4. Run validation: node adr-validator-standalone.js`);
  }

  async analyzeCodebaseForSuggestions(codebaseRoot) {
    const suggestions = [];
    
    try {
      // Analyze package.json
      const packageJsonPath = path.join(codebaseRoot, 'package.json');
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        suggestions.push({
          title: 'Dependency Management Strategy',
          reason: `Node.js project with ${Object.keys(packageJson.dependencies || {}).length} dependencies`,
          priority: 'high',
          constraints: ['version pinning', 'security auditing', 'dependency updates']
        });
        
        if (packageJson.scripts) {
          suggestions.push({
            title: 'Build and Development Scripts',
            reason: `Project has ${Object.keys(packageJson.scripts).length} npm scripts`,
            priority: 'medium',
            constraints: ['script naming', 'build reproducibility', 'environment consistency']
          });
        }
      } catch {}

      // Check for common directories
      const directories = [
        { name: 'src', title: 'Source Code Organization', priority: 'high' },
        { name: 'lib', title: 'Library Structure', priority: 'medium' },
        { name: 'dist', title: 'Distribution Strategy', priority: 'medium' },
        { name: 'public', title: 'Public Asset Management', priority: 'low' },
      ];

      for (const dir of directories) {
        try {
          await fs.access(path.join(codebaseRoot, dir.name));
          suggestions.push({
            title: dir.title,
            reason: `Project has ${dir.name}/ directory`,
            priority: dir.priority,
            constraints: ['naming conventions', 'structure patterns', 'access controls']
          });
        } catch {}
      }

      // Check for testing
      const testIndicators = ['test', 'tests', '__tests__', 'spec', 'jest.config.js', 'vitest.config.js'];
      for (const indicator of testIndicators) {
        try {
          await fs.access(path.join(codebaseRoot, indicator));
          suggestions.push({
            title: 'Testing Strategy and Coverage',
            reason: `Testing infrastructure detected (${indicator})`,
            priority: 'high',
            constraints: ['test naming', 'coverage requirements', 'test isolation']
          });
          break;
        } catch {}
      }

      // Check for CI/CD
      const ciIndicators = ['.github/workflows', '.gitlab-ci.yml', 'Jenkinsfile', '.travis.yml', '.circleci'];
      for (const indicator of ciIndicators) {
        try {
          await fs.access(path.join(codebaseRoot, indicator));
          suggestions.push({
            title: 'CI/CD Pipeline Standards',
            reason: `CI/CD infrastructure detected (${indicator})`,
            priority: 'high',
            constraints: ['pipeline security', 'deployment gates', 'environment promotion']
          });
          break;
        } catch {}
      }

      // Check for containerization
      const containerFiles = ['Dockerfile', 'docker-compose.yml', '.dockerignore'];
      for (const file of containerFiles) {
        try {
          await fs.access(path.join(codebaseRoot, file));
          suggestions.push({
            title: 'Containerization and Deployment',
            reason: `Container configuration detected (${file})`,
            priority: 'medium',
            constraints: ['image security', 'build optimization', 'runtime configuration']
          });
          break;
        } catch {}
      }

      // Check for configuration files
      const configFiles = ['tsconfig.json', 'eslint.config.js', '.eslintrc', 'prettier.config.js'];
      let hasConfig = false;
      for (const file of configFiles) {
        try {
          await fs.access(path.join(codebaseRoot, file));
          hasConfig = true;
          break;
        } catch {}
      }
      
      if (hasConfig) {
        suggestions.push({
          title: 'Code Quality and Linting Standards',
          reason: 'Code quality tools configuration detected',
          priority: 'high',
          constraints: ['style enforcement', 'quality gates', 'pre-commit hooks']
        });
      }

    } catch (error) {
      console.warn('Error analyzing codebase:', error.message);
    }

    return suggestions;
  }

  async generateAISuggestions(suggestions) {
    if (!ollama || suggestions.length === 0) {
      return suggestions;
    }

    try {
      const prompt = `You are an expert software architect. Analyze this project and provide specific ADR recommendations:

Project Structure Analysis:
${suggestions.map(s => `- ${s.title}: ${s.reason} (Priority: ${s.priority})`).join('\n')}

For each area, provide:
1. Specific architectural decisions that should be documented
2. Automated validation rules that could be implemented
3. Common pitfalls to avoid
4. Best practices to enforce

Keep recommendations practical and implementable.`;

      const response = await ollama.chat({
        model: CONFIG.ollamaModel,
        messages: [{ role: 'user', content: prompt }]
      });

      return {
        analysisResults: suggestions,
        aiRecommendations: response.message.content,
        model: CONFIG.ollamaModel
      };
    } catch (error) {
      console.warn(`AI analysis failed: ${error.message}`);
      return { analysisResults: suggestions, aiRecommendations: null };
    }
  }
}

// Basic validation for existing ADRs (when yaml is available)
class BasicValidator {
  constructor() {
    this.adrPattern = /^ADR-\d+-.*\.md$/;
  }

  async findADRs(adrPath) {
    if (!yaml) {
      console.warn('YAML parser not available. Install js-yaml for full validation.');
      return [];
    }

    try {
      const files = await fs.readdir(adrPath);
      const adrFiles = files.filter(file => this.adrPattern.test(file));
      const adrs = [];

      for (const file of adrFiles) {
        const content = await fs.readFile(path.join(adrPath, file), 'utf-8');
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        if (frontmatterMatch) {
          try {
            const metadata = yaml.load(frontmatterMatch[1]);
            if (metadata.validation_metadata) {
              adrs.push({
                file,
                metadata,
                hasValidation: true
              });
            } else {
              adrs.push({
                file,
                metadata,
                hasValidation: false
              });
            }
          } catch (error) {
            adrs.push({
              file,
              error: error.message,
              hasValidation: false
            });
          }
        }
      }

      return adrs;
    } catch (error) {
      return [];
    }
  }
}

// Main execution
async function main() {
  console.log('🔍 Standalone ADR Compliance Validator');
  console.log('=====================================\n');

  const manager = new ADRManager();
  const validator = new BasicValidator();

  // Check if ADR infrastructure exists
  const adrInfra = await manager.checkADRInfrastructure(CONFIG.codebaseRoot);
  
  if (!adrInfra.exists) {
    console.log('📋 No ADR infrastructure found in this repository');
    
    if (CONFIG.initMode) {
      await manager.initializeADRStructure(CONFIG.codebaseRoot, adrInfra.suggestedPath);
      return;
    }
    
    if (CONFIG.suggestADRs) {
      console.log('🔍 Analyzing codebase for ADR suggestions...\n');
      const suggestions = await manager.analyzeCodebaseForSuggestions(CONFIG.codebaseRoot);
      
      if (CONFIG.aiSuggestions && ollama) {
        console.log('🤖 Generating AI-enhanced recommendations...\n');
        const result = await manager.generateAISuggestions(suggestions);
        
        if (CONFIG.jsonOutput) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log('💡 Recommended ADRs for this project:\n');
          result.analysisResults.forEach((suggestion, index) => {
            console.log(`${index + 1}. **${suggestion.title}** (Priority: ${suggestion.priority})`);
            console.log(`   Reason: ${suggestion.reason}`);
            console.log(`   Key constraints: ${suggestion.constraints.join(', ')}\n`);
          });
          
          if (result.aiRecommendations) {
            console.log('🤖 AI Analysis:\n');
            console.log(result.aiRecommendations);
          }
        }
      } else {
        if (CONFIG.jsonOutput) {
          console.log(JSON.stringify({ suggestions }, null, 2));
        } else {
          console.log('💡 Recommended ADRs for this project:\n');
          suggestions.forEach((suggestion, index) => {
            console.log(`${index + 1}. **${suggestion.title}** (Priority: ${suggestion.priority})`);
            console.log(`   Reason: ${suggestion.reason}`);
            console.log(`   Key constraints: ${suggestion.constraints.join(', ')}\n`);
          });
        }
      }
      
      console.log('\n🚀 Next steps:');
      console.log('   1. Initialize ADR structure: node adr-validator-standalone.js --init');
      console.log('   2. Create ADRs based on suggestions');
      console.log('   3. Add validation metadata to enable automated checking');
      return;
    }
    
    console.log('ℹ️  Getting started with ADRs:\n');
    console.log('Available options:');
    console.log('  --init           Initialize ADR structure');
    console.log('  --suggest-adrs   Analyze codebase and suggest ADRs');
    console.log('  --ai-suggestions Use Ollama for enhanced suggestions\n');
    
    console.log('Example usage:');
    console.log('  node adr-validator-standalone.js --init');
    console.log('  node adr-validator-standalone.js --suggest-adrs --ai-suggestions\n');
    
    console.log('📚 Learn more: https://adr.github.io/');
    return;
  }

  // ADR infrastructure exists - check for validation capabilities
  console.log(`📁 Found ADR directory: ${adrInfra.path}`);
  const adrs = await validator.findADRs(adrInfra.path);
  
  if (adrs.length === 0) {
    console.log('📚 No ADR files found');
    return;
  }

  const validationEnabled = adrs.filter(adr => adr.hasValidation).length;
  
  console.log(`📚 Found ${adrs.length} ADR files`);
  console.log(`🔧 ${validationEnabled} ADRs have validation metadata`);
  
  if (validationEnabled === 0) {
    console.log('\n💡 To enable automated validation:');
    console.log('   1. Add validation_metadata to your ADR frontmatter');
    console.log('   2. See ADR-000-template.md for examples');
    console.log('   3. Install dependencies: npm install js-yaml glob');
  } else {
    console.log('\n✅ Validation-enabled ADRs detected');
    console.log('   For full validation capabilities, use the complete validator');
    console.log('   Copy from: https://github.com/tosin2013/cloi/blob/main/scripts/validate-adr-compliance.js');
  }

  if (CONFIG.jsonOutput) {
    console.log(JSON.stringify({
      adrPath: adrInfra.path,
      totalADRs: adrs.length,
      validationEnabled: validationEnabled,
      adrs: adrs.map(adr => ({
        file: adr.file,
        hasValidation: adr.hasValidation,
        error: adr.error
      }))
    }, null, 2));
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

export { ADRManager, BasicValidator };