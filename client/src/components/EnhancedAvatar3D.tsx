import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { useMetaverseStore } from '../stores/useMetaverseStore';

interface EnhancedAvatar3DProps {
  scene: BABYLON.Scene;
  position: BABYLON.Vector3;
  username: string;
  avatarData: any;
  isCurrentUser?: boolean;
  onAvatarClick?: (username: string) => void;
}

interface AvatarMesh {
  group: BABYLON.TransformNode;
  body: BABYLON.Mesh;
  head: BABYLON.Mesh;
  leftArm: BABYLON.Mesh;
  rightArm: BABYLON.Mesh;
  leftLeg: BABYLON.Mesh;
  rightLeg: BABYLON.Mesh;
  hair?: BABYLON.Mesh | null;
  clothing?: BABYLON.Mesh | null;
  accessories: BABYLON.Mesh[];
  usernameLabel: BABYLON.Mesh;
  emoteIndicator?: BABYLON.Mesh | null;
  particles?: BABYLON.ParticleSystem | null;
}

const EnhancedAvatar3D: React.FC<EnhancedAvatar3DProps> = ({ 
  scene, 
  position, 
  username, 
  avatarData, 
  isCurrentUser = false,
  onAvatarClick 
}) => {
  const avatarRef = useRef<AvatarMesh | null>(null);
  const { avatarCustomization } = useMetaverseStore();
  // const [isHovered, setIsHovered] = useState(false); // Unused for now
  // const [currentAnimation, setCurrentAnimation] = useState('idle'); // Unused for now
  // const animationRef = useRef<BABYLON.Animation | null>(null); // Unused for now

  console.log('🎭 EnhancedAvatar3D rendering:', { username, isCurrentUser, position: position.toString() });

  // Create enhanced materials with PBR
  const createPBRMaterial = (name: string, color: string, metallic: number = 0, roughness: number = 0.8) => {
    const material = new BABYLON.PBRMaterial(name, scene);
    material.albedoColor = BABYLON.Color3.FromHexString(color);
    material.metallic = metallic;
    material.roughness = roughness;
    material.environmentIntensity = 0.3;
    return material;
  };

  // Create advanced body proportions
  const createProportionalBody = (group: BABYLON.TransformNode, proportions: any) => {
    const bodyParts: any = {};
    
    // Enhanced body with better proportions
    const body = BABYLON.MeshBuilder.CreateCylinder(`body_${username}`, {
      height: avatarData.height || 1.0,
      diameter: 0.4 * (proportions?.waist || 1.0)
    }, scene);
    body.parent = group;
    bodyParts.body = body;

    // Enhanced head with facial features
    const head = BABYLON.MeshBuilder.CreateSphere(`head_${username}`, {
      diameter: 0.3
    }, scene);
    head.position.y = (avatarData.height || 1.0) / 2 + 0.2;
    head.parent = group;
    bodyParts.head = head;

    // Add facial features
    if (avatarData.facialFeatures) {
      // Eyes
      const leftEye = BABYLON.MeshBuilder.CreateSphere(`leftEye_${username}`, { diameter: 0.05 }, scene);
      leftEye.position.set(-0.08, (avatarData.height || 1.0) / 2 + 0.25, 0.12);
      leftEye.parent = group;
      leftEye.material = createPBRMaterial(`eyeMat_${username}`, avatarData.eyeColor || '#333333', 0.1, 0.2);

      const rightEye = BABYLON.MeshBuilder.CreateSphere(`rightEye_${username}`, { diameter: 0.05 }, scene);
      rightEye.position.set(0.08, (avatarData.height || 1.0) / 2 + 0.25, 0.12);
      rightEye.parent = group;
      rightEye.material = createPBRMaterial(`eyeMat_${username}`, avatarData.eyeColor || '#333333', 0.1, 0.2);

      // Nose
      const nose = BABYLON.MeshBuilder.CreateCylinder(`nose_${username}`, { height: 0.08, diameter: 0.03 }, scene);
      nose.position.set(0, (avatarData.height || 1.0) / 2 + 0.2, 0.15);
      nose.rotation.x = Math.PI / 2;
      nose.parent = group;
      nose.material = createPBRMaterial(`noseMat_${username}`, avatarData.headColor || '#ffe0bd', 0, 0.9);
    }

    // Enhanced arms with joints
    const leftArm = BABYLON.MeshBuilder.CreateCylinder(`leftArm_${username}`, {
      height: 0.8 * (proportions?.arms || 1.0),
      diameter: 0.1
    }, scene);
    leftArm.position.set(-0.25 * (proportions?.shoulders || 1.0), 0.2, 0);
    leftArm.rotation.z = Math.PI / 4;
    leftArm.parent = group;
    bodyParts.leftArm = leftArm;

    const rightArm = BABYLON.MeshBuilder.CreateCylinder(`rightArm_${username}`, {
      height: 0.8 * (proportions?.arms || 1.0),
      diameter: 0.1
    }, scene);
    rightArm.position.set(0.25 * (proportions?.shoulders || 1.0), 0.2, 0);
    rightArm.rotation.z = -Math.PI / 4;
    rightArm.parent = group;
    bodyParts.rightArm = rightArm;

    // Enhanced legs with joints
    const leftLeg = BABYLON.MeshBuilder.CreateCylinder(`leftLeg_${username}`, {
      height: 0.8 * (proportions?.legs || 1.0),
      diameter: 0.12
    }, scene);
    leftLeg.position.set(-0.1, -(avatarData.height || 1.0) / 2 - 0.4, 0);
    leftLeg.parent = group;
    bodyParts.leftLeg = leftLeg;

    const rightLeg = BABYLON.MeshBuilder.CreateCylinder(`rightLeg_${username}`, {
      height: 0.8 * (proportions?.legs || 1.0),
      diameter: 0.12
    }, scene);
    rightLeg.position.set(0.1, -(avatarData.height || 1.0) / 2 - 0.4, 0);
    rightLeg.parent = group;
    bodyParts.rightLeg = rightLeg;

    return bodyParts;
  };

  // Create advanced animations
  const createAdvancedAnimations = (group: BABYLON.TransformNode, _bodyParts: any) => {
    const animations: { [key: string]: BABYLON.Animation } = {};

    // Enhanced idle animation with breathing
    const idleAnimation = new BABYLON.Animation(
      'idle',
      'position.y',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    const idleKeyFrames = [];
    idleKeyFrames.push({ frame: 0, value: group.position.y });
    idleKeyFrames.push({ frame: 30, value: group.position.y + 0.02 });
    idleKeyFrames.push({ frame: 60, value: group.position.y });
    idleAnimation.setKeys(idleKeyFrames);
    animations.idle = idleAnimation;

    // Walking animation with arm swing
    const walkAnimation = new BABYLON.Animation(
      'walk',
      'rotation.y',
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    const walkKeyFrames = [];
    walkKeyFrames.push({ frame: 0, value: 0 });
    walkKeyFrames.push({ frame: 15, value: 0.1 });
    walkKeyFrames.push({ frame: 30, value: 0 });
    walkKeyFrames.push({ frame: 45, value: -0.1 });
    walkKeyFrames.push({ frame: 60, value: 0 });
    walkAnimation.setKeys(walkKeyFrames);
    animations.walk = walkAnimation;

    // Arm swing animation
    const armSwingAnimation = new BABYLON.Animation(
      'armSwing',
      'rotation.z',
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    const armKeyFrames = [];
    armKeyFrames.push({ frame: 0, value: Math.PI / 4 });
    armKeyFrames.push({ frame: 15, value: -Math.PI / 4 });
    armKeyFrames.push({ frame: 30, value: Math.PI / 4 });
    armSwingAnimation.setKeys(armKeyFrames);
    animations.armSwing = armSwingAnimation;

    // Jump animation
    const jumpAnimation = new BABYLON.Animation(
      'jump',
      'position.y',
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    const jumpKeyFrames = [];
    jumpKeyFrames.push({ frame: 0, value: group.position.y });
    jumpKeyFrames.push({ frame: 15, value: group.position.y + 0.5 });
    jumpKeyFrames.push({ frame: 30, value: group.position.y });
    jumpAnimation.setKeys(jumpKeyFrames);
    animations.jump = jumpAnimation;

    // Dance animation
    const danceAnimation = new BABYLON.Animation(
      'dance',
      'rotation.y',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    const danceKeyFrames = [];
    danceKeyFrames.push({ frame: 0, value: 0 });
    danceKeyFrames.push({ frame: 15, value: Math.PI / 4 });
    danceKeyFrames.push({ frame: 30, value: Math.PI / 2 });
    danceKeyFrames.push({ frame: 45, value: Math.PI * 3 / 4 });
    danceKeyFrames.push({ frame: 60, value: Math.PI * 2 });
    danceAnimation.setKeys(danceKeyFrames);
    animations.dance = danceAnimation;

    return animations;
  };

  // Create enhanced clothing
  const createEnhancedClothing = (group: BABYLON.TransformNode, clothingType: string, clothingColor: string) => {
    if (!clothingType || clothingType === 'none') return null;

    let clothing: BABYLON.Mesh;

    switch (clothingType) {
      case 'shirt':
        clothing = BABYLON.MeshBuilder.CreateCylinder(`clothing_${username}`, {
          height: avatarData.height || 1.0,
          diameter: 0.45
        }, scene);
        break;
      case 'dress':
        clothing = BABYLON.MeshBuilder.CreateCylinder(`clothing_${username}`, {
          height: (avatarData.height || 1.0) * 1.2,
          diameter: 0.5
        }, scene);
        break;
      case 'suit':
        clothing = BABYLON.MeshBuilder.CreateCylinder(`clothing_${username}`, {
          height: avatarData.height || 1.0,
          diameter: 0.42
        }, scene);
        break;
      case 'armor':
        clothing = BABYLON.MeshBuilder.CreateCylinder(`clothing_${username}`, {
          height: avatarData.height || 1.0,
          diameter: 0.48
        }, scene);
        break;
      default:
        clothing = BABYLON.MeshBuilder.CreateCylinder(`clothing_${username}`, {
          height: avatarData.height || 1.0,
          diameter: 0.45
        }, scene);
    }

    clothing.position.y = 0;
    clothing.parent = group;
    clothing.material = createPBRMaterial(`clothingMat_${username}`, clothingColor, 0.1, 0.7);

    return clothing;
  };

  // Create enhanced hair
  const createEnhancedHair = (group: BABYLON.TransformNode, hairStyle: string, hairColor: string) => {
    if (!hairStyle || hairStyle === 'bald') return null;

    let hair: BABYLON.Mesh;

    switch (hairStyle) {
      case 'short':
        hair = BABYLON.MeshBuilder.CreateSphere(`hair_${username}`, { diameter: 0.32 }, scene);
        break;
      case 'long':
        hair = BABYLON.MeshBuilder.CreateCylinder(`hair_${username}`, { height: 0.4, diameter: 0.3 }, scene);
        break;
      case 'curly':
        hair = BABYLON.MeshBuilder.CreateSphere(`hair_${username}`, { diameter: 0.35 }, scene);
        break;
      case 'spiky':
        hair = BABYLON.MeshBuilder.CreateCylinder(`hair_${username}`, { height: 0.3, diameter: 0.28 }, scene);
        break;
      default:
        hair = BABYLON.MeshBuilder.CreateSphere(`hair_${username}`, { diameter: 0.32 }, scene);
    }

    hair.position.y = (avatarData.height || 1.0) / 2 + 0.25;
    hair.parent = group;
    hair.material = createPBRMaterial(`hairMat_${username}`, hairColor, 0, 0.9);

    return hair;
  };

  // Create enhanced accessories
  const createEnhancedAccessories = (group: BABYLON.TransformNode, accessories: string[]) => {
    const accessoryMeshes: BABYLON.Mesh[] = [];

    accessories.forEach((accessory, _index) => {
      let mesh: BABYLON.Mesh;

      switch (accessory) {
        case 'glasses':
          mesh = BABYLON.MeshBuilder.CreateTorus(`glasses_${username}`, {
            diameter: 0.15,
            thickness: 0.02
          }, scene);
          mesh.position.y = (avatarData.height || 1.0) / 2 + 0.2;
          mesh.rotation.x = Math.PI / 2;
          mesh.material = createPBRMaterial(`glassesMat_${username}`, '#333333', 0.8, 0.2);
          break;
        case 'hat':
          mesh = BABYLON.MeshBuilder.CreateCylinder(`hat_${username}`, {
            height: 0.15,
            diameter: 0.35
          }, scene);
          mesh.position.y = (avatarData.height || 1.0) / 2 + 0.4;
          mesh.material = createPBRMaterial(`hatMat_${username}`, '#8B4513', 0, 0.8);
          break;
        case 'crown':
          mesh = BABYLON.MeshBuilder.CreateCylinder(`crown_${username}`, {
            height: 0.2,
            diameter: 0.3
          }, scene);
          mesh.position.y = (avatarData.height || 1.0) / 2 + 0.45;
          mesh.material = createPBRMaterial(`crownMat_${username}`, '#FFD700', 0.9, 0.1);
          break;
        case 'wings':
          mesh = BABYLON.MeshBuilder.CreateBox(`wings_${username}`, {
            width: 0.8,
            height: 0.4,
            depth: 0.05
          }, scene);
          mesh.position.set(0, 0.2, -0.3);
          mesh.material = createPBRMaterial(`wingsMat_${username}`, '#FFFFFF', 0, 0.6);
          break;
        default:
          return;
      }

      mesh.parent = group;
      accessoryMeshes.push(mesh);
    });

    return accessoryMeshes;
  };

  // Create enhanced username label
  const createEnhancedUsernameLabel = (group: BABYLON.TransformNode) => {
    const usernameTexture = new BABYLON.DynamicTexture(`usernameTexture_${username}`, {
      width: 512,
      height: 256
    }, scene);
    usernameTexture.drawText(username, null, null, 'bold 24px Arial', 'white', 'transparent', true);

    const usernameMaterial = new BABYLON.StandardMaterial(`usernameMat_${username}`, scene);
    usernameMaterial.diffuseTexture = usernameTexture;
    usernameMaterial.useAlphaFromDiffuseTexture = true;
    usernameMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    const usernamePlane = BABYLON.MeshBuilder.CreatePlane(`usernamePlane_${username}`, {
      width: 2,
      height: 0.5
    }, scene);
    usernamePlane.position.y = (avatarData.height || 1.0) / 2 + 0.6;
    usernamePlane.material = usernameMaterial;
    usernamePlane.parent = group;

    // Add hover effect
    usernamePlane.actionManager = new BABYLON.ActionManager(scene);
          usernamePlane.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
          usernamePlane.scaling = new BABYLON.Vector3(1.1, 1.1, 1.1);
        })
      );
      usernamePlane.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
          usernamePlane.scaling = new BABYLON.Vector3(1, 1, 1);
        })
      );
    usernamePlane.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
        onAvatarClick?.(username);
      })
    );

    return usernamePlane;
  };

  // Create enhanced emote indicator
  const createEnhancedEmoteIndicator = (group: BABYLON.TransformNode, emote: string) => {
    if (!emote) return null;

    const emoteTexture = new BABYLON.DynamicTexture(`emoteTexture_${username}`, {
      width: 256,
      height: 256
    }, scene);
    
    let emoteColor = 'yellow';
    let emoteSize = 1;
    
    switch (emote) {
      case 'dance':
        emoteColor = '#ff69b4';
        emoteSize = 1.2;
        break;
      case 'wave':
        emoteColor = '#00bfff';
        emoteSize = 0.8;
        break;
      case 'jump':
        emoteColor = '#00ff00';
        emoteSize = 1.1;
        break;
      case 'laugh':
        emoteColor = '#ffd700';
        emoteSize = 1.3;
        break;
      default:
        emoteColor = 'yellow';
        emoteSize = 1;
    }
    
    emoteTexture.drawText(emote, null, null, 'bold 32px Arial', emoteColor, 'transparent', true);

    const emoteMaterial = new BABYLON.StandardMaterial(`emoteMat_${username}`, scene);
    emoteMaterial.diffuseTexture = emoteTexture;
    emoteMaterial.useAlphaFromDiffuseTexture = true;
    emoteMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);

    const emotePlane = BABYLON.MeshBuilder.CreatePlane(`emotePlane_${username}`, {
      width: emoteSize,
      height: emoteSize
    }, scene);
    emotePlane.position.y = (avatarData.height || 1.0) / 2 + 1.0;
    emotePlane.material = emoteMaterial;
    emotePlane.parent = group;
    
    // Add floating animation
    const emoteAnimation = new BABYLON.Animation(
      'emoteFloat',
      'position.y',
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    
    const emoteKeyFrames = [];
    emoteKeyFrames.push({ frame: 0, value: emotePlane.position.y });
    emoteKeyFrames.push({ frame: 15, value: emotePlane.position.y + 0.2 });
    emoteKeyFrames.push({ frame: 30, value: emotePlane.position.y });
    
    emoteAnimation.setKeys(emoteKeyFrames);
    scene.beginDirectAnimation(emotePlane, [emoteAnimation], 0, 30, true);

    return emotePlane;
  };

  // Create enhanced particle effects
  const createEnhancedParticleEffects = (group: BABYLON.TransformNode) => {
    if (!isCurrentUser) return null;

    const avatarParticles = new BABYLON.ParticleSystem(`avatarParticles_${username}`, 50, scene);
    avatarParticles.particleTexture = new BABYLON.Texture('https://playground.babylonjs.com/textures/flare.png', scene);
    avatarParticles.emitter = group as any;
    avatarParticles.minEmitBox = new BABYLON.Vector3(-0.3, -0.3, -0.3);
    avatarParticles.maxEmitBox = new BABYLON.Vector3(0.3, 0.3, 0.3);
    avatarParticles.color1 = new BABYLON.Color4(1, 1, 0, 1);
    avatarParticles.color2 = new BABYLON.Color4(0, 1, 1, 1);
    avatarParticles.colorDead = new BABYLON.Color4(0, 0, 0, 0);
    avatarParticles.minSize = 0.05;
    avatarParticles.maxSize = 0.1;
    avatarParticles.minLifeTime = 1;
    avatarParticles.maxLifeTime = 2;
    avatarParticles.emitRate = 10;
    avatarParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    avatarParticles.gravity = new BABYLON.Vector3(0, 0.1, 0);
    avatarParticles.direction1 = new BABYLON.Vector3(-0.1, -0.1, -0.1);
    avatarParticles.direction2 = new BABYLON.Vector3(0.1, 0.1, 0.1);
    avatarParticles.minAngularSpeed = 0;
    avatarParticles.maxAngularSpeed = Math.PI;
    avatarParticles.minEmitPower = 0.1;
    avatarParticles.maxEmitPower = 0.2;
    avatarParticles.updateSpeed = 0.01;
    avatarParticles.start();

    return avatarParticles;
  };

  useEffect(() => {
    if (!scene || !avatarData) {
      console.log('🎭 EnhancedAvatar3D: Missing scene or avatarData', { scene: !!scene, avatarData: !!avatarData });
      return;
    }

    console.log('🎭 Creating enhanced 3D avatar for:', username, avatarData);

    // Create avatar group
    const avatarGroup = new BABYLON.TransformNode(`enhanced_avatar_${username}`, scene);
    avatarGroup.position = position;

    // Create body parts with proportions
    const bodyParts = createProportionalBody(avatarGroup, avatarData.bodyProportions);

    // Apply materials
    bodyParts.body.material = createPBRMaterial(`bodyMat_${username}`, avatarData.bodyColor || '#ffcc99', 0, 0.8);
    bodyParts.head.material = createPBRMaterial(`headMat_${username}`, avatarData.headColor || '#ffe0bd', 0, 0.7);
    bodyParts.leftArm.material = createPBRMaterial(`limbMat_${username}`, avatarData.bodyColor || '#ffcc99', 0, 0.8);
    bodyParts.rightArm.material = createPBRMaterial(`limbMat_${username}`, avatarData.bodyColor || '#ffcc99', 0, 0.8);
    bodyParts.leftLeg.material = createPBRMaterial(`limbMat_${username}`, avatarData.bodyColor || '#ffcc99', 0, 0.8);
    bodyParts.rightLeg.material = createPBRMaterial(`limbMat_${username}`, avatarData.bodyColor || '#ffcc99', 0, 0.8);

    // Create enhanced clothing
    const clothing = createEnhancedClothing(avatarGroup, avatarData.clothingType, avatarData.clothingColor);

    // Create enhanced hair
    const hair = createEnhancedHair(avatarGroup, avatarData.hairStyle, avatarData.hairColor);

    // Create enhanced accessories
    const accessories = createEnhancedAccessories(avatarGroup, avatarData.accessories || []);

    // Create enhanced username label
    const usernameLabel = createEnhancedUsernameLabel(avatarGroup);

    // Create enhanced emote indicator
    const emoteIndicator = createEnhancedEmoteIndicator(avatarGroup, avatarCustomization.currentEmote);

    // Create enhanced particle effects
    const particles = createEnhancedParticleEffects(avatarGroup);

    // Create animations
    const animations = createAdvancedAnimations(avatarGroup, bodyParts);

    // Start with idle animation
    const idleAnim = animations.idle;
    scene.beginDirectAnimation(avatarGroup, [idleAnim], 0, 60, true);
    // setCurrentAnimation('idle'); // Unused for now

    // Store avatar reference
    avatarRef.current = {
      group: avatarGroup,
      body: bodyParts.body,
      head: bodyParts.head,
      leftArm: bodyParts.leftArm,
      rightArm: bodyParts.rightArm,
      leftLeg: bodyParts.leftLeg,
      rightLeg: bodyParts.rightLeg,
      hair,
      clothing,
      accessories,
      usernameLabel,
      emoteIndicator,
      particles
    };

    // Store animations for later use
    (avatarGroup as any).avatarAnimations = animations;

    console.log('🎭 Enhanced 3D avatar created successfully for:', username);

    return () => {
      // Cleanup
      if (avatarRef.current) {
        avatarRef.current.group.dispose();
        avatarRef.current = null;
      }
    };
  }, [scene, position, username, avatarData, avatarCustomization.currentEmote, isCurrentUser]);

  // Animation control functions (unused for now)
  /*
  const playAnimation = (animationName: string) => {
    if (!avatarRef.current || !avatarRef.current.group) return;

    const animations = (avatarRef.current.group as any).avatarAnimations;
    if (!animations || !animations[animationName]) return;

    // Stop current animation
    if (animationRef.current) {
      scene.stopAnimation(avatarRef.current.group, animationRef.current.name);
    }

    // Play new animation
    const animation = animations[animationName];
    scene.beginDirectAnimation(avatarRef.current.group, [animation], 0, animation.getHighestFrame(), true);
    setCurrentAnimation(animationName);
    animationRef.current = animation;
  };
  */

  // Expose animation control for external use (unused for now)
  // const avatarControls = {
  //   playAnimation,
  //   getCurrentAnimation: () => currentAnimation,
  //   getAvatarMesh: () => avatarRef.current
  // };

  return null; // This component doesn't render anything visible, it just manages 3D objects
};

export default EnhancedAvatar3D; 