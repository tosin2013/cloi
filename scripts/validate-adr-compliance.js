#!/usr/bin/env node

/**
 * ADR Compliance Validator - Comprehensive Architectural Governance Engine
 * 
 * Validates architectural decisions against the codebase using CLI governance gateway pattern.
 * Supports multi-domain validation across Plugin System, Workflow Engine, Configuration Hierarchy.
 * 
 * Usage:
 *   node scripts/validate-adr-compliance.js [OPTIONS]
 *   
 * Core Options:
 *   --fix             Automatically repair violations where possible
 *   --json            Output results in JSON format
 *   --ai-suggestions  Generate AI-powered repair suggestions using Ollama
 *   --model=MODEL     Specify Ollama model (default: llama3.1:8b)
 *   
 * Comprehensive Governance:
 *   --command-review           Enable CLI command review validation
 *   --cross-domain            Validate coordination across all domains
 *   --plugin-compliance       Check plugin API contract adherence (ADR-011)
 *   --workflow-validation     Validate workflow engine orchestration (ADR-012)
 *   --config-hierarchy        Check configuration precedence rules (ADR-013)
 *   --error-analysis          Analyze errors for architectural violations
 *   --metadata-file=FILE      Use external validation metadata
 *   
 * Research Generation:
 *   --research        Force generation of research document
 *   --research-threshold=N  Generate research when N+ violations (default: 3)
 *   --github-issue    Generate GitHub issue template
 *   --severity=LEVEL  Research document severity (low|medium|high)
 *   
 * Repository Setup:
 *   --init            Initialize ADR structure in repository without ADRs
 *   --suggest-adrs    Generate suggested ADRs based on codebase analysis
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import glob from 'glob';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const globAsync = promisify(glob);

// Try to import Ollama for AI-powered suggestions (optional)
let ollama;
try {
  const ollamaModule = await import('ollama');
  ollama = ollamaModule.default;
} catch (error) {
  console.warn('Ollama not available - AI-powered suggestions disabled');
}

// Configuration
const CONFIG = {
  adrDirectory: null, // Will be determined dynamically
  codebaseRoot: process.cwd(), // Use current working directory by default
  autoFix: process.argv.includes('--fix'),
  jsonOutput: process.argv.includes('--json'),
  aiSuggestions: process.argv.includes('--ai-suggestions'),
  ollamaModel: process.argv.find(arg => arg.startsWith('--model='))?.split('=')[1] || 'llama3.1:8b',
  initMode: process.argv.includes('--init'),
  suggestADRs: process.argv.includes('--suggest-adrs'),
  
  // Comprehensive governance options
  commandReview: process.argv.includes('--command-review'),
  crossDomain: process.argv.includes('--cross-domain'),
  pluginCompliance: process.argv.includes('--plugin-compliance'),
  workflowValidation: process.argv.includes('--workflow-validation'),
  configHierarchy: process.argv.includes('--config-hierarchy'),
  errorAnalysis: process.argv.find(arg => arg.startsWith('--error-analysis='))?.split('=')[1],
  metadataFile: process.argv.find(arg => arg.startsWith('--metadata-file='))?.split('=')[1],
  
  // Research generation options
  generateResearch: process.argv.includes('--research'),
  researchThreshold: parseInt(process.argv.find(arg => arg.startsWith('--research-threshold='))?.split('=')[1]) || 3,
  createGitHubIssue: process.argv.includes('--github-issue'),
  researchSeverity: process.argv.find(arg => arg.startsWith('--severity='))?.split('=')[1] || 'high'
};

// ADR Parser
class ADRParser {
  constructor() {
    this.adrPattern = /^ADR-\d+-.*\.md$/;
  }

  async parseADRDirectory(directory) {
    try {
      const files = await fs.readdir(directory);
      const adrFiles = files.filter(file => this.adrPattern.test(file));
      const adrs = [];

      for (const file of adrFiles) {
        const adr = await this.parseADRFile(path.join(directory, file));
        if (adr && adr.validationMetadata) {
          adrs.push(adr);
        }
      }

      return adrs;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // Directory doesn't exist
      }
      throw error;
    }
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
        // Directory doesn't exist, continue checking
        continue;
      }
    }

    return { exists: false, suggestedPath: path.join(codebaseRoot, 'docs', 'adr') };
  }

  async parseADRFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    
    if (!frontmatterMatch) return null;

    try {
      const metadata = yaml.load(frontmatterMatch[1]);
      if (metadata.validation_metadata) {
        return {
          id: path.basename(filePath, '.md'),
          title: metadata.title || 'Unknown ADR',
          validationMetadata: metadata.validation_metadata,
          filePath
        };
      }
    } catch (error) {
      console.warn(`Failed to parse YAML in ${filePath}: ${error.message}`);
    }

    return null;
  }
}

// Validation Engine
class ValidationEngine {
  constructor(autoFix = false) {
    this.autoFix = autoFix;
    this.violations = [];
    this.repairs = [];
  }

  async validateADRs(adrs) {
    for (const adr of adrs) {
      await this.validateADR(adr);
    }

    return {
      violations: this.violations,
      repairs: this.repairs,
      summary: {
        totalADRs: adrs.length,
        totalViolations: this.violations.length,
        autoRepaired: this.repairs.length
      }
    };
  }

  async validateADR(adr) {
    const { constraints = [] } = adr.validationMetadata;

    for (const constraint of constraints) {
      switch (constraint.type) {
        case 'file-structure':
          await this.validateFileStructure(constraint, adr);
          break;
        case 'import-pattern':
          await this.validateImportPattern(constraint, adr);
          break;
        case 'plugin-contract':
          await this.validatePluginContract(constraint, adr);
          break;
        case 'workflow-orchestration':
          await this.validateWorkflowOrchestration(constraint, adr);
          break;
        case 'configuration-hierarchy':
          await this.validateConfigurationHierarchy(constraint, adr);
          break;
        case 'cli-command-pattern':
          await this.validateCLICommandPattern(constraint, adr);
          break;
        case 'resource-management':
          await this.validateResourceManagement(constraint, adr);
          break;
        // Add more constraint types as needed
      }
    }

    // Run comprehensive governance checks if enabled
    if (CONFIG.commandReview) {
      await this.runCommandReviewValidation(adr);
    }
    
    if (CONFIG.crossDomain) {
      await this.runCrossDomainValidation(adr);
    }
    
    if (CONFIG.pluginCompliance) {
      await this.runPluginComplianceValidation(adr);
    }
    
    if (CONFIG.workflowValidation) {
      await this.runWorkflowValidation(adr);
    }
    
    if (CONFIG.configHierarchy) {
      await this.runConfigHierarchyValidation(adr);
    }
    
    if (CONFIG.errorAnalysis) {
      await this.runErrorAnalysisValidation(CONFIG.errorAnalysis, adr);
    }
  }

  async validateFileStructure(constraint, adr) {
    if (constraint.rule === 'cli-modules-must-use-index-js') {
      const cliPath = path.join(CONFIG.codebaseRoot, 'src', 'cli');
      
      try {
        const entries = await fs.readdir(cliPath, { withFileTypes: true });
        const directories = entries.filter(entry => entry.isDirectory());

        for (const dir of directories) {
          const dirPath = path.join(cliPath, dir.name);
          const indexPath = path.join(dirPath, 'index.js');
          
          try {
            await fs.access(indexPath);
          } catch {
            const violation = {
              adrId: adr.id,
              rule: constraint.rule,
              path: dirPath,
              description: `CLI module ${dir.name} missing index.js entry point`,
              severity: constraint.severity || 'error',
              autoRepairable: constraint.auto_repairable
            };

            this.violations.push(violation);

            if (this.autoFix && constraint.auto_repairable) {
              await this.repairMissingIndex(dirPath);
              this.repairs.push(violation);
            }
          }
        }
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  }

  async validateImportPattern(constraint, adr) {
    if (constraint.rule === 'no-unified-js-references') {
      const pattern = '**/src/**/*.js';
      const files = await globAsync(pattern, { cwd: CONFIG.codebaseRoot });

      for (const file of files) {
        const filePath = path.join(CONFIG.codebaseRoot, file);
        const content = await fs.readFile(filePath, 'utf-8');

        if (content.includes('unified.js')) {
          const lines = content.split('\n');
          const violations = [];

          lines.forEach((line, index) => {
            if (line.includes('unified.js')) {
              violations.push({
                adrId: adr.id,
                rule: constraint.rule,
                path: filePath,
                line: index + 1,
                description: `Reference to deprecated unified.js found`,
                severity: constraint.severity || 'error',
                autoRepairable: constraint.auto_repairable
              });
            }
          });

          this.violations.push(...violations);

          if (this.autoFix && constraint.auto_repairable && violations.length > 0) {
            await this.repairUnifiedReferences(filePath);
            this.repairs.push(...violations);
          }
        }
      }
    }
  }

  async repairMissingIndex(dirPath) {
    const indexPath = path.join(dirPath, 'index.js');
    const unifiedPath = path.join(dirPath, 'unified.js');

    try {
      // Check if unified.js exists to rename it
      await fs.access(unifiedPath);
      await fs.rename(unifiedPath, indexPath);
      console.log(`✅ Renamed unified.js to index.js in ${dirPath}`);
    } catch {
      // Create a basic index.js
      const content = `// Auto-generated index.js entry point
export default {
  // TODO: Add module exports
};
`;
      await fs.writeFile(indexPath, content, 'utf-8');
      console.log(`✅ Created index.js in ${dirPath}`);
    }
  }

  async repairUnifiedReferences(filePath) {
    let content = await fs.readFile(filePath, 'utf-8');
    content = content.replace(/unified\.js/g, 'index.js');
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`✅ Updated imports in ${filePath}`);
  }

  // ==================== COMPREHENSIVE GOVERNANCE VALIDATION METHODS ====================

  async runCommandReviewValidation(adr) {
    console.log(`Running command review validation for ${adr.id}...`);
    
    // CLI governance gateway validation
    await this.validateCLIGovernanceGateway();
    
    // Command registry consistency
    await this.validateCommandRegistryConsistency();
    
    // Session management integrity
    await this.validateSessionManagementIntegrity();
  }

  async runCrossDomainValidation(adr) {
    console.log(`Running cross-domain validation for ${adr.id}...`);
    
    // Domain boundary enforcement
    await this.validateDomainBoundaries();
    
    // Integration point consistency
    await this.validateIntegrationPoints();
    
    // Resource coordination
    await this.validateResourceCoordination();
  }

  async runPluginComplianceValidation(adr) {
    console.log(`Running plugin compliance validation for ${adr.id}...`);
    
    // Plugin API contract adherence (ADR-011)
    await this.validatePluginAPIContracts();
    
    // Plugin discovery mechanism (ADR-010)
    await this.validatePluginDiscoveryMechanism();
    
    // Plugin lifecycle management
    await this.validatePluginLifecycleManagement();
  }

  async runWorkflowValidation(adr) {
    console.log(`Running workflow validation for ${adr.id}...`);
    
    // Workflow engine orchestration (ADR-012)
    await this.validateWorkflowEngineOrchestration();
    
    // Step executor consistency
    await this.validateStepExecutorConsistency();
    
    // Rollback mechanism integrity
    await this.validateRollbackMechanismIntegrity();
  }

  async runConfigHierarchyValidation(adr) {
    console.log(`Running configuration hierarchy validation for ${adr.id}...`);
    
    // Configuration precedence rules (ADR-013)
    await this.validateConfigurationPrecedence();
    
    // Environment context detection
    await this.validateEnvironmentContextDetection();
    
    // Context-aware configuration resolution
    await this.validateContextAwareConfiguration();
  }

  async runErrorAnalysisValidation(errorOutput, adr) {
    console.log(`Running error analysis validation for ${adr.id}...`);
    
    // Parse error output for architectural violations
    const violations = await this.parseArchitecturalViolations(errorOutput);
    
    // Check against ADR constraints
    for (const violation of violations) {
      await this.validateViolationAgainstADR(violation, adr);
    }
  }

  async validateCLIGovernanceGateway() {
    // Validate unified CLI architecture (ADR-001)
    const cliPath = path.join(CONFIG.codebaseRoot, 'src', 'cli', 'index.js');
    
    try {
      await fs.access(cliPath);
      console.log('✅ CLI governance gateway exists');
    } catch {
      this.violations.push({
        type: 'cli-governance',
        severity: 'error',
        message: 'CLI governance gateway not found',
        file: cliPath,
        adr: 'ADR-001'
      });
    }
  }

  async validatePluginAPIContracts() {
    // Validate plugin.json files across all plugins
    const pluginPaths = [
      path.join(CONFIG.codebaseRoot, 'src', 'plugins', 'analyzers'),
      path.join(CONFIG.codebaseRoot, 'src', 'plugins', 'integrations'),
      path.join(CONFIG.codebaseRoot, 'src', 'plugins', 'providers'),
      path.join(CONFIG.codebaseRoot, 'src', 'plugins', 'quality')
    ];

    for (const pluginDir of pluginPaths) {
      try {
        const entries = await fs.readdir(pluginDir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const pluginJsonPath = path.join(pluginDir, entry.name, 'plugin.json');
            
            try {
              const pluginData = JSON.parse(await fs.readFile(pluginJsonPath, 'utf-8'));
              await this.validatePluginMetadata(pluginData, pluginJsonPath);
            } catch (error) {
              this.violations.push({
                type: 'plugin-contract',
                severity: 'error',
                message: `Invalid plugin.json: ${error.message}`,
                file: pluginJsonPath,
                adr: 'ADR-011'
              });
            }
          }
        }
      } catch (error) {
        // Plugin directory might not exist
      }
    }
  }

  async validatePluginMetadata(pluginData, filePath) {
    const requiredFields = ['name', 'version', 'type', 'main', 'cloi'];
    
    for (const field of requiredFields) {
      if (!pluginData[field]) {
        this.violations.push({
          type: 'plugin-contract',
          severity: 'error',
          message: `Missing required field: ${field}`,
          file: filePath,
          adr: 'ADR-011'
        });
      }
    }

    // Validate plugin type
    const validTypes = ['analyzers', 'integrations', 'providers', 'quality'];
    if (!validTypes.includes(pluginData.type)) {
      this.violations.push({
        type: 'plugin-contract',
        severity: 'warning',
        message: `Invalid plugin type: ${pluginData.type}`,
        file: filePath,
        adr: 'ADR-011'
      });
    }
  }

  async validateResourceCoordination() {
    // Check for resource management patterns like A2A port conflicts
    if (CONFIG.errorAnalysis && CONFIG.errorAnalysis.includes('EADDRINUSE')) {
      const portMatch = CONFIG.errorAnalysis.match(/port.*?(\d+)/);
      if (portMatch) {
        this.violations.push({
          type: 'resource-management',
          severity: 'error',
          message: `Port conflict detected on port ${portMatch[1]}`,
          details: 'A2A server lacks dynamic port allocation',
          adr: 'ADR-002'
        });
      }
    }
  }

  async parseArchitecturalViolations(errorOutput) {
    const violations = [];
    
    // A2A Port conflicts
    if (errorOutput.includes('EADDRINUSE')) {
      violations.push({
        type: 'port_management',
        pattern: 'EADDRINUSE.*port.*\\d+',
        message: 'Port allocation conflict detected',
        adr: 'ADR-002'
      });
    }
    
    // Import pattern violations
    if (errorOutput.includes('unified.js')) {
      violations.push({
        type: 'import_pattern',
        pattern: 'unified\\.js',
        message: 'Deprecated unified.js import detected',
        adr: 'ADR-003'
      });
    }
    
    // Plugin loading errors
    if (errorOutput.includes('plugin') && errorOutput.includes('not found')) {
      violations.push({
        type: 'plugin_discovery',
        pattern: 'plugin.*not found',
        message: 'Plugin discovery mechanism failure',
        adr: 'ADR-010'
      });
    }
    
    return violations;
  }

  async validateViolationAgainstADR(violation, adr) {
    // Check if the violation matches ADR constraints
    const { constraints = [] } = adr.validationMetadata;
    
    for (const constraint of constraints) {
      if (constraint.type === violation.type) {
        this.violations.push({
          type: violation.type,
          severity: constraint.severity || 'warning',
          message: violation.message,
          adr: adr.id,
          constraint: constraint.description
        });
      }
    }
  }

  // Placeholder methods for comprehensive validation (to be implemented)
  async validateCommandRegistryConsistency() { /* Implementation TBD */ }
  async validateSessionManagementIntegrity() { /* Implementation TBD */ }
  async validateDomainBoundaries() { /* Implementation TBD */ }
  async validateIntegrationPoints() { /* Implementation TBD */ }
  async validatePluginDiscoveryMechanism() { /* Implementation TBD */ }
  async validatePluginLifecycleManagement() { /* Implementation TBD */ }
  async validateWorkflowEngineOrchestration() { /* Implementation TBD */ }
  async validateStepExecutorConsistency() { /* Implementation TBD */ }
  async validateRollbackMechanismIntegrity() { /* Implementation TBD */ }
  async validateConfigurationPrecedence() { /* Implementation TBD */ }
  async validateEnvironmentContextDetection() { /* Implementation TBD */ }
  async validateContextAwareConfiguration() { /* Implementation TBD */ }

  async generateAISuggestions(violations) {
    if (!ollama || !CONFIG.aiSuggestions || violations.length === 0) {
      return [];
    }

    try {
      const prompt = `You are an architecture compliance assistant for the CLOI project. 
      
Analyze these ADR violations and provide specific repair suggestions:

${violations.map(v => `
- Rule: ${v.rule}
- Description: ${v.description}
- Path: ${v.path}
- Severity: ${v.severity}
`).join('\n')}

Provide concise, actionable suggestions for each violation. Focus on:
1. Immediate fixes
2. Prevention strategies
3. Best practices to avoid similar issues

Format as numbered list with specific actions.`;

      const response = await ollama.chat({
        model: CONFIG.ollamaModel,
        messages: [{ role: 'user', content: prompt }]
      });

      return [{
        type: 'ai-suggestion',
        model: CONFIG.ollamaModel,
        suggestions: response.message.content,
        violationCount: violations.length
      }];
    } catch (error) {
      console.warn(`AI suggestions failed: ${error.message}`);
      return [];
    }
  }

  async generateResearchQuestions(violations, adrs, options = {}) {
    if (!ollama || violations.length === 0) {
      return null;
    }

    try {
      // Find related ADRs for context
      const relatedADRs = adrs.filter(adr => 
        violations.some(v => v.adrId === adr.id)
      );

      const prompt = `You are an architectural research assistant. Based on these persistent validation failures, generate research questions and investigation paths to help developers understand and resolve the underlying issues.

VALIDATION FAILURES:
${violations.map(v => `
- ADR: ${v.adrId}
- Rule: ${v.rule}
- Description: ${v.description}
- Path: ${v.path}
- Severity: ${v.severity}
- Auto-repairable: ${v.autoRepairable}
`).join('\n')}

RELATED ADRs:
${relatedADRs.map(adr => `
- ${adr.id}: ${adr.title}
- Constraints: ${adr.validationMetadata?.constraints?.length || 0}
`).join('\n')}

Generate a research document that includes:

1. **Root Cause Questions**: 3-5 specific questions to investigate why these violations occurred
2. **Architectural Impact**: Questions about how these violations affect the overall system
3. **Investigation Steps**: Concrete steps to research and understand the issues
4. **Decision Points**: Key questions that will help decide on the best resolution approach
5. **Alternative Solutions**: Research questions about alternative architectural approaches
6. **Testing Strategy**: Questions about how to validate any proposed fixes

Format as a structured research document with clear sections and actionable investigation steps.`;

      const response = await ollama.chat({
        model: CONFIG.ollamaModel,
        messages: [{ role: 'user', content: prompt }]
      });

      return {
        timestamp: new Date().toISOString(),
        model: CONFIG.ollamaModel,
        violationCount: violations.length,
        relatedADRs: relatedADRs.map(adr => ({ id: adr.id, title: adr.title })),
        researchContent: response.message.content,
        violations: violations.map(v => ({
          adrId: v.adrId,
          rule: v.rule,
          description: v.description,
          path: v.path,
          severity: v.severity
        }))
      };
    } catch (error) {
      console.warn(`Research generation failed: ${error.message}`);
      return null;
    }
  }
}

