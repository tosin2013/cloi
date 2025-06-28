# Workflow Diagrams

Visual representations of the four key Cloi workflows.

## Workflow Comparison Matrix

| Aspect | Human + Cloi | Human + LLM + Cloi |
|--------|--------------|-------------------|
| **Speed** | ⚡ Fastest (local only) | 🏃 Fast (network latency) |
| **Intelligence** | 🧠 Local context | 🧠🧠 Local + AI reasoning |
| **Privacy** | 🔒 100% local | 🔓 Depends on LLM |
| **Capabilities** | 📦 Installed plugins | 📦➕ Can create new plugins |
| **Learning** | 📚 Session history | 📚🌍 Global knowledge |

## Detailed Flow Diagrams

### 1. Human + Cloi - Direct Interaction

```
┌─────────┐     ┌──────────────┐     ┌─────────────┐
│ HUMAN   │────▶│     CLOI     │────▶│   PROJECT   │
│Developer│     │ Local Expert │     │ Environment │
└─────────┘     └──────────────┘     └─────────────┘
     │                 │                      │
     │   1. Run CLI    │   2. Analyze        │
     │─────────────────▶                     │
     │                 │──────────────────────▶
     │                 │   3. Execute tools   │
     │                 │◀──────────────────────
     │   4. Present    │                      │
     │◀─────────────────                      │
     │   5. Apply fix  │                      │
     │────────────────────────────────────────▶
```

### 2. Human + LLM + Cloi - Enhanced Collaboration

```
┌─────────┐     ┌─────────┐     ┌──────────────┐     ┌─────────────┐
│ HUMAN   │────▶│   LLM   │────▶│     CLOI     │────▶│   PROJECT   │
│Developer│     │ (Claude)│ A2A │ Local Expert │     │ Environment │
└─────────┘     └─────────┘     └──────────────┘     └─────────────┘
     │               │                 │                      │
     │  1. Ask help  │  2. Connect A2A │                      │
     │───────────────▶─────────────────▶                      │
     │               │  3. Get context │                      │
     │               │◀─────────────────                      │
     │               │  4. Use tools   │                      │
     │               │─────────────────▶──────────────────────▶
     │               │  5. Get results │                      │
     │               │◀─────────────────◀──────────────────────
     │  6. Solution  │                 │                      │
     │◀───────────────                 │                      │
     │  7. Apply     │                 │  8. Validate         │
     │────────────────────────────────────────────────────────▶
```

### 3. New Project Creation Flow

```
┌─────────────────────────────────────────────────────────┐
│                  NEW PROJECT WORKFLOW                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Human + Cloi:                                         │
│  ┌────────┐        ┌────────────┐                     │
│  │ Human  │───────▶│ Cloi: new  │                     │
│  └────────┘        └──────┬─────┘                     │
│                           │                            │
│                           ▼                            │
│                    ┌──────────────┐                   │
│                    │ Check env    │                   │
│                    │ Install deps │                   │
│                    │ Setup tools  │                   │
│                    │ Init git     │                   │
│                    └──────────────┘                   │
│                                                        │
│  Human + LLM + Cloi:                                  │
│  ┌────────┐     ┌─────┐     ┌──────────┐            │
│  │ Human  │────▶│ LLM │────▶│   Cloi   │            │
│  └────────┘     └──┬──┘     └─────┬────┘            │
│                    │              │                   │
│                    ▼              ▼                   │
│              ┌─────────────┐ ┌─────────────┐        │
│              │Design custom│ │Generate base│        │
│              │architecture │ │  project    │        │
│              └──────┬──────┘ └──────┬──────┘        │
│                     │               │                │
│                     ▼               ▼                │
│              ┌──────────────────────────┐           │
│              │  Validate & Test         │           │
│              │  Contribute new plugins  │           │
│              └──────────────────────────┘           │
└─────────────────────────────────────────────────────┘
```

### 4. Debugging Existing Project Flow

```
┌─────────────────────────────────────────────────────────┐
│              DEBUGGING EXISTING PROJECT                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Error Detected                                         │
│       │                                                 │
│       ▼                                                 │
│  ┌─────────┐                                           │
│  │ Human   │──┐                                        │
│  └─────────┘  │                                        │
│               │                                        │
│    Direct ────┼──── AI-Assisted                       │
│       │       │           │                            │
│       ▼       │           ▼                            │
│  ┌────────┐   │     ┌──────────┐                     │
│  │  Cloi  │   │     │   LLM    │                     │
│  └────┬───┘   │     └─────┬────┘                     │
│       │       │           │                           │
│       ▼       │           ▼                           │
│  ┌─────────┐  │     ┌──────────┐                     │
│  │Analyze  │  │     │Connect to│                     │
│  │locally  │  │     │Cloi A2A  │                     │
│  └────┬────┘  │     └─────┬────┘                     │
│       │       │           │                           │
│       │       │           ▼                           │
│       │       │     ┌─────────────┐                  │
│       │       │     │Get context & │                  │
│       │       │     │run analysis  │                  │
│       │       │     └──────┬──────┘                  │
│       │       │            │                          │
│       ▼       │            ▼                          │
│  ┌─────────┐  └────▶┌─────────────┐                 │
│  │Solution │        │Enhanced      │                 │
│  │(local)  │        │Solution      │                 │
│  └─────────┘        │(contextual)  │                 │
│                     └─────────────┘                  │
└─────────────────────────────────────────────────────┘
```

## Workflow Benefits Summary

### 🚀 Speed & Efficiency
- **Human + Cloi**: Instant local analysis
- **Human + LLM + Cloi**: Slightly slower but more intelligent

### 🎯 Accuracy
- **Human + Cloi**: Based on actual project state
- **Human + LLM + Cloi**: Combines local accuracy with global knowledge

### 🔒 Privacy & Security
- **Human + Cloi**: Everything stays local
- **Human + LLM + Cloi**: Cloi acts as privacy layer, only sharing necessary context

### 🌱 Evolution
- **Human + Cloi**: Uses existing plugins
- **Human + LLM + Cloi**: Can create new plugins for community

## Interactive Decision Tree

```
Do you need help with development?
│
├─▶ Is it a simple, local issue?
│   │
│   └─▶ YES ──▶ Use: cloi analyze/fix
│   
├─▶ Do you need creative solutions or complex reasoning?
│   │
│   └─▶ YES ──▶ Use: LLM + Cloi A2A
│
├─▶ Starting a new project?
│   │
│   ├─▶ Standard template? ──▶ Use: cloi new
│   │
│   └─▶ Custom requirements? ──▶ Use: LLM + Cloi A2A
│
└─▶ Contributing back?
    │
    └─▶ Use: LLM + Cloi Layer 2
```

## Real-World Scenarios

### Scenario A: Quick Fix
```bash
# Human + Cloi
$ cloi analyze "undefined is not a function"
# Result in: 5 seconds
```

### Scenario B: Architecture Design
```bash
# Human + LLM + Cloi
$ cloi a2a start
Human: "Design a scalable microservice with event sourcing"
# LLM + Cloi collaborate
# Result in: 30 seconds with full implementation
```

### Scenario C: Performance Optimization
```bash
# Human + LLM + Cloi
Human: "My app is slow in production"
# LLM connects to Cloi
# Runs profilers, analyzes code
# Result: Specific bottlenecks identified with fixes
```

### Scenario D: Learning & Growth
```bash
# LLM discovers missing capability
# Creates new Cloi plugin
# Submits PR to repository
# Community benefits from enhancement
```