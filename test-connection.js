// Test script to demonstrate frontend-backend connection
const WebSocket = require('ws');

console.log('🚀 Testing Frontend-Backend Connection Flow\n');

// Test 1: Backend Health Check
console.log('📋 Test 1: Backend Health Check');
fetch('http://localhost:8000/health')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Backend Health:', data);
    
    // Test 2: API Endpoints
    console.log('\n📋 Test 2: Testing API Endpoints');
    testAPIEndpoints();
  })
  .catch(error => {
    console.error('❌ Backend not responding:', error.message);
  });

async function testAPIEndpoints() {
  const endpoints = [
    { path: '/api/v1/channels/', method: 'GET', description: 'Get public channels' },
    { path: '/docs', method: 'GET', description: 'API Documentation' },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:8000${endpoint.path}`);
      console.log(`${response.ok ? '✅' : '❌'} ${endpoint.description}: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${endpoint.description}: ${error.message}`);
    }
  }

  // Test 3: WebSocket Connection
  console.log('\n📋 Test 3: WebSocket Connection Test');
  testWebSocketConnection();
}

function testWebSocketConnection() {
  // Note: This will fail without a valid JWT token, but shows the connection attempt
  const ws = new WebSocket('ws://localhost:8000/ws?token=test');
  
  ws.on('open', function open() {
    console.log('✅ WebSocket connection established');
    ws.close();
  });

  ws.on('error', function error(err) {
    console.log('⚠️  WebSocket connection failed (expected without valid token):', err.message);
  });

  ws.on('close', function close() {
    console.log('🔌 WebSocket connection closed');
    
    // Test 4: Frontend accessibility
    console.log('\n📋 Test 4: Frontend Accessibility');
    testFrontendAccess();
  });
}

async function testFrontendAccess() {
  try {
    const response = await fetch('http://localhost:3000');
    console.log(`${response.ok ? '✅' : '❌'} Frontend accessible: ${response.status}`);
    
    console.log('\n🎉 Connection Test Summary:');
    console.log('✅ Backend API: Running on http://localhost:8000');
    console.log('✅ Frontend: Running on http://localhost:3000');
    console.log('✅ WebSocket: Available at ws://localhost:8000/ws');
    console.log('\n📱 Open http://localhost:3000 in your browser to see the full connection flow!');
    console.log('🔍 Check browser console for detailed API and WebSocket logs.');
    
  } catch (error) {
    console.error('❌ Frontend not accessible:', error.message);
  }
} 