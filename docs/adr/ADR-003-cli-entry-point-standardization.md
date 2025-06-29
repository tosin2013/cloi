---
adr_id: "ADR-003"
title: "CLI Entry Point Standardization Using Node.js Conventions"
status: "Accepted"
date: "2024-01-XX"
authors: ["Development Team"]
reviewers: ["Architecture Team"]
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
      pattern: ".*unified\\.js.*"
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
      description: "Ensure all CLI modules have index.js entry points"
      
    - name: "check-unified-references"
      command: "grep -r 'unified\\.js' src/ && exit 1 || exit 0"
      description: "Ensure no references to deprecated unified.js exist"
---

# ADR-003: CLI Entry Point Standardization Using Node.js Conventions

**Status:** Accepted  
**Date:** 2024-01-XX  
**Authors:** Development Team  
**Reviewers:** Architecture Team  

## Context and Problem Statement

Within the **CLI Domain** of the CLOI system, we encountered critical build and deployment issues due to non-standard module entry point naming. The CLI module, serving as a **Bounded Context** for command-line interactions, was using `unified.js` as its entry point, which violated Node.js ecosystem conventions and caused operational failures.

### Domain-Driven Design Context

**Bounded Context:** CLI Command Processing Domain  
**Aggregate Root:** CLI Module Entry Point  
**Domain Language:** Node.js Module Resolution Conventions  
**Domain Events:** Build Process, Global Installation, Module Resolution  

### Problem Manifestation

1. **Entry Point Detection Failure:**
   ```javascript
   // Failed pattern - non-standard naming
   process.argv[1] = '/usr/local/bin/cloi'  // npm symlink
   isMainModule = process.argv[1].includes('unified.js')  // false
   ```

2. **Build Process Inconsistency:**
   - Global npm installation created symlinks pointing to non-existent patterns
   - CI/CD pipelines failed due to incorrect entry point references
   - Module resolution became unpredictable across environments

3. **Domain Language Violation:**
   - Node.js ecosystem expects `index.js` as the default module entry point
   - Package managers, bundlers, and tools assume this convention
   - Documentation and tooling align with `index.js` patterns

## Decision Drivers

### Primary Domain Concerns

1. **Aggregate Consistency:** CLI module must function as a cohesive aggregate with predictable entry point behavior
2. **Ubiquitous Language Alignment:** Adherence to Node.js domain language improves system comprehensibility
3. **Bounded Context Integrity:** CLI domain should not leak implementation details to other domains
4. **Domain Service Reliability:** Build and deployment services must operate consistently

### Technical Constraints

1. **Global Installation Requirements:** npm global installs create symlinks that must resolve correctly
2. **CI/CD Pipeline Dependencies:** 89+ references across workflows and documentation
3. **Module Resolution Standards:** Node.js module resolution algorithm expectations
4. **Cross-Platform Compatibility:** Consistent behavior across Unix/Windows environments

## Considered Options

### Option 1: Keep `unified.js` and Fix Detection Logic
```javascript
// Complex detection logic to handle various scenarios
const isMainModule = process.argv[1].includes('unified.js') || 
                     process.argv[1].endsWith('cloi') ||
                     path.basename(process.argv[1]) === 'cloi';
```

**Domain Analysis:**
- **Pros:** Minimal immediate changes
- **Cons:** Violates Node.js domain language, increases complexity, fragile detection logic

### Option 2: Rename to `index.js` (CHOSEN)
```javascript
// Standard Node.js entry point detection
const isMainModule = process.argv[1].includes('index.js') || 
                     process.argv[1].endsWith('cloi');
```

**Domain Analysis:**
- **Pros:** Aligns with Node.js ubiquitous language, standard module resolution, predictable behavior
- **Cons:** Requires comprehensive reference updates across system

### Option 3: Dual Entry Points
- Maintain both `unified.js` and `index.js` with forwarding

**Domain Analysis:**
- **Pros:** Backward compatibility
- **Cons:** Increases cognitive load, violates single responsibility principle, technical debt

## Decision Outcome

**Chosen Option:** Option 2 - Rename to `index.js`

### Domain-Driven Reasoning

1. **Ubiquitous Language Compliance:**
   - `index.js` is the canonical entry point name in Node.js domain
   - Reduces cognitive friction for developers familiar with Node.js ecosystem
   - Aligns with package.json conventions and module resolution standards

