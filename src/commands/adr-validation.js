/**
 * ADR Validation Commands for CLOI CLI
 * 
 * Provides Architecture Decision Record validation, initialization,
 * and compliance checking integrated into the main CLOI binary.
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to import validation engine - will create a simpler version if not available
let ADRValidationEngine, ADRParser, ValidationEngine, ADRInitializer;

try {
  const validationModule = await import('../../scripts/validate-adr-compliance.js');
  ADRValidationEngine = validationModule.ADRValidationEngine;
  ADRParser = validationModule.ADRParser; 
  ValidationEngine = validationModule.ValidationEngine;
  ADRInitializer = validationModule.ADRInitializer;
} catch (error) {
  console.warn('Full ADR validation engine not available, using basic functionality');
}

/**
 * Validate ADR compliance
 */
export async function validateADRCompliance(argv) {
  console.log(chalk.cyan('🏛️  ADR Compliance Validator'));
  console.log(chalk.cyan('===========================\n'));

  if (!ADRValidationEngine) {
    return await basicADRValidation(argv);
  }

  try {
    const engine = new ADRValidationEngine();
    const result = await engine.validateArchitecture(
      argv.adrDir || 'docs/adr',
      argv.root || process.cwd()
    );

    if (argv.json) {
      console.log(JSON.stringify(result, null, 2));
      return result;
    }

    // Text output
    console.log(`📚 ADRs Processed: ${result.metadata.adrsProcessed}`);
    console.log(`⚖️  Constraints Validated: ${result.metadata.constraintsValidated}`);
    console.log(`⚠️  Violations Found: ${result.metadata.violationsFound}`);
    console.log(`📊 Compliance Rate: ${result.report.summary.complianceRate}%`);

    if (result.metadata.violationsFound > 0) {
      console.log(chalk.yellow('\n⚠️  Violations by Category:'));
      for (const [category, violations] of Object.entries(result.report.violations)) {
        console.log(`  ${chalk.red(category)}: ${violations.length}`);
      }

      if (argv.verbose) {
        console.log(chalk.yellow('\n📋 Detailed Violations:'));
        for (const [category, violations] of Object.entries(result.report.violations)) {
          console.log(chalk.red(`\n${category}:`));
          violations.forEach(v => {
            console.log(`  - ${v.description}`);
            if (v.path) console.log(`    Path: ${v.path}`);
            if (v.line) console.log(`    Line: ${v.line}`);
          });
        }
      }
    } else {
      console.log(chalk.green('\n✅ All architectural constraints satisfied!'));
    }

    // Exit with error code if violations found and in CI mode
    if (argv.ci && result.metadata.violationsFound > 0) {
      process.exit(1);
    }

    return result;
  } catch (error) {
    console.error(chalk.red('❌ ADR validation failed:'), error.message);
    if (argv.ci) {
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Initialize ADR structure in repository
 */
export async function initializeADRs(argv) {
  console.log(chalk.cyan('📁 ADR Structure Initialization'));
  console.log(chalk.cyan('================================\n'));

  if (!ADRInitializer) {
    return await basicADRInit(argv);
  }

  try {
    const initializer = new ADRInitializer();
    const parser = new ADRParser();
    
    // Check if ADRs already exist
    const adrInfra = await parser.checkADRInfrastructure(process.cwd());
    
    if (adrInfra.exists && !argv.force) {
      console.log(chalk.yellow(`📚 ADRs already exist at: ${adrInfra.path}`));
      console.log(chalk.yellow('Use --force to reinitialize\n'));
      
      if (argv.json) {
        console.log(JSON.stringify({ 
          status: 'exists', 
          path: adrInfra.path, 
          files: adrInfra.files 
        }, null, 2));
      }
      return;
    }

    const targetPath = argv.path || adrInfra.suggestedPath;
    await initializer.initializeADRStructure(process.cwd(), targetPath);
    
    console.log(chalk.green('\n🚀 Next steps:'));
    console.log(`   1. Create your first ADR: ${chalk.cyan('cloi adr create "Your First Decision"')}`);
    console.log(`   2. Validate compliance: ${chalk.cyan('cloi adr validate')}`);
    console.log(`   3. Learn more: ${chalk.cyan('cat docs/adr/README.md')}`);

    if (argv.json) {
      console.log(JSON.stringify({ 
        status: 'initialized', 
        path: targetPath 
      }, null, 2));
    }
  } catch (error) {
    console.error(chalk.red('❌ ADR initialization failed:'), error.message);
    if (argv.ci) {
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Suggest ADRs based on codebase analysis
 */
export async function suggestADRs(argv) {
  console.log(chalk.cyan('💡 ADR Suggestions'));
  console.log(chalk.cyan('==================\n'));

  if (!ADRInitializer) {
    console.log(chalk.yellow('Full analysis requires complete validation engine'));
    console.log('Run: npm install js-yaml glob');
    return;
  }

  try {
    const initializer = new ADRInitializer();
    
    console.log('🔍 Analyzing codebase...');
    const suggestions = await initializer.analyzeCodebaseForADRSuggestions(process.cwd());
    
    if (argv.ai && argv.aiSuggestions) {
      console.log('🤖 Generating AI-enhanced suggestions...');
      const enhanced = await initializer.generateAISuggestedADRs(process.cwd(), suggestions);
      
      if (argv.json) {
        console.log(JSON.stringify(enhanced, null, 2));
        return enhanced;
      }

      console.log(chalk.green('\n💡 Recommended ADRs for this project:\n'));
      enhanced.analysisResults?.forEach((suggestion, index) => {
        console.log(`${chalk.cyan(`${index + 1}.`)} ${chalk.bold(suggestion.title)} ${chalk.gray(`(${suggestion.priority})`)})`);
        console.log(`   ${chalk.gray('Reason:')} ${suggestion.reason}`);
        console.log(`   ${chalk.gray('Constraints:')} ${suggestion.constraints?.join(', ')}`);
        console.log();
      });

      if (enhanced.aiRecommendations) {
        console.log(chalk.magenta('🤖 AI Analysis:'));
        console.log(enhanced.aiRecommendations);
      }
    } else {
      if (argv.json) {
        console.log(JSON.stringify({ suggestions }, null, 2));
        return suggestions;
      }

      console.log(chalk.green('💡 Recommended ADRs for this project:\n'));
      suggestions.forEach((suggestion, index) => {
        console.log(`${chalk.cyan(`${index + 1}.`)} ${chalk.bold(suggestion.title)} ${chalk.gray(`(${suggestion.priority})`)}`);
        console.log(`   ${chalk.gray('Reason:')} ${suggestion.reason}`);
        console.log(`   ${chalk.gray('Constraints:')} ${suggestion.constraints?.join(', ')}`);
        console.log();
      });
    }

    console.log(chalk.cyan('\n🚀 Next steps:'));
    console.log(`   1. Initialize ADRs: ${chalk.cyan('cloi adr init')}`);
    console.log(`   2. Create specific ADRs based on suggestions`);
    console.log(`   3. Add validation metadata to enable compliance checking`);

  } catch (error) {
    console.error(chalk.red('❌ ADR suggestion failed:'), error.message);
    throw error;
  }
}

/**
 * Create a new ADR from template
 */
export async function createADR(argv) {
  console.log(chalk.cyan('📝 Create New ADR'));
  console.log(chalk.cyan('==================\n'));

  try {
    // Find ADR directory
    const parser = new ADRParser();
    const adrInfra = await parser.checkADRInfrastructure(process.cwd());
    
    if (!adrInfra.exists) {
      console.log(chalk.yellow('📋 No ADR infrastructure found'));
      console.log(`Initialize with: ${chalk.cyan('cloi adr init')}`);
      return;
    }

    // Find next ADR number
    const files = await fs.readdir(adrInfra.path);
    const adrFiles = files.filter(f => /^ADR-\d+/.test(f));
    const numbers = adrFiles.map(f => {
      const match = f.match(/^ADR-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const nextNumber = Math.max(0, ...numbers) + 1;
    const adrId = String(nextNumber).padStart(3, '0');

    // Create filename
    const title = argv.title || argv._[argv._.length - 1] || 'New Decision';
    const filename = `ADR-${adrId}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    const filepath = path.join(adrInfra.path, filename);

    // Read template
    const templatePath = path.join(adrInfra.path, 'ADR-000-template.md');
    let template;
    try {
      template = await fs.readFile(templatePath, 'utf-8');
    } catch {
      // Fallback template
      template = `---
adr_id: "ADR-${adrId}"
title: "${title}"
status: "Proposed"
date: "${new Date().toISOString().split('T')[0]}"
authors: ["${process.env.USER || 'Author'}"]
validation_metadata:
  constraints: []
  validation_scripts: []
---

# ADR-${adrId}: ${title}

**Status:** Proposed
**Date:** ${new Date().toISOString().split('T')[0]}

## Context and Problem Statement

[Describe the context and problem statement]

## Decision

[Describe the architectural decision]

## Consequences

### Positive
- [positive consequence]

### Negative  
- [negative consequence]
`;
    }

    // Customize template
    const customized = template
      .replace(/ADR-000/g, `ADR-${adrId}`)
      .replace(/ADR Template/g, title)
      .replace(/Your Name/g, process.env.USER || 'Author')
      .replace(/Template/g, 'Proposed');

    await fs.writeFile(filepath, customized);

    console.log(chalk.green(`✅ Created: ${filename}`));
    console.log(`📁 Location: ${filepath}`);
    console.log(`\n🚀 Next steps:`);
    console.log(`   1. Edit the ADR: ${chalk.cyan(`$EDITOR "${filepath}"`)}`);
    console.log(`   2. Validate: ${chalk.cyan('cloi adr validate')}`);

    if (argv.json) {
      console.log(JSON.stringify({ 
        file: filename, 
        path: filepath, 
        adrId: `ADR-${adrId}` 
      }, null, 2));
    }

  } catch (error) {
    console.error(chalk.red('❌ ADR creation failed:'), error.message);
    throw error;
  }
}

/**
 * Generate research document for validation failures
 */
export async function generateResearch(argv) {
  console.log(chalk.cyan('🔬 ADR Research Generation'));
  console.log(chalk.cyan('==========================\n'));

  if (!ADRValidationEngine) {
    console.log(chalk.yellow('Full research generation requires complete validation engine'));
    console.log('Run: npm install js-yaml glob ollama');
    return;
  }

  try {
    const engine = new ADRValidationEngine();
    const validationResults = await engine.validateArchitecture(
      argv.adrDir || 'docs/adr',
      argv.root || process.cwd()
    );

    const unrepaired = validationResults.report?.violations ? 
      Object.values(validationResults.report.violations).flat() : [];

    if (unrepaired.length === 0) {
      console.log(chalk.green('✅ No violations found - no research needed'));
      return;
    }

    console.log(`🔍 Found ${unrepaired.length} violations requiring investigation...`);
    
    // Force research generation using the validation script
    const { ResearchDocumentManager, ValidationEngine } = await import('../../scripts/validate-adr-compliance.js');
    const researchManager = new ResearchDocumentManager(process.cwd());
    const validator = new ValidationEngine();
    
    const research = await validator.generateResearchQuestions(unrepaired, validationResults.metadata?.adrs || []);
    
    if (research) {
      const { filepath } = await researchManager.saveResearchDocument(research, {
        includeGitHubTemplate: argv.github || argv.githubIssue,
        severity: argv.severity || 'high'
      });
      
      console.log(chalk.green(`✅ Research document created: ${filepath}`));
      
      if (argv.github || argv.githubIssue) {
        const issueResult = await researchManager.createGitHubIssue(research, { 
          dryRun: !process.env.GITHUB_TOKEN 
        });
        
        if (!issueResult.created) {
          console.log(chalk.yellow('📋 GitHub issue template included in research document'));
          console.log(chalk.gray('Set GITHUB_TOKEN environment variable for automatic issue creation'));
        }
      }
      
      console.log(chalk.cyan('\n🚀 Next steps:'));
      console.log(`   1. Review research document: ${filepath}`);
      console.log(`   2. Investigate the research questions`);
      console.log(`   3. Update ADRs if architectural decisions change`);
      console.log(`   4. Rerun validation after making changes`);
      
    } else {
      console.log(chalk.red('❌ Failed to generate research document'));
    }

  } catch (error) {
    console.error(chalk.red('❌ Research generation failed:'), error.message);
    if (argv.ci) {
      process.exit(1);
    }
    throw error;
  }
}

/**
 * List existing ADRs
 */
export async function listADRs(argv) {
  console.log(chalk.cyan('📚 Architecture Decision Records'));
  console.log(chalk.cyan('=================================\n'));

  try {
    const parser = new ADRParser();
    const adrInfra = await parser.checkADRInfrastructure(process.cwd());
    
    if (!adrInfra.exists) {
      console.log(chalk.yellow('📋 No ADRs found'));
      console.log(`Initialize with: ${chalk.cyan('cloi adr init')}`);
      return;
    }

    console.log(`📁 ADR Directory: ${adrInfra.path}\n`);

    if (ADRParser) {
      const adrs = await parser.parseADRDirectory(adrInfra.path);
      
      if (argv.json) {
        console.log(JSON.stringify({
          path: adrInfra.path,
          totalFiles: adrInfra.files.length,
          validationEnabled: adrs?.length || 0,
          adrs: adrs || []
        }, null, 2));
        return;
      }

      console.log(`📊 Total ADR files: ${adrInfra.files.length}`);
      console.log(`🔧 Validation-enabled: ${adrs?.length || 0}\n`);

      if (adrs && adrs.length > 0) {
        console.log(chalk.green('✅ ADRs with validation metadata:'));
        adrs.forEach(adr => {
          console.log(`   📄 ${chalk.cyan(adr.id)}: ${adr.title}`);
          if (argv.verbose && adr.validationMetadata?.constraints) {
            console.log(`      Constraints: ${adr.validationMetadata.constraints.length}`);
          }
        });
      }

      const unvalidated = adrInfra.files.filter(f => 
        !adrs?.some(adr => path.basename(adr.filePath) === f)
      );

      if (unvalidated.length > 0) {
        console.log(chalk.yellow('\n⚠️  ADRs without validation metadata:'));
        unvalidated.forEach(file => {
          console.log(`   📄 ${chalk.gray(file)}`);
        });
      }
    } else {
      console.log(`📊 Found ${adrInfra.files.length} ADR files:`);
      adrInfra.files.forEach(file => {
        console.log(`   📄 ${file}`);
      });
    }

  } catch (error) {
    console.error(chalk.red('❌ Failed to list ADRs:'), error.message);
    throw error;
  }
}

/**
 * Basic ADR validation when full engine isn't available
 */
async function basicADRValidation(argv) {
  console.log(chalk.yellow('⚠️  Using basic validation mode'));
  console.log('For full validation, ensure js-yaml and glob are installed\n');

  try {
    const adrDir = argv.adrDir || path.join(process.cwd(), 'docs', 'adr');
    const files = await fs.readdir(adrDir);
    const adrFiles = files.filter(f => /^ADR-\d+-.*\.md$/.test(f));

    console.log(`📚 Found ${adrFiles.length} ADR files in ${adrDir}`);
    
    if (argv.json) {
      console.log(JSON.stringify({ 
        status: 'basic', 
        adrDir, 
        count: adrFiles.length, 
        files: adrFiles 
      }, null, 2));
    } else {
      adrFiles.forEach(file => console.log(`   📄 ${file}`));
      console.log(`\n💡 For automated validation:`);
      console.log(`   npm install js-yaml glob`);
    }
  } catch (error) {
    console.log(chalk.yellow(`📋 No ADR directory found at expected locations`));
    console.log(`Initialize with: ${chalk.cyan('cloi adr init')}`);
  }
}

/**
 * Basic ADR initialization when full engine isn't available
 */
async function basicADRInit(argv) {
  const targetPath = argv.path || path.join(process.cwd(), 'docs', 'adr');
  
  try {
    await fs.mkdir(targetPath, { recursive: true });
    
    const readme = `# Architecture Decision Records

This directory contains the Architecture Decision Records for this project.

## Usage

- Create ADRs: \`cloi adr create "Decision Title"\`
- List ADRs: \`cloi adr list\`
- Validate: \`cloi adr validate\`

For full validation features, install: \`npm install js-yaml glob\`
`;

    await fs.writeFile(path.join(targetPath, 'README.md'), readme);
    
    console.log(chalk.green(`✅ Basic ADR structure created at ${targetPath}`));
    console.log(`📄 README.md created`);
    console.log(`\n💡 For full features: npm install js-yaml glob`);
    
  } catch (error) {
    console.error(chalk.red('❌ Basic initialization failed:'), error.message);
    throw error;
  }
}