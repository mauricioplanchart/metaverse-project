import React, { useState, useEffect, useRef } from 'react';
import { useMetaverseStore } from '../stores/useMetaverseStore';
import { metaverseService } from '../lib/metaverseService';

interface EnhancedAvatarInteractionsProps {
  onGesture?: (gesture: string) => void;
  onExpression?: (expression: string) => void;
  onSocialAction?: (action: string, targetUser?: string) => void;
}

interface Gesture {
  name: string;
  icon: string;
  description: string;
  animation: string;
  duration: number;
  category: 'greeting' | 'emotion' | 'action' | 'social';
}

interface Expression {
  name: string;
  icon: string;
  description: string;
  intensity: number;
  duration: number;
}

const EnhancedAvatarInteractions: React.FC<EnhancedAvatarInteractionsProps> = ({
  onGesture,
  onExpression,
  onSocialAction
}) => {
  const { setCurrentEmote, addEmoteToHistory, currentUser, users } = useMetaverseStore();
  const [activeGesture, setActiveGesture] = useState<string | null>(null);
  const [activeExpression, setActiveExpression] = useState<string | null>(null);
  const [showGesturePanel, setShowGesturePanel] = useState(false);
  const [showExpressionPanel, setShowExpressionPanel] = useState(false);
  const [showSocialPanel, setShowSocialPanel] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const expressionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced gestures with categories
  const gestures: Gesture[] = [
    // Greeting gestures
    { name: 'wave', icon: '👋', description: 'Wave hello', animation: 'wave', duration: 3000, category: 'greeting' },
    { name: 'bow', icon: '🙇', description: 'Bow respectfully', animation: 'bow', duration: 2000, category: 'greeting' },
    { name: 'salute', icon: '✋', description: 'Military salute', animation: 'salute', duration: 1500, category: 'greeting' },
    { name: 'handshake', icon: '🤝', description: 'Offer handshake', animation: 'handshake', duration: 4000, category: 'greeting' },
    
    // Emotional gestures
    { name: 'clap', icon: '👏', description: 'Clap hands', animation: 'clap', duration: 2000, category: 'emotion' },
    { name: 'thumbsup', icon: '👍', description: 'Thumbs up', animation: 'thumbsup', duration: 1500, category: 'emotion' },
    { name: 'peace', icon: '✌️', description: 'Peace sign', animation: 'peace', duration: 2000, category: 'emotion' },
    { name: 'flex', icon: '💪', description: 'Flex muscles', animation: 'flex', duration: 3000, category: 'emotion' },
    { name: 'facepalm', icon: '🤦', description: 'Face palm', animation: 'facepalm', duration: 2000, category: 'emotion' },
    { name: 'shrug', icon: '🤷', description: 'Shrug shoulders', animation: 'shrug', duration: 1500, category: 'emotion' },
    
    // Action gestures
    { name: 'point', icon: '👆', description: 'Point direction', animation: 'point', duration: 2000, category: 'action' },
    { name: 'beckon', icon: '👋', description: 'Come here', animation: 'beckon', duration: 2000, category: 'action' },
    { name: 'stop', icon: '✋', description: 'Stop signal', animation: 'stop', duration: 1500, category: 'action' },
    { name: 'think', icon: '🤔', description: 'Thinking pose', animation: 'think', duration: 4000, category: 'action' },
    
    // Social gestures
    { name: 'hug', icon: '🤗', description: 'Offer hug', animation: 'hug', duration: 5000, category: 'social' },
    { name: 'highfive', icon: '🖐️', description: 'High five', animation: 'highfive', duration: 2000, category: 'social' },
    { name: 'fistbump', icon: '👊', description: 'Fist bump', animation: 'fistbump', duration: 1500, category: 'social' },
    { name: 'dance', icon: '💃', description: 'Dance move', animation: 'dance', duration: 6000, category: 'social' }
  ];

  // Enhanced expressions with intensity
  const expressions: Expression[] = [
    { name: 'happy', icon: '😊', description: 'Happy smile', intensity: 0.8, duration: 5000 },
    { name: 'laugh', icon: '😄', description: 'Laughing', intensity: 1.0, duration: 3000 },
    { name: 'sad', icon: '😢', description: 'Sad face', intensity: 0.7, duration: 4000 },
    { name: 'angry', icon: '😠', description: 'Angry face', intensity: 0.9, duration: 3000 },
    { name: 'surprised', icon: '😲', description: 'Surprised', intensity: 0.8, duration: 2000 },
    { name: 'wink', icon: '😉', description: 'Wink', intensity: 0.6, duration: 1500 },
    { name: 'confused', icon: '😕', description: 'Confused', intensity: 0.7, duration: 3000 },
    { name: 'love', icon: '🥰', description: 'Love eyes', intensity: 0.9, duration: 4000 },
    { name: 'cool', icon: '😎', description: 'Cool shades', intensity: 0.8, duration: 3000 },
    { name: 'sleepy', icon: '😴', description: 'Sleepy', intensity: 0.6, duration: 5000 }
  ];

  // Social actions
  const socialActions = [
    { name: 'follow', icon: '👥', description: 'Follow user', action: 'follow' },
    { name: 'invite', icon: '📨', description: 'Send invitation', action: 'invite' },
    { name: 'gift', icon: '🎁', description: 'Send gift', action: 'gift' },
    { name: 'challenge', icon: '⚔️', description: 'Challenge to game', action: 'challenge' },
    { name: 'trade', icon: '🔄', description: 'Request trade', action: 'trade' },
    { name: 'party', icon: '🎉', description: 'Invite to party', action: 'party' }
  ];

  // Find nearby users
  useEffect(() => {
    if (currentUser && users) {
      const nearby = Object.values(users).filter((user: any) => {
        if (user.id === currentUser.id) return false;
        
        // Calculate distance (simplified - in real app would use actual positions)
        const distance = Math.random() * 10; // Placeholder
        return distance < 5; // Within 5 units
      });
      
      setNearbyUsers(nearby);
    }
  }, [currentUser, users]);

  // Perform gesture
  const performGesture = (gesture: Gesture) => {
    if (activeGesture) return; // Prevent overlapping gestures

    console.log('🎭 Performing gesture:', gesture.name);
    setActiveGesture(gesture.name);
    setCurrentEmote(gesture.name);
    addEmoteToHistory(gesture.name);
    
    // Call gesture callback
    onGesture?.(gesture.name);
    
    // Send to server
    metaverseService.interact('gesture');
    
    // Auto-clear gesture after duration
    gestureTimeoutRef.current = setTimeout(() => {
      setActiveGesture(null);
      setCurrentEmote('');
    }, gesture.duration);
    
    setShowGesturePanel(false);
  };

  // Perform expression
  const performExpression = (expression: Expression) => {
    if (activeExpression) return; // Prevent overlapping expressions

    console.log('😊 Performing expression:', expression.name);
    setActiveExpression(expression.name);
    setCurrentEmote(expression.name);
    addEmoteToHistory(expression.name);
    
    // Call expression callback
    onExpression?.(expression.name);
    
    // Send to server
    metaverseService.interact('expression');
    
    // Auto-clear expression after duration
    expressionTimeoutRef.current = setTimeout(() => {
      setActiveExpression(null);
      setCurrentEmote('');
    }, expression.duration);
    
    setShowExpressionPanel(false);
  };

  // Perform social action
  const performSocialAction = (action: any) => {
    if (!selectedTarget) {
      console.warn('No target selected for social action');
      return;
    }

    console.log('🤝 Performing social action:', action.name, 'on', selectedTarget);
    
    // Call social action callback
    onSocialAction?.(action.action, selectedTarget);
    
    // Send to server
    metaverseService.interact('social');
    
    setShowSocialPanel(false);
    setSelectedTarget(null);
  };

  // Quick gesture shortcuts
  const quickGestures = gestures.filter(g => ['wave', 'thumbsup', 'clap', 'dance'].includes(g.name));

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
      if (expressionTimeoutRef.current) clearTimeout(expressionTimeoutRef.current);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 space-y-4">
      {/* Quick Gesture Bar */}
      <div className="bg-black bg-opacity-50 rounded-lg p-3">
        <div className="text-white text-sm font-semibold mb-2">Quick Gestures</div>
        <div className="flex gap-2">
          {quickGestures.map((gesture) => (
            <button
              key={gesture.name}
              onClick={() => performGesture(gesture)}
              disabled={activeGesture !== null}
              className={`p-2 rounded-lg text-lg transition-all ${
                activeGesture === gesture.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              } ${activeGesture && activeGesture !== gesture.name ? 'opacity-50' : ''}`}
              title={gesture.description}
            >
              {gesture.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interaction Panel */}
      <div className="bg-black bg-opacity-50 rounded-lg p-4">
        <div className="text-white text-sm font-semibold mb-3">Avatar Interactions</div>
        
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            onClick={() => setShowGesturePanel(!showGesturePanel)}
            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            🎭 Gestures
          </button>
          <button
            onClick={() => setShowExpressionPanel(!showExpressionPanel)}
            className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            😊 Expressions
          </button>
          <button
            onClick={() => setShowSocialPanel(!showSocialPanel)}
            className="p-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            🤝 Social
          </button>
        </div>

        {/* Gesture Panel */}
        {showGesturePanel && (
          <div className="bg-gray-800 rounded-lg p-3 mb-3">
            <div className="text-white text-sm font-semibold mb-2">Gestures</div>
            <div className="grid grid-cols-2 gap-2">
              {gestures.map((gesture) => (
                <button
                  key={gesture.name}
                  onClick={() => performGesture(gesture)}
                  disabled={activeGesture !== null}
                  className={`p-2 rounded text-sm transition-all ${
                    activeGesture === gesture.name
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  } ${activeGesture && activeGesture !== gesture.name ? 'opacity-50' : ''}`}
                  title={gesture.description}
                >
                  <div className="text-lg">{gesture.icon}</div>
                  <div className="text-xs">{gesture.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Expression Panel */}
        {showExpressionPanel && (
          <div className="bg-gray-800 rounded-lg p-3 mb-3">
            <div className="text-white text-sm font-semibold mb-2">Expressions</div>
            <div className="grid grid-cols-2 gap-2">
              {expressions.map((expression) => (
                <button
                  key={expression.name}
                  onClick={() => performExpression(expression)}
                  disabled={activeExpression !== null}
                  className={`p-2 rounded text-sm transition-all ${
                    activeExpression === expression.name
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  } ${activeExpression && activeExpression !== expression.name ? 'opacity-50' : ''}`}
                  title={expression.description}
                >
                  <div className="text-lg">{expression.icon}</div>
                  <div className="text-xs">{expression.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Social Panel */}
        {showSocialPanel && (
          <div className="bg-gray-800 rounded-lg p-3 mb-3">
            <div className="text-white text-sm font-semibold mb-2">Social Actions</div>
            
            {/* Target Selection */}
            <div className="mb-3">
              <div className="text-white text-xs mb-1">Select Target:</div>
              <select
                value={selectedTarget || ''}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="w-full p-2 bg-gray-700 text-white rounded text-sm"
              >
                <option value="">Choose a user...</option>
                {nearbyUsers.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.username || user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Social Actions */}
            <div className="grid grid-cols-2 gap-2">
              {socialActions.map((action) => (
                <button
                  key={action.name}
                  onClick={() => performSocialAction(action)}
                  disabled={!selectedTarget}
                  className={`p-2 rounded text-sm transition-all ${
                    selectedTarget
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                  title={action.description}
                >
                  <div className="text-lg">{action.icon}</div>
                  <div className="text-xs">{action.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current Status */}
        <div className="text-white text-xs">
          {activeGesture && <div>🎭 Gesturing: {activeGesture}</div>}
          {activeExpression && <div>😊 Expressing: {activeExpression}</div>}
          {selectedTarget && <div>🎯 Target: {nearbyUsers.find(u => u.id === selectedTarget)?.username}</div>}
        </div>
      </div>
    </div>
  );
};

export default EnhancedAvatarInteractions; 