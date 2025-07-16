import React, { useEffect, useRef, useState } from 'react';
import { useMetaverseStore } from '../stores/useMetaverseStore';
import Avatar3D from './Avatar3D';
import ProximityChat from './ProximityChat';
import AvatarMovement from './AvatarMovement';
import AvatarInteractions from './AvatarInteractions';

// Import Babylon.js
import * as BABYLON from '@babylonjs/core';

console.log('🎮 AvatarMovement import test:', typeof AvatarMovement);

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
  const [currentUserPosition] = useState<BABYLON.Vector3>(new BABYLON.Vector3(0, 0, 0));
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
      
      // Use a simple gradient skybox instead of external textures
      skyboxMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.7, 1.0); // Light blue
      skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
      skyboxMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.4, 0.6); // Darker blue glow
      skybox.material = skyboxMaterial;
      console.log('🌅 Beautiful gradient skybox created');

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
      
      // Add ground material with color instead of texture
      const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);
      groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.2); // Green color
      groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.3, 0.1);
      ground.material = groundMaterial;
      console.log('🌱 Ground material applied');

      // Create a simple box
      const box = BABYLON.MeshBuilder.CreateBox('box', {
        size: 1
      }, scene);
      box.position.y = 0.5;

      // 🎨 Creating expanded 3D world...
      console.log('🎨 Creating expanded 3D world...');
      
      // Create central plaza with fountain
      const fountainBase = BABYLON.MeshBuilder.CreateCylinder('fountainBase', { height: 0.3, diameter: 2 }, scene);
      fountainBase.position.set(0, 0.15, 0);
      const fountainMaterial = new BABYLON.StandardMaterial('fountainMat', scene);
      fountainMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.9);
      fountainBase.material = fountainMaterial;
      
      const fountainCenter = BABYLON.MeshBuilder.CreateCylinder('fountainCenter', { height: 1, diameter: 0.5 }, scene);
      fountainCenter.position.set(0, 0.8, 0);
      fountainCenter.material = fountainMaterial;
      console.log('⛲ Created central fountain');
      
      // Create buildings around the plaza
      const createBuilding = (name: string, position: BABYLON.Vector3, color: BABYLON.Color3, size: number) => {
        const building = BABYLON.MeshBuilder.CreateBox(name, { width: size, height: size * 2, depth: size }, scene);
        building.position = position;
        const buildingMaterial = new BABYLON.StandardMaterial(`${name}Mat`, scene);
        buildingMaterial.diffuseColor = color;
        building.material = buildingMaterial;
        
        // Add windows
        const windowMaterial = new BABYLON.StandardMaterial(`${name}WindowMat`, scene);
        windowMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0.8);
        windowMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.1);
        
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 2; j++) {
            const window = BABYLON.MeshBuilder.CreatePlane(`${name}Window${i}${j}`, { width: 0.3, height: 0.4 }, scene);
            window.position.set(
              position.x + (i - 1) * 0.4,
              position.y + j * 0.8 + 0.5,
              position.z + size/2 + 0.01
            );
            window.material = windowMaterial;
          }
        }
        return building;
      };
      
      // Create buildings
      createBuilding('building1', new BABYLON.Vector3(8, 1, 5), new BABYLON.Color3(0.7, 0.3, 0.3), 1.5);
      createBuilding('building2', new BABYLON.Vector3(-8, 1, 5), new BABYLON.Color3(0.3, 0.7, 0.3), 1.5);
      createBuilding('building3', new BABYLON.Vector3(8, 1, -5), new BABYLON.Color3(0.3, 0.3, 0.7), 1.5);
      createBuilding('building4', new BABYLON.Vector3(-8, 1, -5), new BABYLON.Color3(0.7, 0.7, 0.3), 1.5);
      console.log('🏢 Created 4 buildings around the plaza');
      
      // Create trees
      const createTree = (name: string, position: BABYLON.Vector3) => {
        // Tree trunk
        const trunk = BABYLON.MeshBuilder.CreateCylinder(`${name}Trunk`, { height: 2, diameter: 0.3 }, scene);
        trunk.position = position;
        const trunkMaterial = new BABYLON.StandardMaterial(`${name}TrunkMat`, scene);
        trunkMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0.1);
        trunk.material = trunkMaterial;
        
        // Tree leaves
        const leaves = BABYLON.MeshBuilder.CreateSphere(`${name}Leaves`, { diameter: 2 }, scene);
        leaves.position.set(position.x, position.y + 1.5, position.z);
        const leavesMaterial = new BABYLON.StandardMaterial(`${name}LeavesMat`, scene);
        leavesMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.6, 0.1);
        leaves.material = leavesMaterial;
      };
      
      // Create trees in a circle around the plaza
      const treePositions = [
        new BABYLON.Vector3(6, 0, 6),
        new BABYLON.Vector3(-6, 0, 6),
        new BABYLON.Vector3(6, 0, -6),
        new BABYLON.Vector3(-6, 0, -6),
        new BABYLON.Vector3(10, 0, 0),
        new BABYLON.Vector3(-10, 0, 0),
        new BABYLON.Vector3(0, 0, 10),
        new BABYLON.Vector3(0, 0, -10)
      ];
      
      treePositions.forEach((pos, index) => {
        createTree(`tree${index}`, pos);
      });
      console.log('🌳 Created 8 trees around the plaza');
      
      // Create decorative objects
      const createDecorativeObject = (name: string, position: BABYLON.Vector3, type: string, color: BABYLON.Color3) => {
        let mesh;
        switch (type) {
          case 'sphere':
            mesh = BABYLON.MeshBuilder.CreateSphere(name, { diameter: 0.5 }, scene);
            break;
          case 'cylinder':
            mesh = BABYLON.MeshBuilder.CreateCylinder(name, { height: 1, diameter: 0.4 }, scene);
            break;
          case 'cube':
            mesh = BABYLON.MeshBuilder.CreateBox(name, { size: 0.6 }, scene);
            break;
          default:
            mesh = BABYLON.MeshBuilder.CreateSphere(name, { diameter: 0.5 }, scene);
        }
        
        mesh.position = position;
        const material = new BABYLON.StandardMaterial(`${name}Mat`, scene);
        material.diffuseColor = color;
        mesh.material = material;
        
        // Add subtle rotation animation
        const rotationAnimation = new BABYLON.Animation(
          `${name}Rotation`,
          'rotation.y',
          30,
          BABYLON.Animation.ANIMATIONTYPE_FLOAT,
          BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        
        const keyFrames = [];
        keyFrames.push({ frame: 0, value: 0 });
        keyFrames.push({ frame: 30, value: Math.PI * 2 });
        rotationAnimation.setKeys(keyFrames);
        
        mesh.animations = [rotationAnimation];
        scene.beginAnimation(mesh, 0, 30, true, 0.5);
        
        return mesh;
      };
      
      // Create decorative objects
      createDecorativeObject('deco1', new BABYLON.Vector3(4, 0.25, 4), 'sphere', new BABYLON.Color3(1, 0.5, 0));
      createDecorativeObject('deco2', new BABYLON.Vector3(-4, 0.25, 4), 'cylinder', new BABYLON.Color3(0.5, 0, 1));
      createDecorativeObject('deco3', new BABYLON.Vector3(4, 0.25, -4), 'cube', new BABYLON.Color3(1, 0, 0.5));
      createDecorativeObject('deco4', new BABYLON.Vector3(-4, 0.25, -4), 'sphere', new BABYLON.Color3(0, 1, 0.5));
      console.log('✨ Created 4 decorative rotating objects');
      
      // Create a bridge
      const bridge = BABYLON.MeshBuilder.CreateBox('bridge', { width: 2, height: 0.2, depth: 8 }, scene);
      bridge.position.set(0, 0.1, 15);
      const bridgeMaterial = new BABYLON.StandardMaterial('bridgeMat', scene);
      bridgeMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.2);
      bridge.material = bridgeMaterial;
      console.log('🌉 Created bridge to the north');
      
      // Create a small lake
      const lake = BABYLON.MeshBuilder.CreateCylinder('lake', { height: 0.1, diameter: 6 }, scene);
      lake.position.set(0, 0.05, -15);
      const lakeMaterial = new BABYLON.StandardMaterial('lakeMat', scene);
      lakeMaterial.alpha = 0.7;
      lakeMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.8);
      lake.material = lakeMaterial;
      console.log('🏞️ Created small lake to the south');

      // Add materials to the box (keeping the original box)
      console.log('🎨 Applying materials to objects...');
      
      // Blue box
      const boxMaterial = new BABYLON.StandardMaterial('boxMat', scene);
      boxMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1);
      box.material = boxMaterial;
      console.log('🔵 Applied blue material to box');

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



      // Add animations to new world objects
      console.log('🎭 Adding animations to world objects...');
      
      // Add floating animation to fountain
      createFloatingAnimation(fountainCenter, 0.2, 0.8);
      
      // Add rotation animation to decorative objects (they already have rotation from createDecorativeObject)
      console.log('🎭 Decorative objects have built-in rotation animations');
      
      // Add some particle effects around the fountain
      const fountainParticles = new BABYLON.ParticleSystem('fountainParticles', 200, scene);
      fountainParticles.particleTexture = new BABYLON.Texture('https://playground.babylonjs.com/textures/flare.png', scene);
      
      // Position particles around the fountain
      fountainParticles.emitter = fountainCenter;
      fountainParticles.minEmitBox = new BABYLON.Vector3(-0.3, -0.3, -0.3);
      fountainParticles.maxEmitBox = new BABYLON.Vector3(0.3, 0.3, 0.3);
      
      // Color particles to match fountain
      fountainParticles.color1 = new BABYLON.Color4(0.8, 0.8, 1, 1);
      fountainParticles.color2 = new BABYLON.Color4(0.6, 0.6, 0.9, 1);
      fountainParticles.colorDead = new BABYLON.Color4(0, 0, 0, 0);
      
      // Configure particle properties
      fountainParticles.minSize = 0.05;
      fountainParticles.maxSize = 0.15;
      fountainParticles.minLifeTime = 1;
      fountainParticles.maxLifeTime = 2;
             fountainParticles.emitRate = 30;
       fountainParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
       fountainParticles.gravity = new BABYLON.Vector3(0, 0.1, 0);
       fountainParticles.direction1 = new BABYLON.Vector3(-0.2, -0.2, -0.2);
       fountainParticles.direction2 = new BABYLON.Vector3(0.2, 0.2, 0.2);
       fountainParticles.minAngularSpeed = 0;
       fountainParticles.maxAngularSpeed = Math.PI;
       fountainParticles.minEmitPower = 0.1;
       fountainParticles.maxEmitPower = 0.2;
       fountainParticles.updateSpeed = 0.01;
       
       // Start the particle system
       fountainParticles.start();
       console.log('✨ Fountain particle system started');

      // Log summary of all objects created
      console.log('🎮 Expanded world summary:');
      console.log('  - 1 central fountain with particles');
      console.log('  - 4 buildings with windows');
      console.log('  - 8 trees around the plaza');
      console.log('  - 4 decorative rotating objects');
      console.log('  - 1 bridge to the north');
      console.log('  - 1 small lake to the south');
      console.log('  - 1 blue box (original)');
      console.log('  - 1 ground plane');
      console.log('  - 1 ambient particle system');
      console.log('  - 1 fountain particle system');
      console.log('  - Total: 20+ objects in expanded world');

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
            currentUserPosition={currentUserPosition}
            userAvatars={userAvatars}
          />
        )}
        
        {/* Avatar Interactions */}
        {sceneRef.current && (
          <AvatarInteractions
            scene={sceneRef.current}
            currentUserAvatar={userAvatars.find(avatar => avatar.isCurrentUser)}
            nearbyAvatars={userAvatars.filter(avatar => !avatar.isCurrentUser)}
          />
        )}
        
        {/* Avatar Movement Controls */}
        {(() => {
          console.log('🎮 AvatarMovement render check:', {
            hasScene: !!sceneRef.current,
            hasCamera: !!camera,
            userAvatarsCount: userAvatars.length,
            currentUserId
          });
          
          return (
            <div>
              {/* Test div to verify this area renders */}
              <div style={{
                position: 'absolute',
                bottom: '200px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'red',
                color: 'white',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '12px',
                zIndex: 999
              }}>
                �� Movement Test Area - If you see this, AvatarMovement should render below
              </div>
              
              <AvatarMovement
                scene={sceneRef.current || undefined}
                camera={camera || undefined}
                currentUserAvatar={userAvatars.find(avatar => avatar.isCurrentUser)}
              />
            </div>
          );
        })()}
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