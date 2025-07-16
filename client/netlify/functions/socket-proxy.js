const { Server } = require('socket.io');
const { createServer } = require('http');

// Create a simple proxy server for Socket.IO
exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: ''
    };
  }

  // For Socket.IO polling requests
  if (event.path && event.path.includes('socket.io')) {
    try {
      const backendUrl = 'https://metaverse-project-3.onrender.com';
      const targetUrl = `${backendUrl}${event.path}`;
      
      // Forward the request to the backend
      const response = await fetch(targetUrl, {
        method: event.httpMethod,
        headers: {
          'Content-Type': 'application/json',
          'Origin': event.headers.origin || 'https://mverse91.netlify.app'
        },
        body: event.body
      });

      const data = await response.text();
      
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Credentials': 'true',
          'Content-Type': response.headers.get('content-type') || 'application/json'
        },
        body: data
      };
    } catch (error) {
      console.error('Proxy error:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Proxy error', message: error.message })
      };
    }
  }

  // For health check and other API requests
  try {
    const backendUrl = 'https://metaverse-project-3.onrender.com';
    const targetUrl = `${backendUrl}${event.path}`;
    
    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/json',
        'Origin': event.headers.origin || 'https://mverse91.netlify.app'
      },
      body: event.body
    });

    const data = await response.text();
    
    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': response.headers.get('content-type') || 'application/json'
      },
      body: data
    };
  } catch (error) {
    console.error('API proxy error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'API proxy error', message: error.message })
    };
  }
}; 