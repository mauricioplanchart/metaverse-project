import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
// import { useMetaverseStore } from '../stores/useMetaverseStore';
import { socketService } from '../lib/socketService';

// Simple avatar creation function
const createSimpleAvatar = (scene: BABYLON.Scene, position: BABYLON.Vector3, name: string, color: string) => {
  // Create avatar group
  const avatarGroup = new BABYLON.TransformNode(name, scene);
  
  // Body (cylinder)
  const body = BABYLON.MeshBuilder.CreateCylinder(`${name}_body`, { height: 1.5, diameter: 0.5 }, scene);
  body.position = new BABYLON.Vector3(0, 0.75, 0);
  body.material = new BABYLON.StandardMaterial(`${name}_body_mat`, scene);
  (body.material as BABYLON.StandardMaterial).diffuseColor = BABYLON.Color3.FromHexString(color);
  body.parent = avatarGroup;
  
  // Head (sphere)
  const head = BABYLON.MeshBuilder.CreateSphere(`${name}_head`, { diameter: 0.4 }, scene);
  head.position = new BABYLON.Vector3(0, 1.6, 0);
  head.material = new BABYLON.StandardMaterial(`${name}_head_mat`, scene);
  (head.material as BABYLON.StandardMaterial).diffuseColor = BABYLON.Color3.FromHexString('#ffcc99');
  head.parent = avatarGroup;
  
  // Eyes
  const leftEye = BABYLON.MeshBuilder.CreateSphere(`${name}_left_eye`, { diameter: 0.05 }, scene);
  leftEye.position = new BABYLON.Vector3(-0.1, 1.65, 0.15);
  leftEye.material = new BABYLON.StandardMaterial(`${name}_eye_mat`, scene);
  (leftEye.material as BABYLON.StandardMaterial).diffuseColor = BABYLON.Color3.Black();
  leftEye.parent = avatarGroup;
  
  const rightEye = BABYLON.MeshBuilder.CreateSphere(`${name}_right_eye`, { diameter: 0.05 }, scene);
  rightEye.position = new BABYLON.Vector3(0.1, 1.65, 0.15);
  rightEye.material = new BABYLON.StandardMaterial(`${name}_eye_mat2`, scene);
  (rightEye.material as BABYLON.StandardMaterial).diffuseColor = BABYLON.Color3.Black();
  rightEye.parent = avatarGroup;
  
  // Simple name label (without GUI)
  const namePlane = BABYLON.MeshBuilder.CreatePlane(`${name}_label`, { width: 2, height: 0.5 }, scene);
  namePlane.position = new BABYLON.Vector3(0, 2.2, 0);
  namePlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  
  const nameMaterial = new BABYLON.StandardMaterial(`${name}_label_mat`, scene);
  nameMaterial.diffuseColor = BABYLON.Color3.White();
  nameMaterial.emissiveColor = BABYLON.Color3.Black();
  namePlane.material = nameMaterial;
  namePlane.parent = avatarGroup;
  
  // Position the entire avatar
  avatarGroup.position = position;
  
  return avatarGroup;
};