// Research Document Manager
class ResearchDocumentManager {
  constructor(codebaseRoot) {
    this.codebaseRoot = codebaseRoot;
    this.researchDir = path.join(codebaseRoot, 'docs', 'research');
  }

  async ensureResearchDirectory() {
    await fs.mkdir(this.researchDir, { recursive: true });
    
    // Create README if it doesn't exist
    const readmePath = path.join(this.researchDir, 'README.md');
    try {
      await fs.access(readmePath);
    } catch {
      const readmeContent = `# Research Documents

This directory contains AI-generated research documents for investigating architectural violations and complex issues.

## Organization

- **Validation Failures**: Research questions for ADR validation failures
- **Architecture Investigations**: Deep-dive analysis of architectural decisions
- **Issue Templates**: Generated templates for GitHub issues and pull requests

## Usage

Research documents are automatically generated when:
1. ADR validation failures exceed threshold (3+ persistent violations)
2. Complex architectural violations require investigation
3. Manual research generation via \`cloi adr research\`

## Integration

- **Local Development**: Documents saved to \`docs/research/\`
- **GitHub Integration**: Can be converted to GitHub issues/PRs
- **CI/CD**: Automatic research generation on validation failures

Generated by CLOI ADR-driven testing system with Ollama AI.
`;
      await fs.writeFile(readmePath, readmeContent);
    }
  }

