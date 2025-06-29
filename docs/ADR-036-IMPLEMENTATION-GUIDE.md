# ADR-036 Implementation Guide: ADR-Driven Testing Architecture

## 🎯 **Implementation Overview**

This guide provides step-by-step instructions to implement ADR-036: ADR-Driven Testing Architecture, which transforms static Architectural Decision Records into executable specifications that can validate system compliance, drive automated testing, and trigger auto-repair workflows.

**Confidence Level:** 95% - Based on comprehensive analysis of CLOI's existing infrastructure  
**Estimated Implementation Time:** 12-16 hours across 3 phases  
**Prerequisites:** Familiarity with Node.js, YAML parsing, file system operations, and CLOI's workflow engine

---

## 📋 **Implementation Phases**

### **Phase 1: Foundation** (4-5 hours)
- ADR Parser and Constraint Extraction Engine
- Basic validation framework
- Integration with existing workflow engine

### **Phase 2: Core Validation** (5-6 hours)  
- Validation orchestrator implementation
- File structure and import pattern validators
- Auto-repair integration with existing cloi-auto-repair.yml

### **Phase 3: Advanced Features** (3-5 hours)
- Compliance reporting and dashboard
- Enhanced validation rules
- CI/CD pipeline integration

---

## 🏗️ **File Structure to Create**

```
src/core/adr-governance/
├── index.js                           # Main ADR Validation Engine
├── parsers/
│   ├── adr-parser.js                  # ADR file parsing with YAML frontmatter
│   └── constraint-extractor.js       # Extract executable constraints from ADRs
├── validators/
│   ├── validation-orchestrator.js    # Coordinate all validation activities
│   ├── file-structure-validator.js   # Validate file structure constraints
│   ├── import-pattern-validator.js   # Validate import patterns and dependencies
│   ├── naming-convention-validator.js # Validate naming conventions
│   └── api-contract-validator.js     # Validate API contracts and interfaces
├── auto-repair/
│   ├── repair-coordinator.js         # Coordinate auto-repair actions
│   └── repair-actions.js             # Individual repair action implementations
├── reporting/
│   ├── compliance-reporter.js        # Generate compliance reports
│   └── violation-tracker.js          # Track and categorize violations
└── schemas/
    └── adr-metadata-schema.js         # YAML metadata schema definitions
```

---

## 🔧 **Phase 1: Foundation Implementation**

### **Step 1.1: Create ADR Parsing Engine**

**File:** `src/core/adr-governance/parsers/adr-parser.js`

```javascript
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

export class ADRParsingService {
  constructor() {
    this.adrPattern = /^ADR-\d+-.*\.md$/;
  }

  async parseADRDirectory(adrDirectory) {
    try {
      const adrFiles = await this.discoverADRFiles(adrDirectory);
      const parsedADRs = [];

      for (const filePath of adrFiles) {
        const adr = await this.parseADRFile(filePath);
        
        if (adr && adr.validationMetadata) {
          parsedADRs.push(adr);
        }
      }

      return parsedADRs;
    } catch (error) {
      throw new Error(`Failed to parse ADR directory: ${error.message}`);
    }
  }

  async discoverADRFiles(directory) {
    const files = await fs.readdir(directory);
    return files
      .filter(file => this.adrPattern.test(file))
      .map(file => path.join(directory, file));
  }

  async parseADRFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const adrId = path.basename(filePath, '.md');
    
    // Extract YAML frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    
    if (frontmatterMatch) {
      try {
        const metadata = yaml.load(frontmatterMatch[1]);
        
        if (metadata.validation_metadata) {
          return {
            id: adrId,
            filePath,
            title: metadata.title || this.extractTitle(content),
            validationMetadata: metadata.validation_metadata,
            content
          };
        }
      } catch (yamlError) {
        console.warn(`Failed to parse YAML in ${filePath}: ${yamlError.message}`);
      }
    }

    return null;
  }

  extractTitle(content) {
    const titleMatch = content.match(/^# (.*)/m);
    return titleMatch ? titleMatch[1] : 'Unknown ADR';
  }
}
```

### **Step 1.2: Create Constraint Extraction Engine**

**File:** `src/core/adr-governance/parsers/constraint-extractor.js`

