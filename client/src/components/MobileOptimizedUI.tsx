import React, { useState, useEffect } from 'react';
import { useMetaverseStore } from '../stores/useMetaverseStore';

interface MobileOptimizedUIProps {
  onMovementChange: (direction: string) => void;
  onChatToggle: () => void;
  onSettingsToggle: () => void;
}

const MobileOptimizedUI: React.FC<MobileOptimizedUIProps> = ({
  onMovementChange,
  onChatToggle,
  onSettingsToggle
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const { isConnected, users } = useMetaverseStore();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || 
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* Top Status Bar */}
      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 pointer-events-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-sm font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="text-sm">
            {users ? Object.keys(users).length : 0} online
          </div>
        </div>
      </div>

      {/* Movement Controls */}
      {showControls && (
        <div className="absolute bottom-20 left-4 pointer-events-auto">
          <div className="bg-black bg-opacity-50 rounded-full p-4">
            <div className="grid grid-cols-3 gap-2">
              {/* Forward */}
              <button
                className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-xl font-bold"
                onTouchStart={() => onMovementChange('forward')}
                onTouchEnd={() => onMovementChange('stop')}
                onMouseDown={() => onMovementChange('forward')}
                onMouseUp={() => onMovementChange('stop')}
              >
                ↑
              </button>
              
              {/* Left */}
              <button
                className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-xl font-bold"
                onTouchStart={() => onMovementChange('left')}
                onTouchEnd={() => onMovementChange('stop')}
                onMouseDown={() => onMovementChange('left')}
                onMouseUp={() => onMovementChange('stop')}
              >
                ←
              </button>
              
              {/* Right */}
              <button
                className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-xl font-bold"
                onTouchStart={() => onMovementChange('right')}
                onTouchEnd={() => onMovementChange('stop')}
                onMouseDown={() => onMovementChange('right')}
                onMouseUp={() => onMovementChange('stop')}
              >
                →
              </button>
              
              {/* Backward */}
              <button
                className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-xl font-bold col-start-2"
                onTouchStart={() => onMovementChange('backward')}
                onTouchEnd={() => onMovementChange('stop')}
                onMouseDown={() => onMovementChange('backward')}
                onMouseUp={() => onMovementChange('stop')}
              >
                ↓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <div className="flex flex-col space-y-2">
          <button
            className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white text-lg"
            onClick={onChatToggle}
          >
            💬
          </button>
          
          <button
            className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white text-lg"
            onClick={onSettingsToggle}
          >
            ⚙️
          </button>
          
          <button
            className="w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white text-lg"
            onClick={() => setShowControls(!showControls)}
          >
            {showControls ? '👁️' : '🎮'}
          </button>
        </div>
      </div>

      {/* Performance Indicator */}
      <div className="absolute top-12 right-4 pointer-events-auto">
        <div className="bg-black bg-opacity-50 rounded-lg p-2 text-white text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>60 FPS</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="absolute top-20 left-4 pointer-events-auto">
        <div className="bg-black bg-opacity-50 rounded-lg p-2">
          <div className="text-white text-xs space-y-1">
            <div className="flex items-center space-x-2">
              <span>👆</span>
              <span>Tap to look</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>🎮</span>
              <span>Move controls</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>💬</span>
              <span>Chat nearby</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileOptimizedUI; 