  async saveResearchDocument(research, options = {}) {
    await this.ensureResearchDirectory();
    
    const timestamp = new Date().toISOString().split('T')[0];
    const violationSummary = this.generateViolationSummary(research.violations);
    const filename = `${timestamp}-validation-research-${violationSummary}.md`;
    const filepath = path.join(this.researchDir, filename);
    
    const document = this.formatResearchDocument(research, options);
    await fs.writeFile(filepath, document);
    
    return { filepath, filename };
  }

  generateViolationSummary(violations) {
    // Create a short summary for filename
    const rules = [...new Set(violations.map(v => v.rule))];
    const adrs = [...new Set(violations.map(v => v.adrId))];
    
    if (rules.length === 1) {
      return rules[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
    } else if (adrs.length === 1) {
      return adrs[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
    } else {
      return `multiple-violations-${violations.length}`;
    }
  }

  formatResearchDocument(research, options = {}) {
    const { includeGitHubTemplate = false, severity = 'high' } = options;
    
    const frontmatter = `---
title: "Architectural Validation Research"
date: "${research.timestamp}"
type: "validation-failure-investigation"
severity: "${severity}"
violation_count: ${research.violationCount}
related_adrs: [${research.relatedADRs.map(adr => `"${adr.id}"`).join(', ')}]
ai_model: "${research.model}"
status: "investigation-needed"
tags: ["architecture", "validation", "research", "ollama-generated"]
---`;

    const summary = `# Architectural Validation Research

**Generated:** ${new Date(research.timestamp).toLocaleString()}  
**AI Model:** ${research.model}  
**Violations:** ${research.violationCount}  
**Related ADRs:** ${research.relatedADRs.map(adr => adr.id).join(', ')}

## Executive Summary

This research document was automatically generated in response to persistent ADR validation failures. The violations indicate potential architectural drift or implementation gaps that require investigation and resolution.

## Validation Failures

${research.violations.map(v => `
### ${v.adrId}: ${v.rule}

**Description:** ${v.description}  
**Path:** \`${v.path}\`  
**Severity:** ${v.severity}  

`).join('')}

## Related Architecture Decisions

${research.relatedADRs.map(adr => `
- **${adr.id}**: ${adr.title}
`).join('')}`;

    const researchContent = `
## AI-Generated Research Questions

${research.researchContent}

## Next Steps

1. **Immediate Actions**
   - Review each violation in detail
   - Assess impact on system architecture
   - Determine if ADR updates are needed

2. **Investigation Process**
   - Follow the research questions above
   - Document findings in this file
   - Update related ADRs if architectural decisions change

3. **Resolution Tracking**
   - Create GitHub issues for complex violations
   - Track resolution progress
   - Update validation rules if needed

## Resolution Log

<!-- Add your findings and resolution steps here -->

---

*This document was automatically generated by CLOI's ADR-driven testing system using Ollama AI. Update this document as you investigate and resolve the architectural violations.*`;

    let gitHubTemplate = '';
    if (includeGitHubTemplate) {
      gitHubTemplate = `

## GitHub Issue Template

\`\`\`markdown
---
title: "Architectural Validation Failures: ${research.violations.map(v => v.rule).join(', ')}"
labels: ["architecture", "validation", "investigation-needed"]
assignees: []
---

## Problem Summary

ADR validation failures detected requiring investigation:

${research.violations.map(v => `
- **${v.adrId}**: ${v.description} (\`${v.path}\`)
`).join('')}

## Related Architecture Decisions

${research.relatedADRs.map(adr => `- ${adr.id}: ${adr.title}`).join('\n')}

## Investigation Required

See research document: \`docs/research/${options.filename || 'validation-research.md'}\`

## Acceptance Criteria

- [ ] All validation failures resolved
- [ ] ADRs updated if architectural changes needed  
- [ ] Validation rules adjusted if appropriate
- [ ] Resolution documented

Generated by CLOI ADR-driven testing system.
\`\`\``;
    }

