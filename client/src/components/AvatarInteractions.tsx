import React, { useState } from 'react';
import { useMetaverseStore } from '../stores/useMetaverseStore';
import { metaverseService } from '../lib/metaverseService';
import * as BABYLON from '@babylonjs/core';

interface AvatarInteractionsProps {
  scene: BABYLON.Scene;
  currentUserAvatar: any;
  nearbyAvatars: any[];
}

const AvatarInteractions: React.FC<AvatarInteractionsProps> = ({ 
  scene, 
  currentUserAvatar, 
  nearbyAvatars 
}) => {
  const { currentUserId } = useMetaverseStore();
  const [interactionCooldown, setInteractionCooldown] = useState<{ [key: string]: number }>({});
  const [activeInteractions, setActiveInteractions] = useState<string[]>([]);

  const interactions = [
    { id: 'hug', name: '🤗 Hug', cooldown: 5000, range: 2.0 },
    { id: 'highfive', name: '✋ High Five', cooldown: 3000, range: 1.5 },
    { id: 'dance', name: '💃 Dance Together', cooldown: 8000, range: 3.0 },
    { id: 'wave', name: '👋 Wave', cooldown: 2000, range: 5.0 },
    { id: 'bow', name: '🙇 Bow', cooldown: 4000, range: 4.0 },
    { id: 'salute', name: '👋 Salute', cooldown: 3000, range: 4.0 }
  ];

  const canInteract = (interactionId: string) => {
    const lastInteraction = interactionCooldown[interactionId] || 0;
    return Date.now() - lastInteraction > 1000; // 1 second minimum cooldown
  };

  const isInRange = (targetAvatar: any, range: number) => {
    if (!currentUserAvatar || !targetAvatar) return false;
    
    const distance = BABYLON.Vector3.Distance(
      currentUserAvatar.position || new BABYLON.Vector3(0, 0, 0),
      targetAvatar.position || new BABYLON.Vector3(0, 0, 0)
    );
    
    return distance <= range;
  };

  const performInteraction = (interactionId: string, targetAvatar: any) => {
    if (!canInteract(interactionId)) {
      console.log('⏰ Interaction on cooldown:', interactionId);
      return;
    }

    const interaction = interactions.find(i => i.id === interactionId);
    if (!interaction) return;

    if (!isInRange(targetAvatar, interaction.range)) {
      console.log('📏 Target too far for interaction:', interactionId);
      return;
    }

    console.log('🎭 Performing interaction:', interactionId, 'with', targetAvatar.username);

    // Update cooldown
    setInteractionCooldown(prev => ({
      ...prev,
      [interactionId]: Date.now()
    }));

    // Add to active interactions
    setActiveInteractions(prev => [...prev, `${interactionId}_${targetAvatar.userId}`]);

    // Send interaction to server
    metaverseService.interact(interactionId);

    // Create visual effects
    createInteractionEffect(interactionId, targetAvatar);

    // Remove from active interactions after animation
    setTimeout(() => {
      setActiveInteractions(prev => 
        prev.filter(id => id !== `${interactionId}_${targetAvatar.userId}`)
      );
    }, 3000);
  };

  const createInteractionEffect = (interactionId: string, targetAvatar: any) => {
    if (!scene || !currentUserAvatar || !targetAvatar) return;

    const midpoint = BABYLON.Vector3.Lerp(
      currentUserAvatar.position || new BABYLON.Vector3(0, 0, 0),
      targetAvatar.position || new BABYLON.Vector3(0, 0, 0),
      0.5
    );

    let effectColor = new BABYLON.Color3(1, 1, 1);

    switch (interactionId) {
      case 'hug':
        effectColor = new BABYLON.Color3(1, 0.4, 0.7); // Pink
        break;
      case 'highfive':
        effectColor = new BABYLON.Color3(1, 1, 0); // Yellow
        break;
      case 'dance':
        effectColor = new BABYLON.Color3(0.5, 0, 1); // Purple
        break;
      case 'wave':
        effectColor = new BABYLON.Color3(0, 0.7, 1); // Blue
        break;
      default:
        effectColor = new BABYLON.Color3(1, 1, 1);
    }

    // Create particle effect
    const particleSystem = new BABYLON.ParticleSystem('interactionParticles', 100, scene);
    particleSystem.particleTexture = new BABYLON.Texture('https://playground.babylonjs.com/textures/flare.png', scene);
    
    particleSystem.minEmitBox = new BABYLON.Vector3(midpoint.x - 0.5, midpoint.y, midpoint.z - 0.5);
    particleSystem.maxEmitBox = new BABYLON.Vector3(midpoint.x + 0.5, midpoint.y + 1, midpoint.z + 0.5);
    
    particleSystem.color1 = effectColor.toColor4();
    particleSystem.color2 = effectColor.scale(0.8).toColor4();
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);
    
    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.3;
    particleSystem.minLifeTime = 1;
    particleSystem.maxLifeTime = 2;
    particleSystem.emitRate = 50;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    particleSystem.gravity = new BABYLON.Vector3(0, 0.5, 0);
    
    particleSystem.start();
    
    // Stop particles after 2 seconds
    setTimeout(() => {
      particleSystem.stop();
    }, 2000);
  };

  const getNearbyAvatars = () => {
    return nearbyAvatars.filter(avatar => 
      avatar.userId !== currentUserId && 
      isInRange(avatar, 5.0) // Show interactions for avatars within 5 units
    );
  };

  const nearbyAvatarsList = getNearbyAvatars();

  if (nearbyAvatarsList.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 bg-white bg-opacity-90 rounded-lg shadow-lg p-4 max-w-sm">
      <h3 className="text-lg font-bold text-gray-800 mb-3">🎭 Avatar Interactions</h3>
      
      {nearbyAvatarsList.map(avatar => (
        <div key={avatar.userId} className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700">{avatar.username}</span>
            <span className="text-xs text-gray-500">
              {Math.round(BABYLON.Vector3.Distance(
                currentUserAvatar?.position || new BABYLON.Vector3(0, 0, 0),
                avatar.position || new BABYLON.Vector3(0, 0, 0)
              ) * 10) / 10}m away
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {interactions.map(interaction => {
              const isActive = activeInteractions.includes(`${interaction.id}_${avatar.userId}`);
              const isInCooldown = !canInteract(interaction.id);
              const isInRangeForInteraction = isInRange(avatar, interaction.range);
              
              return (
                <button
                  key={interaction.id}
                  onClick={() => performInteraction(interaction.id, avatar)}
                  disabled={isActive || isInCooldown || !isInRangeForInteraction}
                  className={`
                    px-3 py-2 text-sm rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-green-500 text-white cursor-not-allowed' 
                      : isInCooldown 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : isInRangeForInteraction
                          ? 'bg-blue-500 hover:bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                  title={
                    isActive ? 'Interaction in progress...' :
                    isInCooldown ? 'On cooldown' :
                    !isInRangeForInteraction ? 'Too far away' :
                    `Perform ${interaction.name}`
                  }
                >
                  {interaction.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AvatarInteractions; 