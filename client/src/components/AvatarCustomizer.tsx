import React, { useState, useEffect } from 'react';
import { useMetaverseStore } from '../stores/useMetaverseStore';
import { metaverseService } from '../lib/metaverseService';

// Enhanced color palette
const colorOptions = [
  '#ffcc99', '#ffe0bd', '#333333', '#3366ff', '#ff69b4', '#00b894', '#fdcb6e', '#d35400', '#6c5ce7', '#00bfff', '#000000', '#ffffff',
  '#8B4513', '#D2691E', '#CD853F', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F', '#F5DEB3', '#FFE4B5', '#FFDAB9', '#FFE4E1', '#FFF0F5'
];

// Enhanced options
const bodyTypes = ['slim', 'average', 'athletic', 'curvy'];
const hairStyles = ['short', 'long', 'curly', 'bald', 'spiky', 'wavy', 'braided', 'mohawk', 'pixie', 'bob', 'ponytail', 'dreadlocks'];
const clothingStyles = ['casual', 'formal', 'sporty', 'fantasy', 'cyberpunk', 'vintage', 'gothic', 'steampunk'];
const clothingTypes = ['shirt', 'dress', 'suit', 'armor', 'robe', 'jacket', 'hoodie', 'uniform'];
const accessories = [
  'none', 'glasses', 'hat', 'headphones', 'backpack', 'cape', 'wings', 'halo', 
  'crown', 'mask', 'scarf', 'necklace', 'earrings', 'bracelet', 'watch', 'belt',
  'tattoo', 'piercing', 'gloves', 'boots', 'shoes', 'socks', 'socks', 'bandana'
];
const emotes = [
  'wave', 'dance', 'sit', 'jump', 'clap', 'bow', 'salute', 'point', 'thumbsup', 
  'peace', 'flex', 'meditate', 'sleep', 'laugh', 'cry', 'angry', 'surprised',
  'wink', 'blowkiss', 'facepalm', 'shrug', 'nod', 'shake', 'yawn', 'sneeze'
];

// Animation presets
const animationPresets = {
  idle: ['relaxed', 'alert', 'casual', 'formal', 'energetic', 'tired'],
  walk: ['normal', 'confident', 'shy', 'proud', 'sneaky', 'march'],
  run: ['normal', 'sprint', 'jog', 'skip', 'gallop', 'dash'],
  jump: ['normal', 'high', 'long', 'bounce', 'flip', 'leap']
};

// Avatar presets
const avatarPresets = [
  {
    name: 'Casual',
    config: {
      bodyColor: '#ffcc99',
      headColor: '#ffe0bd',
      eyeColor: '#333333',
      clothingColor: '#3366ff',
      accessory: 'none',
      hairColor: '#000000',
      hairStyle: 'short',
      bodyType: 'average',
      height: 1.0,
      facialFeatures: { noseType: 'medium', mouthType: 'medium', eyebrowType: 'medium', facialHair: 'none' },
      clothingStyle: 'casual',
      clothingType: 'shirt',
      accessories: [],
      animations: { idle: 'relaxed', walk: 'normal', run: 'normal', jump: 'normal' },
      currentEmote: '',
      emoteHistory: [],
      bodyProportions: { shoulders: 1.0, waist: 1.0, hips: 1.0, arms: 1.0, legs: 1.0 },
      pose: { rotation: 0, tilt: 0, lean: 0 }
    }
  },
  {
    name: 'Fantasy',
    config: {
      bodyColor: '#ffcc99',
      headColor: '#ffe0bd',
      eyeColor: '#6c5ce7',
      clothingColor: '#8B4513',
      accessory: 'crown',
      hairColor: '#FFD700',
      hairStyle: 'long',
      bodyType: 'athletic',
      height: 1.1,
      facialFeatures: { noseType: 'small', mouthType: 'small', eyebrowType: 'thin', facialHair: 'none' },
      clothingStyle: 'fantasy',
      clothingType: 'robe',
      accessories: ['cape', 'wings'],
      animations: { idle: 'alert', walk: 'proud', run: 'gallop', jump: 'high' },
      currentEmote: '',
      emoteHistory: [],
      bodyProportions: { shoulders: 1.1, waist: 0.9, hips: 1.0, arms: 1.1, legs: 1.1 },
      pose: { rotation: 0, tilt: 0, lean: 0 }
    }
  },
  {
    name: 'Cyberpunk',
    config: {
      bodyColor: '#333333',
      headColor: '#ffe0bd',
      eyeColor: '#00bfff',
      clothingColor: '#6c5ce7',
      accessory: 'mask',
      hairColor: '#ff69b4',
      hairStyle: 'spiky',
      bodyType: 'slim',
      height: 0.9,
      facialFeatures: { noseType: 'medium', mouthType: 'medium', eyebrowType: 'thick', facialHair: 'none' },
      clothingStyle: 'cyberpunk',
      clothingType: 'armor',
      accessories: ['headphones', 'backpack'],
      animations: { idle: 'energetic', walk: 'confident', run: 'sprint', jump: 'flip' },
      currentEmote: '',
      emoteHistory: [],
      bodyProportions: { shoulders: 0.9, waist: 0.8, hips: 0.9, arms: 1.0, legs: 1.0 },
      pose: { rotation: 0, tilt: 0, lean: 0 }
    }
  }
];

