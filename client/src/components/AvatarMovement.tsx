import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!scene || !camera || !currentUserAvatar) return;

    const keys: { [key: string]: boolean } = {};
    let lastPosition = position.clone();

    // Handle keyboard input
    const handleKeyDown = (event: KeyboardEvent) => {
      keys[event.key.toLowerCase()] = true;
      setIsMoving(true);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keys[event.key.toLowerCase()] = false;
      setIsMoving(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Movement loop
    const movementLoop = () => {
      let moved = false;
      const newPosition = position.clone();

      // WASD movement
      if (keys['w'] || keys['arrowup']) {
        newPosition.z -= movementSpeed;
        moved = true;
      }
      if (keys['s'] || keys['arrowdown']) {
        newPosition.z += movementSpeed;
        moved = true;
      }
      if (keys['a'] || keys['arrowleft']) {
        newPosition.x -= movementSpeed;
        moved = true;
      }
      if (keys['d'] || keys['arrowright']) {
        newPosition.x += movementSpeed;
        moved = true;
      }

      // Update position if moved
      if (moved) {
        setPosition(newPosition);
        
        // Update avatar position in 3D scene
        if (currentUserAvatar && currentUserAvatar.mesh) {
          currentUserAvatar.mesh.position = newPosition;
        }

        // Send position update to server
        socketService.emit('avatar-move', {
          position: newPosition,
          timestamp: Date.now()
        });

        lastPosition = newPosition.clone();
      }
    };

    // Run movement loop
    const interval = setInterval(movementLoop, 16); // ~60fps

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(interval);
    };
  }, [scene, camera, currentUserAvatar, position, movementSpeed, currentUserId]);

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

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 1000
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        🚶 Avatar Movement
      </div>
      <div style={{ marginBottom: '4px' }}>
        Position: X: {position.x.toFixed(2)}, Z: {position.z.toFixed(2)}
      </div>
      <div style={{ marginBottom: '4px' }}>
        Status: {isMoving ? '🟢 Moving' : '⚪ Idle'}
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