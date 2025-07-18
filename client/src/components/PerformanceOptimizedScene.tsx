import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { useMetaverseStore } from '../stores/useMetaverseStore';
import { LODSystem, LODConfigs } from './LODSystem';

interface PerformanceOptimizedSceneProps {
  onSceneReady: (scene: BABYLON.Scene) => void;
  onLoadingProgress: (progress: number, message: string) => void;
  onError: (error: string) => void;
}

const PerformanceOptimizedScene: React.FC<PerformanceOptimizedSceneProps> = ({
  onSceneReady,
  onLoadingProgress,
  onError
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const lodSystemRef = useRef<LODSystem | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { } = useMetaverseStore();

  useEffect(() => {
    if (!canvasRef.current || isInitialized) return;

    const canvas = canvasRef.current;
    let resizeHandler: (() => void) | null = null;
    
    try {
      // Create engine with performance optimizations
      const engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        antialias: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false, // Allow fallback for slower devices
        depth: true,
        alpha: false // Disable alpha for better performance
      });

      engineRef.current = engine;

      // Create scene with performance optimizations
      const scene = new BABYLON.Scene(engine);
      sceneRef.current = scene;

      // Performance optimizations
      scene.clearCachedVertexData();
      scene.autoClear = false; // Manual clearing for better control
      scene.autoClearDepthAndStencil = false;
      scene.useRightHandedSystem = false;
      
      // Optimize for performance
      scene.forceShowBoundingBoxes = false;
      scene.forceWireframe = false;

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
      
      // Performance camera settings
      camera.minZ = 0.1;
      camera.maxZ = 1000;
      camera.fov = 0.8; // Slightly reduced FOV for better performance

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

      // Initialize LOD system
      lodSystemRef.current = new LODSystem(scene, camera);

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

      // Create optimized world objects with LOD
      const createWorldObjects = () => {
        onLoadingProgress(60, "Adding world decorations with LOD...");

        const colors = [
          new BABYLON.Color3(1, 0.2, 0.2), // Red
          new BABYLON.Color3(0.2, 1, 0.2), // Green
          new BABYLON.Color3(0.2, 0.2, 1), // Blue
          new BABYLON.Color3(1, 1, 0.2),   // Yellow
          new BABYLON.Color3(1, 0.2, 1),   // Magenta
          new BABYLON.Color3(0.2, 1, 1),   // Cyan
        ];

        // Create objects with LOD for better performance
        for (let i = 0; i < 30; i++) {
          const x = (Math.random() - 0.5) * 80;
          const z = (Math.random() - 0.5) * 80;
          const color = colors[i % colors.length];
          const position = new BABYLON.Vector3(x, 0, z);

          if (i % 3 === 0) {
            // Spheres with LOD
            const diameter = 1 + Math.random() * 2;
            lodSystemRef.current!.createLODSphere(
              `sphere_${i}`,
              position,
              diameter,
              getCachedMaterial(`sphere_mat_${i % 6}`, color),
              LODConfigs.sphere
            );
          } else if (i % 3 === 1) {
            // Cylinders with LOD
            const height = 2 + Math.random() * 3;
            const diameter = 0.5 + Math.random() * 1;
            lodSystemRef.current!.createLODCylinder(
              `cylinder_${i}`,
              position,
              height,
              diameter,
              getCachedMaterial(`cylinder_mat_${i % 6}`, color),
              LODConfigs.cylinder
            );
          } else {
            // Boxes with LOD
            const size = 1 + Math.random() * 2;
            lodSystemRef.current!.createLODBox(
              `box_${i}`,
              position,
              size,
              getCachedMaterial(`box_mat_${i % 6}`, color),
              LODConfigs.box
            );
          }
        }
      };

      // Performance monitoring
      const performanceMonitor = new BABYLON.PerformanceMonitor();
      performanceMonitor.enable();

      // Render loop with performance optimizations and LOD updates
      const renderLoop = () => {
        if (scene.activeCamera) {
          // Update LOD levels
          if (lodSystemRef.current) {
            lodSystemRef.current.updateLODLevels();
          }

          // Manual clearing for better performance
          engine.clear(new BABYLON.Color4(0.1, 0.1, 0.2, 1), true, true, true);
          
          scene.render();
        }
      };

      // Initialize scene
      const initializeScene = async () => {
        try {
          onLoadingProgress(10, "Initializing 3D engine...");
          
          onLoadingProgress(40, "Creating materials...");
          
          createWorldObjects();
          onLoadingProgress(80, "Finalizing scene...");

          // Set up render loop
          engine.runRenderLoop(renderLoop);

          // Handle window resize
          resizeHandler = () => {
            engine.resize();
          };
          window.addEventListener('resize', resizeHandler);

          onLoadingProgress(100, "Scene ready!");
          onSceneReady(scene);
          setIsInitialized(true);

        } catch (error) {
          console.error('Error initializing scene:', error);
          onError(`Failed to initialize 3D scene: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      };

      initializeScene();

      // Cleanup
      return () => {
        if (lodSystemRef.current) {
          lodSystemRef.current.dispose();
        }
        if (engine) {
          engine.dispose();
        }
        if (scene) {
          scene.dispose();
        }
        materialCache.clear();
        if (resizeHandler) {
          window.removeEventListener('resize', resizeHandler);
        }
      };

    } catch (error) {
      console.error('Error creating engine:', error);
      onError(`Failed to create 3D engine: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isInitialized, onSceneReady, onLoadingProgress, onError]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full touch-none"
      style={{ outline: 'none' }}
    />
  );
};

export default PerformanceOptimizedScene; 