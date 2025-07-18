import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';

interface EnhancedWorldProps {
  scene: BABYLON.Scene;
  onZoneEnter?: (zoneName: string) => void;
}

interface WorldZone {
  name: string;
  position: BABYLON.Vector3;
  radius: number;
  type: 'shop' | 'entertainment' | 'game' | 'social' | 'nature';
  description: string;
  color: BABYLON.Color3;
}

const EnhancedWorld: React.FC<EnhancedWorldProps> = ({ 
  scene, 
  onZoneEnter 
}) => {
  const [currentTime, setCurrentTime] = useState(0); // 0-24 hour cycle
  const [weather, setWeather] = useState<'sunny' | 'rainy' | 'cloudy' | 'night'>('sunny');
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [isSafari] = useState(() => /^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  
  const zonesRef = useRef<WorldZone[]>([]);
  const weatherSystemRef = useRef<BABYLON.ParticleSystem | null>(null);
  const sunRef = useRef<BABYLON.DirectionalLight | null>(null);
  const moonRef = useRef<BABYLON.Mesh | null>(null);

  console.log('🌍 EnhancedWorld component initialized', { isSafari });

  // Define interactive zones
  const createZones = () => {
    const zones: WorldZone[] = [
      {
        name: 'Gaming Arcade',
        position: new BABYLON.Vector3(12, 0, 8),
        radius: 3,
        type: 'game',
        description: 'Play mini-games and compete with friends!',
        color: new BABYLON.Color3(1, 0.5, 0)
      },
      {
        name: 'Shopping District',
        position: new BABYLON.Vector3(-12, 0, 8),
        radius: 4,
        type: 'shop',
        description: 'Browse virtual shops and customize your avatar',
        color: new BABYLON.Color3(0.5, 0, 1)
      },
      {
        name: 'Social Plaza',
        position: new BABYLON.Vector3(0, 0, 0),
        radius: 5,
        type: 'social',
        description: 'Meet and chat with other players',
        color: new BABYLON.Color3(0, 1, 0.5)
      },
      {
        name: 'Nature Park',
        position: new BABYLON.Vector3(0, 0, -20),
        radius: 6,
        type: 'nature',
        description: 'Relax in the peaceful nature area',
        color: new BABYLON.Color3(0.2, 0.8, 0.2)
      },
      {
        name: 'Entertainment Center',
        position: new BABYLON.Vector3(15, 0, -10),
        radius: 4,
        type: 'entertainment',
        description: 'Watch shows and enjoy performances',
        color: new BABYLON.Color3(1, 0, 0.5)
      }
    ];

    zonesRef.current = zones;
    return zones;
  };

  // Create zone visual indicators
  const createZoneIndicators = (zones: WorldZone[]) => {
    zones.forEach(zone => {
      try {
        // Create zone boundary
        const zoneBoundary = BABYLON.MeshBuilder.CreateCylinder(
          `${zone.name}Boundary`,
          { height: 0.1, diameter: zone.radius * 2 },
          scene
        );
        zoneBoundary.position = zone.position;
        zoneBoundary.position.y = 0.05;
        
        // Safari-specific material optimizations
        const boundaryMaterial = new BABYLON.StandardMaterial(`${zone.name}BoundaryMat`, scene);
        boundaryMaterial.diffuseColor = zone.color;
        boundaryMaterial.alpha = isSafari ? 0.5 : 0.3; // Higher alpha for Safari visibility
        boundaryMaterial.emissiveColor = zone.color.scale(0.2);
        
        // Safari-specific rendering optimizations
        if (isSafari) {
          boundaryMaterial.backFaceCulling = false;
          boundaryMaterial.useParallax = false;
        }
        
                zoneBoundary.material = boundaryMaterial;

      // Create zone label
      const zoneLabel = BABYLON.MeshBuilder.CreatePlane(
        `${zone.name}Label`,
        { width: 4, height: 1 },
        scene
      );
      zoneLabel.position = zone.position.add(new BABYLON.Vector3(0, 3, 0));
      zoneLabel.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
      
      const labelMaterial = new BABYLON.StandardMaterial(`${zone.name}LabelMat`, scene);
      labelMaterial.diffuseColor = zone.color;
      labelMaterial.emissiveColor = zone.color.scale(0.5);
      zoneLabel.material = labelMaterial;

      // Add pulsing animation to zone
      const pulseAnimation = new BABYLON.Animation(
        `${zone.name}Pulse`,
        'scaling',
        30,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );

      const keyFrames = [];
      keyFrames.push({ frame: 0, value: new BABYLON.Vector3(1, 1, 1) });
      keyFrames.push({ frame: 15, value: new BABYLON.Vector3(1.1, 1.1, 1.1) });
      keyFrames.push({ frame: 30, value: new BABYLON.Vector3(1, 1, 1) });
      pulseAnimation.setKeys(keyFrames);

      zoneBoundary.animations = [pulseAnimation];
      scene.beginAnimation(zoneBoundary, 0, 30, true, 0.5);
      } catch (error) {
        console.error(`❌ Error creating zone indicator for ${zone.name}:`, error);
        if (isSafari) {
          console.log('🍎 Safari-specific error - trying fallback rendering');
        }
      }
    });
  };

  // Create enhanced buildings for zones
  const createZoneBuildings = (zones: WorldZone[]) => {
    zones.forEach(zone => {
      switch (zone.type) {
        case 'game':
          createGamingArcade(zone);
          break;
        case 'shop':
          createShoppingDistrict(zone);
          break;
        case 'entertainment':
          createEntertainmentCenter(zone);
          break;
        case 'nature':
          createNaturePark(zone);
          break;
        case 'social':
          // Social plaza already exists in main scene
          break;
      }
    });
  };

  const createGamingArcade = (zone: WorldZone) => {
    // Main arcade building
    const arcade = BABYLON.MeshBuilder.CreateBox('arcade', { width: 4, height: 3, depth: 4 }, scene);
    arcade.position = zone.position.add(new BABYLON.Vector3(0, 1.5, 0));
    
    const arcadeMaterial = new BABYLON.StandardMaterial('arcadeMat', scene);
    arcadeMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
    arcadeMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0.1);
    arcade.material = arcadeMaterial;

    // Neon sign
    const sign = BABYLON.MeshBuilder.CreatePlane('arcadeSign', { width: 3, height: 0.5 }, scene);
    sign.position = zone.position.add(new BABYLON.Vector3(0, 3.5, 2.1));
    
    const signMaterial = new BABYLON.StandardMaterial('arcadeSignMat', scene);
    signMaterial.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
    signMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.2, 0);
    sign.material = signMaterial;

    // Add blinking animation to sign
    const blinkAnimation = new BABYLON.Animation(
      'arcadeBlink',
      'material.emissiveColor',
      30,
      BABYLON.Animation.ANIMATIONTYPE_COLOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const blinkKeys = [];
    blinkKeys.push({ frame: 0, value: new BABYLON.Color3(0.5, 0.2, 0) });
    blinkKeys.push({ frame: 15, value: new BABYLON.Color3(1, 0.4, 0) });
    blinkKeys.push({ frame: 30, value: new BABYLON.Color3(0.5, 0.2, 0) });
    blinkAnimation.setKeys(blinkKeys);

    sign.animations = [blinkAnimation];
    scene.beginAnimation(sign, 0, 30, true, 1);
  };

  const createShoppingDistrict = (zone: WorldZone) => {
    // Create multiple shop buildings
    for (let i = 0; i < 3; i++) {
      const shop = BABYLON.MeshBuilder.CreateBox(
        `shop${i}`,
        { width: 2, height: 2.5, depth: 2 },
        scene
      );
      shop.position = zone.position.add(new BABYLON.Vector3((i - 1) * 2.5, 1.25, 0));
      
      const shopMaterial = new BABYLON.StandardMaterial(`shop${i}Mat`, scene);
      shopMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.8);
      shop.material = shopMaterial;

      // Shop windows
      const window = BABYLON.MeshBuilder.CreatePlane(
        `shop${i}Window`,
        { width: 1, height: 1 },
        scene
      );
      window.position = shop.position.add(new BABYLON.Vector3(0, 0.5, 1.01));
      
      const windowMaterial = new BABYLON.StandardMaterial(`shop${i}WindowMat`, scene);
      windowMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0.8);
      windowMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.1);
      window.material = windowMaterial;
    }
  };

  const createEntertainmentCenter = (zone: WorldZone) => {
    // Theater building
    const theater = BABYLON.MeshBuilder.CreateBox('theater', { width: 6, height: 4, depth: 5 }, scene);
    theater.position = zone.position.add(new BABYLON.Vector3(0, 2, 0));
    
    const theaterMaterial = new BABYLON.StandardMaterial('theaterMat', scene);
    theaterMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.2);
    theater.material = theaterMaterial;

    // Stage lights
    for (let i = 0; i < 3; i++) {
      const light = BABYLON.MeshBuilder.CreateSphere(
        `stageLight${i}`,
        { diameter: 0.3 },
        scene
      );
      light.position = zone.position.add(new BABYLON.Vector3((i - 1) * 2, 3.5, 2.5));
      
      const lightMaterial = new BABYLON.StandardMaterial(`stageLight${i}Mat`, scene);
      lightMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0);
      lightMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0);
      light.material = lightMaterial;
    }
  };

  const createNaturePark = (zone: WorldZone) => {
    // Create a pond
    const pond = BABYLON.MeshBuilder.CreateCylinder('pond', { height: 0.2, diameter: 8 }, scene);
    pond.position = zone.position.add(new BABYLON.Vector3(0, 0.1, 0));
    
    const pondMaterial = new BABYLON.StandardMaterial('pondMat', scene);
    pondMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.3, 0.6);
    pondMaterial.alpha = 0.8;
    pond.material = pondMaterial;

    // Add more trees around the pond
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const treePos = zone.position.add(new BABYLON.Vector3(
        Math.cos(angle) * 6,
        0,
        Math.sin(angle) * 6
      ));
      
      // Tree trunk
      const trunk = BABYLON.MeshBuilder.CreateCylinder(
        `natureTree${i}Trunk`,
        { height: 3, diameter: 0.4 },
        scene
      );
      trunk.position = treePos;
      
      const trunkMaterial = new BABYLON.StandardMaterial(`natureTree${i}TrunkMat`, scene);
      trunkMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0.1);
      trunk.material = trunkMaterial;

      // Tree leaves
      const leaves = BABYLON.MeshBuilder.CreateSphere(
        `natureTree${i}Leaves`,
        { diameter: 2.5 },
        scene
      );
      leaves.position = treePos.add(new BABYLON.Vector3(0, 2, 0));
      
      const leavesMaterial = new BABYLON.StandardMaterial(`natureTree${i}LeavesMat`, scene);
      leavesMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.7, 0.1);
      leaves.material = leavesMaterial;
    }
  };

  // Day/Night cycle system
  const createDayNightCycle = () => {
    // Create sun
    sunRef.current = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(0, -1, 0), scene);
    sunRef.current.intensity = 1;

    // Create moon
    moonRef.current = BABYLON.MeshBuilder.CreateSphere('moon', { diameter: 2 }, scene);
    const moonMaterial = new BABYLON.StandardMaterial('moonMat', scene);
    moonMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
    moonMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    moonRef.current.material = moonMaterial;

    // Update day/night cycle
    const updateDayNight = () => {
      const hour = currentTime;
      const isDay = hour >= 6 && hour <= 18;
      
      if (isDay) {
        // Day time
        const sunAngle = ((hour - 6) / 12) * Math.PI;
        sunRef.current!.direction = new BABYLON.Vector3(
          Math.sin(sunAngle),
          Math.cos(sunAngle),
          0
        );
        sunRef.current!.intensity = 1;
        
        // Hide moon
        moonRef.current!.position = new BABYLON.Vector3(0, -10, 0);
        
        // Update sky color
        const skyMaterial = scene.getMaterialByName('skyBox') as BABYLON.StandardMaterial;
        if (skyMaterial) {
          const skyIntensity = Math.max(0.3, Math.cos(sunAngle));
          skyMaterial.diffuseColor = new BABYLON.Color3(0.5 * skyIntensity, 0.7 * skyIntensity, 1.0);
        }
      } else {
        // Night time
        sunRef.current!.intensity = 0.1;
        
        // Show moon
        const moonAngle = ((hour - 18) / 12) * Math.PI;
        moonRef.current!.position = new BABYLON.Vector3(
          Math.sin(moonAngle) * 20,
          Math.cos(moonAngle) * 20 + 10,
          0
        );
        
        // Update sky color for night
        const skyMaterial = scene.getMaterialByName('skyBox') as BABYLON.StandardMaterial;
        if (skyMaterial) {
          skyMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.3);
        }
      }
    };

    updateDayNight();
  };

  // Weather system
  const createWeatherSystem = () => {
    const updateWeather = () => {
      // Remove existing weather
      if (weatherSystemRef.current) {
        weatherSystemRef.current.stop();
        weatherSystemRef.current.dispose();
      }

      if (weather === 'rainy') {
        // Create rain particles
        const rain = new BABYLON.ParticleSystem('rain', 1000, scene);
        rain.particleTexture = new BABYLON.Texture('https://playground.babylonjs.com/textures/flare.png', scene);
        
        rain.minEmitBox = new BABYLON.Vector3(-20, 10, -20);
        rain.maxEmitBox = new BABYLON.Vector3(20, 10, 20);
        rain.color1 = new BABYLON.Color4(0.5, 0.5, 1, 1);
        rain.color2 = new BABYLON.Color4(0.5, 0.5, 1, 1);
        rain.colorDead = new BABYLON.Color4(0, 0, 0, 0);
        rain.minSize = 0.1;
        rain.maxSize = 0.3;
        rain.minLifeTime = 1;
        rain.maxLifeTime = 2;
        rain.emitRate = 500;
        rain.gravity = new BABYLON.Vector3(0, -9.81, 0);
        rain.direction1 = new BABYLON.Vector3(-0.1, -1, -0.1);
        rain.direction2 = new BABYLON.Vector3(0.1, -1, 0.1);
        rain.minEmitPower = 1;
        rain.maxEmitPower = 3;
        rain.updateSpeed = 0.01;
        
        rain.start();
        weatherSystemRef.current = rain;
      }
    };

    updateWeather();
  };

  // Initialize enhanced world
  useEffect(() => {
    if (!scene) return;

    console.log('🌍 Initializing Enhanced World...');

    // Create zones
    const zones = createZones();
    createZoneIndicators(zones);
    createZoneBuildings(zones);

    // Create day/night cycle
    createDayNightCycle();

    // Create weather system
    createWeatherSystem();

    console.log('🌍 Enhanced World initialized with zones:', zones.map(z => z.name));
  }, [scene]);

  // Update day/night cycle
  useEffect(() => {
    if (!scene) return;
    createDayNightCycle();
  }, [currentTime, scene]);

  // Update weather
  useEffect(() => {
    if (!scene) return;
    createWeatherSystem();
  }, [weather, scene]);

  // Zone detection system
  useEffect(() => {
    if (!scene) return;

    const checkZoneProximity = () => {
      // This would check player position against zones
      // For now, we'll simulate zone detection
      const playerPosition = new BABYLON.Vector3(0, 0, 0); // Get from player
      
      zonesRef.current.forEach(zone => {
        const distance = BABYLON.Vector3.Distance(playerPosition, zone.position);
        if (distance <= zone.radius && activeZone !== zone.name) {
          setActiveZone(zone.name);
          onZoneEnter?.(zone.name);
          console.log(`🎯 Entered zone: ${zone.name}`);
        } else if (distance > zone.radius && activeZone === zone.name) {
          setActiveZone(null);
          console.log(`🚪 Left zone: ${zone.name}`);
        }
      });
    };

    const interval = setInterval(checkZoneProximity, 1000);
    return () => clearInterval(interval);
  }, [scene, activeZone, onZoneEnter]);

  // Auto-advance time
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(prev => (prev + 0.1) % 24);
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Auto-change weather
  useEffect(() => {
    const weatherInterval = setInterval(() => {
      const weatherTypes: Array<'sunny' | 'rainy' | 'cloudy' | 'night'> = ['sunny', 'rainy', 'cloudy', 'night'];
      const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
      setWeather(randomWeather);
    }, 30000); // Change weather every 30 seconds

    return () => clearInterval(weatherInterval);
  }, []);

  return null; // This component doesn't render UI, it manages the 3D world
};

export default EnhancedWorld; 