import React, { useEffect, useState, useRef } from 'react';
import { useMetaverseStore } from '../stores/useMetaverseStore';
import { socketService } from '../lib/socketService';
import * as BABYLON from '@babylonjs/core';

interface AvatarMovementProps {
  scene: BABYLON.Scene;
  camera: BABYLON.Camera;
  currentUserAvatar: any;
}

const AvatarMovement: React.FC<AvatarMovementProps> = ({ 
  scene, 
  camera, 
  currentUserAvatar 
}) => {
  const { currentUserId } = useMetaverseStore();
  const [position, setPosition] = useState<BABYLON.Vector3>(new BABYLON.Vector3(0, 0, 0));
  const [isMoving, setIsMoving] = useState(false);
  const [movementSpeed] = useState(0.1);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Debug render
  console.log('🚶 AvatarMovement render:', { 
    hasScene: !!scene, 
    hasCamera: !!camera, 
    hasAvatar: !!currentUserAvatar,
    position: position.toString(),
    isMoving
  });

  useEffect(() => {
    if (!scene || !camera || !currentUserAvatar) {
      console.log('🚶 AvatarMovement: Missing required props:', { 
        hasScene: !!scene, 
        hasCamera: !!camera, 
        hasAvatar: !!currentUserAvatar 
      });
      return;
    }

    console.log('🚶 AvatarMovement: Initializing movement system for user:', currentUserAvatar.username);

    // Handle keyboard input
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keysRef.current[key] = true;
      setIsMoving(true);
      console.log('🚶 Key pressed:', key, 'Keys state:', keysRef.current);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keysRef.current[key] = false;
      
      // Check if any movement keys are still pressed
      const movementKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
      const anyKeyPressed = movementKeys.some(k => keysRef.current[k]);
      setIsMoving(anyKeyPressed);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Movement loop
    const movementLoop = () => {
      let moved = false;
      const newPosition = position.clone();

      // WASD movement
      if (keysRef.current['w'] || keysRef.current['arrowup']) {
        newPosition.z -= movementSpeed;
        moved = true;
      }
      if (keysRef.current['s'] || keysRef.current['arrowdown']) {
        newPosition.z += movementSpeed;
        moved = true;
      }
      if (keysRef.current['a'] || keysRef.current['arrowleft']) {
        newPosition.x -= movementSpeed;
        moved = true;
      }
      if (keysRef.current['d'] || keysRef.current['arrowright']) {
        newPosition.x += movementSpeed;
        moved = true;
      }

      // Update position if moved
      if (moved) {
        setPosition(newPosition);
        console.log('🚶 Moving to position:', newPosition);
        
        // Update avatar position in 3D scene (if mesh exists)
        if (currentUserAvatar && currentUserAvatar.mesh) {
          currentUserAvatar.mesh.position = newPosition;
        }

        // Send position update to server
        socketService.emit('avatar-move', {
          position: newPosition,
          timestamp: Date.now()
        });
      }
    };

    // Run movement loop
    const interval = setInterval(movementLoop, 16); // ~60fps

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(interval);
    };
  }, [scene, camera, currentUserAvatar, movementSpeed, currentUserId]); // Removed position from dependencies

  // Handle server position updates
  useEffect(() => {
    const handleAvatarMove = (data: any) => {
      if (data.userId === currentUserId) {
        setPosition(new BABYLON.Vector3(data.position.x, data.position.y, data.position.z));
      }
    };

    socketService.on('avatar-moved', handleAvatarMove);

    return () => {
      socketService.off('avatar-moved', handleAvatarMove);
    };
  }, [currentUserId]);

  const testMovement = () => {
    const newPosition = position.clone();
    newPosition.x += 1;
    setPosition(newPosition);
    console.log('🚶 Test movement to:', newPosition);
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 1000,
      border: '2px solid #4CAF50'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#4CAF50' }}>
        🚶 Avatar Movement (v2)
      </div>
      <div style={{ marginBottom: '4px' }}>
        Position: X: {position.x.toFixed(2)}, Z: {position.z.toFixed(2)}
      </div>
      <div style={{ marginBottom: '4px' }}>
        Status: {isMoving ? '🟢 Moving' : '⚪ Idle'}
      </div>
      <div style={{ marginBottom: '4px', fontSize: '10px', opacity: 0.7 }}>
        System: {scene && camera && currentUserAvatar ? '🟢 Active' : '🔴 Inactive'}
      </div>
      <div style={{ marginBottom: '8px' }}>
        <button 
          onClick={testMovement}
          style={{
            padding: '4px 8px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Test Move
        </button>
      </div>
      <div style={{ fontSize: '10px', opacity: 0.7 }}>
        Use WASD or Arrow Keys to move
      </div>
      <div style={{ fontSize: '10px', opacity: 0.7 }}>
        Walk near other avatars to chat!
      </div>
    </div>
  );
};

export default AvatarMovement; 