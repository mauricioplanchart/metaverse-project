import React, { useState, useEffect } from 'react';
import { useMetaverseStore } from '../stores/useMetaverseStore';
import { socketService } from '../lib/socketService';

interface ProximityChatProps {
  currentUserPosition: any; // Current user's position
  userAvatars: any[]; // All user avatars
}

const ProximityChat: React.FC<ProximityChatProps> = ({ 
  currentUserPosition, 
  userAvatars 
}) => {
  const { 
    currentUserId
  } = useMetaverseStore();
  
  const [nearbyAvatar, setNearbyAvatar] = useState<any>(null);
  const [isInProximity, setIsInProximity] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState('');
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Check proximity to other avatars
  useEffect(() => {
    if (!currentUserPosition || !userAvatars.length) return;

    const proximityDistance = 3; // Distance in units to trigger proximity chat
    
    const checkProximity = () => {
      let closestAvatar = null;
      let closestDistance = Infinity;

      userAvatars.forEach(avatar => {
        if (avatar.userId === currentUserId) return; // Skip self
        
        const distance = currentUserPosition.subtract(avatar.position).length();
        
        if (distance < proximityDistance && distance < closestDistance) {
          closestDistance = distance;
          closestAvatar = avatar;
        }
      });

      if (closestAvatar && closestDistance < proximityDistance) {
        setNearbyAvatar(closestAvatar);
        setIsInProximity(true);
      } else {
        setNearbyAvatar(null);
        setIsInProximity(false);
        setShowChat(false);
      }
    };

    // Check proximity every 500ms
    const interval = setInterval(checkProximity, 500);
    return () => clearInterval(interval);
  }, [currentUserPosition, userAvatars, currentUserId]);

  // Handle proximity chat events
  useEffect(() => {
    if (!nearbyAvatar) return;

    const handleProximityMessage = (data: any) => {
      if (data.fromUserId === nearbyAvatar.userId || data.toUserId === currentUserId) {
        setConversationHistory(prev => [...prev, {
          id: Date.now(),
          fromUserId: data.fromUserId,
          toUserId: data.toUserId,
          message: data.message,
          timestamp: Date.now(),
          isFromMe: data.fromUserId === currentUserId
        }]);
      }
    };

    const handleTypingStatus = (data: any) => {
      if (data.userId === nearbyAvatar.userId) {
        setIsTyping(data.isTyping);
      }
    };

    socketService.on('proximity-message', handleProximityMessage);
    socketService.on('proximity-typing', handleTypingStatus);

    return () => {
      socketService.off('proximity-message', handleProximityMessage);
      socketService.off('proximity-typing', handleTypingStatus);
    };
  }, [nearbyAvatar, currentUserId]);

  const sendProximityMessage = () => {
    if (!message.trim() || !nearbyAvatar) return;

    const messageData = {
      fromUserId: currentUserId,
      toUserId: nearbyAvatar.userId,
      message: message.trim(),
      timestamp: Date.now()
    };

    // Send to server
    socketService.emit('proximity-message', messageData);

    // Add to local conversation
    setConversationHistory(prev => [...prev, {
      ...messageData,
      id: Date.now(),
      isFromMe: true
    }]);

    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendProximityMessage();
    }
  };

  const startTyping = () => {
    socketService.emit('proximity-typing', {
      userId: currentUserId,
      targetUserId: nearbyAvatar?.userId,
      isTyping: true
    });
  };

  const stopTyping = () => {
    socketService.emit('proximity-typing', {
      userId: currentUserId,
      targetUserId: nearbyAvatar?.userId,
      isTyping: false
    });
  };

  if (!isInProximity || !nearbyAvatar) {
    return null;
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: '120px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      border: '2px solid #4CAF50',
      borderRadius: '12px',
      padding: '16px',
      minWidth: '400px',
      maxWidth: '600px',
      zIndex: 1000,
      backdropFilter: 'blur(10px)'
    }}>
      {/* Proximity Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#4CAF50',
            borderRadius: '50%',
            animation: 'pulse 2s infinite'
          }} />
          <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
            Talking to {nearbyAvatar.username}
          </span>
        </div>
        <button
          onClick={() => setShowChat(!showChat)}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px'
          }}
        >
          {showChat ? '−' : '+'}
        </button>
      </div>

      {/* Conversation History */}
      {showChat && (
        <div style={{
          maxHeight: '200px',
          overflowY: 'auto',
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px'
        }}>
          {conversationHistory.length === 0 ? (
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              Start a conversation with {nearbyAvatar.username}...
            </div>
          ) : (
            conversationHistory.map((msg) => (
              <div
                key={msg.id}
                style={{
                  marginBottom: '8px',
                  textAlign: msg.isFromMe ? 'right' : 'left'
                }}
              >
                <div style={{
                  display: 'inline-block',
                  maxWidth: '70%',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  backgroundColor: msg.isFromMe ? '#4CAF50' : 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '14px',
                  wordWrap: 'break-word'
                }}>
                  {msg.message}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginTop: '2px',
                  textAlign: msg.isFromMe ? 'right' : 'left'
                }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
          
          {isTyping && (
            <div style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontStyle: 'italic',
              fontSize: '12px',
              marginTop: '4px'
            }}>
              {nearbyAvatar.username} is typing...
            </div>
          )}
        </div>
      )}

      {/* Message Input */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={startTyping}
          onBlur={stopTyping}
          placeholder={`Message ${nearbyAvatar.username}...`}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            fontSize: '14px'
          }}
        />
        <button
          onClick={sendProximityMessage}
          disabled={!message.trim()}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: message.trim() ? '#4CAF50' : 'rgba(255, 255, 255, 0.2)',
            color: '#fff',
            cursor: message.trim() ? 'pointer' : 'not-allowed',
            fontSize: '14px'
          }}
        >
          Send
        </button>
      </div>

      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default ProximityChat; 