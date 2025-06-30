# CLOI Architecture Overview Map

**Purpose:** Strategic navigation guide for developers to understand how ADRs work together as a coherent system  
**Status:** Active (Updated 2024-12-29)  
**Maintainers:** CLOI Development Team

## 🗺️ Quick Navigator

**"I want to work on..."** → **"Read these ADRs first:"**

| Development Scenario | Primary ADRs | Integration ADRs |
|---------------------|-------------|------------------|
| **Adding Interactive Commands** | ADR-015, ADR-001, ADR-003 | ADR-035 (session), ADR-044 (debug) |
| **Implementing Error Analysis** | ADR-004, ADR-005, ADR-006 | ADR-009 (RAG), ADR-007 (LLM) |
| **Building Debug Features** | ADR-044, ADR-004, ADR-015 | ADR-009 (RAG), ADR-012 (workflow) |
| **Creating Workflow Steps** | ADR-012, ADR-010, ADR-011 | ADR-004 (error analysis), ADR-009 (RAG) |
| **Plugin Development** | ADR-010, ADR-011 | ADR-013 (config), ADR-014 (environment) |
| **RAG/Knowledge Features** | ADR-009, ADR-004, ADR-005 | ADR-006 (multi-language), ADR-008 (prompts) |
| **LLM Integration** | ADR-007, ADR-008, ADR-018 | ADR-009 (RAG), ADR-004 (error analysis) |
| **Configuration Systems** | ADR-013, ADR-014 | ADR-010 (plugins), ADR-035 (session) |
| **Protocol Integration** | ADR-002, ADR-040 | ADR-001 (CLI), ADR-007 (LLM) |
| **Testing & Validation** | ADR-036, ADR-042, ADR-018 | ADR-043 (oversight), ADR-041 (security) |

## 🏗️ Domain Architecture Map

### **Core Processing Domains**

#### 🖥️ **CLI Command Processing Domain**
**Bounded Context:** User interaction, command parsing, session management  
**ADRs:** ADR-001, ADR-003, ADR-015, ADR-044, ADR-035

```
CLI Entry (ADR-003) → Command Processing (ADR-001) → Interactive Commands (ADR-015)
                                   ↓
Session Management (ADR-035) ← → Debug Commands (ADR-044)
```

**Key Integration Points:**
- **Error Analysis Domain:** Debug commands trigger error classification (ADR-044 → ADR-004)
- **Workflow Domain:** Commands can initiate workflows (ADR-015 → ADR-012)
- **Configuration Domain:** CLI behavior configured via ADR-013

#### 🔍 **Error Analysis Domain**
**Bounded Context:** Error detection, classification, context extraction, multi-language analysis  
**ADRs:** ADR-004, ADR-005, ADR-006

```
Error Classification (ADR-004) → Context Extraction (ADR-005) → Multi-Language Analysis (ADR-006)
                ↓                          ↓                              ↓
        CLI Debug Commands         RAG Context Retrieval         LLM Provider Selection
```

**Key Integration Points:**
- **Knowledge Management:** Error context enriched with RAG (ADR-005 → ADR-009)
- **LLM Integration:** Error classification drives LLM selection (ADR-004 → ADR-007)
- **CLI Processing:** Debug commands consume error analysis (ADR-044 → ADR-004)

#### 🧠 **Knowledge Management Domain**
**Bounded Context:** RAG system, embedding models, vector search, context retrieval  
**ADRs:** ADR-009

```
Modern Embedding Models (CodeRankEmbed, jina-code-v2) → Vector Store → Hybrid Search → Context Retrieval
```

**Key Integration Points:**
- **Error Analysis:** Provides context for error understanding (ADR-009 ← ADR-005)
- **LLM Integration:** Enriches prompts with relevant context (ADR-009 → ADR-008)
- **Debug Processing:** Context-aware debugging support (ADR-009 → ADR-044)

#### 🤖 **LLM Integration Domain**
**Bounded Context:** LLM provider routing, prompt management, response quality assessment  
**ADRs:** ADR-007, ADR-008, ADR-018

