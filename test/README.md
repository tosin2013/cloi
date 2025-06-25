# Cloi Testing

This directory contains tests for the Cloi project. Currently focused on Ollama integration testing.

## Prerequisites

### For Local Testing
1. **Ollama installed and running**:
   ```bash
   # Install Ollama (if not already installed)
   curl -fsSL https://ollama.com/install.sh | sh
   
   # Start Ollama service
   ollama serve
   ```

2. **At least one model available**:
   ```bash
   # Pull a lightweight model for testing
   ollama pull phi3.5:latest
   # OR
   ollama pull llama3.2:1b
   ```

## Running Tests

### Local Testing
```bash
# Run all tests
npm test

# Run Ollama-specific tests
npm run test:ollama

# Run tests directly
node test/ollama.test.js
```

### GitHub Actions Testing
The Ollama integration tests run automatically in GitHub Actions:
- On push to `main` or `develop` branches
- On pull requests to `main`
- Weekly scheduled runs (Mondays at 6 AM UTC)
- Manual workflow dispatch

## Test Coverage

### Current Tests
1. **Model Availability Check** - Verifies Ollama models can be listed
2. **Model Availability Validation** - Ensures specific models are available
3. **Basic Error Analysis** - Tests core LLM integration
4. **JavaScript Error Analysis** - Tests JavaScript-specific error handling
5. **Python Error Analysis** - Tests Python-specific error handling

### GitHub Actions Tests
The CI includes additional comprehensive tests:
- **Ollama Installation** - Installs and starts Ollama service
- **Model Download** - Downloads test models automatically
- **API Connectivity** - Tests direct Ollama API communication
- **Cloi Integration** - Tests end-to-end Cloi functionality
- **Performance Testing** - Tests response times and memory usage
- **Multi-Model Testing** - Tests compatibility with different models

## Test Models

The tests use lightweight, fast models for efficiency:
- `phi3.5:latest` (Primary test model)
- `llama3.2:1b` (Alternative/compatibility testing)
- `qwen2.5:1.5b` (Additional compatibility testing)

## Adding New Tests

To add new tests, modify `test/ollama.test.js`:

```javascript
// Add a new test
runner.test('Your test name', async () => {
  // Your test logic here
  const result = await someFunction();
  
  if (!result.expectedProperty) {
    throw new Error('Test failed: expected property not found');
  }
  
  console.log('   Test completed successfully');
});
```

## Troubleshooting

### Common Issues

1. **"No models available for testing"**
   - Ensure Ollama is running: `ollama serve`
   - Pull a test model: `ollama pull phi3.5:latest`

2. **"Connection refused" errors**
   - Check if Ollama is running on port 11434
   - Verify firewall settings

3. **Model download timeouts**
   - Check internet connection
   - Try a smaller model first

### Debug Mode

Run tests with verbose output:
```bash
DEBUG=1 node test/ollama.test.js
```

## Future Enhancements

Planned test additions:
- [ ] Unit tests for individual modules
- [ ] Integration tests for CodeBERT service
- [ ] End-to-end CLI testing
- [ ] Performance regression testing
- [ ] Code coverage reporting
- [ ] Mock testing for offline scenarios 