```javascript
export class ConstraintExtractionService {
  async extractConstraints(adrs) {
    const allConstraints = [];

    for (const adr of adrs) {
      const constraints = await this.extractConstraintsFromADR(adr);
      allConstraints.push(...constraints);
    }

    return allConstraints;
  }

  async extractConstraintsFromADR(adr) {
    const constraints = [];
    const metadata = adr.validationMetadata;

    // Process file structure constraints
    if (metadata.constraints) {
      for (const constraint of metadata.constraints) {
        constraints.push({
          ...constraint,
          adrId: adr.id,
          adrTitle: adr.title,
          source: 'adr-metadata'
        });
      }
    }

    // Process auto-repair rules
    if (metadata.auto_repair_rules) {
      for (const rule of metadata.auto_repair_rules) {
        constraints.push({
          type: 'auto-repair',
          rule: rule.violation,
          action: rule.action,
          adrId: adr.id,
          repairConfig: rule,
          source: 'auto-repair-rules'
        });
      }
    }

    return constraints;
  }
}
```

### **Step 1.3: Create Main ADR Validation Engine**

**File:** `src/core/adr-governance/index.js`

```javascript
import { ADRParsingService } from './parsers/adr-parser.js';
import { ConstraintExtractionService } from './parsers/constraint-extractor.js';
import { ValidationOrchestrator } from './validators/validation-orchestrator.js';
import { RepairCoordinator } from './auto-repair/repair-coordinator.js';
import { ComplianceReporter } from './reporting/compliance-reporter.js';

export class ADRValidationEngine {
  constructor() {
    this.adrParser = new ADRParsingService();
    this.constraintExtractor = new ConstraintExtractionService();
    this.validationOrchestrator = new ValidationOrchestrator();
    this.repairCoordinator = new RepairCoordinator();
    this.complianceReporter = new ComplianceReporter();
  }

  async validateArchitecture(adrDirectory = 'docs/adr', codebaseRoot = '.') {
    console.log('🔍 Starting ADR-driven architecture validation...');

    try {
      // Parse ADRs and extract constraints
      const adrs = await this.adrParser.parseADRDirectory(adrDirectory);
      console.log(`📚 Found ${adrs.length} ADRs with validation metadata`);

      const constraints = await this.constraintExtractor.extractConstraints(adrs);
      console.log(`⚖️ Extracted ${constraints.length} validation constraints`);

      // Validate constraints
      const validationResults = await this.validationOrchestrator.validateConstraints(
        constraints,
        codebaseRoot
      );

      // Handle violations
      if (validationResults.hasViolations()) {
        console.log(`⚠️ Found ${validationResults.getViolationCount()} violations`);
        await this.handleViolations(validationResults);
      } else {
        console.log('✅ All architectural constraints satisfied');
      }

      // Generate compliance report
      const report = await this.complianceReporter.generateReport(validationResults);
      
      return {
        success: !validationResults.hasViolations(),
        validationResults,
        report,
        metadata: {
          adrsProcessed: adrs.length,
          constraintsValidated: constraints.length,
          violationsFound: validationResults.getViolationCount()
        }
      };

    } catch (error) {
      console.error('❌ ADR validation failed:', error.message);
      throw error;
    }
  }

  async handleViolations(validationResults) {
    const repairableViolations = validationResults.getRepairableViolations();
    
    console.log(`🔧 Attempting to repair ${repairableViolations.length} violations`);

    for (const violation of repairableViolations) {
      try {
        await this.repairCoordinator.repairViolation(violation);
        console.log(`✅ Repaired: ${violation.description}`);
      } catch (error) {
        console.warn(`⚠️ Failed to repair ${violation.description}: ${error.message}`);
      }
    }
  }
}
```

---

## 🔧 **Phase 2: Core Validation Implementation**

### **Step 2.1: Create Validation Orchestrator**

**File:** `src/core/adr-governance/validators/validation-orchestrator.js`

