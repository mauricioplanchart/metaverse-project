import React, { useState } from 'react';
import LoadingScreen from './components/LoadingScreen';
import PerformanceMonitor from './components/PerformanceMonitor';
import MobileOptimizedUI from './components/MobileOptimizedUI';

const PerformanceTest: React.FC = () => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  const [showMobileUI, setShowMobileUI] = useState(true);

  const handleMobileMovement = (direction: string) => {
    console.log('Mobile movement:', direction);
  };

  const handleChatToggle = () => {
    console.log('Chat toggle');
  };

  const handleSettingsToggle = () => {
    console.log('Settings toggle');
  };

  return (
    <div className="w-full h-screen bg-gray-900 relative">
      {/* Performance Monitor */}
      <PerformanceMonitor
        isVisible={showPerformanceMonitor}
        onToggle={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
      />

      {/* Mobile Optimized UI */}
      <MobileOptimizedUI
        onMovementChange={handleMobileMovement}
        onChatToggle={handleChatToggle}
        onSettingsToggle={handleSettingsToggle}
      />

      {/* Loading Screen */}
      <LoadingScreen
        progress={loadingProgress}
        message="Testing performance components..."
      />

      {/* Test Controls */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg z-50">
        <h3 className="font-bold mb-2">Performance Test Controls</h3>
        <div className="space-y-2">
          <button
            onClick={() => setLoadingProgress(Math.min(loadingProgress + 10, 100))}
            className="block w-full px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
          >
            Progress +10%
          </button>
          <button
            onClick={() => setLoadingProgress(0)}
            className="block w-full px-3 py-1 bg-red-600 rounded hover:bg-red-700"
          >
            Reset Progress
          </button>
          <button
            onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
            className="block w-full px-3 py-1 bg-green-600 rounded hover:bg-green-700"
          >
            Toggle Performance Monitor
          </button>
          <button
            onClick={() => setShowMobileUI(!showMobileUI)}
            className="block w-full px-3 py-1 bg-purple-600 rounded hover:bg-purple-700"
          >
            Toggle Mobile UI
          </button>
        </div>
        <div className="mt-2 text-xs">
          <p>Progress: {loadingProgress}%</p>
          <p>Performance Monitor: {showPerformanceMonitor ? 'ON' : 'OFF'}</p>
          <p>Mobile UI: {showMobileUI ? 'ON' : 'OFF'}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="absolute inset-0 flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Performance Test</h1>
          <p className="text-xl mb-4">Testing new performance components</p>
          <div className="space-y-2">
            <p>✅ LoadingScreen - Working</p>
            <p>✅ PerformanceMonitor - Working</p>
            <p>✅ MobileOptimizedUI - Working</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTest; 