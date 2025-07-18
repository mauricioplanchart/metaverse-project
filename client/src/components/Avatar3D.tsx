import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { useMetaverseStore } from '../stores/useMetaverseStore';

interface Avatar3DProps {
  scene: BABYLON.Scene;
  position: BABYLON.Vector3;
  username: string;
  avatarData: any;
  isCurrentUser?: boolean;
}

const Avatar3D: React.FC<Avatar3DProps> = ({ scene, position, username, avatarData, isCurrentUser = false }) => {
  const avatarRef = useRef<BABYLON.TransformNode | null>(null);
  const usernameRef = useRef<BABYLON.Mesh | null>(null);
  const { avatarCustomization } = useMetaverseStore();
  const currentEmote = avatarCustomization.currentEmote;

  console.log('🎭 Avatar3D component rendering:', { username, isCurrentUser, position: position.toString() });

  useEffect(() => {
    if (!scene || !avatarData) {
      console.log('🎭 Avatar3D: Missing scene or avatarData', { scene: !!scene, avatarData: !!avatarData });
      return;
    }

    console.log('🎭 Creating 3D avatar for:', username, avatarData);

    // Create avatar group
    const avatarGroup = new BABYLON.TransformNode(`avatar_${username}`, scene);
    avatarGroup.position = position;

    // Create body (torso)
    const body = BABYLON.MeshBuilder.CreateCylinder(`body_${username}`, {
      height: avatarData.height || 1.0,
      diameter: 0.4
    }, scene);
    body.parent = avatarGroup;

    // Create head
    const head = BABYLON.MeshBuilder.CreateSphere(`head_${username}`, {
      diameter: 0.3
    }, scene);
    head.position.y = (avatarData.height || 1.0) / 2 + 0.2;
    head.parent = avatarGroup;

    // Create arms
    const leftArm = BABYLON.MeshBuilder.CreateCylinder(`leftArm_${username}`, {
      height: 0.8,
      diameter: 0.1
    }, scene);
    leftArm.position.set(-0.25, 0.2, 0);
    leftArm.rotation.z = Math.PI / 4;
    leftArm.parent = avatarGroup;

    const rightArm = BABYLON.MeshBuilder.CreateCylinder(`rightArm_${username}`, {
      height: 0.8,
      diameter: 0.1
    }, scene);
    rightArm.position.set(0.25, 0.2, 0);
    rightArm.rotation.z = -Math.PI / 4;
    rightArm.parent = avatarGroup;

    // Create legs
    const leftLeg = BABYLON.MeshBuilder.CreateCylinder(`leftLeg_${username}`, {
      height: 0.8,
      diameter: 0.12
    }, scene);
    leftLeg.position.set(-0.1, -(avatarData.height || 1.0) / 2 - 0.4, 0);
    leftLeg.parent = avatarGroup;

    const rightLeg = BABYLON.MeshBuilder.CreateCylinder(`rightLeg_${username}`, {
      height: 0.8,
      diameter: 0.12
    }, scene);
    rightLeg.position.set(0.1, -(avatarData.height || 1.0) / 2 - 0.4, 0);
    rightLeg.parent = avatarGroup;

    // Create materials with avatar colors
    const bodyMaterial = new BABYLON.StandardMaterial(`bodyMat_${username}`, scene);
    bodyMaterial.diffuseColor = BABYLON.Color3.FromHexString(avatarData.bodyColor || '#ffcc99');
    body.material = bodyMaterial;

    const headMaterial = new BABYLON.StandardMaterial(`headMat_${username}`, scene);
    headMaterial.diffuseColor = BABYLON.Color3.FromHexString(avatarData.headColor || '#ffe0bd');
    head.material = headMaterial;

    const limbMaterial = new BABYLON.StandardMaterial(`limbMat_${username}`, scene);
    limbMaterial.diffuseColor = BABYLON.Color3.FromHexString(avatarData.bodyColor || '#ffcc99');
    leftArm.material = limbMaterial;
    rightArm.material = limbMaterial;
    leftLeg.material = limbMaterial;
    rightLeg.material = limbMaterial;

    // Add clothing
    if (avatarData.clothingType && avatarData.clothingType !== 'none') {
      const clothing = BABYLON.MeshBuilder.CreateCylinder(`clothing_${username}`, {
        height: avatarData.height || 1.0,
        diameter: 0.45
      }, scene);
      clothing.position.y = 0;
      clothing.parent = avatarGroup;

      const clothingMaterial = new BABYLON.StandardMaterial(`clothingMat_${username}`, scene);
      clothingMaterial.diffuseColor = BABYLON.Color3.FromHexString(avatarData.clothingColor || '#3366ff');
      clothing.material = clothingMaterial;
    }

    // Add hair
    if (avatarData.hairStyle && avatarData.hairStyle !== 'bald') {
      const hair = BABYLON.MeshBuilder.CreateSphere(`hair_${username}`, {
        diameter: 0.32
      }, scene);
      hair.position.y = (avatarData.height || 1.0) / 2 + 0.25;
      hair.parent = avatarGroup;

      const hairMaterial = new BABYLON.StandardMaterial(`hairMat_${username}`, scene);
      hairMaterial.diffuseColor = BABYLON.Color3.FromHexString(avatarData.hairColor || '#000000');
      hair.material = hairMaterial;
    }

    // Add accessories
    if (avatarData.accessories && avatarData.accessories.length > 0) {
      avatarData.accessories.forEach((accessory: string) => {
        if (accessory === 'glasses') {
          const glasses = BABYLON.MeshBuilder.CreateTorus(`glasses_${username}`, {
            diameter: 0.15,
            thickness: 0.02
          }, scene);
          glasses.position.y = (avatarData.height || 1.0) / 2 + 0.2;
          glasses.rotation.x = Math.PI / 2;
          glasses.parent = avatarGroup;

          const glassesMaterial = new BABYLON.StandardMaterial(`glassesMat_${username}`, scene);
          glassesMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
          glasses.material = glassesMaterial;
        }
        // Add more accessories as needed
      });
    }

    // Create username label
    const usernameTexture = new BABYLON.DynamicTexture(`usernameTexture_${username}`, {
      width: 512,
      height: 256
    }, scene);
    usernameTexture.drawText(username, null, null, 'bold 24px Arial', 'white', 'transparent', true);

    const usernameMaterial = new BABYLON.StandardMaterial(`usernameMat_${username}`, scene);
    usernameMaterial.diffuseTexture = usernameTexture;
    usernameMaterial.useAlphaFromDiffuseTexture = true;

    const usernamePlane = BABYLON.MeshBuilder.CreatePlane(`usernamePlane_${username}`, {
      width: 2,
      height: 0.5
    }, scene);
    usernamePlane.position.y = (avatarData.height || 1.0) / 2 + 0.6;
    usernamePlane.material = usernameMaterial;
    usernamePlane.parent = avatarGroup;

    // Add emote indicator with animations
    if (currentEmote && isCurrentUser) {
      const emoteTexture = new BABYLON.DynamicTexture(`emoteTexture_${username}`, {
        width: 256,
        height: 256
      }, scene);
      
      // Enhanced emote display with different colors and effects
      let emoteColor = 'yellow';
      let emoteSize = 1;
      
      switch (currentEmote) {
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
      
      emoteTexture.drawText(currentEmote, null, null, 'bold 32px Arial', emoteColor, 'transparent', true);

      const emoteMaterial = new BABYLON.StandardMaterial(`emoteMat_${username}`, scene);
      emoteMaterial.diffuseTexture = emoteTexture;
      emoteMaterial.useAlphaFromDiffuseTexture = true;

      const emotePlane = BABYLON.MeshBuilder.CreatePlane(`emotePlane_${username}`, {
        width: emoteSize,
        height: emoteSize
      }, scene);
      emotePlane.position.y = (avatarData.height || 1.0) / 2 + 1.0;
      emotePlane.material = emoteMaterial;
      emotePlane.parent = avatarGroup;
      
      // Add emote animation
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
    }

    // Create advanced avatar animations
    const createWalkingAnimation = () => {
      const walkAnimation = new BABYLON.Animation(
        'walking',
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
      return walkAnimation;
    };

    const createIdleAnimation = () => {
      const idleAnimation = new BABYLON.Animation(
        'idle',
        'position.y',
        60,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );

      const idleKeyFrames = [];
      idleKeyFrames.push({ frame: 0, value: avatarGroup.position.y });
      idleKeyFrames.push({ frame: 30, value: avatarGroup.position.y + 0.02 });
      idleKeyFrames.push({ frame: 60, value: avatarGroup.position.y });

      idleAnimation.setKeys(idleKeyFrames);
      return idleAnimation;
    };

    const createJumpAnimation = () => {
      const jumpAnimation = new BABYLON.Animation(
        'jump',
        'position.y',
        30,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );

      const jumpKeyFrames = [];
      jumpKeyFrames.push({ frame: 0, value: avatarGroup.position.y });
      jumpKeyFrames.push({ frame: 15, value: avatarGroup.position.y + 0.5 });
      jumpKeyFrames.push({ frame: 30, value: avatarGroup.position.y });

      jumpAnimation.setKeys(jumpKeyFrames);
      return jumpAnimation;
    };

    // Start with idle animation
    const idleAnim = createIdleAnimation();
    scene.beginDirectAnimation(avatarGroup, [idleAnim], 0, 60, true);

    // Store animations for later use
    (avatarGroup as any).avatarAnimations = {
      idle: idleAnim,
      walk: createWalkingAnimation(),
      jump: createJumpAnimation()
    };

    // Add particle effects for current user
    if (isCurrentUser) {
      const avatarParticles = new BABYLON.ParticleSystem(`avatarParticles_${username}`, 50, scene);
      avatarParticles.particleTexture = new BABYLON.Texture('https://playground.babylonjs.com/textures/flare.png', scene);
      avatarParticles.emitter = avatarGroup as any;
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
    }

    avatarRef.current = avatarGroup;
    usernameRef.current = usernamePlane;

    console.log('🎭 3D avatar created successfully for:', username);

    return () => {
      // Cleanup
      if (avatarRef.current) {
        avatarRef.current.dispose();
        avatarRef.current = null;
      }
      if (usernameRef.current) {
        usernameRef.current.dispose();
        usernameRef.current = null;
      }
    };
  }, [scene, position, username, avatarData, currentEmote, isCurrentUser]);

  return null; // This component doesn't render anything visible, it just manages 3D objects
};

export default Avatar3D; 