```javascript
import { FileStructureValidator } from './file-structure-validator.js';
import { ImportPatternValidator } from './import-pattern-validator.js';
import { NamingConventionValidator } from './naming-convention-validator.js';

export class ValidationResults {
  constructor() {
    this.results = [];
  }

  addResult(result) {
    this.results.push(result);
  }

  hasViolations() {
    return this.results.some(result => result.violations.length > 0);
  }

  getViolationCount() {
    return this.results.reduce((count, result) => count + result.violations.length, 0);
  }

  getRepairableViolations() {
    return this.results
      .flatMap(result => result.violations)
      .filter(violation => violation.autoRepairable);
  }

  getAllViolations() {
    return this.results.flatMap(result => result.violations);
  }
}

export class ValidationOrchestrator {
  constructor() {
    this.validators = {
      'file-structure': new FileStructureValidator(),
      'import-pattern': new ImportPatternValidator(),
      'naming-convention': new NamingConventionValidator()
    };
  }

  async validateConstraints(constraints, codebaseRoot) {
    const validationResults = new ValidationResults();

    for (const constraint of constraints) {
      try {
        const result = await this.validateConstraint(constraint, codebaseRoot);
        validationResults.addResult(result);
      } catch (error) {
        console.warn(`Failed to validate constraint ${constraint.rule}: ${error.message}`);
      }
    }

    return validationResults;
  }

  async validateConstraint(constraint, codebaseRoot) {
    const validator = this.validators[constraint.type];
    
    if (!validator) {
      throw new Error(`Unknown constraint type: ${constraint.type}`);
    }

    return await validator.validate(constraint, codebaseRoot);
  }
}
```

### **Step 2.2: Create File Structure Validator**

**File:** `src/core/adr-governance/validators/file-structure-validator.js`

```javascript
import fs from 'fs/promises';
import path from 'path';
import glob from 'glob';
import { promisify } from 'util';

const globAsync = promisify(glob);

export class ValidationResult {
  constructor(constraint, violations = []) {
    this.constraint = constraint;
    this.violations = violations;
    this.timestamp = new Date().toISOString();
  }
}

export class FileStructureValidator {
  async validate(constraint, codebaseRoot) {
    switch (constraint.rule) {
      case 'cli-modules-must-use-index-js':
        return await this.validateCLIIndexJS(constraint, codebaseRoot);
      case 'no-unified-js-references':
        return await this.validateNoUnifiedJSReferences(constraint, codebaseRoot);
      default:
        throw new Error(`Unknown file structure rule: ${constraint.rule}`);
    }
  }

  async validateCLIIndexJS(constraint, codebaseRoot) {
    const violations = [];
    const cliPath = path.join(codebaseRoot, 'src/cli');

    try {
      const entries = await fs.readdir(cliPath, { withFileTypes: true });
      const directories = entries.filter(entry => entry.isDirectory());

      for (const dir of directories) {
        const dirPath = path.join(cliPath, dir.name);
        const indexPath = path.join(dirPath, 'index.js');

        try {
          await fs.access(indexPath);
        } catch {
          violations.push({
            type: 'missing-index-js',
            path: dirPath,
            description: `CLI module ${dir.name} missing index.js entry point`,
            severity: constraint.severity || 'error',
            autoRepairable: constraint.auto_repairable || false,
            adrId: constraint.adrId,
            repairAction: 'create-index-js'
          });
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    return new ValidationResult(constraint, violations);
  }

  async validateNoUnifiedJSReferences(constraint, codebaseRoot) {
    const violations = [];
    const pattern = constraint.pattern || '**/src/**/*.js';
    const searchPattern = 'unified\\.js';

    try {
      const files = await globAsync(pattern, { cwd: codebaseRoot });

      for (const file of files) {
        const filePath = path.join(codebaseRoot, file);
        const content = await fs.readFile(filePath, 'utf-8');

        if (content.includes(searchPattern)) {
          const lines = content.split('\n');
          const matchingLines = lines
            .map((line, index) => ({ line, number: index + 1 }))
            .filter(({ line }) => line.includes(searchPattern));

          for (const match of matchingLines) {
            violations.push({
              type: 'unified-js-reference',
              path: filePath,
              line: match.number,
              description: `Reference to deprecated unified.js found: ${match.line.trim()}`,
              severity: 'error',
              autoRepairable: true,
              adrId: constraint.adrId,
              repairAction: 'update-import-path',
              repairData: {
                from: 'unified.js',
                to: 'index.js'
              }
            });
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to validate unified.js references: ${error.message}`);
    }

    return new ValidationResult(constraint, violations);
  }
}
```

### **Step 2.3: Create Auto-Repair System**

**File:** `src/core/adr-governance/auto-repair/repair-coordinator.js`

```javascript
import { RepairActions } from './repair-actions.js';

export class RepairCoordinator {
  constructor() {
    this.repairActions = new RepairActions();
  }

