import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useMetaverseStore } from '../stores/useMetaverseStore';
import { metaverseService } from '../lib/metaverseService';
import * as BABYLON from '@babylonjs/core';

interface EnhancedAvatarMovementProps {
  scene?: BABYLON.Scene;
  camera?: BABYLON.Camera;
  currentUserAvatar?: any;
  avatarMesh?: any;
}

interface MovementState {
  position: BABYLON.Vector3;
  velocity: BABYLON.Vector3;
  rotation: BABYLON.Vector3;
  isMoving: boolean;
  isRunning: boolean;
  isJumping: boolean;
  isCrouching: boolean;
  currentAnimation: string;
  lastUpdate: number;
}

const EnhancedAvatarMovement: React.FC<EnhancedAvatarMovementProps> = ({ 
  scene, 
  camera, 
  currentUserAvatar,
  avatarMesh 
}) => {
  const { isConnected } = useMetaverseStore();
  const [movementState, setMovementState] = useState<MovementState>({
    position: new BABYLON.Vector3(0, 0, 0),
    velocity: new BABYLON.Vector3(0, 0, 0),
    rotation: new BABYLON.Vector3(0, 0, 0),
    isMoving: false,
    isRunning: false,
    isJumping: false,
    isCrouching: false,
    currentAnimation: 'idle',
    lastUpdate: Date.now()
  });

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const isInitializedRef = useRef(false);
  const animationFrameRef = useRef<number>();
  const animationRef = useRef<BABYLON.Animation | null>(null);
  const physicsEngineRef = useRef<BABYLON.CannonJSPlugin | null>(null);
  const avatarBodyRef = useRef<any>(null);
  const groundRef = useRef<BABYLON.Mesh | null>(null);

  // Movement constants
  const MOVEMENT_SPEED = 0.15;
  const RUNNING_MULTIPLIER = 1.8;
  const JUMP_FORCE = 0.3;
  const GRAVITY = -0.01;
  const FRICTION = 0.85;
  const ROTATION_SPEED = 0.05;

  console.log('🚶 EnhancedAvatarMovement render:', { 
    hasScene: !!scene, 
    hasCamera: !!camera, 
    hasAvatar: !!currentUserAvatar,
    hasAvatarMesh: !!avatarMesh,
    position: movementState.position.toString(),
    isMoving: movementState.isMoving,
    isInitialized: isInitializedRef.current,
    isConnected
  });

  // Initialize physics engine
  const initializePhysics = useCallback(() => {
    if (!scene) return;

    try {
      // Initialize Cannon.js physics
      physicsEngineRef.current = new BABYLON.CannonJSPlugin();
      scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), physicsEngineRef.current);
      
      console.log('🚶 Physics engine initialized');
    } catch (error) {
      console.warn('🚶 Could not initialize physics engine:', error);
    }
  }, [scene]);

  // Create ground for physics
  const createGround = useCallback(() => {
    if (!scene || !physicsEngineRef.current) return;

    groundRef.current = BABYLON.MeshBuilder.CreateGround('ground', {
      width: 100,
      height: 100
    }, scene);
    
    const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
    groundRef.current.material = groundMaterial;

    // Add physics to ground
    groundRef.current.physicsImpostor = new BABYLON.PhysicsImpostor(
      groundRef.current,
      BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 0.9 },
      scene
    );

    console.log('🚶 Ground created with physics');
  }, [scene]);

  // Create avatar physics body
  const createAvatarPhysicsBody = useCallback(() => {
    if (!scene || !physicsEngineRef.current || !avatarMesh) return;

    try {
      // Create physics body for avatar
      avatarBodyRef.current = new BABYLON.PhysicsImpostor(
        avatarMesh.group,
        BABYLON.PhysicsImpostor.CylinderImpostor,
        { 
          mass: 70, 
          restitution: 0.3,
          friction: 0.5,
          damping: 0.1
        },
        scene
      );

      console.log('🚶 Avatar physics body created');
    } catch (error) {
      console.warn('🚶 Could not create avatar physics body:', error);
    }
  }, [scene, avatarMesh]);

  // Initialize movement system
  useEffect(() => {
    console.log('🚶 EnhancedAvatarMovement: useEffect triggered');
    
    if (isInitializedRef.current) {
      console.log('🚶 EnhancedAvatarMovement: Already initialized, skipping...');
      return;
    }

    console.log('🚶 EnhancedAvatarMovement: Initializing enhanced movement system');
    isInitializedRef.current = true;

    // Initialize physics
    initializePhysics();
    createGround();

    // Handle keyboard input with enhanced controls
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keysRef.current[key] = true;
      
      // Prevent default for movement keys
      if (['w', 'a', 's', 'd', 'shift', 'space', 'control'].includes(key)) {
        event.preventDefault();
      }
      
      console.log('🚶 Key pressed:', key, 'Keys state:', keysRef.current);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keysRef.current[key] = false;
      
      console.log('🚶 Key released:', key, 'Keys state:', keysRef.current);
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Focus canvas for key events
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.focus();
      canvas.addEventListener('click', () => canvas.focus());
    }

    // Enhanced movement loop with physics
    const movementLoop = () => {
      const now = Date.now();
      const deltaTime = (now - movementState.lastUpdate) / 1000; // Convert to seconds
      
      let newVelocity = movementState.velocity.clone();
      let newPosition = movementState.position.clone();
      let newRotation = movementState.rotation.clone();
      let isMoving = false;
      let isRunning = false;
      let isJumping = movementState.isJumping;
      let isCrouching = false;
      let currentAnimation = 'idle';

      // Calculate movement speed
      let speed = MOVEMENT_SPEED;
      if (keysRef.current['shift']) {
        speed *= RUNNING_MULTIPLIER;
        isRunning = true;
      }
      if (keysRef.current['control']) {
        speed *= 0.5;
        isCrouching = true;
      }

      // Handle movement input
      const forward = keysRef.current['w'] || keysRef.current['arrowup'];
      const backward = keysRef.current['s'] || keysRef.current['arrowdown'];
      const left = keysRef.current['a'] || keysRef.current['arrowleft'];
      const right = keysRef.current['d'] || keysRef.current['arrowright'];
      const jump = keysRef.current['space'];

      // Calculate movement direction
      let moveX = 0;
      let moveZ = 0;

      if (forward) moveZ -= 1;
      if (backward) moveZ += 1;
      if (left) moveX -= 1;
      if (right) moveX += 1;

      // Normalize diagonal movement
      if (moveX !== 0 && moveZ !== 0) {
        moveX *= 0.707; // 1/sqrt(2)
        moveZ *= 0.707;
      }

      // Apply movement to velocity
      if (moveX !== 0 || moveZ !== 0) {
        newVelocity.x = moveX * speed;
        newVelocity.z = moveZ * speed;
        isMoving = true;
        
        // Set animation based on movement type
        if (isRunning) {
          currentAnimation = 'run';
        } else if (isCrouching) {
          currentAnimation = 'crouch';
        } else {
          currentAnimation = 'walk';
        }

        // Calculate rotation based on movement direction
        if (moveX !== 0 || moveZ !== 0) {
          const targetRotation = Math.atan2(moveX, -moveZ);
          newRotation.y = targetRotation;
        }
      } else {
        // Apply friction when not moving
        newVelocity.x *= FRICTION;
        newVelocity.z *= FRICTION;
        currentAnimation = 'idle';
      }

      // Handle jumping
      if (jump && !isJumping && Math.abs(newVelocity.y) < 0.1) {
        newVelocity.y = JUMP_FORCE;
        isJumping = true;
        currentAnimation = 'jump';
      }

      // Apply gravity
      if (isJumping) {
        newVelocity.y += GRAVITY;
        
        // Check if landed
        if (newPosition.y <= 0 && newVelocity.y < 0) {
          newPosition.y = 0;
          newVelocity.y = 0;
          isJumping = false;
          currentAnimation = isMoving ? (isRunning ? 'run' : 'walk') : 'idle';
        }
      }

      // Update position
      newPosition.addInPlace(newVelocity.scale(deltaTime * 60)); // Scale for 60 FPS

      // Update movement state
      const newMovementState: MovementState = {
        position: newPosition,
        velocity: newVelocity,
        rotation: newRotation,
        isMoving,
        isRunning,
        isJumping,
        isCrouching,
        currentAnimation,
        lastUpdate: now
      };

      setMovementState(newMovementState);

      // Update avatar mesh position and rotation
      if (avatarMesh && avatarMesh.group) {
        avatarMesh.group.position = newPosition;
        avatarMesh.group.rotation = newRotation;
        
        // Play appropriate animation
        if (avatarMesh.group.avatarAnimations && avatarMesh.group.avatarAnimations[currentAnimation]) {
          const animation = avatarMesh.group.avatarAnimations[currentAnimation];
          if (animation !== animationRef.current) {
            scene?.stopAnimation(avatarMesh.group, animationRef.current?.name || '');
            scene?.beginDirectAnimation(avatarMesh.group, [animation], 0, animation.getHighestFrame(), true);
            animationRef.current = animation;
          }
        }
      }

      // Update physics body if available
      if (avatarBodyRef.current) {
        avatarBodyRef.current.setLinearVelocity(newVelocity);
        avatarBodyRef.current.setAngularVelocity(new BABYLON.Vector3(0, newRotation.y * ROTATION_SPEED, 0));
      }

      // Send position update to server
      if (isConnected && isMoving) {
        metaverseService.updatePosition(
          {
            x: newPosition.x,
            y: newPosition.y,
            z: newPosition.z
          },
          {
            x: newRotation.x,
            y: newRotation.y,
            z: newRotation.z
          }
        );
      }

      // Continue the loop
      animationFrameRef.current = requestAnimationFrame(movementLoop);
    };

    // Start movement loop
    movementLoop();

    return () => {
      // Cleanup
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      isInitializedRef.current = false;
    };
  }, [scene, camera, currentUserAvatar, avatarMesh, isConnected, initializePhysics, createGround]);

  // Create avatar physics body when avatar mesh is available
  useEffect(() => {
    if (avatarMesh && physicsEngineRef.current && !avatarBodyRef.current) {
      createAvatarPhysicsBody();
    }
  }, [avatarMesh, createAvatarPhysicsBody]);

  // Enhanced movement controls (unused for now)
  /*
  const performAction = useCallback((action: string) => {
    switch (action) {
      case 'jump':
        if (!movementState.isJumping) {
          setMovementState(prev => ({
            ...prev,
            velocity: new BABYLON.Vector3(prev.velocity.x, JUMP_FORCE, prev.velocity.z),
            isJumping: true,
            currentAnimation: 'jump'
          }));
        }
        break;
      case 'crouch':
        setMovementState(prev => ({
          ...prev,
          isCrouching: !prev.isCrouching,
          currentAnimation: prev.isCrouching ? 'idle' : 'crouch'
        }));
        break;
      case 'dance':
        setMovementState(prev => ({
          ...prev,
          currentAnimation: 'dance'
        }));
        break;
      case 'wave':
        setMovementState(prev => ({
          ...prev,
          currentAnimation: 'wave'
        }));
        break;
    }
  }, [movementState.isJumping]);
  */

  // Debug functions
  const debugMovement = useCallback(() => {
    console.log('🚶 Movement Debug Info:', {
      position: movementState.position.toString(),
      velocity: movementState.velocity.toString(),
      rotation: movementState.rotation.toString(),
      isMoving: movementState.isMoving,
      isRunning: movementState.isRunning,
      isJumping: movementState.isJumping,
      isCrouching: movementState.isCrouching,
      currentAnimation: movementState.currentAnimation,
      keysPressed: Object.keys(keysRef.current).filter(k => keysRef.current[k])
    });
  }, [movementState]);

  const resetPosition = useCallback(() => {
    setMovementState(prev => ({
      ...prev,
      position: new BABYLON.Vector3(0, 0, 0),
      velocity: new BABYLON.Vector3(0, 0, 0),
      rotation: new BABYLON.Vector3(0, 0, 0)
    }));
  }, []);

  // Expose movement controls for external use (unused for now)
  // const movementControls = {
  //   performAction,
  //   debugMovement,
  //   resetPosition,
  //   getMovementState: () => movementState,
  //   getPosition: () => movementState.position,
  //   getVelocity: () => movementState.velocity
  // };

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-50 text-white p-4 rounded-lg text-sm">
      <div className="mb-2">
        <strong>Enhanced Movement Controls:</strong>
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        <div>WASD / Arrows: Move</div>
        <div>Shift: Run</div>
        <div>Space: Jump</div>
        <div>Ctrl: Crouch</div>
        <div>Q: Dance</div>
        <div>E: Wave</div>
      </div>
      <div className="mt-2 text-xs">
        <div>Position: {movementState.position.x.toFixed(2)}, {movementState.position.y.toFixed(2)}, {movementState.position.z.toFixed(2)}</div>
        <div>Animation: {movementState.currentAnimation}</div>
        <div>Moving: {movementState.isMoving ? 'Yes' : 'No'}</div>
      </div>
      <div className="mt-2 flex gap-2">
        <button
          onClick={debugMovement}
          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
        >
          Debug
        </button>
        <button
          onClick={resetPosition}
          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default EnhancedAvatarMovement; 