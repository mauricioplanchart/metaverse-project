import React, { useEffect, useState } from 'react';
import * as BABYLON from '@babylonjs/core';

interface WorldInteractionsProps {
  scene: BABYLON.Scene;
  onTeleport?: (destination: BABYLON.Vector3) => void;
  onPortalEnter?: (portalId: string) => void;
  onObjectInteract?: (objectId: string, interactionType: string) => void;
}

interface Teleporter {
  id: string;
  mesh: BABYLON.Mesh;
  destination: BABYLON.Vector3;
  name: string;
}

interface Portal {
  id: string;
  mesh: BABYLON.Mesh;
  destination: string;
  name: string;
}

interface InteractiveObject {
  id: string;
  mesh: BABYLON.Mesh;
  type: 'chest' | 'lever' | 'button' | 'sign';
  name: string;
  description: string;
}

const WorldInteractions: React.FC<WorldInteractionsProps> = ({
  scene,
  onTeleport,
  onPortalEnter,
  onObjectInteract
}) => {
  const [teleporters, setTeleporters] = useState<Teleporter[]>([]);
  const [portals, setPortals] = useState<Portal[]>([]);
  const [interactiveObjects, setInteractiveObjects] = useState<InteractiveObject[]>([]);
  const [nearbyObject, setNearbyObject] = useState<string | null>(null);
  const [showInteractionPrompt, setShowInteractionPrompt] = useState(false);

  // Create teleporters
  const createTeleporters = () => {
    const teleporterData = [
      {
        id: 'teleporter1',
        position: new BABYLON.Vector3(15, 0, 15),
        destination: new BABYLON.Vector3(-15, 0, -15),
        name: 'Mountain Peak'
      },
      {
        id: 'teleporter2',
        position: new BABYLON.Vector3(-15, 0, 15),
        destination: new BABYLON.Vector3(15, 0, -15),
        name: 'Beach Resort'
      },
      {
        id: 'teleporter3',
        position: new BABYLON.Vector3(0, 0, 25),
        destination: new BABYLON.Vector3(0, 0, -25),
        name: 'Underground Cave'
      }
    ];

    const newTeleporters: Teleporter[] = teleporterData.map(data => {
      // Create teleporter base
      const base = BABYLON.MeshBuilder.CreateCylinder(
        `${data.id}Base`,
        { height: 0.5, diameter: 2 },
        scene
      );
      base.position = data.position;
      
      const baseMaterial = new BABYLON.StandardMaterial(`${data.id}BaseMat`, scene);
      baseMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
      baseMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.4, 0.1);
      base.material = baseMaterial;

      // Create teleporter ring
      const ring = BABYLON.MeshBuilder.CreateTorus(
        `${data.id}Ring`,
        { diameter: 2.5, thickness: 0.2 },
        scene
      );
      ring.position = data.position.add(new BABYLON.Vector3(0, 0.5, 0));
      
      const ringMaterial = new BABYLON.StandardMaterial(`${data.id}RingMat`, scene);
      ringMaterial.diffuseColor = new BABYLON.Color3(0, 1, 1);
      ringMaterial.emissiveColor = new BABYLON.Color3(0, 0.5, 0.5);
      ring.material = ringMaterial;

      // Add rotation animation to ring
      const rotationAnimation = new BABYLON.Animation(
        `${data.id}Rotation`,
        'rotation.y',
        30,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );

      const keyFrames = [];
      keyFrames.push({ frame: 0, value: 0 });
      keyFrames.push({ frame: 30, value: Math.PI * 2 });
      rotationAnimation.setKeys(keyFrames);

      ring.animations = [rotationAnimation];
      scene.beginAnimation(ring, 0, 30, true, 0.5);

      // Create particle effect
      const teleporterParticles = new BABYLON.ParticleSystem(`${data.id}Particles`, 100, scene);
      teleporterParticles.particleTexture = new BABYLON.Texture('https://playground.babylonjs.com/textures/flare.png', scene);
      
      teleporterParticles.emitter = data.position.add(new BABYLON.Vector3(0, 0.5, 0));
      teleporterParticles.minEmitBox = new BABYLON.Vector3(-0.5, -0.5, -0.5);
      teleporterParticles.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0.5);
      teleporterParticles.color1 = new BABYLON.Color4(0, 1, 1, 1);
      teleporterParticles.color2 = new BABYLON.Color4(0, 0.5, 1, 1);
      teleporterParticles.colorDead = new BABYLON.Color4(0, 0, 0, 0);
      teleporterParticles.minSize = 0.1;
      teleporterParticles.maxSize = 0.3;
      teleporterParticles.minLifeTime = 1;
      teleporterParticles.maxLifeTime = 2;
      teleporterParticles.emitRate = 50;
      teleporterParticles.gravity = new BABYLON.Vector3(0, 0.5, 0);
      teleporterParticles.direction1 = new BABYLON.Vector3(-0.5, -0.5, -0.5);
      teleporterParticles.direction2 = new BABYLON.Vector3(0.5, 0.5, 0.5);
      teleporterParticles.minEmitPower = 0.1;
      teleporterParticles.maxEmitPower = 0.3;
      teleporterParticles.updateSpeed = 0.01;
      
      teleporterParticles.start();

      return {
        id: data.id,
        mesh: base,
        destination: data.destination,
        name: data.name
      };
    });

    setTeleporters(newTeleporters);
    return newTeleporters;
  };

  // Create portals
  const createPortals = () => {
    const portalData = [
      {
        id: 'portal1',
        position: new BABYLON.Vector3(20, 0, 0),
        destination: 'gaming-world',
        name: 'Gaming World Portal'
      },
      {
        id: 'portal2',
        position: new BABYLON.Vector3(-20, 0, 0),
        destination: 'nature-world',
        name: 'Nature World Portal'
      }
    ];

    const newPortals: Portal[] = portalData.map(data => {
      // Create portal frame
      const frame = BABYLON.MeshBuilder.CreateBox(
        `${data.id}Frame`,
        { width: 3, height: 4, depth: 0.5 },
        scene
      );
      frame.position = data.position;
      
      const frameMaterial = new BABYLON.StandardMaterial(`${data.id}FrameMat`, scene);
      frameMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.8);
      frameMaterial.emissiveColor = new BABYLON.Color3(0.4, 0.1, 0.4);
      frame.material = frameMaterial;

      // Create portal surface
      const surface = BABYLON.MeshBuilder.CreatePlane(
        `${data.id}Surface`,
        { width: 2.5, height: 3.5 },
        scene
      );
      surface.position = data.position.add(new BABYLON.Vector3(0, 0, 0.26));
      
      const surfaceMaterial = new BABYLON.StandardMaterial(`${data.id}SurfaceMat`, scene);
      surfaceMaterial.diffuseColor = new BABYLON.Color3(0.5, 0, 1);
      surfaceMaterial.emissiveColor = new BABYLON.Color3(0.2, 0, 0.5);
      surfaceMaterial.alpha = 0.8;
      surface.material = surfaceMaterial;

      // Add portal effect
      const portalParticles = new BABYLON.ParticleSystem(`${data.id}Particles`, 200, scene);
      portalParticles.particleTexture = new BABYLON.Texture('https://playground.babylonjs.com/textures/flare.png', scene);
      
      portalParticles.emitter = data.position.add(new BABYLON.Vector3(0, 0, 0.3));
      portalParticles.minEmitBox = new BABYLON.Vector3(-1, -1.5, 0);
      portalParticles.maxEmitBox = new BABYLON.Vector3(1, 1.5, 0);
      portalParticles.color1 = new BABYLON.Color4(0.5, 0, 1, 1);
      portalParticles.color2 = new BABYLON.Color4(1, 0, 0.5, 1);
      portalParticles.colorDead = new BABYLON.Color4(0, 0, 0, 0);
      portalParticles.minSize = 0.05;
      portalParticles.maxSize = 0.2;
      portalParticles.minLifeTime = 2;
      portalParticles.maxLifeTime = 4;
      portalParticles.emitRate = 100;
      portalParticles.gravity = new BABYLON.Vector3(0, 0, 0);
      portalParticles.direction1 = new BABYLON.Vector3(-0.1, -0.1, -0.1);
      portalParticles.direction2 = new BABYLON.Vector3(0.1, 0.1, 0.1);
      portalParticles.minEmitPower = 0.1;
      portalParticles.maxEmitPower = 0.3;
      portalParticles.updateSpeed = 0.01;
      
      portalParticles.start();

      return {
        id: data.id,
        mesh: frame,
        destination: data.destination,
        name: data.name
      };
    });

    setPortals(newPortals);
    return newPortals;
  };

  // Create interactive objects
  const createInteractiveObjects = () => {
    const objectData = [
      {
        id: 'chest1',
        position: new BABYLON.Vector3(5, 0, 5),
        type: 'chest' as const,
        name: 'Treasure Chest',
        description: 'A mysterious chest that might contain valuable items'
      },
      {
        id: 'lever1',
        position: new BABYLON.Vector3(-5, 0, 5),
        type: 'lever' as const,
        name: 'Ancient Lever',
        description: 'An old lever that might activate something'
      },
      {
        id: 'button1',
        position: new BABYLON.Vector3(5, 0, -5),
        type: 'button' as const,
        name: 'Mysterious Button',
        description: 'A glowing button with unknown purpose'
      },
      {
        id: 'sign1',
        position: new BABYLON.Vector3(-5, 0, -5),
        type: 'sign' as const,
        name: 'Information Sign',
        description: 'A sign with useful information about the area'
      }
    ];

    const newObjects: InteractiveObject[] = objectData.map(data => {
      let mesh: BABYLON.Mesh;

      switch (data.type) {
        case 'chest':
          mesh = BABYLON.MeshBuilder.CreateBox(data.id, { width: 1, height: 0.8, depth: 0.6 }, scene);
          const chestMaterial = new BABYLON.StandardMaterial(`${data.id}Mat`, scene);
          chestMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.2);
          mesh.material = chestMaterial;
          break;
        
        case 'lever':
          mesh = BABYLON.MeshBuilder.CreateCylinder(data.id, { height: 1, diameter: 0.2 }, scene);
          const leverMaterial = new BABYLON.StandardMaterial(`${data.id}Mat`, scene);
          leverMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
          mesh.material = leverMaterial;
          break;
        
        case 'button':
          mesh = BABYLON.MeshBuilder.CreateSphere(data.id, { diameter: 0.5 }, scene);
          const buttonMaterial = new BABYLON.StandardMaterial(`${data.id}Mat`, scene);
          buttonMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
          buttonMaterial.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
          mesh.material = buttonMaterial;
          break;
        
        case 'sign':
          mesh = BABYLON.MeshBuilder.CreatePlane(data.id, { width: 2, height: 1.5 }, scene);
          const signMaterial = new BABYLON.StandardMaterial(`${data.id}Mat`, scene);
          signMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0.8);
          mesh.material = signMaterial;
          break;
      }

      mesh.position = data.position;
      mesh.position.y = data.type === 'sign' ? 1.5 : 0.5;

      // Add interaction highlight
      const highlightMaterial = new BABYLON.StandardMaterial(`${data.id}Highlight`, scene);
      highlightMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0);
      highlightMaterial.alpha = 0.3;
      highlightMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0);

      return {
        id: data.id,
        mesh,
        type: data.type,
        name: data.name,
        description: data.description
      };
    });

    setInteractiveObjects(newObjects);
    return newObjects;
  };

  // Handle interactions
  const handleInteraction = (objectId: string, interactionType: string) => {
    console.log(`🎮 Interaction: ${interactionType} with ${objectId}`);
    onObjectInteract?.(objectId, interactionType);

    // Create interaction effect
    const object = interactiveObjects.find(obj => obj.id === objectId);
    if (object) {
      const effect = new BABYLON.ParticleSystem(`${objectId}Effect`, 50, scene);
      effect.particleTexture = new BABYLON.Texture('https://playground.babylonjs.com/textures/flare.png', scene);
      
      effect.emitter = object.mesh.position;
      effect.minEmitBox = new BABYLON.Vector3(-0.2, -0.2, -0.2);
      effect.maxEmitBox = new BABYLON.Vector3(0.2, 0.2, 0.2);
      effect.color1 = new BABYLON.Color4(1, 1, 0, 1);
      effect.color2 = new BABYLON.Color4(1, 0.5, 0, 1);
      effect.colorDead = new BABYLON.Color4(0, 0, 0, 0);
      effect.minSize = 0.1;
      effect.maxSize = 0.3;
      effect.minLifeTime = 0.5;
      effect.maxLifeTime = 1;
      effect.emitRate = 100;
      effect.gravity = new BABYLON.Vector3(0, 1, 0);
      effect.direction1 = new BABYLON.Vector3(-0.5, -0.5, -0.5);
      effect.direction2 = new BABYLON.Vector3(0.5, 0.5, 0.5);
      effect.minEmitPower = 0.5;
      effect.maxEmitPower = 1;
      effect.updateSpeed = 0.01;
      
      effect.start();
      
      setTimeout(() => {
        effect.stop();
        effect.dispose();
      }, 1000);
    }
  };

  // Initialize interactions
  useEffect(() => {
    if (!scene) return;

    console.log('🎮 Initializing World Interactions...');

    createTeleporters();
    createPortals();
    createInteractiveObjects();

    console.log('🎮 World Interactions initialized');
  }, [scene]);

  // Handle proximity detection and interaction prompts
  useEffect(() => {
    if (!scene) return;

    const checkProximity = () => {
      // This would check player position against interactive objects
      // For now, we'll simulate proximity detection
      const playerPosition = new BABYLON.Vector3(0, 0, 0); // Get from player
      
      // Check teleporters
      teleporters.forEach(teleporter => {
        const distance = BABYLON.Vector3.Distance(playerPosition, teleporter.mesh.position);
        if (distance <= 2) {
          setNearbyObject(teleporter.id);
          setShowInteractionPrompt(true);
          return;
        }
      });

      // Check portals
      portals.forEach(portal => {
        const distance = BABYLON.Vector3.Distance(playerPosition, portal.mesh.position);
        if (distance <= 3) {
          setNearbyObject(portal.id);
          setShowInteractionPrompt(true);
          return;
        }
      });

      // Check interactive objects
      interactiveObjects.forEach(obj => {
        const distance = BABYLON.Vector3.Distance(playerPosition, obj.mesh.position);
        if (distance <= 1.5) {
          setNearbyObject(obj.id);
          setShowInteractionPrompt(true);
          return;
        }
      });

      if (!nearbyObject) {
        setShowInteractionPrompt(false);
      }
    };

    const interval = setInterval(checkProximity, 500);
    return () => clearInterval(interval);
  }, [scene, teleporters, portals, interactiveObjects, nearbyObject]);

  // Handle keyboard interactions
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'e' || event.key === 'E') {
        if (nearbyObject) {
          const teleporter = teleporters.find(t => t.id === nearbyObject);
          if (teleporter) {
            onTeleport?.(teleporter.destination);
            return;
          }

          const portal = portals.find(p => p.id === nearbyObject);
          if (portal) {
            onPortalEnter?.(portal.destination);
            return;
          }

          const object = interactiveObjects.find(o => o.id === nearbyObject);
          if (object) {
            handleInteraction(object.id, object.type);
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nearbyObject, teleporters, portals, interactiveObjects, onTeleport, onPortalEnter]);

  return (
    <>
      {showInteractionPrompt && nearbyObject && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg z-50">
          <div className="text-center">
            <div className="text-sm">Press <kbd className="bg-gray-700 px-2 py-1 rounded">E</kbd> to interact</div>
            <div className="text-xs text-gray-300 mt-1">
              {(() => {
                const teleporter = teleporters.find(t => t.id === nearbyObject);
                if (teleporter) return `Teleport to ${teleporter.name}`;
                
                const portal = portals.find(p => p.id === nearbyObject);
                if (portal) return `Enter ${portal.name}`;
                
                const object = interactiveObjects.find(o => o.id === nearbyObject);
                if (object) return object.description;
                
                return 'Interact';
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorldInteractions; 