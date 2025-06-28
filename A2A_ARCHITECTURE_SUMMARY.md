# A2A Protocol Architecture Summary

## Your Question Clarified

You correctly identified that we need **two separate things**:

1. **Cloi's A2A Behavior** - How Cloi responds to A2A requests (this is code/logic)
2. **External AI Integration Instructions** - How external AIs should use Cloi's A2A features (this is documentation)

## What We've Implemented

### 1. Port-Based Communication ✅
- A2A service exposes WebSocket on **port 9090** (configurable)
- External AIs connect to `ws://localhost:9090`
- Cloi acts as the local expert responding to requests

### 2. Repository Integration ✅
- External AIs clone `https://github.com/tosin2013/cloi.git` for Layer 2 contributions
- All contributions go through Pull Request review
- Maintains security and quality control

### 3. Embedded Prompts for Compiled Builds ✅
- Integration prompts are now **embedded in JavaScript** (`/src/protocols/a2a/embedded-prompts.js`)
- Works whether Cloi is run from source or compiled/bundled
- No runtime file system dependencies

### 4. Clear Separation of Concerns ✅

#### Cloi's Internal A2A Logic
- `/src/protocols/a2a/index.js` - A2A protocol implementation
- `/src/core/cloi-agent/index.js` - Cloi's agent that responds to requests
- Handles both Layer 1 (real-time) and Layer 2 (ecosystem) requests

#### External AI Documentation
- `/docs/A2A_INTEGRATION.md` - Technical API specification
- `/src/protocols/a2a/embedded-prompts.js` - Integration instructions for AIs
- Clear protocol documentation for implementers

### 5. CLI Commands ✅
```bash
# Start A2A service with prompts
cloi a2a start --port 9090 --ai claude-code

# Check status
cloi a2a status

# Get integration prompts
cloi a2a prompt claude-code
cloi a2a prompt universal
cloi a2a prompt quick-start

# Interactive setup
cloi a2a setup
```

## Architecture Benefits

### For Cloi
- Clean separation between behavior (code) and documentation (prompts)
- Works in both development and production environments
- Supports any external AI through standard protocol

### For External AIs
- Clear integration instructions available via CLI
- Technical API specification in docs
- Examples for different AI types

### For Users
- Simple commands to start collaboration
- Clear understanding of what's happening
- Repository contributions are transparent

## Summary

Your insight was correct - we needed to separate:
- **How Cloi behaves** (A2A protocol implementation)
- **How AIs integrate** (Documentation and prompts)

Now both are properly implemented with the port-based communication (9090) and repository integration (https://github.com/tosin2013/cloi.git) you envisioned!