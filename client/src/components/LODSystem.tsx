import * as BABYLON from '@babylonjs/core';

export interface LODLevel {
  distance: number;
  segments?: number;
  tessellation?: number;
  enabled: boolean;
}

export interface LODObject {
  mesh: BABYLON.Mesh;
  levels: LODLevel[];
  currentLevel: number;
  position: BABYLON.Vector3;
  originalType: 'sphere' | 'cylinder' | 'box';
  originalSize: { diameter?: number; height?: number; size?: number };
}

export class LODSystem {
  private scene: BABYLON.Scene;
  private camera: BABYLON.Camera;
  private lodObjects: Map<string, LODObject> = new Map();
  private updateInterval: number = 100; // Update LOD every 100ms
  private lastUpdate: number = 0;

  constructor(scene: BABYLON.Scene, camera: BABYLON.Camera) {
    this.scene = scene;
    this.camera = camera;
  }

  // Create a sphere with LOD levels
  createLODSphere(
    name: string,
    position: BABYLON.Vector3,
    diameter: number,
    material: BABYLON.Material,
    levels: LODLevel[]
  ): LODObject {
    // Create the highest detail mesh first
    const mesh = BABYLON.MeshBuilder.CreateSphere(name, {
      diameter,
      segments: levels[0].segments || 16
    }, this.scene);
    
    mesh.position = position;
    mesh.material = material;

    const lodObject: LODObject = {
      mesh,
      levels,
      currentLevel: 0,
      position,
      originalType: 'sphere',
      originalSize: { diameter }
    };

    this.lodObjects.set(name, lodObject);
    return lodObject;
  }

  // Create a cylinder with LOD levels
  createLODCylinder(
    name: string,
    position: BABYLON.Vector3,
    height: number,
    diameter: number,
    material: BABYLON.Material,
    levels: LODLevel[]
  ): LODObject {
    const mesh = BABYLON.MeshBuilder.CreateCylinder(name, {
      height,
      diameter,
      tessellation: levels[0].tessellation || 16
    }, this.scene);
    
    mesh.position = position;
    mesh.material = material;

    const lodObject: LODObject = {
      mesh,
      levels,
      currentLevel: 0,
      position,
      originalType: 'cylinder',
      originalSize: { height, diameter }
    };

    this.lodObjects.set(name, lodObject);
    return lodObject;
  }

  // Create a box with LOD levels
  createLODBox(
    name: string,
    position: BABYLON.Vector3,
    size: number,
    material: BABYLON.Material,
    levels: LODLevel[]
  ): LODObject {
    const mesh = BABYLON.MeshBuilder.CreateBox(name, {
      size
    }, this.scene);
    
    mesh.position = position;
    mesh.material = material;

    const lodObject: LODObject = {
      mesh,
      levels,
      currentLevel: 0,
      position,
      originalType: 'box',
      originalSize: { size }
    };

    this.lodObjects.set(name, lodObject);
    return lodObject;
  }

  // Update LOD levels based on camera distance
  updateLODLevels(): void {
    const now = performance.now();
    if (now - this.lastUpdate < this.updateInterval) {
      return;
    }
    this.lastUpdate = now;

    const cameraPosition = this.camera.position;

    this.lodObjects.forEach((lodObject, name) => {
      const distance = BABYLON.Vector3.Distance(cameraPosition, lodObject.position);
      
      // Find appropriate LOD level
      let newLevel = 0;
      for (let i = 0; i < lodObject.levels.length; i++) {
        if (distance <= lodObject.levels[i].distance) {
          newLevel = i;
          break;
        }
      }

      // Only update if level changed
      if (newLevel !== lodObject.currentLevel) {
        this.updateMeshDetail(lodObject, newLevel);
        lodObject.currentLevel = newLevel;
      }
    });
  }

  // Update mesh detail level by recreating the mesh
  private updateMeshDetail(lodObject: LODObject, newLevel: number): void {
    const level = lodObject.levels[newLevel];
    const oldMesh = lodObject.mesh;
    const position = oldMesh.position.clone();
    const material = oldMesh.material;
    const name = oldMesh.name;

    // Dispose old mesh
    oldMesh.dispose();

    // Create new mesh with appropriate detail level
    let newMesh: BABYLON.Mesh;

    switch (lodObject.originalType) {
      case 'sphere':
        newMesh = BABYLON.MeshBuilder.CreateSphere(name, {
          diameter: lodObject.originalSize.diameter!,
          segments: level.segments || 8
        }, this.scene);
        break;

      case 'cylinder':
        newMesh = BABYLON.MeshBuilder.CreateCylinder(name, {
          height: lodObject.originalSize.height!,
          diameter: lodObject.originalSize.diameter!,
          tessellation: level.tessellation || 8
        }, this.scene);
        break;

      case 'box':
        newMesh = BABYLON.MeshBuilder.CreateBox(name, {
          size: lodObject.originalSize.size!
        }, this.scene);
        break;

      default:
        return;
    }

    // Apply position and material
    newMesh.position = position;
    newMesh.material = material;

    // Update the LOD object
    lodObject.mesh = newMesh;
    lodObject.mesh.setEnabled(level.enabled);
  }

  // Get performance statistics
  getStats() {
    let totalObjects = 0;
    let visibleObjects = 0;
    let averageDetailLevel = 0;

    this.lodObjects.forEach((lodObject) => {
      totalObjects++;
      if (lodObject.mesh.isEnabled()) {
        visibleObjects++;
        averageDetailLevel += lodObject.currentLevel;
      }
    });

    return {
      totalObjects,
      visibleObjects,
      averageDetailLevel: totalObjects > 0 ? averageDetailLevel / totalObjects : 0
    };
  }

  // Clean up
  dispose(): void {
    this.lodObjects.forEach((lodObject) => {
      lodObject.mesh.dispose();
    });
    this.lodObjects.clear();
  }
}

// Predefined LOD configurations
export const LODConfigs = {
  sphere: [
    { distance: 10, segments: 32, enabled: true },
    { distance: 30, segments: 16, enabled: true },
    { distance: 60, segments: 8, enabled: true },
    { distance: Infinity, segments: 4, enabled: false }
  ],
  cylinder: [
    { distance: 10, tessellation: 16, enabled: true },
    { distance: 30, tessellation: 8, enabled: true },
    { distance: 60, tessellation: 4, enabled: true },
    { distance: Infinity, tessellation: 2, enabled: false }
  ],
  box: [
    { distance: 10, segments: 1, enabled: true },
    { distance: 30, segments: 1, enabled: true },
    { distance: 60, segments: 1, enabled: true },
    { distance: Infinity, segments: 1, enabled: false }
  ]
}; 