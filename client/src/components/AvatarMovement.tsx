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
  const isInitializedRef = useRef(false);

  // Debug render
  console.log('🚶 AvatarMovement render:', { 
    hasScene: !!scene, 
    hasCamera: !!camera, 
    hasAvatar: !!currentUserAvatar,
    position: position.toString(),
    isMoving,
    isInitialized: isInitializedRef.current
  });

  // Always render something, even if props are missing
  if (!scene || !camera || !currentUserAvatar) {
    return (
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(255, 0, 0, 0.9)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 1000,
        border: '2px solid #ff0000'
      }}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
          🚫 Avatar Movement - Missing Props
        </div>
        <div style={{ fontSize: '10px', opacity: 0.7 }}>
          Scene: {scene ? '✅' : '❌'}
        </div>
        <div style={{ fontSize: '10px', opacity: 0.7 }}>
          Camera: {camera ? '✅' : '❌'}
        </div>
        <div style={{ fontSize: '10px', opacity: 0.7 }}>
          Avatar: {currentUserAvatar ? '✅' : '❌'}
        </div>
      </div>
    );
  }

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) {
      console.log('🚶 AvatarMovement: Already initialized, skipping...');
      return;
    }

    console.log('🚶 AvatarMovement: Initializing movement system for user:', currentUserAvatar.username);
    isInitializedRef.current = true;

    // Handle keyboard input
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keysRef.current[key] = true;
      setIsMoving(true);
      console.log('🚶 Key pressed:', key, 'Keys state:', keysRef.current);
      console.log('🚶 Event details:', {
        key: event.key,
        code: event.code,
        keyCode: event.keyCode,
        which: event.which
      });
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keysRef.current[key] = false;
      
      // Check if any movement keys are still pressed
      const movementKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
      const anyKeyPressed = movementKeys.some(k => keysRef.current[k]);
      setIsMoving(anyKeyPressed);
      console.log('🚶 Key released:', key, 'Keys state:', keysRef.current, 'Any movement key pressed:', anyKeyPressed);
    };

    // Test if the canvas is capturing focus
    const handleCanvasFocus = () => {
      console.log('🚶 Canvas focused - keys should work now');
    };

    const handleCanvasBlur = () => {
      console.log('🚶 Canvas lost focus - keys might not work');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Add a global test listener to see if ANY keys are being detected
    const globalKeyTest = (event: KeyboardEvent) => {
      console.log('🚶 GLOBAL KEY TEST - Key pressed:', event.key, 'Code:', event.code);
    };
    window.addEventListener('keydown', globalKeyTest);
    
    // Try to focus the canvas for key events
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('focus', handleCanvasFocus);
      canvas.addEventListener('blur', handleCanvasBlur);
      canvas.focus();
      console.log('🚶 Attempting to focus canvas for key events');
    }

    // Movement loop
    const movementLoop = () => {
      let moved = false;
      const newPosition = position.clone();

      // Debug: Log current key state
      const movementKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
      const pressedKeys = movementKeys.filter(k => keysRef.current[k]);
      if (pressedKeys.length > 0) {
        console.log('🚶 Movement loop - pressed keys:', pressedKeys);
      }

      // WASD movement
      if (keysRef.current['w'] || keysRef.current['arrowup']) {
        newPosition.z -= movementSpeed;
        moved = true;
        console.log('🚶 Moving forward (W/Up)');
      }
      if (keysRef.current['s'] || keysRef.current['arrowdown']) {
        newPosition.z += movementSpeed;
        moved = true;
        console.log('🚶 Moving backward (S/Down)');
      }
      if (keysRef.current['a'] || keysRef.current['arrowleft']) {
        newPosition.x -= movementSpeed;
        moved = true;
        console.log('🚶 Moving left (A/Left)');
      }
      if (keysRef.current['d'] || keysRef.current['arrowright']) {
        newPosition.x += movementSpeed;
        moved = true;
        console.log('🚶 Moving right (D/Right)');
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
      isInitializedRef.current = false;
    };
  }, []); // Empty dependency array - only run once

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