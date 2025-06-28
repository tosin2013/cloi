// Instead of importing from TypeScript, let's create a simple test
// import { A2AClient } from './a2a-js/src/client/client.js';
import { v4 as uuidv4 } from 'uuid';

async function testA2AClient() {
  try {
    console.log('🔗 Testing A2A client with Cloi server...');
    
    // Create A2A client pointing to our Cloi server
    const client = new A2AClient('http://localhost:9090');
    
    // Test 1: Get Agent Card
    console.log('\n📋 Test 1: Getting Agent Card...');
    const agentCard = await client.getAgentCard();
    console.log('✅ Agent Card received:');
    console.log(`   Name: ${agentCard.name}`);
    console.log(`   Description: ${agentCard.description}`);
    console.log(`   Capabilities: streaming=${agentCard.capabilities?.streaming}, pushNotifications=${agentCard.capabilities?.pushNotifications}`);
    console.log(`   Skills: ${agentCard.skills?.length || 0} available`);
    
    // Test 2: Send a message
    console.log('\n📨 Test 2: Sending message...');
    const messageId = uuidv4();
    const sendParams = {
      message: {
        messageId: messageId,
        role: 'user',
        kind: 'message',
        parts: [
          {
            kind: 'text',
            text: 'Hello from A2A client! Can you analyze this JavaScript error: ReferenceError: x is not defined'
          }
        ]
      },
      configuration: {
        blocking: true,
        acceptedOutputModes: ['text/plain']
      }
    };
    
    const sendResponse = await client.sendMessage(sendParams);
    
    if (sendResponse.error) {
      console.error('❌ Error sending message:', sendResponse.error);
    } else {
      console.log('✅ Message sent successfully');
      const result = sendResponse.result;
      
      if (result.kind === 'task') {
        console.log(`📋 Task created: ${result.id}`);
        console.log(`   Status: ${result.status?.state}`);
        console.log(`   Context: ${result.contextId}`);
        
        // Test 3: Get task status
        console.log('\n📊 Test 3: Getting task status...');
        const getTaskResponse = await client.getTask({ id: result.id });
        
        if (getTaskResponse.error) {
          console.error('❌ Error getting task:', getTaskResponse.error);
        } else {
          console.log('✅ Task retrieved successfully');
          const task = getTaskResponse.result.task;
          console.log(`   Status: ${task.status?.state}`);
          console.log(`   History items: ${task.history?.length || 0}`);
        }
      } else if (result.kind === 'message') {
        console.log('💬 Direct message response received');
        console.log(`   Content: ${result.parts?.[0]?.text?.substring(0, 100)}...`);
      }
    }
    
    console.log('\n✅ A2A client testing completed successfully!');
    
  } catch (error) {
    console.error('❌ A2A client test failed:', error.message);
    console.error('   Full error:', error);
  }
}

testA2AClient();