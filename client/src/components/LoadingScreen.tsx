import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  progress: number;
  message: string;
  error?: string;
  onRetry?: () => void;
  onSkip?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress,
  message,
  error,
  onRetry,
  onSkip
}) => {
  const [showTips, setShowTips] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);

  const tips = [
    "💡 Tip: Use WASD keys to move your avatar",
    "💡 Tip: Click and drag to look around",
    "💡 Tip: Press Enter to open chat",
    "💡 Tip: The closer you are to objects, the more detail you'll see",
    "💡 Tip: Performance automatically adjusts based on your device"
  ];

  useEffect(() => {
    if (progress > 50 && !showTips) {
      setShowTips(true);
    }
  }, [progress, showTips]);

  useEffect(() => {
    if (showTips) {
      const interval = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % tips.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [showTips, tips.length]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center z-50">
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-8 max-w-md mx-4 text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Loading Error</h2>
          <p className="text-red-200 mb-6">{error}</p>
          
          <div className="space-y-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                🔄 Try Again
              </button>
            )}
            
            {onSkip && (
              <button
                onClick={onSkip}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                ⏭️ Skip Loading
              </button>
            )}
          </div>

          <div className="mt-6 text-sm text-red-200">
            <p>If the problem persists:</p>
            <ul className="mt-2 space-y-1 text-left">
              <li>• Check your internet connection</li>
              <li>• Try refreshing the page</li>
              <li>• Clear your browser cache</li>
              <li>• Try a different browser</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center z-50">
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-8 max-w-md mx-4 text-center">
        {/* Logo/Title */}
        <div className="mb-8">
          <div className="text-6xl mb-4">🌍</div>
          <h1 className="text-3xl font-bold text-white mb-2">Metaverse</h1>
          <p className="text-blue-200">Loading your virtual world...</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-blue-200 mb-2">
            <span>{message}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-blue-800 bg-opacity-50 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center mb-6">
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        </div>

        {/* Loading Steps */}
        <div className="text-sm text-blue-200 space-y-1">
          {progress < 20 && <div>🔄 Initializing 3D engine...</div>}
          {progress >= 20 && progress < 40 && <div>✅ 3D engine ready</div>}
          {progress >= 40 && progress < 60 && <div>🔄 Creating world objects...</div>}
          {progress >= 60 && progress < 80 && <div>✅ World objects created</div>}
          {progress >= 80 && progress < 100 && <div>🔄 Finalizing scene...</div>}
          {progress >= 100 && <div>✅ Ready to explore!</div>}
        </div>

        {/* Tips */}
        {showTips && (
          <div className="mt-6 p-4 bg-blue-800 bg-opacity-30 rounded-lg">
            <div className="text-blue-200 text-sm animate-pulse">
              {tips[currentTip]}
            </div>
          </div>
        )}

        {/* Performance Info */}
        <div className="mt-6 text-xs text-blue-300">
          <div className="flex justify-between">
            <span>Loading Time:</span>
            <span>{Math.round(progress / 10)}s</span>
          </div>
          <div className="flex justify-between">
            <span>Estimated Time:</span>
            <span>{progress < 100 ? `${Math.round((100 - progress) / 10)}s remaining` : 'Complete'}</span>
          </div>
        </div>

        {/* Skip Option for slow connections */}
        {progress < 50 && onSkip && (
          <button
            onClick={onSkip}
            className="mt-4 text-blue-300 hover:text-blue-200 text-sm underline"
          >
            Skip to basic mode
          </button>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen; 