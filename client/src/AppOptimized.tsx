import React, { Suspense, lazy, useState } from 'react';
import LoadingScreen from './components/LoadingScreen';
import PerformanceMonitor from './components/PerformanceMonitor';
import MobileOptimizedUI from './components/MobileOptimizedUI';

// Lazy load the main scene component
const BabylonSceneMultiplayer = lazy(() => import('./components/BabylonSceneMultiplayer'));

// Version indicator for cache busting
const APP_VERSION = '2.1.0';
const BUILD_TIMESTAMP = new Date().toISOString();

console.log(`🚀 Enhanced Metaverse v${APP_VERSION} loaded at ${BUILD_TIMESTAMP}`);

const AppOptimized: React.FC = () => {
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 overflow-hidden">
      {/* Version indicator for debugging */}
      <div className="absolute top-2 left-2 z-50 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
        v{APP_VERSION} - Enhanced Avatar System
      </div>
      
      <Suspense fallback={
        <LoadingScreen 
          progress={50} 
          message="Loading Enhanced Avatar System..." 
        />
      }>
        <BabylonSceneMultiplayer />
      </Suspense>
      
      <PerformanceMonitor 
        isVisible={showPerformanceMonitor}
        onToggle={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
      />
      <MobileOptimizedUI 
        onMovementChange={() => {}}
        onChatToggle={() => {}}
        onSettingsToggle={() => {}}
      />
    </div>
  );
};

export default AppOptimized; 