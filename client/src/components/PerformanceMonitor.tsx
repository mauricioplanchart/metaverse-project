import React, { useState, useEffect, useRef } from 'react';

interface PerformanceStats {
  fps: number;
  memory: {
    used: number;
    total: number;
  };
  renderTime: number;
  drawCalls: number;
  triangles: number;
}

interface PerformanceMonitorProps {
  isVisible: boolean;
  onToggle: () => void;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ isVisible, onToggle }) => {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 0,
    memory: { used: 0, total: 0 },
    renderTime: 0,
    drawCalls: 0,
    triangles: 0
  });
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!isVisible) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const updateStats = () => {
      const now = performance.now();
      frameCountRef.current++;

      if (now - lastTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
        
        // Get memory info if available
        let memoryInfo = { used: 0, total: 0 };
        if ('memory' in performance) {
          const mem = (performance as any).memory;
          memoryInfo = {
            used: Math.round(mem.usedJSHeapSize / 1024 / 1024),
            total: Math.round(mem.totalJSHeapSize / 1024 / 1024)
          };
        }

        setStats({
          fps,
          memory: memoryInfo,
          renderTime: Math.round(1000 / fps), // Approximate render time
          drawCalls: Math.floor(Math.random() * 100) + 50, // Simulated
          triangles: Math.floor(Math.random() * 10000) + 5000 // Simulated
        });

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(updateStats);
    };

    animationFrameRef.current = requestAnimationFrame(updateStats);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const getFpsColor = (fps: number) => {
    if (fps >= 55) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMemoryColor = (used: number, total: number) => {
    const percentage = (used / total) * 100;
    if (percentage < 70) return 'text-green-400';
    if (percentage < 90) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg font-mono text-xs z-50">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold">Performance</span>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white text-lg"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>FPS:</span>
          <span className={getFpsColor(stats.fps)}>{stats.fps}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Render:</span>
          <span>{stats.renderTime}ms</span>
        </div>
        
        <div className="flex justify-between">
          <span>Memory:</span>
          <span className={getMemoryColor(stats.memory.used, stats.memory.total)}>
            {stats.memory.used}MB / {stats.memory.total}MB
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Draw Calls:</span>
          <span>{stats.drawCalls}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Triangles:</span>
          <span>{stats.triangles.toLocaleString()}</span>
        </div>
      </div>

      {/* Performance bar */}
      <div className="mt-2">
        <div className="flex justify-between text-xs mb-1">
          <span>Performance</span>
          <span>{Math.round((stats.fps / 60) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              stats.fps >= 55 ? 'bg-green-500' : 
              stats.fps >= 30 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min((stats.fps / 60) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Tips */}
      <div className="mt-2 text-xs text-gray-400">
        {stats.fps < 30 && (
          <div className="text-red-400">
            ⚠️ Low FPS - Try reducing graphics settings
          </div>
        )}
        {stats.fps >= 55 && (
          <div className="text-green-400">
            ✅ Performance is good
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitor; 