# ADR-039: Portable Workflow Specification

## Status
Proposed

## Context

Based on portable workflow systems research and ADR-038's federated architecture vision, CLOI needs a standardized specification for workflows that can execute across any repository without requiring full CLOI installation. This addresses the critical gap between CLOI's powerful internal capabilities and lightweight external deployment needs.

### Research Findings

Analysis of successful portable workflow systems (Ansible, GitHub Actions, Terraform, Docker) reveals three core patterns:
1. **Declarative Configuration**: Human-readable YAML format
2. **Provider Abstraction**: Platform/tool independence through plugins  
3. **Self-Contained Execution**: Minimal external dependencies

### Current State Analysis

CLOI's existing architecture provides strong foundations:
- **ADR-012**: Workflow engine with step executors
- **ADR-010/011**: Plugin architecture and contracts
- **ADR-038**: External project integration vision
- **ADR-007**: Provider abstraction patterns

### Gap Identification

Missing components for portable execution:
- Standardized YAML workflow definition format
- Lightweight step executor contracts
- Repository auto-detection patterns  
- Standalone execution engine specification
- Cross-repository coordination protocols

## Decision

Create a **Portable Workflow Specification** that defines:
- YAML-based workflow definition schema
- Lightweight provider abstraction interface
- Self-contained execution engine architecture
- Three deployment models: Standalone, CLOI-Integrated, Hybrid

## Architecture Specification

### Workflow Definition Schema

**Core YAML Structure**:
```yaml
# .cloi/workflows/feature-development.yml
apiVersion: cloi.dev/v1
kind: WorkflowPlaybook
metadata:
  name: feature-development-workflow
  version: 1.2.0
  description: "AI-assisted feature development with validation"
  
spec:
  compatibility:
    repositories: [node, python, java, generic]
    platforms: [linux, darwin, win32]
    
  providers:
    - name: claude
      fallback: ollama
      config:
        model: claude-3-5-sonnet
        timeout: 30s
    - name: ollama  
      config:
        model: phi4:latest
        
  variables:
    feature_spec: "{{ input.feature_description }}"
    target_path: "{{ repository.src_dir }}"
    test_path: "{{ repository.test_dir }}"
    
  steps:
    - name: analyze-requirements
      type: feature.analyze
      inputs:
        description: "{{ variables.feature_spec }}"
        codebase_context: "{{ repository.context }}"
      outputs:
        analysis_result: "{{ step.result }}"
        
    - name: generate-implementation
      type: code.generate
      inputs:
        requirements: "{{ steps.analyze-requirements.outputs.analysis_result }}"
        target_directory: "{{ variables.target_path }}"
      outputs:
        generated_files: "{{ step.result.files }}"
        
    - name: create-tests
      type: test.generate
      inputs:
        implementation_files: "{{ steps.generate-implementation.outputs.generated_files }}"
        test_directory: "{{ variables.test_path }}"
      when: "{{ repository.has_tests }}"
      
    - name: validate-integration
      type: validation.run
      inputs:
        files: "{{ steps.generate-implementation.outputs.generated_files }}"
        validation_rules: "{{ repository.validation_config }}"
```

### Provider Abstraction Interface

**Standard Provider Contract**:
```typescript
interface PortableProvider {
  // Core identification
  name: string;
  version: string;
  capabilities: string[];
  
  // Lifecycle methods
  isAvailable(): Promise<boolean>;
  initialize(config: ProviderConfig): Promise<void>;
  cleanup(): Promise<void>;
  
  // Execution interface
  query(prompt: string, options: QueryOptions): Promise<ProviderResponse>;
  validateCapabilities(required: string[]): boolean;
  
  // Configuration
  getConfig(): ProviderConfig;
  updateConfig(config: Partial<ProviderConfig>): void;
}

interface QueryOptions {
  context?: WorkflowContext;
  tools?: string[];
  timeout?: number;
  streaming?: boolean;
  temperature?: number;
}

interface ProviderResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  metadata?: Record<string, any>;
  tools_used?: ToolUsage[];
}
```

### Step Executor Contracts

**Lightweight Step Interface**:
```typescript
interface PortableStepExecutor {
  // Step identification
  type: string;
  version: string;
  description: string;
  
  // Execution interface
  execute(step: WorkflowStep, context: ExecutionContext): Promise<StepResult>;
  validate(step: WorkflowStep): ValidationResult;
  
  // Capability reporting
  getSupportedInputs(): InputSchema[];
  getSupportedOutputs(): OutputSchema[];
  getRequiredProviders(): string[];
}

interface WorkflowStep {
  name: string;
  type: string;
  inputs: Record<string, any>;
  outputs?: Record<string, string>;
  when?: string; // Conditional execution
  retry?: RetryConfig;
  timeout?: number;
}

interface StepResult {
  success: boolean;
  outputs: Record<string, any>;
  duration: number;
  logs?: LogEntry[];
  errors?: StepError[];
  metadata?: Record<string, any>;
}
```

