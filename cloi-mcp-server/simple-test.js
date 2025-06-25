#!/usr/bin/env node

/**
 * Simple direct test of a tool function
 */

import { CloiCodebaseAnalyzer } from './src/analyzers/codebaseAnalyzer.js';

console.log('🧪 Testing tool directly...\n');

async function testAnalyzer() {
  try {
    const analyzer = new CloiCodebaseAnalyzer();
    
    console.log('📊 Analyzing core module...');
    const result = await analyzer.analyzeModule('core', 'overview');
    
    console.log('✅ Analysis completed!');
    console.log(`📁 Module: ${result.module}`);
    console.log(`📊 Files: ${result.fileCount}`);
    console.log(`🔗 Dependencies: ${result.dependencies.length}`);
    console.log(`📝 Patterns: ${result.patterns.length}`);
    
    console.log('\n🎯 Patterns identified:');
    result.patterns.forEach((pattern, index) => {
      console.log(`   ${index + 1}. ${pattern}`);
    });
    
    console.log('\n✅ Direct tool test: SUCCESS');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testAnalyzer();