```
Provider Router (ADR-007) → Prompt Templates (ADR-008) → Response Quality (ADR-018)
           ↓                        ↓                           ↓
    Model Selection          Context Injection          Quality Validation
```

**Key Integration Points:**
- **Error Analysis:** Error type drives model selection (ADR-004 → ADR-007)
- **Knowledge Management:** RAG context injected into prompts (ADR-009 → ADR-008)
- **Workflow Domain:** LLM responses drive workflow decisions (ADR-007 → ADR-012)

### **System Infrastructure Domains**

#### 🔌 **Plugin System Domain**
**Bounded Context:** Plugin discovery, loading, API contracts, lifecycle management  
**ADRs:** ADR-010, ADR-011

```
Plugin Discovery (ADR-010) → API Contracts (ADR-011) → Plugin Execution
           ↓                         ↓                        ↓
   Environment Detection      Type-Safe Interfaces    Configuration Integration
```

**Key Integration Points:**
- **Configuration:** Plugin settings managed via ADR-013
- **Error Analysis:** Plugins provide specialized analyzers (ADR-010 → ADR-004)
- **Workflow:** Plugins contribute workflow steps (ADR-011 → ADR-012)

#### ⚙️ **Workflow Orchestration Domain**
**Bounded Context:** Workflow definition, execution, step coordination, auto-repair  
**ADRs:** ADR-012

```
Workflow Definition → Step Execution → Result Coordination → Auto-Repair Integration
        ↓                   ↓                 ↓                      ↓
   Plugin Integration   Error Handling   State Management    CLI Integration
```

**Key Integration Points:**
- **CLI Processing:** Workflows triggered from commands (ADR-015 → ADR-012)
- **Error Analysis:** Auto-repair workflows use error classification (ADR-012 → ADR-004)
- **Plugin System:** Workflow steps provided by plugins (ADR-012 → ADR-011)

#### ⚙️ **Configuration Management Domain**
**Bounded Context:** Configuration hierarchy, precedence, environment detection  
**ADRs:** ADR-013, ADR-014

```
Environment Detection (ADR-014) → Configuration Hierarchy (ADR-013) → Runtime Configuration
           ↓                              ↓                                ↓
   Context Gathering              Precedence Resolution            Component Configuration
```

**Key Integration Points:**
- **Plugin System:** Plugin configuration managed via ADR-013
- **CLI Processing:** CLI behavior configured via ADR-013
- **Session Management:** Session configuration via ADR-013

### **Quality and Governance Domains**

#### 🛡️ **Testing and Quality Domain**
**Bounded Context:** ADR-driven testing, implementation quality, response assessment  
**ADRs:** ADR-036, ADR-042, ADR-018

```
ADR-Driven Testing (ADR-036) → Quality Governance (ADR-042) → Response Assessment (ADR-018)
         ↓                             ↓                            ↓
   Architecture Validation      Implementation Standards      LLM Quality Metrics
```

**Key Integration Points:**
- **All Domains:** Testing validates cross-domain integration
- **LLM Integration:** Response quality feeds back to provider selection (ADR-018 → ADR-007)

#### 🔒 **Security and Governance Domain**
**Bounded Context:** Self-implementation security, human oversight, autonomous development  
**ADRs:** ADR-041, ADR-043

```
Security Architecture (ADR-041) → Human Oversight (ADR-043) → Autonomous Development
          ↓                             ↓                           ↓
   Implementation Safety         Governance Controls         Quality Assurance
```

### **External Integration Domains**

#### 🌐 **Protocol Integration Domain**
**Bounded Context:** A2A protocol, MCP server, external API integration  
**ADRs:** ADR-002, ADR-040

```
A2A Protocol (ADR-002) → MCP Server (ADR-040) → External Integration
        ↓                       ↓                       ↓
   Multi-AI Coordination    Tool Integration    API Coordination
```