### Repository Context Detection

**Auto-Detection Patterns**:
```typescript
interface RepositoryContext {
  // Basic identification
  root: string;
  type: RepositoryType;
  language: string[];
  framework?: string[];
  
  // Structure analysis
  src_dir: string;
  test_dir?: string;
  config_files: ConfigFile[];
  dependencies: Dependency[];
  
  // Capabilities
  has_tests: boolean;
  has_ci: boolean;
  has_docs: boolean;
  build_system?: string;
  
  // Validation
  validation_config?: ValidationConfig;
  style_guide?: StyleConfig;
}

interface RepositoryDetector {
  detect(path: string): Promise<RepositoryContext>;
  validateCompatibility(context: RepositoryContext, workflow: WorkflowSpec): boolean;
  adaptWorkflow(workflow: WorkflowSpec, context: RepositoryContext): WorkflowSpec;
}
```

## Deployment Models

### 1. Standalone Deployment

**Target**: External repositories without CLOI installation
**Distribution**: Single binary (~50MB)

```bash
# One-command installation
curl -L https://releases.cloi.dev/latest/install.sh | sh

# Immediate usage
cloi-portable execute .cloi/workflows/feature-dev.yml
cloi-portable analyze --error "TypeError: Cannot read property 'length'"
cloi-portable validate --adr-compliance
```

**Components**:
- Embedded portable runtime
- Basic provider registry (Ollama, OpenAI, Claude)
- Core step executors (analysis, generation, validation)
- Repository auto-detection
- Minimal configuration system

### 2. CLOI-Integrated Deployment

**Target**: Projects using full CLOI platform
**Distribution**: Enhanced CLOI installation

```bash
# Rich CLI with full capabilities
cloi workflow execute .cloi/workflows/complex-analysis.yml --session-id=main-dev
cloi adr validate --cross-domain --plugin-compliance
cloi enhance --multi-step --with-rollback
```

**Components**:
- Complete CLOI feature set
- Advanced workflow orchestration
- Full plugin ecosystem
- Session management and state persistence
- Integration with portable runtime via bridge

### 3. Hybrid Deployment

**Target**: Multi-repository coordination
**Distribution**: CLOI orchestrator + portable runtimes

```bash
# Central orchestration with distributed execution
cloi orchestrate --workflow multi-repo-analysis.yml \
  --targets repo-a,repo-b,repo-c \
  --coordinate-results

# Automatic portable runtime deployment
cloi deploy --targets production.json --auto-setup
```

**Components**:
- CLOI central orchestrator
- Distributed portable runtimes
- Cross-repository state coordination
- Result aggregation and reporting

## Implementation Specification

### Portable Runtime Architecture

```
┌─────────────────────────────────────┐
│         Portable Runtime            │
│  ┌─────────────────────────────────┐│
│  │     Workflow Parser (YAML)      ││
│  │   • Schema validation          ││
│  │   • Variable substitution      ││
│  │   • Step dependency resolution ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │   Provider Registry             ││
│  │   • Dynamic provider loading   ││
│  │   • Fallback chain resolution  ││
│  │   • Capability negotiation     ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │   Step Executor Engine          ││
│  │   • Step type resolution       ││
│  │   • Context injection          ││
│  │   • Result aggregation         ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │   Repository Context Builder    ││
│  │   • Auto-detection logic       ││
│  │   • Capability assessment      ││
│  │   • Configuration adaptation   ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Integration with CLOI Platform

```javascript
// CLOI Integration Bridge
class CloiWorkflowBridge {
  constructor(cloiCoordinator) {
    this.coordinator = cloiCoordinator;
    this.portableRuntime = new PortableWorkflowRuntime(
      this.extractPortableProviders()
    );
  }
  
  async executeWithCloiContext(workflow, context) {
    // Enrich context with CLOI session data, plugins, state
    const enrichedContext = await this.coordinator.buildFullContext(context);
    
    // Execute via portable runtime with enhanced capabilities
    return await this.portableRuntime.executeWorkflow(workflow, enrichedContext);
  }
  
  extractPortableProviders() {
    // Extract provider configurations from CLOI's full system
    // Create lightweight provider instances for portable runtime
    return this.coordinator.getProviders().map(p => p.createPortableInstance());
  }
}
```

## Validation Rules

```yaml
# Embedded validation metadata for ADR-driven testing
validation_rules:
  workflow_structure:
    - pattern: ".cloi/workflows/*.yml"
      description: "Workflows must be in .cloi/workflows directory"
      violation_level: "error"
  
  step_executor_contracts:
    - pattern: "implements PortableStepExecutor"
      description: "All step executors must implement standard interface"
      violation_level: "error"
      
  provider_interface:
    - pattern: "implements PortableProvider"
      description: "All providers must implement standard interface"
      violation_level: "error"
      
  portable_boundaries:
    - pattern: "^(?!.*src/core/).*portable.*"
      description: "Portable components cannot import CLOI core modules"
      violation_level: "error"