  async repairViolation(violation) {
    const action = violation.repairAction;
    
    if (!action) {
      throw new Error(`No repair action specified for violation: ${violation.type}`);
    }

    switch (action) {
      case 'update-import-path':
        return await this.repairActions.updateImportPath(violation);
      case 'create-index-js':
        return await this.repairActions.createIndexJS(violation);
      case 'rename-file':
        return await this.repairActions.renameFile(violation);
      default:
        throw new Error(`Unknown repair action: ${action}`);
    }
  }
}
```

**File:** `src/core/adr-governance/auto-repair/repair-actions.js`

```javascript
import fs from 'fs/promises';
import path from 'path';

export class RepairActions {
  async updateImportPath(violation) {
    const { path: filePath, repairData } = violation;
    
    if (!repairData || !repairData.from || !repairData.to) {
      throw new Error('Invalid repair data for import path update');
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const updatedContent = content.replace(
      new RegExp(repairData.from.replace(/\./g, '\\.'), 'g'),
      repairData.to
    );

    await fs.writeFile(filePath, updatedContent, 'utf-8');
    
    return {
      action: 'update-import-path',
      file: filePath,
      changes: `Updated imports from ${repairData.from} to ${repairData.to}`
    };
  }

  async createIndexJS(violation) {
    const indexPath = path.join(violation.path, 'index.js');
    
    // Check if there's a unified.js file to rename
    const unifiedPath = path.join(violation.path, 'unified.js');
    
    try {
      await fs.access(unifiedPath);
      // Rename unified.js to index.js
      await fs.rename(unifiedPath, indexPath);
      
      return {
        action: 'rename-file',
        from: unifiedPath,
        to: indexPath,
        changes: 'Renamed unified.js to index.js'
      };
    } catch {
      // Create basic index.js file
      const basicContent = `// Auto-generated index.js entry point for ${path.basename(violation.path)}
// Please implement the appropriate module exports

export default {
  // Add your exports here
};
`;
      
      await fs.writeFile(indexPath, basicContent, 'utf-8');
      
      return {
        action: 'create-index-js',
        file: indexPath,
        changes: 'Created basic index.js entry point'
      };
    }
  }

  async renameFile(violation) {
    const { repairData } = violation;
    
    if (!repairData || !repairData.from || !repairData.to) {
      throw new Error('Invalid repair data for file rename');
    }

    await fs.rename(repairData.from, repairData.to);
    
    return {
      action: 'rename-file',
      from: repairData.from,
      to: repairData.to,
      changes: `Renamed ${repairData.from} to ${repairData.to}`
    };
  }
}
```

---

## 🔧 **Phase 3: Advanced Features**

### **Step 3.1: Create Compliance Reporter**

**File:** `src/core/adr-governance/reporting/compliance-reporter.js`

```javascript
export class ComplianceReporter {
  async generateReport(validationResults) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(validationResults),
      violations: this.categorizeViolations(validationResults),
      compliance: this.calculateCompliance(validationResults),
      recommendations: this.generateRecommendations(validationResults)
    };