    return `${frontmatter}

${summary}${researchContent}${gitHubTemplate}`;
  }

  async createGitHubIssue(research, options = {}) {
    // This would integrate with GitHub CLI or API
    const { dryRun = true } = options;
    
    const issueTitle = `Architectural Validation Failures: ${research.violations.map(v => v.rule).slice(0, 2).join(', ')}`;
    const issueBody = `## Problem Summary

ADR validation failures detected requiring investigation:

${research.violations.map(v => `
- **${v.adrId}**: ${v.description} (\`${v.path}\`)
`).join('')}

## Related Architecture Decisions

${research.relatedADRs.map(adr => `- ${adr.id}: ${adr.title}`).join('\n')}

## Investigation Required

See research document: \`docs/research/\` (will be created with this issue)

## Acceptance Criteria

- [ ] All validation failures resolved
- [ ] ADRs updated if architectural changes needed  
- [ ] Validation rules adjusted if appropriate
- [ ] Resolution documented

Generated by CLOI ADR-driven testing system using ${research.model}.`;

    if (dryRun) {
      console.log(chalk.cyan('\n📋 GitHub Issue Template Generated:'));
      console.log(chalk.gray('Title:'), issueTitle);
      console.log(chalk.gray('Body:'));
      console.log(issueBody);
      return { title: issueTitle, body: issueBody, created: false };
    }

    // TODO: Implement actual GitHub API integration
    return { title: issueTitle, body: issueBody, created: false, note: 'GitHub integration not implemented yet' };
  }
}

