# Command Compatibility Matrix

| Command | Interactive CLI | A2A Protocol | Direct CLI Args | Notes |
|---------|----------------|--------------|-----------------|-------|
| /help | ❌ | ⏳ | ⏳ | Error |
| /debug | ❌ | ⏳ | ⏳ | Uh oh, something went wrong: process.stdin.setRawM |
| /analyze | ❌ | ⏳ | ⏳ | Uh oh, something went wrong: stdin.setRawMode is n |
| /index | ❌ | ⏳ | ⏳ | Error |
| /model | ❌ | ⏳ | ⏳ | Error |
| /history | ❌ | ⏳ | ⏳ | Error |
| /environment | ❌ | ⏳ | ⏳ | Error |
| /status | ❌ | ⏳ | ⏳ | ⚠️  Claude provider: No API key configured ⚠️ Some |
| /workflow | ❌ | ⏳ | ⏳ | Uh oh, something went wrong: stdin.setRawMode is n |
| /plugins | ❌ | ⏳ | ⏳ | Uh oh, something went wrong: stdin.setRawMode is n |
| /session | ❌ | ⏳ | ⏳ | Uh oh, something went wrong: stdin.setRawMode is n |
| /config | ❌ | ⏳ | ⏳ | Uh oh, something went wrong: stdin.setRawMode is n |
| /a2a | ❌ | ⏳ | ⏳ | Uh oh, something went wrong: stdin.setRawMode is n |
| /logging | ❌ | ⏳ | ⏳ | Uh oh, something went wrong: process.stdin.setRawM |

## Legend
- ✅ Working
- ❌ Broken  
- ⏳ Not tested yet
- 🚧 In progress

## Test Results Summary
- **Interactive CLI Tests**: 2025-06-28T19:56:04.449Z
- **Total Commands**: 14
- **Working**: 0
- **Broken**: 14

## Next Steps
1. Fix all broken interactive commands
2. Test A2A protocol equivalents  
3. Test direct CLI argument equivalents
4. Update this matrix as fixes are completed
