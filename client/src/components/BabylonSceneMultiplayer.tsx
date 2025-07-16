import React, { useEffect, useRef, useState } from 'react';
import { useMetaverseStore } from '../stores/useMetaverseStore';
import Avatar3D from './Avatar3D';
import ProximityChat from './ProximityChat';
import AvatarMovement from './AvatarMovement';

// Import Babylon.js
import * as BABYLON from '@babylonjs/core';

const BabylonSceneMultiplayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const { 
    isConnected, 
    onlineUsers, 
    currentUserId,
    avatarCustomization 
  } = useMetaverseStore();
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userAvatars, setUserAvatars] = useState<any[]>([]);
  const [currentUserPosition, setCurrentUserPosition] = useState<BABYLON.Vector3>(new BABYLON.Vector3(0, 0, 0));
  const [camera, setCamera] = useState<BABYLON.Camera | null>(null);

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
      setCamera(camera);

      // Create light
      new BABYLON.HemisphericLight(
        'light',
        new BABYLON.Vector3(0, 1, 0),
        scene
      );

      // 🌅 ADD BEAUTIFUL SKYBOX 🌅
      console.log('🌅 Creating beautiful skybox...');
      const skybox = BABYLON.MeshBuilder.CreateBox('skyBox', { size: 1000.0 }, scene);
      const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', scene);
      skyboxMaterial.backFaceCulling = false;
      skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture('https://playground.babylonjs.com/textures/skybox/TropicalSunnyDay', scene);
      skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
      skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
      skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
      skybox.material = skyboxMaterial;
      console.log('🌅 Beautiful tropical skybox created');

      // Add ambient light for better atmosphere
      const ambientLight = new BABYLON.HemisphericLight(
        'ambientLight',
        new BABYLON.Vector3(0, 1, 0),
        scene
      );
      ambientLight.intensity = 0.3;
      ambientLight.diffuse = new BABYLON.Color3(0.8, 0.9, 1);
      ambientLight.specular = new BABYLON.Color3(0.2, 0.2, 0.2);
      console.log('💡 Enhanced ambient lighting added');

      // Create ground with texture
      const ground = BABYLON.MeshBuilder.CreateGround('ground', {
        width: 20,
        height: 20
      }, scene);
      
      // Add ground texture
      const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);
      const groundTexture = new BABYLON.Texture('https://playground.babylonjs.com/textures/grass.jpg', scene);
      groundTexture.uScale = 4;
      groundTexture.vScale = 4;
      groundMaterial.diffuseTexture = groundTexture;
      ground.material = groundMaterial;
      console.log('🌱 Ground texture applied');

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
      
      // Create a pink pyramid (NEW OBJECT!)
      const pinkPyramid = BABYLON.MeshBuilder.CreatePolyhedron('pinkPyramid', {
        type: 1, // Tetrahedron (pyramid shape)
        size: 0.8
      }, scene);
      pinkPyramid.position.set(4, 0.4, 1);
      console.log('🩷 Created pink pyramid at position:', pinkPyramid.position);

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
      
      // Pink pyramid
      const pinkPyramidMaterial = new BABYLON.StandardMaterial('pinkPyramidMat', scene);
      pinkPyramidMaterial.diffuseColor = new BABYLON.Color3(1, 0.4, 0.8);
      pinkPyramid.material = pinkPyramidMaterial;
      console.log('🩷 Applied pink material to pyramid');

      // Add some visual interest for offline mode
      if (isOfflineMode) {
        // Additional objects for offline mode can be added here
        console.log('🎨 Offline mode: Additional objects can be added here');
      }

      // ✨ ADD PARTICLE EFFECTS ✨
      console.log('✨ Adding particle effects...');
      
      // Create particle system for ambient sparkles
      const particleSystem = new BABYLON.ParticleSystem('ambientSparkles', 2000, scene);
      particleSystem.particleTexture = new BABYLON.Texture('https://playground.babylonjs.com/textures/flare.png', scene);
      
      // Configure particle system
      particleSystem.minEmitBox = new BABYLON.Vector3(-10, 0, -10);
      particleSystem.maxEmitBox = new BABYLON.Vector3(10, 5, 10);
      particleSystem.color1 = new BABYLON.Color4(1, 1, 1, 1);
      particleSystem.color2 = new BABYLON.Color4(0.8, 0.8, 1, 1);
      particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);
      particleSystem.minSize = 0.1;
      particleSystem.maxSize = 0.3;
      particleSystem.minLifeTime = 2;
      particleSystem.maxLifeTime = 4;
      particleSystem.emitRate = 100;
      particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
      particleSystem.gravity = new BABYLON.Vector3(0, -0.1, 0);
      particleSystem.direction1 = new BABYLON.Vector3(-0.5, -0.5, -0.5);
      particleSystem.direction2 = new BABYLON.Vector3(0.5, 0.5, 0.5);
      particleSystem.minAngularSpeed = 0;
      particleSystem.maxAngularSpeed = Math.PI;
      particleSystem.minEmitPower = 0.1;
      particleSystem.maxEmitPower = 0.3;
      particleSystem.updateSpeed = 0.005;
      
      // Start the particle system
      particleSystem.start();
      console.log('✨ Ambient sparkles particle system started');

      // 🎭 ADD OBJECT ANIMATIONS 🎭
      console.log('🎭 Adding object animations...');
      
      // Create animation for floating objects
      const createFloatingAnimation = (object: BABYLON.Mesh, amplitude: number, speed: number) => {
        const animation = new BABYLON.Animation(
          'floating',
          'position.y',
          30,
          BABYLON.Animation.ANIMATIONTYPE_FLOAT,
          BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        
        const keyFrames = [];
        keyFrames.push({
          frame: 0,
          value: object.position.y
        });
        keyFrames.push({
          frame: 30,
          value: object.position.y + amplitude
        });
        keyFrames.push({
          frame: 60,
          value: object.position.y
        });
        
        animation.setKeys(keyFrames);
        object.animations = [animation];
        
        scene.beginAnimation(object, 0, 60, true, speed);
        console.log(`🎭 Added floating animation to ${object.name}`);
      };

      // Create rotation animation
      const createRotationAnimation = (object: BABYLON.Mesh, speed: number) => {
        const animation = new BABYLON.Animation(
          'rotation',
          'rotation.y',
          30,
          BABYLON.Animation.ANIMATIONTYPE_FLOAT,
          BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        
        const keyFrames = [];
        keyFrames.push({
          frame: 0,
          value: 0
        });
        keyFrames.push({
          frame: 30,
          value: Math.PI * 2
        });
        
        animation.setKeys(keyFrames);
        object.animations.push(animation);
        
        scene.beginAnimation(object, 0, 30, true, speed);
        console.log(`🎭 Added rotation animation to ${object.name}`);
      };

      // Add animations to objects
      createFloatingAnimation(redSphere, 0.3, 1.0);
      createRotationAnimation(redSphere, 1.5);
      
      createFloatingAnimation(greenCylinder, 0.4, 1.2);
      createRotationAnimation(greenCylinder, 1.0);
      
      createFloatingAnimation(blueSphere, 0.25, 0.8);
      createRotationAnimation(blueSphere, 2.0);
      
      createFloatingAnimation(yellowCylinder, 0.35, 1.1);
      createRotationAnimation(yellowCylinder, 1.3);
      
      createFloatingAnimation(purpleSphere, 0.28, 0.9);
      createRotationAnimation(purpleSphere, 1.8);
      
      createFloatingAnimation(orangeCylinder, 0.45, 1.4);
      createRotationAnimation(orangeCylinder, 0.7);
      
      createFloatingAnimation(pinkPyramid, 0.32, 1.3);
      createRotationAnimation(pinkPyramid, 1.6);

      // Add object-specific particle effects
      const objects = [redSphere, greenCylinder, blueSphere, yellowCylinder, purpleSphere, orangeCylinder, pinkPyramid];
      const colors = [
        new BABYLON.Color3(1, 0.2, 0.2), // Red
        new BABYLON.Color3(0.2, 1, 0.2), // Green
        new BABYLON.Color3(0.2, 0.2, 1), // Blue
        new BABYLON.Color3(1, 1, 0.2),   // Yellow
        new BABYLON.Color3(0.8, 0.2, 1), // Purple
        new BABYLON.Color3(1, 0.6, 0.2), // Orange
        new BABYLON.Color3(1, 0.4, 0.8)  // Pink
      ];

      objects.forEach((object, index) => {
        // Create particle system for each object
        const objectParticles = new BABYLON.ParticleSystem(`objectParticles_${index}`, 100, scene);
        objectParticles.particleTexture = new BABYLON.Texture('https://playground.babylonjs.com/textures/flare.png', scene);
        
        // Position particles around the object
        objectParticles.emitter = object;
        objectParticles.minEmitBox = new BABYLON.Vector3(-0.5, -0.5, -0.5);
        objectParticles.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0.5);
        
        // Color particles to match object
        objectParticles.color1 = new BABYLON.Color4(colors[index].r, colors[index].g, colors[index].b, 1);
        objectParticles.color2 = new BABYLON.Color4(colors[index].r * 0.8, colors[index].g * 0.8, colors[index].b * 0.8, 1);
        objectParticles.colorDead = new BABYLON.Color4(0, 0, 0, 0);
        
        // Configure particle properties
        objectParticles.minSize = 0.05;
        objectParticles.maxSize = 0.15;
        objectParticles.minLifeTime = 1;
        objectParticles.maxLifeTime = 2;
        objectParticles.emitRate = 20;
        objectParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        objectParticles.gravity = new BABYLON.Vector3(0, 0.1, 0);
        objectParticles.direction1 = new BABYLON.Vector3(-0.2, -0.2, -0.2);
        objectParticles.direction2 = new BABYLON.Vector3(0.2, 0.2, 0.2);
        objectParticles.minAngularSpeed = 0;
        objectParticles.maxAngularSpeed = Math.PI;
        objectParticles.minEmitPower = 0.1;
        objectParticles.maxEmitPower = 0.2;
        objectParticles.updateSpeed = 0.01;
        
        // Start the particle system
        objectParticles.start();
        console.log(`✨ Object ${index + 1} particle system started`);
      });

      // Log summary of all objects created
      console.log('🎮 Scene objects summary:');
      console.log('  - 1 blue box (original)');
      console.log('  - 3 spheres (red, blue, purple)');
      console.log('  - 3 cylinders (green, yellow, orange)');
      console.log('  - 1 pink pyramid (NEW!)');
      console.log('  - 1 ground plane');
      console.log('  - 1 ambient particle system');
      console.log('  - 7 object-specific particle systems');
      console.log('  - Total: 9 objects + 8 particle systems in scene');

      // 🎭 ADD REAL USER AVATARS 🎭
      console.log('🎭 Setting up real user avatar system...');
      
      // Create initial user avatars from online users
      const createUserAvatars = () => {
        const avatars = onlineUsers.map((user, index) => {
          // Generate random position for each user
          const angle = (index / onlineUsers.length) * Math.PI * 2;
          const radius = 3 + Math.random() * 2;
          const position = new BABYLON.Vector3(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
          );
          
          return {
            userId: user.id,
            username: user.username || `Player_${user.id}`,
            position: position,
            avatarData: user.avatarCustomization || avatarCustomization,
            isCurrentUser: user.id === currentUserId
          };
        });
        
        console.log('🎭 Created avatars for users:', avatars.map(a => a.username));
        setUserAvatars(avatars);
      };
      
      // Initialize user avatars
      createUserAvatars();

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

  // Update user avatars when online users change
  useEffect(() => {
    if (onlineUsers.length > 0) {
      console.log('👥 Online users updated:', onlineUsers.length, 'users');
      const avatars = onlineUsers.map((user, index) => {
        // Generate random position for each user
        const angle = (index / onlineUsers.length) * Math.PI * 2;
        const radius = 3 + Math.random() * 2;
        const position = new BABYLON.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        );
        
        return {
          userId: user.id,
          username: user.username || `Player_${user.id}`,
          position: position,
          avatarData: user.avatarCustomization || avatarCustomization,
          isCurrentUser: user.id === currentUserId
        };
      });
      
      console.log('🎭 Updated avatars for users:', avatars.map(a => a.username));
      setUserAvatars(avatars);
    }
  }, [onlineUsers, currentUserId, avatarCustomization]);

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
      
              {/* Render Real User Avatars */}
        {sceneRef.current && userAvatars.map((avatar: any) => (
          <Avatar3D
            key={`avatar-${avatar.userId}`}
            scene={sceneRef.current!}
            position={avatar.position}
            username={avatar.username}
            avatarData={avatar.avatarData}
            isCurrentUser={avatar.isCurrentUser}
          />
        ))}
        
        {/* Proximity Chat System */}
        {sceneRef.current && (
          <ProximityChat
            scene={sceneRef.current}
            currentUserPosition={currentUserPosition}
            userAvatars={userAvatars}
          />
        )}
        
        {/* Avatar Movement Controls */}
        {sceneRef.current && camera && (
          <AvatarMovement
            scene={sceneRef.current}
            camera={camera}
            currentUserAvatar={userAvatars.find(avatar => avatar.isCurrentUser)}
          />
        )}
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