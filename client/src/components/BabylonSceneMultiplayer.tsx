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

      // Add more 3D objects to make the scene interesting
      console.log('🎨 Creating 3D objects...');
      
      // Create a red sphere
      const redSphere = BABYLON.MeshBuilder.CreateSphere('redSphere', {
        diameter: 0.8
      }, scene);
      redSphere.position.set(3, 0.4, 0);
      console.log('🔴 Created red sphere at position:', redSphere.position);
      
      // Create a green cylinder
      const greenCylinder = BABYLON.MeshBuilder.CreateCylinder('greenCylinder', {
        height: 1.5,
        diameter: 0.6
      }, scene);
      greenCylinder.position.set(-3, 0.75, 0);
      console.log('🟢 Created green cylinder at position:', greenCylinder.position);
      
      // Create a blue sphere
      const blueSphere = BABYLON.MeshBuilder.CreateSphere('blueSphere', {
        diameter: 0.6
      }, scene);
      blueSphere.position.set(0, 0.3, 3);
      console.log('🔵 Created blue sphere at position:', blueSphere.position);
      
      // Create a yellow cylinder
      const yellowCylinder = BABYLON.MeshBuilder.CreateCylinder('yellowCylinder', {
        height: 1.2,
        diameter: 0.4
      }, scene);
      yellowCylinder.position.set(0, 0.6, -3);
      console.log('🟡 Created yellow cylinder at position:', yellowCylinder.position);
      
      // Create a purple sphere
      const purpleSphere = BABYLON.MeshBuilder.CreateSphere('purpleSphere', {
        diameter: 0.7
      }, scene);
      purpleSphere.position.set(2, 0.35, 2);
      console.log('🟣 Created purple sphere at position:', purpleSphere.position);
      
      // Create an orange cylinder
      const orangeCylinder = BABYLON.MeshBuilder.CreateCylinder('orangeCylinder', {
        height: 1.8,
        diameter: 0.5
      }, scene);
      orangeCylinder.position.set(-2, 0.9, -2);
      console.log('🟠 Created orange cylinder at position:', orangeCylinder.position);

      // Add materials and colors to all objects
      console.log('🎨 Applying materials to objects...');
      
      // Blue box
      const boxMaterial = new BABYLON.StandardMaterial('boxMat', scene);
      boxMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1);
      box.material = boxMaterial;
      console.log('🔵 Applied blue material to box');
      
      // Red sphere
      const redSphereMaterial = new BABYLON.StandardMaterial('redSphereMat', scene);
      redSphereMaterial.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
      redSphere.material = redSphereMaterial;
      console.log('🔴 Applied red material to sphere');
      
      // Green cylinder
      const greenCylinderMaterial = new BABYLON.StandardMaterial('greenCylinderMat', scene);
      greenCylinderMaterial.diffuseColor = new BABYLON.Color3(0.2, 1, 0.2);
      greenCylinder.material = greenCylinderMaterial;
      console.log('🟢 Applied green material to cylinder');
      
      // Blue sphere
      const blueSphereMaterial = new BABYLON.StandardMaterial('blueSphereMat', scene);
      blueSphereMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 1);
      blueSphere.material = blueSphereMaterial;
      console.log('🔵 Applied blue material to sphere');
      
      // Yellow cylinder
      const yellowCylinderMaterial = new BABYLON.StandardMaterial('yellowCylinderMat', scene);
      yellowCylinderMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0.2);
      yellowCylinder.material = yellowCylinderMaterial;
      console.log('🟡 Applied yellow material to cylinder');
      
      // Purple sphere
      const purpleSphereMaterial = new BABYLON.StandardMaterial('purpleSphereMat', scene);
      purpleSphereMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.2, 1);
      purpleSphere.material = purpleSphereMaterial;
      console.log('🟣 Applied purple material to sphere');
      
      // Orange cylinder
      const orangeCylinderMaterial = new BABYLON.StandardMaterial('orangeCylinderMat', scene);
      orangeCylinderMaterial.diffuseColor = new BABYLON.Color3(1, 0.6, 0.2);
      orangeCylinder.material = orangeCylinderMaterial;
      console.log('🟠 Applied orange material to cylinder');

      // Add some visual interest for offline mode
      if (isOfflineMode) {
        // Additional objects for offline mode can be added here
        console.log('🎨 Offline mode: Additional objects can be added here');
      }

      // Log summary of all objects created
      console.log('🎮 Scene objects summary:');
      console.log('  - 1 blue box (original)');
      console.log('  - 3 spheres (red, blue, purple)');
      console.log('  - 3 cylinders (green, yellow, orange)');
      console.log('  - 1 ground plane');
      console.log('  - Total: 8 objects in scene');

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