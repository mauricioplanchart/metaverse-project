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
console.log('🚫 Socket.IO completely removed - Supabase only mode');
console.log('🎮 Enhanced Avatar System with PBR materials and advanced animations');

const AppOptimized: React.FC = () => {
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 overflow-hidden">
      {/* Version indicator for debugging */}
      <div className="absolute top-2 left-2 z-50 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
        v{APP_VERSION} - Supabase Only
      </div>
      
      {/* Performance monitor toggle */}
      <button
        onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
        className="absolute top-2 right-2 z-50 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded hover:bg-opacity-70"
      >
        {showPerformanceMonitor ? 'Hide' : 'Show'} Performance
      </button>

      {/* Performance monitor */}
      {showPerformanceMonitor && (
        <div className="absolute top-10 right-2 z-50">
          <PerformanceMonitor 
            isVisible={showPerformanceMonitor}
            onToggle={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
          />
        </div>
      )}

      {/* Mobile optimized UI */}
      <MobileOptimizedUI 
        onMovementChange={() => {}}
        onChatToggle={() => {}}
        onSettingsToggle={() => {}}
      />

      {/* Main content */}
      <Suspense fallback={
        <LoadingScreen 
          progress={50} 
          message="Loading Enhanced Avatar System v2.1.0..." 
        />
      }>
        <BabylonSceneMultiplayer />
      </Suspense>
    </div>
  );
};

export default AppOptimized; 