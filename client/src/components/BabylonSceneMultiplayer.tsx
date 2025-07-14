import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { useMetaverseStore } from '../stores/useMetaverseStore';
import { socketService } from '../lib/socketService';

const BabylonSceneMultiplayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const { isConnected, setConnected, isLoaded, setIsLoaded } = useMetaverseStore();
  const [loadingMessage, setLoadingMessage] = useState('🌍 Connecting to Metaverse...');
  const [error, setError] = useState<string | null>(null);
  const [localLoaded, setLocalLoaded] = useState(false);

  // Debug logging
  console.log('🎮 BabylonSceneMultiplayer render:', { isConnected, isLoaded, localLoaded, loadingMessage });

  // Connection management
  useEffect(() => {
    console.log('🔌 Attempting to connect to server...');
    
    const handleConnect = () => {
      console.log('✅ Connected to server');
      setConnected(true);
      setLoadingMessage('Initializing world building systems');
    };

    const handleDisconnect = () => {
      console.log('🔌 Disconnecting from multiplayer server...');
      setConnected(false);
      setLoadingMessage('🌍 Reconnecting to Metaverse...');
    };

    const handleError = (error: any) => {
      console.error('❌ Connection error:', error);
      setError('Failed to connect to server');
      setIsLoaded(true); // Show error screen
      setLocalLoaded(true);
    };

    // Connect to server
    socketService.connect();

    // Listen for connection events
    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('connect_error', handleError);

    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('connect_error', handleError);
      socketService.disconnect();
    };
  }, [setConnected, setIsLoaded]);

  // Initialize Babylon.js scene
  useEffect(() => {
    if (!canvasRef.current || !isConnected) {
      console.log('⏳ Waiting for canvas or connection:', { hasCanvas: !!canvasRef.current, isConnected });
      return;
    }

    console.log('🎮 Starting simplified multiplayer Babylon scene...');

    try {
      // Create engine
      const engine = new BABYLON.Engine(canvasRef.current, true);
      engineRef.current = engine;

      // Create scene
      const scene = new BABYLON.Scene(engine);
      sceneRef.current = scene;

      // Create camera
      const camera = new BABYLON.ArcRotateCamera(
        'camera',
        0,
        Math.PI / 3,
        10,
        BABYLON.Vector3.Zero(),
        scene
      );
      camera.attachControl(canvasRef.current, true);

      // Create light
      new BABYLON.HemisphericLight(
        'light',
        new BABYLON.Vector3(0, 1, 0),
        scene
      );

      // Create ground
      BABYLON.MeshBuilder.CreateGround('ground', {
        width: 20,
        height: 20
      }, scene);

      // Create a simple box
      const box = BABYLON.MeshBuilder.CreateBox('box', {
        size: 1
      }, scene);
      box.position.y = 0.5;

      // Start render loop
      engine.runRenderLoop(() => {
        scene.render();
      });

      // Handle window resize
      const handleResize = () => {
        engine.resize();
      };
      window.addEventListener('resize', handleResize);

      // Set loaded state after a short delay to show the scene
      setTimeout(() => {
        console.log('✅ Scene loaded successfully - setting loaded state');
        setIsLoaded(true);
        setLocalLoaded(true);
      }, 1000);

      return () => {
        window.removeEventListener('resize', handleResize);
        engine.dispose();
      };
    } catch (err) {
      console.error('❌ Error initializing scene:', err);
      setError('Failed to initialize 3D scene');
      setIsLoaded(true); // Show error screen
      setLocalLoaded(true);
    }
  }, [isConnected, setIsLoaded]);

  // Emergency timeout to prevent infinite loading
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      console.log('🚨 Emergency timeout - forcing load completion');
      setIsLoaded(true);
      setLocalLoaded(true);
    }, 5000);

    return () => clearTimeout(emergencyTimeout);
  }, [setIsLoaded]);

  // Show loading screen
  if (!isLoaded && !localLoaded) {
    console.log('🔄 Showing loading screen');
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">🌍</div>
          <div className="text-2xl font-bold mb-2">{loadingMessage}</div>
          <div className="text-lg opacity-75">Please wait...</div>
          {error && (
            <div className="mt-4 p-4 bg-red-600 rounded-lg">
              <div className="text-lg font-semibold">Error</div>
              <div>{error}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show error screen
  if (error) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-2xl font-bold mb-2">Connection Error</div>
          <div className="text-lg mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-white text-red-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Show 3D scene
  console.log('🎮 Rendering 3D scene');
  return (
    <div className="w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ outline: 'none' }}
      />
    </div>
  );
};

export default BabylonSceneMultiplayer;