// ADR Initialization Helper
class ADRInitializer {
  async initializeADRStructure(codebaseRoot, suggestedPath) {
    console.log(`📁 Creating ADR directory structure at ${suggestedPath}...`);
    
    await fs.mkdir(suggestedPath, { recursive: true });
    
    // Create README
    const readmeContent = `# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for this project.

## Format

ADRs follow the format:
- \`ADR-XXX-descriptive-title.md\`
- Include YAML frontmatter with validation metadata
- Follow the template in \`ADR-000-template.md\`

## Tools

- Validate ADRs: \`node scripts/validate-adr-compliance.js\`
- Generate suggestions: \`node scripts/validate-adr-compliance.js --ai-suggestions\`
- Auto-repair violations: \`node scripts/validate-adr-compliance.js --fix\`

## Getting Started

1. Copy the template: \`cp ADR-000-template.md ADR-001-your-decision.md\`
2. Fill in your architectural decision
3. Run validation: \`node scripts/validate-adr-compliance.js\`
`;

    await fs.writeFile(path.join(suggestedPath, 'README.md'), readmeContent);
    
    // Create template
    const templateContent = `---
adr_id: "ADR-000"
title: "ADR Template"
status: "Template"
date: "${new Date().toISOString().split('T')[0]}"
authors: ["Your Name"]
validation_metadata:
  constraints:
    - type: "example-constraint"
      rule: "example-rule"
      description: "Example constraint description"
      severity: "warning"
      auto_repairable: false
  validation_scripts:
    - name: "example-validation"
      command: "echo 'Add your validation command here'"
      description: "Example validation script"
---

# ADR-000: ADR Template

**Status:** Template
**Date:** ${new Date().toISOString().split('T')[0]}
**Authors:** Your Name

## Context and Problem Statement

Describe the context and problem statement that led to this architectural decision.

## Decision Drivers

* [driver 1, e.g., a force, requirement, constraint]
* [driver 2, e.g., a force, requirement, constraint]

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

Add any implementation details, validation rules, or constraints here.
`;

    await fs.writeFile(path.join(suggestedPath, 'ADR-000-template.md'), templateContent);
    
    console.log('✅ ADR structure initialized');
    console.log(`   📁 Directory: ${suggestedPath}`);
    console.log(`   📄 README.md created`);
    console.log(`   📄 ADR-000-template.md created`);
    console.log(`\n🚀 Next steps:`);
    console.log(`   1. Copy the template: cp "${path.join(suggestedPath, 'ADR-000-template.md')}" "${path.join(suggestedPath, 'ADR-001-your-first-decision.md')}"`);
    console.log(`   2. Edit your first ADR`);
    console.log(`   3. Run validation: node scripts/validate-adr-compliance.js`);
  }

