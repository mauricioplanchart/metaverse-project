import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';

interface MiniGamesProps {
  scene: BABYLON.Scene;
  gameType: 'target' | 'obstacle' | 'collection' | null;
  onGameComplete?: (score: number, gameType: string) => void;
  onGameExit?: () => void;
}

interface GameTarget {
  mesh: BABYLON.Mesh;
  points: number;
  isHit: boolean;
}

const MiniGames: React.FC<MiniGamesProps> = ({ 
  scene, 
  gameType, 
  onGameComplete, 
  onGameExit 
}) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameActive, setGameActive] = useState(false);
  const [targets, setTargets] = useState<GameTarget[]>([]);
  const [obstacles, setObstacles] = useState<BABYLON.Mesh[]>([]);
  const [collectibles, setCollectibles] = useState<BABYLON.Mesh[]>([]);
  
  const gameAreaRef = useRef<BABYLON.Mesh | null>(null);
  const playerRef = useRef<BABYLON.Mesh | null>(null);

  // Target Shooting Game
  const createTargetGame = () => {
    console.log('🎯 Creating Target Shooting Game...');
    
    // Create game area
    const gameArea = BABYLON.MeshBuilder.CreateGround('targetGameArea', { width: 20, height: 20 }, scene);
    gameArea.position = new BABYLON.Vector3(0, 0, 0);
    const areaMaterial = new BABYLON.StandardMaterial('targetAreaMat', scene);
    areaMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    gameArea.material = areaMaterial;
    gameAreaRef.current = gameArea;

    // Create targets
    const newTargets: GameTarget[] = [];
    for (let i = 0; i < 10; i++) {
      const target = BABYLON.MeshBuilder.CreateSphere(`target${i}`, { diameter: 0.5 }, scene);
      target.position = new BABYLON.Vector3(
        (Math.random() - 0.5) * 15,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 15
      );
      
      const targetMaterial = new BABYLON.StandardMaterial(`target${i}Mat`, scene);
      targetMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
      target.material = targetMaterial;

      // Add floating animation
      const floatAnimation = new BABYLON.Animation(
        `target${i}Float`,
        'position.y',
        30,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );

      const keyFrames = [];
      keyFrames.push({ frame: 0, value: target.position.y });
      keyFrames.push({ frame: 15, value: target.position.y + 0.5 });
      keyFrames.push({ frame: 30, value: target.position.y });
      floatAnimation.setKeys(keyFrames);

      target.animations = [floatAnimation];
      scene.beginAnimation(target, 0, 30, true, 0.5);

      newTargets.push({
        mesh: target,
        points: Math.floor(Math.random() * 3) + 1,
        isHit: false
      });
    }
    setTargets(newTargets);

    // Create player position
    const player = BABYLON.MeshBuilder.CreateSphere('targetPlayer', { diameter: 0.3 }, scene);
    player.position = new BABYLON.Vector3(0, 1, 10);
    const playerMaterial = new BABYLON.StandardMaterial('targetPlayerMat', scene);
    playerMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
    player.material = playerMaterial;
    playerRef.current = player;

    // Set up click detection
    scene.onPointerDown = () => {
      if (!gameActive) return;
      
      const pickResult = scene.pick(scene.pointerX, scene.pointerY);
      if (pickResult?.hit) {
        const hitMesh = pickResult.pickedMesh;
        const targetIndex = newTargets.findIndex(t => t.mesh === hitMesh);
        
        if (targetIndex !== -1 && !newTargets[targetIndex].isHit) {
          // Hit target
          const target = newTargets[targetIndex];
          target.isHit = true;
          (target.mesh.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(0, 1, 0);
          setScore(prev => prev + target.points);
          
          // Create hit effect
          createHitEffect(target.mesh.position);
        }
      }
    };

    setGameActive(true);
  };

  // Obstacle Course Game
  const createObstacleGame = () => {
    console.log('🏃 Creating Obstacle Course Game...');
    
    // Create game area
    const gameArea = BABYLON.MeshBuilder.CreateGround('obstacleGameArea', { width: 30, height: 10 }, scene);
    gameArea.position = new BABYLON.Vector3(0, 0, 0);
    const areaMaterial = new BABYLON.StandardMaterial('obstacleAreaMat', scene);
    areaMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    gameArea.material = areaMaterial;
    gameAreaRef.current = gameArea;

    // Create obstacles
    const newObstacles: BABYLON.Mesh[] = [];
    for (let i = 0; i < 8; i++) {
      const obstacle = BABYLON.MeshBuilder.CreateBox(`obstacle${i}`, { width: 1, height: 2, depth: 1 }, scene);
      obstacle.position = new BABYLON.Vector3(
        (Math.random() - 0.5) * 20,
        1,
        -i * 3 - 5
      );
      
      const obstacleMaterial = new BABYLON.StandardMaterial(`obstacle${i}Mat`, scene);
      obstacleMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
      obstacle.material = obstacleMaterial;
      newObstacles.push(obstacle);
    }
    setObstacles(newObstacles);

    // Create player
    const player = BABYLON.MeshBuilder.CreateSphere('obstaclePlayer', { diameter: 0.5 }, scene);
    player.position = new BABYLON.Vector3(0, 0.5, 10);
    const playerMaterial = new BABYLON.StandardMaterial('obstaclePlayerMat', scene);
    playerMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
    player.material = playerMaterial;
    playerRef.current = player;

    // Create finish line
    const finishLine = BABYLON.MeshBuilder.CreateBox('finishLine', { width: 5, height: 0.1, depth: 1 }, scene);
    finishLine.position = new BABYLON.Vector3(0, 0.05, -30);
    const finishMaterial = new BABYLON.StandardMaterial('finishMat', scene);
    finishMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
    finishMaterial.emissiveColor = new BABYLON.Color3(0, 0.5, 0);
    finishLine.material = finishMaterial;

    setGameActive(true);
  };

  // Collection Game
  const createCollectionGame = () => {
    console.log('💎 Creating Collection Game...');
    
    // Create game area
    const gameArea = BABYLON.MeshBuilder.CreateGround('collectionGameArea', { width: 20, height: 20 }, scene);
    gameArea.position = new BABYLON.Vector3(0, 0, 0);
    const areaMaterial = new BABYLON.StandardMaterial('collectionAreaMat', scene);
    areaMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    gameArea.material = areaMaterial;
    gameAreaRef.current = gameArea;

    // Create collectibles
    const newCollectibles: BABYLON.Mesh[] = [];
    for (let i = 0; i < 15; i++) {
      const collectible = BABYLON.MeshBuilder.CreateSphere(`collectible${i}`, { diameter: 0.3 }, scene);
      collectible.position = new BABYLON.Vector3(
        (Math.random() - 0.5) * 15,
        0.5,
        (Math.random() - 0.5) * 15
      );
      
      const collectibleMaterial = new BABYLON.StandardMaterial(`collectible${i}Mat`, scene);
      collectibleMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0);
      collectibleMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0);
      collectible.material = collectibleMaterial;

      // Add rotation animation
      const rotationAnimation = new BABYLON.Animation(
        `collectible${i}Rotate`,
        'rotation.y',
        30,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );

      const keyFrames = [];
      keyFrames.push({ frame: 0, value: 0 });
      keyFrames.push({ frame: 30, value: Math.PI * 2 });
      rotationAnimation.setKeys(keyFrames);

      collectible.animations = [rotationAnimation];
      scene.beginAnimation(collectible, 0, 30, true, 1);

      newCollectibles.push(collectible);
    }
    setCollectibles(newCollectibles);

    // Create player
    const player = BABYLON.MeshBuilder.CreateSphere('collectionPlayer', { diameter: 0.5 }, scene);
    player.position = new BABYLON.Vector3(0, 0.5, 0);
    const playerMaterial = new BABYLON.StandardMaterial('collectionPlayerMat', scene);
    playerMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
    player.material = playerMaterial;
    playerRef.current = player;

    setGameActive(true);
  };

  // Create hit effect
  const createHitEffect = (position: BABYLON.Vector3) => {
    const hitEffect = new BABYLON.ParticleSystem('hitEffect', 50, scene);
    hitEffect.particleTexture = new BABYLON.Texture('https://playground.babylonjs.com/textures/flare.png', scene);
    
    hitEffect.emitter = position;
    hitEffect.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
    hitEffect.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);
    hitEffect.color1 = new BABYLON.Color4(1, 1, 0, 1);
    hitEffect.color2 = new BABYLON.Color4(1, 0.5, 0, 1);
    hitEffect.colorDead = new BABYLON.Color4(0, 0, 0, 0);
    hitEffect.minSize = 0.1;
    hitEffect.maxSize = 0.3;
    hitEffect.minLifeTime = 0.5;
    hitEffect.maxLifeTime = 1;
    hitEffect.emitRate = 100;
    hitEffect.gravity = new BABYLON.Vector3(0, 0.5, 0);
    hitEffect.direction1 = new BABYLON.Vector3(-1, -1, -1);
    hitEffect.direction2 = new BABYLON.Vector3(1, 1, 1);
    hitEffect.minEmitPower = 1;
    hitEffect.maxEmitPower = 3;
    hitEffect.updateSpeed = 0.01;
    
    hitEffect.start();
    
    // Stop after 1 second
    setTimeout(() => {
      hitEffect.stop();
      hitEffect.dispose();
    }, 1000);
  };

  // Initialize game based on type
  useEffect(() => {
    if (!scene || !gameType) return;

    console.log(`🎮 Starting ${gameType} game...`);

    switch (gameType) {
      case 'target':
        createTargetGame();
        break;
      case 'obstacle':
        createObstacleGame();
        break;
      case 'collection':
        createCollectionGame();
        break;
    }

    // Start timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [scene, gameType]);

  // End game
  const endGame = () => {
    setGameActive(false);
    onGameComplete?.(score, gameType || 'unknown');
    console.log(`🎮 Game ended with score: ${score}`);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up game objects
      if (gameAreaRef.current) {
        gameAreaRef.current.dispose();
      }
      if (playerRef.current) {
        playerRef.current.dispose();
      }
      targets.forEach(target => target.mesh.dispose());
      obstacles.forEach(obstacle => obstacle.dispose());
      collectibles.forEach(collectible => collectible.dispose());
    };
  }, []);

  if (!gameType) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold mb-2">
            {gameType === 'target' && '🎯 Target Shooting'}
            {gameType === 'obstacle' && '🏃 Obstacle Course'}
            {gameType === 'collection' && '💎 Collection Game'}
          </h2>
          <div className="flex justify-between text-lg">
            <span>Score: {score}</span>
            <span>Time: {timeLeft}s</span>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 mb-4">
          {gameType === 'target' && 'Click on the red targets to score points!'}
          {gameType === 'obstacle' && 'Navigate through the obstacles to reach the finish line!'}
          {gameType === 'collection' && 'Collect all the golden spheres!'}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={endGame}
            className="flex-1 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
          >
            End Game
          </button>
          <button
            onClick={onGameExit}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniGames; 