export const BabylonSceneMultiplayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  
  // const { avatarCustomization } = useMetaverseStore();

  // Emergency timeout to prevent infinite loading
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      console.log('🚨 Emergency timeout - forcing load completion');
      setIsLoaded(true);
      setError(null);
    }, 5000);

    return () => clearTimeout(emergencyTimeout);
  }, []);

  // Connect to server
  useEffect(() => {
    console.log('🔌 Attempting to connect to server...');
    
    const connectToServer = async () => {
      try {
        await socketService.connect();
        setConnectionStatus('Connected');
        console.log('✅ Connected to server');
      } catch (err) {
        console.error('❌ Failed to connect to server:', err);
        setConnectionStatus('Connection failed');
        setError('Failed to connect to server');
      }
    };

    connectToServer();

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Initialize Babylon.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    console.log('🎮 Starting simplified multiplayer Babylon scene...');

    try {
      // Create engine
      const engine = new BABYLON.Engine(canvasRef.current, true);
      engineRef.current = engine;
      console.log('✅ Engine and scene created');

      // Create scene
      const scene = new BABYLON.Scene(engine);
      sceneRef.current = scene;
      console.log('✅ Camera created and attached');

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
      camera.lowerRadiusLimit = 2;
      camera.upperRadiusLimit = 20;
      console.log('✅ Camera created and attached');

      // Create lighting
      const light = new BABYLON.HemisphericLight(
        'light',
        new BABYLON.Vector3(0, 1, 0),
        scene
      );
      light.intensity = 0.7;
      console.log('✅ Lighting created');

      // Create ground
      const ground = BABYLON.MeshBuilder.CreateGround(
        'ground',
        { width: 20, height: 20 },
        scene
      );
      const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);
      groundMaterial.diffuseColor = BABYLON.Color3.FromHexString('#4CAF50');
      ground.material = groundMaterial;
      console.log('✅ Ground created');

      // Create a rotating box
      const box = BABYLON.MeshBuilder.CreateBox('box', { size: 1 }, scene);
      box.position = new BABYLON.Vector3(0, 0.5, 0);
      const boxMaterial = new BABYLON.StandardMaterial('boxMat', scene);
      boxMaterial.diffuseColor = BABYLON.Color3.FromHexString('#2196F3');
      box.material = boxMaterial;
      
      // Add rotation animation
      const rotationAnimation = new BABYLON.Animation(
        'rotation',
        'rotation.y',
        30,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );
      const keyFrames = [];
      keyFrames.push({ frame: 0, value: 0 });
      keyFrames.push({ frame: 60, value: Math.PI * 2 });
      rotationAnimation.setKeys(keyFrames);
      box.animations = [rotationAnimation];
      scene.beginAnimation(box, 0, 60, true);
      console.log('✅ Rotating box created');

      // Create simple avatars (simplified to avoid issues)
      try {
        const avatars = [
          { name: 'You', color: '#FF5722', position: new BABYLON.Vector3(0, 0, 2) },
          { name: 'Alice', color: '#9C27B0', position: new BABYLON.Vector3(3, 0, 0) },
          { name: 'Bob', color: '#3F51B5', position: new BABYLON.Vector3(-3, 0, 0) },
          { name: 'Charlie', color: '#4CAF50', position: new BABYLON.Vector3(0, 0, -2) }
        ];

        avatars.forEach(avatar => {
          createSimpleAvatar(scene, avatar.position, avatar.name, avatar.color);
        });
        console.log('✅ Avatars created');
      } catch (avatarError) {
        console.warn('⚠️ Avatar creation failed, continuing without avatars:', avatarError);
      }

      // Start render loop
      engine.runRenderLoop(() => {
        scene.render();
      });
      console.log('✅ Render loop started');

      // Handle window resize
      const handleResize = () => {
        engine.resize();
      };
      window.addEventListener('resize', handleResize);

      // Mark as initialized and loaded
      setIsInitialized(true);
      setIsLoaded(true);
      setError(null);
      console.log('🎉 Scene initialization complete!');

      // Force loading state update
      setTimeout(() => {
        console.log('🔄 Forcing loading state update');
        setIsLoaded(true);
        setError(null);
      }, 100);

      // Fallback timeout to ensure loading completes
      setTimeout(() => {
        if (!isLoaded) {
          console.log('⚠️ Forcing load completion due to timeout');
          setIsLoaded(true);
          setError(null);
        }
      }, 3000);

      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        scene.dispose();
        engine.dispose();
        console.log('✅ Resources cleaned up successfully');
      };
    } catch (err) {
      console.error('❌ Scene initialization failed:', err);
      setError('Failed to initialize 3D scene');
      setIsLoaded(true); // Force loading to complete even on error
    }
  }, []);

  // Loading screen
  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">🌍</div>
          <div className="text-2xl font-bold mb-2">Connecting to Metaverse...</div>
          <div className="text-lg text-blue-200">Initializing world building systems</div>
          <div className="mt-4 text-sm text-gray-300">
            {connectionStatus} • {isInitialized ? 'Scene Ready' : 'Loading Scene...'}
          </div>
        </div>
      </div>
    );
  }

  // Error screen
  if (error) {
    return (
      <div className="fixed inset-0 bg-red-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-2xl font-bold mb-2">Connection Error</div>
          <div className="text-lg mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white text-red-900 rounded hover:bg-gray-100"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      />
      
      {/* Connection status overlay */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
        {connectionStatus}
      </div>
      
      {/* Controls help */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded text-sm">
        <div>Mouse: Rotate Camera</div>
        <div>Scroll: Zoom</div>
        <div>Right Click: Pan</div>
      </div>
    </div>
  );
};