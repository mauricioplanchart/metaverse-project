import React, { useRef, useEffect, useState } from 'react';
import { useMetaverseStore } from '../stores/useMetaverseStore';
import { metaverseService } from '../lib/metaverseService';
import { Room, Teleporter, InteractiveObject } from '../../../shared/types';

const WorldScene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<any>(null);
  const engineRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const {
    currentRoom,
    currentUser,
    users,
    setNearbyObjects,
    setNearbyTeleporters,
    setInteractionPrompt
  } = useMetaverseStore();

  // Initialize Babylon.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const initializeBabylon = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Dynamic import of Babylon.js
        const BABYLON = await import('@babylonjs/core');
        
        // Create engine and scene
        const engine = new BABYLON.Engine(canvasRef.current!, true);
        const scene = new BABYLON.Scene(engine);
        
        // Store references
        engineRef.current = engine;
        sceneRef.current = scene;
        
        // Create camera
        const camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 5, -10), scene);
        camera.setTarget(BABYLON.Vector3.Zero());
        camera.attachControl(canvasRef.current!, true);
        
        // Camera settings
        camera.speed = 0.5;
        camera.angularSensibility = 2000;
        camera.minZ = 0.1;
        camera.maxZ = 1000;
        
        cameraRef.current = camera;
        
        // Setup controls
        setupControls(scene, camera, BABYLON);
        
        // Setup lighting (will be updated based on room environment)
        setupDefaultLighting(scene, BABYLON);
        
        // Start render loop
        engine.runRenderLoop(() => {
          scene.render();
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
          engine.resize();
        });
        
        setIsLoading(false);
        
      } catch (err) {
        console.error('Failed to initialize Babylon.js:', err);
        setError('Failed to load 3D scene');
        setIsLoading(false);
      }
    };

    initializeBabylon();

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
      }
      window.removeEventListener('resize', () => {});
    };
  }, []);

  // Update scene when room changes
  useEffect(() => {
    if (!sceneRef.current || !currentRoom) return;
    
    updateRoomEnvironment(currentRoom);
    createRoomGeometry(currentRoom);
    createTeleporters(currentRoom.teleporters);
    createInteractiveObjects(currentRoom.interactiveObjects);
    
  }, [currentRoom]);

  // Update user avatars
  useEffect(() => {
    if (!sceneRef.current) return;
    updateAvatars();
  }, [users, currentUser]);

  const setupControls = (scene: any, camera: any, BABYLON: any) => {
    const canvas = canvasRef.current!;
    
    // WASD movement
    const inputMap: { [key: string]: boolean } = {};
    
    scene.actionManager = new BABYLON.ActionManager(scene);
    
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt: any) => {
      inputMap[evt.sourceEvent.key] = evt.sourceEvent.type === 'keydown';
    }));
    
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, (evt: any) => {
      inputMap[evt.sourceEvent.key] = evt.sourceEvent.type === 'keydown';
    }));
    
    // Movement loop
    scene.registerBeforeRender(() => {
      const speed = 0.3;
      const direction = new BABYLON.Vector3(0, 0, 0);
      
      if (inputMap['w'] || inputMap['W']) direction.addInPlace(camera.getForwardRay().direction);
      if (inputMap['s'] || inputMap['S']) direction.subtractInPlace(camera.getForwardRay().direction);
      if (inputMap['a'] || inputMap['A']) direction.subtractInPlace(camera.getRightRay().direction);
      if (inputMap['d'] || inputMap['D']) direction.addInPlace(camera.getRightRay().direction);
      
      if (direction.length() > 0) {
        direction.normalize();
        direction.scaleInPlace(speed);
        camera.position.addInPlace(direction);
        
        // Send position update to server
        if (currentUser) {
          metaverseService.updatePosition(
            {
              x: camera.position.x,
              y: camera.position.y,
              z: camera.position.z
            },
            {
              x: camera.rotation.x,
              y: camera.rotation.y,
              z: camera.rotation.z
            }
          );
        }
        
        // Check for nearby objects and teleporters
        checkNearbyInteractables();
      }
    });
    
    // Click handling for interactions
    canvas.addEventListener('click', handleClick);
  };

  const setupDefaultLighting = (scene: any, BABYLON: any) => {
    // Ambient light
    const ambientLight = new BABYLON.HemisphericLight('ambientLight', new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.6;
    
    // Directional light
    const directionalLight = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-1, -1, -1), scene);
    directionalLight.intensity = 0.8;
  };

  const updateRoomEnvironment = async (room: Room) => {
    if (!sceneRef.current) return;
    
    const BABYLON = await import('@babylonjs/core');
    const scene = sceneRef.current;
    const env = room.environmentSettings;
    
    // Update sky color
    scene.clearColor = BABYLON.Color3.FromHexString(env.skyColor);
    
    // Update fog
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
    scene.fogColor = BABYLON.Color3.FromHexString(env.fogColor);
    scene.fogDensity = env.fogDensity;
    
    // Update lighting
    const ambientLight = scene.getLightByName('ambientLight');
    if (ambientLight) {
      ambientLight.diffuse = new BABYLON.Color3(env.ambientLight.r, env.ambientLight.g, env.ambientLight.b);
      ambientLight.intensity = env.ambientLight.intensity;
    }
    
    const directionalLight = scene.getLightByName('dirLight');
    if (directionalLight) {
      directionalLight.direction = new BABYLON.Vector3(
        env.directionalLight.direction.x,
        env.directionalLight.direction.y,
        env.directionalLight.direction.z
      );
      directionalLight.diffuse = new BABYLON.Color3(
        env.directionalLight.color.r,
        env.directionalLight.color.g,
        env.directionalLight.color.b
      );
      directionalLight.intensity = env.directionalLight.intensity;
    }
    
    // Add particles if specified
    if (env.particles) {
      createParticleSystem(env.particles);
    }
  };

  const createRoomGeometry = async (room: Room) => {
    if (!sceneRef.current) return;
    
    const BABYLON = await import('@babylonjs/core');
    const scene = sceneRef.current;
    
    // Clear existing room geometry
    const existingMeshes = scene.meshes.filter((mesh: any) => mesh.name.startsWith('room_'));
    existingMeshes.forEach((mesh: any) => mesh.dispose());
    
    // Create ground
    const ground = BABYLON.MeshBuilder.CreateGround('room_ground', {
      width: room.size.width,
      height: room.size.depth
    }, scene);
    
    const groundMaterial = new BABYLON.StandardMaterial('room_groundMat', scene);
    groundMaterial.diffuseColor = BABYLON.Color3.FromHexString(room.environmentSettings.groundColor);
    
    // Add texture based on theme
    switch (room.environmentSettings.groundTexture) {
      case 'grass':
        groundMaterial.diffuseColor = BABYLON.Color3.Green();
        break;
      case 'sand':
        groundMaterial.diffuseColor = BABYLON.Color3.FromHexString('#F4A460');
        break;
      case 'stone':
        groundMaterial.diffuseColor = BABYLON.Color3.Gray();
        break;
      case 'metal':
        groundMaterial.diffuseColor = BABYLON.Color3.FromHexString('#333333');
        groundMaterial.specularColor = BABYLON.Color3.White();
        break;
    }
    
    ground.material = groundMaterial;
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, {
      mass: 0,
      restitution: 0.1
    }, scene);
    
    // Create themed decorations based on room theme
    createThemedDecorations(room);
  };

  const createThemedDecorations = async (room: Room) => {
    if (!sceneRef.current) return;
    
    const BABYLON = await import('@babylonjs/core');
    const scene = sceneRef.current;
    
    switch (room.theme) {
      case 'forest':
        // Create trees
        for (let i = 0; i < 10; i++) {
          const tree = BABYLON.MeshBuilder.CreateCylinder(`tree_${i}`, {
            height: 8,
            diameterTop: 0.5,
            diameterBottom: 1
          }, scene);
          tree.position = new BABYLON.Vector3(
            (Math.random() - 0.5) * room.size.width * 0.8,
            4,
            (Math.random() - 0.5) * room.size.depth * 0.8
          );
          const treeMaterial = new BABYLON.StandardMaterial(`treeMat_${i}`, scene);
          treeMaterial.diffuseColor = BABYLON.Color3.FromHexString('#8B4513');
          tree.material = treeMaterial;
        }
        break;
        
      case 'space':
        // Create floating platforms
        for (let i = 0; i < 5; i++) {
          const platform = BABYLON.MeshBuilder.CreateBox(`platform_${i}`, {
            width: 4,
            height: 0.5,
            depth: 4
          }, scene);
          platform.position = new BABYLON.Vector3(
            (Math.random() - 0.5) * room.size.width * 0.6,
            Math.random() * 10 + 2,
            (Math.random() - 0.5) * room.size.depth * 0.6
          );
          const platformMaterial = new BABYLON.StandardMaterial(`platformMat_${i}`, scene);
          platformMaterial.diffuseColor = BABYLON.Color3.FromHexString('#4169E1');
          platformMaterial.emissiveColor = BABYLON.Color3.FromHexString('#1E90FF');
          platform.material = platformMaterial;
        }
        break;
        
      case 'underwater':
        // Create coral formations
        for (let i = 0; i < 8; i++) {
          const coral = BABYLON.MeshBuilder.CreateSphere(`coral_${i}`, {
            diameter: Math.random() * 3 + 1
          }, scene);
          coral.position = new BABYLON.Vector3(
            (Math.random() - 0.5) * room.size.width * 0.7,
            Math.random() * 3 + 1,
            (Math.random() - 0.5) * room.size.depth * 0.7
          );
          const coralMaterial = new BABYLON.StandardMaterial(`coralMat_${i}`, scene);
          coralMaterial.diffuseColor = BABYLON.Color3.FromHexString('#FF7F50');
          coral.material = coralMaterial;
        }
        break;
        
      case 'desert':
        // Create sand dunes
        for (let i = 0; i < 6; i++) {
          const dune = BABYLON.MeshBuilder.CreateSphere(`dune_${i}`, {
            diameter: Math.random() * 8 + 4
          }, scene);
          dune.position = new BABYLON.Vector3(
            (Math.random() - 0.5) * room.size.width * 0.8,
            0,
            (Math.random() - 0.5) * room.size.depth * 0.8
          );
          dune.scaling.y = 0.3;
          const duneMaterial = new BABYLON.StandardMaterial(`duneMat_${i}`, scene);
          duneMaterial.diffuseColor = BABYLON.Color3.FromHexString('#DEB887');
          dune.material = duneMaterial;
        }
        break;
    }
  };

  const createTeleporters = async (teleporters: Teleporter[]) => {
    if (!sceneRef.current) return;
    
    const BABYLON = await import('@babylonjs/core');
    const scene = sceneRef.current;
    
    // Clear existing teleporters
    const existingTeleporters = scene.meshes.filter((mesh: any) => mesh.name.startsWith('teleporter_'));
    existingTeleporters.forEach((mesh: any) => mesh.dispose());
    
    teleporters.forEach((teleporter) => {
      if (!teleporter.isActive) return;
      
      // Create teleporter visual based on effect type
      let teleporterMesh: any;
      
      switch (teleporter.effect) {
        case 'portal':
          teleporterMesh = BABYLON.MeshBuilder.CreateTorus(`teleporter_${teleporter.id}`, {
            diameter: 6,
            thickness: 0.5
          }, scene);
          break;
        case 'pad':
          teleporterMesh = BABYLON.MeshBuilder.CreateCylinder(`teleporter_${teleporter.id}`, {
            height: 0.2,
            diameter: 4
          }, scene);
          break;
        default:
          teleporterMesh = BABYLON.MeshBuilder.CreateSphere(`teleporter_${teleporter.id}`, {
            diameter: 4
          }, scene);
      }
      
      teleporterMesh.position = new BABYLON.Vector3(
        teleporter.position.x,
        teleporter.position.y,
        teleporter.position.z
      );
      
      // Create glowing material
      const teleporterMaterial = new BABYLON.StandardMaterial(`teleporterMat_${teleporter.id}`, scene);
      teleporterMaterial.diffuseColor = BABYLON.Color3.FromHexString(teleporter.color);
      teleporterMaterial.emissiveColor = BABYLON.Color3.FromHexString(teleporter.color);
      teleporterMaterial.alpha = 0.8;
      teleporterMesh.material = teleporterMaterial;
      
      // Add rotation animation
      scene.registerBeforeRender(() => {
        teleporterMesh.rotation.y += 0.02;
      });
      
      // Store teleporter data on mesh
      teleporterMesh.teleporterData = teleporter;
    });
    
    setNearbyTeleporters(teleporters.filter(t => t.isActive));
  };

  const createInteractiveObjects = async (objects: InteractiveObject[]) => {
    if (!sceneRef.current) return;
    
    const BABYLON = await import('@babylonjs/core');
    const scene = sceneRef.current;
    
    // Clear existing objects
    const existingObjects = scene.meshes.filter((mesh: any) => mesh.name.startsWith('object_'));
    existingObjects.forEach((mesh: any) => mesh.dispose());
    
    objects.forEach((object) => {
      if (!object.isInteractable) return;
      
      let objectMesh: any;
      
      // Create object based on type
      switch (object.type) {
        case 'chest':
          objectMesh = BABYLON.MeshBuilder.CreateBox(`object_${object.id}`, {
            width: 2,
            height: 1.5,
            depth: 1.5
          }, scene);
          break;
        case 'collectible':
          objectMesh = BABYLON.MeshBuilder.CreateSphere(`object_${object.id}`, {
            diameter: 1.5
          }, scene);
          break;
        case 'npc':
          objectMesh = BABYLON.MeshBuilder.CreateCylinder(`object_${object.id}`, {
            height: 6,
            diameter: 2
          }, scene);
          break;
        case 'switch':
          objectMesh = BABYLON.MeshBuilder.CreateBox(`object_${object.id}`, {
            size: 1
          }, scene);
          break;
        default:
          objectMesh = BABYLON.MeshBuilder.CreateBox(`object_${object.id}`, {
            size: 2
          }, scene);
      }
      
      objectMesh.position = new BABYLON.Vector3(
        object.position.x,
        object.position.y,
        object.position.z
      );
      
      objectMesh.rotation = new BABYLON.Vector3(
        object.rotation.x,
        object.rotation.y,
        object.rotation.z
      );
      
      objectMesh.scaling = new BABYLON.Vector3(
        object.scale.x,
        object.scale.y,
        object.scale.z
      );
      
      // Create material based on object state
      const objectMaterial = new BABYLON.StandardMaterial(`objectMat_${object.id}`, scene);
      
      if (object.state.collected) {
        objectMaterial.alpha = 0.3;
        objectMaterial.diffuseColor = BABYLON.Color3.Gray();
      } else {
        switch (object.type) {
          case 'chest':
            objectMaterial.diffuseColor = BABYLON.Color3.FromHexString('#8B4513');
            break;
          case 'collectible':
            objectMaterial.diffuseColor = BABYLON.Color3.FromHexString('#FFD700');
            objectMaterial.emissiveColor = BABYLON.Color3.FromHexString('#FFD700');
            break;
          case 'npc':
            objectMaterial.diffuseColor = BABYLON.Color3.FromHexString('#228B22');
            break;
          case 'switch':
            objectMaterial.diffuseColor = object.state.powered ? 
              BABYLON.Color3.Green() : BABYLON.Color3.Red();
            break;
          default:
            objectMaterial.diffuseColor = BABYLON.Color3.Blue();
        }
      }
      
      objectMesh.material = objectMaterial;
      
      // Store object data on mesh
      objectMesh.objectData = object;
      
      // Add hover effect for collectibles
      if (object.type === 'collectible' && !object.state.collected) {
        scene.registerBeforeRender(() => {
          objectMesh.position.y = object.position.y + Math.sin(Date.now() * 0.003) * 0.2;
          objectMesh.rotation.y += 0.01;
        });
      }
    });
    
    setNearbyObjects(objects.filter(o => o.isInteractable));
  };

  const createParticleSystem = async (particleConfig: any) => {
    if (!sceneRef.current) return;
    
    const BABYLON = await import('@babylonjs/core');
    const scene = sceneRef.current;
    
    const particleSystem = new BABYLON.ParticleSystem('particles', particleConfig.count, scene);
    
    // Create emitter
    const emitter = BABYLON.MeshBuilder.CreateSphere('emitter', { diameter: 0.1 }, scene);
    emitter.position = new BABYLON.Vector3(0, 20, 0);
    emitter.isVisible = false;
    
    particleSystem.particleTexture = new BABYLON.Texture('https://playground.babylonjs.com/textures/flare.png', scene);
    particleSystem.emitter = emitter;
    
    // Configure particles based on type
    switch (particleConfig.type) {
      case 'leaves':
        particleSystem.minEmitBox = new BABYLON.Vector3(-50, 0, -50);
        particleSystem.maxEmitBox = new BABYLON.Vector3(50, 0, 50);
        particleSystem.direction1 = new BABYLON.Vector3(-1, -1, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, -1, 1);
        break;
      case 'stars':
        particleSystem.minEmitBox = new BABYLON.Vector3(-100, 0, -100);
        particleSystem.maxEmitBox = new BABYLON.Vector3(100, 0, 100);
        particleSystem.direction1 = new BABYLON.Vector3(0, 0, 0);
        particleSystem.direction2 = new BABYLON.Vector3(0, 0, 0);
        break;
    }
    
    particleSystem.color1 = BABYLON.Color4.FromHexString(particleConfig.color + 'FF');
    particleSystem.color2 = BABYLON.Color4.FromHexString(particleConfig.color + '88');
    particleSystem.minLifeTime = 5;
    particleSystem.maxLifeTime = 10;
    particleSystem.emitRate = 10;
    
    particleSystem.start();
  };

  const updateAvatars = async () => {
    if (!sceneRef.current || !currentUser) return;
    
    const BABYLON = await import('@babylonjs/core');
    const scene = sceneRef.current;
    
    // Clear existing avatars
    const existingAvatars = scene.meshes.filter((mesh: any) => mesh.name.startsWith('avatar_'));
    existingAvatars.forEach((mesh: any) => mesh.dispose());
    
    // Create avatars for other users
    Object.values(users).forEach((user) => {
      if (user.id === currentUser.id) return; // Skip current user
      
      // Create avatar capsule
      const avatar = BABYLON.MeshBuilder.CreateCapsule(`avatar_${user.id}`, {
        radius: 0.5,
        height: 2
      }, scene);
      
      avatar.position = new BABYLON.Vector3(
        user.position.x,
        user.position.y,
        user.position.z
      );
      
      // Create random colored material
      const avatarMaterial = new BABYLON.StandardMaterial(`avatarMat_${user.id}`, scene);
      const hue = Math.abs(user.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 360;
      avatarMaterial.diffuseColor = BABYLON.Color3.FromHSV(hue, 0.8, 0.9);
      avatar.material = avatarMaterial;
      
      // Create username label
      const usernameTexture = new BABYLON.DynamicTexture(`usernameTexture_${user.id}`, {
        width: 256,
        height: 64
      }, scene);
      
      usernameTexture.drawText(user.username || 'Anonymous', null, null, 'bold 24px Arial', 'white', 'transparent', true);
      
      const usernamePlane = BABYLON.MeshBuilder.CreatePlane(`usernamePlane_${user.id}`, {
        width: 3,
        height: 0.75
      }, scene);
      
      const usernameMaterial = new BABYLON.StandardMaterial(`usernameMat_${user.id}`, scene);
      usernameMaterial.diffuseTexture = usernameTexture;
      usernameMaterial.useAlphaFromDiffuseTexture = true;
      usernamePlane.material = usernameMaterial;
      usernamePlane.position = avatar.position.add(new BABYLON.Vector3(0, 2, 0));
      usernamePlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    });
  };

  const checkNearbyInteractables = async () => {
    if (!sceneRef.current || !cameraRef.current) return;
    
    const { Vector3 } = await import('@babylonjs/core');
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    const playerPosition = camera.position;
    const interactionDistance = 5;
    
    // Check teleporters
    const nearbyTeleporters = scene.meshes
      .filter((mesh: any) => mesh.name.startsWith('teleporter_'))
      .filter((mesh: any) => {
        const distance = Vector3.Distance(playerPosition, mesh.position);
        return distance <= interactionDistance;
      });
    
    // Check interactive objects
    const nearbyObjects = scene.meshes
      .filter((mesh: any) => mesh.name.startsWith('object_'))
      .filter((mesh: any) => {
        const distance = Vector3.Distance(playerPosition, mesh.position);
        return distance <= interactionDistance;
      });
    
    // Update interaction prompt
    if (nearbyTeleporters.length > 0) {
      const teleporter = nearbyTeleporters[0].teleporterData;
      setInteractionPrompt(true, `Press E to use ${teleporter.name}`);
    } else if (nearbyObjects.length > 0) {
      const object = nearbyObjects[0].objectData;
      setInteractionPrompt(true, `Press E to interact with ${object.name}`);
    } else {
      setInteractionPrompt(false);
    }
  };

  const handleClick = async (event: MouseEvent) => {
    if (!sceneRef.current || !cameraRef.current) return;
    
    const scene = sceneRef.current;
    
    // Create picking ray
    const pickInfo = scene.pick(event.offsetX, event.offsetY);
    
    if (pickInfo.hit && pickInfo.pickedMesh) {
      const mesh = pickInfo.pickedMesh;
      
      // Handle teleporter click
      if (mesh.name.startsWith('teleporter_') && mesh.teleporterData) {
        const teleporter = mesh.teleporterData;
        metaverseService.teleport(teleporter.id);
      }
      
      // Handle object interaction
      if (mesh.name.startsWith('object_') && mesh.objectData) {
        const object = mesh.objectData;
        metaverseService.interact(object.id);
      }
    }
  };

  // Handle keyboard interactions
  useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent) => {
      if (event.key === 'e' || event.key === 'E') {
        // Find nearest interactable
        if (!sceneRef.current || !cameraRef.current) return;
        
        const { Vector3 } = await import('@babylonjs/core');
        const camera = cameraRef.current;
        const scene = sceneRef.current;
        const playerPosition = camera.position;
        const interactionDistance = 5;
        
        // Check teleporters first
        const nearbyTeleporter = scene.meshes
          .filter((mesh: any) => mesh.name.startsWith('teleporter_'))
          .find((mesh: any) => {
            const distance = Vector3.Distance(playerPosition, mesh.position);
            return distance <= interactionDistance;
          });
        
        if (nearbyTeleporter?.teleporterData) {
          metaverseService.teleport(nearbyTeleporter.teleporterData.id);
          return;
        }
        
        // Check objects
        const nearbyObject = scene.meshes
          .filter((mesh: any) => mesh.name.startsWith('object_'))
          .find((mesh: any) => {
            const distance = Vector3.Distance(playerPosition, mesh.position);
            return distance <= interactionDistance;
          });
        
        if (nearbyObject?.objectData) {
          metaverseService.interact(nearbyObject.objectData.id);
        }
      }
    };
    
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  if (error) {
    return (
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        color: 'red',
        fontSize: '18px',
        textAlign: 'center'
      }}>
        <div>❌ {error}</div>
        <div style={{ fontSize: '14px', marginTop: '10px' }}>
          Please refresh the page to try again
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        color: 'white',
        fontSize: '18px',
        textAlign: 'center'
      }}>
        <div>🌍 Loading World...</div>
        <div style={{ fontSize: '14px', marginTop: '10px' }}>
          Initializing 3D environment
        </div>
      </div>
    );
  }

  return (
    <>
      <canvas 
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'block',
          outline: 'none'
        }}
        tabIndex={0}
      />
      
      {/* Controls overlay */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: 'white',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <div>🎮 <strong>Controls:</strong></div>
        <div>WASD - Move</div>
        <div>Mouse - Look around</div>
        <div>E - Interact</div>
        <div>Click - Teleport/Interact</div>
        <div>T - Chat</div>
      </div>
      
      {/* Room info */}
      {currentRoom && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          color: 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '14px',
          textAlign: 'right'
        }}>
          <div><strong>{currentRoom.name}</strong></div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            {currentRoom.description}
          </div>
        </div>
      )}
    </>
  );
};

export default WorldScene; 