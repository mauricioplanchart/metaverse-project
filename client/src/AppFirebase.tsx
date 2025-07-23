import React, { useState, useEffect } from 'react';
import FirebaseBabylonScene from './components/FirebaseBabylonScene';
import { firebaseService } from './lib/firebaseService';
import { getFirebaseEnvironmentInfo } from './lib/firebase';
import ErrorBoundary from './components/ErrorBoundary';

const AppFirebase: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean
    error: string | null
    isInitializing: boolean
  }>({
    isConnected: false,
    error: null,
    isInitializing: true
  });

  const [showConfig, setShowConfig] = useState(false);
  const envInfo = getFirebaseEnvironmentInfo();

  useEffect(() => {
    console.log('🔥 Firebase App component initializing...');
    
    const initializeApp = async () => {
      try {
        setConnectionStatus(prev => ({ ...prev, isInitializing: true }));

        // Test Firebase connection
        const connected = await firebaseService.testConnection();
        
        if (connected) {
          console.log('✅ Firebase connected successfully');
          setConnectionStatus({
            isConnected: true,
            error: null,
            isInitializing: false
          });
        } else {
          console.log('❌ Firebase connection failed');
          setConnectionStatus({
            isConnected: false,
            error: 'Failed to connect to Firebase',
            isInitializing: false
          });
        }
      } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        setConnectionStatus({
          isConnected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          isInitializing: false
        });
      }
    };

    initializeApp();

    return () => {
      firebaseService.cleanup();
    };
  }, []);

  if (connectionStatus.isInitializing) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">🔥</div>
          <div className="text-xl mb-2">Initializing Firebase...</div>
          <div className="text-sm opacity-75">Setting up real-time connections</div>
        </div>
      </div>
    );
  }

  if (!connectionStatus.isConnected && !envInfo.hasValidConfig) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center text-white p-8">
          <div className="text-4xl mb-4">🔧</div>
          <h1 className="text-3xl font-bold mb-4">Firebase Configuration Required</h1>
          <div className="text-left bg-black bg-opacity-50 p-4 rounded mb-4">
            <p className="mb-2">Please set up your Firebase configuration:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Create a Firebase project at <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">Firebase Console</a></li>
              <li>Enable Authentication, Firestore, and Realtime Database</li>
              <li>Create a <code className="bg-gray-800 px-1 rounded">.env</code> file with your Firebase config:</li>
            </ol>
            <pre className="bg-gray-800 p-2 rounded mt-2 text-xs overflow-x-auto">
{`VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456`}
            </pre>
          </div>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
          >
            {showConfig ? 'Hide' : 'Show'} Current Config
          </button>
          {showConfig && (
            <div className="mt-4 text-left bg-black bg-opacity-50 p-4 rounded text-xs">
              <pre>{JSON.stringify(envInfo, null, 2)}</pre>
            </div>
          )}
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="relative w-full h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 overflow-hidden">
        {/* Main Firebase Babylon.js Scene */}
        <FirebaseBabylonScene />

        {/* Connection Status Badge */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
          🔥 Firebase {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
          {connectionStatus.error && (
            <div className="text-red-300 text-xs mt-1">{connectionStatus.error}</div>
          )}
        </div>

        {/* Authentication Panel */}
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded">
          {firebaseService.isAuthenticated() ? (
            <div className="text-sm">
              <div className="text-green-300 mb-1">✅ Signed In</div>
              <div className="text-xs opacity-75">User: {firebaseService.getCurrentUser()?.uid?.substring(0, 8)}...</div>
              <button
                onClick={() => firebaseService.signOut()}
                className="mt-2 bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="text-sm">
              <div className="text-yellow-300 mb-1">⚠️ Not Signed In</div>
              <button
                onClick={() => firebaseService.signInAnonymously()}
                className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
              >
                Sign In Anonymously
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white p-3 rounded text-center">
          <div className="text-sm font-bold mb-1">🎮 Firebase Metaverse</div>
          <div className="text-xs opacity-75">
            Real-time multiplayer with Firebase • WASD to move • Enter to chat
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AppFirebase;