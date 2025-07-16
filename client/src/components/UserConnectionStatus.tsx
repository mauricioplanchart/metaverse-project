import React from 'react';
import { useMetaverseStore } from '../stores/useMetaverseStore';

const UserConnectionStatus: React.FC = () => {
  const { 
    isConnected, 
    currentUser, 
    onlineUsers, 
    currentUserId,
    avatarCustomization 
  } = useMetaverseStore();

  if (!isConnected) {
    return null;
  }

  return (
    <div style={{
      position: 'absolute',
      top: '60px',
      left: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      maxWidth: '300px',
      zIndex: 1000
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        🌍 Multiplayer Status
      </div>
      
      <div style={{ marginBottom: '4px' }}>
        🔗 Connected: {isConnected ? '✅' : '❌'}
      </div>
      
      <div style={{ marginBottom: '4px' }}>
        👤 Your ID: {currentUserId || 'Loading...'}
      </div>
      
      <div style={{ marginBottom: '4px' }}>
        👥 Online Users: {onlineUsers.length}
      </div>
      
      {onlineUsers.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            👥 Connected Users:
          </div>
          {onlineUsers.map((user) => (
            <div 
              key={user.id} 
              style={{ 
                marginBottom: '2px',
                color: user.id === currentUserId ? '#4CAF50' : '#fff'
              }}
            >
              {user.id === currentUserId ? '→ ' : '• '}
              {user.username || `Player_${user.id}`}
              {user.id === currentUserId ? ' (You)' : ''}
            </div>
          ))}
        </div>
      )}
      
      {currentUser && (
        <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.8 }}>
          <div>🎨 Avatar: {avatarCustomization.bodyColor}</div>
          <div>👕 Clothing: {avatarCustomization.clothingType}</div>
          <div>💇 Hair: {avatarCustomization.hairStyle}</div>
        </div>
      )}
      
      <div style={{ 
        marginTop: '8px', 
        fontSize: '10px', 
        opacity: 0.6,
        borderTop: '1px solid rgba(255,255,255,0.2)',
        paddingTop: '4px'
      }}>
        💡 Press F2 to customize avatar
      </div>
    </div>
  );
};

export default UserConnectionStatus; 