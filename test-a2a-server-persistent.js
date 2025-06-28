import A2AProtocol from './src/protocols/a2a/index.js';

async function startPersistentA2AServer() {
  try {
    console.log('🚀 Starting persistent A2A server for testing...');
    
    const server = new A2AProtocol({ 
      networking: { port: 9090, host: 'localhost' } 
    });
    
    await server.start();
    console.log('✅ A2A server started successfully on port 9090');
    console.log('🔗 Agent Card: http://localhost:9090/.well-known/agent.json');
    console.log('📡 JSON-RPC endpoint: http://localhost:9090/');
    console.log('💾 Health check: http://localhost:9090/health');
    console.log('📞 Press Ctrl+C to stop the server');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down A2A server...');
      await server.stop();
      console.log('✅ A2A server stopped');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error starting A2A server:', error);
    process.exit(1);
  }
}

startPersistentA2AServer();