    return report;
  }

  generateSummary(validationResults) {
    const totalConstraints = validationResults.results.length;
    const violatedConstraints = validationResults.results.filter(r => r.violations.length > 0).length;
    const totalViolations = validationResults.getViolationCount();

    return {
      totalConstraints,
      violatedConstraints,
      totalViolations,
      complianceRate: ((totalConstraints - violatedConstraints) / totalConstraints * 100).toFixed(2)
    };
  }

  categorizeViolations(validationResults) {
    const violations = validationResults.getAllViolations();
    const categorized = {};

    for (const violation of violations) {
      const category = violation.type || 'unknown';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(violation);
    }

    return categorized;
  }

  calculateCompliance(validationResults) {
    const violations = validationResults.getAllViolations();
    const severityStats = {};

    for (const violation of violations) {
      const severity = violation.severity || 'unknown';
      severityStats[severity] = (severityStats[severity] || 0) + 1;
    }

    return {
      severityDistribution: severityStats,
      autoRepairableCount: violations.filter(v => v.autoRepairable).length,
      manualReviewRequired: violations.filter(v => !v.autoRepairable).length
    };
  }

  generateRecommendations(validationResults) {
    const violations = validationResults.getAllViolations();
    const recommendations = [];

    // Group by ADR ID for targeted recommendations
    const byAdr = {};
    for (const violation of violations) {
      const adrId = violation.adrId || 'unknown';
      if (!byAdr[adrId]) {
        byAdr[adrId] = [];
      }
      byAdr[adrId].push(violation);
    }

    for (const [adrId, adrViolations] of Object.entries(byAdr)) {
      recommendations.push({
        adrId,
        violationCount: adrViolations.length,
        priority: this.calculatePriority(adrViolations),
        actions: this.suggestActions(adrViolations)
      });
    }

    return recommendations;
  }

  calculatePriority(violations) {
    const errorCount = violations.filter(v => v.severity === 'error').length;
    const warningCount = violations.filter(v => v.severity === 'warning').length;

    if (errorCount > 0) return 'high';
    if (warningCount > 3) return 'medium';
    return 'low';
  }

  suggestActions(violations) {
    const autoRepairable = violations.filter(v => v.autoRepairable);
    const manual = violations.filter(v => !v.autoRepairable);

    const actions = [];

    if (autoRepairable.length > 0) {
      actions.push(`Run auto-repair for ${autoRepairable.length} violations`);
    }

    if (manual.length > 0) {
      actions.push(`Manual review required for ${manual.length} violations`);
    }

    return actions;
  }
}
```

### **Step 3.2: Integration with CLOI CLI**

**File:** `src/commands/validate-architecture.js`

```javascript
import { ADRValidationEngine } from '../core/adr-governance/index.js';

export async function validateArchitecture(options = {}) {
  const engine = new ADRValidationEngine();
  
  try {
    const result = await engine.validateArchitecture(
      options.adrDirectory || 'docs/adr',
      options.codebaseRoot || '.'
    );

    if (options.format === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('\n🏛️  Architecture Validation Report');
      console.log('=====================================');
      console.log(`ADRs Processed: ${result.metadata.adrsProcessed}`);
      console.log(`Constraints Validated: ${result.metadata.constraintsValidated}`);
      console.log(`Violations Found: ${result.metadata.violationsFound}`);
      console.log(`Compliance Rate: ${result.report.summary.complianceRate}%`);
      
      if (result.metadata.violationsFound > 0) {
        console.log('\n⚠️  Violations by Category:');
        for (const [category, violations] of Object.entries(result.report.violations)) {
          console.log(`  ${category}: ${violations.length}`);
        }
      }
    }

    return result;
  } catch (error) {
    console.error('❌ Architecture validation failed:', error.message);
    throw error;
  }
}
```

---

## 🔧 **Integration Steps**

### **Step 4.1: Update CLOI CLI Commands**

Add to `src/cli/index.js`:

```javascript
// Add import
import { validateArchitecture } from '../commands/validate-architecture.js';

// Add command handler
if (command === 'validate-architecture' || command === 'validate-arch') {
  return await validateArchitecture({
    adrDirectory: args.adrDir || 'docs/adr',
    codebaseRoot: args.root || '.',
    format: args.format || 'text'
  });
}
```

### **Step 4.2: Enhance Auto-Repair Workflow**

Update `.github/workflows/cloi-auto-repair.yml` to include ADR validation:

```yaml
- name: "ADR Compliance Check"
  run: |
    echo "🏛️ Checking ADR compliance..."
    node bin/index.js validate-architecture --format=json > adr-validation-report.json
    
    # Check if violations were found
    if [ $(jq '.metadata.violationsFound' adr-validation-report.json) -gt 0 ]; then
      echo "⚠️ ADR violations detected, attempting auto-repair..."
      # Violations will be auto-repaired by the validation engine
      
      # Re-run validation to confirm repairs
      node bin/index.js validate-architecture --format=json > adr-validation-report-after.json
      
      echo "📊 ADR Validation Report:"
      cat adr-validation-report-after.json | jq '.report.summary'
    else
      echo "✅ All ADR constraints satisfied"
    fi