  async analyzeCodebaseForADRSuggestions(codebaseRoot) {
    const suggestions = [];
    
    try {
      // Check for package.json (Node.js project)
      const packageJsonPath = path.join(codebaseRoot, 'package.json');
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        suggestions.push({
          title: 'Package Management and Dependencies',
          reason: `Project uses ${packageJson.name} with dependencies`,
          priority: 'medium',
          suggestedConstraints: ['dependency management', 'version pinning', 'security auditing']
        });
      } catch {}

      // Check for src directory structure
      try {
        const srcFiles = await fs.readdir(path.join(codebaseRoot, 'src'));
        if (srcFiles.length > 0) {
          suggestions.push({
            title: 'Source Code Organization',
            reason: 'Project has src/ directory structure',
            priority: 'high',
            suggestedConstraints: ['file naming conventions', 'module organization', 'import patterns']
          });
        }
      } catch {}

      // Check for test directories
      const testPaths = ['test', 'tests', '__tests__', 'spec'];
      for (const testPath of testPaths) {
        try {
          await fs.access(path.join(codebaseRoot, testPath));
          suggestions.push({
            title: 'Testing Strategy and Structure',
            reason: `Project has ${testPath}/ directory`,
            priority: 'high',
            suggestedConstraints: ['test file naming', 'test coverage requirements', 'test organization']
          });
          break;
        } catch {}
      }

      // Check for CI/CD files
      const ciPaths = ['.github/workflows', '.gitlab-ci.yml', 'Jenkinsfile', '.travis.yml'];
      for (const ciPath of ciPaths) {
        try {
          await fs.access(path.join(codebaseRoot, ciPath));
          suggestions.push({
            title: 'CI/CD Pipeline Architecture',
            reason: `Project has ${ciPath}`,
            priority: 'medium',
            suggestedConstraints: ['deployment strategies', 'environment management', 'build processes']
          });
          break;
        } catch {}
      }

      // Check for Docker
      try {
        await fs.access(path.join(codebaseRoot, 'Dockerfile'));
        suggestions.push({
          title: 'Containerization Strategy',
          reason: 'Project uses Docker',
          priority: 'medium',
          suggestedConstraints: ['image management', 'security scanning', 'multi-stage builds']
        });
      } catch {}

    } catch (error) {
      console.warn('Error analyzing codebase:', error.message);
    }

