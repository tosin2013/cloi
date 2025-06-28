import { v4 as uuidv4 } from 'uuid';

async function testA2AEndpoints() {
  const baseUrl = 'http://localhost:9090';
  
  try {
    console.log('🔗 Testing A2A endpoints with simple HTTP requests...');
    
    // Test 1: Agent Card Discovery
    console.log('\n📋 Test 1: Agent Card Discovery');
    const agentCardResponse = await fetch(`${baseUrl}/.well-known/agent.json`);
    if (!agentCardResponse.ok) {
      throw new Error(`Agent card request failed: ${agentCardResponse.status}`);
    }
    const agentCard = await agentCardResponse.json();
    console.log('✅ Agent Card retrieved successfully');
    console.log(`   Name: ${agentCard.name}`);
    console.log(`   Streaming: ${agentCard.capabilities?.streaming}`);
    console.log(`   Skills: ${agentCard.skills?.length || 0}`);
    
    // Test 2: Health Check
    console.log('\n💚 Test 2: Health Check');
    const healthResponse = await fetch(`${baseUrl}/health`);
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    const health = await healthResponse.json();
    console.log('✅ Health check passed');
    console.log(`   Agent ID: ${health.agentId}`);
    console.log(`   Uptime: ${Math.round(health.uptime / 1000)}s`);
    
    // Test 3: JSON-RPC Message Send
    console.log('\n📨 Test 3: JSON-RPC Message Send');
    const messageId = uuidv4();
    const jsonRpcRequest = {
      jsonrpc: '2.0',
      method: 'message/send',
      params: {
        message: {
          messageId: messageId,
          role: 'user',
          kind: 'message',
          parts: [
            {
              kind: 'text',
              text: 'Hello! Can you analyze this error: ReferenceError: x is not defined'
            }
          ]
        },
        configuration: {
          blocking: true,
          acceptedOutputModes: ['text/plain']
        }
      },
      id: 1
    };
    
    const rpcResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(jsonRpcRequest)
    });
    
    if (!rpcResponse.ok) {
      const errorText = await rpcResponse.text();
      console.error(`❌ RPC request failed: ${rpcResponse.status}`);
      console.error(`   Response: ${errorText}`);
    } else {
      const rpcResult = await rpcResponse.json();
      console.log('✅ JSON-RPC request succeeded');
      
      if (rpcResult.error) {
        console.error(`❌ RPC Error: ${rpcResult.error.message} (Code: ${rpcResult.error.code})`);
      } else {
        console.log(`📋 Result type: ${rpcResult.result?.taskId ? 'Task' : 'Message'}`);
        if (rpcResult.result?.taskId) {
          console.log(`   Task ID: ${rpcResult.result.taskId}`);
          
          // Test 4: Get Task Status
          console.log('\n📊 Test 4: Get Task Status');
          const taskRequest = {
            jsonrpc: '2.0',
            method: 'tasks/get',
            params: {
              taskId: rpcResult.result.taskId
            },
            id: 2
          };
          
          const taskResponse = await fetch(baseUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(taskRequest)
          });
          
          if (taskResponse.ok) {
            const taskResult = await taskResponse.json();
            if (taskResult.error) {
              console.error(`❌ Task Error: ${taskResult.error.message}`);
            } else {
              console.log('✅ Task retrieved successfully');
              console.log(`   Task State: ${taskResult.result?.task?.status?.state || 'unknown'}`);
            }
          }
        }
        
        if (rpcResult.result?.message) {
          console.log(`💬 Message: ${rpcResult.result.message.parts?.[0]?.text?.substring(0, 100)}...`);
        }
      }
    }
    
    console.log('\n✅ A2A endpoint testing completed!');
    
  } catch (error) {
    console.error('❌ A2A test failed:', error.message);
  }
}

testA2AEndpoints();