**Key Integration Points:**
- **CLI Processing:** A2A provides alternative interface (ADR-002 → ADR-001)
- **LLM Integration:** A2A coordinates multiple LLM providers (ADR-002 → ADR-007)

#### 🔗 **External Project Domain**
**Bounded Context:** External project integration, portable workflows  
**ADRs:** ADR-038, ADR-039

```
External Integration (ADR-038) → Portable Workflows (ADR-039) → Cross-Project Coordination
         ↓                             ↓                              ↓
   Project Detection            Workflow Portability            Context Adaptation
```

## 🔄 Common Integration Flows

### **Debug Command Flow**
```
User Input (ADR-015) → Debug Command (ADR-044) → Error Classification (ADR-004)
                                   ↓
Context Extraction (ADR-005) → RAG Retrieval (ADR-009) → LLM Analysis (ADR-007)
                                   ↓
Prompt Generation (ADR-008) → Fix Generation → Workflow Execution (ADR-012)
                                   ↓
Session Management (ADR-035) → Result Tracking
```

### **Interactive Command Flow**
```
CLI Entry (ADR-003) → Command Processing (ADR-001) → Interactive Handler (ADR-015)
                                   ↓
Plugin Discovery (ADR-010) → Configuration Loading (ADR-013) → Environment Context (ADR-014)
                                   ↓
Command Execution → Session State Update (ADR-035)
```

### **Error Analysis Flow**
```
Error Input → Classification (ADR-004) → Context Extraction (ADR-005) → Language Detection (ADR-006)
                     ↓                           ↓                           ↓
            LLM Provider Selection (ADR-007)  RAG Context (ADR-009)    Multi-Language Patterns
                     ↓                           ↓                           ↓
            Prompt Generation (ADR-008) → Analysis Response → Quality Assessment (ADR-018)
```

### **Workflow Execution Flow**
```
Trigger Event → Workflow Engine (ADR-012) → Plugin Resolution (ADR-010) → Step Execution
                       ↓                           ↓                        ↓
            Configuration (ADR-013)        API Contracts (ADR-011)    Error Handling (ADR-004)
                       ↓                           ↓                        ↓
            State Management (ADR-035) → Result Coordination → Quality Validation (ADR-042)
```

## 🎯 Integration Hot-Spots

### **High-Frequency Integration Points**
1. **ADR-009 (RAG) ↔ ADR-004/005/006 (Error Analysis)** - Context-aware error understanding
2. **ADR-007 (LLM Router) ↔ ADR-008 (Prompts)** - Dynamic prompt generation with model selection
3. **ADR-015 (Interactive) ↔ ADR-044 (Debug)** - Debug commands in interactive mode
4. **ADR-012 (Workflow) ↔ ADR-010/011 (Plugins)** - Plugin-driven workflow steps
5. **ADR-013 (Config) ↔ All Domains** - Cross-cutting configuration concerns

### **Cross-Cutting Concerns**
- **Configuration Management (ADR-013)**: Affects all domains
- **Session State (ADR-035)**: Shared across CLI, Debug, and Workflow domains
- **Quality Assessment (ADR-018, ADR-042)**: Validates all LLM and implementation outputs
- **Security (ADR-041)**: Governs all external integrations and self-implementation

## 📚 Implementation Journey Maps

**Available Guides:**
- [📖 Adding Interactive Commands](./implementation-guides/adding-interactive-commands.md) - Complete walkthrough for CLI command development

## 🔧 Maintenance and Validation

### **Architecture Consistency Checklist**
- [ ] New ADRs reference affected existing ADRs
- [ ] Integration points explicitly documented
- [ ] Journey maps updated for new scenarios
- [ ] Cross-domain impacts assessed
- [ ] Domain boundaries maintained

---

**Last Updated:** 2024-12-29  
**Related Documents:**
- [📋 ADR Directory](./adr/README.md)
- [🔄 RAG Modernization Impact Analysis](./ADR-RAG-MODERNIZATION-IMPACT-ANALYSIS.md) 