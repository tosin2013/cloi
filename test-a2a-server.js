import A2AProtocol from './src/protocols/a2a/index.js';

async function testA2AServer() {
  try {
    console.log('🚀 Starting A2A server test...');
    
    const server = new A2AProtocol({ 
      networking: { port: 9090, host: 'localhost' } 
    });
    
    await server.start();
    console.log('✅ A2A server started successfully on port 9090');
    
    // Test agent card
    const status = server.getStatus();
    console.log('📊 Server status:', status);
    
    const agentCard = server.getAgentCard();
    console.log('🏷️  Agent card:', agentCard);
    
    // Keep server running for 10 seconds
    setTimeout(async () => {
      await server.stop();
      console.log('✅ A2A server stopped');
      process.exit(0);
    }, 10000);
    
  } catch (error) {
    console.error('❌ Error testing A2A server:', error);
    process.exit(1);
  }
}

testA2AServer();