auto_repair_actions:
  - violation: "missing_workflow_metadata"
    action: "generate_metadata_template"
    template: "workflow_metadata_schema"
    
  - violation: "incompatible_step_contract"
    action: "update_step_interface"
    template: "portable_step_executor_template"
```

## Integration Points

### CLI Integration (ADR-001)
```bash
# Workflow management commands
cloi workflow create --template feature-development --target .cloi/workflows/
cloi workflow validate --workflow .cloi/workflows/feature-dev.yml
cloi workflow execute --workflow feature-dev --input feature_description="Add search"

# Portable deployment
cloi portable package --output cloi-portable-linux-x64
cloi portable deploy --target external-repo --workflow feature-dev.yml
```

### A2A Protocol Extension (ADR-002)
```json
{
  "method": "workflow.execute",
  "params": {
    "workflow_spec": "...",
    "execution_context": "...",
    "coordination_mode": "distributed"
  }
}
```

### Plugin System Integration (ADR-010/011)
- Extend plugin manifest format for portable components
- Create lightweight plugin discovery for external repos
- Develop portable contract validation system

## Performance Targets

### Execution Performance
- **Startup Time**: <5 seconds for portable runtime
- **Workflow Execution**: <30 seconds for typical feature development workflow
- **Memory Usage**: <100MB for standalone deployment
- **Binary Size**: <50MB for complete portable runtime

### Scalability Targets
- **Concurrent Workflows**: 100+ per repository
- **Cross-Repository Coordination**: 1000+ repositories
- **Step Execution**: <2 seconds per step (95th percentile)
- **Provider Response**: <10 seconds for LLM queries

## Security Considerations

### Portable Runtime Security
- **Sandboxed Execution**: Isolated execution environment
- **Resource Limits**: CPU, memory, and disk quotas
- **Network Restrictions**: Limited outbound connections
- **File System Access**: Restricted to repository boundaries

### Credential Management
- **Provider API Keys**: Secure storage with encryption
- **Repository Access**: Read-only by default
- **Cross-Repository**: No credential sharing
- **Audit Logging**: Complete execution trail

## Success Metrics

### Technical Metrics
- **Portability Score**: Successful execution across 10+ repository types
- **Performance Score**: Meeting all performance targets
- **Compatibility Score**: 95%+ workflow success rate
- **Security Score**: Zero security incidents

### Business Metrics  
- **Adoption Rate**: 1000+ external repositories using portable workflows
- **Developer Satisfaction**: 90%+ positive feedback
- **Setup Time**: <5 minutes average deployment time
- **Success Rate**: 85%+ workflow completion rate

## Consequences

### Positive
- **Universal Deployment**: Any repository can use CLOI workflows
- **Lightweight Integration**: Minimal setup and resource requirements
- **Ecosystem Growth**: Enables community workflow sharing
- **CI/CD Integration**: Easy integration with existing pipelines
- **Market Expansion**: Broader adoption through lower barriers

### Negative
- **Complexity Management**: Multiple deployment models to maintain
- **Feature Limitations**: Portable runtime has reduced capabilities
- **Version Synchronization**: Keeping portable and full CLOI aligned
- **Support Overhead**: Broader support requirements
- **Security Surface**: Expanded attack surface with external deployments

### Risk Mitigation
- **Graduated Rollout**: Start with standalone, expand to hybrid
- **Clear Documentation**: Comprehensive guides for each deployment model
- **Automated Testing**: Cross-platform CI/CD validation
- **Security Review**: Regular penetration testing and audits
- **Community Support**: Developer forums and issue tracking

## References

### Research Sources
- Portable Workflow Systems Research (`docs/research/portable-workflow-systems-research.md`)
- ADR-Driven Testing Research (`docs/research/adr-driven-testing-research.md`)
- Industry patterns: Ansible, Terraform, GitHub Actions, Docker

### Related ADRs
- ADR-038: External Project Integration Architecture (federated vision)
- ADR-012: Workflow Engine Architecture (internal foundation)
- ADR-010/011: Plugin system (extensibility patterns)
- ADR-007: LLM Provider Router (provider abstraction)
- ADR-036: ADR-Driven Testing (validation framework)

---

**Date**: 2025-01-29
**Status**: Proposed → Under Review
**Dependencies**: ADR-038 (External Project Integration)
**Next Steps**: Begin Phase 1 implementation with standalone deployment model