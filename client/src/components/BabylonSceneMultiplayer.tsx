import React, { useEffect, useRef, useState } from 'react';
import { useMetaverseStore } from '../stores/useMetaverseStore';

// Import Babylon.js
import * as BABYLON from '@babylonjs/core';

const BabylonSceneMultiplayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const { isConnected } = useMetaverseStore();
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Debug logging
  console.log('🎮 BabylonSceneMultiplayer render v3:', { isConnected, error, isOfflineMode });
  console.log('🎮 Canvas ref:', canvasRef.current);
  console.log('🎮 Engine ref:', engineRef.current);
  console.log('🎮 Scene ref:', sceneRef.current);

  // Initialize Babylon.js scene - ONLY ONCE
  useEffect(() => {
    if (!canvasRef.current || isInitialized) {
      console.log('⏳ Waiting for canvas or already initialized...');
      return;
    }

    // Check if Babylon.js is available
    if (!BABYLON) {
      console.error('❌ Babylon.js not available');
      setError('Babylon.js failed to load');
      return;
    }

    // Prevent multiple initializations
    if (engineRef.current && sceneRef.current) {
      console.log('🎮 Scene already initialized, skipping...');
      return;
    }

    // Allow offline mode if no connection
    if (!isConnected) {
      console.log('🔄 No connection detected, enabling offline mode...');
      setIsOfflineMode(true);
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

      // Add some visual interest for offline mode
      if (isOfflineMode) {
        // Create a few more objects to make the scene more interesting
        const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', {
          diameter: 0.8
        }, scene);
        sphere.position.set(3, 0.4, 0);
        
        const cylinder = BABYLON.MeshBuilder.CreateCylinder('cylinder', {
          height: 1.5,
          diameter: 0.6
        }, scene);
        cylinder.position.set(-3, 0.75, 0);
        
        // Add some color
        const boxMaterial = new BABYLON.StandardMaterial('boxMat', scene);
        boxMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1);
        box.material = boxMaterial;
        
        const sphereMaterial = new BABYLON.StandardMaterial('sphereMat', scene);
        sphereMaterial.diffuseColor = new BABYLON.Color3(1, 0.4, 0.2);
        sphere.material = sphereMaterial;
        
        const cylinderMaterial = new BABYLON.StandardMaterial('cylinderMat', scene);
        cylinderMaterial.diffuseColor = new BABYLON.Color3(0.2, 1, 0.4);
        cylinder.material = cylinderMaterial;
      }

      // Start render loop
      engine.runRenderLoop(() => {
        scene.render();
      });

      // Handle window resize
      const handleResize = () => {
        engine.resize();
      };
      window.addEventListener('resize', handleResize);

      setIsInitialized(true);
      console.log('🎮 Scene initialized successfully');

      return () => {
        window.removeEventListener('resize', handleResize);
        // Don't dispose here - let the cleanup useEffect handle it
      };
    } catch (err) {
      console.error('❌ Error initializing scene:', err);
      setError('Failed to initialize 3D scene');
    }
  }, []); // Empty dependency array - only run once

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        console.log('🧹 Cleaning up Babylon.js engine');
        engineRef.current.dispose();
        engineRef.current = null;
        sceneRef.current = null;
        setIsInitialized(false);
      }
    };
  }, []);

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
    <div className="w-full h-full relative" style={{ backgroundColor: '#1a1a1a' }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ outline: 'none' }}
      />
      {isOfflineMode && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          backgroundColor: 'rgba(255, 165, 0, 0.9)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold',
          border: '2px solid rgba(255, 255, 255, 0.3)'
        }}>
          🔌 Offline Mode
        </div>
      )}
      {/* Debug overlay */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <div>Connected: {isConnected ? '✅' : '❌'}</div>
        <div>Error: {error ? '❌' : '✅'}</div>
        <div>Offline: {isOfflineMode ? '✅' : '❌'}</div>
        <div>Canvas: {canvasRef.current ? '✅' : '❌'}</div>
        <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
        <div>Engine: {engineRef.current ? '✅ Active' : '❌'}</div>
      </div>
    </div>
  );
};

export default BabylonSceneMultiplayer;