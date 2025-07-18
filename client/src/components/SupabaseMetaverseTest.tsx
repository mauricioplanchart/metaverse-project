import React, { useEffect, useState } from 'react';
import { metaverseService } from '../lib/metaverseService';
import { validateConfig } from '../lib/config';

interface TestMessage {
  id: string;
  message: string;
  timestamp: number;
}

const SupabaseMetaverseTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    runTests();
    setupEventListeners();
    
    return () => {
      metaverseService.removeAllListeners();
    };
  }, []);

  const runTests = async () => {
    const results: string[] = [];
    
    try {
      // Test 1: Configuration validation
      results.push('🔧 Testing configuration...');
      if (!validateConfig()) {
        results.push('❌ Configuration validation failed');
        return;
      }
      results.push('✅ Configuration is valid');

      // Test 2: Connection
      results.push('🔌 Testing connection...');
      await metaverseService.connect();
      results.push('✅ Connected to Supabase Realtime');

      // Test 3: Join world
      results.push('🌍 Testing world join...');
      await metaverseService.joinWorld('main-world', 'TestPlayer');
      results.push('✅ Joined main world');

      setIsConnected(true);
      results.push('🎉 All tests passed! Supabase migration successful!');

    } catch (error) {
      results.push(`❌ Test failed: ${error}`);
    }

    setTestResults(results);
  };

  const setupEventListeners = () => {
    // Listen for avatar updates
    metaverseService.on('avatar-update', (avatar: any) => {
      console.log('🎯 Avatar update received:', avatar);
    });

    // Listen for chat messages
    metaverseService.on('chat-message', (message: any) => {
      console.log('💬 Chat message received:', message);
      setMessages(prev => [...prev, {
        id: message.id,
        message: `${message.username}: ${message.message}`,
        timestamp: message.timestamp
      }]);
    });

    // Listen for user joins
    metaverseService.on('user-joined', (user: any) => {
      console.log('👤 User joined:', user);
    });

    // Listen for connection status
    metaverseService.on('connect', () => {
      console.log('✅ Connected event received');
    });

    metaverseService.on('disconnect', () => {
      console.log('❌ Disconnected event received');
      setIsConnected(false);
    });
  };

  const sendTestMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      await metaverseService.sendMessage(inputMessage);
      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const updateTestPosition = async () => {
    try {
      const position = {
        x: Math.random() * 100,
        y: 0,
        z: Math.random() * 100
      };
      const rotation = {
        x: 0,
        y: Math.random() * 360,
        z: 0
      };

      await metaverseService.updatePosition(position, rotation);
      console.log('📍 Position updated:', position, rotation);
    } catch (error) {
      console.error('Failed to update position:', error);
    }
  };

  const disconnect = () => {
    metaverseService.disconnect();
    setIsConnected(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">
        🚀 Supabase Migration Test
      </h1>

      {/* Test Results */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Test Results</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          {testResults.map((result, index) => (
            <div key={index} className="mb-1 font-mono text-sm">
              {result}
            </div>
          ))}
        </div>
      </div>

      {/* Connection Status */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Connection Status</h2>
        <div className={`inline-block px-4 py-2 rounded-lg font-semibold ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? '✅ Connected' : '❌ Disconnected'}
        </div>
      </div>

      {/* Test Controls */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Test Controls</h2>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={updateTestPosition}
            disabled={!isConnected}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            📍 Update Position
          </button>
          
          <button
            onClick={disconnect}
            disabled={!isConnected}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
          >
            🔌 Disconnect
          </button>
        </div>
      </div>

      {/* Chat Test */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Chat Test</h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a test message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
          />
          <button
            onClick={sendTestMessage}
            disabled={!isConnected || !inputMessage.trim()}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            Send
          </button>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages yet. Send a test message!</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="mb-2 p-2 bg-white rounded border">
                <span className="text-sm text-gray-500">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
                <div>{msg.message}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ul className="text-sm space-y-1">
          <li>• Watch the test results above for connection status</li>
          <li>• Try sending a message to test chat functionality</li>
          <li>• Click "Update Position" to test avatar movement</li>
          <li>• Check the browser console for detailed logs</li>
          <li>• Press F3 to close this test and return to the main app</li>
        </ul>
      </div>
    </div>
  );
};

export default SupabaseMetaverseTest; 