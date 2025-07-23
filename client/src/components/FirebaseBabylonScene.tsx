import React, { useEffect, useRef, useState } from 'react';
import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder, Color3, StandardMaterial, DynamicTexture, Mesh } from '@babylonjs/core';
import { firebaseService, AvatarData, ChatMessage, UserPresence } from '../lib/firebaseService';

interface FirebaseBabylonSceneProps {
  onSceneReady?: (scene: Scene) => void;
  onRender?: (scene: Scene) => void;
}

const FirebaseBabylonScene: React.FC<FirebaseBabylonSceneProps> = ({ onSceneReady, onRender }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const cameraRef = useRef<FreeCamera | null>(null);
  const localAvatarRef = useRef<Mesh | null>(null);
  const remoteAvatarsRef = useRef<Map<string, Mesh>>(new Map());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [avatars, setAvatars] = useState<Record<string, AvatarData>>({});
  const [userPresence, setUserPresence] = useState<Record<string, UserPresence>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Initialize Babylon.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new Engine(canvas, true);
    engineRef.current = engine;

    const scene = new Scene(engine);
    sceneRef.current = scene;

    // Create camera
    const camera = new FreeCamera('camera', new Vector3(0, 5, -10), scene);
    camera.setTarget(Vector3.Zero());
    camera.attachControl(canvas, true);
    cameraRef.current = camera;

    // Create lighting
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    // Create ground
    const ground = MeshBuilder.CreateGround('ground', { width: 20, height: 20 }, scene);
    const groundMaterial = new StandardMaterial('groundMaterial', scene);
    groundMaterial.diffuseColor = new Color3(0.2, 0.7, 0.2);
    ground.material = groundMaterial;

    // Create some basic environment
    createEnvironment(scene);

    // Create local avatar
    createLocalAvatar(scene);

    // Handle scene ready
    if (onSceneReady) {
      onSceneReady(scene);
    }

    // Start render loop
    engine.runRenderLoop(() => {
      if (onRender) {
        onRender(scene);
      }
      scene.render();
    });

    // Handle resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
    };
  }, []);

  // Firebase authentication and setup
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Test connection and authenticate
        const connected = await firebaseService.testConnection();
        if (connected) {
          setIsAuthenticated(true);
          console.log('🔥 Firebase initialized successfully');

          // Subscribe to avatars
          const unsubscribeAvatars = firebaseService.subscribeToAvatars((avatarData) => {
            setAvatars(avatarData);
            updateRemoteAvatars(avatarData);
          });

          // Subscribe to user presence
          const unsubscribePresence = firebaseService.subscribeToUserPresence((presence) => {
            setUserPresence(presence);
          });

          // Subscribe to chat messages
          const unsubscribeChat = firebaseService.subscribeToChatMessages((messages) => {
            setChatMessages(messages);
          });

          return () => {
            unsubscribeAvatars();
            unsubscribePresence();
            unsubscribeChat();
          };
        }
      } catch (error) {
        console.error('❌ Failed to initialize Firebase:', error);
      }
    };

    initializeFirebase();

    return () => {
      firebaseService.cleanup();
    };
  }, []);

  // Update avatar position in Firebase
  useEffect(() => {
    if (!isAuthenticated || !localAvatarRef.current) return;

    const interval = setInterval(() => {
      const avatar = localAvatarRef.current;
      if (avatar) {
        const position = avatar.position;
        const rotation = avatar.rotation;
        
        firebaseService.updateAvatarPosition({
          id: firebaseService.getCurrentUser()?.uid || '',
          userId: firebaseService.getCurrentUser()?.uid || '',
          position: { x: position.x, y: position.y, z: position.z },
          rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
          lastUpdate: Date.now()
        });
      }
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Create basic environment
  const createEnvironment = (scene: Scene) => {
    // Create some boxes as decorations
    for (let i = 0; i < 5; i++) {
      const box = MeshBuilder.CreateBox(`box${i}`, { size: 1 }, scene);
      box.position = new Vector3(
        Math.random() * 10 - 5,
        0.5,
        Math.random() * 10 - 5
      );
      
      const material = new StandardMaterial(`boxMaterial${i}`, scene);
      material.diffuseColor = new Color3(
        Math.random(),
        Math.random(),
        Math.random()
      );
      box.material = material;
    }

    // Create a central platform
    const platform = MeshBuilder.CreateCylinder('platform', { diameter: 4, height: 0.2 }, scene);
    platform.position = new Vector3(0, 0.1, 0);
    const platformMaterial = new StandardMaterial('platformMaterial', scene);
    platformMaterial.diffuseColor = new Color3(0.8, 0.8, 0.9);
    platform.material = platformMaterial;
  };

  // Create local avatar
  const createLocalAvatar = (scene: Scene) => {
    const avatar = MeshBuilder.CreateCapsule('localAvatar', { radius: 0.5, height: 1.8 }, scene);
    avatar.position = new Vector3(0, 1, 0);
    
    const material = new StandardMaterial('localAvatarMaterial', scene);
    material.diffuseColor = new Color3(0.2, 0.6, 1.0);
    avatar.material = material;

    // Add name tag
    const nameTagTexture = new DynamicTexture('nameTag', { width: 256, height: 64 }, scene);
    nameTagTexture.drawText('You', null, null, 'bold 40px Arial', 'white', 'rgba(0,0,0,0.7)', true);
    
    const nameTag = MeshBuilder.CreatePlane('nameTag', { width: 2, height: 0.5 }, scene);
    nameTag.position = new Vector3(0, 2.5, 0);
    nameTag.parent = avatar;
    nameTag.billboardMode = Mesh.BILLBOARDMODE_ALL;
    
    const nameTagMaterial = new StandardMaterial('nameTagMaterial', scene);
    nameTagMaterial.diffuseTexture = nameTagTexture;
    nameTagMaterial.useAlphaFromDiffuseTexture = true;
    nameTag.material = nameTagMaterial;

    localAvatarRef.current = avatar;

    // Setup movement controls
    setupMovementControls(scene, avatar);
  };

  // Setup WASD movement controls
  const setupMovementControls = (scene: Scene, avatar: Mesh) => {
    const keys: { [key: string]: boolean } = {};
    
    window.addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true;
    });
    
    window.addEventListener('keyup', (e) => {
      keys[e.key.toLowerCase()] = false;
    });

    scene.registerBeforeRender(() => {
      const speed = 0.1;
      
      if (keys['w'] || keys['arrowup']) {
        avatar.position.z += speed;
      }
      if (keys['s'] || keys['arrowdown']) {
        avatar.position.z -= speed;
      }
      if (keys['a'] || keys['arrowleft']) {
        avatar.position.x -= speed;
      }
      if (keys['d'] || keys['arrowright']) {
        avatar.position.x += speed;
      }

      // Update camera to follow avatar
      if (cameraRef.current) {
        const camera = cameraRef.current;
        const targetPosition = avatar.position.add(new Vector3(0, 5, -10));
        camera.position = Vector3.Lerp(camera.position, targetPosition, 0.1);
        camera.setTarget(avatar.position);
      }
    });
  };

  // Update remote avatars based on Firebase data
  const updateRemoteAvatars = (avatarData: Record<string, AvatarData>) => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    const currentUserId = firebaseService.getCurrentUser()?.uid;

    // Remove avatars that are no longer present
    remoteAvatarsRef.current.forEach((avatar, userId) => {
      if (!avatarData[userId] || userId === currentUserId) {
        avatar.dispose();
        remoteAvatarsRef.current.delete(userId);
      }
    });

    // Add or update avatars
    Object.entries(avatarData).forEach(([userId, data]) => {
      if (userId === currentUserId) return; // Skip local user

      let avatar = remoteAvatarsRef.current.get(userId);
      
      if (!avatar) {
        // Create new remote avatar
        avatar = MeshBuilder.CreateCapsule(`avatar_${userId}`, { radius: 0.5, height: 1.8 }, scene);
        
        const material = new StandardMaterial(`avatarMaterial_${userId}`, scene);
        material.diffuseColor = new Color3(
          0.8 + Math.random() * 0.2,
          0.4 + Math.random() * 0.4,
          0.4 + Math.random() * 0.4
        );
        avatar.material = material;

        // Add name tag
        const nameTagTexture = new DynamicTexture(`nameTag_${userId}`, { width: 256, height: 64 }, scene);
        nameTagTexture.drawText(userId.substring(0, 8), null, null, 'bold 30px Arial', 'white', 'rgba(0,0,0,0.7)', true);
        
        const nameTag = MeshBuilder.CreatePlane(`nameTag_${userId}`, { width: 2, height: 0.5 }, scene);
        nameTag.position = new Vector3(0, 2.5, 0);
        nameTag.parent = avatar;
        nameTag.billboardMode = Mesh.BILLBOARDMODE_ALL;
        
        const nameTagMaterial = new StandardMaterial(`nameTagMaterial_${userId}`, scene);
        nameTagMaterial.diffuseTexture = nameTagTexture;
        nameTagMaterial.useAlphaFromDiffuseTexture = true;
        nameTag.material = nameTagMaterial;

        remoteAvatarsRef.current.set(userId, avatar);
      }

      // Update avatar position
      if (data.position) {
        const targetPosition = new Vector3(data.position.x, data.position.y, data.position.z);
        avatar.position = Vector3.Lerp(avatar.position, targetPosition, 0.1);
      }

      if (data.rotation) {
        avatar.rotation = new Vector3(data.rotation.x, data.rotation.y, data.rotation.z);
      }
    });
  };

  // Handle chat message sending
  const sendChatMessage = (message: string) => {
    if (isAuthenticated && localAvatarRef.current) {
      const position = localAvatarRef.current.position;
      firebaseService.sendChatMessage(message, 'text', {
        x: position.x,
        y: position.y,
        z: position.z
      });
    }
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ outline: 'none' }}
        tabIndex={0}
      />
      
      {/* Status overlay */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded">
        <div>Firebase: {isAuthenticated ? '🟢 Connected' : '🔴 Disconnected'}</div>
        <div>Users Online: {Object.keys(userPresence).length}</div>
        <div>Avatars: {Object.keys(avatars).length}</div>
      </div>

      {/* Chat overlay */}
      <div className="absolute bottom-4 left-4 w-80 bg-black bg-opacity-70 text-white p-2 rounded max-h-60">
        <div className="text-sm font-bold mb-2">Chat ({chatMessages.length})</div>
        <div className="overflow-y-auto max-h-32 text-xs space-y-1">
          {chatMessages.slice(-10).map((msg) => (
            <div key={msg.id} className="break-words">
              <span className="text-blue-300">{msg.username}:</span> {msg.message}
            </div>
          ))}
        </div>
        <input
          type="text"
          placeholder="Type a message..."
          className="w-full mt-2 p-1 text-black text-xs rounded"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const target = e.target as HTMLInputElement;
              if (target.value.trim()) {
                sendChatMessage(target.value.trim());
                target.value = '';
              }
            }
          }}
        />
      </div>

      {/* Controls help */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs">
        <div className="font-bold mb-1">Controls:</div>
        <div>WASD / Arrow Keys: Move</div>
        <div>Mouse: Look around</div>
        <div>Chat: Type at bottom</div>
      </div>
    </div>
  );
};

export default FirebaseBabylonScene;