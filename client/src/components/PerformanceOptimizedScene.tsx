import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { useMetaverseStore } from '../stores/useMetaverseStore';

interface PerformanceOptimizedSceneProps {
  onSceneReady: (scene: BABYLON.Scene) => void;
  onLoadingProgress: (progress: number, message: string) => void;
}

const PerformanceOptimizedScene: React.FC<PerformanceOptimizedSceneProps> = ({
  onSceneReady,
  onLoadingProgress
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { } = useMetaverseStore();

  useEffect(() => {
    if (!canvasRef.current || isInitialized) return;

    const canvas = canvasRef.current;
    const engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
      powerPreference: "high-performance"
    });

    engineRef.current = engine;

    // Create scene with performance optimizations
    const scene = new BABYLON.Scene(engine);
    sceneRef.current = scene;

    // Performance optimizations
    scene.clearCachedVertexData();
    scene.autoClear = false; // Manual clearing for better control
    scene.autoClearDepthAndStencil = false;

    // Optimize rendering
    scene.useRightHandedSystem = false;

    // Set up camera with performance settings
    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      0,
      Math.PI / 3,
      20,
      BABYLON.Vector3.Zero(),
      scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 50;
    camera.wheelDeltaPercentage = 0.01;
    camera.panningSensibility = 1000;
    camera.angularSensibilityX = 1000;
    camera.angularSensibilityY = 1000;

    // Performance-optimized lighting
    const light = new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    light.intensity = 0.7;
    light.groundColor = new BABYLON.Color3(0.2, 0.2, 0.3);

    // Add directional light for better shadows
    const dirLight = new BABYLON.DirectionalLight(
      "dirLight",
      new BABYLON.Vector3(-1, -2, -1),
      scene
    );
    dirLight.intensity = 0.5;

    // Create ground with optimized material
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {
      width: 100,
      height: 100,
      subdivisions: 20 // Reduced for performance
    }, scene);

    const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.5, 0.3);
    groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    ground.material = groundMaterial;

    // Create sample objects
    const createSampleObjects = () => {
      onLoadingProgress(30, "Creating world objects...");

      // Sample objects with different detail levels
      const sphere1 = BABYLON.MeshBuilder.CreateSphere("sphere1", {
        diameter: 2,
        segments: 16
      }, scene);
      sphere1.position = new BABYLON.Vector3(5, 1, 0);

      const sphere2 = BABYLON.MeshBuilder.CreateSphere("sphere2", {
        diameter: 2,
        segments: 12
      }, scene);
      sphere2.position = new BABYLON.Vector3(-5, 1, 0);

      const sphere3 = BABYLON.MeshBuilder.CreateSphere("sphere3", {
        diameter: 2,
        segments: 8
      }, scene);
      sphere3.position = new BABYLON.Vector3(0, 1, 10);
    };

    // Optimized material creation with caching
    const materialCache = new Map<string, BABYLON.Material>();
    
    const getCachedMaterial = (name: string, color: BABYLON.Color3): BABYLON.StandardMaterial => {
      if (materialCache.has(name)) {
        return materialCache.get(name) as BABYLON.StandardMaterial;
      }

      const material = new BABYLON.StandardMaterial(name, scene);
      material.diffuseColor = color;
      material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
      materialCache.set(name, material);
      return material;
    };

    // Create optimized world objects
    const createWorldObjects = () => {
      onLoadingProgress(60, "Adding world decorations...");

      const colors = [
        new BABYLON.Color3(1, 0.2, 0.2), // Red
        new BABYLON.Color3(0.2, 1, 0.2), // Green
        new BABYLON.Color3(0.2, 0.2, 1), // Blue
        new BABYLON.Color3(1, 1, 0.2),   // Yellow
        new BABYLON.Color3(1, 0.2, 1),   // Magenta
        new BABYLON.Color3(0.2, 1, 1),   // Cyan
      ];

      // Create objects with instancing for better performance
      for (let i = 0; i < 20; i++) {
        const x = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 80;
        const color = colors[i % colors.length];

        if (i % 3 === 0) {
          // Spheres
          const sphere = BABYLON.MeshBuilder.CreateSphere(`sphere_${i}`, {
            diameter: 1 + Math.random() * 2,
            segments: 8 // Reduced segments for performance
          }, scene);
          sphere.position = new BABYLON.Vector3(x, 0.5, z);
          sphere.material = getCachedMaterial(`sphere_mat_${i % 6}`, color);
        } else if (i % 3 === 1) {
          // Cylinders
          const cylinder = BABYLON.MeshBuilder.CreateCylinder(`cylinder_${i}`, {
            height: 2 + Math.random() * 3,
            diameter: 0.5 + Math.random() * 1,
            tessellation: 8 // Reduced tessellation for performance
          }, scene);
          cylinder.position = new BABYLON.Vector3(x, 1, z);
          cylinder.material = getCachedMaterial(`cylinder_mat_${i % 6}`, color);
        } else {
          // Boxes
          const box = BABYLON.MeshBuilder.CreateBox(`box_${i}`, {
            size: 1 + Math.random() * 2
          }, scene);
          box.position = new BABYLON.Vector3(x, 0.5, z);
          box.material = getCachedMaterial(`box_mat_${i % 6}`, color);
        }
      }
    };

    // Performance monitoring
    const performanceMonitor = new BABYLON.PerformanceMonitor();
    performanceMonitor.enable();

    // Render loop with performance optimizations
    const renderLoop = () => {
      if (scene.activeCamera) {
        // Manual clearing for better performance
        engine.clear(new BABYLON.Color4(0.1, 0.1, 0.2, 1), true, true, true);
        
        scene.render();
      }
    };

    // Initialize scene
    const initializeScene = async () => {
      try {
        onLoadingProgress(10, "Initializing 3D engine...");
        
        createSampleObjects();
        onLoadingProgress(40, "Creating materials...");
        
        createWorldObjects();
        onLoadingProgress(80, "Finalizing scene...");

        // Set up render loop
        engine.runRenderLoop(renderLoop);

        // Handle window resize
        window.addEventListener('resize', () => {
          engine.resize();
        });

        onLoadingProgress(100, "Scene ready!");
        onSceneReady(scene);
        setIsInitialized(true);

      } catch (error) {
        console.error('Error initializing scene:', error);
        onLoadingProgress(0, "Error loading scene");
      }
    };

    initializeScene();

    // Cleanup
    return () => {
      if (engine) {
        engine.dispose();
      }
      if (scene) {
        scene.dispose();
      }
      materialCache.clear();
    };
  }, [isInitialized, onSceneReady, onLoadingProgress]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full touch-none"
      style={{ outline: 'none' }}
    />
  );
};

export default PerformanceOptimizedScene; 