    return suggestions;
  }

  async generateAISuggestedADRs(codebaseRoot, suggestions) {
    if (!ollama || suggestions.length === 0) {
      return suggestions;
    }

    try {
      const prompt = `You are an architecture consultant analyzing a software project. Based on the following codebase analysis, generate specific ADR (Architecture Decision Record) recommendations:

Project Analysis:
${suggestions.map(s => `- ${s.title}: ${s.reason} (Priority: ${s.priority})`).join('\n')}

For each suggested ADR, provide:
1. A specific, actionable title
2. Key architectural constraints to validate
3. Validation rules that could be automated
4. Why this ADR is important for this project

Format as a structured list with clear priorities.`;

      const response = await ollama.chat({
        model: CONFIG.ollamaModel,
        messages: [{ role: 'user', content: prompt }]
      });

      return suggestions.map(s => ({
        ...s,
        aiEnhancement: response.message.content
      }));
    } catch (error) {
      console.warn(`AI enhancement failed: ${error.message}`);
      return suggestions;
    }
  }
}

// Main execution
async function main() {
  try {
    console.log('🔍 ADR Compliance Validator');
    console.log('===========================\n');

    const parser = new ADRParser();
    const initializer = new ADRInitializer();

    // Check if ADR infrastructure exists
    const adrInfra = await parser.checkADRInfrastructure(CONFIG.codebaseRoot);
    
    if (!adrInfra.exists) {
      console.log('📋 No ADR infrastructure found in this repository');
      
      if (CONFIG.initMode) {
        // Initialize ADR structure
        await initializer.initializeADRStructure(CONFIG.codebaseRoot, adrInfra.suggestedPath);
        return;
      }
      
      if (CONFIG.suggestADRs) {
        // Analyze codebase and suggest ADRs
        console.log('🔍 Analyzing codebase for ADR suggestions...\n');
        const suggestions = await initializer.analyzeCodebaseForADRSuggestions(CONFIG.codebaseRoot);
        
        if (CONFIG.aiSuggestions && ollama) {
          console.log('🤖 Enhancing suggestions with AI analysis...\n');
          const enhancedSuggestions = await initializer.generateAISuggestedADRs(CONFIG.codebaseRoot, suggestions);
          
          if (CONFIG.jsonOutput) {
            console.log(JSON.stringify({ suggestions: enhancedSuggestions }, null, 2));
          } else {
            console.log('💡 Suggested ADRs for this project:\n');
            enhancedSuggestions.forEach((suggestion, index) => {
              console.log(`${index + 1}. **${suggestion.title}** (Priority: ${suggestion.priority})`);
              console.log(`   Reason: ${suggestion.reason}`);
              console.log(`   Suggested constraints: ${suggestion.suggestedConstraints.join(', ')}`);
              if (suggestion.aiEnhancement) {
                console.log(`   AI Enhancement:\n${suggestion.aiEnhancement}\n`);
              }
              console.log();
            });
          }
        } else {
          if (CONFIG.jsonOutput) {
            console.log(JSON.stringify({ suggestions }, null, 2));
          } else {
            console.log('💡 Suggested ADRs for this project:\n');
            suggestions.forEach((suggestion, index) => {
              console.log(`${index + 1}. **${suggestion.title}** (Priority: ${suggestion.priority})`);
              console.log(`   Reason: ${suggestion.reason}`);
              console.log(`   Suggested constraints: ${suggestion.suggestedConstraints.join(', ')}\n`);
            });
          }
        }
        
        console.log('\n🚀 To get started:');
        console.log(`   1. Initialize ADR structure: node scripts/validate-adr-compliance.js --init`);
        console.log(`   2. Create your first ADR using the template`);
        console.log(`   3. Run validation: node scripts/validate-adr-compliance.js`);
        return;
      }
      
      // Default behavior - provide helpful guidance
      console.log('ℹ️  Getting started with ADRs:\n');
      console.log('Available options:');
      console.log('  --init           Initialize ADR structure in this repository');
      console.log('  --suggest-adrs   Analyze codebase and suggest relevant ADRs');
      console.log('  --ai-suggestions Use Ollama to enhance ADR suggestions\n');
      
      console.log('Example commands:');
      console.log(`  node scripts/validate-adr-compliance.js --init`);
      console.log(`  node scripts/validate-adr-compliance.js --suggest-adrs --ai-suggestions\n`);
      
      console.log('📚 Learn more about ADRs: https://adr.github.io/');
      process.exit(0);
    }

    // Update CONFIG to use discovered ADR directory
    if (adrInfra.path !== CONFIG.adrDirectory) {
      CONFIG.adrDirectory = adrInfra.path;
      console.log(`📁 Found ADRs in: ${adrInfra.path}`);
    }

    // Parse ADRs
    const adrs = await parser.parseADRDirectory(CONFIG.adrDirectory);
    
    if (!adrs || adrs.length === 0) {
      console.log(`📚 Found ${adrInfra.files.length} ADR files, but none have validation metadata`);
      console.log('\n💡 To enable automated validation:');
      console.log('   1. Add YAML frontmatter with validation_metadata to your ADRs');
      console.log('   2. See ADR-000-template.md for examples');
      console.log('   3. Copy validation script to your project: cp scripts/validate-adr-compliance.js <your-project>/');
      process.exit(0);
    }
    
    console.log(`📚 Found ${adrs.length} ADRs with validation metadata`);

    // Validate
    const validator = new ValidationEngine(CONFIG.autoFix);
    const results = await validator.validateADRs(adrs);

    // Generate AI suggestions if requested and violations found
    if (CONFIG.aiSuggestions && results.violations.length > 0) {
      console.log('\n🤖 Generating AI-powered suggestions...');
      const aiSuggestions = await validator.generateAISuggestions(results.violations);
      results.aiSuggestions = aiSuggestions;
    }

    // Generate research document if violations exceed threshold or explicitly requested
    const unrepaired = results.violations.filter(v => 
      !results.repairs.some(r => r.path === v.path && r.rule === v.rule)
    );

    if ((unrepaired.length >= CONFIG.researchThreshold || CONFIG.generateResearch) && 
        unrepaired.length > 0 && ollama) {
      
      console.log(`\n🔬 Generating research document (${unrepaired.length} unresolved violations)...`);
      
      const researchManager = new ResearchDocumentManager(CONFIG.codebaseRoot);
      const research = await validator.generateResearchQuestions(unrepaired, adrs);
      
      if (research) {
        const { filepath, filename } = await researchManager.saveResearchDocument(research, {
          includeGitHubTemplate: CONFIG.createGitHubIssue,
          severity: CONFIG.researchSeverity,
          filename
        });
        
        console.log(chalk.green(`✅ Research document created: ${filepath}`));
        
        // Optionally create GitHub issue
        if (CONFIG.createGitHubIssue) {
          const issueResult = await researchManager.createGitHubIssue(research, { 
            dryRun: !process.env.GITHUB_TOKEN 
          });
          
          if (issueResult.created) {
            console.log(chalk.green(`✅ GitHub issue created: ${issueResult.url}`));
          } else {
            console.log(chalk.yellow(`📋 GitHub issue template generated (run with GITHUB_TOKEN to create automatically)`));
          }
        }
        
        results.researchDocument = {
          filepath,
          filename,
          violationCount: unrepaired.length,
          relatedADRs: research.relatedADRs
        };
      }
    } else if (unrepaired.length >= CONFIG.researchThreshold && !ollama) {
      console.log(chalk.yellow(`\n💡 ${unrepaired.length} unresolved violations detected`));
      console.log(chalk.yellow('Install Ollama to generate AI-powered research questions'));
      console.log(chalk.yellow('Rerun with --research --ai-suggestions for investigation guidance'));
    }

    // Output results
    if (CONFIG.jsonOutput) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log(`\n📊 Validation Summary:`);
      console.log(`  Total ADRs processed: ${results.summary.totalADRs}`);
      console.log(`  Violations found: ${results.summary.totalViolations}`);
      console.log(`  Auto-repaired: ${results.summary.autoRepaired}`);

      if (results.violations.length > 0) {
        console.log(`\n⚠️  Violations:`);
        const unrepaired = results.violations.filter(v => 
          !results.repairs.some(r => r.path === v.path && r.rule === v.rule)
        );
        
        unrepaired.forEach(violation => {
          console.log(`  - [${violation.severity}] ${violation.description}`);
          console.log(`    Rule: ${violation.rule}`);
          console.log(`    Path: ${violation.path}`);
          if (violation.line) {
            console.log(`    Line: ${violation.line}`);
          }
        });
      } else {
        console.log('\n✅ All architectural constraints satisfied!');
      }

      // Display AI suggestions if available
      if (results.aiSuggestions?.length > 0) {
        console.log('\n🤖 AI-Powered Suggestions:');
        results.aiSuggestions.forEach(suggestion => {
          console.log(`\nModel: ${suggestion.model}`);
          console.log(`Violations analyzed: ${suggestion.violationCount}`);
          console.log('\nSuggestions:');
          console.log(suggestion.suggestions);
        });
      }
    }

    // Exit with appropriate code
    const hasUnrepairedViolations = results.violations.length > results.repairs.length;
    process.exit(hasUnrepairedViolations ? 1 : 0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ADRParser, ValidationEngine, ResearchDocumentManager, ADRInitializer };