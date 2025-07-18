import React from 'react';
import { metaverseService } from '../lib/metaverseService';

interface ConnectionDebugProps {
  isConnected: boolean;
  connectionError: string | null;
  isInitialized: boolean;
}

const ConnectionDebug: React.FC<ConnectionDebugProps> = ({ 
  isConnected, 
  connectionError, 
  isInitialized 
}) => {
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      minWidth: '200px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>🔧 Connection Debug</div>
      <div>React State: {isConnected ? '✅ Connected' : '❌ Disconnected'}</div>
      <div>Metaverse Service: {metaverseService.connected ? '✅ Connected' : '❌ Disconnected'}</div>
      <div>Initialized: {isInitialized ? '✅ Yes' : '❌ No'}</div>
      <div>User ID: {metaverseService.id || 'None'}</div>
      <div>Current User: {metaverseService.currentUser?.username || 'None'}</div>
      {connectionError && (
        <div style={{ color: '#ff6b6b', marginTop: '5px' }}>
          Error: {connectionError}
        </div>
      )}
      <button
        onClick={() => {
          console.log('🔄 Manual connection attempt');
          metaverseService.connect().then(() => {
            console.log('✅ Manual connection successful');
          }).catch((error: any) => {
            console.error('❌ Manual connection failed:', error);
          });
        }}
        style={{
          marginTop: '5px',
          padding: '2px 8px',
          fontSize: '10px',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Retry Connection
      </button>
    </div>
  );
};

export default ConnectionDebug; 