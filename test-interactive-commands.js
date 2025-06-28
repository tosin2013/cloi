#!/usr/bin/env node
/**
 * Interactive Command Audit Script
 * Tests all interactive commands to identify which ones work vs broken
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const COMMANDS_TO_TEST = [
  '/help',
  '/debug',
  '/analyze',
  '/index', 
  '/model',
  '/history',
  '/environment',
  '/status',
  '/workflow',
  '/plugins',
  '/session',
  '/config',
  '/a2a',
  '/logging'
];

const TEST_RESULTS = {};

async function testInteractiveCommand(command) {
  return new Promise((resolve) => {
    console.log(`🧪 Testing command: ${command}`);
    
    const child = spawn('node', ['src/cli/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000
    });
    
    let stdout = '';
    let stderr = '';
    let hasOutput = false;
    let hasError = false;
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
      hasOutput = true;
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
      hasError = true;
    });
    
    // Send the command
    setTimeout(() => {
      child.stdin.write(command + '\n');
    }, 1000);
    
    // Send exit command
    setTimeout(() => {
      child.stdin.write('exit\n');
    }, 3000);
    
    child.on('close', (code) => {
      resolve({
        command,
        code,
        stdout,
        stderr,
        hasOutput,
        hasError,
        success: code === 0 && hasOutput && !hasError
      });
    });
    
    child.on('error', (error) => {
      resolve({
        command,
        code: -1,
        stdout,
        stderr: error.message,
        hasOutput: false,
        hasError: true,
        success: false
      });
    });
    
    // Timeout fallback
    setTimeout(() => {
      child.kill();
      resolve({
        command,
        code: -2,
        stdout,
        stderr: 'Test timeout',
        hasOutput,
        hasError: true,
        success: false
      });
    }, 12000);
  });
}

async function runAudit() {
  console.log('🔍 Starting Interactive Command Audit...\n');
  
  const results = [];
  
  for (const command of COMMANDS_TO_TEST) {
    try {
      const result = await testInteractiveCommand(command);
      results.push(result);
      
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${status} - ${command}`);
      
      if (!result.success) {
        console.log(`      Error: ${result.stderr.substring(0, 100)}...`);
      }
      
      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`   ❌ FAIL - ${command} (Exception: ${error.message})`);
      results.push({
        command,
        success: false,
        error: error.message
      });
    }
  }
  
  // Generate compatibility matrix
  await generateCompatibilityMatrix(results);
  
  console.log('\n📊 Audit Summary:');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`   ✅ Working commands: ${passed}/${COMMANDS_TO_TEST.length}`);
  console.log(`   ❌ Broken commands: ${failed}/${COMMANDS_TO_TEST.length}`);
  
  if (failed > 0) {
    console.log('\n🔧 Broken commands that need fixing:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   • ${r.command} - ${r.stderr?.substring(0, 80) || 'Unknown error'}...`);
      });
  }
  
  console.log('\n📄 Full results saved to: interactive-command-audit.json');
  console.log('📊 Compatibility matrix saved to: COMMAND_COMPATIBILITY_MATRIX.md');
}

async function generateCompatibilityMatrix(results) {
  const matrix = `# Command Compatibility Matrix

| Command | Interactive CLI | A2A Protocol | Direct CLI Args | Notes |
|---------|----------------|--------------|-----------------|-------|
${results.map(r => {
  const status = r.success ? '✅' : '❌';
  const notes = r.success ? 'Working' : (r.stderr?.substring(0, 50) || 'Error').replace(/\n/g, ' ');
  return `| ${r.command} | ${status} | ⏳ | ⏳ | ${notes} |`;
}).join('\n')}

## Legend
- ✅ Working
- ❌ Broken  
- ⏳ Not tested yet
- 🚧 In progress

## Test Results Summary
- **Interactive CLI Tests**: ${new Date().toISOString()}
- **Total Commands**: ${results.length}
- **Working**: ${results.filter(r => r.success).length}
- **Broken**: ${results.filter(r => !r.success).length}

## Next Steps
1. Fix all broken interactive commands
2. Test A2A protocol equivalents  
3. Test direct CLI argument equivalents
4. Update this matrix as fixes are completed
`;

  await fs.writeFile('COMMAND_COMPATIBILITY_MATRIX.md', matrix);
  await fs.writeFile('interactive-command-audit.json', JSON.stringify(results, null, 2));
}

// Run the audit
runAudit().catch(console.error);