2. **Aggregate Root Clarity:**
   - CLI module's entry point serves as the aggregate root
   - Standard naming makes the aggregate boundary explicit and discoverable
   - Simplifies aggregate interaction patterns for other bounded contexts

3. **Domain Service Integration:**
   - Build services (npm, CI/CD) can operate using standard assumptions
   - Deployment processes become more predictable and maintainable
   - Monitoring and debugging tools work with expected conventions

4. **Bounded Context Encapsulation:**
   - Internal module structure details don't leak to external systems
   - Entry point naming follows domain-standard patterns
   - Reduces coupling between CLI domain and infrastructure concerns

## Implementation Strategy

### Phase 1: Core Module Restructure
```bash
# Domain aggregate restructure
mv src/cli/unified.js src/cli/index.js
```

### Phase 2: Reference Update (89+ locations)
- **GitHub Actions Workflows:** 6 files, 25+ references
- **Documentation:** 5 files, 37+ references  
- **Source Code:** 2 files, 27+ references

### Phase 3: Verification
```bash
# Validate domain service integration
node src/cli/index.js --help
/usr/local/bin/cloi --help  # Global installation test
```

## Consequences

### Positive Domain Outcomes

1. **Enhanced Domain Clarity:**
   - CLI module follows Node.js domain conventions
   - Entry point discovery becomes predictable
   - Build and deployment processes operate with standard assumptions

2. **Improved Aggregate Consistency:**
   - Entry point detection logic simplified and more reliable
   - Global installation scenarios work consistently
   - Module resolution aligns with ecosystem expectations

3. **Better Domain Service Integration:**
   - CI/CD pipelines operate with reduced complexity
   - Package managers handle installation predictably
   - Development tools integrate seamlessly

4. **Reduced Technical Debt:**
   - Eliminates custom detection logic
   - Follows established patterns from Node.js domain
   - Reduces maintenance burden for edge cases

### Potential Risks and Mitigations

1. **Reference Update Complexity:**
   - **Risk:** Missing references in documentation or workflows
   - **Mitigation:** Comprehensive grep search and systematic update process
   - **Verification:** Automated testing of all entry points

2. **Backward Compatibility:**
   - **Risk:** External scripts may still reference old path
   - **Mitigation:** Clear migration documentation and deprecation notices
   - **Timeline:** Immediate update of all internal references

3. **Domain Knowledge Transfer:**
   - **Risk:** Team members may use outdated references
   - **Mitigation:** Updated documentation and training materials
   - **Communication:** Clear announcement of the architectural change

## Related Decisions

- **ADR-001:** CLI Unification Strategy (predecessor decision)
- **ADR-002:** A2A Protocol Integration (related domain interaction)
- **Future ADR:** Module Resolution Strategy (potential follow-up)

## Compliance with Domain Principles

### Ubiquitous Language ✅
- Adopts standard Node.js terminology and conventions
- Reduces domain-specific jargon in favor of ecosystem standards

### Bounded Context Integrity ✅  
- CLI domain maintains clear boundaries with standard entry point
- Reduces coupling with infrastructure and build concerns

### Aggregate Design ✅
- CLI module serves as well-defined aggregate with clear root
- Entry point behavior is consistent and predictable

### Domain Service Collaboration ✅
- Build, deployment, and monitoring services integrate seamlessly
- Follows established patterns for service interaction

## Verification Criteria

### Functional Verification
- [ ] `node src/cli/index.js --help` executes successfully
- [ ] Global installation `cloi --help` works correctly  
- [ ] All CI/CD workflows pass with updated references
- [ ] A2A server integration functions properly

### Domain Verification
- [ ] Entry point follows Node.js conventions
- [ ] Module resolution works across all supported environments
- [ ] Build processes operate with standard assumptions
- [ ] Documentation reflects domain-standard terminology

## Conclusion

This architectural decision strengthens the CLI domain by aligning with Node.js ecosystem conventions, reducing complexity, and improving system reliability. The change from `unified.js` to `index.js` represents a move toward domain-standard practices that enhance both technical functionality and cognitive clarity for developers working within the Node.js domain context.

The comprehensive update of 89+ references across the system demonstrates the far-reaching impact of domain-level architectural decisions and reinforces the importance of following established domain conventions from the outset.

---

**Next Review Date:** 2024-02-XX  
**Impact Assessment:** High (affects build, deployment, and developer experience)  
**Domain Maturity:** Stable (aligns with established Node.js patterns) 