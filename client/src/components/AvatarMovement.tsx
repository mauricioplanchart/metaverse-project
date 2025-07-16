import React, { useEffect, useState, useRef } from 'react';
import { useMetaverseStore } from '../stores/useMetaverseStore';
import { socketService } from '../lib/socketService';
import * as BABYLON from '@babylonjs/core';

interface AvatarMovementProps {
  scene?: BABYLON.Scene;
  camera?: BABYLON.Camera;
  currentUserAvatar?: any;
}

const AvatarMovement: React.FC<AvatarMovementProps> = ({ 
  scene, 
  camera, 
  currentUserAvatar 
}) => {
  const { currentUserId, isConnected } = useMetaverseStore();
  const [position, setPosition] = useState<BABYLON.Vector3>(new BABYLON.Vector3(0, 0, 0));
  const [isMoving, setIsMoving] = useState(false);
  const [movementSpeed] = useState(0.1);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const positionRef = useRef<BABYLON.Vector3>(new BABYLON.Vector3(0, 0, 0));
  const isInitializedRef = useRef(false);
  const animationFrameRef = useRef<number>();
  const [debugInfo, setDebugInfo] = useState({
    keysPressed: '',
    lastKey: '',
    focusStatus: 'unknown'
  });

  // Debug render
  console.log('🚶 AvatarMovement render:', { 
    hasScene: !!scene, 
    hasCamera: !!camera, 
    hasAvatar: !!currentUserAvatar,
    position: position.toString(),
    isMoving,
    isInitialized: isInitializedRef.current,
    isConnected,
    debugInfo
  });

  // Initialize movement system
  useEffect(() => {
    console.log('🚶 AvatarMovement: useEffect triggered');
    
    // Prevent multiple initializations
    if (isInitializedRef.current) {
      console.log('🚶 AvatarMovement: Already initialized, skipping...');
      return;
    }

    console.log('🚶 AvatarMovement: Initializing movement system');
    isInitializedRef.current = true;

    // Global key listener for debugging
    const globalKeyListener = (event: KeyboardEvent) => {
      console.log('🌍 GLOBAL KEY EVENT:', {
        key: event.key,
        code: event.code,
        type: event.type,
        target: event.target,
        currentTarget: event.currentTarget
      });
      
      setDebugInfo(prev => ({
        ...prev,
        lastKey: `${event.key} (${event.code})`,
        keysPressed: Object.keys(keysRef.current).filter(k => keysRef.current[k]).join(', ')
      }));
    };

    // Handle keyboard input
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keysRef.current[key] = true;
      setIsMoving(true);
      
      console.log('🚶 Key pressed:', key, 'Keys state:', keysRef.current);
      setDebugInfo(prev => ({
        ...prev,
        lastKey: `DOWN: ${key}`,
        keysPressed: Object.keys(keysRef.current).filter(k => keysRef.current[k]).join(', ')
      }));
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keysRef.current[key] = false;
      
      // Check if any movement keys are still pressed
      const movementKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
      const anyKeyPressed = movementKeys.some(k => keysRef.current[k]);
      setIsMoving(anyKeyPressed);
      
      console.log('🚶 Key released:', key, 'Keys state:', keysRef.current, 'Any movement key pressed:', anyKeyPressed);
      setDebugInfo(prev => ({
        ...prev,
        lastKey: `UP: ${key}`,
        keysPressed: Object.keys(keysRef.current).filter(k => keysRef.current[k]).join(', ')
      }));
    };

    // Add event listeners
    window.addEventListener('keydown', globalKeyListener);
    window.addEventListener('keyup', globalKeyListener);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Try to focus the canvas for key events
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.focus();
      console.log('🚶 Attempting to focus canvas for key events');
      setDebugInfo(prev => ({ ...prev, focusStatus: 'canvas focused' }));
      
      // Add focus/blur listeners to canvas
      canvas.addEventListener('focus', () => {
        console.log('🚶 Canvas focused');
        setDebugInfo(prev => ({ ...prev, focusStatus: 'canvas focused' }));
      });
      
      canvas.addEventListener('blur', () => {
        console.log('🚶 Canvas lost focus');
        setDebugInfo(prev => ({ ...prev, focusStatus: 'canvas blurred' }));
      });

      // Add click listener to focus canvas when clicked
      canvas.addEventListener('click', () => {
        canvas.focus();
        console.log('🚶 Canvas clicked and focused');
        setDebugInfo(prev => ({ ...prev, focusStatus: 'canvas clicked and focused' }));
      });
    } else {
      console.log('🚶 No canvas found');
      setDebugInfo(prev => ({ ...prev, focusStatus: 'no canvas found' }));
    }

    // Movement loop
    const movementLoop = () => {
      let moved = false;
      const newPosition = positionRef.current.clone();

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
        positionRef.current = newPosition;
        setPosition(newPosition);
        console.log('🚶 Moving to position:', newPosition);
        
        // Update avatar position in 3D scene (if mesh exists)
        if (currentUserAvatar && currentUserAvatar.mesh) {
          currentUserAvatar.mesh.position = newPosition;
        }

        // Send position update to server
        if (isConnected) {
          socketService.emit('avatar-move', {
            userId: currentUserId,
            position: {
              x: newPosition.x,
              y: newPosition.y,
              z: newPosition.z
            }
          });
        }
      }

      // Continue the loop
      animationFrameRef.current = requestAnimationFrame(movementLoop);
    };

    // Start the movement loop
    animationFrameRef.current = requestAnimationFrame(movementLoop);

    // Cleanup function
    return () => {
      window.removeEventListener('keydown', globalKeyListener);
      window.removeEventListener('keyup', globalKeyListener);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentUserId, isConnected, currentUserAvatar, movementSpeed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Test movement function
  const testMovement = () => {
    console.log('🧪 Testing movement...');
    const testPosition = new BABYLON.Vector3(5, 0, 5);
    setPosition(testPosition);
    
    if (isConnected) {
      socketService.emit('avatar-move', {
        userId: currentUserId,
        position: {
          x: testPosition.x,
          y: testPosition.y,
          z: testPosition.z
        }
      });
    }
  };

  // Test key detection
  const testKeyDetection = () => {
    console.log('🧪 Testing key detection...');
    console.log('Current keys state:', keysRef.current);
    console.log('Debug info:', debugInfo);
    
    // Simulate a key press
    const testEvent = new KeyboardEvent('keydown', { key: 'w', code: 'KeyW' });
    window.dispatchEvent(testEvent);
  };

  // Focus canvas manually
  const focusCanvas = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.focus();
      console.log('🚶 Manually focused canvas');
      setDebugInfo(prev => ({ ...prev, focusStatus: 'manually focused' }));
    }
  };

  // Always render the movement UI
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
      border: '2px solid #00ff00',
      minWidth: '300px'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        🚶 Avatar Movement Controls
      </div>
      <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '8px' }}>
        Use WASD or Arrow Keys to move
      </div>
      <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '8px' }}>
        Position: {position.x.toFixed(2)}, {position.y.toFixed(2)}, {position.z.toFixed(2)}
      </div>
      <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '8px' }}>
        Moving: {isMoving ? '✅' : '❌'}
      </div>
      <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '8px' }}>
        Connected: {isConnected ? '✅' : '❌'}
      </div>
      <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '8px' }}>
        Focus: {debugInfo.focusStatus}
      </div>
      <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '8px' }}>
        Last Key: {debugInfo.lastKey}
      </div>
      <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '8px' }}>
        Keys Pressed: {debugInfo.keysPressed || 'none'}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button
          onClick={testMovement}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Test Movement
        </button>
        <button
          onClick={testKeyDetection}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Test Keys
        </button>
        <button
          onClick={focusCanvas}
          style={{
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Focus Canvas
        </button>
      </div>
    </div>
  );
};

export default AvatarMovement; 