export const AvatarCustomizer: React.FC = () => {
  const { avatarCustomization, setAvatarCustomization, addAccessory, removeAccessory, setCurrentEmote, updateFacialFeature } = useMetaverseStore();
  const [activeTab, setActiveTab] = useState('basic');
  const [showPresets, setShowPresets] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewRotation, setPreviewRotation] = useState(0);
  const [autoSave, setAutoSave] = useState(true);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave) {
      const timeoutId = setTimeout(() => {
        metaverseService.interact('avatar-update');
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [avatarCustomization, autoSave]);

  const handleChange = (field: string, value: any) => {
    setAvatarCustomization({ ...avatarCustomization, [field]: value });
  };

  const handleAccessoryToggle = (accessory: string) => {
    if (avatarCustomization.accessories.includes(accessory)) {
      removeAccessory(accessory);
    } else {
      addAccessory(accessory);
    }
  };

  const applyPreset = (preset: any) => {
    setAvatarCustomization(preset.config);
    setShowPresets(false);
  };

  const performEmote = (emote: string) => {
    setCurrentEmote(emote);
    metaverseService.interact('emote');
  };

  const updateBodyProportion = (part: string, value: number) => {
    const proportions = avatarCustomization.bodyProportions || { shoulders: 1.0, waist: 1.0, hips: 1.0, arms: 1.0, legs: 1.0 };
    setAvatarCustomization({
      ...avatarCustomization,
      bodyProportions: { ...proportions, [part]: value }
    });
  };

  const updatePose = (axis: string, value: number) => {
    const pose = avatarCustomization.pose || { rotation: 0, tilt: 0, lean: 0 };
    setAvatarCustomization({
      ...avatarCustomization,
      pose: { ...pose, [axis]: value }
    });
  };

  const updateAnimation = (type: string, style: string) => {
    const animations = avatarCustomization.animations || { idle: 'relaxed', walk: 'normal', run: 'normal', jump: 'normal' };
    setAvatarCustomization({
      ...avatarCustomization,
      animations: { ...animations, [type]: style }
    });
  };

  const resetToDefault = () => {
    setAvatarCustomization(avatarPresets[0].config as any);
  };

  const randomizeAvatar = () => {
    const randomConfig = {
      ...avatarCustomization,
      bodyColor: colorOptions[Math.floor(Math.random() * colorOptions.length)],
      headColor: colorOptions[Math.floor(Math.random() * colorOptions.length)],
      eyeColor: colorOptions[Math.floor(Math.random() * colorOptions.length)],
      clothingColor: colorOptions[Math.floor(Math.random() * colorOptions.length)],
      hairColor: colorOptions[Math.floor(Math.random() * colorOptions.length)],
      hairStyle: hairStyles[Math.floor(Math.random() * hairStyles.length)],
      bodyType: bodyTypes[Math.floor(Math.random() * bodyTypes.length)] as 'slim' | 'average' | 'athletic' | 'curvy',
      height: 0.8 + Math.random() * 0.4,
      clothingStyle: clothingStyles[Math.floor(Math.random() * clothingStyles.length)] as any,
      clothingType: clothingTypes[Math.floor(Math.random() * clothingTypes.length)] as any
    };
    setAvatarCustomization(randomConfig);
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Avatar Customizer</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {showPresets ? 'Hide' : 'Show'} Presets
          </button>
          <button
            onClick={randomizeAvatar}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            🎲 Random
          </button>
          <button
            onClick={resetToDefault}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Auto-save toggle */}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="autoSave"
          checked={autoSave}
          onChange={(e) => setAutoSave(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="autoSave" className="text-sm font-medium">
          Auto-save changes
        </label>
      </div>

      {/* Presets Panel */}
      {showPresets && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Quick Presets</h3>
          <div className="flex gap-3 flex-wrap">
            {avatarPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar Preview */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Preview</h3>
          
          {/* Preview Controls */}
          <div className="mb-4 space-y-2">
            <div>
              <label className="block text-sm font-medium mb-1">Rotation</label>
              <input
                type="range"
                min="-180"
                max="180"
                value={previewRotation}
                onChange={(e) => setPreviewRotation(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewRotation(0)}
                className="px-2 py-1 text-xs bg-gray-300 rounded hover:bg-gray-400"
              >
                Front
              </button>
              <button
                onClick={() => setPreviewRotation(90)}
                className="px-2 py-1 text-xs bg-gray-300 rounded hover:bg-gray-400"
              >
                Right
              </button>
              <button
                onClick={() => setPreviewRotation(180)}
                className="px-2 py-1 text-xs bg-gray-300 rounded hover:bg-gray-400"
              >
                Back
              </button>
              <button
                onClick={() => setPreviewRotation(-90)}
                className="px-2 py-1 text-xs bg-gray-300 rounded hover:bg-gray-400"
              >
                Left
              </button>
            </div>
          </div>

          <div className="flex justify-center mb-4">
            <svg 
              width="200" height="300" 
              viewBox="0 0 200 300" 
              className="border rounded-lg bg-white"
              style={{ transform: `rotateY(${previewRotation}deg)` }}
            >
              {/* Enhanced SVG Avatar with more detail */}
              {/* Body */}
              <rect 
                x="60" y="120" 
                width="80" height="120" 
                rx="40" 
                fill={avatarCustomization.bodyColor}
                opacity={avatarCustomization.bodyType === 'slim' ? 0.8 : 1}
                transform={`scale(${(avatarCustomization.bodyProportions?.shoulders || 1.0) * (avatarCustomization.bodyProportions?.waist || 1.0)})`}
              />
              
              {/* Head */}
              <ellipse 
                cx="100" cy="80" 
                rx="35" ry="35" 
                fill={avatarCustomization.headColor}
                transform={`scale(${avatarCustomization.height})`}
              />
              
              {/* Eyes */}
              <ellipse cx="85" cy="80" rx="6" ry="8" fill={avatarCustomization.eyeColor} />
              <ellipse cx="115" cy="80" rx="6" ry="8" fill={avatarCustomization.eyeColor} />
              
              {/* Eyebrows */}
              <path 
                d="M 75 70 Q 85 65 95 70" 
                stroke="#333" 
                strokeWidth="2" 
                fill="none"
                opacity={avatarCustomization.facialFeatures.eyebrowType === 'thick' ? 1 : 0.5}
              />
              <path 
                d="M 105 70 Q 115 65 125 70" 
                stroke="#333" 
                strokeWidth="2" 
                fill="none"
                opacity={avatarCustomization.facialFeatures.eyebrowType === 'thick' ? 1 : 0.5}
              />
              
              {/* Mouth */}
              <ellipse 
                cx="100" cy="95" 
                rx={avatarCustomization.facialFeatures.mouthType === 'large' ? 8 : 5} 
                ry={avatarCustomization.facialFeatures.mouthType === 'large' ? 4 : 2} 
                fill="#333" 
              />
              
              {/* Nose */}
              <ellipse 
                cx="100" cy="85" 
                rx={avatarCustomization.facialFeatures.noseType === 'large' ? 4 : 2} 
                ry={avatarCustomization.facialFeatures.noseType === 'large' ? 6 : 3} 
                fill="#333" 
              />
              
              {/* Facial Hair */}
              {avatarCustomization.facialFeatures.facialHair !== 'none' && (
                <g>
                  {avatarCustomization.facialFeatures.facialHair === 'beard' && (
                    <path d="M 85 95 Q 100 110 115 95" stroke="#333" strokeWidth="3" fill="none" />
                  )}
                  {avatarCustomization.facialFeatures.facialHair === 'mustache' && (
                    <path d="M 90 90 Q 100 85 110 90" stroke="#333" strokeWidth="2" fill="none" />
                  )}
                  {avatarCustomization.facialFeatures.facialHair === 'stubble' && (
                    <circle cx="95" cy="100" r="1" fill="#333" />
                  )}
                </g>
              )}
              
              {/* Hair */}
              {avatarCustomization.hairStyle !== 'bald' && (
                <g>
                  {avatarCustomization.hairStyle === 'long' && (
                    <path d="M 65 45 Q 100 20 135 45 Q 130 80 100 60 Q 70 80 65 45" fill={avatarCustomization.hairColor} />
                  )}
                  {avatarCustomization.hairStyle === 'short' && (
                    <ellipse cx="100" cy="45" rx="40" ry="15" fill={avatarCustomization.hairColor} />
                  )}
                  {avatarCustomization.hairStyle === 'spiky' && (
                    <path d="M 70 45 L 80 25 L 90 45 L 100 20 L 110 45 L 120 25 L 130 45" fill={avatarCustomization.hairColor} />
                  )}
                  {avatarCustomization.hairStyle === 'curly' && (
                    <path d="M 65 45 Q 85 25 105 45 Q 125 25 135 45 Q 115 65 95 45 Q 75 65 65 45" fill={avatarCustomization.hairColor} />
                  )}
                  {avatarCustomization.hairStyle === 'wavy' && (
                    <path d="M 65 45 Q 85 35 105 45 Q 125 35 135 45 Q 115 55 95 45 Q 75 55 65 45" fill={avatarCustomization.hairColor} />
                  )}
                </g>
              )}
              
              {/* Clothing */}
              <rect 
                x="50" y="180" 
                width="100" height="60" 
                rx="20" 
                fill={avatarCustomization.clothingColor}
                opacity={avatarCustomization.clothingStyle === 'formal' ? 0.9 : 1}
              />
              
              {/* Accessories */}
              {avatarCustomization.accessories.includes('glasses') && (
                <g>
                  <ellipse cx="85" cy="80" rx="12" ry="10" fill="none" stroke="#222" strokeWidth="3" />
                  <ellipse cx="115" cy="80" rx="12" ry="10" fill="none" stroke="#222" strokeWidth="3" />
                  <rect x="97" y="80" width="6" height="3" fill="#222" />
                </g>
              )}
              
              {avatarCustomization.accessories.includes('hat') && (
                <ellipse cx="100" cy="30" rx="45" ry="12" fill="#444" />
              )}
              
              {avatarCustomization.accessories.includes('crown') && (
                <g>
                  <path d="M 70 30 L 80 15 L 90 25 L 100 10 L 110 25 L 120 15 L 130 30" fill="#FFD700" />
                  <rect x="70" y="30" width="60" height="5" fill="#FFD700" />
                </g>
              )}
              
              {avatarCustomization.accessories.includes('wings') && (
                <g>
                  <path d="M 20 100 Q 10 80 20 60 Q 30 80 20 100" fill="#fff" opacity="0.8" />
                  <path d="M 180 100 Q 190 80 180 60 Q 170 80 180 100" fill="#fff" opacity="0.8" />
                </g>
              )}
              
              {/* Current Emote Indicator */}
              {avatarCustomization.currentEmote && (
                <text x="100" y="280" textAnchor="middle" fill="#333" fontSize="12">
                  {avatarCustomization.currentEmote}
                </text>
              )}
            </svg>
          </div>
          
          {/* Emote Controls */}
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Quick Emotes</h4>
            <div className="flex flex-wrap gap-2">
              {emotes.slice(0, 8).map(emote => (
                <button
                  key={emote}
                  onClick={() => performEmote(emote)}
                  className={`px-3 py-1 text-sm rounded ${
                    avatarCustomization.currentEmote === emote 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {emote}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Customization Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="flex border-b overflow-x-auto">
            {['basic', 'body', 'face', 'clothing', 'accessories', 'animations', 'pose'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium capitalize whitespace-nowrap ${
                  activeTab === tab 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Basic Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-2">Body Type</label>
                <select
                  className="w-full border rounded p-2"
                  value={avatarCustomization.bodyType}
                  onChange={e => handleChange('bodyType', e.target.value)}
                >
                  {bodyTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block font-semibold mb-2">Height</label>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.1"
                  value={avatarCustomization.height}
                  onChange={e => handleChange('height', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 mt-1">
                  Scale: {avatarCustomization.height}
                </div>
              </div>
            </div>
          )}

          {/* Body Tab */}
          {activeTab === 'body' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-2">Body Color</label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        avatarCustomization.bodyColor === color ? 'border-blue-500' : 'border-gray-300'
                      }`}
                      style={{ background: color }}
                      onClick={() => handleChange('bodyColor', color)}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block font-semibold mb-2">Head Color</label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        avatarCustomization.headColor === color ? 'border-blue-500' : 'border-gray-300'
                      }`}
                      style={{ background: color }}
                      onClick={() => handleChange('headColor', color)}
                    />
                  ))}
                </div>
              </div>

              {showAdvanced && (
                <div>
                  <label className="block font-semibold mb-2">Body Proportions</label>
                  <div className="space-y-3">
                    {['shoulders', 'waist', 'hips', 'arms', 'legs'].map(part => (
                      <div key={part}>
                        <label className="block text-sm capitalize mb-1">{part}</label>
                        <input
                          type="range"
                          min="0.7"
                          max="1.3"
                          step="0.1"
                          value={avatarCustomization.bodyProportions?.[part as keyof typeof avatarCustomization.bodyProportions] || 1.0}
                          onChange={e => updateBodyProportion(part, parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-600">
                          {(avatarCustomization.bodyProportions?.[part as keyof typeof avatarCustomization.bodyProportions] || 1.0).toFixed(1)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Face Tab */}
          {activeTab === 'face' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-2">Eye Color</label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        avatarCustomization.eyeColor === color ? 'border-blue-500' : 'border-gray-300'
                      }`}
                      style={{ background: color }}
                      onClick={() => handleChange('eyeColor', color)}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block font-semibold mb-2">Hair Style</label>
                <select
                  className="w-full border rounded p-2"
                  value={avatarCustomization.hairStyle}
                  onChange={e => handleChange('hairStyle', e.target.value)}
                >
                  {hairStyles.map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block font-semibold mb-2">Hair Color</label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        avatarCustomization.hairColor === color ? 'border-blue-500' : 'border-gray-300'
                      }`}
                      style={{ background: color }}
                      onClick={() => handleChange('hairColor', color)}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block font-semibold mb-2">Facial Features</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Nose</label>
                    <select
                      className="w-full border rounded p-1 text-sm"
                      value={avatarCustomization.facialFeatures.noseType}
                      onChange={e => updateFacialFeature('noseType', e.target.value)}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Mouth</label>
                    <select
                      className="w-full border rounded p-1 text-sm"
                      value={avatarCustomization.facialFeatures.mouthType}
                      onChange={e => updateFacialFeature('mouthType', e.target.value)}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Eyebrows</label>
                    <select
                      className="w-full border rounded p-1 text-sm"
                      value={avatarCustomization.facialFeatures.eyebrowType}
                      onChange={e => updateFacialFeature('eyebrowType', e.target.value)}
                    >
                      <option value="thin">Thin</option>
                      <option value="medium">Medium</option>
                      <option value="thick">Thick</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Facial Hair</label>
                    <select
                      className="w-full border rounded p-1 text-sm"
                      value={avatarCustomization.facialFeatures.facialHair}
                      onChange={e => updateFacialFeature('facialHair', e.target.value)}
                    >
                      <option value="none">None</option>
                      <option value="stubble">Stubble</option>
                      <option value="mustache">Mustache</option>
                      <option value="beard">Beard</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clothing Tab */}
          {activeTab === 'clothing' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-2">Clothing Style</label>
                <select
                  className="w-full border rounded p-2"
                  value={avatarCustomization.clothingStyle}
                  onChange={e => handleChange('clothingStyle', e.target.value)}
                >
                  {clothingStyles.map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block font-semibold mb-2">Clothing Type</label>
                <select
                  className="w-full border rounded p-2"
                  value={avatarCustomization.clothingType}
                  onChange={e => handleChange('clothingType', e.target.value)}
                >
                  {clothingTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block font-semibold mb-2">Clothing Color</label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        avatarCustomization.clothingColor === color ? 'border-blue-500' : 'border-gray-300'
                      }`}
                      style={{ background: color }}
                      onClick={() => handleChange('clothingColor', color)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Accessories Tab */}
          {activeTab === 'accessories' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-2">Accessories</label>
                <div className="grid grid-cols-3 gap-2">
                  {accessories.map(accessory => (
                    <button
                      key={accessory}
                      onClick={() => handleAccessoryToggle(accessory)}
                      className={`p-2 text-sm rounded border ${
                        avatarCustomization.accessories.includes(accessory)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {accessory}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block font-semibold mb-2">All Emotes</label>
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                  {emotes.map(emote => (
                    <button
                      key={emote}
                      onClick={() => performEmote(emote)}
                      className={`p-2 text-xs rounded border ${
                        avatarCustomization.currentEmote === emote
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {emote}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Animations Tab */}
          {activeTab === 'animations' && (
            <div className="space-y-4">
              {Object.entries(animationPresets).map(([type, styles]) => (
                <div key={type}>
                  <label className="block font-semibold mb-2 capitalize">{type} Animation</label>
                  <select
                    className="w-full border rounded p-2"
                    value={avatarCustomization.animations?.[type as keyof typeof avatarCustomization.animations] || 'normal'}
                    onChange={e => updateAnimation(type, e.target.value)}
                  >
                    {styles.map(style => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Pose Tab */}
          {activeTab === 'pose' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-2">Body Rotation</label>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  value={avatarCustomization.pose?.rotation || 0}
                  onChange={e => updatePose('rotation', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 mt-1">
                  Rotation: {avatarCustomization.pose?.rotation || 0}°
                </div>
              </div>
              
              <div>
                <label className="block font-semibold mb-2">Head Tilt</label>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={avatarCustomization.pose?.tilt || 0}
                  onChange={e => updatePose('tilt', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 mt-1">
                  Tilt: {avatarCustomization.pose?.tilt || 0}°
                </div>
              </div>
              
              <div>
                <label className="block font-semibold mb-2">Body Lean</label>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={avatarCustomization.pose?.lean || 0}
                  onChange={e => updatePose('lean', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 mt-1">
                  Lean: {avatarCustomization.pose?.lean || 0}°
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 