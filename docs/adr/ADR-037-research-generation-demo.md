---
adr_id: "ADR-037"
title: "Research Generation Demo"
status: "Proposed"
date: "2024-12-29"
authors: ["CLOI System"]
validation_metadata:
  constraints:
    - type: "file-structure"
      rule: "demo-test-rule"
      description: "Demo rule that will intentionally fail for testing research generation"
      pattern: "src/demo/missing-file.js"
      severity: "error"
      auto_repairable: false
      
    - type: "import-pattern"
      rule: "demo-import-test"
      description: "Demo import pattern check for research testing"
      pattern: "import.*demo-missing-module"
      severity: "warning"
      auto_repairable: false
      
  validation_scripts:
    - name: "demo-validation"
      command: "echo 'Demo validation for research generation testing'"
      description: "Demonstrates validation script integration"
---

# ADR-037: Research Generation Demo

**Status:** Proposed  
**Date:** 2024-12-29  
**Authors:** CLOI System

## Context and Problem Statement

This ADR demonstrates the new AI-powered research generation feature when validation failures occur. It contains intentionally failing validation rules to trigger research document generation.

## Decision

Implement demonstration validation rules that will fail, allowing users to test the research generation functionality without affecting production code.

## Consequences

### Positive
- Provides clear example of research generation workflow
- Demonstrates AI-powered investigation capabilities
- Shows integration between validation failures and research documents

### Negative
- Contains intentionally failing rules (for demo purposes only)
- Should be removed or updated in production systems

## Implementation Notes

This ADR includes validation metadata that will intentionally fail:

1. **File Structure Check**: Looks for a non-existent demo file
2. **Import Pattern Check**: Searches for non-existent import statements

When validation runs, these failures will trigger the research generation system, creating:
- AI-powered research questions
- Structured investigation documents
- GitHub issue templates (if requested)

## Testing the Feature

```bash
# Run validation to trigger research generation
cloi adr validate --ai-suggestions --research

# Generate research document directly
cloi adr research --github

# Test in interactive mode
cloi --interactive
/adr
5. Generate Research
```

The system will detect the validation failures and generate comprehensive research documentation to help investigate and resolve the issues.