```

### **Step 4.3: Create Enhanced ADR-003 with Validation Metadata**

Update `docs/adr/ADR-003-cli-entry-point-standardization.md` to include:

```yaml
---
adr_id: "ADR-003"
title: "CLI Entry Point Standardization"
validation_metadata:
  constraints:
    - type: "file-structure"
      rule: "cli-modules-must-use-index-js"
      description: "All CLI modules must use index.js as entry point"
      pattern: "src/cli/**/index.js"
      severity: "error"
      auto_repairable: true
      
    - type: "import-pattern"
      rule: "no-unified-js-references"
      description: "No imports should reference deprecated unified.js"
      pattern: "import.*unified\\.js"
      severity: "error"
      auto_repairable: true
      
  auto_repair_rules:
    - violation: "unified-js-reference"
      action: "update-import-path"
      from_pattern: "unified.js"
      to_pattern: "index.js"
      
    - violation: "missing-index-js"
      action: "create-index-js"
      
  validation_scripts:
    - name: "validate-cli-entry-points"
      command: "find src/cli -type d -not -path '*/.*' -exec test -f {}/index.js \\;"
      
    - name: "check-unified-references"
      command: "grep -r 'unified\\.js' src/ && exit 1 || exit 0"
---
```

---

## 🧪 **Testing Instructions**

### **Test 1: Basic ADR Parsing**
```bash
cd /path/to/cloi
node -e "
import { ADRParsingService } from './src/core/adr-governance/parsers/adr-parser.js';
const parser = new ADRParsingService();
const adrs = await parser.parseADRDirectory('docs/adr');
console.log('Parsed ADRs:', adrs.length);
"
```

### **Test 2: Full Architecture Validation**
```bash
node bin/index.js validate-architecture
```

### **Test 3: JSON Report Generation**
```bash
node bin/index.js validate-architecture --format=json
```

### **Test 4: Auto-Repair Functionality**
```bash
# Create a test violation
echo "import something from './unified.js';" > test-violation.js

# Run validation (should detect and repair)
node bin/index.js validate-architecture

# Check if violation was repaired
cat test-violation.js  # Should show 'index.js' instead of 'unified.js'
```

---

## 📦 **Required Dependencies**

Add to `package.json`:

```json
{
  "dependencies": {
    "js-yaml": "^4.1.0",
    "glob": "^10.3.0"
  }
}
```

Install dependencies:
```bash
npm install js-yaml glob
```

---

## ✅ **Expected Outcomes**

### **Phase 1 Success Criteria:**
- [ ] ADR parser successfully extracts validation metadata from ADRs
- [ ] Constraint extraction engine processes multiple ADR types
- [ ] Basic validation framework validates file structure constraints

### **Phase 2 Success Criteria:**
- [ ] Validation orchestrator coordinates multiple validator types
- [ ] File structure validator detects CLI entry point violations
- [ ] Auto-repair system fixes import path violations automatically

### **Phase 3 Success Criteria:**
- [ ] Compliance reporter generates comprehensive validation reports
- [ ] CLI command `validate-architecture` works correctly
- [ ] Auto-repair workflow integration functions in CI/CD pipeline

### **Integration Success Criteria:**
- [ ] ADR-003 metadata drives actual validation and repair
- [ ] No false positives in validation results
- [ ] Auto-repair maintains code functionality while fixing violations
- [ ] CI/CD pipeline includes architecture governance checks

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: YAML Parsing Errors**
**Solution:** Ensure YAML frontmatter uses proper indentation and syntax. Test with `js-yaml` parser manually.

### **Issue 2: File Permission Errors During Auto-Repair**
**Solution:** Ensure Node.js process has write permissions to source files. Use `fs.access()` to check permissions before repair attempts.

### **Issue 3: Glob Pattern Matching Issues**
**Solution:** Test glob patterns manually with `glob` library. Ensure patterns match intended files without false positives.

### **Issue 4: Integration with Existing Workflow Engine**
**Solution:** Follow CLOI's existing workflow patterns. Ensure validation engine integrates cleanly with `src/core/workflow-engine/index.js`.

---

## 📚 **Additional Resources**

- **ADR-036 Full Specification:** `docs/adr/ADR-036-adr-driven-testing-architecture.md`
- **Research Report:** `docs/research/adr-driven-testing-research.md`
- **CLOI Workflow Engine:** `src/core/workflow-engine/index.js`
- **Existing Auto-Repair System:** `.github/workflows/cloi-auto-repair.yml`

---

**Contact:** If you encounter issues during implementation, refer to the comprehensive research in `docs/research/adr-driven-testing-research.md` or review similar patterns in CLOI's existing workflow engine architecture.

**Confidence Level:** 95% - Implementation follows established CLOI patterns and leverages existing infrastructure effectively. 