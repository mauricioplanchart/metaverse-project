import React from 'react';

interface LoadingScreenProps {
  progress: number;
  message: string;
  isVisible: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, message, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 z-50 flex items-center justify-center">
      <div className="text-center text-white">
        {/* Logo/Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Metaverse
          </h1>
          <p className="text-lg text-gray-300">Loading your virtual world...</p>
        </div>

        {/* Progress Bar */}
        <div className="w-80 mx-auto mb-6">
          <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-400">
            {progress.toFixed(0)}% Complete
          </div>
        </div>

        {/* Loading Message */}
        <div className="text-gray-300 mb-8">
          <p className="text-lg">{message}</p>
        </div>

        {/* Animated Dots */}
        <div className="flex justify-center space-x-2">
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        {/* Tips */}
        <div className="mt-8 text-sm text-gray-400 max-w-md mx-auto">
          <p>💡 Tip: Use WASD keys to move around once loaded</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 